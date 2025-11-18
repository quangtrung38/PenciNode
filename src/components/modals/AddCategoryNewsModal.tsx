'use client';

import { useState, useEffect } from 'react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  img?: string;
  display: number;
  position: number;
  parent_id: string | null;
}

interface AddCategoryNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCategory?: Category | null;
  categories?: Category[];
}

export default function AddCategoryNewsModal({
  isOpen,
  onClose,
  onSuccess,
  editingCategory,
  categories = [],
}: AddCategoryNewsModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    img: '',
    display: 1,
    position: 0,
    parent_id: '' as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name || '',
        slug: editingCategory.slug || '',
        img: editingCategory.img || '',
        display: editingCategory.display || 1,
        position: editingCategory.position || 0,
        parent_id: editingCategory.parent_id || null,
      });
      setPreviewUrl(editingCategory.img || '');
      setSelectedFile(null);
    } else {
      setFormData({
        name: '',
        slug: '',
        img: '',
        display: 1,
        position: 0,
        parent_id: null,
      });
      setPreviewUrl('');
      setSelectedFile(null);
    }
  }, [editingCategory, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate slug when name changes
    if (name === 'name' && !editingCategory) {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      setFormData(prev => ({
        ...prev,
        name: value,
        slug,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'display' || name === 'position'
          ? Number(value) 
          : name === 'parent_id'
          ? value || null
          : value,
      }));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const response = await fetch('/api/admin/editor-images/upload', {
      method: 'POST',
      body: formDataUpload,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.fileUrl;
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn file hình ảnh');
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImageSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    handleImageSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      setUploadingImage(true);

      // Upload image if a new file was selected
      let imageUrl = formData.img;
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const submitData = {
        ...formData,
        img: imageUrl,
      };

      const url = editingCategory
        ? `/api/admin/editor-category-news/${editingCategory._id}`
        : '/api/admin/editor-category-news';

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save category');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Danh mục cha
              </label>
              <select
                name="parent_id"
                value={formData.parent_id || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Không có (Danh mục gốc)</option>
                {categories
                  .filter(cat => !editingCategory || cat._id !== editingCategory._id)
                  .map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Tự động tạo từ tên"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hình ảnh
              </label>
              
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    <img src={previewUrl} alt="Preview" className="h-32 rounded mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click hoặc kéo thả để thay đổi ảnh
                    </p>
                    {selectedFile && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        Ảnh sẽ được upload khi lưu danh mục
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-medium text-blue-600 dark:text-blue-400">Click để chọn</span> hoặc kéo thả ảnh vào đây
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vị trí
              </label>
              <input
                type="number"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, display: prev.display === 1 ? 0 : 1 }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  formData.display === 1 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.display === 1 ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hiển thị
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cho phép danh mục hiển thị công khai
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingImage}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || uploadingImage ? (uploadingImage ? 'Đang upload ảnh...' : 'Đang lưu...') : (editingCategory ? 'Cập nhật' : 'Thêm mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
