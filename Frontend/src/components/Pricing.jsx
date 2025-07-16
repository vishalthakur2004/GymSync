import { motion } from "framer-motion";
import { CheckIcon, StarIcon, SparklesIcon } from "@heroicons/react/24/outline";

const Pricing = () => {
  const plans = [
    {
      name: "Basic",
      price: 29,
      period: "month",
      description: "Perfect for individuals starting their fitness journey",
      features: [
        "Access to basic workout plans",
        "Community chat support",
        "Progress tracking",
        "Mobile app access",
        "Email support",
      ],
      buttonText: "Get Started",
      popular: false,
      gradient: "from-gray-600 to-gray-700",
    },
    {
      name: "Premium",
      price: 59,
      period: "month",
      description: "Best value for serious fitness enthusiasts",
      features: [
        "Everything in Basic",
        "Personal trainer access",
        "AI-powered workout plans",
        "Real-time chat support",
        "Nutrition guidance",
        "Custom meal plans",
        "Video consultations",
        "Priority support",
      ],
      buttonText: "Start Premium",
      popular: true,
      gradient: "from-blue-600 to-purple-600",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section id="pricing" className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-medium mb-6"
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            Simple Pricing
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fitness Plan
            </span>
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Start your fitness journey with our flexible plans. Upgrade or
            downgrade anytime as your fitness goals evolve.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              whileHover={{
                y: -10,
                scale: 1.02,
                transition: { duration: 0.3 },
              }}
              className={`relative ${plan.popular ? "z-10" : "z-0"}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20"
                >
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                    <StarIcon className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </motion.div>
              )}

              <div
                className={`
                bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 h-full
                ${
                  plan.popular
                    ? "border-blue-500 dark:border-blue-400"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                }
              `}
              >
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline justify-center mb-6">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-xl text-gray-600 dark:text-gray-400 ml-2">
                      /{plan.period}
                    </span>
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300
                      ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                      }
                    `}
                  >
                    {plan.buttonText}
                  </motion.button>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    What's included:
                  </h4>
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * featureIndex }}
                      className="flex items-start"
                    >
                      <CheckIcon
                        className={`
                        w-5 h-5 mr-3 mt-0.5 flex-shrink-0
                        ${
                          plan.popular
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-green-600 dark:text-green-400"
                        }
                      `}
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Money Back Guarantee */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ✨ 30-day money-back guarantee
                  </p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Need a Custom Plan?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Contact our team for enterprise solutions and custom pricing for
              gyms and fitness centers.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-300"
            >
              Contact Sales
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
