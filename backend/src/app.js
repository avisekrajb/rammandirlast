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
  'https://your-frontend-url.onrender.com',
  'https://shree-ramchandra-temple.onrender.com',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
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
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
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