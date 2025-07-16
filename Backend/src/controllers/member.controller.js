import User from "../models/user.model.js";
import MemberProfile from "../models/memberProfile.model.js";
import TrainerProfile from "../models/trainerProfile.model.js";
import WorkoutPlan from "../models/workoutPlan.model.js";
import DietPlan from "../models/dietPlan.model.js";
import Plan from "../models/plan.model.js";
import Payment from "../models/payment.model.js";

export const chooseSubscriptionPlan = async (req, res) => {
  try {
    const memberId = req.user._id;
    const { planName } = req.body;

    if (!planName || !["basic", "premium"].includes(planName)) {
      return res.status(400).json({
        success: false,
        message: "Valid plan name (basic/premium) is required",
      });
    }

    const plan = await Plan.findOne({ name: planName });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const member = await User.findById(memberId);
    const validTill = new Date();
    validTill.setDate(validTill.getDate() + plan.durationInDays);

    member.subscriptionPlan = planName;
    member.subscriptionValidTill = validTill;
    await member.save();

    const payment = new Payment({
      user: memberId,
      plan: plan._id,
      amountPaid: plan.price,
      paymentStatus: "success",
      paymentGateway: "mock",
      transactionId: `TXN_${Date.now()}_${memberId}`,
      validTill,
    });

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      subscription: {
        plan: planName,
        validTill,
        features: plan.features,
      },
      payment,
    });
  } catch (error) {
    console.error("Choose subscription plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const selectPreferredTimeSlot = async (req, res) => {
  try {
    const memberId = req.user._id;
    const { preferredTimeSlot } = req.body;

    if (!preferredTimeSlot || !Array.isArray(preferredTimeSlot)) {
      return res.status(400).json({
        success: false,
        message: "Preferred time slot array is required",
      });
    }

    for (const slot of preferredTimeSlot) {
      if (!slot.day || !slot.from || !slot.to) {
        return res.status(400).json({
          success: false,
          message: "Each time slot must have day, from, and to fields",
        });
      }
    }

    const memberProfile = await MemberProfile.findOneAndUpdate(
      { user: memberId },
      { preferredTimeSlot },
      { new: true, upsert: true },
    );

    res.status(200).json({
      success: true,
      message: "Preferred time slot updated successfully",
      profile: memberProfile,
    });
  } catch (error) {
    console.error("Select preferred time slot error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAssignedTrainer = async (req, res) => {
  try {
    const memberId = req.user._id;

    const member = await User.findById(memberId).populate(
      "trainerAssigned",
      "name email phone",
    );

    if (!member.trainerAssigned) {
      return res.status(200).json({
        success: true,
        message: "No trainer assigned yet",
        trainer: null,
      });
    }

    const trainerProfile = await TrainerProfile.findOne({
      user: member.trainerAssigned._id,
    });

    const trainerData = {
      ...member.trainerAssigned.toObject(),
      profile: trainerProfile,
    };

    res.status(200).json({
      success: true,
      trainer: trainerData,
    });
  } catch (error) {
    console.error("Get assigned trainer error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMyPlans = async (req, res) => {
  try {
    const memberId = req.user._id;

    const member = await User.findById(memberId);

    if (member.subscriptionPlan !== "premium") {
      return res.status(200).json({
        success: true,
        message: "Premium subscription required for workout and diet plans",
        workoutPlan: null,
        dietPlan: null,
        subscriptionPlan: member.subscriptionPlan,
      });
    }

    const today = new Date();
    if (member.subscriptionValidTill && member.subscriptionValidTill < today) {
      return res.status(403).json({
        success: false,
        message: "Subscription expired. Please renew to access plans",
        subscriptionValidTill: member.subscriptionValidTill,
      });
    }

    const workoutPlan = await WorkoutPlan.findOne({
      member: memberId,
    }).populate("createdBy", "name email");
    const dietPlan = await DietPlan.findOne({ member: memberId }).populate(
      "createdBy",
      "name email",
    );

    res.status(200).json({
      success: true,
      workoutPlan,
      dietPlan,
      subscriptionPlan: member.subscriptionPlan,
      subscriptionValidTill: member.subscriptionValidTill,
    });
  } catch (error) {
    console.error("Get my plans error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateMemberProfile = async (req, res) => {
  try {
    const memberId = req.user._id;
    const { goal, weight, height, age, preferredTimeSlot } = req.body;

    const updateData = {};
    if (goal !== undefined) updateData.goal = goal;
    if (weight !== undefined) updateData.weight = weight;
    if (height !== undefined) updateData.height = height;
    if (age !== undefined) updateData.age = age;
    if (preferredTimeSlot !== undefined)
      updateData.preferredTimeSlot = preferredTimeSlot;

    const memberProfile = await MemberProfile.findOneAndUpdate(
      { user: memberId },
      updateData,
      { new: true, upsert: true },
    ).populate(
      "user",
      "name email phone subscriptionPlan subscriptionValidTill",
    );

    res.status(200).json({
      success: true,
      message: "Member profile updated successfully",
      profile: memberProfile,
    });
  } catch (error) {
    console.error("Update member profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMemberProfile = async (req, res) => {
  try {
    const memberId = req.user._id;

    const memberProfile = await MemberProfile.findOne({
      user: memberId,
    }).populate(
      "user",
      "name email phone subscriptionPlan subscriptionValidTill trainerAssigned",
    );

    if (!memberProfile) {
      const user = await User.findById(memberId)
        .select(
          "name email phone subscriptionPlan subscriptionValidTill trainerAssigned",
        )
        .populate("trainerAssigned", "name email");

      return res.status(200).json({
        success: true,
        profile: {
          user,
          age: null,
          weight: null,
          height: null,
          goal: null,
          preferredTimeSlot: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      profile: memberProfile,
    });
  } catch (error) {
    console.error("Get member profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAvailablePlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });

    res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Get available plans error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const memberId = req.user._id;

    const member = await User.findById(memberId).select(
      "subscriptionPlan subscriptionValidTill",
    );

    const today = new Date();
    const isActive =
      member.subscriptionValidTill && member.subscriptionValidTill > today;
    const daysRemaining = isActive
      ? Math.ceil(
          (member.subscriptionValidTill - today) / (1000 * 60 * 60 * 24),
        )
      : 0;

    const latestPayment = await Payment.findOne({ user: memberId })
      .populate("plan", "name price features")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      subscription: {
        plan: member.subscriptionPlan,
        validTill: member.subscriptionValidTill,
        isActive,
        daysRemaining,
        latestPayment,
      },
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const requestTrainerChange = async (req, res) => {
  try {
    const memberId = req.user._id;
    const { reason } = req.body;

    const member = await User.findById(memberId);

    if (!member.trainerAssigned) {
      return res.status(400).json({
        success: false,
        message: "No trainer currently assigned",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Trainer change request submitted successfully. Admin will review your request.",
      currentTrainer: member.trainerAssigned,
      reason: reason || "No reason provided",
    });
  } catch (error) {
    console.error("Request trainer change error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};