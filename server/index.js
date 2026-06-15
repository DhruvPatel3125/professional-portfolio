// Main Server Entrypoint - Recached JSON projects
import './config/env.js';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import inquiryRouter from './routes/inquiry.js';
import adminRouter from './routes/admin.js';
import { connectDB } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize MongoDB Connection
connectDB();

// CORS configuration - Allow all origins for public portfolio chatbot
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/inquiries', inquiryRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed frontend origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

