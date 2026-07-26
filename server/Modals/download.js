import mongoose from "mongoose";

const downloadSchema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    downloadDate: { type: Date, default: Date.now },
    planAtDownload: { type: String, default: "free" },
  },
  { timestamps: true }
);

export default mongoose.model("download", downloadSchema);