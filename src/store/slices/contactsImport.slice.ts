import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

export interface ContactImportData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  jobLevel: string;
  jobRole: string;
  email: string;
  phone: string;
  directPhone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  industry: string;
  subIndustry: string;
  contactLinkedIn: string;
  companyName: string;
  employeeSize: string;
  revenue: string;
}

export interface ImportContactsPayload {
  data: ContactImportData[];
  skipActivityLog?: boolean;
  createActivityLogWithTotal?: number;
}

export interface ImportContactsResponse {
  message: string;
  success?: number;
  failed?: number;
  imported?: number;
  total?: number;
  companiesCreated?: number;
  companiesUpdated?: number;
  companiesTotal?: number;
  existingEmails?: string[];
  importedEmails?: string[];
  skipped?: number;
  errors?: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

interface ContactsImportState {
  isImporting: boolean;
  importResult: ImportContactsResponse | null;
  error: string | null;
  existingEmails?: string[];
}

const initialState: ContactsImportState = {
  isImporting: false,
  importResult: null,
  error: null,
};

// Import contacts from Excel/data
export const importContacts = createAsyncThunk<
  ImportContactsResponse,
  ImportContactsPayload,
  { rejectValue: { message: string; existingEmails?: string[] } }
>("contactsImport/importContacts", async (payload, { rejectWithValue }) => {
  try {
    // Get token from localStorage
    let token: string | null = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("authToken");
    }

    if (!token) {
      throw new Error("No authentication token found. Please login again.");
    }

    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
    const response = await axios.post<ImportContactsResponse>(
      `${baseURL}/admin/contacts-import-data`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    // Preserve full error response data including existingEmails
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        message?: string;
        existingEmails?: string[];
      }>;
      const errorData = axiosError.response?.data || {};
      const errorMessage =
        errorData.message || axiosError.message || "Failed to import contacts";
      return rejectWithValue({
        message: errorMessage,
        existingEmails: errorData.existingEmails,
      });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Failed to import contacts";
    return rejectWithValue({ message: errorMessage });
  }
});

const contactsImportSlice = createSlice({
  name: "contactsImport",
  initialState,
  reducers: {
    clearImportResult: (state) => {
      state.importResult = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
      state.existingEmails = undefined;
    },
  },
  extraReducers: (builder) => {
    // Import contacts
    builder
      .addCase(importContacts.pending, (state) => {
        state.isImporting = true;
        state.error = null;
        state.existingEmails = undefined;
        state.importResult = null;
      })
      .addCase(importContacts.fulfilled, (state, action) => {
        state.isImporting = false;
        state.importResult = action.payload;
        state.error = null;
      })
      .addCase(importContacts.rejected, (state, action) => {
        state.isImporting = false;
        state.error = action.payload?.message || "Failed to import contacts";
        state.existingEmails = action.payload?.existingEmails;
        state.importResult = null;
      });
  },
});

export const { clearImportResult, clearError } = contactsImportSlice.actions;
export default contactsImportSlice.reducer;
