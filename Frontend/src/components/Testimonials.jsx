import { motion } from "framer-motion";
import { StarIcon, QuoteIcon } from "@heroicons/react/24/solid";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Fitness Enthusiast",
      image: "👩‍💼",
      rating: 5,
      content:
        "GymSync has completely transformed my fitness journey. The AI-powered workout plans adapt to my progress, and having access to personal trainers through the app is incredible. I've never been more motivated!",
      highlight: "Lost 25 lbs in 3 months",
    },
    {
      id: 2,
      name: "Mike Rodriguez",
      role: "Gym Owner",
      image: "👨‍💼",
      rating: 5,
      content:
        "As a gym owner, GymSync has revolutionized how we manage our members. The real-time chat support and member engagement features have significantly improved our retention rates.",
      highlight: "40% increase in member retention",
    },
    {
      id: 3,
      name: "Emily Chen",
      role: "Personal Trainer",
      image: "👩‍🏫",
      rating: 5,
      content:
        "The platform makes it so easy to connect with clients and track their progress. The AI assistant helps me create better nutrition plans, and my clients love the convenience of having everything in one place.",
      highlight: "Manages 50+ clients efficiently",
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
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
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
            className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm font-medium mb-6"
          >
            <StarIcon className="w-4 h-4 mr-2" />
            Success Stories
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            What Our{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Users Say
            </span>
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join thousands of satisfied users who have transformed their fitness
            journey with GymSync. Here's what they have to say about their
            experience.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              variants={cardVariants}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 h-full relative overflow-hidden">
                {/* Quote Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute top-4 right-4 opacity-10"
                >
                  <QuoteIcon className="w-16 h-16 text-blue-600" />
                </motion.div>

                {/* Rating Stars */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center mb-4"
                >
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * i, type: "spring" }}
                    >
                      <StarIcon className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Testimonial Content */}
                <motion.blockquote
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed relative z-10"
                >
                  "{testimonial.content}"
                </motion.blockquote>

                {/* Highlight */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-6"
                >
                  <p className="text-blue-800 dark:text-blue-300 font-semibold text-sm">
                    ✨ {testimonial.highlight}
                  </p>
                </motion.div>

                {/* User Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-2xl mr-4">
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </motion.div>

                {/* Hover Effect Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  4.9/5
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Average Rating
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: "spring" }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  2,500+
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Happy Reviews
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, type: "spring" }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  98%
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Would Recommend
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
