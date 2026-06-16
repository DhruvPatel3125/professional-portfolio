import express from 'express';
import { requireAdmin } from '../middlewares/authMiddleware.js';
import { getPortfolioData, updatePortfolioData } from '../controllers/portfolioController.js';

const router = express.Router();

// GET /api/portfolio/:type -> Publicly readable
router.get('/:type', getPortfolioData);

// POST /api/portfolio/:type -> Admin only (authorized via admin passcode in headers)
router.post('/:type', requireAdmin, updatePortfolioData);

export default router;
