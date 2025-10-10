"use client";
import React, { useState, useEffect } from 'react';
import Label from '../form/Label';
import Input from '../form/input/InputField';
import Select from '../form/Select';
import { ChevronDownIcon, EyeCloseIcon, EyeIcon } from '../icons';

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  password?: string;
}

interface UserFormProps {
  user?: User | null;
  onSubmit: (userData: Omit<User, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const roleOptions = [
  { value: "3", label: "User" },
  { value: "2", label: "Admin" },
  { value: "1", label: "Super Admin" }
];

const statusOptions = [
  { value: "1", label: "Hoạt động" },
  { value: "0", label: "Không hoạt động" }
];

export default function UserForm({ user, onSubmit, onCancel, isLoading = false }: UserFormProps) {
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    role: '3', // Default to User (3)
    status: '1', // Default to Active (1)
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0); // To force re-render

  const isEdit = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '3',
        status: user.status || '1',
        password: '' // Don't populate password for edit
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: '3',
        status: '1',
        password: ''
      });
    }
    setFormKey(prev => prev + 1); // Force re-render of form components
  }, [user]);

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSelectChange = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên là bắt buộc';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!isEdit && !formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc khi tạo user mới';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Don't send empty password for edit
      const submitData = { ...formData };
      if (isEdit && !submitData.password) {
        delete submitData.password;
      }
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {isEdit ? 'Cập nhật thông tin người dùng' : 'Tạo tài khoản người dùng mới'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" key={formKey}>
        {/* Name Field */}
        <div>
          <Label htmlFor="name">
            Tên người dùng <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Nhập tên người dùng"
            defaultValue={formData.name}
            onChange={handleInputChange('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            defaultValue={formData.email}
            onChange={handleInputChange('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <Label htmlFor="password">
            Mật khẩu {!isEdit && <span className="text-red-500">*</span>}
            {isEdit && <span className="text-gray-500 text-sm">(để trống nếu không thay đổi)</span>}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={isEdit ? "Nhập mật khẩu mới (tùy chọn)" : "Nhập mật khẩu"}
              defaultValue={formData.password}
              onChange={handleInputChange('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
            >
              {showPassword ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Role Field */}
        <div>
          <Label htmlFor="role">Vai trò</Label>
          <div className="relative">
            <Select
              options={roleOptions}
              defaultValue={formData.role}
              onChange={handleSelectChange('role')}
              className="dark:bg-dark-900"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        {/* Status Field */}
        <div>
          <Label htmlFor="status">Trạng thái</Label>
          <div className="relative">
            <Select
              options={statusOptions}
              defaultValue={formData.status}
              onChange={handleSelectChange('status')}
              className="dark:bg-dark-900"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isEdit ? 'Cập nhật' : 'Thêm người dùng'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}