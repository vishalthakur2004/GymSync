import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUserAccount,
} from "../controllers/user.controller.js";
import {
  authenticateUser,
  requireVerification,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.put("/change-password", changePassword);
router.delete("/delete-account", requireVerification, deleteUserAccount);

export default router;