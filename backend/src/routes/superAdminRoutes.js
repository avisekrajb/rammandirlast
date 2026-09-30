const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/superadmin');
const {
  getDashboard,
  getAdmins,
  createAdmin,
  setAdminStatus,
  deleteAdmin,
  getAllBookings,
  updateBookingStatus,
  getAllDonations,
  updateDonationStatus,
  getLanguages,
  setLanguages,
  getMaintenanceMode,
  setMaintenanceMode,
  getDbStats,
  getCollectionRecords,
  deleteDbRecord,
  clearCollection,
  deleteCollection,
} = require('../controllers/superAdminController');

// All super admin routes require authentication + superadmin role
router.use(protect, requireSuperAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Admin management
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id/status', setAdminStatus);
router.delete('/admins/:id', deleteAdmin);

// Bookings & donations
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.get('/donations', getAllDonations);
router.put('/donations/:id/status', updateDonationStatus);

// Languages
router.get('/languages', getLanguages);
router.put('/languages', setLanguages);

// Maintenance mode
router.get('/maintenance', getMaintenanceMode);
router.put('/maintenance', setMaintenanceMode);

// Database storage stats & records
router.get('/db/stats', getDbStats);
router.get('/db/:collection/records', getCollectionRecords);
router.delete('/db/:collection/:id', deleteDbRecord);
router.post('/db/:collection/clear', clearCollection);
router.delete('/db/:collection', deleteCollection);

module.exports = router;
