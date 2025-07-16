import express from "express";
import {
  initiateRegistration,
  verifyOTPAndRegister,
  resendOTP,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register/initiate", initiateRegistration);
router.post("/register/verify", verifyOTPAndRegister);
router.post("/register/resend-otp", resendOTP);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", authenticateUser, getCurrentUser);

export default router;
