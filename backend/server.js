const app = require('./src/app');
const connectDB = require('./src/config/database');
const User = require('./src/models/User');

const PORT = process.env.PORT || 5000;

// Seed the superadmin account using credentials from .env only (never hardcoded)
const seedSuperAdmin = async () => {
  try {
    const email = String(process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
    const password = process.env.SUPERADMIN_PASSWORD || '';
    if (!email || !password) {
      console.warn('⚠️  SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD not set in .env - skipping superadmin seed');
      return;
    }
    const existing = await User.findOne({ email }).select('+password');
    if (existing) {
      let changed = false;
      if (existing.role !== 'superadmin') {
        existing.role = 'superadmin';
        changed = true;
      }
      // Guarantee the superadmin password always works
      const passwordMatches = await existing.comparePassword(password);
      if (!passwordMatches) {
        existing.password = password;
        changed = true;
      }
      if (changed) {
        await existing.save();
        console.log(`🛡️ Superadmin account updated (${email})`);
      } else {
        console.log(`🛡️ Superadmin account already present (${email})`);
      }
      return;
    }
    await User.create({
      name: 'Super Admin',
      email,
      password,
      role: 'superadmin',
    });
    console.log(`🛡️ Superadmin account created (${email})`);
  } catch (error) {
    console.error('❌ Superadmin seed error:', error.message);
  }
};

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();
  await seedSuperAdmin();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
};

startServer();