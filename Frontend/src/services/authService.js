import axios from "axios";

// Create axios instance with base configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookie-based authentication
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    // Token is handled via httpOnly cookies, so no need to add header manually
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear any local storage and redirect to login
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Authentication service functions
const authService = {
  // Register user (initiate registration with OTP)
  initiateRegistration: async (userData) => {
    try {
      const response = await api.post("/auth/register/initiate", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Registration failed" };
    }
  },

  // Verify OTP and complete registration
  verifyOTPAndRegister: async (otpData) => {
    try {
      const response = await api.post("/auth/register/verify", otpData);
      if (response.data.success && response.data.user) {
        // Store user data in localStorage for UI state
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "OTP verification failed" };
    }
  },

  // Resend OTP
  resendOTP: async (email, name) => {
    try {
      const response = await api.post("/auth/register/resend-otp", {
        email,
        name,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to resend OTP" };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      if (response.data.success && response.data.user) {
        // Store user data in localStorage for UI state
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Login failed" };
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post("/auth/logout");
      // Clear local storage
      localStorage.removeItem("user");
      return response.data;
    } catch (error) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem("user");
      throw error.response?.data || { message: "Logout failed" };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data.success && response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      // Clear invalid user data
      localStorage.removeItem("user");
      throw error.response?.data || { message: "Failed to get user data" };
    }
  },

  // Get user from localStorage
  getStoredUser: () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      localStorage.removeItem("user");
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const user = authService.getStoredUser();
    return !!user;
  },

  // Get user role
  getUserRole: () => {
    const user = authService.getStoredUser();
    return user?.role || null;
  },
};

// Landing page data service
export const landingService = {
  // Get app statistics
  getStats: async () => {
    try {
      const response = await api.get("/stats");
      return response.data;
    } catch (error) {
      // Return fallback data if API fails
      return {
        success: true,
        stats: {
          activeUsers: 10000,
          gymsConnected: 500,
          satisfaction: 98,
          trainersCount: 150,
          activePlans: 25,
        },
      };
    }
  },

  // Get available trainers
  getTrainers: async () => {
    try {
      const response = await api.get("/trainers");
      return response.data;
    } catch (error) {
      // Return fallback data if API fails
      return {
        success: true,
        trainers: [],
      };
    }
  },

  // Get featured plans
  getPlans: async () => {
    try {
      const response = await api.get("/plans");
      return response.data;
    } catch (error) {
      // Return fallback data if API fails
      return {
        success: true,
        plans: [],
      };
    }
  },
};

export default authService;
