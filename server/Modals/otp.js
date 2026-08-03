import mongoose from "mongoose";

const otpSchema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    otp: { type: String, required: true },
    city: String,
    state: String,
    deviceInfo: String,
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("otp", otpSchema);