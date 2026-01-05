import * as yup from 'yup';

// Helper function to validate phone number
const validatePhone = (phone: string | undefined): boolean => {
  if (!phone || phone.trim() === '') return true; // Optional field
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

// Helper function to validate website URL
const validateWebsite = (website: string | undefined): boolean => {
  if (!website || website.trim() === '') return true; // Optional field
  try {
    let urlToValidate = website.trim();
    if (!urlToValidate.match(/^https?:\/\//i)) {
      urlToValidate = 'https://' + urlToValidate;
    }
    const url = new URL(urlToValidate);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// Contact Form Validation Schema
export const contactFormSchema = yup.object().shape({
  contactLinkedInUrl: yup.string().trim().url('Please enter a valid URL').nullable().transform((value) => (value === '' ? null : value)),
  
  // Required contact fields - conditional based on LinkedIn URL
  firstName: yup
    .string()
    .trim()
    .when('contactLinkedInUrl', {
      is: (value: string | null | undefined) => !!(value && typeof value === 'string' && value.trim() !== ''),
      then: (schema) => schema.notRequired().nullable().transform((value) => (value === '' ? null : value)),
      otherwise: (schema) => schema.required('First name is required').min(1, 'First name is required'),
    }),

  lastName: yup
    .string()
    .trim()
    .when('contactLinkedInUrl', {
      is: (value: string | null | undefined) => !!(value && typeof value === 'string' && value.trim() !== ''),
      then: (schema) => schema.notRequired().nullable().transform((value) => (value === '' ? null : value)),
      otherwise: (schema) => schema.required('Last name is required').min(1, 'Last name is required'),
    }),

  // Optional contact fields
  jobTitle: yup.string().trim(),
  jobLevel: yup.string(),
  jobRole: yup.string(),
  email: yup
    .string()
    .trim()
    .when('contactLinkedInUrl', {
      is: (value: string | null | undefined) => !!(value && typeof value === 'string' && value.trim() !== ''),
      then: (schema) => schema.notRequired().email('Please enter a valid email address').nullable().transform((value) => (value === '' ? null : value)),
      otherwise: (schema) => schema.email('Please enter a valid email address').required('Email is required').nullable().transform((value) => (value === '' ? null : value)),
    }),
  phone: yup
    .string()
    .trim()
    .test('phone', 'Please enter a valid phone number (10-15 digits)', (value) => {
      if (!value || value.trim() === '') return true;
      return validatePhone(value);
    })
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  directPhone: yup
    .string()
    .trim()
    .test('directPhone', 'Please enter a valid phone number (10-15 digits)', (value) => {
      if (!value || value.trim() === '') return true;
      return validatePhone(value);
    })
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  address1: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  address2: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  city: yup
    .string()
    .trim()
    .when('contactLinkedInUrl', {
      is: (value: string | null | undefined) => !!(value && typeof value === 'string' && value.trim() !== ''),
      then: (schema) => schema.notRequired().nullable().transform((value) => (value === '' ? null : value)),
      otherwise: (schema) => schema.required('City is required').nullable().transform((value) => (value === '' ? null : value)),
    }),
  state: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  zipCode: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  country: yup.string().nullable().transform((value) => (value === '' ? null : value)),
  otherCountry: yup
    .string()
    .trim()
    .when(['country', 'contactLinkedInUrl'], {
      is: (country: string, linkedInUrl: string | null | undefined) => {
        const isLinkedInFilled = !!(linkedInUrl && typeof linkedInUrl === 'string' && linkedInUrl.trim() !== '');
        return country === 'Other' && !isLinkedInFilled;
      },
      then: (schema) => schema.required('Please enter the country name'),
      otherwise: (schema) => schema.nullable().transform((value) => (value === '' ? null : value)),
    }),
  website: yup
    .string()
    .trim()
    .test('website', 'Please enter a valid website URL (e.g., https://example.com)', (value) => {
      if (!value || value.trim() === '') return true;
      return validateWebsite(value);
    })
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  industry: yup.string().nullable().transform((value) => (value === '' ? null : value)),
  otherIndustry: yup
    .string()
    .trim()
    .when(['industry', 'contactLinkedInUrl'], {
      is: (industry: string, linkedInUrl: string | null | undefined) => {
        const isLinkedInFilled = !!(linkedInUrl && typeof linkedInUrl === 'string' && linkedInUrl.trim() !== '');
        return industry === 'Other' && !isLinkedInFilled;
      },
      then: (schema) => schema.required('Please enter the industry name'),
      otherwise: (schema) => schema.nullable().transform((value) => (value === '' ? null : value)),
    }),
  subIndustry: yup.string().nullable().transform((value) => (value === '' ? null : value)),
  lastUpdateDate: yup.string().nullable().transform((value) => (value === '' ? null : value)),

  // Required company fields - conditional based on LinkedIn URL
  companyName: yup
    .string()
    .when('contactLinkedInUrl', {
      is: (value: string | null | undefined) => !!(value && typeof value === 'string' && value.trim() !== ''),
      then: (schema) => schema.notRequired().nullable().transform((value) => (value === '' ? null : value)),
      otherwise: (schema) => schema.required('Company name is required'),
    }),

  employeeSize: yup
    .string(),

  revenue: yup
    .string(),

  // Optional company fields
  amfNotes: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
});

export type ContactFormValues = yup.InferType<typeof contactFormSchema>;

