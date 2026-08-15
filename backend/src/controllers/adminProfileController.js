const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// ============ ADMIN PROFILE CONTROLLERS ============

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
exports.getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update admin profile (name, phone)
// @route   PUT /api/admin/profile
// @access  Private/Admin
exports.updateAdminProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    await user.save();

    // Log admin activity (if function exists)
    if (req.app && req.app.locals && req.app.locals.logAdminActivity) {
      req.app.locals.logAdminActivity(req.user.id, 'Profile Updated', { 
        name: user.name,
        phone: user.phone 
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profilePhoto: user.profilePhoto,
        role: user.role
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload admin profile photo
// @route   POST /api/admin/profile/photo
// @access  Private/Admin
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image uploaded' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete old profile photo from cloudinary if exists
    if (user.profilePhoto) {
      try {
        const urlParts = user.profilePhoto.split('/');
        const publicId = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1].split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
        console.log('Old profile photo deleted successfully');
      } catch (error) {
        console.log('Old profile photo deletion skipped:', error.message);
      }
    }

    // Update user with new photo URL
    user.profilePhoto = req.file.path;
    await user.save();

    // Log admin activity (if function exists)
    if (req.app && req.app.locals && req.app.locals.logAdminActivity) {
      req.app.locals.logAdminActivity(req.user.id, 'Profile Photo Updated', { 
        url: req.file.path 
      });
    }

    res.json({
      success: true,
      data: {
        profilePhoto: user.profilePhoto
      },
      message: 'Profile photo uploaded successfully'
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};

// @desc    Remove admin profile photo
// @route   DELETE /api/admin/profile/photo
// @access  Private/Admin
exports.removeProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete photo from cloudinary if exists
    if (user.profilePhoto) {
      try {
        const urlParts = user.profilePhoto.split('/');
        const publicId = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1].split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
        console.log('Profile photo deleted from cloudinary');
      } catch (error) {
        console.log('Cloudinary deletion skipped:', error.message);
      }
    }

    user.profilePhoto = null;
    await user.save();

    // Log admin activity (if function exists)
    if (req.app && req.app.locals && req.app.locals.logAdminActivity) {
      req.app.locals.logAdminActivity(req.user.id, 'Profile Photo Removed', {});
    }

    res.json({
      success: true,
      message: 'Profile photo removed successfully'
    });
  } catch (error) {
    console.error('Remove profile photo error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/profile/password
// @access  Private/Admin
exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide current and new password' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log admin activity (if function exists)
    if (req.app && req.app.locals && req.app.locals.logAdminActivity) {
      req.app.locals.logAdminActivity(req.user.id, 'Password Changed', {});
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};