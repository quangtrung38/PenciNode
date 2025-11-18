"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { useSession } from 'next-auth/react';

interface EditorTemplate {
  id?: string;
  name: string;
  img: string | null;
  display: number;
  cate_dn: string | null;
  collection_id?: string | null;
  is_favorite?: 'Y' | 'N';
  homePenci?: number;
}

interface Product {
  id: string;
  tgia_product: number;
  name: string;
  display: number;
}

interface Collection {
  _id: string;
  name: string;
  display: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (action: 'create' | 'update', data: any) => void;
  editingTemplate?: EditorTemplate | null;
}

export default function EditorTemplateModal({ isOpen, onClose, onSuccess, editingTemplate }: Props) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<EditorTemplate>({
    name: '',
    img: null,
    display: 1,
    cate_dn: null,
    collection_id: null,
    is_favorite: 'N',
    homePenci: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch products (categories)
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products?limit=1000&display=all');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        console.error('Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  }, []);

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/editor-collections?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      } else {
        console.error('Failed to fetch collections');
        setCollections([]);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchCollections();
      if (editingTemplate) {
        setFormData({
          name: editingTemplate.name || '',
          img: editingTemplate.img || null,
          display: editingTemplate.display ?? 1,
          cate_dn: editingTemplate.cate_dn || null,
          collection_id: editingTemplate.collection_id || null,
          is_favorite: editingTemplate.is_favorite || 'N',
          homePenci: editingTemplate.homePenci || 0,
        });
        setImagePreview(editingTemplate.img || null);
        setSelectedFile(null);
      } else {
        setFormData({
          name: '',
          img: null,
          display: 1,
          cate_dn: null,
          collection_id: null,
          is_favorite: 'N',
          homePenci: 0,
        });
        setImagePreview(null);
        setSelectedFile(null);
      }
      setError(null);
    }
  }, [isOpen, editingTemplate, fetchProducts, fetchCollections]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'display' || name === 'homePenci' ? Number(value) : value,
    }));
  };

  const handleToggleDisplay = () => {
    setFormData(prev => ({ ...prev, display: prev.display === 1 ? 0 : 1 }));
  };

  // Unused handlers - kept for potential future use
  // const handleToggleFavorite = () => {
  //   setFormData(prev => ({ ...prev, is_favorite: prev.is_favorite === 'Y' ? 'N' : 'Y' }));
  // };

  // const handleToggleHomePenci = () => {
  //   setFormData(prev => ({ ...prev, homePenci: prev.homePenci === 1 ? 0 : 1 }));
  // };

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)';
    }

    if (file.size > maxSize) {
      return 'Kích thước file không được vượt quá 10MB';
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
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
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImageToCloudinary = async (file: File) => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const uploadResponse = await fetch('/api/admin/editor-images/upload', {
      method: 'POST',
      body: formDataUpload,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(uploadResult.error || 'Failed to upload image to Cloudinary');
    }

    return uploadResult;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    // Validation
    if (!formData.name?.trim()) {
      setError('Tên template là bắt buộc');
      return;
    }

    if (!editingTemplate && !selectedFile && !imagePreview) {
      setError('Hình ảnh là bắt buộc');
      return;
    }

    setIsLoading(true);
    try {
      let finalImageUrl = imagePreview;

      // Upload new image if selected
      if (selectedFile) {
        const uploadResult = await uploadImageToCloudinary(selectedFile);
        finalImageUrl = uploadResult.fileUrl;
      } else if (editingTemplate) {
        // Keep existing image if no new file selected in edit mode
        finalImageUrl = editingTemplate.img;
      } else {
        throw new Error('Vui lòng chọn hình ảnh');
      }

      const submitData: any = {
        ...formData,
        name: formData.name.trim(),
        img: finalImageUrl,
      };

      // Add user_id when creating new template
      if (!editingTemplate && session?.user?.id) {
        submitData.user_id = parseInt(session.user.id);
      }

      const url = editingTemplate
        ? `/api/admin/editor-templates/${editingTemplate.id}`
        : '/api/admin/editor-templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi khi lưu template');
      }

      onSuccess(editingTemplate ? 'update' : 'create', data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
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
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingTemplate ? 'Chỉnh sửa Template' : 'Thêm Template mới'}
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên Template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Nhập tên template"
                  disabled={isLoading}
                />
              </div>

              {/* Display Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hiển thị
                </label>
                <button
                  type="button"
                  onClick={handleToggleDisplay}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.display === 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.display === 1 ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  {formData.display === 1 ? 'Đang hiển thị' : 'Đang ẩn'}
                </span>
              </div>

              {/* Category (Product) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Danh mục
                </label>
                <select
                  name="cate_dn"
                  value={formData.cate_dn || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="">Không có danh mục</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Collection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bộ sưu tập
                </label>
                <select
                  name="collection_id"
                  value={formData.collection_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, collection_id: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="">Không có bộ sưu tập</option>
                  {collections.map((collection) => (
                    <option key={collection._id} value={collection._id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hình ảnh {!editingTemplate && <span className="text-red-500">*</span>}
                </label>

                {imagePreview ? (
                  <div className="space-y-4">
                    {/* Current Image Preview */}
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={isLoading}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

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
                            JPG, PNG, GIF, WebP (tối đa 10MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-25 dark:hover:bg-blue-900/10'
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
                          JPG, PNG, GIF, WebP (tối đa 10MB)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Đang lưu...' : (editingTemplate ? 'Cập nhật' : 'Tạo Template')}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
