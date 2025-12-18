import { ApprovalRequest } from "@/types/dashboard.types";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApiCall, privateApiPost } from "@/lib/api";

export interface GetApproveRequestsParams {
  page?: number;
  limit?: number;
}

export interface ApproveRequestsResponse {
  allCustomers: any[];
  blockedCustomers: number;
  totalUsers: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    totalBlockedCustomers: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApproveRequestPayload {
  customerId: string;
  flag: boolean;
  blockedReason?: string;
}

export interface ApproveRequestResponse {
  success?: boolean;
  message: string;
}

interface ApproveRequestsState {
  requests: ApprovalRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  stats: {
    totalCustomers: number;
    blockedCustomers: number;
  };
  isLoading: boolean;
  isRefreshing: boolean; // Background refresh indicator
  isApproving: boolean;
  isRejecting: boolean;
  error: string | null;
  // Cache tracking
  lastFetchParams: GetApproveRequestsParams | null;
  lastFetchTime: number | null;
}

const initialState: ApproveRequestsState = {
  requests: [],
  pagination: null,
  stats: {
    totalCustomers: 0,
    blockedCustomers: 0,
  },
  isLoading: false,
  isRefreshing: false,
  isApproving: false,
  isRejecting: false,
  error: null,
  lastFetchParams: null,
  lastFetchTime: null,
};

// Helper function to safely convert date to ISO string
const toISOString = (date: any): string | undefined => {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  // If it's an object with toISOString method (like Mongoose Date)
  if (typeof date.toISOString === 'function') return date.toISOString();
  return undefined;
};

// Helper function to map CustomerAuth to ApprovalRequest
const mapToApprovalRequest = (customer: any): ApprovalRequest => {
  return {
    id: customer._id?.toString() || customer.id,
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    businessEmail: customer.email || '',
    companyName: customer.companyName || '',
    status: customer.isBlocked ? 'rejected' : 'approved',
    createdAt: toISOString(customer.createdAt) || new Date().toISOString(),
    reviewedBy: customer.blockedBy || customer.reviewedBy,
    reviewedAt: toISOString(customer.updatedAt),
    notes: customer.blockedReason || customer.rejectionReason,
    isBlocked: customer.isBlocked || false,
  };
};

// Get all approve requests with pagination
export const getApproveRequests = createAsyncThunk<
  ApproveRequestsResponse,
  GetApproveRequestsParams & { background?: boolean },
  { rejectValue: { message: string } }
>('approveRequests/getApproveRequests', async (params, { rejectWithValue }) => {
  const { background, ...fetchParams } = params;
  try {
    const page = params.page || 1;
    const limit = params.limit || 25;
    
    // Use GET with query parameters
    const response = await privateApiCall<ApproveRequestsResponse>(
      `/admin/approve-request?page=${page}&limit=${limit}`
    );
    
    return { ...response, _background: background || false };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch approve requests';
    return rejectWithValue({ message: errorMessage });
  }
});

// Approve a request
export const approveRequest = createAsyncThunk<
  ApproveRequestResponse,
  { customerId: string },
  { rejectValue: { message: string } }
>('approveRequests/approveRequest', async (payload, { rejectWithValue }) => {
  try {
    // Validate customerId
    const customerId = String(payload.customerId || '').trim();
    if (!customerId || customerId === '' || customerId === 'undefined' || customerId === 'null') {
      return rejectWithValue({ message: 'Customer ID is required and must be valid' });
    }

    const requestBody: ApproveRequestPayload = {
      customerId: customerId,
      flag: true,
    };

    const response = await privateApiPost<ApproveRequestResponse>(
      '/admin/approve-request',
      requestBody
    );
    
    return response;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to approve request';
    return rejectWithValue({ message: errorMessage });
  }
});

// Block a customer
export const blockCustomer = createAsyncThunk<
  ApproveRequestResponse,
  { customerId: string; blockedReason: string; reviewedBy?: string },
  { rejectValue: { message: string } }
>('approveRequests/blockCustomer', async (payload, { rejectWithValue }) => {
  try {
    // Validate customerId
    const customerId = String(payload.customerId || '').trim();
    if (!customerId || customerId === '' || customerId === 'undefined' || customerId === 'null') {
      return rejectWithValue({ message: 'Customer ID is required and must be valid' });
    }

    if (!payload.blockedReason || payload.blockedReason.trim() === '') {
      return rejectWithValue({ message: 'Block reason is required' });
    }

    const requestBody: ApproveRequestPayload = {
      customerId: customerId,
      flag: false,
      blockedReason: payload.blockedReason.trim(),
    };

    const response = await privateApiPost<ApproveRequestResponse>(
      '/admin/approve-request',
      requestBody
    );
    
    return response;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to block customer';
    return rejectWithValue({ message: errorMessage });
  }
});

// Unblock a customer
export const unblockCustomer = createAsyncThunk<
  ApproveRequestResponse,
  { customerId: string; reviewedBy?: string },
  { rejectValue: { message: string } }
>('approveRequests/unblockCustomer', async (payload, { rejectWithValue }) => {
  try {
    // Validate customerId
    const customerId = String(payload.customerId || '').trim();
    if (!customerId || customerId === '' || customerId === 'undefined' || customerId === 'null') {
      return rejectWithValue({ message: 'Customer ID is required and must be valid' });
    }

    const requestBody: ApproveRequestPayload = {
      customerId: customerId,
      flag: true,
    };

    const response = await privateApiPost<ApproveRequestResponse>(
      '/admin/approve-request',
      requestBody
    );
    
    return response;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to unblock customer';
    return rejectWithValue({ message: errorMessage });
  }
});

const approveRequestsSlice = createSlice({
  name: 'approveRequests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    invalidateCache: (state) => {
      state.lastFetchParams = null;
      state.lastFetchTime = null;
    },
  },
  extraReducers: (builder) => {
    // Get approve requests
    builder
      .addCase(getApproveRequests.pending, (state, action) => {
        const isBackground = action.meta.arg.background || false;
        if (isBackground) {
          state.isRefreshing = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(getApproveRequests.fulfilled, (state, action) => {
        const isBackground = (action.payload as any)._background || false;
        if (isBackground) {
          state.isRefreshing = false;
        } else {
          state.isLoading = false;
        }
        // Map the API response to ApprovalRequest format
        state.requests = (action.payload.allCustomers || []).map(mapToApprovalRequest);
        state.pagination = {
          ...action.payload.pagination,
          totalCount: action.payload.totalUsers || 0,
          totalPages: Math.ceil((action.payload.totalUsers || 0) / (action.payload.pagination.limit || 25)),
        };
        state.stats = {
          totalCustomers: action.payload.totalUsers || 0,
          blockedCustomers: action.payload.blockedCustomers || 0,
        };
        // Update cache tracking (exclude background flag from params)
        const { background, ...paramsWithoutFlag } = action.meta.arg;
        state.lastFetchParams = paramsWithoutFlag;
        state.lastFetchTime = Date.now();
        state.error = null;
      })
      .addCase(getApproveRequests.rejected, (state, action) => {
        const isBackground = action.meta.arg.background || false;
        if (isBackground) {
          state.isRefreshing = false;
          // Don't clear data on background refresh failure, keep showing cached data
        } else {
          state.isLoading = false;
        }
        state.error = action.payload?.message || 'Failed to fetch approve requests';
      });

    // Approve request (kept for backward compatibility, but not used)
    builder
      .addCase(approveRequest.pending, (state) => {
        state.isApproving = true;
        state.error = null;
      })
      .addCase(approveRequest.fulfilled, (state, action) => {
        state.isApproving = false;
        state.error = null;
      })
      .addCase(approveRequest.rejected, (state, action) => {
        state.isApproving = false;
        state.error = action.payload?.message || 'Failed to approve request';
      });

    // Block customer
    builder
      .addCase(blockCustomer.pending, (state, action) => {
        state.isRejecting = true;
        state.error = null;
        // Optimistically update the customer status immediately
        const customerId = action.meta.arg.customerId;
        const requestIndex = state.requests.findIndex(
          (req) => req.id === customerId || (req as any).customerId === customerId
        );
        if (requestIndex !== -1) {
          const previousReviewedBy = state.requests[requestIndex].reviewedBy;
          // Create a new object to ensure React detects the change
          const updatedRequest = {
            ...state.requests[requestIndex],
            status: 'rejected' as const,
            isBlocked: true,
            reviewedAt: new Date().toISOString(),
            reviewedBy: action.meta.arg.reviewedBy || previousReviewedBy,
            notes: action.meta.arg.blockedReason,
          };
          // Store previous reviewedBy for rollback
          (updatedRequest as any)._previousReviewedBy = previousReviewedBy;
          state.requests[requestIndex] = updatedRequest;
        }
        // Optimistically update stats
        state.stats.blockedCustomers += 1;
      })
      .addCase(blockCustomer.fulfilled, (state) => {
        state.isRejecting = false;
        state.error = null;
        // State already updated optimistically in pending, no need to update again
      })
      .addCase(blockCustomer.rejected, (state, action) => {
        state.isRejecting = false;
        state.error = action.payload?.message || 'Failed to block customer';
        // Rollback optimistic update - restore previous state
        const customerId = action.meta.arg.customerId;
        const requestIndex = state.requests.findIndex(
          (req) => req.id === customerId || (req as any).customerId === customerId
        );
        if (requestIndex !== -1) {
          const previousReviewedBy = (state.requests[requestIndex] as any)._previousReviewedBy;
          state.requests[requestIndex] = {
            ...state.requests[requestIndex],
            status: 'approved',
            isBlocked: false,
            reviewedBy: previousReviewedBy,
            notes: undefined,
          };
          delete (state.requests[requestIndex] as any)._previousReviewedBy;
        }
        // Rollback stats
        state.stats.blockedCustomers = Math.max(0, state.stats.blockedCustomers - 1);
      });

    // Unblock customer
    builder
      .addCase(unblockCustomer.pending, (state, action) => {
        state.isApproving = true;
        state.error = null;
        // Optimistically update the customer status immediately
        const customerId = action.meta.arg.customerId;
        const requestIndex = state.requests.findIndex(
          (req) => req.id === customerId || (req as any).customerId === customerId
        );
        if (requestIndex !== -1) {
          const previousNotes = state.requests[requestIndex].notes;
          const previousReviewedBy = state.requests[requestIndex].reviewedBy;
          const updatedRequest = {
            ...state.requests[requestIndex],
            status: 'approved' as const,
            isBlocked: false,
            reviewedAt: new Date().toISOString(),
            reviewedBy: action.meta.arg.reviewedBy || previousReviewedBy,
            notes: undefined,
          };
          // Store previous values temporarily for rollback
          (updatedRequest as any)._previousNotes = previousNotes;
          (updatedRequest as any)._previousReviewedBy = previousReviewedBy;
          state.requests[requestIndex] = updatedRequest;
        }
        // Optimistically update stats
        state.stats.blockedCustomers = Math.max(0, state.stats.blockedCustomers - 1);
      })
      .addCase(unblockCustomer.fulfilled, (state) => {
        state.isApproving = false;
        state.error = null;
        // State already updated optimistically in pending, no need to update again
        // Clean up temporary _previousNotes
        state.requests.forEach((req) => {
          if ((req as any)._previousNotes !== undefined) {
            delete (req as any)._previousNotes;
          }
        });
      })
      .addCase(unblockCustomer.rejected, (state, action) => {
        state.isApproving = false;
        state.error = action.payload?.message || 'Failed to unblock customer';
        // Rollback optimistic update - restore previous state
        const customerId = action.meta.arg.customerId;
        const requestIndex = state.requests.findIndex(
          (req) => req.id === customerId || (req as any).customerId === customerId
        );
        if (requestIndex !== -1) {
          const previousNotes = (state.requests[requestIndex] as any)._previousNotes;
          const previousReviewedBy = (state.requests[requestIndex] as any)._previousReviewedBy;
          state.requests[requestIndex] = {
            ...state.requests[requestIndex],
            status: 'rejected',
            isBlocked: true,
            reviewedBy: previousReviewedBy,
            notes: previousNotes,
          };
          delete (state.requests[requestIndex] as any)._previousNotes;
          delete (state.requests[requestIndex] as any)._previousReviewedBy;
        }
        // Rollback stats
        state.stats.blockedCustomers += 1;
      });
  },
});

export const { clearError, invalidateCache } = approveRequestsSlice.actions;
export default approveRequestsSlice.reducer;

