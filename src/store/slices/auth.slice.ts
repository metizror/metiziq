import { publicApiPost, setAuthToken, removeAuthToken } from "@/lib/api";
import { LoginPayload, LoginSuccessResponse, LoginFailResponse, VerifyOtpPayload, VerifyOtpResponse, ResendOtpPayload, ResendOtpResponse } from "@/types/auth.types";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { saveAuthState, clearAuthState } from "@/utils/authStorage";


export interface AuthState {
  user: {
    id: string;
    email: string;
    role: "admin" | "superadmin" | "customer" | null;
    name?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    ableToBuyContacts?: boolean;
    ableToBuyCompanies?: boolean;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  isVerifyingOtp: boolean;
  isResendingOtp: boolean;
  error: string | null;
  verifiedCustomer: any | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true, // Wait for initialization from localStorage
  isVerifyingOtp: false,
  isResendingOtp: false,
  error: null,
  verifiedCustomer: null,
};

export const login = createAsyncThunk<
  LoginSuccessResponse,
  LoginPayload,
  { rejectValue: LoginFailResponse }
>("auth/login", async (data: LoginPayload, { rejectWithValue }) => {
  try {
    const response = await publicApiPost<LoginSuccessResponse | LoginFailResponse>(
      "/auth/login",
      {
        email: data.email,
        password: data.password,
      }
    );

    if ("token" in response && response.token) {
      setAuthToken(response.token);
      return response as LoginSuccessResponse;
    }

    return rejectWithValue(response as LoginFailResponse);
  } catch (error: any) {
    const failResponse: LoginFailResponse = {
      status: error.response?.data?.status || error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to login",
      customer: null,
      admin: null,
    };
    return rejectWithValue(failResponse);
  }
});

export const verifyOtp = createAsyncThunk<
  VerifyOtpResponse & { customer?: any },
  VerifyOtpPayload,
  { rejectValue: { message: string } }
>("auth/verifyOtp", async (data: VerifyOtpPayload, { rejectWithValue }) => {
  try {
    // Get email from sessionStorage if not provided in payload
    let email = data.email;
    if (!email && typeof window !== "undefined") {
      email = sessionStorage.getItem("registrationEmail") || "";
    }

    if (!email) {
      return rejectWithValue({ message: "Email not found. Please try registration again." });
    }

    const response = await publicApiPost<VerifyOtpResponse>(
      "/auth/verify-otp",
      {
        email,
        otp: data.otp,
      }
    );

    if (response.isEmailVerified) {
      // Get customer data from sessionStorage
      let customer = null;
      if (typeof window !== "undefined") {
        const storedCustomer = sessionStorage.getItem("registeredCustomer");
        if (storedCustomer) {
          try {
            customer = JSON.parse(storedCustomer);
          } catch (e) {
            console.error("Error parsing stored customer:", e);
          }
        }
      }

      return {
        ...response,
        customer,
      };
    }

    // If response doesn't have isEmailVerified: true, treat as error
    return rejectWithValue({ message: response.message || "Invalid OTP" });
  } catch (error: any) {
    // Extract error message from API response
    // handleApiError already extracts the message from error.response.data.message
    // So we can directly use error.message
    // But also check if it's still an axios error (in case handleApiError didn't process it)
    let errorMessage = "Failed to verify OTP";
    
    if (error.response?.data?.message) {
      // Still an axios error, extract directly
      errorMessage = error.response.data.message;
    } else if (error.message) {
      // Already processed by handleApiError
      errorMessage = error.message;
    }
    
    console.error("Verify OTP error:", error);
    return rejectWithValue({ message: errorMessage });
  }
});

export const resendOtp = createAsyncThunk<
  ResendOtpResponse,
  ResendOtpPayload,
  { rejectValue: { message: string } }
>("auth/resendOtp", async (data: ResendOtpPayload, { rejectWithValue }) => {
  try {
    const response = await publicApiPost<ResendOtpResponse>(
      "/auth/resend-otp",
      {
        email: data.email,
        role: data.role,
      }
    );

    return response;
  } catch (error: any) {
    // Extract error message from API response
    // handleApiError already extracts the message from error.response.data.message
    let errorMessage = "Failed to resend OTP";
    
    if (error.response?.data?.message) {
      // Still an axios error, extract directly
      errorMessage = error.response.data.message;
    } else if (error.message) {
      // Already processed by handleApiError
      errorMessage = error.message;
    }
    
    console.error("Resend OTP error:", error);
    return rejectWithValue({ message: errorMessage });
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      state.isInitializing = false;
      state.verifiedCustomer = null;
      // Remove all tokens and auth state from localStorage
      removeAuthToken();
      clearAuthState();
      // Clear all localStorage and sessionStorage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    },
    // Initialize auth from localStorage on page refresh
    initializeAuth: (state) => {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("authState");
          if (stored) {
            const storedState = JSON.parse(stored);
            if (storedState.isAuthenticated && storedState.user && storedState.token) {
              state.user = storedState.user;
              state.token = storedState.token;
              state.isAuthenticated = storedState.isAuthenticated;
              console.log("Auth state restored from localStorage:", {
                email: storedState.user?.email,
                role: storedState.user?.role,
              });
            }
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
        } finally {
          state.isInitializing = false;
        }
      } else {
        state.isInitializing = false;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearVerifiedCustomer: (state) => {
      state.verifiedCustomer = null;
    },
    resetAuthState: (state) => {
      // Reset to initial state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      state.isInitializing = false;
      state.verifiedCustomer = null;
      // Clear all sessionStorage related to registration
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("registrationEmail");
        sessionStorage.removeItem("registeredCustomer");
        sessionStorage.removeItem("canAccessOtpVerify");
      }
    },
    updateUser: (state, action: PayloadAction<{ 
      name?: string; 
      email?: string; 
      firstName?: string; 
      lastName?: string; 
      companyName?: string;
      jobTitle?: string;
      ableToBuyContacts?: boolean;
      ableToBuyCompanies?: boolean;
    }>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...(action.payload.name !== undefined && { name: action.payload.name }),
          ...(action.payload.email !== undefined && { email: action.payload.email }),
          ...(action.payload.firstName !== undefined && { firstName: action.payload.firstName }),
          ...(action.payload.lastName !== undefined && { lastName: action.payload.lastName }),
          ...(action.payload.companyName !== undefined && { companyName: action.payload.companyName }),
          ...(action.payload.ableToBuyContacts !== undefined && { ableToBuyContacts: action.payload.ableToBuyContacts }),
          ...(action.payload.ableToBuyCompanies !== undefined && { ableToBuyCompanies: action.payload.ableToBuyCompanies }),
        };
        // Update localStorage
        saveAuthState({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated });
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      const { payload } = action;
      state.isLoading = false;
      state.token = payload.token;
      state.isAuthenticated = true;
      state.user = payload.customer
        ? {
            id: payload.customer._id,
            email: payload.customer.email,
            role: "customer",
            firstName: payload.customer.firstName,
            lastName: payload.customer.lastName,
            companyName: payload.customer.companyName,
            isActive: payload.customer.isActive,
            isEmailVerified: payload.customer.isEmailVerified,
            ableToBuyContacts: (payload.customer as any).ableToBuyContacts || false,
            ableToBuyCompanies: (payload.customer as any).ableToBuyCompanies || false,
          }
        : payload.admin
        ? {
            id: payload.admin._id,
            email: payload.admin.email,
            role: payload.admin.role,
            name: payload.admin.name,
          }
        : null;
      saveAuthState({ user: state.user, token: state.token, isAuthenticated: true });
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload?.message || "Login failed";
    });
    builder.addCase(verifyOtp.pending, (state) => {
      state.isVerifyingOtp = true;
      state.error = null;
    });
    builder.addCase(verifyOtp.fulfilled, (state, action) => {
      state.isVerifyingOtp = false;
      state.error = null;
      // Update customer with verified status
      if (action.payload.customer) {
        state.verifiedCustomer = {
          ...action.payload.customer,
          isEmailVerified: true, // Mark as verified after successful OTP verification
        };
      } else {
        state.verifiedCustomer = null;
      }
      // Clear sessionStorage after successful verification
      // This prevents user from accessing OTP verify page again
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("registrationEmail");
        sessionStorage.removeItem("registeredCustomer");
        sessionStorage.removeItem("canAccessOtpVerify");
      }
    });
    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.isVerifyingOtp = false;
      state.error = action.payload?.message || "OTP verification failed";
      state.verifiedCustomer = null;
    });
    builder.addCase(resendOtp.pending, (state) => {
      state.isResendingOtp = true;
      state.error = null;
    });
    builder.addCase(resendOtp.fulfilled, (state) => {
      state.isResendingOtp = false;
      state.error = null;
    });
    builder.addCase(resendOtp.rejected, (state, action) => {
      state.isResendingOtp = false;
      state.error = action.payload?.message || "Failed to resend OTP";
    });
  },
});

export const { logout, clearError, initializeAuth, clearVerifiedCustomer, resetAuthState, updateUser } = authSlice.actions;

export default authSlice.reducer;

