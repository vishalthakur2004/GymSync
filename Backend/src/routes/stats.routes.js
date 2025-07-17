import express from "express";
import {
  getStats,
  getPublicTrainers,
  getPublicPlans,
} from "../controllers/stats.controller.js";

const router = express.Router();

// Public stats endpoint for landing page
router.get("/", getStats);

// Get public trainer information for landing page
router.get("/trainers", getPublicTrainers);

// Get public plans for landing page
router.get("/plans", getPublicPlans);

export default router;
