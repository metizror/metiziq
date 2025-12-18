"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, CheckCircle, Shield, User, Mail, Building } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { verifyOtp, clearVerifiedCustomer, resetAuthState, resendOtp } from '@/store/slices/auth.slice';

function OtpVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isVerifyingOtp, isResendingOtp, verifiedCustomer, error } = useAppSelector((state) => state.auth);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(60); // 60 seconds countdown
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const isVerified = verifiedCustomer !== null;

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    
    // Only allow sequential input - prevent editing already-filled digits
    // Allow: adding new digit at the end, or backspacing from the end
    if (numericValue.length === otp.length + 1) {
      // Adding new digit - must be sequential
      if (numericValue.startsWith(otp)) {
        setOtp(numericValue);
      }
    } else if (numericValue.length === otp.length - 1) {
      // Backspace - allow deletion from end only
      if (numericValue === otp.slice(0, -1)) {
        setOtp(numericValue);
      }
    } else if (numericValue.length === 0) {
      // Clear all
      setOtp('');
    }
    // Ignore other changes (editing middle digits)
  };

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0 && isResendDisabled) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isResendDisabled) {
      setIsResendDisabled(false);
    }
  }, [countdown, isResendDisabled]);

  useEffect(() => {
    // Check if user has permission to access this page (only after registration)
    if (typeof window !== "undefined") {
      const canAccess = sessionStorage.getItem("canAccessOtpVerify");
      const storedEmail = sessionStorage.getItem("registrationEmail");
      
      // If canAccessOtpVerify exists (new registration), clear any old verifiedCustomer
      // This ensures we show OTP input form, not old success screen
      if (canAccess && verifiedCustomer) {
        dispatch(clearVerifiedCustomer());
      }
      
      // If verifiedCustomer exists but email doesn't match current registration, clear it
      // This handles the case where user registered a new customer after previous verification
      if (verifiedCustomer && storedEmail && verifiedCustomer.email !== storedEmail) {
        dispatch(clearVerifiedCustomer());
      }
      
      // If user doesn't have permission and hasn't verified yet, redirect to home
      if (!canAccess && !verifiedCustomer) {
        toast.error("Please register first to access OTP verification");
        router.push("/");
        return;
      }

      // Get email from sessionStorage (prioritized) or URL params (fallback)
      if (storedEmail) {
        setEmail(storedEmail);
        return;
      }
    }
    
    // Fallback to URL params if sessionStorage doesn't have email
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // No email found and no permission - redirect
      if (typeof window !== "undefined" && !verifiedCustomer) {
        toast.error("Please register first to access OTP verification");
        router.push("/");
      }
    }
  }, [searchParams, router, verifiedCustomer, dispatch]);

  // Only show success screen if verifiedCustomer exists AND canAccessOtpVerify is cleared
  // This ensures success screen only appears immediately after verification, not for new registrations
  // If canAccessOtpVerify exists, it means user just registered, so show OTP input form
  const canAccess = typeof window !== "undefined" ? sessionStorage.getItem("canAccessOtpVerify") : null;
  const shouldShowSuccess = isVerified && verifiedCustomer && !canAccess;

  // Handle page refresh after successful verification
  // If user refreshes after verification, Redux state resets (verifiedCustomer becomes null)
  // and canAccessOtpVerify flag is cleared, so they'll be redirected by the main useEffect
  // This prevents access to OTP verify page after successful verification


  const handleVerifyOtp = async (e: any) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email not found. Please try again from the registration page.');
      return;
    }

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const result = await dispatch(verifyOtp({ email, otp })).unwrap();
      toast.success(result.message || 'Email verified successfully!');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      // Extract error message from API response
      // When using rejectWithValue, .unwrap() throws the rejectValue directly
      // So err should be { message: string } or the error message itself
      let errorMessage = 'Failed to verify OTP. Please try again.';
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err) {
        // If err is the rejectValue object directly
        errorMessage = err.message || JSON.stringify(err);
      }
      
      toast.error(errorMessage);
      setOtp('');
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Email not found. Please try again from the registration page.');
      return;
    }

    try {
      const result = await dispatch(resendOtp({ email, role: 'customer' })).unwrap();
      toast.success(result.message || 'OTP sent to your email successfully!');
      // Reset countdown and disable button
      setCountdown(60);
      setIsResendDisabled(true);
      // Clear current OTP input
      setOtp('');
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      // Extract error message from API response
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err) {
        errorMessage = err.message || JSON.stringify(err);
      }
      
      toast.error(errorMessage);
    }
  };


  if (shouldShowSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-gradient-to-br from-green-500 to-emerald-500">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Registration Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Your email has been successfully verified.
                </p>
                
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Registered Customer Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {verifiedCustomer.firstName} {verifiedCustomer.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{verifiedCustomer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Company</p>
                        <p className="text-sm font-medium text-gray-900">{verifiedCustomer.companyName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    // Reset auth state to initial state and clear all sessionStorage
                    // This ensures clean state for next registration
                    dispatch(resetAuthState());
                    router.push('/');
                  }}
                  className="w-full h-11"
                  style={{ backgroundColor: '#EF8037' }}
                >
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#EF8037' }}>
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter Verification Code</h2>
                  <p className="text-sm text-gray-600">Enter the 6-digit code sent to your email</p>
                </div>
                
                <div className="flex justify-center w-full">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                    disabled={isVerifyingOtp || isResendingOtp}
                    containerClassName="w-full justify-center"
                    pattern={/^[0-9]*$/}
                  >
                    <InputOTPGroup className="gap-3">
                      <InputOTPSlot index={0} className="h-14 w-14 text-xl font-semibold cursor-text" />
                      <InputOTPSlot index={1} className="h-14 w-14 text-xl font-semibold cursor-text" />
                      <InputOTPSlot index={2} className="h-14 w-14 text-xl font-semibold cursor-text" />
                      <InputOTPSlot index={3} className="h-14 w-14 text-xl font-semibold cursor-text" />
                      <InputOTPSlot index={4} className="h-14 w-14 text-xl font-semibold cursor-text" />
                      <InputOTPSlot index={5} className="h-14 w-14 text-xl font-semibold cursor-text" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11"
                style={{ backgroundColor: '#EF8037' }}
                disabled={isVerifyingOtp || isResendingOtp || otp.length !== 6}
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={isResendDisabled || isResendingOtp || isVerifyingOtp || !email}
                  className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : isResendDisabled ? (
                    `Resend code in ${countdown}s`
                  ) : (
                    'Resend code'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OtpVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#EF8037]" />
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <OtpVerifyContent />
    </Suspense>
  );
}

