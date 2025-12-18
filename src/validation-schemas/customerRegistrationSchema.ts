import * as yup from 'yup';

// List of free email providers that are not allowed
const freeEmailProviders = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
];

// Custom validation for business email
const validateBusinessEmail = (email: string): boolean => {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !freeEmailProviders.includes(domain);
};

// Customer Registration Schema
export const CustomerRegistrationSchema = yup.object().shape({
  firstName: yup
    .string()
    .required('First name is required')
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: yup
    .string()
    .required('Last name is required')
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  businessEmail: yup
    .string()
    .required('Business email is required')
    .email('Please enter a valid email address')
    .test(
      'business-email',
      'Please use a business email address. Free email providers are not accepted.',
      (value) => {
        if (!value) return false;
        return validateBusinessEmail(value);
      }
    )
    .trim(),
  
  companyName: yup
    .string()
    .required('Company name is required')
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must not exceed 100 characters'),
  
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

// Type export for customer registration form
export interface CustomerRegistrationFormValues {
  firstName: string;
  lastName: string;
  businessEmail: string;
  companyName: string;
  password: string;
  confirmPassword: string;
}

