import express from "express";
import {
  getAssignedMembers,
  assignWorkoutPlan,
  assignDietPlan,
  getMemberPlans,
  updateWorkoutPlan,
  updateDietPlan,
  deleteWorkoutPlan,
  deleteDietPlan,
  getTrainerProfile,
  updateTrainerProfile,
} from "../controllers/trainerController.js";
import {
  authenticateUser,
  requireRole,
  requireVerification,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);
router.use(requireRole("trainer"));
router.use(requireVerification);

router.get("/members", getAssignedMembers);
router.get("/members/:memberId/plans", getMemberPlans);

router.post("/workout-plan", assignWorkoutPlan);
router.post("/diet-plan", assignDietPlan);

router.put("/workout-plan/:planId", updateWorkoutPlan);
router.put("/diet-plan/:planId", updateDietPlan);

router.delete("/workout-plan/:planId", deleteWorkoutPlan);
router.delete("/diet-plan/:planId", deleteDietPlan);

router.get("/profile", getTrainerProfile);
router.put("/profile", updateTrainerProfile);

export default router;
