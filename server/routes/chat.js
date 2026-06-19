import express from 'express';
import { handleChat, trackSessionEngagement } from '../controllers/chatController.js';

const router = express.Router();

// Route POST /api/chat to the controller
router.post('/', handleChat);
router.post('/track', trackSessionEngagement);

export default router;
