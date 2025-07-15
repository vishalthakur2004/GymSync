import mongoose from "mongoose";

const memberProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        age: Number,
        weight: Number,
        height: Number,
        goal: {
            type: String
        }, // e.g., "weight loss", "muscle gain"
        preferredTimeSlot: [
            {
                day: { type: String }, // Monday, Tuesday...
                from: { type: String, set: v => v.padStart(5, "0") }, // "09:00"
                to: { type: String, set: v => v.padStart(5, "0") },   // "11:00"
            },
        ]
    }
);

export default mongoose.model("MemberProfile", memberProfileSchema);