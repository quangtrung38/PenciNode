'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Checkbox from '@/components/admin/form/input/Checkbox';
import Label from '@/components/admin/form/Label';
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from '@/icons';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

type FormErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
};

type RegisterResponse = {
  success: boolean;
  message: string;
  user?: any;
  errors?: any;
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const router = useRouter();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear specific field error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = ['Tên là bắt buộc'];
    } else if (formData.name.trim().length < 2) {
      errors.name = ['Tên phải có ít nhất 2 ký tự'];
    }

    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = ['Email là bắt buộc'];
    } else if (!emailRegex.test(formData.email)) {
      errors.email = ['Email không hợp lệ'];
    }

    if (!formData.password) {
      errors.password = ['Mật khẩu là bắt buộc'];
    } else if (formData.password.length < 8) {
      errors.password = ['Mật khẩu phải có ít nhất 8 ký tự'];
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = ['Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số'];
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = ['Xác nhận mật khẩu là bắt buộc'];
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = ['Mật khẩu xác nhận không khớp'];
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFormErrors({});

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!agreeTerms) {
      setError('Bạn phải đồng ý với điều khoản sử dụng');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: RegisterResponse = await response.json();

      if (data.success) {
        setSuccess(data.message);
        // Redirect to login page after successful registration
        setTimeout(() => {
          router.push('/vi/login?message=registration-success');
        }, 2000);
      } else {
        if (data.errors) {
          // Handle validation errors from server
          setFormErrors(data.errors);
        } else {
          setError(data.message);
        }
      }
    } catch (error) {
      setError('Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row dark:bg-gray-900">
      {/* Left side - Brand/Image */}
      <div className="hidden items-center justify-center bg-gradient-to-br from-purple-600 to-blue-700 p-12 lg:flex lg:w-1/2">
        <div className="text-center text-white">
          <h1 className="mb-4 text-4xl font-bold">Tham gia cùng chúng tôi!</h1>
          <p className="text-xl opacity-90">
            Tạo tài khoản để trải nghiệm đầy đủ tính năng của hệ thống
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
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
              <h1 className="mb-2 text-lg font-semibold text-gray-800 sm:text-2xl dark:text-white/90">
                Đăng ký
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tạo tài khoản mới để bắt đầu sử dụng hệ thống
              </p>
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

            {/* Social Registration Buttons */}
            <div className="mb-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
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
                Đăng ký với Google
              </button>

              <button
                type="button"
                onClick={() => signIn('facebook', { callbackUrl: '/' })}
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
                  <path d="M20 10C20 4.48 15.52 0 10 0S0 4.48 0 10c0 4.99 3.66 9.13 8.44 9.88v-6.99H5.9V10h2.54V7.8c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.19 2.24.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V10h2.78l-.45 2.89h-2.33v6.99C16.34 19.13 20 14.99 20 10z"/>
                </svg>
                Đăng ký với Facebook
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Họ và tên
                    <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    disabled={isLoading}
                    className="shadow-theme-xs dark:focus:border-brand-800 focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.name[0]}</p>
                  )}
                </div>

                <div>
                  <Label>
                    Email
                    <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="email"
                    placeholder="info@gmail.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.email[0]}</p>
                  )}
                </div>

                <div>
                  <Label>
                    Mật khẩu <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu (ít nhất 8 ký tự)"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      disabled={isLoading}
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {formErrors.password && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.password[0]}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số
                  </p>
                </div>

                <div>
                  <Label>
                    Xác nhận mật khẩu <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      disabled={isLoading}
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    />
                    <span
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.confirmPassword[0]}</p>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={agreeTerms}
                    onChange={setAgreeTerms}
                    disabled={isLoading}
                  />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Tôi đồng ý với{" "}
                    <Link
                      href="/terms"
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Điều khoản sử dụng
                    </Link>{" "}
                    và{" "}
                    <Link
                      href="/privacy"
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Chính sách bảo mật
                    </Link>
                  </span>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || !agreeTerms}
                    className="w-full inline-flex items-center justify-center font-semibold gap-2 rounded-lg transition px-4 py-3 text-sm bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
                Đã có tài khoản?
                {' '}
                <Link
                  href="/vi/login"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
