import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import video from "./Modals/video.js";

dotenv.config();

const sourceFile = process.argv[2];
const videoTitle = process.argv[3] || "Untitled Video";
const channelName = process.argv[4] || "Demo Channel";

if (!sourceFile) {
  console.error("Please provide a video file path.");
  console.error('Usage: node seed.js "C:\\path\\to\\video.mp4" "My Title" "Channel Name"');
  process.exit(1);
}

if (!fs.existsSync(sourceFile)) {
  console.error(`File not found: ${sourceFile}`);
  process.exit(1);
}

const uploadsDir = "./uploads";
const fileName = path.basename(sourceFile);
const destFile = path.join(uploadsDir, fileName);

async function seed() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    fs.copyFileSync(sourceFile, destFile);
    const stats = fs.statSync(destFile);

    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB");

    const newVideo = new video({
      videotitle: videoTitle,
      filename: fileName,
      filepath: `uploads/${fileName}`,
      filetype: "video/mp4",
      filesize: String(stats.size),
      videochanel: channelName,
      uploader: "seed-script",
    });

    await newVideo.save();
    console.log(`Video "${videoTitle}" seeded successfully!`);
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();