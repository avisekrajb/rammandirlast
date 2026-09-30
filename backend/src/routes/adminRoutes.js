const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');
const {
  // Settings
  getSettings,
  updateSettings,
  resolveFacebookUrl,
  
  // Uploads
  uploadHeroVideo,
  uploadLogo,
  uploadAboutPhoto,
  uploadQRPhoto,
  uploadNoticePhoto,
  uploadTeamPhoto,
  uploadHistoryPhoto,
  uploadHistoryBanner,
  uploadEventPhoto,
  uploadGalleryPhoto,
  uploadFooterImage,
  uploadFooterVideo,
  
  // Users
  getAllUsers,
  updateUserRole,
  deleteUser,
  
  // Bookings
  getAllBookings,
  updateBookingStatus,
  
  // Donations
  getAllDonations,
  updateDonationStatus,
  deleteDonation,
  
  // History
  getHistory,
  addHistory,
  updateHistory,
  deleteHistory,
  
  // Team
  getTeam,
  getTeamById,
  addTeam,
  updateTeam,
  deleteTeam,
  followTeamMember,
  unfollowTeamMember,
  getTeamFollowers,
  incrementTeamViews,
  getTeamRoles,
  
  // Gallery
  getGallery,
  addGalleryPhoto,
  deleteGalleryPhoto,
  getGalleryVideos,
  addGalleryVideo,
  deleteGalleryVideo,
  getAllGalleryItems,
  getGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  bulkDeleteGalleryItems,
  
  // Admin Activity
  getAdminActivity,
  
  // Daily Quotes
  getDailyQuotes,
  updateDailyQuotes,
  getQuoteByDate,
  updateQuoteByDate,
  deleteQuoteByDate,
  generateDailyQuotes,
  getTodayQuote,
  getPublicQuoteByDate,
  
  // Social Links - NEW
  getSocialLinks,
  updateSocialLinks,
} = require('../controllers/adminController');

// Blog Controllers
const {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogPublish,
} = require('../controllers/blogController');

// Cloud Controllers
const {
  getCloudResources,
  getCloudResource,
  deleteCloudResource,
  deleteMultipleCloudResources,
  getCloudStats,
  searchCloudResources,
} = require('../controllers/cloudController');

// About Controllers
const {
  getAbout,
  updateAbout,
} = require('../controllers/aboutController');

// Event Controllers
const {
  getAllEvents,
  getUpcomingEvents,
  getPastEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Settings - public for frontend
router.get('/settings', getSettings);

// Resolve Facebook share/short links to canonical embeddable URLs (public)
router.post('/facebook/resolve', resolveFacebookUrl);

// Social Links - public for frontend
router.get('/social', getSocialLinks);

// About - public for frontend
router.get('/about', getAbout);

// History - public for frontend (GET only)
router.get('/history', getHistory);

// Team - public for frontend (GET all)
router.get('/team', getTeam);

// Get team roles - PUBLIC (no auth required)
router.get('/team/roles', getTeamRoles);

// Get single team member - PUBLIC (no auth required)
router.get('/team/:id', getTeamById);

// Increment team member views - PUBLIC
router.post('/team/:id/view', incrementTeamViews);

// Get team member followers - PUBLIC
router.get('/team/:id/followers', getTeamFollowers);

// Blogs - public for frontend
router.get('/blogs', getAllBlogs);
router.get('/blogs/:id', getBlogById);

// Events - public for frontend
router.get('/events', getAllEvents);
router.get('/events/upcoming', getUpcomingEvents);
router.get('/events/past', getPastEvents);
router.get('/events/:id', getEventById);

// ============================================
// DAILY QUOTES - PUBLIC ROUTES
// ============================================

// Get today's quote - PUBLIC
router.get('/quotes/today', getTodayQuote);

// Get quote by date - PUBLIC
router.get('/quotes/public/:date', getPublicQuoteByDate);

// ============================================
// GALLERY - PUBLIC ROUTES (No authentication required)
// ============================================

// Get all gallery items - PUBLIC (no auth)
router.get('/gallery/all', getAllGalleryItems);

// Get gallery photos - PUBLIC (no auth)
router.get('/gallery', getGallery);

// Get gallery videos - PUBLIC (no auth)
router.get('/gallery/videos', getGalleryVideos);

// Get single gallery item - PUBLIC (no auth)
router.get('/gallery/:id', getGalleryItem);

// ============================================
// PROTECTED ROUTES (Authentication + Admin required)
// ============================================

// All routes below require admin authentication
router.use(protect, admin);

// ---------- Admin Activity ----------
router.get('/activity', getAdminActivity);

// ---------- Settings ----------
router.put('/settings', updateSettings);

// ---------- Social Links Management ----------
router.put('/social', updateSocialLinks);

// ---------- About Management ----------
router.put('/about', updateAbout);

// ---------- Blog Management ----------
router.post('/blogs', createBlog);
router.put('/blogs/:id', updateBlog);
router.delete('/blogs/:id', deleteBlog);
router.put('/blogs/:id/toggle', toggleBlogPublish);

// ---------- Event Management ----------
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

// ---------- Cloud Management ----------
router.get('/cloud/resources', getCloudResources);
router.get('/cloud/resource/:publicId', getCloudResource);
router.delete('/cloud/resource/:publicId', deleteCloudResource);
router.post('/cloud/resources/delete', deleteMultipleCloudResources);
router.get('/cloud/stats', getCloudStats);
router.get('/cloud/search', searchCloudResources);

// ---------- About Image Upload Routes ----------
// Upload hero image for about page
router.post('/upload/about/hero', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    res.json({ url: req.file.path });
  } catch (error) {
    console.error('Upload about hero error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload section image for about page
router.post('/upload/about/section', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    res.json({ url: req.file.path });
  } catch (error) {
    console.error('Upload about section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- History Upload Routes ----------
// Upload history banner
router.post('/upload/history-banner', upload.single('image'), uploadHistoryBanner);

// Upload history entry photo
router.post('/upload/history', upload.single('image'), uploadHistoryPhoto);

// ---------- Other Upload Routes ----------
router.post('/upload/hero', upload.single('video'), uploadHeroVideo);
router.post('/upload/logo', upload.single('image'), uploadLogo);
router.post('/upload/about', upload.single('image'), uploadAboutPhoto);
router.post('/upload/qr', upload.single('image'), uploadQRPhoto);
router.post('/upload/notice', upload.single('image'), uploadNoticePhoto);
router.post('/upload/team', upload.single('image'), uploadTeamPhoto);
router.post('/upload/event', upload.single('image'), uploadEventPhoto);
router.post('/upload/gallery', upload.single('image'), uploadGalleryPhoto);
router.post('/upload/footer', upload.single('image'), uploadFooterImage);
router.post('/upload/footer/video', upload.single('video'), uploadFooterVideo);

// ---------- Booking Background Photo Upload ----------
router.post('/upload/booking-bg', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    res.json({ url: req.file.path });
  } catch (error) {
    console.error('Upload booking bg error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Daily Quotes Management (Admin Only) ----------
router.get('/quotes', getDailyQuotes);
router.put('/quotes', updateDailyQuotes);
router.get('/quotes/:date', getQuoteByDate);
router.put('/quotes/:date', updateQuoteByDate);
router.delete('/quotes/:date', deleteQuoteByDate);
router.post('/quotes/generate', generateDailyQuotes);

// ---------- User Management ----------
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// ---------- Booking Management ----------
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateBookingStatus);

// ---------- Donation Management ----------
router.get('/donations', getAllDonations);
router.put('/donations/:id/status', updateDonationStatus);
router.delete('/donations/:id', deleteDonation);

// ---------- History Management (Protected Admin Routes) ----------
// GET is public (defined above), but POST, PUT, DELETE are admin only
router.post('/history', addHistory);
router.put('/history/:id', updateHistory);
router.delete('/history/:id', deleteHistory);

// ---------- Team Management (Protected Admin Routes) ----------
// GET all and GET by ID are public (defined above)
// POST, PUT, DELETE are admin only
router.post('/team', addTeam);
router.put('/team/:id', updateTeam);
router.delete('/team/:id', deleteTeam);

// ---------- Team Follow/Unfollow Routes ----------
router.post('/team/:id/follow', protect, followTeamMember);
router.post('/team/:id/unfollow', protect, unfollowTeamMember);

// ---------- Gallery Management (Protected Admin Routes) ----------
router.post('/gallery', upload.single('photo'), addGalleryPhoto);
router.post('/gallery/videos', addGalleryVideo);
router.post('/gallery/video', upload.single('video'), addGalleryVideo);
router.put('/gallery/:id', updateGalleryItem);
router.delete('/gallery/:id', deleteGalleryItem);
router.delete('/gallery/videos/:id', deleteGalleryVideo);
router.delete('/gallery/bulk', bulkDeleteGalleryItems);

module.exports = router;