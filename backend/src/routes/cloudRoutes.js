const express = require('express');
const router = express.Router();

const { protect, admin } = require('../middleware/auth');

const {
  getCloudResources,
  deleteCloudResource,
  deleteMultipleCloudResources,
  getCloudStats,
  searchCloudResources,
  getCloudResource,
} = require('../controllers/cloudController');

// All routes require admin login
router.use(protect);
router.use(admin);

// Dashboard
router.get('/resources', getCloudResources);
router.get('/stats', getCloudStats);
router.get('/search', searchCloudResources);

// Single resource
router.get('/resource/:publicId(*)', getCloudResource);

// Delete single resource
router.delete('/resource/:publicId(*)', deleteCloudResource);

// Delete multiple resources
router.post('/resources/delete', deleteMultipleCloudResources);

module.exports = router;