import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApiCall } from "@/lib/api";

export interface CustomerContact {
  _id?: string;
  id?: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  contact?: string; // Full name (firstName + " " + lastName)
}

export interface GetCustomerContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  companyName?: string;
  country?: string;
  industry?: string;
  revenue?: string;
  employeeSize?: string;
  limitFilter?: string;
  excludeEmailsFile?: string; // Base64 encoded Excel file
  companySort?: 1 | -1;
  jobTitleSort?: 1 | -1;
  createdAtSort?: 1 | -1;
}

export interface CustomerContactsResponse {
  contacts: CustomerContact[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface CustomerContactsState {
  contacts: CustomerContact[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  isLoading: boolean;
  isRefreshing: boolean; // Background refresh indicator
  error: string | null;
  lastFetchParams: GetCustomerContactsParams | null;
}

const initialState: CustomerContactsState = {
  contacts: [],
  pagination: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetchParams: null,
};

export const getCustomerContacts = createAsyncThunk<
  CustomerContactsResponse & { _background?: boolean },
  GetCustomerContactsParams & { background?: boolean },
  { rejectValue: { message: string } }
>('customerContacts/getCustomerContacts', async (params, { rejectWithValue }) => {
  const { background, ...fetchParams } = params;
  try {
    // Build query string manually
    const queryParts: string[] = [];
    
    if (fetchParams.page) queryParts.push(`page=${fetchParams.page.toString()}`);
    if (fetchParams.limit) queryParts.push(`limit=${fetchParams.limit.toString()}`);
    if (fetchParams.search) queryParts.push(`search=${encodeURIComponent(fetchParams.search)}`);
    if (fetchParams.companyName) queryParts.push(`companyName=${encodeURIComponent(fetchParams.companyName)}`);
    if (fetchParams.country) queryParts.push(`country=${encodeURIComponent(fetchParams.country)}`);
    if (fetchParams.industry) queryParts.push(`industry=${encodeURIComponent(fetchParams.industry)}`);
    if (fetchParams.revenue) queryParts.push(`revenue=${encodeURIComponent(fetchParams.revenue)}`);
    if (fetchParams.employeeSize) queryParts.push(`employeeSize=${encodeURIComponent(fetchParams.employeeSize)}`);
    if (fetchParams.limitFilter) queryParts.push(`limitFilter=${encodeURIComponent(fetchParams.limitFilter)}`);
    if (fetchParams.excludeEmailsFile) {
      // Base64 strings can be very long, so we need to encode them properly
      queryParts.push(`excludeEmailsFile=${encodeURIComponent(fetchParams.excludeEmailsFile)}`);
    }
    if (fetchParams.companySort) queryParts.push(`companySort=${fetchParams.companySort}`);
    if (fetchParams.jobTitleSort) queryParts.push(`jobTitleSort=${fetchParams.jobTitleSort}`);
    if (fetchParams.createdAtSort) queryParts.push(`createdAtSort=${fetchParams.createdAtSort}`);

    const queryString = queryParts.join('&');
    const endpoint = `/customers/contact${queryString ? `?${queryString}` : ''}`;
    
    const response = await privateApiCall<CustomerContactsResponse>(endpoint);
    return { ...response, _background: background || false };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch contacts';
    return rejectWithValue({ message: errorMessage });
  }
});

const customerContactsSlice = createSlice({
  name: 'customerContacts',
  initialState,
  reducers: {
    clearCustomerContacts: (state) => {
      state.contacts = [];
      state.pagination = null;
      state.error = null;
      state.lastFetchParams = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getCustomerContacts.pending, (state, action) => {
      const isBackground = action.meta.arg.background || false;
      if (isBackground) {
        state.isRefreshing = true;
      } else {
        state.isLoading = true;
      }
      state.error = null;
    });
    builder.addCase(getCustomerContacts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isRefreshing = false;
      state.contacts = action.payload.contacts;
      state.pagination = action.payload.pagination;
      // Store params without background flag
      const { background, ...paramsWithoutBackground } = action.meta.arg;
      state.lastFetchParams = paramsWithoutBackground;
      state.error = null;
    });
    builder.addCase(getCustomerContacts.rejected, (state, action) => {
      state.isLoading = false;
      state.isRefreshing = false;
      state.error = action.payload?.message || 'Failed to fetch contacts';
    });
  },
});

export const { clearCustomerContacts, clearError } = customerContactsSlice.actions;
export default customerContactsSlice.reducer;

