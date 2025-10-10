'use client';

import { useState, useEffect } from 'react';

type Plan = {
  id?: string;
  name: string;
  type: string;
  storage_capacity?: string;
  ai_points?: string;
  template_limit?: string;
  downloads_limit?: string;
  template_library: string;
  graphics_library: string;
  customer_support: string;
  price: string;
  ai_duration_unit: string;
  active?: boolean;
};

type PlanFormProps = {
  plan?: Plan | null;
  onSubmit: (planData: Omit<Plan, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export default function PlanForm({ plan, onSubmit, onCancel, isLoading = false }: PlanFormProps) {
  const [formData, setFormData] = useState<Omit<Plan, 'id'>>({
    name: '',
    type: 'individual',
    storage_capacity: '',
    ai_points: '',
    template_limit: '',
    downloads_limit: '',
    template_library: 'basic',
    graphics_library: 'basic',
    customer_support: 'basic',
    price: '0',
    ai_duration_unit: 'day',
    active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0); // To force re-render

  const isEdit = !!plan;

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        type: plan.type || 'individual',
        storage_capacity: plan.storage_capacity?.toString() || '',
        ai_points: plan.ai_points?.toString() || '',
        template_limit: plan.template_limit?.toString() || '',
        downloads_limit: plan.downloads_limit?.toString() || '',
        template_library: plan.template_library || 'basic',
        graphics_library: plan.graphics_library || 'basic',
        customer_support: plan.customer_support || 'basic',
        price: plan.price?.toString() || '0',
        ai_duration_unit: plan.ai_duration_unit || 'month',
        active: plan.active !== undefined ? plan.active : true,
      });
    } else {
      setFormData({
        name: '',
        type: 'individual',
        storage_capacity: '',
        ai_points: '',
        template_limit: '',
        downloads_limit: '',
        template_library: 'basic',
        graphics_library: 'basic',
        customer_support: 'basic',
        price: '0',
        ai_duration_unit: 'month',
        active: true,
      });
    }
    setFormKey(prev => prev + 1);
  }, [plan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên gói là bắt buộc';
    }

    if (!formData.type) {
      newErrors.type = 'Loại gói là bắt buộc';
    }

    // Validate numeric fields if provided
    const numericFields = ['storage_capacity', 'ai_points', 'template_limit', 'downloads_limit', 'price'];
    numericFields.forEach(field => {
      const value = formData[field as keyof typeof formData] as string;
      if (value && value.trim() && isNaN(Number(value))) {
        newErrors[field] = 'Giá trị phải là số';
      }
    });

    // Price should be non-negative
    if (formData.price && Number(formData.price) < 0) {
      newErrors.price = 'Giá không được là số âm';
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
      // Error handling is done in parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plan Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên gói <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập tên gói dịch vụ"
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Plan Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại gói <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="individual">Cá nhân</option>
              <option value="group">Nhóm</option>
              <option value="classroom">Lớp học</option>
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
          </div>
        </div>
      </div>

      {/* Limits and Features */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Giới hạn và tính năng</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Storage Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dung lượng lưu trữ (MB)
            </label>
            <input
              type="number"
              name="storage_capacity"
              value={formData.storage_capacity}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.storage_capacity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ví dụ: 1000"
              min="0"
            />
            {errors.storage_capacity && <p className="mt-1 text-sm text-red-600">{errors.storage_capacity}</p>}
          </div>

          {/* AI Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Điểm AI
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="ai_points"
                value={formData.ai_points}
                onChange={handleChange}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.ai_points ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="5000"
                min="0"
              />
              <select
                name="ai_duration_unit"
                value={formData.ai_duration_unit}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[100px]"
              >
                <option value="day">/Ngày</option>
                <option value="month">/Tháng</option>
              </select>
            </div>
            {errors.ai_points && <p className="mt-1 text-sm text-red-600">{errors.ai_points}</p>}
          </div>

          {/* Template Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giới hạn template
            </label>
            <input
              type="number"
              name="template_limit"
              value={formData.template_limit}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.template_limit ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ví dụ: 50"
              min="0"
            />
            {errors.template_limit && <p className="mt-1 text-sm text-red-600">{errors.template_limit}</p>}
          </div>

          {/* Downloads Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giới hạn tải xuống
            </label>
            <input
              type="number"
              name="downloads_limit"
              value={formData.downloads_limit}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.downloads_limit ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ví dụ: 20"
              min="0"
            />
            {errors.downloads_limit && <p className="mt-1 text-sm text-red-600">{errors.downloads_limit}</p>}
          </div>
        </div>
      </div>

      {/* Library Access */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quyền truy cập thư viện</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Template Library */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thư viện mẫu
            </label>
            <select
              name="template_library"
              value={formData.template_library}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="basic">Cơ bản</option>
              <option value="premium">Cao cấp</option>
            </select>
          </div>

          {/* Graphics Library */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thư viện đồ họa
            </label>
            <select
              name="graphics_library"
              value={formData.graphics_library}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="basic">Cơ bản</option>
              <option value="premium">Cao cấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Support and Pricing */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hỗ trợ và giá cả</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer Support */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hỗ trợ khách hàng
            </label>
            <select
              name="customer_support"
              value={formData.customer_support}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="basic">Cơ bản</option>
              <option value="priority">Ưu tiên</option>
              <option value="special">Đặc biệt</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá (VNĐ)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0 = Miễn phí"
              min="0"
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          {/* AI Duration Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đơn vị thời gian AI
            </label>
            <select
              name="ai_duration_unit"
              value={formData.ai_duration_unit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="day">Ngày</option>
              <option value="month">Tháng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trạng thái</h3>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            name="active"
            checked={formData.active}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-700">
            Gói đang hoạt động
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEdit ? 'Đang cập nhật...' : 'Đang tạo...'}
            </div>
          ) : (
            isEdit ? 'Cập nhật gói' : 'Tạo gói'
          )}
        </button>
      </div>
    </form>
  );
}