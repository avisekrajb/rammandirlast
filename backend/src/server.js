const app = require('./app');
const connectDB = require('./config/database');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;

// Seed the superadmin account so s@gmail.com / 123467 always has superadmin access
const seedSuperAdmin = async () => {
  try {
    const email = 's@gmail.com';
    const password = '123467';
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
        console.log('🛡️ Superadmin account updated (s@gmail.com / 123467)');
      } else {
        console.log('🛡️ Superadmin account already present (s@gmail.com)');
      }
      return;
    }
    await User.create({
      name: 'Super Admin',
      email,
      password,
      role: 'superadmin',
    });
    console.log('🛡️ Superadmin account created (s@gmail.com / 123467)');
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
