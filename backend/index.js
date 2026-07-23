import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import adminCoursesRouter from './routes/adminCourses.js';
import coursesRouter from './routes/courses.js';
import mediaRouter from './routes/media.js';
import menuRouter from './routes/menu.js';
import galleryRouter from './routes/gallery.js';
import { authenticateToken, requireAdmin, requireAdminOrEmployee } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security headers ────────────────────────────────────────────────────────
// Google Sign-In uses window.postMessage from a cross-origin popup.
// Render sets Cross-Origin-Opener-Policy: same-origin by default which blocks
// that postMessage and silently breaks Google OAuth. Override it to unsafe-none.
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:5173",
  "https://www.soulfulbaking.in",
  "https://soulfulbaking.in",
  "https://soulful-baking.onrender.com",
  "http://www.soulfulbaking.in",
  "http://soulfulbaking.in"
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

// ─── MongoDB connection with auto-retry ──────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soulful_baking';

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000,  // give up selecting a server after 10s
  socketTimeoutMS: 45000,           // close idle sockets after 45s
  connectTimeoutMS: 10000,          // initial TCP connection timeout
  heartbeatFrequencyMS: 10000,      // check server health every 10s
  maxPoolSize: 10,
  retryWrites: true,
};

let _adminSeeded = false;

async function connectDB(retryCount = 0) {
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = Math.min(1000 * 2 ** retryCount, 30000); // exponential back-off, max 30s

  try {
    await mongoose.connect(MONGODB_URI, MONGO_OPTIONS);
    console.log('Connected to MongoDB successfully');
    if (!_adminSeeded) {
      await seedAdmin();
      _adminSeeded = true;
    }
  } catch (err) {
    console.error(`[MongoDB] Connection failed (attempt ${retryCount + 1}):`, err.message);
    if (retryCount < MAX_RETRIES) {
      console.log(`[MongoDB] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY_MS);
    } else {
      console.error('[MongoDB] Max retries reached. Server will keep running but DB is unavailable.');
    }
  }
}

// Mongoose connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected. Attempting to reconnect...');
  if (mongoose.connection.readyState === 0) {
    setTimeout(() => connectDB(), 3000);
  }
});
mongoose.connection.on('reconnected', () => console.log('[MongoDB] Reconnected successfully'));
mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err.message);
});

// ─── Global error guards: keep the server alive on transient network errors ────────
// These codes/messages cover: MongoDB pool resets, Razorpay/Resend TLS drops,
// any aborted HTTP(S) request, DNS failures, and pipe breaks.
const TRANSIENT_CODES = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND',
  'EPIPE', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH',
]);

const isTransientNetworkError = (err) =>
  TRANSIENT_CODES.has(err?.code)
  || err?.message === 'aborted'
  || err?.constructor?.name?.includes('Mongo')
  || err?.message?.includes('PoolCleared')
  || err?.message?.includes('topology')
  || err?.message?.includes('timed out')
  || err?.message?.includes('socket hang up');

process.on('uncaughtException', (err) => {
  if (isTransientNetworkError(err)) {
    console.warn('[Network] Transient error caught — server stays alive:', err.code || err.message);
  } else {
    // Truly unexpected: log full stack then exit so nodemon/Render can restart cleanly
    console.error('[FATAL] Uncaught exception:', err);
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  if (isTransientNetworkError(err)) {
    console.warn('[Network] Unhandled rejection (transient) — server stays alive:', err.code || err.message);
  } else {
    console.error('[FATAL] Unhandled rejection:', reason);
    process.exit(1);
  }
});


connectDB();

// Seed admin function
async function seedAdmin() {
  try {
    // Delete the old admin user to ensure only one admin exists
    // await User.deleteOne({ email: 'ragavram80@gmail.com' });
    // console.log('Old admin user ragavram80@gmail.com removed from database.');

    const adminEmail = 'query@soulfulbaking.in';
    const adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log('Admin user exists. Syncing password and role...');
      // Sync password to Shaminisha@28 and role to admin
      adminUser.password = 'Shaminisha@28';
      adminUser.role = 'admin';
      adminUser.name = adminUser.name || 'Shamini Admin';
      await adminUser.save();
      console.log('Admin user updated and verified.');
    } else {
      console.log('Admin user does not exist. Seeding default admin...');
      const newAdmin = new User({
        name: 'Shamini Admin',
        email: adminEmail,
        password: 'Shaminisha@28',
        role: 'admin'
      });
      await newAdmin.save();
      console.log('Default admin user successfully seeded.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRouter);
app.use('/api/admin', adminCoursesRouter);
app.use('/api/media', mediaRouter);
app.use('/api/menu', menuRouter);
app.use('/api/gallery', galleryRouter);

// Admin routes
app.get('/api/admin/dashboard', authenticateToken, requireAdminOrEmployee, async (req, res) => {
  try {
    // Return some mock or real stats for dashboard representation
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const userCount = await User.countDocuments({ role: 'user' });
    
    // Fetch all users to display in admin dashboard
    const allUsers = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      stats: {
        totalUsers,
        adminCount,
        userCount
      },
      users: allUsers
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update a user's role (Admin only)
app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Prevent changing primary admin roles
    const protectedAdmins = ['query@soulfulbaking.in', 'soulfulbaking.shamini@gmail.com'];
    if (protectedAdmins.includes(userToUpdate.email)) {
      return res.status(403).json({ message: 'Cannot change primary admin role' });
    }
    userToUpdate.role = role;
    await userToUpdate.save();
    res.json({ message: 'User role updated successfully', user: { id: userToUpdate._id, role: userToUpdate.role } });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Server error updating role' });
  }
});

// ─── Keep-alive ping (prevents Render free-tier cold starts) ─────────────────
// Point UptimeRobot or cron-job.org to GET /api/ping every 5 minutes.
app.get('/api/ping', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok', 
    database: dbStatus, 
    timestamp: new Date().toISOString() 
  });
});

// ─── Serve React SPA in production ───────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');

// Serve built static assets (JS, CSS, images)
app.use(express.static(frontendDist));

// SPA catch-all: for any non-API route, return index.html so React Router works
// This fixes the 404 you get when you refresh /login, /menu, etc.
app.get(/^(?!\/api).*/, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
