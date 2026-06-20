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
  deleteDocument,
  uploadDocument
} from '../controllers/ragController.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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
router.post('/documents/upload', upload.single('document'), uploadDocument);

export default router;
