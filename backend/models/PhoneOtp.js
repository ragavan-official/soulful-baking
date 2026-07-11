import mongoose from 'mongoose';

const phoneOtpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Auto-deleted after 5 minutes
  }
});

export default mongoose.model('PhoneOtp', phoneOtpSchema);
