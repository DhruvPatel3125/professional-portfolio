import Knowledge from '../models/Knowledge.js';
import { getEmbedding } from '../services/embeddingService.js';
import { PDFParse } from 'pdf-parse';

/**
 * Helper to split a large text document into smaller semantic chunks.
 * Attempts to preserve paragraph integrity, falling back to sliding window slicing when necessary.
 * @param {string} text - Raw document content.
 * @param {number} maxChunkSize - Maximum character length of each chunk.
 * @param {number} overlap - Overlapping character count between consecutive chunks.
 * @returns {Array<string>} List of text chunks.
 */
function chunkText(text, maxChunkSize = 400, overlap = 50) {
  if (!text || typeof text !== 'string') return [];
  
  // Split content by paragraphs first
  const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let currentChunk = '';
  
  for (const para of paragraphs) {
    // If the paragraph fits in the current chunk, append it
    if ((currentChunk + '\n' + para).length <= maxChunkSize) {
      currentChunk = currentChunk ? currentChunk + '\n' + para : para;
    } else {
      // Save current accumulated chunk
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // If the individual paragraph exceeds the max chunk size, slice it dynamically
      if (para.length > maxChunkSize) {
        let remaining = para;
        while (remaining.length > 0) {
          const sliceEnd = Math.min(maxChunkSize, remaining.length);
          const chunkSlice = remaining.substring(0, sliceEnd);
          chunks.push(chunkSlice);
          
          if (remaining.length <= maxChunkSize) {
            break;
          }
          // Move forward keeping the specified overlap
          remaining = remaining.substring(maxChunkSize - overlap);
        }
        currentChunk = '';
      } else {
        currentChunk = para;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * GET /api/admin/documents
 * Aggregates knowledge database by sourceDocument to return document titles and chunk counts.
 */
export async function getDocuments(req, res) {
  try {
    const docs = await Knowledge.aggregate([
      {
        $group: {
          _id: '$sourceDocument',
          chunkCount: { $sum: 1 },
          category: { $first: '$category' }
        }
      },
      {
        $project: {
          _id: 0,
          title: '$_id',
          chunkCount: 1,
          category: 1
        }
      },
      { $sort: { title: 1 } }
    ]);
    
    return res.json({ success: true, documents: docs });
  } catch (error) {
    console.error('[RagController] Error fetching RAG documents:', error);
    return res.status(500).json({ error: 'Failed to retrieve knowledge documents.' });
  }
}

/**
 * POST /api/admin/documents
 * Creates a new document by chunking the text, generating embeddings, and storing them.
 */
export async function addDocument(req, res) {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Document title is required.' });
    }
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Document content is required.' });
    }
    
    const cleanedTitle = title.trim();
    if (cleanedTitle === 'Static Portfolio') {
      return res.status(400).json({ error: 'Cannot overwrite default portfolio data.' });
    }
    
    console.log(`[RagController] Processing document "${cleanedTitle}"...`);
    
    // Chunk the text document
    const chunks = chunkText(content.trim());
    console.log(`[RagController] Split "${cleanedTitle}" into ${chunks.length} chunks.`);
    
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Failed to extract text chunks from content.' });
    }
    
    // Clean up old version of this document if it exists
    await Knowledge.deleteMany({ sourceDocument: cleanedTitle });
    
    // Compute embeddings and save each chunk sequentially to avoid rate limits
    for (let i = 0; i < chunks.length; i++) {
      const chunkTextContent = chunks[i];
      const embedding = await getEmbedding(chunkTextContent);
      
      const knowledgeDoc = new Knowledge({
        text: chunkTextContent,
        embedding: embedding,
        category: category || 'General',
        sourceDocument: cleanedTitle
      });
      
      await knowledgeDoc.save();
    }
    
    console.log(`[RagController] Successfully embedded and saved "${cleanedTitle}".`);
    return res.json({ success: true, chunksCreated: chunks.length });
    
  } catch (error) {
    console.error('[RagController] Error saving RAG document:', error);
    return res.status(500).json({ error: `Failed to index document: ${error.message}` });
  }
}

/**
 * DELETE /api/admin/documents/:title
 * Deletes all chunks associated with the specified document title.
 */
export async function deleteDocument(req, res) {
  try {
    const { title } = req.params;
    
    if (!title) {
      return res.status(400).json({ error: 'Document title parameter is required.' });
    }
    
    const decodedTitle = decodeURIComponent(title);
    
    if (decodedTitle === 'Static Portfolio') {
      return res.status(400).json({ error: 'Cannot delete core portfolio data.' });
    }
    
    console.log(`[RagController] Purging document chunks for "${decodedTitle}"...`);
    const result = await Knowledge.deleteMany({ sourceDocument: decodedTitle });
    
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('[RagController] Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to purge document records.' });
  }
}

/**
 * POST /api/admin/documents/upload
 * Handles PDF and TXT file uploads, parses their text content, chunks, and embeds them.
 */
export async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    const { category } = req.body;
    const originalName = req.file.originalname;
    const extension = originalName.split('.').pop().toLowerCase();
    const title = originalName.replace(/\.[^/.]+$/, ""); // strip extension for default title
    
    if (title === 'Static Portfolio') {
      return res.status(400).json({ error: 'Cannot overwrite default portfolio data.' });
    }
    
    let textContent = '';
    
    if (extension === 'pdf') {
      console.log(`[RagController] Parsing PDF document: "${originalName}"...`);
      const parser = new PDFParse({ data: req.file.buffer });
      const parsedPdf = await parser.getText();
      textContent = parsedPdf.text;
      await parser.destroy();
    } else if (extension === 'txt') {
      console.log(`[RagController] Parsing TXT document: "${originalName}"...`);
      textContent = req.file.buffer.toString('utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Only .pdf and .txt are supported.' });
    }
    
    if (!textContent || !textContent.trim()) {
      return res.status(400).json({ error: 'The uploaded file does not contain any copyable text.' });
    }
    
    console.log(`[RagController] Chunking document text for "${title}"...`);
    const chunks = chunkText(textContent.trim());
    console.log(`[RagController] Split "${title}" into ${chunks.length} chunks.`);
    
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Failed to extract text chunks from uploaded file.' });
    }
    
    // Clean up old version matching this title
    await Knowledge.deleteMany({ sourceDocument: title });
    
    // Embed sequentially
    for (let i = 0; i < chunks.length; i++) {
      const chunkTextContent = chunks[i];
      const embedding = await getEmbedding(chunkTextContent);
      
      const knowledgeDoc = new Knowledge({
        text: chunkTextContent,
        embedding: embedding,
        category: category || 'General',
        sourceDocument: title
      });
      
      await knowledgeDoc.save();
    }
    
    console.log(`[RagController] Successfully embedded and saved file document "${title}".`);
    return res.json({ success: true, title, chunksCreated: chunks.length });
    
  } catch (error) {
    console.error('[RagController] Error uploading and parsing document:', error);
    return res.status(500).json({ error: `Failed to process document file: ${error.message}` });
  }
}
