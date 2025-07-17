import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../services/authService";
import toast from "react-hot-toast";

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Async thunks for auth operations
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        const response = await authService.getCurrentUser();
        if (response.success) {
          return response.user;
        } else {
          throw new Error("Invalid stored user");
        }
      }
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);

      if (response.success) {
        toast.success("Login successful! Welcome back.");
        return { user: response.user, success: true };
      } else {
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      const errorMessage = error.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  },
);

export const initiateRegistration = createAsyncThunk(
  "auth/initiateRegistration",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.initiateRegistration(userData);

      if (response.success) {
        toast.success("Verification code sent! Please check your email.");
        return {
          success: true,
          email: response.email,
          tempData: response.tempData,
        };
      } else {
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      const errorMessage =
        error.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  },
);

export const verifyOTPAndRegister = createAsyncThunk(
  "auth/verifyOTPAndRegister",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await authService.verifyOTPAndRegister(otpData);

      if (response.success) {
        toast.success("Registration successful! Welcome to GymSync!");
        return { user: response.user, success: true };
      } else {
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      const errorMessage =
        error.message || "OTP verification failed. Please try again.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  },
);

export const resendOTP = createAsyncThunk(
  "auth/resendOTP",
  async ({ email, name }, { rejectWithValue }) => {
    try {
      const response = await authService.resendOTP(email, name);

      if (response.success) {
        toast.success("New verification code sent!");
        return { success: true };
      } else {
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      const errorMessage =
        error.message || "Failed to resend OTP. Please try again.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      toast.success("Logged out successfully!");
      return null;
    } catch (error) {
      // Even if server logout fails, clear local state
      toast.success("Logged out successfully!");
      return null;
    }
  },
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Initiate Registration
      .addCase(initiateRegistration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initiateRegistration.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(initiateRegistration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Verify OTP and Register
      .addCase(verifyOTPAndRegister.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTPAndRegister.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyOTPAndRegister.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Resend OTP
      .addCase(resendOTP.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

// Helper function to get dashboard URL based on user role
export const getDashboardUrl = (role) => {
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

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;
