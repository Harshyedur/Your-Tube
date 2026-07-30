import mongoose from "mongoose";
import watchtime from "../Modals/watchtime.js";
import users from "../Modals/Auth.js";
import { PLAN_DETAILS } from "../planConfig.js";

const getTodayString = () => {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
};

// Called periodically (e.g., every 15 seconds) while a video plays
export const trackWatchTime = async (req, res) => {
  const { userid, secondsToAdd } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const user = await users.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plan = user.plan || "free";
    const limitSeconds = PLAN_DETAILS[plan].watchTimeMinutes * 60;
    const today = getTodayString();

    let record = await watchtime.findOne({ userid, date: today });
    if (!record) {
      record = new watchtime({ userid, date: today, secondsWatched: 0 });
    }

    record.secondsWatched += secondsToAdd;
    await record.save();

    const limitReached = record.secondsWatched >= limitSeconds;

    return res.status(200).json({
      secondsWatched: record.secondsWatched,
      limitSeconds,
      limitReached,
      plan,
    });
  } catch (error) {
    console.error("Track watch time error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getWatchTimeStatus = async (req, res) => {
  const { userid } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const user = await users.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plan = user.plan || "free";
    const limitSeconds = PLAN_DETAILS[plan].watchTimeMinutes * 60;
    const today = getTodayString();

    const record = await watchtime.findOne({ userid, date: today });
    const secondsWatched = record ? record.secondsWatched : 0;

    return res.status(200).json({
      secondsWatched,
      limitSeconds,
      limitReached: secondsWatched >= limitSeconds,
      plan,
    });
  } catch (error) {
    console.error("Get watch time status error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};