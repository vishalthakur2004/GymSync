import mongoose from "mongoose";

const workoutPlanSchema = new mongoose.Schema(
    {
        member: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User",
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }, // trainer
        exercises: [
            {
            name: String,
            reps: String,
            sets: String,
            day: String, // Monday, etc.
            notes: String,
            },
        ],
    }, 
    { 
        timestamps: true
    }
);

export default mongoose.model("WorkoutPlan", workoutPlanSchema);