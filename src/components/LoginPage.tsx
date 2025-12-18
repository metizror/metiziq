"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordInput } from './ui/password-input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Lock, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerRegistration } from './CustomerRegistration';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, clearError } from '@/store/slices/auth.slice';
import { LoginPayload } from '@/types/auth.types';
import {
  SuperadminLoginSchema,
  SuperadminLoginFormValues,
} from '@/validation-schemas';

// User type definition (matching app/page.tsx)
export type UserRole = 'superadmin' | 'admin' | 'customer' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
  onCreateApprovalRequest?: (request: {
    firstName: string;
    lastName: string;
    businessEmail: string;
    companyName: string;
  }) => void;
}

export function LoginPage({ onLogin, onCreateApprovalRequest }: LoginPageProps) {
  const router = useRouter();
  const [showRegistration, setShowRegistration] = useState(false);

  // Redux hooks
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user, token } = useAppSelector((state) => state.auth);

  // Unified Login Form
  const loginInitialValues: SuperadminLoginFormValues = {
    email: '',
    password: '',
  };

  const {
    handleChange: handleLoginChange,
    handleSubmit: handleLoginSubmit,
    values: loginValues,
    errors: loginErrors,
    touched: loginTouched,
  } = useFormik({
    initialValues: loginInitialValues,
    validationSchema: SuperadminLoginSchema,
    onSubmit: async (value, action) => {
      const loginPayload: LoginPayload = {
        email: value.email,
        password: value.password,
      };
      try {
        await dispatch(login(loginPayload)).unwrap();
        action.resetForm();
        router.push('/dashboard');
      } catch (err) {
        console.error('Login failed:', err);
      }
    },
  });

  // Handle successful login
  useEffect(() => {
    if (isAuthenticated && user && token) {
      const userData: User = {
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
        role: user.role || 'customer',
      };
      toast.success(`Welcome back, ${userData.name}!`);
      onLogin(userData);
    }
  }, [isAuthenticated, user, token, onLogin]);

  // Handle login errors - show toast and auto-clear after toast duration
  useEffect(() => {
    if (error) {
      toast.error(error);
      // Clear error after toast duration (4 seconds) so button enables after toast disappears
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 4000); // 4 seconds matches typical toast duration
      
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleRegistrationComplete = () => {
    setShowRegistration(false);
    toast.success('Registration complete! Please log in with your credentials.');
  };

  if (showRegistration) {
    return <CustomerRegistration 
      onRegistrationComplete={handleRegistrationComplete} 
      onBackToLogin={() => setShowRegistration(false)}
      onCreateApprovalRequest={onCreateApprovalRequest}
    />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#2563EB' }}>
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Contact Management System</h1>
          <p className="text-gray-600 mt-2">Manage your contacts and companies efficiently</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginValues.email}
                  onChange={handleLoginChange}
                  className={`h-11 ${loginErrors.email && loginTouched.email ? 'border-red-500' : ''}`}
                />
                {loginErrors.email && loginTouched.email && (
                  <p className="text-xs text-red-600 font-medium">{loginErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <PasswordInput
                  id="login-password"
                  name="password"
                  placeholder="Enter your password"
                  value={loginValues.password}
                  onChange={handleLoginChange}
                  className={`h-11 ${loginErrors.password && loginTouched.password ? 'border-red-500' : ''}`}
                />
                {loginErrors.password && loginTouched.password && (
                  <p className="text-xs text-red-600 font-medium">{loginErrors.password}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 flex items-center justify-center"
                style={{ backgroundColor: '#2563EB' }}
                disabled={isLoading || !!error}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                <Lock className="w-4 h-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    router.push("/reset-password");
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  New to aMFAccess? Pay only for what you download.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/customer-signup')}
                >
                  Create Customer Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}