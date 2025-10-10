'use client';
import React, { useEffect, useState } from 'react';
import Input from '../form/input/InputField';
import TextArea from '../form/input/TextArea';
import Label from '../form/Label';

type NotificationTemplate = {
  id?: string;
  code: string;
  title: string;
  message: string;
};

type NotificationTemplateFormProps = {
  template?: NotificationTemplate | null;
  onSubmit: (templateData: Omit<NotificationTemplate, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export default function NotificationTemplateForm({
  template,
  onSubmit,
  onCancel,
  isLoading = false,
}: NotificationTemplateFormProps) {
  const [formData, setFormData] = useState<Omit<NotificationTemplate, 'id'>>({
    code: '',
    title: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0);

  const isEdit = !!template;

  useEffect(() => {
    if (template) {
      setFormData({
        code: template.code || '',
        title: template.title || '',
        message: template.message || '',
      });
    } else {
      setFormData({
        code: '',
        title: '',
        message: '',
      });
    }
    setFormKey(prev => prev + 1);
  }, [template]);

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Code là bắt buộc';
    } else if (!/^[\w-]+$/.test(formData.code)) {
      newErrors.code = 'Code chỉ được chứa chữ, số, dấu gạch dưới và gạch ngang';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Nội dung là bắt buộc';
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
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Chỉnh sửa mẫu thông báo' : 'Thêm mẫu thông báo mới'}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {isEdit ? 'Cập nhật thông tin mẫu thông báo' : 'Tạo mẫu thông báo mới'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" key={formKey}>
        {/* Code Field */}
        <div>
          <Label htmlFor="code">
            Mã Code
            {' '}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="code"
            type="text"
            placeholder="notification_welcome"
            value={formData.code}
            onChange={handleInputChange('code')}
            className={errors.code ? 'border-red-500' : ''}
            disabled={isEdit} // Don't allow changing code when editing
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-500">{errors.code}</p>
          )}
          {isEdit && (
            <p className="mt-1 text-sm text-gray-500">Không thể thay đổi mã code khi chỉnh sửa</p>
          )}
        </div>

        {/* Title Field */}
        <div>
          <Label htmlFor="title">
            Tiêu đề
            {' '}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="Chào mừng bạn đến với hệ thống"
            value={formData.title}
            onChange={handleInputChange('title')}
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <Label htmlFor="message">
            Nội dung
            {' '}
            <span className="text-red-500">*</span>
          </Label>
          <TextArea
            placeholder="Xin chào {name}, chào mừng bạn đến với hệ thống của chúng tôi..."
            value={formData.message}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, message: value }));
              if (errors.message) {
                setErrors(prev => ({ ...prev, message: '' }));
              }
            }}
            className={errors.message ? 'border-red-500' : ''}
            rows={6}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-500">{errors.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Bạn có thể sử dụng biến như
            {' '}
            {`{name}`}
            ,
            {' '}
            {`{email}`}
            {' '}
            trong nội dung
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isEdit ? 'Cập nhật' : 'Thêm mẫu thông báo'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg bg-gray-500 px-6 py-3 text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
