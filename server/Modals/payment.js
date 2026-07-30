import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    plan: {
      type: String,
      enum: ["bronze", "silver", "gold"],
      required: true,
    },
    amount: { type: Number, required: true }, // in paise (INR smallest unit)
    razorpay_order_id: { type: String, required: true },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

export default mongoose.model("payment", paymentSchema);