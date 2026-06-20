import Knowledge from '../models/Knowledge.js';
import { getEmbedding } from './embeddingService.js';

/**
 * Searches the Knowledge collection in MongoDB Atlas using Vector Search.
 * Returns the matching text blocks concatenated as a context string.
 * @param {string} queryText - The visitor's message query.
 * @param {number} [limit=4] - The maximum number of relevant documents to retrieve.
 * @returns {Promise<string>} Concentated string of matching knowledge passages.
 */
export async function searchContext(queryText, limit = 4) {
  try {
    if (!queryText || !queryText.trim()) {
      return '';
    }

    // 1. Generate embedding vector for the visitor's search query
    const queryVector = await getEmbedding(queryText);

    // 2. Perform Mongoose aggregation query using MongoDB Atlas Vector Search
    const results = await Knowledge.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index', // Must match the index name on MongoDB Atlas
          path: 'embedding',     // The field containing the vectors
          queryVector: queryVector,
          numCandidates: 100,    // Number of candidates to consider
          limit: limit
        }
      }
    ]);

    if (!results || results.length === 0) {
      console.log(`[VectorSearch] No matches found for query: "${queryText.substring(0, 30)}..."`);
      return '';
    }

    console.log(`[VectorSearch] Retrieved ${results.length} relevant context chunks for query: "${queryText.substring(0, 30)}..."`);
    
    // 3. Format and join the text contents of the matches
    return results.map(doc => doc.text).join('\n\n');

  } catch (error) {
    console.error('[VectorSearch] Vector search failed:', error.message || error);
    // Fall back to empty context so the LLM still tries to answer with its base knowledge
    return '';
  }
}
