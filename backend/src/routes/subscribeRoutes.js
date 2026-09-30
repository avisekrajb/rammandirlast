const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const protect = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const { createNotification } = require('../controllers/notificationController');

// @desc    Subscribe to updates
// @route   POST /api/subscribe
// @access  Private (requires login)
router.post('/', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const userEmail = email || req.user.email;

    if (!userEmail || !userEmail.includes('@')) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }

    // Store the subscriber so they receive future event/blog update emails
    let subscriber = null;
    try {
      subscriber = await Subscriber.findOneAndUpdate(
        { email: userEmail.toLowerCase().trim() },
        { email: userEmail.toLowerCase().trim() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (subError) {
      console.error('Subscriber save error:', subError.message);
    }

    // Notify admins about new subscriber
    await createNotification(
      'subscribe',
      'New Subscriber',
      `${userEmail} subscribed to temple updates`,
      { id: subscriber?._id, email: userEmail, createdAt: subscriber?.createdAt || new Date().toISOString() }
    );

    // Send admin email about new subscriber (best effort)
    try {
      await sendEmail({
        to: process.env.EMAIL_USER || 'admin@ramchandratemple.org.np',
        subject: '🕉 New Subscriber - Shree Ramchandra Temple',
        html: `
          <h3>New Subscriber</h3>
          <p>A new devotee subscribed to temple updates:</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        `,
      });
    } catch (adminEmailError) {
      console.error('Subscriber admin email error:', adminEmailError.message);
    }

    // Send confirmation email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7A1F2B 0%, #5B1420 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .header .om { font-size: 32px; display: block; margin-bottom: 8px; }
          .content { padding: 30px 25px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff; }
          .content ul { color: #4a4a5a; padding-left: 20px; }
          .content ul li { margin: 8px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          .temple-name { color: #7A1F2B; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="om">🕉</span>
          <h1>Subscription Confirmed</h1>
          <p style="margin: 4px 0 0; opacity: 0.85; font-size: 14px;">Shree Ramchandra Temple, Gaushala</p>
        </div>
        <div class="content">
          <p style="font-size: 18px; font-weight: 600; color: #1a1a2e;">Dear Devotee,</p>
          <p>Thank you for subscribing to <strong>Shree Ramchandra Temple</strong> updates!</p>
          <p>You will now receive important updates about:</p>
          <ul>
            <li>📅 Upcoming events and festivals</li>
            <li>📰 Latest temple news and blogs</li>
            <li>🙏 Special puja announcements</li>
            <li>🕉 Spiritual messages and quotes</li>
          </ul>
          <p style="margin-top: 16px; font-size: 16px; color: #7A1F2B; font-weight: 600;">Jai Shree Ram! 🙏</p>
        </div>
        <div class="footer">
          <p><span class="temple-name">Shree Ramchandra Temple</span></p>
          <p style="margin: 4px 0 0;">Gaushala, Kathmandu, Nepal</p>
          <p style="margin: 10px 0 0; font-size: 11px; color: #aaa;">This is an automated email. Please do not reply.</p>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: userEmail,
      subject: '🕉 Subscription Confirmed - Shree Ramchandra Temple',
      html,
    });

    res.json({ 
      success: true, 
      message: 'Subscribed successfully' 
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to subscribe' 
    });
  }
});

module.exports = router;