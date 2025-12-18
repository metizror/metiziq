import { publicApiPost } from "@/lib/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface ForgotPasswordPayload {
  email: string;
  step: "send-otp" | "verify-otp" | "reset-password";
  otp?: string;
  newPassword?: string;
  role?: "superadmin" | "admin" | "customer"; // Made optional - will be determined by API
}

export interface ForgotPasswordResponse {
  message: string;
  success?: boolean;
  role?: "superadmin" | "admin" | "customer"; // Role determined by API
}

export interface ResetPasswordState {
  step: "send-otp" | "verify-otp" | "reset-password";
  email: string;
  role: "superadmin" | "admin" | "customer" | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: ResetPasswordState = {
  step: "send-otp",
  email: "",
  role: null,
  isLoading: false,
  error: null,
  success: false,
};

export const forgotPassword = createAsyncThunk<
  ForgotPasswordResponse,
  ForgotPasswordPayload,
  { rejectValue: { message: string } }
>("resetPassword/forgotPassword", async (data: ForgotPasswordPayload, { rejectWithValue }) => {
  try {
    const payload: any = {
      email: data.email,
      step: data.step,
    };
    
    // Only include role if provided (for backward compatibility)
    if (data.role) {
      payload.role = data.role;
    }

    // Add optional fields based on step
    if (data.step === "verify-otp" && data.otp) {
      payload.otp = data.otp;
    }

    if (data.step === "reset-password" && data.newPassword) {
      payload.newPassword = data.newPassword;
    }

    const response = await publicApiPost<ForgotPasswordResponse>(
      "/auth/forgot-password",
      payload
    );

    // API returns message on success, so if we have a message, consider it successful
    // The success field is optional, but if present and false, treat as failure
    if (response && response.message && (response.success !== false)) {
      return { ...response, success: true };
    }

    return rejectWithValue({ message: response?.message || "Failed to process request" });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to process request";
    return rejectWithValue({ message: errorMessage });
  }
});

const resetPasswordSlice = createSlice({
  name: "resetPassword",
  initialState,
  reducers: {
    setStep: (state, action) => {
      state.step = action.payload;
      // Store step in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("resetPasswordStep", action.payload);
      }
    },
    setEmail: (state, action) => {
      state.email = action.payload;
      // Store email in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("resetPasswordEmail", action.payload);
      }
    },
    setRole: (state, action) => {
      state.role = action.payload;
      // Store role in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("resetPasswordRole", action.payload);
      }
    },
    initializeFromStorage: (state) => {
      if (typeof window !== "undefined") {
        const storedEmail = sessionStorage.getItem("resetPasswordEmail");
        const storedRole = sessionStorage.getItem("resetPasswordRole");
        const storedStep = sessionStorage.getItem("resetPasswordStep");
        if (storedEmail) {
          state.email = storedEmail;
        }
        if (storedRole) {
          state.role = storedRole as "superadmin" | "admin" | "customer";
        }
        // Only initialize step if it's not already set or if we have a stored step
        if (storedStep && (storedStep === "send-otp" || storedStep === "verify-otp" || storedStep === "reset-password")) {
          state.step = storedStep as "send-otp" | "verify-otp" | "reset-password";
        }
      }
    },
    resetResetPasswordState: (state) => {
      state.step = "send-otp";
      state.email = "";
      state.role = null;
      state.error = null;
      state.success = false;
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("resetPasswordEmail");
        sessionStorage.removeItem("resetPasswordRole");
        sessionStorage.removeItem("resetPasswordStep");
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(forgotPassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(forgotPassword.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = null;
      state.success = true;

      // If API returns a role (from send-otp or verify-otp step), store it
      if (action.payload.role && !state.role) {
        state.role = action.payload.role;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("resetPasswordRole", action.payload.role);
        }
      }

      // Move to next step based on current step
      if (state.step === "send-otp") {
        state.step = "verify-otp";
        // Store step in sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem("resetPasswordStep", "verify-otp");
        }
      } else if (state.step === "verify-otp") {
        state.step = "reset-password";
        // Store step in sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem("resetPasswordStep", "reset-password");
        }
      }
      // If reset-password step succeeds, keep it at reset-password to show success screen
    });
    builder.addCase(forgotPassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload?.message || "Failed to process request";
      state.success = false;
    });
  },
});

export const { setStep, setEmail, setRole, initializeFromStorage, resetResetPasswordState } =
  resetPasswordSlice.actions;

export default resetPasswordSlice.reducer;

