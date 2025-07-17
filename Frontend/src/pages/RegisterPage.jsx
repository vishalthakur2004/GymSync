import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";

// Validation schema
const registerSchema = yup.object({
  fullName: yup
    .string()
    .min(2, "Full name must be at least 2 characters")
    .matches(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces")
    .required("Full name is required"),
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  phone: yup
    .string()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character",
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  role: yup
    .string()
    .oneOf(["member", "trainer", "admin"], "Please select a valid role")
    .required("Role is required"),
  agreeTerms: yup
    .bool()
    .oneOf([true], "You must agree to the terms and conditions"),
});

// OTP validation schema
const otpSchema = yup.object({
  otp: yup
    .string()
    .matches(/^[0-9]{6}$/, "OTP must be exactly 6 digits")
    .required("OTP is required"),
});

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Registration form, 2: OTP verification
  const [registrationData, setRegistrationData] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const {
    initiateRegistration,
    verifyOTPAndRegister,
    resendOTP,
    isAuthenticated,
    getDashboardUrl,
  } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      navigate(getDashboardUrl(user.role));
    }
  }, [isAuthenticated, navigate, getDashboardUrl]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Registration form setup
  const registerForm = useForm({
    resolver: yupResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      role: "member",
    },
  });

  // OTP form setup
  const otpForm = useForm({
    resolver: yupResolver(otpSchema),
    mode: "onChange",
  });

  const watchedFields = registerForm.watch();
  const otpValue = otpForm.watch("otp");

  // Handle registration form submission
  const onRegisterSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = {
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
      };

      const result = await initiateRegistration(formData);
      if (result.success) {
        setRegistrationData({
          email: result.email,
          tempData: result.tempData,
          name: data.fullName,
        });
        setStep(2);
        setCountdown(60); // 60 seconds countdown for resend
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP verification
  const onOTPSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await verifyOTPAndRegister({
        email: registrationData.email,
        otp: data.otp,
        tempData: registrationData.tempData,
      });

      if (result.success) {
        navigate(getDashboardUrl(result.user.role));
      }
    } catch (error) {
      console.error("OTP verification error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    try {
      const result = await resendOTP(
        registrationData.email,
        registrationData.name,
      );
      if (result.success) {
        setCountdown(60);
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
    }
  };

  // Go back to registration form
  const goBackToRegistration = () => {
    setStep(1);
    setRegistrationData(null);
    otpForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex justify-center"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">G</span>
            </div>
          </motion.div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Join GymSync Today
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {step === 1 ? (
          // Registration Form
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
            className="mt-8 space-y-6"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="sr-only">
                  Full Name
                </label>
                <input
                  {...registerForm.register("fullName")}
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  className={`relative block w-full px-4 py-3 border ${
                    registerForm.formState.errors.fullName
                      ? "border-red-500 focus:ring-red-500"
                      : watchedFields.fullName &&
                          !registerForm.formState.errors.fullName
                        ? "border-green-500 focus:ring-green-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="Full Name"
                />
                {registerForm.formState.errors.fullName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {registerForm.formState.errors.fullName.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  {...registerForm.register("email")}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`relative block w-full px-4 py-3 border ${
                    registerForm.formState.errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : watchedFields.email &&
                          !registerForm.formState.errors.email
                        ? "border-green-500 focus:ring-green-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="Email address"
                />
                {registerForm.formState.errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {registerForm.formState.errors.email.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="sr-only">
                  Phone Number
                </label>
                <input
                  {...registerForm.register("phone")}
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className={`relative block w-full px-4 py-3 border ${
                    registerForm.formState.errors.phone
                      ? "border-red-500 focus:ring-red-500"
                      : watchedFields.phone &&
                          !registerForm.formState.errors.phone
                        ? "border-green-500 focus:ring-green-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="Phone Number"
                />
                {registerForm.formState.errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {registerForm.formState.errors.phone.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Role
                </label>
                <select
                  {...registerForm.register("role")}
                  id="role"
                  className={`relative block w-full px-4 py-3 border ${
                    registerForm.formState.errors.role
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                >
                  <option value="member">Member - Access gym facilities</option>
                  <option value="trainer">
                    Trainer - Provide training services
                  </option>
                  <option value="admin">Admin - Manage platform</option>
                </select>
                {registerForm.formState.errors.role && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {registerForm.formState.errors.role.message}
                  </motion.p>
                )}
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  {...registerForm.register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`relative block w-full px-4 py-3 pr-12 border ${
                    registerForm.formState.errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : watchedFields.password &&
                          !registerForm.formState.errors.password
                        ? "border-green-500 focus:ring-green-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="Password (8+ chars, 1 uppercase, 1 number, 1 symbol)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
                {registerForm.formState.errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {registerForm.formState.errors.password.message}
                  </motion.p>
                )}
              </div>

              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  {...registerForm.register("confirmPassword")}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`relative block w-full px-4 py-3 pr-12 border ${
                    registerForm.formState.errors.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : watchedFields.confirmPassword &&
                          !registerForm.formState.errors.confirmPassword
                        ? "border-green-500 focus:ring-green-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
                {registerForm.formState.errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {registerForm.formState.errors.confirmPassword.message}
                  </motion.p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <input
                {...registerForm.register("agreeTerms")}
                id="agree-terms"
                type="checkbox"
                className={`h-4 w-4 mt-1 rounded focus:ring-2 ${
                  registerForm.formState.errors.agreeTerms
                    ? "border-red-500 focus:ring-red-500"
                    : "text-blue-600 focus:ring-blue-500 border-gray-300"
                }`}
              />
              <div className="ml-2">
                <label
                  htmlFor="agree-terms"
                  className="block text-sm text-gray-900 dark:text-gray-300"
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  >
                    Privacy Policy
                  </a>
                </label>
                {registerForm.formState.errors.agreeTerms && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {registerForm.formState.errors.agreeTerms.message}
                  </motion.p>
                )}
              </div>
            </div>

            <div>
              <motion.button
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={!registerForm.formState.isValid || isSubmitting}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                  !registerForm.formState.isValid || isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  "Create your account"
                )}
              </motion.button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className="text-xl mr-2">🌐</span>
                  Google
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className="text-xl mr-2">📘</span>
                  Facebook
                </motion.button>
              </div>
            </div>
          </motion.form>
        ) : (
          // OTP Verification Form
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 space-y-6"
          >
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                Check your email
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                We've sent a 6-digit verification code to{" "}
                <span className="font-medium">{registrationData?.email}</span>
              </p>
            </div>

            <form
              onSubmit={otpForm.handleSubmit(onOTPSubmit)}
              className="space-y-6"
            >
              <div>
                <label htmlFor="otp" className="sr-only">
                  Verification Code
                </label>
                <input
                  {...otpForm.register("otp")}
                  id="otp"
                  type="text"
                  maxLength="6"
                  className={`relative block w-full px-4 py-3 border ${
                    otpForm.formState.errors.otp
                      ? "border-red-500 focus:ring-red-500"
                      : otpValue && !otpForm.formState.errors.otp
                        ? "border-green-500 focus:ring-green-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-center text-2xl tracking-widest`}
                  placeholder="000000"
                />
                {otpForm.formState.errors.otp && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400 text-center"
                  >
                    {otpForm.formState.errors.otp.message}
                  </motion.p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={!otpForm.formState.isValid || isSubmitting}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                  !otpForm.formState.isValid || isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  "Verify and Create Account"
                )}
              </motion.button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn't receive the code?
              </p>
              {countdown > 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Resend code in {countdown}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
                >
                  Resend verification code
                </button>
              )}
              <div>
                <button
                  type="button"
                  onClick={goBackToRegistration}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-500"
                >
                  ← Back to registration
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <div className="text-center">
            <Link
              to="/"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm font-medium"
            >
              ← Back to homepage
            </Link>
          </div>
        )}
      </motion.div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
          },
        }}
      />
    </div>
  );
};

export default RegisterPage;
