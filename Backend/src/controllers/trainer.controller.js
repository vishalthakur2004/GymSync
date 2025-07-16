import User from "../models/user.model.js";
import TrainerProfile from "../models/trainerProfile.model.js";
import MemberProfile from "../models/memberProfile.model.js";
import WorkoutPlan from "../models/workoutPlan.model.js";
import DietPlan from "../models/dietPlan.model.js";

export const getAssignedMembers = async (req, res) => {
  try {
    const trainerId = req.user._id;

    const trainerProfile = await TrainerProfile.findOne({
      user: trainerId,
    }).populate({
      path: "membersAssigned",
      select:
        "name email phone subscriptionPlan subscriptionValidTill isVerified",
      populate: {
        path: "_id",
        model: "MemberProfile",
        localField: "_id",
        foreignField: "user",
      },
    });

    if (!trainerProfile) {
      return res.status(404).json({
        success: false,
        message: "Trainer profile not found",
      });
    }

    const membersWithProfiles = await Promise.all(
      trainerProfile.membersAssigned.map(async (member) => {
        const memberProfile = await MemberProfile.findOne({ user: member._id });
        return {
          ...member.toObject(),
          profile: memberProfile,
        };
      }),
    );

    res.status(200).json({
      success: true,
      members: membersWithProfiles,
    });
  } catch (error) {
    console.error("Get assigned members error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const assignWorkoutPlan = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const { memberId, exercises } = req.body;

    if (!memberId || !exercises || !Array.isArray(exercises)) {
      return res.status(400).json({
        success: false,
        message: "Member ID and exercises array are required",
      });
    }

    const member = await User.findOne({
      _id: memberId,
      role: "member",
      trainerAssigned: trainerId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found or not assigned to you",
      });
    }

    if (member.subscriptionPlan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "Workout plans are only available for premium members",
      });
    }

    const today = new Date();
    if (member.subscriptionValidTill && member.subscriptionValidTill < today) {
      return res.status(403).json({
        success: false,
        message: "Member's subscription has expired",
      });
    }

    const existingPlan = await WorkoutPlan.findOne({ member: memberId });

    if (existingPlan) {
      existingPlan.exercises = exercises;
      existingPlan.createdBy = trainerId;
      await existingPlan.save();

      return res.status(200).json({
        success: true,
        message: "Workout plan updated successfully",
        workoutPlan: existingPlan,
      });
    } else {
      const workoutPlan = new WorkoutPlan({
        member: memberId,
        createdBy: trainerId,
        exercises,
      });

      await workoutPlan.save();

      res.status(201).json({
        success: true,
        message: "Workout plan assigned successfully",
        workoutPlan,
      });
    }
  } catch (error) {
    console.error("Assign workout plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const assignDietPlan = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const { memberId, meals } = req.body;

    if (!memberId || !meals || !Array.isArray(meals)) {
      return res.status(400).json({
        success: false,
        message: "Member ID and meals array are required",
      });
    }

    const member = await User.findOne({
      _id: memberId,
      role: "member",
      trainerAssigned: trainerId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found or not assigned to you",
      });
    }

    if (member.subscriptionPlan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "Diet plans are only available for premium members",
      });
    }

    const today = new Date();
    if (member.subscriptionValidTill && member.subscriptionValidTill < today) {
      return res.status(403).json({
        success: false,
        message: "Member's subscription has expired",
      });
    }

    const existingPlan = await DietPlan.findOne({ member: memberId });

    if (existingPlan) {
      existingPlan.meals = meals;
      existingPlan.createdBy = trainerId;
      await existingPlan.save();

      return res.status(200).json({
        success: true,
        message: "Diet plan updated successfully",
        dietPlan: existingPlan,
      });
    } else {
      const dietPlan = new DietPlan({
        member: memberId,
        createdBy: trainerId,
        meals,
      });

      await dietPlan.save();

      res.status(201).json({
        success: true,
        message: "Diet plan assigned successfully",
        dietPlan,
      });
    }
  } catch (error) {
    console.error("Assign diet plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMemberPlans = async (req, res) => {
  try {
    const { memberId } = req.params;
    const trainerId = req.user._id;

    const member = await User.findOne({
      _id: memberId,
      role: "member",
      trainerAssigned: trainerId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found or not assigned to you",
      });
    }

    const workoutPlan = await WorkoutPlan.findOne({
      member: memberId,
    }).populate("createdBy", "name");
    const dietPlan = await DietPlan.findOne({ member: memberId }).populate(
      "createdBy",
      "name",
    );

    res.status(200).json({
      success: true,
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        subscriptionPlan: member.subscriptionPlan,
      },
      workoutPlan,
      dietPlan,
    });
  } catch (error) {
    console.error("Get member plans error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateWorkoutPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { exercises } = req.body;
    const trainerId = req.user._id;

    const workoutPlan = await WorkoutPlan.findOne({
      _id: planId,
      createdBy: trainerId,
    });

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: "Workout plan not found",
      });
    }

    if (exercises) {
      workoutPlan.exercises = exercises;
    }

    await workoutPlan.save();

    res.status(200).json({
      success: true,
      message: "Workout plan updated successfully",
      workoutPlan,
    });
  } catch (error) {
    console.error("Update workout plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateDietPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { meals } = req.body;
    const trainerId = req.user._id;

    const dietPlan = await DietPlan.findOne({
      _id: planId,
      createdBy: trainerId,
    });

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: "Diet plan not found",
      });
    }

    if (meals) {
      dietPlan.meals = meals;
    }

    await dietPlan.save();

    res.status(200).json({
      success: true,
      message: "Diet plan updated successfully",
      dietPlan,
    });
  } catch (error) {
    console.error("Update diet plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteWorkoutPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const trainerId = req.user._id;

    const workoutPlan = await WorkoutPlan.findOneAndDelete({
      _id: planId,
      createdBy: trainerId,
    });

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: "Workout plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete workout plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteDietPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const trainerId = req.user._id;

    const dietPlan = await DietPlan.findOneAndDelete({
      _id: planId,
      createdBy: trainerId,
    });

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: "Diet plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Diet plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete diet plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTrainerProfile = async (req, res) => {
  try {
    const trainerId = req.user._id;

    const trainerProfile = await TrainerProfile.findOne({ user: trainerId })
      .populate("user", "name email phone isVerified")
      .populate("membersAssigned", "name email subscriptionPlan");

    if (!trainerProfile) {
      return res.status(404).json({
        success: false,
        message: "Trainer profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile: trainerProfile,
    });
  } catch (error) {
    console.error("Get trainer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateTrainerProfile = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const { expertise, availableTimeSlots } = req.body;

    const updateData = {};
    if (expertise) updateData.expertise = expertise;
    if (availableTimeSlots) updateData.availableTimeSlots = availableTimeSlots;

    const trainerProfile = await TrainerProfile.findOneAndUpdate(
      { user: trainerId },
      updateData,
      { new: true, upsert: true },
    )
      .populate("user", "name email phone")
      .populate("membersAssigned", "name email subscriptionPlan");

    res.status(200).json({
      success: true,
      message: "Trainer profile updated successfully",
      profile: trainerProfile,
    });
  } catch (error) {
    console.error("Update trainer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};