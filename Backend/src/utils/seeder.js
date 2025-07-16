import User from "../models/user.model.js";
import Plan from "../models/plan.model.js";
import { hashPassword } from "./auth.js";
import connectDB from "../db/index.js";
import dotenv from "dotenv";

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("Connected to database for seeding...");

    // Check if plans already exist
    const existingPlans = await Plan.countDocuments();
    if (existingPlans === 0) {
      console.log("Creating default plans...");

      const basicPlan = new Plan({
        name: "basic",
        price: 999,
        durationInDays: 30,
        features: [
          "Access to gym equipment",
          "Basic workout guidelines",
          "Health tracking",
          "Monthly progress report",
        ],
      });

      const premiumPlan = new Plan({
        name: "premium",
        price: 1999,
        durationInDays: 30,
        features: [
          "Access to gym equipment",
          "Personal trainer assignment",
          "Custom workout plans",
          "Custom diet plans",
          "Direct chat with trainer",
          "Weekly progress reviews",
          "Nutrition counseling",
          "Priority booking for classes",
        ],
      });

      await basicPlan.save();
      await premiumPlan.save();
      console.log("✅ Default plans created successfully");
    } else {
      console.log("⏭️  Plans already exist, skipping plan creation");
    }

    // Check if admin user exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (!existingAdmin) {
      console.log("Creating default admin user...");

      const hashedPassword = await hashPassword("admin123");

      const adminUser = new User({
        name: "System Administrator",
        email: "admin@gym.com",
        phone: "9999999999",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
      });

      await adminUser.save();
      console.log("✅ Default admin user created successfully");
      console.log("📧 Email: admin@gym.com");
      console.log("🔑 Password: admin123");
    } else {
      console.log("⏭️  Admin user already exists, skipping admin creation");
    }

    console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run seeder if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedDatabase();
}

export default seedDatabase;
