'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface VerifyEmailForm {
  otp: string;
}

function VerifyEmailPageContent() {
  const { verifyEmail, resendOtp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<VerifyEmailForm>();

  const otpValue = watch('otp');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const onSubmit = async (data: VerifyEmailForm) => {
    if (!email) {
      alert('Email tidak ditemukan. Silakan coba registrasi ulang.');
      return;
    }
    
    try {
      const success = await verifyEmail(email, data.otp);
      if (success) {
        router.push('/login?message=email-verified');
      }
    } catch (error) {
      // Error handling is done in the context
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || !email) return;
    
    try {
      const success = await resendOtp(email);
      if (success) {
        setCanResend(false);
        setCountdown(60); // 60 seconds cooldown
      }
    } catch (error) {
      // Error handling is done in the context
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardContent className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Email tidak ditemukan
              </h2>
              <p className="text-gray-600 mb-6">
                Silakan coba registrasi ulang atau kembali ke halaman login.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/register">
                  <Button>Registrasi Ulang</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            Nusa
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Verifikasi Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Kami telah mengirim kode OTP ke{' '}
            <span className="font-semibold text-gray-900">{email}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Masukkan Kode OTP</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Input
                  label="Kode OTP (6 digit)"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  {...register('otp', {
                    required: 'Kode OTP diperlukan',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Kode OTP harus 6 digit angka',
                    },
                  })}
                  error={errors.otp?.message}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading || !otpValue || otpValue.length !== 6}
              >
                {isLoading ? 'Memverifikasi...' : 'Verifikasi Email'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Tidak menerima kode?
                </p>
                
                {canResend ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                  >
                    Kirim Ulang OTP
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Kirim ulang dalam {formatTime(countdown)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  💡 Tips Verifikasi
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Cek folder spam/junk email</li>
                  <li>• Pastikan email address benar</li>
                  <li>• Kode OTP berlaku 15 menit</li>
                  <li>• Gunakan kode terbaru jika kirim ulang</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ← Kembali ke Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    }>
      <VerifyEmailPageContent />
    </Suspense>
  );
}

