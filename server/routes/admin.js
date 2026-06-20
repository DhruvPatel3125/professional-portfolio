import express from 'express';
import { requireAdmin } from '../middlewares/authMiddleware.js';
import {
  adminLogin,
  getDashboardStats,
  getInquiries,
  deleteInquiry,
  getChatSessions,
  getSessionConversation
} from '../controllers/adminController.js';
import {
  getDocuments,
  addDocument,
  deleteDocument
} from '../controllers/ragController.js';

const router = express.Router();

// Apply authorization middleware to all admin endpoints
router.use(requireAdmin);

// Auth validation test endpoint
router.post('/login', adminLogin);

// Stats analytics endpoint
router.get('/stats', getDashboardStats);

// Contact Inquiries CRUD
router.get('/inquiries', getInquiries);
router.delete('/inquiries/:id', deleteInquiry);

// Chat Logs Explorer
router.get('/sessions', getChatSessions);
router.get('/sessions/:sessionId', getSessionConversation);

// Dynamic RAG Documents
router.get('/documents', getDocuments);
router.post('/documents', addDocument);
router.delete('/documents/:title', deleteDocument);

export default router;
