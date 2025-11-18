'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Editor } from '@tinymce/tinymce-react';
import { Env } from '@/libs/Env';

// Types
export interface NewsFormData {
  title: string;
  slug: string;
  summary: string;
  image: string;
  category_id: string;
  content: string;
  display: number;
  enable: number;
  page_title: string;
  page_keyword: string;
  page_description: string;
}

export interface NewsFormProps {
  mode: 'add' | 'edit';
  initialData?: Partial<NewsFormData>;
  newsId?: string;
  onSubmit: (data: NewsFormData) => Promise<void>;
  isLoading?: boolean;
}

interface Category {
  _id: string;
  name: string;
  display: number;
}

// Function to generate slug from Vietnamese text
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Save icon component
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

export const NewsForm: React.FC<NewsFormProps> = ({
  mode,
  initialData = {},
  onSubmit,
  isLoading = false,
}) => {
  const router = useRouter();
  const editorRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const [formData, setFormData] = useState<NewsFormData>({
    title: initialData.title || '',
    slug: initialData.slug || '',
    summary: initialData.summary || '',
    image: initialData.image || '',
    category_id: initialData.category_id || '',
    content: initialData.content || '',
    display: initialData.display !== undefined ? initialData.display : 1,
    enable: initialData.enable !== undefined ? initialData.enable : 1,
    page_title: initialData.page_title || '',
    page_keyword: initialData.page_keyword || '',
    page_description: initialData.page_description || '',
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/editor-category-news?display=1');
        const data = await response.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Set initial preview URL
  useEffect(() => {
    if (initialData.image) {
      setPreviewUrl(initialData.image);
    }
  }, [initialData.image]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate slug when title changes in add mode
    if (name === 'title' && mode === 'add') {
      setFormData((prev) => ({
        ...prev,
        title: value,
        slug: generateSlug(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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
    setError(null);

    try {
      setUploadingImage(true);

      // Upload image if a new file was selected
      let imageUrl = formData.image;
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      // Get content from TinyMCE
      const content = editorRef.current ? editorRef.current.getContent() : '';

      const submitData: NewsFormData = {
        ...formData,
        image: imageUrl,
        content,
      };

      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu tin tức');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Thông tin cơ bản</h2>
        
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Slug
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Tự động tạo từ tiêu đề"
            />
          </div>

          {/* Category */}
          <div className="max-w-xs">
            <label htmlFor="category_id" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Danh mục
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả ngắn
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hình ảnh đại diện
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 hover:border-blue-400 dark:border-gray-600'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <img src={previewUrl} alt="Preview" className="mb-3 h-32 rounded" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click hoặc kéo thả để thay đổi ảnh
                  </p>
                  {selectedFile && (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      Ảnh sẽ được upload khi lưu tin tức
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <svg
                    className="mb-3 h-12 w-12 text-gray-400"
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
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-blue-600 dark:text-blue-400">Click để chọn</span> hoặc kéo thả ảnh vào đây
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Display Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, display: prev.display === 1 ? 0 : 1 }))}
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Hiển thị
            </label>
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Nội dung</h2>
        <Editor
          apiKey={Env.NEXT_PUBLIC_TINYMCE_API_KEY || 'no-api-key'}
          onInit={(_evt, editor) => (editorRef.current = editor)}
          initialValue={initialData.content || ''}
          init={{
            height: 500,
            menubar: true,
            plugins: [
              'preview',
              'importcss',
              'searchreplace',
              'autolink',
              'autosave',
              'save',
              'directionality',
              'code',
              'visualblocks',
              'visualchars',
              'fullscreen',
              'image',
              'link',
              'media',
              'codesample',
              'table',
              'charmap',
              'pagebreak',
              'nonbreaking',
              'anchor',
              'insertdatetime',
              'advlist',
              'lists',
              'wordcount',
              'help',
              'charmap',
              'quickbars',
              'emoticons',
            ],
            toolbar:
              'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help | image media link',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
            images_upload_handler: async (blobInfo: any) => {
              const formData = new FormData();
              formData.append('file', blobInfo.blob());

              const response = await fetch('/api/admin/editor-images/upload', {
                method: 'POST',
                body: formData,
              });

              const data = await response.json();
              if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
              }

              return data.fileUrl;
            },
          }}
        />
      </div>

      {/* SEO Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">SEO</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="page_title" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Page Title
            </label>
            <input
              type="text"
              id="page_title"
              name="page_title"
              value={formData.page_title}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="page_keyword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Keywords
            </label>
            <input
              type="text"
              id="page_keyword"
              name="page_keyword"
              value={formData.page_keyword}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="page_description" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="page_description"
              name="page_description"
              value={formData.page_description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          disabled={isLoading}
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isLoading || uploadingImage}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading || uploadingImage ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>{uploadingImage ? 'Đang upload ảnh...' : 'Đang lưu...'}</span>
            </>
          ) : (
            <>
              <SaveIcon />
              <span>{mode === 'add' ? 'Tạo mới' : 'Cập nhật'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default NewsForm;
