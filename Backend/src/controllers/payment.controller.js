import Payment from "../models/payment.model.js";
import Plan from "../models/plan.model.js";
import User from "../models/user.model.js";

export const processPayment = async (req, res) => {
  try {
    const { planId, paymentGateway = "mock", mockSuccess = true } = req.body;
    const userId = req.user._id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const user = await User.findById(userId);

    const validTill = new Date();
    if (user.subscriptionValidTill && user.subscriptionValidTill > new Date()) {
      validTill.setTime(user.subscriptionValidTill.getTime());
    }
    validTill.setDate(validTill.getDate() + plan.durationInDays);

    const paymentStatus = mockSuccess ? "success" : "failed";
    const transactionId = `TXN_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`;

    const payment = new Payment({
      user: userId,
      plan: planId,
      amountPaid: plan.price,
      paymentStatus,
      paymentGateway,
      transactionId,
      validTill,
    });

    await payment.save();

    if (paymentStatus === "success") {
      user.subscriptionPlan = plan.name;
      user.subscriptionValidTill = validTill;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        payment,
        subscription: {
          plan: plan.name,
          validTill,
          features: plan.features,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment failed",
        payment,
      });
    }
  } catch (error) {
    console.error("Process payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status && ["success", "failed", "pending"].includes(status)) {
      query.paymentStatus = status;
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate("plan", "name price features durationInDays")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    const totalSpent = await Payment.aggregate([
      {
        $match: {
          user: userId,
          paymentStatus: "success",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amountPaid" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      payments,
      totalSpent: totalSpent[0]?.total || 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id;

    const payment = await Payment.findOne({
      _id: paymentId,
      user: userId,
    }).populate("plan", "name price features durationInDays");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate("user", "name email subscriptionPlan subscriptionValidTill")
      .populate("plan", "name");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.paymentStatus !== "success") {
      return res.status(400).json({
        success: false,
        message: "Only successful payments can be refunded",
      });
    }

    const refundCutoffDate = new Date();
    refundCutoffDate.setDate(refundCutoffDate.getDate() - 7); // 7 days refund policy

    if (payment.createdAt < refundCutoffDate) {
      return res.status(400).json({
        success: false,
        message: "Refund period has expired (7 days limit)",
      });
    }

    const user = await User.findById(payment.user._id);
    if (user.subscriptionPlan === payment.plan.name) {
      user.subscriptionPlan = null;
      user.subscriptionValidTill = null;
      await user.save();
    }

    payment.paymentStatus = "refunded";
    payment.refundReason = reason || "Refund requested";
    payment.refundedAt = new Date();
    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
      payment,
    });
  } catch (error) {
    console.error("Refund payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      userId,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    if (
      status &&
      ["success", "failed", "pending", "refunded"].includes(status)
    ) {
      query.paymentStatus = status;
    }
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate("user", "name email phone role")
      .populate("plan", "name price features")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amountPaid" },
        },
      },
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: { paymentStatus: "success" } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);

    res.status(200).json({
      success: true,
      payments,
      stats,
      totalRevenue: totalRevenue[0]?.total || 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    if (!["success", "failed", "pending", "refunded"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate("user")
      .populate("plan");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const oldStatus = payment.paymentStatus;
    payment.paymentStatus = status;

    if (status === "success" && oldStatus !== "success") {
      const user = await User.findById(payment.user._id);
      user.subscriptionPlan = payment.plan.name;
      user.subscriptionValidTill = payment.validTill;
      await user.save();
    } else if (status === "failed" || status === "refunded") {
      if (oldStatus === "success") {
        const user = await User.findById(payment.user._id);
        user.subscriptionPlan = null;
        user.subscriptionValidTill = null;
        await user.save();
      }
    }

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      payment,
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const generatePaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const report = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            status: "$paymentStatus",
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amountPaid" },
        },
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
            month: "$_id.month",
          },
          statusBreakdown: {
            $push: {
              status: "$_id.status",
              count: "$count",
              amount: "$totalAmount",
            },
          },
          totalTransactions: { $sum: "$count" },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "success"] }, "$totalAmount", 0],
            },
          },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    res.status(200).json({
      success: true,
      report,
      period: {
        startDate: startDate || "All time",
        endDate: endDate || "Present",
      },
    });
  } catch (error) {
    console.error("Generate payment report error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const checkExpiredSubscriptions = async (req, res) => {
  try {
    const today = new Date();

    const expiredUsers = await User.find({
      subscriptionValidTill: { $lt: today },
      subscriptionPlan: { $ne: null },
    });

    const updated = await User.updateMany(
      {
        subscriptionValidTill: { $lt: today },
        subscriptionPlan: { $ne: null },
      },
      {
        $set: {
          subscriptionPlan: null,
          subscriptionValidTill: null,
        },
      },
    );

    res.status(200).json({
      success: true,
      message: `${updated.modifiedCount} expired subscriptions processed`,
      expiredUsers: expiredUsers.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        expiredPlan: user.subscriptionPlan,
        expiredDate: user.subscriptionValidTill,
      })),
    });
  } catch (error) {
    console.error("Check expired subscriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};