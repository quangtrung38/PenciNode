'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';

interface EditorTag {
  id: string;
  name: string;
  slug: string;
  display: number;
  display_cate: number;
  position: number;
  is_cate: boolean;
  img: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EditorTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (action: 'create' | 'update', data: any) => void;
  editingTag: EditorTag | null;
}

export default function EditorTagModal({
  isOpen,
  onClose,
  onSuccess,
  editingTag,
}: EditorTagModalProps) {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes or editing item changes
  useEffect(() => {
    if (isOpen) {
      if (editingTag) {
        setFormData({
          name: editingTag.name,
        });
        setImagePreview(editingTag.img);
      } else {
        setFormData({
          name: '',
        });
        setImagePreview(null);
      }
      setSelectedFile(null);
      setError(null);
    }
  }, [isOpen, editingTag]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImageToCloudinary = async (file: File) => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const uploadResponse = await fetch('/api/admin/editor-tags/upload', {
      method: 'POST',
      body: formDataUpload,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(uploadResult.error || 'Failed to upload image to Cloudinary');
    }

    return uploadResult;
  };

  const deleteOldImage = async (imageUrl: string) => {
    try {
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');

      if (uploadIndex === -1 || uploadIndex >= urlParts.length - 2) {
        console.warn('Invalid Cloudinary URL format:', imageUrl);
        return;
      }

      // Skip version (v{number}) and get the public_id
      let publicIdParts = [];
      for (let i = uploadIndex + 1; i < urlParts.length; i++) {
        const part = urlParts[i];
        if (!part) continue;
        // Skip version parts that start with 'v' followed by digits
        if (part.match(/^v\d+$/)) {
          continue;
        }
        publicIdParts.push(part);
      }

      const publicIdWithExtension = publicIdParts.join('/');
      const publicId = publicIdWithExtension.split('.')[0]; // Remove file extension

      console.log('Extracted publicId:', publicId);

      await fetch('/api/admin/editor-tags/delete-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId }),
      });
    } catch (error) {
      console.warn('Failed to delete old image:', error);
      // Don't throw error here as it's not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        throw new Error('Tên danh mục là bắt buộc');
      }

      let finalImageUrl = imagePreview;

      // Upload new image if selected
      if (selectedFile) {
        // If editing and changing image, delete old images first
        if (editingTag && editingTag.img) {
          await deleteOldImage(editingTag.img);
        }

        const uploadResult = await uploadImageToCloudinary(selectedFile);
        finalImageUrl = uploadResult.fileUrl;
      } else if (editingTag) {
        // Keep existing image if no new file selected in edit mode
        finalImageUrl = editingTag.img;
      }

      // Prepare data for submission
      const submitData = editingTag
        ? {
            name: formData.name.trim(),
            img: finalImageUrl,
          }
        : {
            name: formData.name.trim(),
            img: finalImageUrl,
            display: 1,
          };

      const url = editingTag
        ? `/api/admin/editor-tags/${editingTag.id}`
        : '/api/admin/editor-tags';

      const method = editingTag ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${editingTag ? 'update' : 'create'} editor tag`);
      }

      // Call success callback with action and tag data
      const action = editingTag ? 'update' : 'create';
      const tagData = result.editorTag || result.data;
      onSuccess(action, tagData);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-99999">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black opacity-75 backdrop-blur-sm" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingTag ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Nhập tên danh mục"
                />
              </div>

              {/* Current Image Preview */}
              {imagePreview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ảnh hiện tại
                  </label>
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Xóa hình ảnh"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {imagePreview ? 'Thay đổi ảnh' : 'Hình ảnh'}
                </label>

                {!imagePreview ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-4">
                      <div className="mx-auto w-12 h-12 text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Kéo thả hình ảnh vào đây hoặc click để chọn file
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG, GIF, WebP (tối đa 5MB)
                        </p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Drag & Drop Zone for changing image */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-25 dark:hover:bg-blue-900/10'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="space-y-2">
                        <div className="mx-auto w-8 h-8 text-gray-400">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Kéo thả hình ảnh mới vào đây hoặc click để chọn file
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, GIF, WebP (tối đa 5MB)
                          </p>
                        </div>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingTag ? 'Đang cập nhật...' : 'Đang tạo...'}
                </div>
              ) : (
                editingTag ? 'Cập nhật' : 'Tạo danh mục'
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}