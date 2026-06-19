import Inquiry from '../models/Inquiry.js';
import { getIpLocation } from '../services/geoService.js';

/**
 * Creates and logs a dynamic visitor inquiry.
 * POST /api/inquiries
 */
export async function createInquiry(req, res) {
  try {
    const { name, email, message, sessionId } = req.body;

    // 1. Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // 2. Client Metadata
    // Handle proxy forwarding header first
    const rawIp = req.headers['x-forwarded-for'] 
      ? req.headers['x-forwarded-for'].split(',')[0].trim() 
      : (req.socket.remoteAddress || req.ip);

    const userAgent = req.headers['user-agent'] || 'Unknown';

    // 3. Geolocation IP lookup
    const location = await getIpLocation(rawIp);

    // 4. Create and Save Document
    const newInquiry = new Inquiry({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      ipAddress: rawIp,
      userAgent,
      location,
      sessionId: sessionId || null
    });

    await newInquiry.save();

    console.log(`[InquiryController] Saved inquiry from ${name.trim()} (${location})`);

    return res.status(201).json({
      success: true,
      message: 'Inquiry saved successfully.'
    });

  } catch (error) {
    console.error('[InquiryController] Error creating inquiry:', error);
    return res.status(500).json({
      error: 'Failed to submit inquiry. Please try again later.'
    });
  }
}
