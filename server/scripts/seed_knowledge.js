import mongoose from 'mongoose';
import '../config/env.js';
import { connectDB } from '../config/db.js';
import { getFormattedKnowledge } from '../services/knowledgeLoader.js';
import { getEmbedding } from '../services/embeddingService.js';
import Knowledge from '../models/Knowledge.js';

/**
 * Chunks a markdown string by headings to keep related info grouped together.
 */
function chunkMarkdown(markdownText) {
  const lines = markdownText.split('\n');
  const chunks = [];
  let currentChunk = '';
  let currentCategory = 'General';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // Save previous chunk
      if (currentChunk.trim()) {
        chunks.push({ text: currentChunk.trim(), category: currentCategory });
      }
      currentCategory = line.substring(3).trim();
      currentChunk = line + '\n';
    } else if (line.startsWith('### ')) {
      // Save previous chunk
      if (currentChunk.trim()) {
        chunks.push({ text: currentChunk.trim(), category: currentCategory });
      }
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push({ text: currentChunk.trim(), category: currentCategory });
  }

  return chunks;
}

async function seed() {
  try {
    await connectDB();

    console.log('\n[Seeder] Compiling portfolio markdown knowledge base...');
    const fullMarkdown = getFormattedKnowledge();
    
    console.log('[Seeder] Chunking markdown content...');
    const chunks = chunkMarkdown(fullMarkdown);
    console.log(`[Seeder] Created ${chunks.length} logical chunks to embed.`);

    // Clear old knowledge entries before seeding
    console.log('[Seeder] Clearing existing knowledge records from database...');
    await Knowledge.deleteMany({});

    console.log('[Seeder] Generating embeddings and saving chunks (this may take a moment)...');
    
    // We process sequentially to avoid API rate limits and overload
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[Seeder] [${i + 1}/${chunks.length}] Embedding chunk: "${chunk.text.split('\n')[0]}..."`);
      
      const embedding = await getEmbedding(chunk.text);
      
      const knowledgeDoc = new Knowledge({
        text: chunk.text,
        embedding: embedding,
        category: chunk.category
      });

      await knowledgeDoc.save();
    }

    console.log('\n[Seeder] Knowledge database seeded successfully with Vector Embeddings!');
  } catch (error) {
    console.error('[Seeder] Seeding failed with error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[Seeder] Disconnected from database.');
  }
}

seed().catch(console.error);
