const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  trackVisitor,
  getVisitorStats,
  updateTimeSpent,
  getVisitorDetails,
  getPublicVisitorCount,
  detectLanguage,
} = require('../controllers/visitorController');

// Public routes
router.post('/track', trackVisitor);
router.post('/time', updateTimeSpent);
router.get('/count', getPublicVisitorCount);

// Country-based language suggestion, used on a visitor's first visit.
// Declared before `/:id` so "detect" is never read as a visitor id.
router.get('/detect', detectLanguage);

// Admin routes
router.get('/stats', protect, admin, getVisitorStats);
router.get('/:id', protect, admin, getVisitorDetails);

module.exports = router;