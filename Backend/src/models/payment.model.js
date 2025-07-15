import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            required: true
        },
        amountPaid: Number,
        paymentStatus: {
            type: String,
            enum: ["success", "failed", "pending"],
            default: "pending"
        },
        paymentGateway: {
            type: String
        }, // e.g., Razorpay, Stripe
        transactionId: {
            type: String
        },
        validTill: {
            type: Date
        },
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Payment", paymentSchema);