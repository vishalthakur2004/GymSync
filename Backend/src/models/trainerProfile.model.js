import mongoose from "mongoose";

const { Schema } = mongoose;

const trainerProfileSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        expertise: [String],
        availableTimeSlots: [
            {
            day: { type: String }, // Monday, Tuesday...
            from: { type: String, set: v => v.padStart(5, "0") }, // "09:00"
            to: { type: String, set: v => v.padStart(5, "0") },   // "11:00"
            },
        ],
        membersAssigned: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
    }
);

export default mongoose.model("TrainerProfile", trainerProfileSchema);
