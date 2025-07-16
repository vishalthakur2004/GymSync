import User from "../models/user.model.js";
import MemberProfile from "../models/memberProfile.model.js";
import TrainerProfile from "../models/trainerProfile.model.js";
import { hashPassword, comparePassword } from "../utils/auth.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === "member") {
      profile = await MemberProfile.findOne({ user: user._id });
    } else if (user.role === "trainer") {
      profile = await TrainerProfile.findOne({ user: user._id }).populate(
        "membersAssigned",
        "name email",
      );
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionValidTill: user.subscriptionValidTill,
      trainerAssigned: user.trainerAssigned,
      lastLoginAt: user.lastLoginAt,
      profile,
    };

    res.status(200).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phone, ...profileData } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    if (Object.keys(updateData).length > 0) {
      const existingUser = await User.findOne({
        phone: updateData.phone,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Phone number already in use",
        });
      }

      await User.findByIdAndUpdate(userId, updateData);
    }

    if (req.user.role === "member" && Object.keys(profileData).length > 0) {
      const allowedFields = [
        "age",
        "weight",
        "height",
        "goal",
        "preferredTimeSlot",
      ];
      const memberProfileData = {};

      allowedFields.forEach((field) => {
        if (profileData[field] !== undefined) {
          memberProfileData[field] = profileData[field];
        }
      });

      if (Object.keys(memberProfileData).length > 0) {
        await MemberProfile.findOneAndUpdate(
          { user: userId },
          memberProfileData,
          { upsert: true, new: true },
        );
      }
    } else if (
      req.user.role === "trainer" &&
      Object.keys(profileData).length > 0
    ) {
      const allowedFields = ["expertise", "availableTimeSlots"];
      const trainerProfileData = {};

      allowedFields.forEach((field) => {
        if (profileData[field] !== undefined) {
          trainerProfileData[field] = profileData[field];
        }
      });

      if (Object.keys(trainerProfileData).length > 0) {
        await TrainerProfile.findOneAndUpdate(
          { user: userId },
          trainerProfileData,
          { upsert: true, new: true },
        );
      }
    }

    const updatedUser = await User.findById(userId).select("-password");
    let profile = null;

    if (updatedUser.role === "member") {
      profile = await MemberProfile.findOne({ user: userId });
    } else if (updatedUser.role === "trainer") {
      profile = await TrainerProfile.findOne({ user: userId }).populate(
        "membersAssigned",
        "name email",
      );
    }

    const userResponse = {
      ...updatedUser.toObject(),
      profile,
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(userId);
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await MemberProfile.findOneAndDelete({ user: userId });
    await TrainerProfile.findOneAndDelete({ user: userId });
    await User.findByIdAndDelete(userId);

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
