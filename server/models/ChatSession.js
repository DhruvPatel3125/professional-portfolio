import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ipAddress: {
    type: String,
    default: 'Unknown'
  },
  device: {
    type: String,
    default: 'Desktop'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  os: {
    type: String,
    default: 'Unknown'
  },
  location: {
    type: String,
    default: 'Unknown'
  },
  screenResolution: {
    type: String,
    default: 'Unknown'
  },
  locale: {
    type: String,
    default: 'Unknown'
  },
  referrer: {
    type: String,
    default: 'Unknown'
  },
  currentPage: {
    type: String,
    default: 'Unknown'
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  resumeDownloads: {
    type: Number,
    default: 0
  },
  projectClicks: {
    type: Number,
    default: 0
  },
  githubClicks: {
    type: Number,
    default: 0
  },
  linkedinClicks: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;
