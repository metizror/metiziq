import * as yup from 'yup';

// Common validation for email
const emailValidation = yup
  .string()
  .required('Email is required')
  .email('Please enter a valid email address')
  .trim();

// Common validation for password
const passwordValidation = yup
  .string()
  .required('Password is required')
  .min(6, 'Password must be at least 6 characters long');

// Superadmin Login Schema
export const SuperadminLoginSchema = yup.object().shape({
  email: emailValidation,
  password: passwordValidation,
});

// Admin Login Schema
export const AdminLoginSchema = yup.object().shape({
  email: emailValidation,
  password: passwordValidation,
});

// Customer Login Schema
export const CustomerLoginSchema = yup.object().shape({
  email: emailValidation,
  password: passwordValidation,
});

// Type exports for login forms
export interface SuperadminLoginFormValues {
  email: string;
  password: string;
}

export interface AdminLoginFormValues {
  email: string;
  password: string;
}

export interface CustomerLoginFormValues {
  email: string;
  password: string;
}

