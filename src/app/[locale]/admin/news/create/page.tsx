'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NewsForm, { type NewsFormData } from '@/components/admin/forms/NewsForm';

export default function CreateNewsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: NewsFormData) => {
    setIsLoading(true);
    try {
      // Get author name from session
      let authorName = session?.user?.name || '';
      const user = session?.user as any;
      if (user?.first_name && user?.last_name) {
        authorName = `${user.first_name} ${user.last_name}`;
      } else if (!authorName && session?.user?.email) {
        authorName = session.user.email;
      }

      const submitData = {
        ...data,
        author: authorName,
        tags: '',
        user_id: session?.user?.id ? parseInt(session.user.id) : null,
      };

      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Có lỗi khi tạo tin tức');
      }

      router.push('/admin/news');
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thêm Tin tức mới</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Tạo tin tức mới cho hệ thống</p>
        </div>
      </div>

      <NewsForm
        mode="add"
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
