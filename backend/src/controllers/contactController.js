const Contact = require('../models/Contact');
const { sendEmail } = require('../services/emailService');
const { sendContactReply } = require('../services/emailService');
const { createNotification } = require('./notificationController');

// ============================================
// PUBLIC ROUTES
// ============================================

// @desc    Send contact message
// @route   POST /api/contact
// @access  Public
exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // Save to database
    const contact = await Contact.create({
      name,
      email,
      message,
      status: 'pending',
    });

    // Notify admins about new contact message
    await createNotification(
      'contact',
      'New Contact Message',
      `${name} sent a message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
      { id: contact._id, name: contact.name, email: contact.email, message: contact.message, status: contact.status, createdAt: contact.createdAt }
    );

    // Send email to admin
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Message</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a2e;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #fafafa;
          }
          .container {
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          .header {
            background: linear-gradient(135deg, #7A1F2B 0%, #5B1420 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          .content {
            padding: 30px 25px;
          }
          .detail-row {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .detail-label {
            font-weight: 600;
            width: 100px;
            color: #6b6b7a;
          }
          .detail-value {
            flex: 1;
            color: #1a1a2e;
          }
          .message-box {
            background: #f8f5f3;
            padding: 15px 20px;
            border-radius: 12px;
            margin: 15px 0;
            border-left: 4px solid #7A1F2B;
          }
          .message-box p {
            margin: 0;
            color: #4a4a5a;
          }
          .footer {
            text-align: center;
            padding: 20px;
            border-top: 1px solid #e8e4e0;
            font-size: 13px;
            color: #8a8a9a;
            background: #fafafa;
          }
          .temple-name {
            font-weight: 600;
            color: #7A1F2B;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            background: #F59E0B;
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 New Contact Message</h1>
            <p style="margin: 4px 0 0; opacity: 0.85; font-size: 14px;">Received from the temple website</p>
          </div>
          <div class="content">
            <div class="detail-row">
              <span class="detail-label">From</span>
              <span class="detail-value"><strong>${name}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${email}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value"><span class="badge">Pending</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Received</span>
              <span class="detail-value">${new Date().toLocaleString()}</span>
            </div>
            <div style="margin-top: 15px;">
              <p style="font-weight: 600; margin-bottom: 5px;">Message:</p>
              <div class="message-box">
                <p>${message}</p>
              </div>
            </div>
            <p style="font-size: 14px; color: #6b6b7a; margin-top: 10px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4000'}/admin/contact" style="color: #7A1F2B; text-decoration: none; font-weight: 600;">
                View in Admin Panel →
              </a>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;"><span class="temple-name">Shree Ramchandra Temple</span></p>
            <p style="margin: 4px 0 0;">Gaushala, Kathmandu, Nepal</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: process.env.EMAIL_USER || 'admin@ramchandratemple.org.np',
      subject: `📬 New Contact Message from ${name}`,
      html: adminHtml,
    });

    // Send auto-reply to user
    const autoReplyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Contacting Us</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a2e;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #fafafa;
          }
          .container {
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          .header {
            background: linear-gradient(135deg, #7A1F2B 0%, #5B1420 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          .content {
            padding: 30px 25px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 12px;
          }
          .message-box {
            background: #f8f5f3;
            padding: 15px 20px;
            border-radius: 12px;
            margin: 15px 0;
            border-left: 4px solid #7A1F2B;
          }
          .message-box p {
            margin: 0;
            color: #4a4a5a;
          }
          .footer {
            text-align: center;
            padding: 20px;
            border-top: 1px solid #e8e4e0;
            font-size: 13px;
            color: #8a8a9a;
            background: #fafafa;
          }
          .temple-name {
            font-weight: 600;
            color: #7A1F2B;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🙏 Thank You for Contacting Us</h1>
            <p style="margin: 4px 0 0; opacity: 0.85; font-size: 14px;">We have received your message</p>
          </div>
          <div class="content">
            <p class="greeting">Dear <strong>${name}</strong>,</p>
            <p>Thank you for reaching out to <strong>Shree Ramchandra Temple</strong>.</p>
            <p>We have received your message and will get back to you as soon as possible. Our team is dedicated to serving you with care and devotion.</p>
            
            <p style="font-weight: 600; margin-top: 15px;">📋 Your Message:</p>
            <div class="message-box">
              <p>${message}</p>
            </div>
            
            <p style="font-size: 14px; color: #6b6b7a; margin-top: 10px;">If you have any urgent inquiries, please contact us directly at +977-1-4598526.</p>
            <p style="margin-top: 16px;">🙏 Jai Shree Ram!</p>
          </div>
          <div class="footer">
            <p style="margin: 0;"><span class="temple-name">Shree Ramchandra Temple</span></p>
            <p style="margin: 4px 0 0;">Gaushala, Kathmandu, Nepal</p>
            <p style="margin: 10px 0 0; font-size: 11px; color: #aaa;">This is an automated reply. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: email,
        subject: '🙏 We Received Your Message - Shree Ramchandra Temple',
        html: autoReplyHtml,
      });
    } catch (emailError) {
      console.error('Auto-reply email error:', emailError);
      // Don't fail the request if auto-reply fails
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: contact,
    });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send message' 
    });
  }
};

// ============================================
// ADMIN ROUTES
// ============================================

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin
exports.getContactMessages = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const messages = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await Contact.countDocuments(query);
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Get single contact message
// @route   GET /api/contact/:id
// @access  Private/Admin
exports.getContactMessage = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }
    
    // Mark as read if pending
    if (message.status === 'pending') {
      message.status = 'read';
      await message.save();
    }
    
    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Reply to contact message
// @route   POST /api/contact/:id/reply
// @access  Private/Admin
exports.replyContactMessage = async (req, res) => {
  try {
    const { reply } = req.body;
    const { id } = req.params;
    
    if (!reply || reply.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Reply message is required' 
      });
    }
    
    const message = await Contact.findById(id);
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }
    
    // Update message
    message.reply = reply.trim();
    message.status = 'replied';
    message.repliedAt = Date.now();
    message.repliedBy = req.user.name || req.user.email || 'Admin';
    await message.save();
    
    // Send reply email
    try {
      await sendContactReply(message, reply.trim());
      console.log(`✅ Reply email sent to ${message.email}`);
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the request if email fails
    }
    
    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('Reply to contact error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send reply' 
    });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
exports.deleteContactMessage = async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Bulk delete contact messages
// @route   DELETE /api/contact/bulk
// @access  Private/Admin
exports.bulkDeleteContactMessages = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide an array of IDs' 
      });
    }
    
    const result = await Contact.deleteMany({ _id: { $in: ids } });
    
    res.json({
      success: true,
      message: `${result.deletedCount} messages deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Get contact statistics
// @route   GET /api/contact/stats
// @access  Private/Admin
exports.getContactStats = async (req, res) => {
  try {
    const total = await Contact.countDocuments();
    const pending = await Contact.countDocuments({ status: 'pending' });
    const read = await Contact.countDocuments({ status: 'read' });
    const replied = await Contact.countDocuments({ status: 'replied' });
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        read,
        replied,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};