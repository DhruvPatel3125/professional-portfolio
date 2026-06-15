import express from 'express';
import { createInquiry } from '../controllers/inquiryController.js';

const router = express.Router();

// Public route to submit an inquiry
router.post('/', createInquiry);

export default router;
