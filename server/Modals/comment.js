import mongoose from "mongoose";

const commentschema = mongoose.Schema(
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
    commentbody: { type: String, required: true },
    usercommented: { type: String, required: true },
    commentedon: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    reportCount: { type: Number, default: 0 },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    isFlagged: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    showLocation: { type: Boolean, default: false },
    location: { type: String, default: "" },
    language: { type: String, default: "en" },
  },
  { timestamps: true }
);

export default mongoose.model("comment", commentschema);