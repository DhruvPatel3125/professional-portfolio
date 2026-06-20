import { searchContext } from '../services/vectorSearch.js';
import { generateChatCompletion } from '../services/groqService.js';
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import { getIpLocation } from '../services/geoService.js';

/**
 * Controller to handle chatbot questions.
 * POST /api/chat
 */
export async function handleChat(req, res) {
  try {
    const { message, history, sessionId, deviceMeta } = req.body;

    // 1. Validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message must be a non-empty string.' });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({ error: 'Message exceeds the maximum length of 500 characters.' });
    }

    const cleanedMessage = message.trim();
    const chatHistory = Array.isArray(history) ? history : [];
    
    // Ensure we have a fallback session ID if client didn't supply one
    const activeSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    console.log(`[ChatController] Processing message for session ${activeSessionId}: "${cleanedMessage.substring(0, 50)}..."`);
    const startTime = Date.now();

    // 2. Fetch context and generate reply from Groq via Vector Search
    const context = await searchContext(cleanedMessage, 5);
    const reply = await generateChatCompletion(cleanedMessage, chatHistory, context);

    const duration = Date.now() - startTime;
    console.log(`[ChatController] Completed chat completion in ${duration}ms.`);

    // 3. Generate suggestion chips based on the output to support frontend UI
    const suggestions = generateSuggestions(reply);

    // 4. Save to Database asynchronously (non-blocking for high scalability)
    const rawIp = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : (req.socket.remoteAddress || req.ip);

    logChatBackground(activeSessionId, cleanedMessage, reply, rawIp, deviceMeta).catch(err => {
      console.error('[ChatController] Error in logChatBackground promise chain:', err);
    });

    // 5. Return successful response
    return res.json({
      reply,
      suggestions,
      sessionId: activeSessionId
    });

  } catch (error) {

    console.error('[ChatController] Error processing request:', error);
    
    // Provide clean user-facing errors
    const errorMessage = error.message || '';
    if (errorMessage.includes('apiKey') || errorMessage.includes('GROQ_API_KEY')) {
      return res.status(500).json({
        error: 'Backend is misconfigured. Groq API Key is missing.',
        reply: 'Oops! The AI backend seems to be missing its API key configuration. Please set GROQ_API_KEY in the server .env file.'
      });
    }

    return res.status(500).json({
      error: 'Failed to process chat message.',
      reply: 'Sorry, I encountered an internal server error while preparing your response. Please try again in a few seconds.'
    });
  }
}

/**
 * Helper to dynamically extract user suggestion chips based on response text content
 * @param {string} reply - LLM generated reply
 * @returns {Array<string>} List of suggestion strings
 */
function generateSuggestions(reply) {
  const replyLower = reply.toLowerCase();
  const suggestions = [];

  // Generate context-rich follow ups
  if (replyLower.includes("don't have information about that") || replyLower.includes("no information")) {
    suggestions.push("What projects has Dhruv built?", "What are Dhruv's skills?", "How can I contact Dhruv?");
  } else if (replyLower.includes("project") || replyLower.includes("staylix") || replyLower.includes("syshop")) {
    suggestions.push("Tell me about his work experience", "What is his core tech stack?", "Can I download his CV?");
  } else if (replyLower.includes("skill") || replyLower.includes("frontend") || replyLower.includes("backend")) {
    suggestions.push("Tell me about Staylix project", "What did he study?", "How can I contact him?");
  } else if (replyLower.includes("experience") || replyLower.includes("planicsdev") || replyLower.includes("webito")) {
    suggestions.push("What side projects did he build?", "Where did he study?", "How to email him?");
  } else {
    // Standard default suggestions
    suggestions.push("What are his skills?", "Tell me about his projects", "How to reach him?");
  }

  // Deduplicate and return max 3 suggestions
  return [...new Set(suggestions)].slice(0, 3);
}

/**
 * Helper to log chat messages and session updates asynchronously in the background.
 */
async function logChatBackground(activeSessionId, userMessage, botReply, rawIp, deviceMeta) {
  try {
    const userMsg = new ChatMessage({
      sessionId: activeSessionId,
      role: 'user',
      content: userMessage
    });

    const botMsg = new ChatMessage({
      sessionId: activeSessionId,
      role: 'bot',
      content: botReply
    });

    // Geolocation API check with caching inside geoService
    const location = await getIpLocation(rawIp);

    await Promise.all([
      userMsg.save(),
      botMsg.save(),
      ChatSession.findOneAndUpdate(
        { sessionId: activeSessionId },
        {
          $setOnInsert: {
            sessionId: activeSessionId,
            ipAddress: rawIp,
            device: deviceMeta?.device || 'Desktop',
            browser: deviceMeta?.browser || 'Unknown',
            os: deviceMeta?.os || 'Unknown',
            location: location || 'Unknown Location',
            screenResolution: deviceMeta?.screenResolution || 'Unknown',
            locale: deviceMeta?.locale || 'Unknown',
            referrer: deviceMeta?.referrer || 'Unknown',
            currentPage: deviceMeta?.currentPage || 'Unknown',
            userAgent: deviceMeta?.userAgent || 'Unknown',
            createdAt: new Date()
          },
          $set: {
            lastActivityAt: new Date()
          }
        },
        { upsert: true, new: true }
      )
    ]);
  } catch (dbError) {
    console.error('[ChatController] Background chat storage failed:', dbError.message || dbError);
  }
}

/**
 * Controller to track chatbot session engagement (clicks on resume, projects, socials).
 * POST /api/chat/track
 */
export async function trackSessionEngagement(req, res) {
  try {
    const { sessionId, action } = req.body;

    if (!sessionId || !action) {
      return res.status(400).json({ error: 'Session ID and action are required.' });
    }

    const validActions = ['resume', 'project', 'github', 'linkedin'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action type. Must be one of: ${validActions.join(', ')}` });
    }

    const fieldMap = {
      resume: 'resumeDownloads',
      project: 'projectClicks',
      github: 'githubClicks',
      linkedin: 'linkedinClicks'
    };

    const updateField = fieldMap[action];

    // Find and update the session atomically by incrementing the click counter
    await ChatSession.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { [updateField]: 1 },
        $set: { lastActivityAt: new Date() }
      },
      { upsert: false }
    );

    return res.json({ success: true });

  } catch (error) {
    console.error('[ChatController] Error tracking session engagement:', error);
    return res.status(500).json({ error: 'Failed to record engagement metrics.' });
  }
}
