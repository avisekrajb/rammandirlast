const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getAdminActivity,
  addAdminLog,
  clearAdminLogs,
  getAdminLogStats,
} = require('../controllers/adminController');

// All admin activity routes share the same in-memory store as adminController
// so logs recorded by logAdminActivity() (backend) and via POST /log are unified.

// @desc    Get admin activity logs
// @route   GET /api/admin/activity
// @access  Private/Admin
router.get('/', protect, admin, getAdminActivity);

// @desc    Add admin activity log
// @route   POST /api/admin/activity/log
// @access  Private/Admin
router.post('/log', protect, admin, addAdminLog);

// @desc    Clear admin activity logs
// @route   DELETE /api/admin/activity
// @access  Private/Admin
router.delete('/', protect, admin, clearAdminLogs);

// @desc    Get admin activity stats
// @route   GET /api/admin/activity/stats
// @access  Private/Admin
router.get('/stats', protect, admin, getAdminLogStats);

module.exports = router;
