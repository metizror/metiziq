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

// Company Form Validation Schema
export const companyFormSchema = yup.object().shape({
  // Required company fields
  companyName: yup
    .string()
    .required('Company name is required')
    .trim()
    .min(1, 'Company name is required'),
  
  // Optional company fields
  phone: yup
    .string()
    .trim()
    .test('phone', 'Please enter a valid phone number (10-15 digits)', (value) => {
      if (!value || value.trim() === '') return true;
      return validatePhone(value);
    })
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  address1: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  address2: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  city: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  state: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  zipCode: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  country: yup.string().nullable().transform((value) => (value === '' ? null : value)),
  otherCountry: yup
    .string()
    .trim()
    .when('country', {
      is: 'Other',
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
  revenue: yup.string().nullable().transform((value) => (value === '' ? null : value)),
  employeeSize: yup.string().nullable().transform((value) => (value === '' ? null : value)),
  industry: yup.string().nullable().transform((value) => (value === '' ? null : value)),
  otherIndustry: yup
    .string()
    .trim()
    .when('industry', {
      is: 'Other',
      then: (schema) => schema.required('Please enter the industry name'),
      otherwise: (schema) => schema.nullable().transform((value) => (value === '' ? null : value)),
    }),
  subIndustry: yup.string().nullable().transform((value) => (value === '' ? null : value)),
  technology: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  companyLinkedInUrl: yup.string().trim().url('Please enter a valid URL').nullable().transform((value) => (value === '' ? null : value)),
  amfNotes: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
  lastUpdateDate: yup.string().nullable().transform((value) => (value === '' ? null : value)),
});

export type CompanyFormValues = yup.InferType<typeof companyFormSchema>;

