import mongoose from "mongoose";

const dietPlanSchema = new mongoose.Schema(
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
        meals: [
            {
                time: String, // Breakfast, Lunch
                foodItems: [String],
                notes: String,
            },
        ],
    },
    {
        timestamps: true
    }
);

export default mongoose.model("DietPlan", dietPlanSchema);