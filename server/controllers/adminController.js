import Inquiry from '../models/Inquiry.js';
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';

/**
 * Validates admin password key.
 * POST /api/admin/login
 */
export async function adminLogin(req, res) {
  // Middelware does the auth checking, we just return success if it passes
  return res.json({ success: true, message: 'Authenticated successfully.' });
}

/**
 * Retrieves portfolio dashboard analytics stats.
 * GET /api/admin/stats
 */
export async function getDashboardStats(req, res) {
  try {
    const totalSessions = await ChatSession.countDocuments();
    const totalMessages = await ChatMessage.countDocuments();
    const totalInquiries = await Inquiry.countDocuments();

    // 1. Device categories distribution
    const deviceStats = await ChatSession.aggregate([
      { $group: { _id: '$device', count: { $sum: 1 } } }
    ]);
    const devices = {
      Desktop: 0,
      Mobile: 0,
      Tablet: 0
    };
    deviceStats.forEach(stat => {
      const type = stat._id || 'Desktop';
      devices[type] = stat.count;
    });

    // 2. Fetch frequent user questions (Top 5 unique questions asked by users)
    const topQuestions = await ChatMessage.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$content', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // Map database output to simple array
    const commonQueries = topQuestions.map(q => ({
      query: q._id,
      count: q.count
    }));

    return res.json({
      success: true,
      stats: {
        totalSessions,
        totalMessages,
        totalInquiries,
        devices,
        commonQueries
      }
    });

  } catch (error) {
    console.error('[AdminController] Error loading stats:', error);
    return res.status(500).json({ error: 'Failed to retrieve analytics dashboard stats.' });
  }
}

/**
 * Retrieves all submitted contact inquiries.
 * GET /api/admin/inquiries
 */
export async function getInquiries(req, res) {
  try {
    const inquiries = await Inquiry.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, inquiries });
  } catch (error) {
    console.error('[AdminController] Error fetching inquiries:', error);
    return res.status(500).json({ error: 'Failed to retrieve inquiries.' });
  }
}

/**
 * Deletes a contact inquiry by ID.
 * DELETE /api/admin/inquiries/:id
 */
export async function deleteInquiry(req, res) {
  try {
    const { id } = req.params;
    await Inquiry.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Inquiry deleted successfully.' });
  } catch (error) {
    console.error('[AdminController] Error deleting inquiry:', error);
    return res.status(500).json({ error: 'Failed to delete inquiry.' });
  }
}

/**
 * Retrieves all logged chat sessions.
 * GET /api/admin/sessions
 */
export async function getChatSessions(req, res) {
  try {
    const sessions = await ChatSession.find({}).sort({ lastActivityAt: -1 });
    return res.json({ success: true, sessions });
  } catch (error) {
    console.error('[AdminController] Error fetching chat sessions:', error);
    return res.status(500).json({ error: 'Failed to retrieve chat sessions.' });
  }
}

/**
 * Retrieves specific dialogue thread history for a session ID.
 * GET /api/admin/sessions/:sessionId
 */
export async function getSessionConversation(req, res) {
  try {
    const { sessionId } = req.params;
    const messages = await ChatMessage.find({ sessionId }).sort({ timestamp: 1 });
    const sessionDetails = await ChatSession.findOne({ sessionId });
    
    return res.json({ 
      success: true, 
      session: sessionDetails,
      messages 
    });
  } catch (error) {
    console.error('[AdminController] Error fetching session details:', error);
    return res.status(500).json({ error: 'Failed to retrieve session conversation.' });
  }
}
