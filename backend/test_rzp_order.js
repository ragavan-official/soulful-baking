import mongoose from 'mongoose';
import Course from './models/Course.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soulful_baking';

async function testOrder() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB...");

  const course = await Course.findOne();
  if (!course) {
    console.error("No course found in database to test!");
    await mongoose.disconnect();
    return;
  }

  console.log(`Testing Razorpay order for Course: "${course.title}" | Price: ₹${course.price}`);

  const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  const amountInPaise = Math.round(course.price * 100);
  console.log(`Amount in paise: ${amountInPaise}`);

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `receipt_test_${Date.now()}`
  };

  try {
    console.log("Sending order request to Razorpay...");
    const order = await rzp.orders.create(options);
    console.log("Razorpay Order Created Successfully! Details:", order);
  } catch (err) {
    console.error("\n>>> Razorpay Order Creation Failed!");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    if (err.statusCode) console.error("HTTP Status Code:", err.statusCode);
    console.error("Full Error Object:", JSON.stringify(err, null, 2));
  }

  await mongoose.disconnect();
}

testOrder().catch(async (err) => {
  console.error("Unhandled error:", err);
  await mongoose.disconnect();
});
