const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// ============================================ 
// SESSION CONFIGURATION (for Google OAuth)
// ============================================
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax',
  },
}));

// ============================================
// PASSPORT INITIALIZATION (for Google OAuth)
// ============================================
app.use(passport.initialize());
app.use(passport.session());

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4000',
  'http://localhost:3000',
  'http://localhost:5000', 
  'https://rammandirlastbackend.onrender.com',
  'https://rammandirlast.onrender.com',
  'https://your-frontend-url.onrender.com',
  'https://shree-ramchandra-temple.onrender.com',
];

// Private/LAN addresses, e.g. http://192.168.1.107:4000 when testing on a phone
// on the same network. Only trusted in development.
const isPrivateOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' ||
      hostname === '[::1]' ||
      hostname === '::1' ||
      /^127\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
};

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (isPrivateOrigin(origin)) return callback(null, true);
    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// ============================================
// BODY PARSER
// ============================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// STATIC FILES (for uploaded files)
// ============================================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// LOGGING MIDDLEWARE
// ============================================
const STATIC_ASSET_RE = /\.(?:jpg|jpeg|png|gif|webp|svg|avif|ico|css|js|mjs|map|woff2?|ttf|eot|mp4|webm|mp3|pdf|txt|xml)$/i;

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    // Skip static assets: browsers retry missing images constantly and it drowns
    // out the API traffic. Those requests are served by the frontend, not the API.
    if (!STATIC_ASSET_RE.test(req.path)) {
      console.log(`📝 ${req.method} ${req.url}`);
    }
    next();
  });
} else {
  // Production logging (only errors)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (res.statusCode >= 400) {
        console.error(`❌ ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
      }
    });
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// User Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Admin Routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Admin Profile Routes
const adminProfileRoutes = require('./routes/adminProfileRoutes');
app.use('/api/admin/profile', adminProfileRoutes);

// Admin Activity Log Routes
const adminLogRoutes = require('./routes/adminLogRoutes');
app.use('/api/admin/activity', adminLogRoutes);

// Backup Routes
const backupRoutes = require('./routes/backupRoutes');
app.use('/api/admin/backup', backupRoutes);

// Super Admin Routes
const superAdminRoutes = require('./routes/superAdminRoutes');
app.use('/api/superadmin', superAdminRoutes);

// About Routes
const aboutRoutes = require('./routes/aboutRoutes');
app.use('/api/about', aboutRoutes);

// Event Routes
const eventRoutes = require('./routes/eventRoutes');
app.use('/api/events', eventRoutes);

// Booking Routes
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

// Donation Routes
const donationRoutes = require('./routes/donationRoutes');
app.use('/api/donations', donationRoutes);

// Gallery Routes
const galleryRoutes = require('./routes/galleryRoutes');
app.use('/api/gallery', galleryRoutes);

// Contact Routes
const contactRoutes = require('./routes/contactRoutes');
app.use('/api/contact', contactRoutes);

// Visitor Routes - For tracking website visitors
const visitorRoutes = require('./routes/visitorRoutes');
app.use('/api/visitors', visitorRoutes);

// Subscribe Routes - For email subscriptions
const subscribeRoutes = require('./routes/subscribeRoutes');
app.use('/api/subscribe', subscribeRoutes);

// Payment Routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payment', paymentRoutes);

// Team Routes - For team member management
const teamRoutes = require('./routes/teamRoutes');
app.use('/api/team', teamRoutes);

// Notification Routes - For admin notifications
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/admin/notifications', notificationRoutes);

// Chatbot Routes - For persisting chatbot messages
const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/api/chatbot', chatbotRoutes);

// Maintenance Mode (public status - no auth required)
const superAdminController = require('./controllers/superAdminController');
app.get('/api/maintenance', superAdminController.getPublicMaintenanceMode);

// ============================================
// HEALTH & ROOT ENDPOINTS
// ============================================

// Health check for Render
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    },
    version: '1.0.0',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Shree Ramchandra Temple API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      'admin/activity': '/api/admin/activity',
      'admin/backup': '/api/admin/backup',
      about: '/api/about',
      events: '/api/events',
      bookings: '/api/bookings',
      donations: '/api/donations',
      gallery: '/api/gallery',
      contact: '/api/contact',
      visitors: '/api/visitors',
      subscribe: '/api/subscribe',
      payment: '/api/payment',
      team: '/api/team',
      chatbot: '/api/chatbot',
      health: '/api/health',
    },
    docs: 'https://github.com/your-repo/shree-ramchandra-temple',
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    availableEndpoints: [
      '/api/auth',
      '/api/users',
      '/api/admin',
      '/api/admin/activity',
      '/api/admin/backup',
      '/api/about',
      '/api/events',
      '/api/bookings',
      '/api/donations',
      '/api/gallery',
      '/api/contact',
      '/api/visitors',
      '/api/subscribe',
      '/api/payment',
      '/api/team',
      '/api/chatbot',
      '/api/health',
    ],
  });
});

// ============================================
// ERROR HANDLER
// ============================================
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
