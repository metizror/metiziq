import { Company } from "@/types/dashboard.types";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApiCall, privateApiPost, privateApiPut, privateApiDelete } from "@/lib/api";

export interface GetCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  companyName?: string;
  industry?: string;
  subIndustry?: string;
  country?: string;
  state?: string;
  revenue?: string;
  employeeSize?: string;
  technology?: string;
}

export interface CompaniesResponse {
  companies: Company[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface CompaniesState {
  companies: Company[];
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
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  // Cache tracking
  lastFetchParams: GetCompaniesParams | null;
  lastFetchTime: number | null;
}

const initialState: CompaniesState = {
  companies: [],
  pagination: null,
  isLoading: false,
  isRefreshing: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  lastFetchParams: null,
  lastFetchTime: null,
};

export const getCompanies = createAsyncThunk<
  CompaniesResponse,
  GetCompaniesParams & { background?: boolean },
  { rejectValue: { message: string } }
>('companies/getCompanies', async (params, { rejectWithValue }) => {
  const { background, ...fetchParams } = params;
  try {
    // Build query string manually
    const queryParts: string[] = [];
    
    if (params.page) queryParts.push(`page=${params.page.toString()}`);
    if (params.limit) queryParts.push(`limit=${params.limit.toString()}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.companyName) queryParts.push(`companyName=${encodeURIComponent(params.companyName)}`);
    if (params.industry) queryParts.push(`industry=${encodeURIComponent(params.industry)}`);
    if (params.subIndustry) queryParts.push(`subIndustry=${encodeURIComponent(params.subIndustry)}`);
    if (params.country) queryParts.push(`country=${encodeURIComponent(params.country)}`);
    if (params.state) queryParts.push(`state=${encodeURIComponent(params.state)}`);
    if (params.revenue) {
      // Revenue format: "$1M - $50M" (with spaces and $)
      queryParts.push(`revenue=${encodeURIComponent(params.revenue)}`);
    }
    if (params.employeeSize) {
      // EmployeeSize format: "1-50" (no spaces)
      queryParts.push(`employeeSize=${encodeURIComponent(params.employeeSize)}`);
    }
    if (params.technology) queryParts.push(`technology=${encodeURIComponent(params.technology)}`);

    const queryString = queryParts.join('&');
    const endpoint = `/admin/companies${queryString ? `?${queryString}` : ''}`;
    
    const response = await privateApiCall<CompaniesResponse>(endpoint);
    return { ...response, _background: background || false };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch companies';
    return rejectWithValue({ message: errorMessage });
  }
});

export interface CreateCompanyPayload {
  companyName: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  otherCountry?: string;
  website?: string;
  revenue?: string;
  employeeSize?: string;
  industry?: string;
  otherIndustry?: string;
  subIndustry?: string;
  technology?: string;
  companyLinkedInUrl?: string;
  amfNotes?: string;
  lastUpdateDate?: string;
}

export interface CreateCompanyResponse {
  success: boolean;
  message: string;
  company?: Company;
}

export const createCompany = createAsyncThunk<
  CreateCompanyResponse,
  CreateCompanyPayload,
  { rejectValue: { message: string } }
>('companies/createCompany', async (payload, { rejectWithValue }) => {
  try {
    // Prepare the data payload matching the API structure
    // Revenue format: "$1M - $50M" (with spaces and $)
    // EmployeeSize format: "1-50" (no spaces)
    const apiPayload = {
      data: {
        companyName: payload.companyName,
        phone: payload.phone || undefined,
        address1: payload.address1 || undefined,
        address2: payload.address2 || undefined,
        city: payload.city || undefined,
        state: payload.state || undefined,
        zipCode: payload.zipCode || undefined,
        country: payload.country || undefined,
        otherCountry: payload.country === 'Other' ? payload.otherCountry || undefined : undefined,
        website: payload.website || undefined,
        revenue: payload.revenue || undefined,
        employeeSize: payload.employeeSize || undefined,
        industry: payload.industry || undefined,
        otherIndustry: payload.industry === 'Other' ? payload.otherIndustry || undefined : undefined,
        subIndustry: payload.subIndustry || undefined,
        technology: payload.technology || undefined,
        companyLinkedInUrl: payload.companyLinkedInUrl || undefined,
        amfNotes: payload.amfNotes || undefined,
        lastUpdateDate: payload.lastUpdateDate || undefined,
      },
    };

    // Remove undefined fields
    Object.keys(apiPayload.data).forEach((key) => {
      if (apiPayload.data[key as keyof typeof apiPayload.data] === undefined) {
        delete apiPayload.data[key as keyof typeof apiPayload.data];
      }
    });

    const response = await privateApiPost<CreateCompanyResponse>('/admin/companies', apiPayload);
    return response;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create company';
    return rejectWithValue({ message: errorMessage });
  }
});

export interface UpdateCompanyPayload {
  id: string;
  companyName?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  otherCountry?: string;
  website?: string;
  revenue?: string;
  employeeSize?: string;
  industry?: string;
  otherIndustry?: string;
  subIndustry?: string;
  technology?: string;
  companyLinkedInUrl?: string;
  amfNotes?: string;
  lastUpdateDate?: string;
}

export interface UpdateCompanyResponse {
  success: boolean;
  message: string;
  company?: Company;
}

export const updateCompany = createAsyncThunk<
  UpdateCompanyResponse,
  UpdateCompanyPayload,
  { rejectValue: { message: string } }
>('companies/updateCompany', async (payload, { rejectWithValue }) => {
  try {
    // Prepare the data payload matching the API structure
    // Revenue format: "$1M - $50M" (with spaces and $)
    // EmployeeSize format: "1-50" (no spaces)
    const apiPayload = {
      data: {
        id: payload.id,
        companyName: payload.companyName || undefined,
        phone: payload.phone || undefined,
        address1: payload.address1 || undefined,
        address2: payload.address2 || undefined,
        city: payload.city || undefined,
        state: payload.state || undefined,
        zipCode: payload.zipCode || undefined,
        country: payload.country || undefined,
        otherCountry: payload.otherCountry || undefined,
        website: payload.website || undefined,
        revenue: payload.revenue || undefined,
        employeeSize: payload.employeeSize || undefined,
        industry: payload.industry || undefined,
        otherIndustry: payload.otherIndustry || undefined,
        subIndustry: payload.subIndustry || undefined,
        technology: payload.technology || undefined,
        companyLinkedInUrl: payload.companyLinkedInUrl || undefined,
        amfNotes: payload.amfNotes || undefined,
        lastUpdateDate: payload.lastUpdateDate || undefined,
      },
    };

    // Remove undefined fields
    Object.keys(apiPayload.data).forEach((key) => {
      if (apiPayload.data[key as keyof typeof apiPayload.data] === undefined) {
        delete apiPayload.data[key as keyof typeof apiPayload.data];
      }
    });

    const response = await privateApiPut<UpdateCompanyResponse>('/admin/companies', apiPayload);
    return response;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update company';
    return rejectWithValue({ message: errorMessage });
  }
});

export interface DeleteCompaniesPayload {
  ids: string[];
}

export interface DeleteCompaniesResponse {
  success: boolean;
  message: string;
  deletedCount?: number;
}

export const deleteCompanies = createAsyncThunk<
  DeleteCompaniesResponse,
  DeleteCompaniesPayload,
  { rejectValue: { message: string } }
>('companies/deleteCompanies', async (payload, { rejectWithValue }) => {
  try {
    // DELETE request with body containing ids array
    // The API expects { ids: [...] } in the request body
    const response = await privateApiDelete<DeleteCompaniesResponse>('/admin/companies', {
      data: payload,
    });
    return response;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete companies';
    return rejectWithValue({ message: errorMessage });
  }
});

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    clearCompanies: (state) => {
      state.companies = [];
      state.pagination = null;
      state.error = null;
      state.lastFetchParams = null;
      state.lastFetchTime = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    invalidateCache: (state) => {
      state.lastFetchParams = null;
      state.lastFetchTime = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getCompanies.pending, (state, action) => {
      const isBackground = action.meta.arg.background || false;
      if (isBackground) {
        state.isRefreshing = true;
      } else {
        state.isLoading = true;
      }
      state.error = null;
    });
    builder.addCase(getCompanies.fulfilled, (state, action) => {
      const isBackground = (action.payload as any)._background || false;
      if (isBackground) {
        state.isRefreshing = false;
      } else {
        state.isLoading = false;
      }
      // Map companies to ensure they have 'id' field (convert _id to id)
      // Also map createdBy from API to the company object
      state.companies = action.payload.companies.map((company: any) => ({
        ...company,
        id: company._id || company.id,
        createdBy: company.createdBy || company.addedBy || undefined,
      }));
      state.pagination = action.payload.pagination;
      // Update cache tracking (exclude background flag from params)
      const { background, ...paramsWithoutFlag } = action.meta.arg;
      state.lastFetchParams = paramsWithoutFlag;
      state.lastFetchTime = Date.now();
      state.error = null;
    });
    builder.addCase(getCompanies.rejected, (state, action) => {
      const isBackground = action.meta.arg.background || false;
      if (isBackground) {
        state.isRefreshing = false;
        // Don't clear data on background refresh failure, keep showing cached data
      } else {
        state.isLoading = false;
        state.companies = [];
        state.pagination = null;
      }
      state.error = action.payload?.message || 'Failed to fetch companies';
    });
    builder.addCase(createCompany.pending, (state) => {
      state.isCreating = true;
      state.error = null;
    });
    builder.addCase(createCompany.fulfilled, (state, action) => {
      state.isCreating = false;
      state.error = null;
      // Optimistically add the new company to the list
      if (action.payload.company) {
        const companyData = action.payload.company as any;
        const newCompany = {
          ...action.payload.company,
          id: companyData._id || action.payload.company.id,
        };
        // Add to the beginning of the list (most recent first)
        state.companies = [newCompany, ...state.companies];
        // Update pagination totalCount
        if (state.pagination) {
          state.pagination.totalCount = state.pagination.totalCount + 1;
        }
      }
    });
    builder.addCase(createCompany.rejected, (state, action) => {
      state.isCreating = false;
      state.error = action.payload?.message || 'Failed to create company';
    });
    builder.addCase(updateCompany.pending, (state) => {
      state.isUpdating = true;
      state.error = null;
    });
    builder.addCase(updateCompany.fulfilled, (state, action) => {
      state.isUpdating = false;
      state.error = null;
      // Update the specific company in the list instead of refetching all
      if (action.payload.company) {
        const updatedCompany = action.payload.company as any;
        const companyId = updatedCompany._id || updatedCompany.id || action.meta.arg.id;
        const companyIndex = state.companies.findIndex(
          (c) => (c.id === companyId) || ((c as any)._id === companyId)
        );
        if (companyIndex !== -1) {
          const mappedCompany = {
            ...updatedCompany,
            id: companyId,
          };
          state.companies[companyIndex] = mappedCompany;
        }
      }
    });
    builder.addCase(updateCompany.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.payload?.message || 'Failed to update company';
    });
    builder.addCase(deleteCompanies.pending, (state, action) => {
      state.isDeleting = true;
      state.error = null;
      // Optimistically remove companies from the state immediately
      const deletedIds = action.meta.arg.ids;
      state.companies = state.companies.filter(company => {
        const companyId = company.id || (company as any)._id;
        return !deletedIds.includes(companyId);
      });
      // Update pagination totalCount optimistically
      if (state.pagination) {
        state.pagination.totalCount = Math.max(0, state.pagination.totalCount - deletedIds.length);
      }
    });
    builder.addCase(deleteCompanies.fulfilled, (state, action) => {
      state.isDeleting = false;
      state.error = null;
      // Companies were already removed optimistically in pending
      // Just ensure pagination is correct based on actual deleted count
      if (state.pagination && action.payload.deletedCount) {
        // Adjust if actual deleted count differs from optimistic count
        const deletedIds = action.meta.arg.ids;
        const difference = action.payload.deletedCount - deletedIds.length;
        if (difference !== 0) {
          state.pagination.totalCount = Math.max(0, state.pagination.totalCount - difference);
        }
      }
    });
    builder.addCase(deleteCompanies.rejected, (state, action) => {
      state.isDeleting = false;
      state.error = action.payload?.message || 'Failed to delete companies';
      // Note: Items were already removed optimistically in pending
      // The component will handle restoration by refetching on error
    });
  },
});

export const { clearCompanies, clearError, invalidateCache } = companiesSlice.actions;
export default companiesSlice.reducer;

