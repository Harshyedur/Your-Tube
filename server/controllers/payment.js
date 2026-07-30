import Razorpay from "razorpay";
import crypto from "crypto";
import payment from "../Modals/payment.js";
import users from "../Modals/Auth.js";
import { PLAN_DETAILS } from "../planConfig.js";
import { sendPlanConfirmationEmail } from "../utils/sendEmail.js";

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const createOrder = async (req, res) => {
  const { userid, plan } = req.body;

  if (!["bronze", "silver", "gold"].includes(plan)) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  try {
    const amount = PLAN_DETAILS[plan].price;
    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    const newPayment = new payment({
      userid,
      plan,
      amount,
      razorpay_order_id: order.id,
      status: "created",
    });
    await newPayment.save();

    return res.status(200).json({
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ message: "Could not create order" });
  }
};

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userid,
    plan,
  } = req.body;

  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      await payment.findOneAndUpdate(
        { razorpay_order_id },
        { status: "failed" }
      );
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const updatedPayment = await payment.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: "paid",
      },
      { new: true }
    );

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const updatedUser = await users.findByIdAndUpdate(
      userid,
      { $set: { plan, planExpiresAt: expiryDate } },
      { new: true }
    );

    sendPlanConfirmationEmail({
      toEmail: updatedUser.email,
      userName: updatedUser.name,
      plan,
      amount: updatedPayment.amount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      date: new Date().toLocaleString("en-IN"),
    });

    return res.status(200).json({
      message: "Payment verified successfully",
      user: updatedUser,
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ message: "Payment verification error" });
  }
};

export const getPaymentHistory = async (req, res) => {
  const { userid } = req.params;
  try {
    const payments = await payment
      .find({ userid, status: "paid" })
      .sort({ createdAt: -1 });
    return res.status(200).json(payments);
  } catch (error) {
    console.error("Get payment history error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};