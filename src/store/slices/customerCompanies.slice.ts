import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApiCall } from "@/lib/api";

export interface CustomerCompany {
  _id?: string;
  id?: string;
  companyName: string;
  website?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  industry?: string;
  revenue?: string;
  employeeSize?: string;
  technology?: string;
}

export interface GetCustomerCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  company?: string;
  industry?: string;
  employeeSize?: string;
  revenue?: string;
  country?: string;
  limitFilter?: string;
  excludeEmailsFile?: string; // Base64 encoded Excel file
  background?: boolean;
}

export interface CustomerCompaniesResponse {
  companies: CustomerCompany[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface CustomerCompaniesState {
  companies: CustomerCompany[];
  pagination: CustomerCompaniesResponse["pagination"] | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetchParams: GetCustomerCompaniesParams | null;
}

export const initialCustomerCompaniesState: CustomerCompaniesState = {
  companies: [],
  pagination: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetchParams: null,
};

export const getCustomerCompanies = createAsyncThunk<
  CustomerCompaniesResponse,
  GetCustomerCompaniesParams,
  { rejectValue: { message: string } }
>("customerCompanies/getCustomerCompanies", async (params, { rejectWithValue }) => {
  const { background, ...fetchParams } = params;
  try {
    const queryParts: string[] = [];
    if (fetchParams.page) queryParts.push(`page=${fetchParams.page}`);
    if (fetchParams.limit) queryParts.push(`limit=${fetchParams.limit}`);
    if (fetchParams.search) queryParts.push(`search=${encodeURIComponent(fetchParams.search)}`);
    if (fetchParams.company) queryParts.push(`company=${encodeURIComponent(fetchParams.company)}`);
    if (fetchParams.industry) queryParts.push(`industry=${encodeURIComponent(fetchParams.industry)}`);
    if (fetchParams.employeeSize) queryParts.push(`employeeSize=${encodeURIComponent(fetchParams.employeeSize)}`);
    if (fetchParams.revenue) queryParts.push(`revenue=${encodeURIComponent(fetchParams.revenue)}`);
    if (fetchParams.country) queryParts.push(`country=${encodeURIComponent(fetchParams.country)}`);
    if (fetchParams.limitFilter) queryParts.push(`limitFilter=${encodeURIComponent(fetchParams.limitFilter)}`);
    if (fetchParams.excludeEmailsFile) {
      // Base64 strings can be very long, so we need to encode them properly
      queryParts.push(`excludeEmailsFile=${encodeURIComponent(fetchParams.excludeEmailsFile)}`);
    }

    const queryString = queryParts.join("&");
    const endpoint = `/customers/company${queryString ? `?${queryString}` : ""}`;

    const response = await privateApiCall<CustomerCompaniesResponse>(endpoint);
    return { ...response, _background: background || false } as CustomerCompaniesResponse & { _background?: boolean };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch companies";
    return rejectWithValue({ message: errorMessage });
  }
});

const customerCompaniesSlice = createSlice({
  name: "customerCompanies",
  initialState: initialCustomerCompaniesState,
  reducers: {
    clearCustomerCompanies: (state) => {
      state.companies = [];
      state.pagination = null;
      state.error = null;
      state.lastFetchParams = null;
    },
    clearCompanyError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getCustomerCompanies.pending, (state, action) => {
      const isBackground = action.meta.arg.background || false;
      if (isBackground) {
        state.isRefreshing = true;
      } else {
        state.isLoading = true;
      }
      state.error = null;
    });
    builder.addCase(getCustomerCompanies.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isRefreshing = false;
      state.companies = action.payload.companies;
      state.pagination = action.payload.pagination;
      const { background, ...paramsWithoutBackground } = action.meta.arg;
      state.lastFetchParams = paramsWithoutBackground;
      state.error = null;
    });
    builder.addCase(getCustomerCompanies.rejected, (state, action) => {
      state.isLoading = false;
      state.isRefreshing = false;
      state.error = action.payload?.message || "Failed to fetch companies";
    });
  },
});

export const { clearCustomerCompanies, clearCompanyError } = customerCompaniesSlice.actions;
export default customerCompaniesSlice.reducer;

