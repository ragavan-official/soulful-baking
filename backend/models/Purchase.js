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
  purchasedAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid duplicate purchases for the same course by the same user
purchaseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model('Purchase', purchaseSchema);
