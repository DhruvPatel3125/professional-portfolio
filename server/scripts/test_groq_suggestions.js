import { generateChatCompletion } from '../services/groqService.js';
import Groq from 'groq-sdk';
import { config } from '../config/env.js';

// Initialize Groq client
const groq = new Groq({
  apiKey: config.GROQ_API_KEY
});

async function testSuggestions(userMessage, botReply) {
  try {
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

    console.log(`[Test] Generating suggestions for:\nUser: "${userMessage}"\nBot: "${botReply}"\n`);
    
    const startTime = Date.now();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User message: "${userMessage}"\nChatbot reply: "${botReply}"` }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });

    const duration = Date.now() - startTime;
    console.log(`[Test] Completed in ${duration}ms.`);
    
    const content = chatCompletion.choices[0]?.message?.content;
    console.log('Raw output:', content);
    
    const parsed = JSON.parse(content);
    console.log('Parsed suggestions:', parsed.suggestions);
  } catch (err) {
    console.error('Error in test:', err);
  }
}

async function run() {
  // Test case 1: Successful answer about React
  await testSuggestions(
    "What is Dhruv's experience with React?",
    "Dhruv has extensive experience with the React.js ecosystem, including state management libraries like Redux Toolkit, Context API, and Redux Saga. He has used React to build responsive front-ends, such as the staylix dashboard, implementing dynamic data visualization and real-time updates."
  );

  console.log('\n-----------------------------------------\n');

  // Test case 2: Unsuccessful answer (out of scope)
  await testSuggestions(
    "How do I bake a cake?",
    "I don't have information about that."
  );
}

run();
