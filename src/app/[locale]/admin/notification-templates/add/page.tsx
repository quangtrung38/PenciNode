'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import NotificationTemplateForm from '@/components/admin/forms/NotificationTemplateForm';

type NotificationTemplate = {
  code: string;
  title: string;
  message: string;
};

export default function AddNotificationTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (templateData: NotificationTemplate) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/notification-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create notification template');
      }

      // Success - redirect back to templates list
      router.push('/admin/notification-templates');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Có lỗi xảy ra khi tạo mẫu thông báo. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/notification-templates');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Thêm mẫu thông báo mới
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Tạo mẫu thông báo mới cho hệ thống
        </p>
      </div>

      <NotificationTemplateForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}