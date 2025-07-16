import { useState } from "react";

const RegisterForm = () => {
  const [step, setStep] = useState(1); // 1: Registration form, 2: OTP verification
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "member",
  });
  const [otpData, setOtpData] = useState({
    otp: "",
    tempData: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error when user types
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\\D/g, "").slice(0, 6); // Only numbers, max 6 digits
    setOtpData((prev) => ({
      ...prev,
      otp: value,
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:4000/api/auth/register/initiate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (data.success) {
        setOtpData((prev) => ({
          ...prev,
          tempData: data.tempData,
          email: data.email,
        }));
        setStep(2);
        setSuccess("Verification code sent to your email!");
        startCountdown();
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otpData.otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:4000/api/auth/register/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: otpData.email,
            otp: otpData.otp,
            tempData: otpData.tempData,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("Registration completed successfully! Welcome to GymSync!");
        // You can redirect to dashboard or login here
        setTimeout(() => {
          // Reset form or redirect
          window.location.reload();
        }, 2000);
      } else {
        setError(data.message || "OTP verification failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("OTP verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:4000/api/auth/register/resend-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: otpData.email,
            name: formData.name,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("New verification code sent!");
        startCountdown();
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("Resend OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const goBack = () => {
    setStep(1);
    setOtpData({ otp: "", tempData: "", email: "" });
    setError("");
    setSuccess("");
  };

  if (step === 1) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <div className="registration-header">
            <h2>🏋️ Join GymSync</h2>
            <p>Start your fitness journey today</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="registration-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">I am a</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="member">Member</option>
                <option value="trainer">Trainer</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password (min 6 characters)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button
              type="submit"
              disabled={loading}
              className="register-button"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>

          <div className="login-link">
            Already have an account? <a href="#login">Sign in</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <h2>📧 Verify Your Email</h2>
          <p>
            We've sent a 6-digit code to <strong>{otpData.email}</strong>
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} className="otp-form">
          <div className="form-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              type="text"
              id="otp"
              value={otpData.otp}
              onChange={handleOtpChange}
              placeholder="Enter 6-digit code"
              className="otp-input"
              maxLength="6"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button
            type="submit"
            disabled={loading || otpData.otp.length !== 6}
            className="verify-button"
          >
            {loading ? "Verifying..." : "Verify & Complete Registration"}
          </button>
        </form>

        <div className="otp-actions">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={countdown > 0 || loading}
            className="resend-button"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
          </button>

          <button type="button" onClick={goBack} className="back-button">
            ← Back to Registration
          </button>
        </div>

        <div className="otp-info">
          <p>📍 Check your spam folder if you don't see the email</p>
          <p>⏰ Code expires in 10 minutes</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
