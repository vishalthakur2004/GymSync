import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ["basic", "premium"],
    required: true
  },
  price: Number,
  durationInDays: Number,
  features: [String],
});

export default mongoose.model("Plan", planSchema);