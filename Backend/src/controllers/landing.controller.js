import Plan from "../models/plan.model.js";
import User from "../models/user.model.js";

export const getLandingData = async (req, res) => {
  try {
    const landingData = {
      heading: "Transform Your Fitness Journey with GymSync",
      subheading:
        "Your ultimate gym management platform with AI-powered workout plans, personal trainer access, and real-time chat support. Join thousands who have already transformed their lives.",
      ctaButtons: [
        {
          label: "Join Now",
          link: "/register",
          style: "primary",
        },
        {
          label: "Explore Plans",
          link: "/plans",
          style: "secondary",
        },
      ],
      heroStats: {
        activeUsers: (await User.countDocuments({ role: "member" })) || 10000,
        trainers: (await User.countDocuments({ role: "trainer" })) || 150,
        workoutsCompleted: 85000,
        satisfaction: 98,
      },
    };

    res.status(200).json({
      success: true,
      data: landingData,
      message: "Landing data retrieved successfully",
    });
  } catch (error) {
    console.error("Get landing data error:", error);

    // Return fallback data
    res.status(200).json({
      success: true,
      data: {
        heading: "Transform Your Fitness Journey with GymSync",
        subheading:
          "Your ultimate gym management platform with AI-powered workout plans, personal trainer access, and real-time chat support.",
        ctaButtons: [
          { label: "Join Now", link: "/register", style: "primary" },
          { label: "Explore Plans", link: "/plans", style: "secondary" },
        ],
        heroStats: {
          activeUsers: 10000,
          trainers: 150,
          workoutsCompleted: 85000,
          satisfaction: 98,
        },
      },
      message: "Fallback landing data provided",
    });
  }
};

export const getFeatures = async (req, res) => {
  try {
    const features = [
      {
        title: "AI-Powered Workout Plans",
        description:
          "Get personalized workout routines created by our intelligent AI system that adapts to your fitness level, goals, and progress over time.",
        icon: "🤖",
        iconUrl: "/icons/ai-workout.svg",
        highlights: [
          "Adaptive difficulty levels",
          "Goal-specific routines",
          "Progress tracking",
          "Smart recommendations",
        ],
      },
      {
        title: "Personal Trainer Access",
        description:
          "Connect with certified personal trainers who provide expert guidance, motivation, and customized training programs tailored to your needs.",
        icon: "👨‍💼",
        iconUrl: "/icons/trainer.svg",
        highlights: [
          "Certified professionals",
          "1-on-1 video sessions",
          "Custom meal plans",
          "24/7 support chat",
        ],
      },
      {
        title: "Real-Time Chat Support",
        description:
          "Get instant answers to your fitness questions through our AI chatbot or connect directly with trainers and nutritionists.",
        icon: "💬",
        iconUrl: "/icons/chat.svg",
        highlights: [
          "Instant AI responses",
          "Expert consultation",
          "Community support",
          "Progress sharing",
        ],
      },
      {
        title: "Smart Progress Tracking",
        description:
          "Monitor your fitness journey with detailed analytics, body measurements, workout logs, and achievement milestones.",
        icon: "📊",
        iconUrl: "/icons/analytics.svg",
        highlights: [
          "Detailed analytics",
          "Body composition tracking",
          "Achievement badges",
          "Weekly reports",
        ],
      },
      {
        title: "Nutrition Guidance",
        description:
          "Receive personalized meal plans and nutrition advice based on your dietary preferences, allergies, and fitness goals.",
        icon: "🥗",
        iconUrl: "/icons/nutrition.svg",
        highlights: [
          "Custom meal plans",
          "Macro tracking",
          "Recipe suggestions",
          "Dietary restrictions support",
        ],
      },
      {
        title: "Gym Integration",
        description:
          "Seamlessly connect with participating gyms to book classes, reserve equipment, and access exclusive member benefits.",
        icon: "🏋️",
        iconUrl: "/icons/gym.svg",
        highlights: [
          "Class booking",
          "Equipment reservations",
          "Member discounts",
          "Location finder",
        ],
      },
    ];

    res.status(200).json({
      success: true,
      data: features,
      message: "Features retrieved successfully",
    });
  } catch (error) {
    console.error("Get features error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve features",
    });
  }
};

export const getPlans = async (req, res) => {
  try {
    // Try to get plans from database first
    const dbPlans = await Plan.find({ isActive: true })
      .select("name description price duration features category popularity")
      .sort({ popularity: -1, price: 1 });

    let plans;

    if (dbPlans && dbPlans.length > 0) {
      plans = dbPlans.map((plan) => ({
        id: plan._id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        duration: plan.duration,
        features: plan.features || [],
        category: plan.category || "Fitness",
        popular: plan.popularity > 80,
        buttonText: "Get Started",
        buttonLink: "/register",
      }));
    } else {
      // Fallback plans if database is empty
      plans = [
        {
          id: "basic",
          name: "Basic Membership",
          description: "Perfect for beginners starting their fitness journey",
          price: 29,
          duration: "month",
          category: "Basic",
          popular: false,
          features: [
            "Access to gym facilities",
            "Basic workout plans",
            "Progress tracking",
            "Community support",
            "Mobile app access",
          ],
          buttonText: "Get Started",
          buttonLink: "/register",
        },
        {
          id: "premium",
          name: "Premium Membership",
          description: "Advanced features for serious fitness enthusiasts",
          price: 59,
          duration: "month",
          category: "Premium",
          popular: true,
          features: [
            "Everything in Basic",
            "Personal trainer access",
            "Custom meal plans",
            "AI workout recommendations",
            "Priority support",
            "Advanced analytics",
            "Video consultations",
          ],
          buttonText: "Get Started",
          buttonLink: "/register",
        },
        {
          id: "professional",
          name: "Professional Membership",
          description: "Complete fitness solution with dedicated support",
          price: 99,
          duration: "month",
          category: "Professional",
          popular: false,
          features: [
            "Everything in Premium",
            "Dedicated personal trainer",
            "Weekly video calls",
            "Custom supplement plans",
            "Injury prevention programs",
            "Nutrition counseling",
            "24/7 priority support",
            "Gym partnership discounts",
          ],
          buttonText: "Get Started",
          buttonLink: "/register",
        },
      ];
    }

    res.status(200).json({
      success: true,
      data: plans,
      message: "Subscription plans retrieved successfully",
    });
  } catch (error) {
    console.error("Get plans error:", error);

    // Return fallback plans on error
    const fallbackPlans = [
      {
        id: "basic",
        name: "Basic Membership",
        description: "Perfect for beginners",
        price: 29,
        duration: "month",
        features: ["Gym access", "Basic plans", "Progress tracking"],
        popular: false,
        buttonText: "Get Started",
        buttonLink: "/register",
      },
      {
        id: "premium",
        name: "Premium Membership",
        description: "Advanced features for enthusiasts",
        price: 59,
        duration: "month",
        features: ["Everything in Basic", "Personal trainer", "Custom plans"],
        popular: true,
        buttonText: "Get Started",
        buttonLink: "/register",
      },
    ];

    res.status(200).json({
      success: true,
      data: fallbackPlans,
      message: "Fallback plans provided",
    });
  }
};
