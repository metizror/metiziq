import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordInput } from './ui/password-input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { User, Mail, Lock, Building, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerCustomer } from '@/store/slices/customerRegister.slice';
import { CustomerRegistrationSchema, CustomerRegistrationFormValues } from '@/validation-schemas';

declare global {
  interface Window {
    hcaptcha: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'error-callback': (error: string) => void }) => string;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
      execute: (widgetId: string) => Promise<string>;
    };
  }
}

interface CustomerRegistrationProps {
  onRegistrationComplete: () => void;
  onBackToLogin: () => void;
  onCreateApprovalRequest?: (request: {
    firstName: string;
    lastName: string;
    businessEmail: string;
    companyName: string;
  }) => void;
}

export function CustomerRegistration({ onRegistrationComplete, onBackToLogin, onCreateApprovalRequest }: CustomerRegistrationProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { pending } = useAppSelector((state) => state.customerRegister);
  const captchaRef = useRef(null as HTMLDivElement | null);
  const captchaWidgetId = useRef(null as string | null);
  const captchaTokenRef = useRef(null as string | null);

  const initialValues: CustomerRegistrationFormValues = {
    firstName: '',
    lastName: '',
    businessEmail: '',
    companyName: '',
    password: '',
    confirmPassword: '',
  };

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error('NEXT_PUBLIC_HCAPTCHA_SITE_KEY is not set');
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="hcaptcha.com/1/api.js"]')) {
      if (window.hcaptcha && captchaRef.current && captchaWidgetId.current === null) {
        try {
          captchaWidgetId.current = window.hcaptcha.render(captchaRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              // Store the token when CAPTCHA is completed
              console.log('hCaptcha callback received token:', token ? token.substring(0, 20) + '...' : 'empty');
              if (token && token.trim() !== '') {
                captchaTokenRef.current = token;
              } else {
                captchaTokenRef.current = null;
              }
            },
            'error-callback': (error: string) => {
              console.error('hCaptcha error:', error);
              captchaTokenRef.current = null;
            },
          });
        } catch (error) {
          console.error('hCaptcha render error:', error);
        }
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.hcaptcha && captchaRef.current) {
        try {
          captchaWidgetId.current = window.hcaptcha.render(captchaRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              // Store the token when CAPTCHA is completed
              console.log('hCaptcha callback received token:', token ? token.substring(0, 20) + '...' : 'empty');
              if (token && token.trim() !== '') {
                captchaTokenRef.current = token;
              } else {
                captchaTokenRef.current = null;
              }
            },
            'error-callback': (error: string) => {
              console.error('hCaptcha error:', error);
              captchaTokenRef.current = null;
            },
          });
        } catch (error) {
          console.error('hCaptcha render error:', error);
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load hCaptcha script');
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const getCaptchaToken = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.hcaptcha) {
        reject(new Error('hCaptcha not loaded'));
        return;
      }

      // First check if we have a stored token from the callback (this is the most reliable)
      if (captchaTokenRef.current && captchaTokenRef.current.trim() !== '') {
        console.log('Using stored CAPTCHA token from callback');
        resolve(captchaTokenRef.current);
        return;
      }

      // Fallback: try to get token from widget using getResponse
      if (captchaWidgetId.current !== null) {
        try {
          const token = window.hcaptcha.getResponse(captchaWidgetId.current);
          // hCaptcha tokens are typically 100+ characters, widget IDs are short (10-15 chars)
          // Validate we got a real token, not the widget ID
          if (token && token.trim() !== '' && token.length > 50) {
            console.log('Retrieved CAPTCHA token from widget, length:', token.length);
            captchaTokenRef.current = token;
            resolve(token);
          } else if (token && token.length < 50) {
            // This might be the widget ID, not the token
            console.error('Received short token (might be widget ID):', token);
            reject(new Error('CAPTCHA token appears invalid. Please complete the CAPTCHA again.'));
          } else {
            reject(new Error('Please complete the CAPTCHA verification'));
          }
        } catch (error) {
          console.error('Error getting CAPTCHA response:', error);
          reject(new Error('Please complete the CAPTCHA verification'));
        }
      } else {
        reject(new Error('hCaptcha widget not initialized'));
      }
    });
  };

  const { handleChange, handleSubmit, values, errors, touched } = useFormik({
    initialValues,
    validationSchema: CustomerRegistrationSchema,
    onSubmit: async (value, action) => {
      console.log('Form submitted', value);
      try {
        let captchaToken = '';
        try {
          captchaToken = await getCaptchaToken();
          console.log('CAPTCHA token retrieved, length:', captchaToken.length);
          
          // Ensure we're not accidentally sending the widget ID
          // Widget IDs are typically short (like "0r3o96byurbg"), tokens are much longer
          if (captchaToken.length < 50) {
            console.error('Token too short, might be widget ID:', captchaToken);
            toast.error('CAPTCHA token appears invalid. Please complete the CAPTCHA again.');
            if (captchaWidgetId.current !== null && window.hcaptcha) {
              window.hcaptcha.reset(captchaWidgetId.current);
              captchaTokenRef.current = null;
            }
            return;
          }
        } catch (error: any) {
          console.error('Failed to get CAPTCHA token:', error);
          toast.error('Please complete the CAPTCHA verification');
          // Reset CAPTCHA to allow user to try again
          if (captchaWidgetId.current !== null && window.hcaptcha) {
            window.hcaptcha.reset(captchaWidgetId.current);
            captchaTokenRef.current = null;
          }
          return;
        }

        // Validate token before sending
        if (!captchaToken || captchaToken.trim() === '' || captchaToken.length < 50) {
          console.error('Invalid CAPTCHA token:', captchaToken);
          toast.error('CAPTCHA token is invalid. Please complete the CAPTCHA again.');
          // Reset CAPTCHA
          if (captchaWidgetId.current !== null && window.hcaptcha) {
            window.hcaptcha.reset(captchaWidgetId.current);
            captchaTokenRef.current = null;
          }
          return;
        }

        const payload = {
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.businessEmail,
          companyName: value.companyName,
          password: value.password,
          captchaToken: captchaToken,
        };
        console.log('Dispatching registerCustomer with payload (token length):', captchaToken.length);
        
        const result = await dispatch(registerCustomer(payload)).unwrap();
        console.log('Registration successful:', result);

        // Create approval request
        if (onCreateApprovalRequest) {
          onCreateApprovalRequest({
            firstName: value.firstName,
            lastName: value.lastName,
            businessEmail: value.businessEmail,
            companyName: value.companyName
          });
        }

        toast.success(result.message || 'Registration successful! Please check your email and click the verification link to activate your account.');
        
        // Reset CAPTCHA
        if (captchaWidgetId.current !== null && window.hcaptcha) {
          window.hcaptcha.reset(captchaWidgetId.current);
          captchaTokenRef.current = null;
        }
        
        // Reset form and navigate to login page
        action.resetForm();
        router.push('/');
      } catch (err: any) {
        console.error('Registration error:', err);
        toast.error(err.message || 'Registration failed. Please try again.');
        
        // Reset CAPTCHA on error
        if (captchaWidgetId.current !== null && window.hcaptcha) {
          window.hcaptcha.reset(captchaWidgetId.current);
          captchaTokenRef.current = null;
        }
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#2563EB' }}>
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Join aMFAccess - Pay only for what you download</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Customer Registration</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Please use your business email address. Free email providers are not accepted.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={values.firstName}
                    onChange={handleChange}
                    className={`h-11 ${errors.firstName && touched.firstName ? 'border-red-500' : ''}`}
                  />
                  {errors.firstName && touched.firstName && (
                    <p className="text-xs text-red-600 font-medium">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={values.lastName}
                    onChange={handleChange}
                    className={`h-11 ${errors.lastName && touched.lastName ? 'border-red-500' : ''}`}
                  />
                  {errors.lastName && touched.lastName && (
                    <p className="text-xs text-red-600 font-medium">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="businessEmail"
                    name="businessEmail"
                    type="email"
                    placeholder="john.doe@company.com"
                    value={values.businessEmail}
                    onChange={handleChange}
                    className={`h-11 pl-10 ${errors.businessEmail && touched.businessEmail ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.businessEmail && touched.businessEmail ? (
                  <p className="text-xs text-red-600 font-medium">{errors.businessEmail}</p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Only business email addresses are accepted (no Gmail, Yahoo, etc.)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Your Company Inc."
                    value={values.companyName}
                    onChange={handleChange}
                    className={`h-11 pl-10 ${errors.companyName && touched.companyName ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.companyName && touched.companyName && (
                  <p className="text-xs text-red-600 font-medium">{errors.companyName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Min. 8 characters"
                    value={values.password}
                    onChange={handleChange}
                    leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                    className={`h-11 ${errors.password && touched.password ? 'border-red-500' : ''}`}
                  />
                  {errors.password && touched.password && (
                    <p className="text-xs text-red-600 font-medium">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                    className={`h-11 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="text-xs text-red-600 font-medium">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Pay-Per-Use Model</p>
                    <p>Pay only $0.40 per contact you download. No subscriptions, no hidden fees.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div ref={captchaRef}></div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11"
                style={{ backgroundColor: '#2563EB' }}
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Already have an account? <span className="text-orange-600 font-medium">Sign In</span>
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
