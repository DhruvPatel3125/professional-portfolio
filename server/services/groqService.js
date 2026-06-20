import Groq from 'groq-sdk';
import { config } from '../config/env.js';

let groqClient = null;

// The base system prompt that guides the persona and sets strict constraints on responses
const getSystemPrompt = (context) => `You are Dhruv Patel's AI Portfolio Assistant, representing Dhruv Patel (Junior Full-Stack Developer & AI Engineer).
Your goal is to answer questions from recruiters, HRs, or collaborators professionally and confidently based ONLY on the portfolio knowledge base provided below.

=== PORTFOLIO KNOWLEDGE BASE ===
${context}
================================

STRICT CONSTRAINTS & RULES:
1. **No Hallucinations**: You must only answer questions using the information directly available in the knowledge base above.
2. **Missing Information**: If the user asks for information that is NOT present in the knowledge base, you MUST respond exactly: "I don't have information about that." Do not attempt to synthesize, extrapolate, or guess answers if they are not in the context.
3. **Out-of-Scope**: If the user asks non-portfolio related questions (e.g. general knowledge, writing code, cooking, math, trivia), you must refuse to answer and state: "I don't have information about that."
4. **Persona**: Be polite, professional, developer-centric, and clear.
5. **Formatting**:
   - Return clear, easy-to-read replies.
   - Use bold text, bullet points, and numbered lists where appropriate.
   - Mention that they can download Dhruv's resume at "/resume/DhruvPatel_Resume.pdf" if they ask about downloading his CV or Resume.
   - Provide his email (dhruvjpatel5@gmail.com) if they ask how to contact him.
   - Keep answers concise and to the point (maximum 2-3 paragraphs or a clean bulleted list).
`;

/**
 * Gets or initializes the Groq client instance.
 * @returns {Groq} Groq client
 */
function getGroqClient() {
  if (groqClient) return groqClient;
  
  if (!config.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in the server environment (.env).');
  }

  groqClient = new Groq({
    apiKey: config.GROQ_API_KEY
  });
  
  return groqClient;
}

/**
 * Generates chat completion using Groq LLM.
 * @param {string} userMessage - The new user input
 * @param {Array} history - Array of previous chat messages [{ role: 'user'|'bot', content: string }]
 * @param {string} context - The structured portfolio context compiled from JSON files
 * @returns {Promise<string>} The generated chatbot response
 */
export async function generateChatCompletion(userMessage, history = [], context) {
  try {
    const client = getGroqClient();

    // 1. Prepare system instruction
    const systemPrompt = getSystemPrompt(context);

    // 2. Format history into message payload expected by OpenAI/Groq API (roles: system, user, assistant)
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Append history items. Ensure roles map correctly ('bot' or 'assistant' to 'assistant')
    history.forEach(msg => {
      const role = msg.role === 'bot' || msg.role === 'assistant' ? 'assistant' : 'user';
      messages.push({
        role,
        content: msg.content
      });
    });

    // Append the latest user query
    messages.push({
      role: 'user',
      content: userMessage
    });

    // 3. Make API request to Groq Cloud
    // Using llama-3.1-8b-instant for fast responses and much higher rate limits on the free tier
    const chatCompletion = await client.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.2, // Low temperature to minimize creative liberties and stick to context
      max_tokens: 800,
      top_p: 1,
      stream: false
    });

    const reply = chatCompletion.choices[0]?.message?.content;
    
    if (!reply) {
      throw new Error('Received an empty response from Groq completions.');
    }

    return reply.trim();

  } catch (error) {
    console.error('[GroqService] Completion API Error:', error.message || error);
    throw error;
  }
}

/**
 * Generates dynamic, context-aware follow-up suggestion questions.
 * @param {string} userMessage - The latest message from the user
 * @param {string} botReply - The generated chatbot response
 * @returns {Promise<Array<string>>} List of exactly 3 suggested follow-up questions
 */
export async function generateFollowUpSuggestions(userMessage, botReply) {
  try {
    const client = getGroqClient();

    const systemPrompt = `You are a helpful assistant for Dhruv Patel's developer portfolio.
Based on the user's message and the chatbot's response, generate exactly 3 brief, professional, and contextually relevant follow-up questions that a recruiter or visitor might want to ask next.
Keep suggestions short (typically 4 to 8 words).
Ensure suggestions directly relate to Dhruv Patel's skills, experience, or projects.

If the chatbot's response indicates it doesn't have information or is out of scope (e.g. "I don't have information about that"), suggest general questions about Dhruv's skills, projects, and contact info.

You MUST respond with a JSON object containing a "suggestions" array with exactly 3 strings.
Example:
{
  "suggestions": [
    "What projects did he build?",
    "Tell me about his React skills",
    "How can I contact him?"
  ]
}
`;

    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User message: "${userMessage}"\nChatbot reply: "${botReply}"` }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Received empty suggestion payload from Groq.');
    }

    const parsed = JSON.parse(content);
    if (!parsed || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid JSON format or missing suggestions field.');
    }

    return parsed.suggestions.filter(s => typeof s === 'string' && s.trim().length > 0).slice(0, 3);
  } catch (error) {
    console.error('[GroqService] Suggestions generation error:', error.message || error);
    throw error;
  }
}
