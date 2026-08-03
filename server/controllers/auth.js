import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import geoip from "geoip-lite";
import crypto from "crypto";
import otpModel from "../Modals/otp.js";
import { sendOtpEmail } from "../utils/sendEmail.js";

const getLocationFromIP = (ip) => {
  // Handle localhost/local dev IPs gracefully
  if (!ip || ip === "::1" || ip.includes("127.0.0.1")) {
    return { city: "Unknown", state: "Unknown" };
  }
  const geo = geoip.lookup(ip);
  if (!geo) return { city: "Unknown", state: "Unknown" };
  return {
    city: geo.city || "Unknown",
    state: geo.region || "Unknown",
  };
};

const getClientIP = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress;
};

const isKnownLogin = (user, city, state, deviceInfo) => {
  return user.knownLogins.some(
    (entry) =>
      entry.city === city &&
      entry.state === state &&
      entry.deviceInfo === deviceInfo
  );
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getISTThemeDefault = () => {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  const hour = istDate.getHours();
  return hour >= 10 && hour < 12 ? "light" : "dark";
};

export const login = async (req, res) => {
  const { email, name, image } = req.body;
  const deviceInfo = req.headers["user-agent"] || "Unknown device";
  const ip = getClientIP(req);
  const { city, state } = getLocationFromIP(ip);

  try {
    let existingUser = await users.findOne({ email });
    let isNewUser = false;

    if (!existingUser) {
      isNewUser = true;
      existingUser = await users.create({
        email,
        name,
        image,
        theme: getISTThemeDefault(),
        themeManuallySet: false,
        knownLogins: [{ city, state, deviceInfo }],
      });
      return res.status(201).json({ result: existingUser });
    }

    if (!existingUser.themeManuallySet) {
      existingUser.theme = getISTThemeDefault();
      await existingUser.save();
    }

    const known = isKnownLogin(existingUser, city, state, deviceInfo);

    if (known) {
      return res.status(200).json({ result: existingUser });
    }

    // New city/state/device -> require OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await otpModel.create({
      userid: existingUser._id,
      otp,
      city,
      state,
      deviceInfo,
      expiresAt,
    });

    await sendOtpEmail({
      toEmail: existingUser.email,
      userName: existingUser.name,
      otp,
      city,
      state,
      deviceInfo,
    });

    return res.status(202).json({
      otpRequired: true,
      userid: existingUser._id,
      message: "New login location detected. OTP sent to your email.",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const verifyLoginOtp = async (req, res) => {
  const { userid, otp } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const otpRecord = await otpModel
      .findOne({ userid, otp, verified: false })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please try logging in again." });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const user = await users.findById(userid);
    user.knownLogins.push({
      city: otpRecord.city,
      state: otpRecord.state,
      deviceInfo: otpRecord.deviceInfo,
    });
    await user.save();

    return res.status(200).json({ result: user });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateplan = async (req, res) => {
  const { id: _id } = req.params;
  const { plan } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  if (!["free", "bronze", "silver", "gold"].includes(plan)) {
    return res.status(400).json({ message: "Invalid plan value" });
  }

  try {
    const updatedUser = await users.findByIdAndUpdate(
      _id,
      { $set: { plan } },
      { new: true }
    );
    return res.status(200).json({ result: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateTheme = async (req, res) => {
  const { id: _id } = req.params;
  const { theme } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  if (!["light", "dark"].includes(theme)) {
    return res.status(400).json({ message: "Invalid theme value" });
  }

  try {
    const updatedUser = await users.findByIdAndUpdate(
      _id,
      { $set: { theme, themeManuallySet: true } },
      { new: true }
    );
    return res.status(200).json({ result: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};