import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },
  plan: {
    type: String,
    enum: ["free", "bronze", "silver", "gold"],
    default: "free",
  },
  planExpiresAt: { type: Date, default: null },
  theme: {
    type: String,
    enum: ["light", "dark"],
    default: "dark",
  },
  themeManuallySet: { type: Boolean, default: false },
  knownLogins: [
    {
      city: String,
      state: String,
      deviceInfo: String,
      lastSeen: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("user", userschema);