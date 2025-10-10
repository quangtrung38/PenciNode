'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import NotificationTemplateForm from '@/components/admin/forms/NotificationTemplateForm';

type NotificationTemplate = {
  id: string;
  code: string;
  title: string;
  message: string;
};

export default function EditNotificationTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<NotificationTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch template data
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/admin/notification-templates/${templateId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch template');
        }
        const data = await response.json();
        setTemplate(data.template);
      } catch (error) {
        console.error('Error fetching template:', error);
        setError('Không thể tải thông tin mẫu thông báo');
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const handleSubmit = async (templateData: Omit<NotificationTemplate, 'id'>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/notification-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update template');
      }

      // Success - redirect back to templates list
      router.push('/admin/notification-templates');
    } catch (error) {
      console.error('Error updating template:', error);
      setError('Có lỗi xảy ra khi cập nhật mẫu thông báo. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/notification-templates');
  };

  if (isLoadingTemplate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Chỉnh sửa mẫu thông báo
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Đang tải thông tin mẫu thông báo...
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-1/4 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-4 w-1/4 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-4 w-1/4 rounded bg-gray-200"></div>
            <div className="h-20 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Chỉnh sửa mẫu thông báo
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Có lỗi xảy ra
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="py-12 text-center">
            <p className="mb-4 text-red-500">{error || 'Không tìm thấy mẫu thông báo'}</p>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Chỉnh sửa mẫu thông báo
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Cập nhật thông tin cho mẫu:
          {' '}
          {template.code}
        </p>
      </div>

      <NotificationTemplateForm
        template={template}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
