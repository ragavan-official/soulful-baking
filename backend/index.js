import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import adminCoursesRouter from './routes/adminCourses.js';
import coursesRouter from './routes/courses.js';
import mediaRouter from './routes/media.js';
import { authenticateToken, requireAdmin } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://soulful-baking.onrender.com'
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soulful_baking';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully');
    await seedAdmin();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Seed admin function
async function seedAdmin() {
  try {
    // Delete the old admin user to ensure only one admin exists
    await User.deleteOne({ email: 'ragavram80@gmail.com' });
    console.log('Old admin user ragavram80@gmail.com removed from database.');

    const adminEmail = 'soulfulbaking.shamini@gmail.com';
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

// Admin routes
app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req, res) => {
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

// Root route
app.get('/', (req, res) => {
  res.send('Soulful Baking API is running...');
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
