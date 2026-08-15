const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');
const { upload } = require('../middleware/upload');
const {
  getAdminProfile,
  updateAdminProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  changeAdminPassword
} = require('../controllers/adminProfileController');

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// @route   GET /api/admin/profile
// @desc    Get admin profile
// @access  Private/Admin
router.get('/', getAdminProfile);

// @route   PUT /api/admin/profile
// @desc    Update admin profile
// @access  Private/Admin
router.put('/', updateAdminProfile);

// @route   POST /api/admin/profile/photo
// @desc    Upload profile photo
// @access  Private/Admin
router.post('/photo', upload.single('photo'), uploadProfilePhoto);

// @route   DELETE /api/admin/profile/photo
// @desc    Remove profile photo
// @access  Private/Admin
router.delete('/photo', removeProfilePhoto);

// @route   PUT /api/admin/profile/password
// @desc    Change admin password
// @access  Private/Admin
router.put('/password', changeAdminPassword);

module.exports = router;