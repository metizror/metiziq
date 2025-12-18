import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApiCall, privateApiPost, privateApiPut, privateApiDelete } from "@/lib/api";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  isActive?: boolean;
}

export interface GetAdminUsersParams {
  page?: number;
  limit?: number;
}

export interface AdminUsersResponse {
  admins: Array<{
    _id: string;
    name: string;
    email: string;
    role: "admin" | "superadmin";
    isActive?: boolean;
  }>;
  totalAdmins: number;
  totalPages: number;
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  password: string;
  role: "admin" | "superadmin";
}

export interface CreateAdminUserResponse {
  message: string;
  admin: {
    email: string;
    name: string;
    role: string;
  };
}

export interface UpdateAdminUserPayload {
  id: string;
  name?: string;
  email?: string;
  role?: "admin" | "superadmin";
  isActive?: boolean;
}

export interface UpdateAdminUserResponse {
  message: string;
}

export interface DeleteAdminUserPayload {
  id: string;
}

export interface DeleteAdminUserResponse {
  message: string;
}

interface AdminUsersState {
  users: AdminUser[];
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
  lastFetchParams: GetAdminUsersParams | null;
  lastFetchTime: number | null;
}

const initialState: AdminUsersState = {
  users: [],
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

// Get admin users
export const getAdminUsers = createAsyncThunk<
  AdminUsersResponse,
  GetAdminUsersParams & { background?: boolean },
  { rejectValue: { message: string } }
>('adminUsers/getAdminUsers', async (params, { rejectWithValue }) => {
  const { background, ...fetchParams } = params;
  try {
    const page = params.page || 1;
    const limit = params.limit || 25;
    
    const response = await privateApiCall<AdminUsersResponse>(
      `/auth/create-admin?page=${page}&limit=${limit}`
    );
    
    return { ...response, _background: background || false };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch admin users';
    return rejectWithValue({ message: errorMessage });
  }
});

// Create admin user
export const createAdminUser = createAsyncThunk<
  CreateAdminUserResponse,
  CreateAdminUserPayload,
  { rejectValue: { message: string } }
>('adminUsers/createAdminUser', async (payload, { rejectWithValue }) => {
  try {
    const response = await privateApiPost<CreateAdminUserResponse>(
      '/auth/create-admin',
      payload
    );
    
    return response;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create admin user';
    return rejectWithValue({ message: errorMessage });
  }
});

// Update admin user
export const updateAdminUser = createAsyncThunk<
  UpdateAdminUserResponse,
  UpdateAdminUserPayload,
  { rejectValue: { message: string } }
>('adminUsers/updateAdminUser', async (payload, { rejectWithValue }) => {
  try {
    const response = await privateApiPut<UpdateAdminUserResponse>(
      '/auth/create-admin',
      payload
    );
    
    return response;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update admin user';
    return rejectWithValue({ message: errorMessage });
  }
});

// Delete admin user
export const deleteAdminUser = createAsyncThunk<
  DeleteAdminUserResponse,
  DeleteAdminUserPayload,
  { rejectValue: { message: string } }
>('adminUsers/deleteAdminUser', async (payload, { rejectWithValue }) => {
  try {
    const response = await privateApiDelete<DeleteAdminUserResponse>(
      '/auth/create-admin',
      {
        data: payload,
      }
    );
    
    return response;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete admin user';
    return rejectWithValue({ message: errorMessage });
  }
});

const adminUsersSlice = createSlice({
  name: 'adminUsers',
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
    // Get admin users
    builder
      .addCase(getAdminUsers.pending, (state, action) => {
        const isBackground = action.meta.arg.background || false;
        if (isBackground) {
          state.isRefreshing = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(getAdminUsers.fulfilled, (state, action) => {
        const isBackground = (action.payload as any)._background || false;
        if (isBackground) {
          state.isRefreshing = false;
        } else {
          state.isLoading = false;
        }
        // Map the API response to match our AdminUser interface
        state.users = action.payload.admins.map((admin) => ({
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive !== undefined ? admin.isActive : true,
        }));
        // Calculate pagination from API response
        const page = action.meta.arg.page || 1;
        const limit = action.meta.arg.limit || 25;
        state.pagination = {
          currentPage: page,
          totalPages: action.payload.totalPages,
          totalCount: action.payload.totalAdmins,
          limit: limit,
          hasNextPage: page < action.payload.totalPages,
          hasPreviousPage: page > 1,
        };
        // Update cache tracking (exclude background flag from params)
        const { background, ...paramsWithoutFlag } = action.meta.arg;
        state.lastFetchParams = paramsWithoutFlag;
        state.lastFetchTime = Date.now();
        state.error = null;
      })
      .addCase(getAdminUsers.rejected, (state, action) => {
        const isBackground = action.meta.arg.background || false;
        if (isBackground) {
          state.isRefreshing = false;
          // Don't clear data on background refresh failure, keep showing cached data
        } else {
          state.isLoading = false;
          state.users = [];
          state.pagination = null;
        }
        state.error = action.payload?.message || 'Failed to fetch admin users';
      });

    // Create admin user
    builder
      .addCase(createAdminUser.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createAdminUser.fulfilled, (state) => {
        state.isCreating = false;
        state.error = null;
      })
      .addCase(createAdminUser.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload?.message || 'Failed to create admin user';
      });

    // Update admin user
    builder
      .addCase(updateAdminUser.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        state.isUpdating = false;
        // Update the user in the state without refreshing all users
        const updatedUserId = action.meta.arg.id;
        const updatedName = action.meta.arg.name;
        const updatedStatus = action.meta.arg.isActive;
        const userIndex = state.users.findIndex(user => user.id === updatedUserId);
        if (userIndex !== -1) {
          state.users[userIndex] = {
            ...state.users[userIndex],
            ...(updatedName && { name: updatedName }),
            ...(updatedStatus !== undefined && { isActive: updatedStatus }),
          };
        }
        state.error = null;
      })
      .addCase(updateAdminUser.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload?.message || 'Failed to update admin user';
      });

    // Delete admin user
    builder
      .addCase(deleteAdminUser.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.isDeleting = false;
        // Remove deleted user from state
        const deletedId = action.meta.arg.id;
        state.users = state.users.filter(user => user.id !== deletedId);
        // Update pagination totalCount if available
        if (state.pagination) {
          state.pagination.totalCount = Math.max(0, state.pagination.totalCount - 1);
        }
        state.error = null;
      })
      .addCase(deleteAdminUser.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload?.message || 'Failed to delete admin user';
      });
  },
});

export const { clearError, invalidateCache } = adminUsersSlice.actions;
export default adminUsersSlice.reducer;

