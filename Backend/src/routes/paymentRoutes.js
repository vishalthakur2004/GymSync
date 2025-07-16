import express from "express";
import {
  processPayment,
  getPaymentHistory,
  getPaymentById,
  refundPayment,
  getAllPayments,
  updatePaymentStatus,
  generatePaymentReport,
  checkExpiredSubscriptions,
} from "../controllers/paymentController.js";
import {
  authenticateUser,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);

router.post("/process", processPayment);
router.get("/history", getPaymentHistory);
router.get("/:paymentId", getPaymentById);

router.use(requireRole("admin"));

router.get("/", getAllPayments);
router.put("/:paymentId/status", updatePaymentStatus);
router.post("/:paymentId/refund", refundPayment);
router.get("/reports/generate", generatePaymentReport);
router.post("/subscriptions/check-expired", checkExpiredSubscriptions);

export default router;
