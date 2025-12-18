import { publicApiPost } from "@/lib/api";
import { 
  RegisterCustomerPayload, 
  RegisterCustomerSuccessResponse, 
  RegisterCustomerFailResponse,
  CustomerObject 
} from "@/types/auth.types";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface CustomerRegisterState {
  pending: boolean;
  error: string | null;
  customer: CustomerObject | null;
}

const initialState: CustomerRegisterState = {
  pending: false,
  error: null,
  customer: null,
};

export const registerCustomer = createAsyncThunk<
  RegisterCustomerSuccessResponse,
  RegisterCustomerPayload,
  { rejectValue: RegisterCustomerFailResponse }
>("customerRegister/register", async (data: RegisterCustomerPayload, { rejectWithValue }) => {
  try {
    console.log('registerCustomer thunk called with:', data);
    const response = await publicApiPost<RegisterCustomerSuccessResponse | RegisterCustomerFailResponse>(
      "/auth/register",
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        companyName: data.companyName,
        password: data.password,
        captchaToken: data.captchaToken,
      }
    );
    console.log('API response received:', response);

    if ("customer" in response && response.customer) {
      const successResponse: RegisterCustomerSuccessResponse = {
        status: (response as any).status || 201,
        message: response.message || "Customer registered successfully",
        customer: response.customer,
      };
      return successResponse;
    }

    console.log('Response does not contain customer, rejecting...');
    const failResponse: RegisterCustomerFailResponse = {
      status: (response as any).status || 400,
      message: response.message || "Registration failed",
      customer: null,
    };
    return rejectWithValue(failResponse);
  } catch (error: any) {
    console.error('registerCustomer API error:', error);
    const failResponse: RegisterCustomerFailResponse = {
      status: error.response?.data?.status || error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to register customer",
      customer: null,
    };
    console.log('Rejecting with:', failResponse);
    return rejectWithValue(failResponse);
  }
});

const customerRegisterSlice = createSlice({
  name: "customerRegister",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(registerCustomer.pending, (state) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(registerCustomer.fulfilled, (state, action) => {
      state.pending = false;
      state.customer = action.payload.customer;
      state.error = null;
      // No need to store OTP-related data - email verification link is sent via email
    });
    builder.addCase(registerCustomer.rejected, (state, action) => {
      state.pending = false;
      state.error = action.payload?.message || "Registration failed";
    });
  },
});

export default customerRegisterSlice.reducer;
