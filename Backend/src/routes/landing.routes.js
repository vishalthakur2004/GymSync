import express from "express";
import {
  getLandingData,
  getFeatures,
  getPlans,
} from "../controllers/landing.controller.js";

const router = express.Router();

// Get main landing page data
router.get("/", getLandingData);

// Get features for features section
router.get("/features", getFeatures);

// Get subscription plans
router.get("/plans", getPlans);

export default router;
