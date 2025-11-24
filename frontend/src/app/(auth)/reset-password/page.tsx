'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ApiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';

function ResetPasswordPageContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid or missing reset token');
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      errors: {
        minLength: !minLength,
        hasUpperCase: !hasUpperCase,
        hasLowerCase: !hasLowerCase,
        hasNumber: !hasNumber,
        hasSpecialChar: !hasSpecialChar
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await ApiService.resetPassword({
        token,
        password: password.trim()
      });
      
      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Password Reset Successfully
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your password has been updated successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You can now log in with your new password.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-gray-600">
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  Please request a new password reset link from the login page.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Back to Login
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.push('/forgot-password')}
                  className="w-full"
                >
                  Request New Reset Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const passwordValidation = validatePassword(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                    disabled={isLoading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs ${passwordValidation.errors.minLength ? 'text-red-600' : 'text-green-600'}`}>
                      • At least 8 characters
                    </div>
                    <div className={`text-xs ${passwordValidation.errors.hasUpperCase ? 'text-red-600' : 'text-green-600'}`}>
                      • One uppercase letter
                    </div>
                    <div className={`text-xs ${passwordValidation.errors.hasLowerCase ? 'text-red-600' : 'text-green-600'}`}>
                      • One lowercase letter
                    </div>
                    <div className={`text-xs ${passwordValidation.errors.hasNumber ? 'text-red-600' : 'text-green-600'}`}>
                      • One number
                    </div>
                    <div className={`text-xs ${passwordValidation.errors.hasSpecialChar ? 'text-red-600' : 'text-green-600'}`}>
                      • One special character (@$!%*?&)
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                    disabled={isLoading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {confirmPassword && password !== confirmPassword && (
                  <div className="mt-1 text-xs text-red-600">
                    Passwords do not match
                  </div>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isLoading || !password.trim() || !confirmPassword.trim() || !passwordValidation.isValid || password !== confirmPassword}
                className="w-full"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
