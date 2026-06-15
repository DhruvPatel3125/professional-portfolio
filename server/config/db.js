import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  try {
    if (!config.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from server configuration.');
    }

    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // Do not crash the server if DB connection fails, just alert the log
    console.warn('[MongoDB] Server is running in degraded mode (no database features).');
  }
}
