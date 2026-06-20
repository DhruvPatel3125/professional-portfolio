import { config } from '../config/env.js';

let localPipeline = null;

/**
 * Generates a 384-dimensional vector embedding for the given text.
 * Uses Hugging Face Serverless API if key is available, or runs locally via @xenova/transformers.
 * @param {string} text - The input text chunk to embed.
 * @returns {Promise<Array<number>>} The computed vector array.
 */
export async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Input text must be a non-empty string.');
  }

  const cleanedText = text.trim().replace(/\n/g, ' ');

  // 1. Try Hugging Face Inference API if API Key is configured
  const apiKey = process.env.HUGGINGFACE_API_KEY || config.HUGGINGFACE_API_KEY;
  if (apiKey && apiKey !== 'your_huggingface_api_key_here') {
    try {
      return await getApiEmbedding(cleanedText, apiKey);
    } catch (apiError) {
      console.warn('[EmbeddingService] Hugging Face API call failed, falling back to local model:', apiError.message || apiError);
    }
  }

  // 2. Fallback to local model computation
  return await getLocalEmbedding(cleanedText);
}

/**
 * Calls Hugging Face Serverless API for feature-extraction.
 */
async function getApiEmbedding(text, apiKey) {
  const model = 'sentence-transformers/all-MiniLM-L6-v2';
  const url = `https://router.huggingface.co/hf-inference/models/${model}/pipeline/feature-extraction`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: text })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.error && errorData.error.includes('loading')) {
      // Model is currently loading, wait a bit or throw so fallback catches it
      throw new Error(`Model is loading on HF servers: ${errorData.error}`);
    }
    throw new Error(`HF API responded with status ${response.status}: ${errorData.error || response.statusText}`);
  }

  const result = await response.json();
  if (Array.isArray(result)) {
    return result;
  }
  
  throw new Error('Unexpected API response format from Hugging Face.');
}

/**
 * Computes embeddings locally using @xenova/transformers.
 */
async function getLocalEmbedding(text) {
  try {
    if (!localPipeline) {
      console.log('[EmbeddingService] Initializing local sentence-transformers model (Xenova/all-MiniLM-L6-v2)...');
      const { pipeline } = await import('@xenova/transformers');
      // Load model for feature-extraction pipeline (mean pooling, normalized)
      localPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('[EmbeddingService] Local model loaded successfully.');
    }

    const output = await localPipeline(text, { pooling: 'mean', normalize: true });
    // Convert Float32Array to standard JS Array of numbers
    return Array.from(output.data);
  } catch (error) {
    console.error('[EmbeddingService] Local embedding generation failed:', error);
    throw new Error(`Embedding computation failed: ${error.message}`);
  }
}
