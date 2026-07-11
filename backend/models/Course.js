import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  videoFileId: {
    type: String,
    required: true,
    trim: true
  },
  unlockDay: {
    type: Number,
    required: true,
    default: 1 // Day number after purchase when this video unlocks (Day 1 = day of purchase)
  },
  durationDays: {
    type: Number,
    required: true,
    default: 30 // Number of days this video remains available after unlocking
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  thumbnail: {
    type: String,
    default: ''
  },
  videos: [videoSchema],
  validityDays: {
    type: Number,
    required: true,
    default: 365
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Course', courseSchema);
