import Plan from "../models/plan.model.js";
import User from "../models/user.model.js";
import Payment from "../models/payment.model.js";

export const createPlan = async (req, res) => {
  try {
    const { name, price, durationInDays, features } = req.body;

    if (!name || !price || !durationInDays) {
      return res.status(400).json({
        success: false,
        message: "Name, price, and duration are required",
      });
    }

    if (!["basic", "premium"].includes(name)) {
      return res.status(400).json({
        success: false,
        message: "Plan name must be either 'basic' or 'premium'",
      });
    }

    const existingPlan = await Plan.findOne({ name });
    if (existingPlan) {
      return res.status(409).json({
        success: false,
        message: "Plan with this name already exists",
      });
    }

    const plan = new Plan({
      name,
      price,
      durationInDays,
      features: features || [],
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Create plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });

    const plansWithStats = await Promise.all(
      plans.map(async (plan) => {
        const subscriberCount = await User.countDocuments({
          subscriptionPlan: plan.name,
        });

        const activeSubscribers = await User.countDocuments({
          subscriptionPlan: plan.name,
          subscriptionValidTill: { $gt: new Date() },
        });

        const totalRevenue = await Payment.aggregate([
          {
            $match: {
              plan: plan._id,
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

        return {
          ...plan.toObject(),
          stats: {
            totalSubscribers: subscriberCount,
            activeSubscribers,
            totalRevenue: totalRevenue[0]?.total || 0,
          },
        };
      }),
    );

    res.status(200).json({
      success: true,
      plans: plansWithStats,
    });
  } catch (error) {
    console.error("Get all plans error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPlanById = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const subscriberCount = await User.countDocuments({
      subscriptionPlan: plan.name,
    });

    const activeSubscribers = await User.countDocuments({
      subscriptionPlan: plan.name,
      subscriptionValidTill: { $gt: new Date() },
    });

    const recentSubscribers = await User.find({
      subscriptionPlan: plan.name,
    })
      .select("name email subscriptionValidTill createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      plan: {
        ...plan.toObject(),
        stats: {
          totalSubscribers: subscriberCount,
          activeSubscribers,
          recentSubscribers,
        },
      },
    });
  } catch (error) {
    console.error("Get plan by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { price, durationInDays, features } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    if (price !== undefined) plan.price = price;
    if (durationInDays !== undefined) plan.durationInDays = durationInDays;
    if (features !== undefined) plan.features = features;

    await plan.save();

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Update plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const subscribersCount = await User.countDocuments({
      subscriptionPlan: plan.name,
    });

    if (subscribersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. ${subscribersCount} users are currently subscribed to this plan.`,
      });
    }

    await Plan.findByIdAndDelete(planId);

    res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const subscribeToPlan = async (req, res) => {
  try {
    const { planId } = req.body;
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

    const currentDate = new Date();
    let newValidTill;

    if (
      user.subscriptionValidTill &&
      user.subscriptionValidTill > currentDate
    ) {
      newValidTill = new Date(user.subscriptionValidTill);
      newValidTill.setDate(newValidTill.getDate() + plan.durationInDays);
    } else {
      newValidTill = new Date(currentDate);
      newValidTill.setDate(newValidTill.getDate() + plan.durationInDays);
    }

    user.subscriptionPlan = plan.name;
    user.subscriptionValidTill = newValidTill;
    await user.save();

    const payment = new Payment({
      user: userId,
      plan: planId,
      amountPaid: plan.price,
      paymentStatus: "success",
      paymentGateway: "mock",
      transactionId: `TXN_${Date.now()}_${userId}`,
      validTill: newValidTill,
    });

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Successfully subscribed to plan",
      subscription: {
        plan: plan.name,
        validTill: newValidTill,
        features: plan.features,
        amountPaid: plan.price,
      },
      payment,
    });
  } catch (error) {
    console.error("Subscribe to plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const checkSubscriptionAccess = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    const currentDate = new Date();

    if (!user.subscriptionPlan) {
      return res.status(200).json({
        success: true,
        hasAccess: false,
        message: "No active subscription",
        subscriptionPlan: null,
      });
    }

    if (
      !user.subscriptionValidTill ||
      user.subscriptionValidTill <= currentDate
    ) {
      user.subscriptionPlan = null;
      user.subscriptionValidTill = null;
      await user.save();

      return res.status(200).json({
        success: true,
        hasAccess: false,
        message: "Subscription expired",
        subscriptionPlan: null,
      });
    }

    const daysRemaining = Math.ceil(
      (user.subscriptionValidTill - currentDate) / (1000 * 60 * 60 * 24),
    );

    res.status(200).json({
      success: true,
      hasAccess: true,
      subscriptionPlan: user.subscriptionPlan,
      validTill: user.subscriptionValidTill,
      daysRemaining,
      features: await Plan.findOne({ name: user.subscriptionPlan }).select(
        "features",
      ),
    });
  } catch (error) {
    console.error("Check subscription access error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const payments = await Payment.find({ user: userId })
      .populate("plan", "name price features")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get subscription history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
