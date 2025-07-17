import { motion } from "framer-motion";
import { ChevronRightIcon, PlayIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { landingService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
import Lottie from "lottie-react";

const Hero = () => {
  const [stats, setStats] = useState({
    activeUsers: 10000,
    gymsConnected: 500,
    satisfaction: 98,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const { isAuthenticated, getDashboardUrl } = useAuth();
  const navigate = useNavigate();

  // Fetch real-time stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await landingService.getStats();
        if (response.success) {
          setStats({
            activeUsers: response.stats.activeUsers,
            gymsConnected: response.stats.gymsConnected,
            satisfaction: response.stats.satisfaction,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        // Keep fallback stats
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Handle CTA button click
  const handleJoinNow = () => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      navigate(getDashboardUrl(user.role));
    } else {
      navigate("/register");
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  // Number animation
  const AnimatedNumber = ({ value, suffix = "" }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (isStatsLoading) return;

      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [value, isStatsLoading]);

    const formatNumber = (num) => {
      if (num >= 1000) {
        return (num / 1000).toFixed(0) + "K";
      }
      return num.toString();
    };

    return (
      <span>
        {isStatsLoading ? "..." : formatNumber(displayValue)}
        {suffix}
      </span>
    );
  };
  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 pt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          {/* Left Content */}
          <motion.div
            variants={itemVariants}
            className="text-center lg:text-left"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium mb-6"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Transform Your Fitness Journey
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GymSync
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
            >
              Your ultimate gym management platform with AI-powered workout
              plans, personal trainer access, and real-time chat support.
              Transform your fitness journey with smart technology.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleJoinNow}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center group"
              >
                {isAuthenticated ? "Go to Dashboard" : "Join Now"}
                <ChevronRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/plans")}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center"
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                Explore Plans
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center"
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                Watch Demo
              </motion.button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-12 flex items-center justify-center lg:justify-start space-x-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  <AnimatedNumber value={stats.activeUsers} />+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  <AnimatedNumber value={stats.gymsConnected} />+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Gyms Connected
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  <AnimatedNumber value={stats.satisfaction} suffix="%" />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Satisfaction
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Animation */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-3xl transform scale-150"></div>

              {/* Animation Container */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotateY: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10 w-80 h-80 md:w-96 md:h-96"
              >
                {/* Simplified workout illustration */}
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <div className="text-center space-y-4">
                    {/* Animated dumbbell */}
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-6xl"
                    >
                      🏋️‍♂️
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                    >
                      Get Fit Smart
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute top-10 -left-10 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-80 blur-xl"
              ></motion.div>

              <motion.div
                animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute bottom-10 -right-10 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-60 blur-lg"
              >
                {" "}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
