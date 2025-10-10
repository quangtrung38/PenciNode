'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Checkbox from '@/components/admin/form/input/Checkbox';
import Label from '@/components/admin/form/Label';
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from '@/icons';

// Disable static generation for this page since it uses useSearchParams
export const dynamic = 'force-dynamic';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams?.get('message');
    if (message === 'registration-success') {
      const timeoutId = setTimeout(() => {
        setSuccess('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email hoặc mật khẩu không đúng');
      } else if (result?.ok) {
        // Redirect all users to Vietnamese home page
        router.push('/vi');
      }
    } catch {
      setError('Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    setError('');

    try {
      await signIn(provider, {
        callbackUrl: '/',
      });
    } catch {
      setError(`Đã xảy ra lỗi khi đăng nhập bằng ${provider}`);
      setIsLoading(false);
    }
  };

  const handleZaloLogin = () => {
    // Zalo Web SDK integration would go here
    // For now, we'll show a message that it's not implemented yet
    setError('Tính năng đăng nhập bằng Zalo sẽ được bổ sung trong tương lai');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row dark:bg-gray-900">
      {/* Left side - Brand/Image */}
      <div className="hidden items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-12 lg:flex lg:w-1/2">
        <div className="text-center text-white">
          <h1 className="mb-4 text-4xl font-bold">Chào mừng trở lại!</h1>
          <p className="text-xl opacity-90">
            Đăng nhập để tiếp tục sử dụng hệ thống
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full flex-1 flex-col lg:w-1/2">
        <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
          <Link
            href="/vi"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Quay lại trang chủ
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 text-lg font-semibold text-gray-800 sm:text-xl dark:text-white/90">
                Đăng nhập
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nhập email và mật khẩu để đăng nhập!
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="mb-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-7 py-3 text-sm font-normal text-gray-800 shadow-sm transition-colors hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                    fill="#EB4335"
                  />
                </svg>
                Đăng nhập bằng Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-3 rounded-lg bg-blue-600 px-7 py-3 text-sm font-normal text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20 10C20 4.48 15.52 0 10 0S0 4.48 0 10c0 4.99 3.66 9.13 8.44 9.88v-6.99H5.9V10h2.54V7.8c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.19 2.24.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V10h2.78l-.45 2.89h-2.33v6.99C16.34 19.13 20 14.99 20 10z" />
                </svg>
                Đăng nhập bằng Facebook
              </button>

              <button
                type="button"
                onClick={handleZaloLogin}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-3 rounded-lg bg-blue-500 px-7 py-3 text-sm font-normal text-white shadow-sm transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="10" cy="10" r="10" fill="#0068ff" />
                  <path d="M7.5 6.5L12.5 6.5C13.05 6.5 13.5 6.95 13.5 7.5L13.5 12.5C13.5 13.05 13.05 13.5 12.5 13.5L7.5 13.5C6.95 13.5 6.5 13.05 6.5 12.5L6.5 7.5C6.5 6.95 6.95 6.5 7.5 6.5Z" fill="white" />
                  <path d="M8.5 8.5L11.5 8.5L11.5 9.5L8.5 9.5ZM8.5 10.5L11.5 10.5L11.5 11.5L8.5 11.5Z" fill="#0068ff" />
                </svg>
                Đăng nhập bằng Zalo
              </button>
            </div>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white p-2 text-gray-400 sm:px-5 sm:py-2 dark:bg-gray-900">
                  Hoặc
                </span>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email
                    <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="email"
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-blue-800"
                  />
                </div>

                <div>
                  <Label>
                    Mật khẩu
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu của bạn"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-blue-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer"
                    >
                      {showPassword
                        ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                        : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={rememberMe}
                      onChange={setRememberMe}
                      disabled={isLoading}
                    />
                    <span className="block text-sm font-normal text-gray-700 dark:text-gray-400">
                      Ghi nhớ đăng nhập
                    </span>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-60"
                  >
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-center text-sm font-normal text-gray-700 dark:text-gray-400">
                Chưa có tài khoản?
                {' '}
                <Link
                  href="/vi/register"
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
