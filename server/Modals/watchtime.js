import mongoose from "mongoose";

const watchTimeSchema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    date: { type: String, required: true }, // "YYYY-MM-DD" for easy daily grouping
    secondsWatched: { type: Number, default: 0 },
  },
  { timestamps: true }
);

watchTimeSchema.index({ userid: 1, date: 1 }, { unique: true });

export default mongoose.model("watchtime", watchTimeSchema);