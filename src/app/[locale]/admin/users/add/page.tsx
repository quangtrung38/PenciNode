'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import UserForm from '@/components/admin/forms/UserForm';

interface User {
  name: string;
  email: string;
  role: string;
  status: string;
  password?: string;
}

export default function AddUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (userData: User) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      // Success - redirect back to users list
      router.push('/admin/users');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Có lỗi xảy ra khi tạo người dùng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Thêm người dùng mới
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Tạo tài khoản người dùng mới cho hệ thống
        </p>
      </div>

      <UserForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}