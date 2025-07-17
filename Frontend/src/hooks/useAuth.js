import { useSelector, useDispatch } from "react-redux";
import {
  login as loginAction,
  logout as logoutAction,
  initiateRegistration as initiateRegistrationAction,
  verifyOTPAndRegister as verifyOTPAndRegisterAction,
  resendOTP as resendOTPAction,
  checkAuth,
  clearError,
  getDashboardUrl,
} from "../store/slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state) => state.auth,
  );

  const login = async (credentials) => {
    try {
      const result = await dispatch(loginAction(credentials)).unwrap();
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: error };
    }
  };

  const logout = async () => {
    await dispatch(logoutAction());
  };

  const initiateRegistration = async (userData) => {
    try {
      const result = await dispatch(
        initiateRegistrationAction(userData),
      ).unwrap();
      return {
        success: true,
        email: result.email,
        tempData: result.tempData,
      };
    } catch (error) {
      return { success: false, message: error };
    }
  };

  const verifyOTPAndRegister = async (otpData) => {
    try {
      const result = await dispatch(
        verifyOTPAndRegisterAction(otpData),
      ).unwrap();
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: error };
    }
  };

  const resendOTP = async (email, name) => {
    try {
      await dispatch(resendOTPAction({ email, name })).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, message: error };
    }
  };

  const checkAuthStatus = () => {
    dispatch(checkAuth());
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    initiateRegistration,
    verifyOTPAndRegister,
    resendOTP,
    checkAuthStatus,
    clearError: clearAuthError,
    getDashboardUrl,
  };
};
