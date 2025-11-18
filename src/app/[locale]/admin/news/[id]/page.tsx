'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NewsForm, { type NewsFormData } from '@/components/admin/forms/NewsForm';

export default function EditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<NewsFormData> | null>(null);

  // Fetch news data
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`/api/admin/news/${params.id}`);
        if (!response.ok) {
          throw new Error('Không tìm thấy tin tức');
        }
        const data = await response.json();
        
        setInitialData({
          title: data.title || '',
          slug: data.slug || '',
          summary: data.summary || '',
          image: data.image || '',
          category_id: data.category_id || '',
          display: data.display || 0,
          enable: data.enable || 1,
          page_title: data.page_title || '',
          page_keyword: data.page_keyword || '',
          page_description: data.page_description || '',
          content: data.content || '',
        });
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchNews();
    }
  }, [params.id]);

  const handleSubmit = async (data: NewsFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/news/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Có lỗi khi cập nhật tin tức');
      }

      router.push('/admin/news');
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={() => router.push('/admin/news')}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chỉnh sửa Tin tức</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cập nhật thông tin tin tức</p>
        </div>
      </div>

      <NewsForm
        mode="edit"
        initialData={initialData}
        newsId={params.id as string}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
