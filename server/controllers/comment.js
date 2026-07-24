import comment from "../Modals/comment.js";
import mongoose from "mongoose";

const bannedWords = [
  "fuck", "shit", "bitch", "asshole", "bastard", "damn", "cunt",
  "dick", "piss", "slut", "whore", "nigger", "faggot"
];

const containsProfanity = (text) => {
  const lower = text.toLowerCase();
  return bannedWords.some((word) => lower.includes(word));
};

const isSpammy = (text) => {
  if (/([^\w\s])\1{4,}/.test(text)) return true;
  if (/(.)\1{6,}/.test(text)) return true;
  const alphaRatio = (text.match(/[a-zA-Z0-9\s]/g) || []).length / text.length;
  if (text.length > 5 && alphaRatio < 0.3) return true;
  return false;
};

export const postcomment = async (req, res) => {
  const commentdata = req.body;
  if (!commentdata.commentbody || !commentdata.commentbody.trim()) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }
  if (containsProfanity(commentdata.commentbody)) {
    return res.status(400).json({ message: "Comment contains inappropriate language" });
  }
  if (isSpammy(commentdata.commentbody)) {
    return res.status(400).json({ message: "Comment looks like spam and was blocked" });
  }
  const postcomment = new comment(commentdata);
  try {
    await postcomment.save();
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid: videoid });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody },
    });
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const likecomment = async (req, res) => {
  const { id: _id } = req.params;
  const { userid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const targetComment = await comment.findById(_id);
    if (!targetComment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    const alreadyLiked = targetComment.likedBy.includes(userid);
    const alreadyDisliked = targetComment.dislikedBy.includes(userid);
    if (alreadyLiked) {
      targetComment.likedBy.pull(userid);
      targetComment.likes -= 1;
    } else {
      targetComment.likedBy.push(userid);
      targetComment.likes += 1;
      if (alreadyDisliked) {
        targetComment.dislikedBy.pull(userid);
        targetComment.dislikes -= 1;
      }
    }
    await targetComment.save();
    return res.status(200).json(targetComment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const dislikecomment = async (req, res) => {
  const { id: _id } = req.params;
  const { userid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const targetComment = await comment.findById(_id);
    if (!targetComment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    const alreadyDisliked = targetComment.dislikedBy.includes(userid);
    const alreadyLiked = targetComment.likedBy.includes(userid);
    if (alreadyDisliked) {
      targetComment.dislikedBy.pull(userid);
      targetComment.dislikes -= 1;
    } else {
      targetComment.dislikedBy.push(userid);
      targetComment.dislikes += 1;
      if (alreadyLiked) {
        targetComment.likedBy.pull(userid);
        targetComment.likes -= 1;
      }
    }
    await targetComment.save();
    return res.status(200).json(targetComment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const reportcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { userid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const targetComment = await comment.findById(_id);
    if (!targetComment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (targetComment.reportedBy.includes(userid)) {
      return res.status(400).json({ message: "You already reported this comment" });
    }
    targetComment.reportedBy.push(userid);
    targetComment.reportCount += 1;
    targetComment.isFlagged = true;
    await targetComment.save();
    return res.status(200).json({ message: "Comment reported for review", comment: targetComment });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};