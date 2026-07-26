import mongoose from "mongoose";
import download from "../Modals/download.js";
import video from "../Modals/video.js";
import users from "../Modals/Auth.js";

const PLAN_LIMITS = {
  free: 1,
  premium: 10,
};

export const requestdownload = async (req, res) => {
  const { userid, videoid } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(userid) ||
    !mongoose.Types.ObjectId.isValid(videoid)
  ) {
    return res.status(400).json({ message: "Invalid user or video id" });
  }

  try {
    const user = await users.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetVideo = await video.findById(videoid);
    if (!targetVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    const plan = user.plan || "free";
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysDownloadCount = await download.countDocuments({
      userid,
      downloadDate: { $gte: startOfDay, $lte: endOfDay },
    });

    if (todaysDownloadCount >= limit) {
      return res.status(403).json({
        message: `Daily download limit reached for your ${plan} plan (${limit}/day). Upgrade to download more.`,
      });
    }

    const newDownload = new download({
      userid,
      videoid,
      planAtDownload: plan,
    });
    await newDownload.save();

    return res.status(201).json({
      message: "Download authorized",
      remainingToday: limit - (todaysDownloadCount + 1),
      video: targetVideo,
    });
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getuserdownloads = async (req, res) => {
  const { userid } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  try {
    const downloads = await download
      .find({ userid })
      .populate("videoid")
      .sort({ downloadDate: -1 });
    return res.status(200).json(downloads);
  } catch (error) {
    console.error("Get downloads error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};