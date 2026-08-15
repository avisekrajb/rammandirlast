const express = require('express');
const router = express.Router();
const { 
  signup, 
  login, 
  getMe, 
  forgotPassword, 
  resetPassword,
  sendOtp,
  verifyOtp,
  resetPasswordOtp,
  googleAuth,
  googleCallback,
  googleLogin,
  logout,
} = require('../controllers/authController');
const protect = require('../middleware/auth');

// ============================================
// LOCAL AUTHENTICATION
// ============================================

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email link
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password/:token', resetPassword);

// ============================================
// OTP PASSWORD RESET (Mobile/SPA friendly)
// ============================================

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP for password reset
 * @access  Public
 */
router.post('/send-otp', sendOtp);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP
 * @access  Public
 */
router.post('/verify-otp', verifyOtp);

/**
 * @route   POST /api/auth/reset-password-otp
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post('/reset-password-otp', resetPasswordOtp);

// ============================================
// GOOGLE OAUTH
// ============================================

/**
 * @route   GET /api/auth/google
 * @desc    Redirect to Google OAuth
 * @access  Public
 */
router.get('/google', googleAuth); // ← Make sure googleAuth is a function

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', googleCallback);

/**
 * @route   POST /api/auth/google
 * @desc    Google login for SPA/mobile apps
 * @access  Public
 */
router.post('/google', googleLogin);

// ============================================
// LOGOUT
// ============================================

/**
 * @route   GET /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.get('/logout', protect, logout);

// ============================================
// TEST ROUTE (Remove in production)
// ============================================

/**
 * @route   POST /api/auth/test-email
 * @desc    Test email sending
 * @access  Public
 */
router.post('/test-email', async (req, res) => {
  try {
    const { sendEmail } = require('../services/emailService');
    const { email } = req.body;
    
    const result = await sendEmail({
      to: email || 'test@example.com',
      subject: 'Test Email - Shree Ramchandra Temple',
      html: `
        <h1>🕉 Test Email</h1>
        <p>This is a test email from Shree Ramchandra Temple.</p>
        <p>If you received this, your email configuration is working!</p>
        <p>Jai Shree Ram! 🙏</p>
      `,
    });
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      result 
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send test email' 
    });
  }
});

module.exports = router;