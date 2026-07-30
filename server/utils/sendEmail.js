import nodemailer from "nodemailer";

const getTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendPlanConfirmationEmail = async ({
  toEmail,
  userName,
  plan,
  amount,
  paymentId,
  orderId,
  date,
}) => {
  const transporter = getTransporter();

  const amountInRupees = (amount / 100).toFixed(2);

  const mailOptions = {
    from: `"YourTube" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your YourTube ${plan} plan is now active`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #111;">Payment confirmed</h2>
        <p>Hi ${userName || "there"},</p>
        <p>Thanks for upgrading! Here are your subscription details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Plan</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; text-transform: capitalize;">${plan}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Amount paid</td>
            <td style="padding: 8px 0; text-align: right;">₹${amountInRupees}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Payment ID</td>
            <td style="padding: 8px 0; text-align: right; font-size: 12px;">${paymentId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Order ID</td>
            <td style="padding: 8px 0; text-align: right; font-size: 12px;">${orderId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Date</td>
            <td style="padding: 8px 0; text-align: right;">${date}</td>
          </tr>
        </table>
        <p style="color: #666; font-size: 13px;">This is a test transaction (Razorpay test mode). No real money was charged.</p>
        <p>Enjoy your upgraded plan!</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— The YourTube Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent to", toEmail);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};