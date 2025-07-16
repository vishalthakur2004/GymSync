import mongoose from "mongoose";

const { Schema } = mongoose;

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3,
    },
  },
  {
    timestamps: true,
    // TTL index to automatically delete expired OTPs
    expires: "10m",
  },
);

// Index for faster queries
otpSchema.index({ email: 1, expiresAt: 1 });

export default mongoose.model("OTP", otpSchema);