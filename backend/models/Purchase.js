import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  // Razorpay transaction identifiers — links DB record to actual Razorpay transaction
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    default: null  // stored in INR (not paise)
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

// Prevent duplicate purchases for the same course by the same user
purchaseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model('Purchase', purchaseSchema);
