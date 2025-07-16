import express from "express";
import {
  chooseSubscriptionPlan,
  selectPreferredTimeSlot,
  getAssignedTrainer,
  getMyPlans,
  updateMemberProfile,
  getMemberProfile,
  getAvailablePlans,
  getSubscriptionStatus,
  requestTrainerChange,
} from "../controllers/member.controller.js";
import {
  authenticateUser,
  requireRole,
  requireVerification,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);
router.use(requireRole("member"));

router.get("/profile", getMemberProfile);
router.put("/profile", updateMemberProfile);

router.get("/plans/available", getAvailablePlans);
router.post("/subscription/choose", chooseSubscriptionPlan);
router.get("/subscription/status", getSubscriptionStatus);

router.put("/time-slot", selectPreferredTimeSlot);

router.get("/trainer", getAssignedTrainer);
router.post(
  "/trainer/change-request",
  requireVerification,
  requestTrainerChange,
);

router.get("/my-plans", requireVerification, getMyPlans);

export default router;