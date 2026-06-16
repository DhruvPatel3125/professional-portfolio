import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { clearKnowledgeCache } from '../services/knowledgeLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

// Helper to map type parameter to the correct file path
function getFilePath(type) {
  switch (type) {
    case 'projects':
      return path.join(DATA_DIR, 'project.json');
    case 'skills':
      return path.join(DATA_DIR, 'skills.json');
    case 'history':
      return path.join(DATA_DIR, 'history.json');
    case 'about':
      return path.join(DATA_DIR, 'additional.json');
    default:
      return null;
  }
}

/**
 * GET /api/portfolio/:type
 * Retrieve raw portfolio data of a specific type.
 */
export async function getPortfolioData(req, res) {
  try {
    const { type } = req.params;
    const filePath = getFilePath(type);

    if (!filePath) {
      return res.status(400).json({ error: `Invalid portfolio section type: '${type}'` });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Portfolio file for '${type}' not found.` });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    return res.json(data);
  } catch (error) {
    console.error(`[PortfolioController] Error loading data for type '${req.params.type}':`, error);
    return res.status(500).json({ error: 'Failed to retrieve portfolio data.' });
  }
}

/**
 * POST /api/portfolio/:type
 * Update portfolio data of a specific type.
 * Requires admin authentication (handled by requireAdmin middleware).
 */
export async function updatePortfolioData(req, res) {
  try {
    const { type } = req.params;
    const filePath = getFilePath(type);
    const newData = req.body;

    if (!filePath) {
      return res.status(400).json({ error: `Invalid portfolio section type: '${type}'` });
    }

    if (!newData) {
      return res.status(400).json({ error: 'Request body cannot be empty.' });
    }

    // Basic structure check: must be a valid array or object based on target
    if (type === 'about') {
      if (typeof newData !== 'object' || Array.isArray(newData)) {
        return res.status(400).json({ error: 'About data must be a JSON object.' });
      }
    } else {
      if (!Array.isArray(newData)) {
        return res.status(400).json({ error: `Portfolio data for '${type}' must be a JSON array.` });
      }
    }

    // Write contents to the server's local JSON file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');

    // Reset Chatbot's compiled context cache so it picks up the updates immediately
    clearKnowledgeCache();

    console.log(`[PortfolioController] Updated '${type}' database and cleared chatbot cache.`);
    return res.json({ success: true, message: `Portfolio section '${type}' updated and cached successfully.` });
  } catch (error) {
    console.error(`[PortfolioController] Error updating data for type '${req.params.type}':`, error);
    return res.status(500).json({ error: 'Failed to save portfolio data changes.' });
  }
}
