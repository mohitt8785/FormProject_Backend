import jwt from "jsonwebtoken";
import User from "../Models/userModel.js";
import { Resend } from "resend";

// Initialize Resend with API key from .env
const RESEND_KEY =
  process.env.RESEND_API_KEY || "re_5e57JxdX_GQrmAzaRQ8WmopeWwojXviLr";
const resend = new Resend(RESEND_KEY);

const STATIC_EMAIL = "01growth.project@gmail.com";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email using Resend
const sendOTPEmail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Growth Overseas <onboarding@resend.dev>", // Resend test domain
      to: email,
      subject: "Your Login OTP - Growth Overseas",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background-color: #f4f4f4; 
              padding: 20px; 
              margin: 0;
            }
            .container { 
              background-color: white; 
              padding: 30px; 
              border-radius: 10px; 
              max-width: 500px; 
              margin: 0 auto;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              color: #2563eb;
              margin-bottom: 20px;
            }
            .otp-box { 
              background-color: #f0f9ff; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px; 
              margin: 20px 0;
              border: 2px dashed #2563eb;
            }
            .otp-code { 
              font-size: 36px; 
              font-weight: bold; 
              color: #1e40af; 
              letter-spacing: 8px;
              font-family: monospace;
            }
            .footer { 
              text-align: center; 
              color: #666; 
              font-size: 12px; 
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .warning {
              background-color: #fef3c7;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #f59e0b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="header">🌍 Growth Overseas</h1>
            <h2 style="color: #374151;">Admin Login Verification</h2>
            <p>Hello Admin,</p>
            <p>Your One-Time Password (OTP) for login is:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This OTP will expire in <strong>5 minutes</strong>.
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If you didn't request this OTP, please ignore this email or contact support immediately.
            </p>
            
            <div class="footer">
              <p><strong>© 2025 Growth Overseas International Edutech</strong></p>
              <p>This is an automated email. Please do not reply.</p>
              <p style="margin-top: 10px;">🔒 Secure • 📧 Verified • ⚡ Fast</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error("Failed to send OTP email");
    }

    console.log("✅ Email sent successfully:", data);
    console.log("==========================================");
    console.log("📧 OTP SENT");
    console.log("Email:", email);
    console.log("OTP:", otp);
    console.log("==========================================");

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    // Fallback: Print OTP in console if email fails
    console.log("==========================================");
    console.log("⚠️ EMAIL FAILED - CONSOLE OTP");
    console.log("Email:", email);
    console.log("OTP:", otp);
    console.log("==========================================");
    throw new Error("Failed to send OTP email");
  }
};

export const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (email !== STATIC_EMAIL) {
      return res.status(403).json({
        message: "Unauthorized email. Only admin email is allowed.",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: "Growth Admin",
        email: email,
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      message: "OTP sent successfully to your email",
      email: email,
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    return res.status(500).json({
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    if (email !== STATIC_EMAIL) {
      return res.status(403).json({ message: "Unauthorized email" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp) {
      return res
        .status(400)
        .json({ message: "No OTP found. Please request a new OTP." });
    }

    if (user.otpExpiry < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new OTP." });
    }

    if (user.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const handleLogout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
