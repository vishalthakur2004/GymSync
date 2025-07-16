import express from "express";
import {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  subscribeToPlan,
  checkSubscriptionAccess,
  getSubscriptionHistory,
} from "../controllers/planController.js";
import {
  authenticateUser,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllPlans);
router.get("/:planId", getPlanById);

router.use(authenticateUser);

router.post("/subscribe", subscribeToPlan);
router.get("/access/check", checkSubscriptionAccess);
router.get("/subscription/history", getSubscriptionHistory);

router.use(requireRole("admin"));

router.post("/", createPlan);
router.put("/:planId", updatePlan);
router.delete("/:planId", deletePlan);

export default router;
