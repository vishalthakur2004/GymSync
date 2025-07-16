import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName} format`);
  }
};

const checkSubscriptionAccess = (user) => {
  if (user.role === "member") {
    if (user.subscriptionPlan !== "premium") {
      throw new Error("Premium subscription required for chat access");
    }

    const today = new Date();
    if (!user.subscriptionValidTill || user.subscriptionValidTill <= today) {
      throw new Error("Subscription expired. Please renew to access chat");
    }
  }
};

const validateChatParticipants = (member, trainer) => {
  if (member.role !== "member") {
    throw new Error("First participant must be a member");
  }

  if (trainer.role !== "trainer") {
    throw new Error("Second participant must be a trainer");
  }

  if (!trainer.isVerified) {
    throw new Error("Trainer must be verified to participate in chats");
  }

  if (
    !member.trainerAssigned ||
    member.trainerAssigned.toString() !== trainer._id.toString()
  ) {
    throw new Error(
      "Chat can only be initiated between assigned trainer and member",
    );
  }
};

export const initiateChat = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { participantId } = req.body;
    const currentUserId = req.user._id;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "Participant ID is required",
        code: "MISSING_PARTICIPANT_ID",
      });
    }

    validateObjectId(participantId, "Participant ID");

    if (participantId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot initiate chat with yourself",
        code: "SELF_CHAT_NOT_ALLOWED",
      });
    }

    const [currentUser, participant] = await Promise.all([
      User.findById(currentUserId).session(session),
      User.findById(participantId).session(session),
    ]);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
        code: "PARTICIPANT_NOT_FOUND",
      });
    }

    if (!currentUser.isVerified || !participant.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Both participants must be verified",
        code: "VERIFICATION_REQUIRED",
      });
    }

    let member, trainer;
    if (currentUser.role === "member") {
      member = currentUser;
      trainer = participant;
    } else if (currentUser.role === "trainer") {
      trainer = currentUser;
      member = participant;
    } else {
      return res.status(403).json({
        success: false,
        message: "Only members and trainers can initiate chats",
        code: "INVALID_USER_ROLE",
      });
    }

    validateChatParticipants(member, trainer);
    checkSubscriptionAccess(member);

    let existingChat = await Chat.findOne({
      participants: { $all: [currentUserId, participantId] },
    }).session(session);

    if (existingChat) {
      await existingChat.populate([
        {
          path: "participants",
          select: "name email role",
        },
        {
          path: "messages",
          populate: {
            path: "sender",
            select: "name role",
          },
          options: { sort: { createdAt: -1 }, limit: 50 },
        },
      ]);

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Existing chat retrieved",
        chat: existingChat,
      });
    }

    const newChat = new Chat({
      participants: [currentUserId, participantId],
      messages: [],
    });

    await newChat.save({ session });

    await newChat.populate([
      {
        path: "participants",
        select: "name email role",
      },
    ]);

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Chat initiated successfully",
      chat: newChat,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Initiate chat error:", error);

    if (
      error.message.includes("Premium subscription") ||
      error.message.includes("Subscription expired") ||
      error.message.includes("Chat can only be initiated") ||
      error.message.includes("must be a member") ||
      error.message.includes("must be a trainer") ||
      error.message.includes("must be verified")
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
        code: "ACCESS_DENIED",
      });
    }

    if (error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while initiating chat",
      code: "INTERNAL_ERROR",
    });
  } finally {
    await session.endSession();
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user._id;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID is required",
        code: "MISSING_CHAT_ID",
      });
    }

    validateObjectId(chatId, "Chat ID");

    const chat = await Chat.findOne({
      _id: chatId,
      participants: currentUserId,
    }).populate("participants", "name email role");

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or access denied",
        code: "CHAT_NOT_FOUND",
      });
    }

    const currentUser = req.user;
    if (currentUser.role === "member") {
      checkSubscriptionAccess(currentUser);
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalMessages = await Message.countDocuments({ chat: chatId });

    const otherParticipant = chat.participants.find(
      (participant) => participant._id.toString() !== currentUserId.toString(),
    );

    res.status(200).json({
      success: true,
      chat: {
        _id: chat._id,
        participants: chat.participants,
        otherParticipant,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
        hasNext: page * limit < totalMessages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get chat history error:", error);

    if (
      error.message.includes("Premium subscription") ||
      error.message.includes("Subscription expired")
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    if (error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while fetching chat history",
      code: "INTERNAL_ERROR",
    });
  }
};

export const sendMessage = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { chatId, content } = req.body;
    const senderId = req.user._id;

    if (!chatId || !content) {
      return res.status(400).json({
        success: false,
        message: "Chat ID and message content are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    validateObjectId(chatId, "Chat ID");

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty",
        code: "EMPTY_MESSAGE",
      });
    }

    if (trimmedContent.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot exceed 1000 characters",
        code: "MESSAGE_TOO_LONG",
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      participants: senderId,
    })
      .populate(
        "participants",
        "name email role subscriptionPlan subscriptionValidTill",
      )
      .session(session);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or access denied",
        code: "CHAT_NOT_FOUND",
      });
    }

    const sender = chat.participants.find(
      (p) => p._id.toString() === senderId.toString(),
    );
    if (sender.role === "member") {
      checkSubscriptionAccess(sender);
    }

    const message = new Message({
      sender: senderId,
      content: trimmedContent,
      chat: chatId,
    });

    await message.save({ session });

    await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: message._id },
        $set: { updatedAt: new Date() },
      },
      { session },
    );

    await message.populate("sender", "name role");

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        _id: message._id,
        content: message.content,
        sender: message.sender,
        chat: message.chat,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Send message error:", error);

    if (
      error.message.includes("Premium subscription") ||
      error.message.includes("Subscription expired")
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    if (
      error.message.includes("Invalid") ||
      error.message.includes("cannot be empty") ||
      error.message.includes("cannot exceed")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while sending message",
      code: "INTERNAL_ERROR",
    });
  } finally {
    await session.endSession();
  }
};

export const getUserChats = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const currentUser = req.user;
    if (currentUser.role === "member") {
      checkSubscriptionAccess(currentUser);
    }

    const skip = (page - 1) * limit;

    const chats = await Chat.find({
      participants: currentUserId,
    })
      .populate("participants", "name email role")
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 },
        populate: {
          path: "sender",
          select: "name role",
        },
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalChats = await Chat.countDocuments({
      participants: currentUserId,
    });

    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find(
        (participant) =>
          participant._id.toString() !== currentUserId.toString(),
      );

      const lastMessage = chat.messages[0] || null;

      return {
        _id: chat._id,
        otherParticipant,
        lastMessage,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      chats: formattedChats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalChats,
        pages: Math.ceil(totalChats / limit),
        hasNext: page * limit < totalChats,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get user chats error:", error);

    if (
      error.message.includes("Premium subscription") ||
      error.message.includes("Subscription expired")
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while fetching chats",
      code: "INTERNAL_ERROR",
    });
  }
};

export const deleteMessage = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { messageId } = req.params;
    const currentUserId = req.user._id;

    validateObjectId(messageId, "Message ID");

    const message = await Message.findOne({
      _id: messageId,
      sender: currentUserId,
    }).session(session);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or access denied",
        code: "MESSAGE_NOT_FOUND",
      });
    }

    const messageAge = new Date() - message.createdAt;
    const fifteenMinutes = 15 * 60 * 1000;

    if (messageAge > fifteenMinutes) {
      return res.status(403).json({
        success: false,
        message: "Messages can only be deleted within 15 minutes of sending",
        code: "DELETE_TIME_EXPIRED",
      });
    }

    await Message.findByIdAndDelete(messageId, { session });

    await Chat.findByIdAndUpdate(
      message.chat,
      { $pull: { messages: messageId } },
      { session },
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Delete message error:", error);

    if (error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while deleting message",
      code: "INTERNAL_ERROR",
    });
  } finally {
    await session.endSession();
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user._id;

    validateObjectId(chatId, "Chat ID");

    const chat = await Chat.findOne({
      _id: chatId,
      participants: currentUserId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or access denied",
        code: "CHAT_NOT_FOUND",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Messages marked as read (feature ready for real-time implementation)",
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);

    if (error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};