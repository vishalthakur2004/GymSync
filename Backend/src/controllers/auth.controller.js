import User from "../models/user.model.js";
import OTP from "../models/otp.model.js";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";
import {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
} from "../utils/emailService.js";

export const initiateRegistration = async (req, res) => {
  try {
    const { name, email, phone, password, role = "member" } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or phone already exists",
      });
    }

    // Generate and save OTP
    const otpCode = generateOTP();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    const otp = new OTP({
      email,
      otp: otpCode,
    });

    await otp.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otpCode, name);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    // Store user data temporarily (you might want to use Redis or temporary storage)
    // For now, we'll store it in the session or return a temporary token
    const tempUserData = {
      name,
      email,
      phone,
      password: await hashPassword(password),
      role,
    };

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email. Please check your inbox.",
      email,
      // In production, you might want to use a more secure temporary storage
      tempData: Buffer.from(JSON.stringify(tempUserData)).toString("base64"),
    });
  } catch (error) {
    console.error("Registration initiation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp, tempData } = req.body;

    if (!email || !otp || !tempData) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and registration data are required",
      });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      await OTP.deleteMany({ email });
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsLeft: 3 - otpRecord.attempts,
      });
    }

    // Decode user data
    let userData;
    try {
      userData = JSON.parse(Buffer.from(tempData, "base64").toString());
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration data",
      });
    }

    // Verify email matches
    if (userData.email !== email) {
      return res.status(400).json({
        success: false,
        message: "Email mismatch",
      });
    }

    // Check if user was created in the meantime
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { phone: userData.phone }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or phone already exists",
      });
    }

    // Create the user
    const user = new User({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      role: userData.role,
      isVerified: true, // Set as verified since OTP is confirmed
    });

    await user.save();

    // Mark OTP as verified and delete it
    await OTP.deleteMany({ email });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    const token = generateToken(user._id, user.role);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionValidTill: user.subscriptionValidTill,
      trainerAssigned: user.trainerAssigned,
    };

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "Registration completed successfully! Welcome to GymSync!",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "Email and name are required",
      });
    }

    // Check if there's a recent OTP (prevent spam)
    const recentOTP = await OTP.findOne({
      email,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }, // 1 minute ago
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        message: "Please wait at least 1 minute before requesting a new OTP",
      });
    }

    // Generate new OTP
    const otpCode = generateOTP();

    // Delete existing OTPs for this email
    await OTP.deleteMany({ email });

    const otp = new OTP({
      email,
      otp: otpCode,
    });

    await otp.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otpCode, name);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "New verification code sent to your email",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionValidTill: user.subscriptionValidTill,
      trainerAssigned: user.trainerAssigned,
      lastLoginAt: user.lastLoginAt,
    };

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionValidTill: user.subscriptionValidTill,
      trainerAssigned: user.trainerAssigned,
      lastLoginAt: user.lastLoginAt,
    };

    res.status(200).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};