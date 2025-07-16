import express from "express";
import {
  getAllUsers,
  getUsersByTiming,
  verifyUser,
  removeUser,
  getAllPayments,
  getAllSubscriptions,
  getTrainerMemberAssignments,
  assignTrainerToMember,
  getDashboardStats,
} from "../controllers/admin.controller.js";
import {
  authenticateUser,
  requireRole,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);
router.use(requireRole("admin"));

router.get("/users", getAllUsers);
router.get("/users/timing", getUsersByTiming);
router.put("/users/:userId/verify", verifyUser);
router.delete("/users/:userId", removeUser);

router.get("/payments", getAllPayments);
router.get("/subscriptions", getAllSubscriptions);

router.get("/trainer-assignments", getTrainerMemberAssignments);
router.post("/assign-trainer", assignTrainerToMember);

router.get("/dashboard-stats", getDashboardStats);

export default router;