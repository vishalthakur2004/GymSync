import User from "../models/user.model.js";
import MemberProfile from "../models/memberProfile.model.js";
import TrainerProfile from "../models/trainerProfile.model.js";
import Payment from "../models/payment.model.js";

export const getAllUsers = async (req, res) => {
  try {
    const { role, isVerified, page = 1, limit = 10, search } = req.query;

    const query = {};
    if (role && role !== "all") query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select("-password")
      .populate("trainerAssigned", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUsersByTiming = async (req, res) => {
  try {
    const { day, timeFrom, timeTo } = req.query;

    if (!day) {
      return res.status(400).json({
        success: false,
        message: "Day parameter is required",
      });
    }

    const members = await MemberProfile.find({
      preferredTimeSlot: {
        $elemMatch: {
          day: day,
          ...(timeFrom && { from: { $gte: timeFrom } }),
          ...(timeTo && { to: { $lte: timeTo } }),
        },
      },
    }).populate("user", "name email phone isVerified");

    const trainers = await TrainerProfile.find({
      availableTimeSlots: {
        $elemMatch: {
          day: day,
          ...(timeFrom && { from: { $gte: timeFrom } }),
          ...(timeTo && { to: { $lte: timeTo } }),
        },
      },
    }).populate("user", "name email phone isVerified");

    res.status(200).json({
      success: true,
      data: {
        members,
        trainers,
      },
    });
  } catch (error) {
    console.error("Get users by timing error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    if (typeof isVerified !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isVerified must be a boolean value",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isVerified = isVerified;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isVerified ? "verified" : "unverified"} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Verify user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const removeUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot remove admin users",
      });
    }

    if (user.role === "trainer") {
      const trainerProfile = await TrainerProfile.findOne({ user: userId });
      if (trainerProfile && trainerProfile.membersAssigned.length > 0) {
        await User.updateMany(
          { _id: { $in: trainerProfile.membersAssigned } },
          { $unset: { trainerAssigned: 1 } },
        );
      }
      await TrainerProfile.findOneAndDelete({ user: userId });
    } else if (user.role === "member") {
      await MemberProfile.findOneAndDelete({ user: userId });

      await TrainerProfile.updateMany(
        { membersAssigned: userId },
        { $pull: { membersAssigned: userId } },
      );
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User removed successfully",
    });
  } catch (error) {
    console.error("Remove user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, userId } = req.query;

    const query = {};
    if (status && status !== "all") query.paymentStatus = status;
    if (userId) query.user = userId;

    const skip = (page - 1) * limit;
    const payments = await Payment.find(query)
      .populate("user", "name email phone role")
      .populate("plan", "name price duration")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    const totalRevenue = await Payment.aggregate([
      { $match: { paymentStatus: "success" } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);

    res.status(200).json({
      success: true,
      payments,
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

export const getAllSubscriptions = async (req, res) => {
  try {
    const { plan, isActive, page = 1, limit = 10 } = req.query;

    const query = {};
    if (plan && plan !== "all") query.subscriptionPlan = plan;
    if (isActive !== undefined) {
      if (isActive === "true") {
        query.subscriptionValidTill = { $gt: new Date() };
      } else {
        query.$or = [
          { subscriptionValidTill: { $lte: new Date() } },
          { subscriptionValidTill: null },
        ];
      }
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select(
        "name email phone role subscriptionPlan subscriptionValidTill trainerAssigned",
      )
      .populate("trainerAssigned", "name email")
      .sort({ subscriptionValidTill: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    const stats = await User.aggregate([
      {
        $group: {
          _id: "$subscriptionPlan",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      subscriptions: users,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all subscriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTrainerMemberAssignments = async (req, res) => {
  try {
    const trainers = await TrainerProfile.find()
      .populate("user", "name email phone isVerified")
      .populate(
        "membersAssigned",
        "name email phone subscriptionPlan subscriptionValidTill",
      );

    const unassignedMembers = await User.find({
      role: "member",
      trainerAssigned: { $exists: false },
    }).select("name email phone subscriptionPlan subscriptionValidTill");

    res.status(200).json({
      success: true,
      trainers,
      unassignedMembers,
    });
  } catch (error) {
    console.error("Get trainer member assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const assignTrainerToMember = async (req, res) => {
  try {
    const { memberId, trainerId } = req.body;

    if (!memberId || !trainerId) {
      return res.status(400).json({
        success: false,
        message: "Member ID and Trainer ID are required",
      });
    }

    const member = await User.findOne({ _id: memberId, role: "member" });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const trainer = await User.findOne({ _id: trainerId, role: "trainer" });
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found",
      });
    }

    if (member.trainerAssigned) {
      await TrainerProfile.findOneAndUpdate(
        { user: member.trainerAssigned },
        { $pull: { membersAssigned: memberId } },
      );
    }

    member.trainerAssigned = trainerId;
    await member.save();

    await TrainerProfile.findOneAndUpdate(
      { user: trainerId },
      { $addToSet: { membersAssigned: memberId } },
      { upsert: true },
    );

    res.status(200).json({
      success: true,
      message: "Trainer assigned to member successfully",
    });
  } catch (error) {
    console.error("Assign trainer to member error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMembers = await User.countDocuments({ role: "member" });
    const totalTrainers = await User.countDocuments({ role: "trainer" });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });

    const activeSubscriptions = await User.countDocuments({
      subscriptionValidTill: { $gt: new Date() },
    });

    const totalRevenue = await Payment.aggregate([
      { $match: { paymentStatus: "success" } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);

    const recentPayments = await Payment.find()
      .populate("user", "name email")
      .populate("plan", "name price")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalMembers,
        totalTrainers,
        verifiedUsers,
        unverifiedUsers,
        activeSubscriptions,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      recentPayments,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
