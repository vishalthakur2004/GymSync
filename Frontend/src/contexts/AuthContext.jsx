import { createContext, useContext, useReducer, useEffect } from "react";
import authService from "../services/authService";
import toast from "react-hot-toast";

// Auth context
const AuthContext = createContext();

// Auth states
const AUTH_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_USER: "SET_USER",
  SET_ERROR: "SET_ERROR",
  LOGOUT: "LOGOUT",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing user on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        if (storedUser) {
          // Verify user with backend
          const response = await authService.getCurrentUser();
          if (response.success) {
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.user });
          } else {
            // Invalid stored user
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        // If verification fails, clear stored user
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const response = await authService.login(credentials);

      if (response.success) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.user });
        toast.success("Login successful! Welcome back.");
        return { success: true, user: response.user };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: response.message });
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.message || "Login failed. Please try again.";
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Registration initiation function
  const initiateRegistration = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const response = await authService.initiateRegistration(userData);

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });

      if (response.success) {
        toast.success("Verification code sent! Please check your email.");
        return {
          success: true,
          email: response.email,
          tempData: response.tempData,
        };
      } else {
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage =
        error.message || "Registration failed. Please try again.";
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // OTP verification function
  const verifyOTPAndRegister = async (otpData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const response = await authService.verifyOTPAndRegister(otpData);

      if (response.success) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.user });
        toast.success("Registration successful! Welcome to GymSync!");
        return { success: true, user: response.user };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: response.message });
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage =
        error.message || "OTP verification failed. Please try again.";
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Resend OTP function
  const resendOTP = async (email, name) => {
    try {
      const response = await authService.resendOTP(email, name);

      if (response.success) {
        toast.success("New verification code sent!");
        return { success: true };
      } else {
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage =
        error.message || "Failed to resend OTP. Please try again.";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success("Logged out successfully!");
    } catch (error) {
      // Even if server logout fails, clear local state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success("Logged out successfully!");
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Get dashboard URL based on user role
  const getDashboardUrl = (role) => {
    switch (role) {
      case "admin":
        return "/dashboard/admin";
      case "trainer":
        return "/dashboard/trainer";
      case "member":
      default:
        return "/dashboard/member";
    }
  };

  const value = {
    ...state,
    login,
    logout,
    initiateRegistration,
    verifyOTPAndRegister,
    resendOTP,
    clearError,
    getDashboardUrl,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
