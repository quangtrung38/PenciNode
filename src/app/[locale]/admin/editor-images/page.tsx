'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import EditorImageModal from '@/components/modals/EditorImageModal';
import CategoryModal from '@/components/modals/CategoryModal';
import ImageDropdownMenu from '@/components/admin/common/ImageDropdownMenu';

// SVG Icons
const EditorImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// Editor Image interface
interface EditorImage {
  id: string;
  name?: string;
  parent_id?: number;
  category_id?: string;
  img: string;
  img_thumb: string;
  img_process?: string;
  display: number;
  group_img?: string;
  group_imgThumb?: string;
  group_name?: string;
  is_background: number;
  description?: string;
  user_id?: number;
  createdAt: string;
  updatedAt: string;
}

// Category interface
interface Category {
  id: string;
  name: string;
  display: number;
  position: number;
  img: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EditorImagesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterDisplay, setFilterDisplay] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<EditorImage | null>(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<EditorImage | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLButtonElement }>({});

  // REST API state
  const [images, setImages] = useState<EditorImage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCategories, setTotalCategories] = useState(0);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [hasFetchedAfterInitial, setHasFetchedAfterInitial] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const handleFilterChange = (setter: (v: any) => void) => (e: any) => {
    setter(e.target.value);
    setPage(1);
    setHasFetchedAfterInitial(true);
  };

  // Handle page change with smooth transition
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > totalPages) {
      return;
    }
    setPage(newPage);
    setHasFetchedAfterInitial(true);
  }, [page, totalPages]);

  // Fetch categories count
  const fetchCategoriesCount = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories?limit=1');
      if (response.ok) {
        const data = await response.json();
        setTotalCategories(data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching categories count:', error);
      // Don't show error for categories count, just set to 0
      setTotalCategories(0);
    }
  }, []);

  // Fetch categories for filter dropdown
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories?limit=1000&display=all');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        console.error('Failed to fetch categories');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  // Fetch images from REST API
  const fetchImages = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsTableLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        search: searchTerm,
        display: filterDisplay,
        page: page.toString(),
        limit: limit.toString(),
      });

      // Only add category_id if it's not 'all'
      if (filterCategory !== 'all') {
        params.append('category_id', filterCategory);
      }

      const response = await fetch(`/api/admin/editor-images?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setImages(data.images || []);
      setTotalCount(data.pagination?.totalCount || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch editor images');
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsTableLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchImages(true);
      await fetchCategoriesCount();
      await fetchCategories();
      setIsInitialLoadComplete(true);
    };
    loadInitialData();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      if (searchInput !== '') {
        setHasFetchedAfterInitial(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch images when filters or page change (after initial load)
  useEffect(() => {
    if (isInitialLoadComplete && hasFetchedAfterInitial) {
      fetchImages(false);
    }
  }, [searchTerm, filterDisplay, filterCategory, page, isInitialLoadComplete, hasFetchedAfterInitial]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (isCategoryDropdownOpen && !target.closest('.category-dropdown')) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [isCategoryDropdownOpen]);

  // Keyboard support for image preview
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isImagePreviewOpen) {
        handleImagePreviewClose();
      }
    };

    if (isImagePreviewOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }

    return undefined;
  }, [isImagePreviewOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Modal handlers
  const handleAddImage = () => {
    setEditingImage(null);
    setIsModalOpen(true);
  };

  const handleEditImage = (image: EditorImage) => {
    setEditingImage(image);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingImage(null);
  };

  const handleModalSuccess = (action: 'create' | 'update', imageData?: any) => {
    if (action === 'create' && imageData) {
      // Add new image to the list and go to first page
      setImages(prevImages => [imageData, ...prevImages.slice(0, limit - 1)]);
      setTotalCount(prev => prev + 1);
      setPage(1); // Go to first page to show the new image
    } else if (action === 'update' && imageData) {
      // Update existing image in the list
      setImages(prevImages =>
        prevImages.map(img => img.id === imageData.id ? imageData : img)
      );
    }
    setIsModalOpen(false);
    setEditingImage(null);
  };

  // Image preview handlers
  const handleImageDoubleClick = (image: EditorImage) => {
    setPreviewImage(image);
    setIsImagePreviewOpen(true);
  };

  const handleImagePreviewClose = () => {
    setIsImagePreviewOpen(false);
    setPreviewImage(null);
  };

  // Category modal handlers
  const handleAddCategory = () => {
    setIsCategoryModalOpen(true);
  };

  const handleCategoryModalClose = () => {
    setIsCategoryModalOpen(false);
  };

  const handleCategoryModalSuccess = () => {
    // Refresh categories count and list
    fetchCategoriesCount();
    fetchCategories();
  };

  // Delete category
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      // Refresh categories
      fetchCategories();
      fetchCategoriesCount();

      // If the deleted category was selected in filter, reset to 'all'
      if (filterCategory === categoryId) {
        setFilterCategory('all');
        setPage(1);
        setHasFetchedAfterInitial(true);
      }

      alert('Xóa danh mục thành công');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Có lỗi xảy ra khi xóa danh mục');
    }
  };

  // Toggle display status
  const handleDisplayToggle = async (imageId: string, currentDisplay: number) => {
    const newDisplay = currentDisplay === 1 ? 0 : 1;

    // Optimistic update
    setImages((prevImages) =>
      prevImages.map((img) =>
        img.id === imageId ? { ...img, display: newDisplay } : img
      )
    );

    try {
      const response = await fetch(`/api/admin/editor-images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ display: newDisplay }),
      });

      if (!response.ok) {
        throw new Error('Failed to update display status');
      }
    } catch (error) {
      console.error('Error updating display status:', error);
      // Revert optimistic update on error
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === imageId ? { ...img, display: currentDisplay } : img
        )
      );
      alert('Có lỗi xảy ra khi cập nhật trạng thái hiển thị');
    }
  };

  // Toggle background status
  const handleBackgroundToggle = async (imageId: string, currentBackground: number) => {
    const newIsBackground = currentBackground === 1 ? 0 : 1;

    // Optimistic update
    setImages((prevImages) =>
      prevImages.map((img) =>
        img.id === imageId ? { ...img, is_background: newIsBackground } : img
      )
    );

    try {
      const response = await fetch(`/api/admin/editor-images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_background: newIsBackground }),
      });

      if (!response.ok) {
        throw new Error('Failed to update background status');
      }
    } catch (error) {
      console.error('Error updating background status:', error);
      // Revert optimistic update on error
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === imageId ? { ...img, is_background: currentBackground } : img
        )
      );
      alert('Có lỗi xảy ra khi cập nhật trạng thái background');
    }
  };

  // Delete image with confirmation
  const deleteImage = async (imageId: string, imageName?: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hình ảnh "${imageName || 'này'}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/editor-images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete editor image');
      }

      setImages((prevImages) =>
        prevImages.filter((image) => image.id !== imageId),
      );

      setTotalCount((prev) => prev - 1);

      alert('Xóa hình ảnh thành công');
    } catch (error) {
      console.error('Error deleting editor image:', error);
      alert('Có lỗi xảy ra khi xóa hình ảnh');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-96"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <EditorImageIcon className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'Đã xảy ra lỗi'}</p>
          <button
            onClick={() => fetchImages()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Quản lý Hình ảnh
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Quản lý tất cả hình ảnh trong hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <EditorImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số hình ảnh</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số danh mục</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCategories}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAddImage}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm hình ảnh mới
            </button>
            <button
              type="button"
              onClick={handleAddCategory}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Tạo danh mục
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hình ảnh..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                  setHasFetchedAfterInitial(true);
                }}
              />
            </div>
          </div>

          <div className="md:w-48">
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={filterDisplay}
              onChange={handleFilterChange(setFilterDisplay)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="1">Hiển thị</option>
              <option value="0">Ẩn</option>
            </select>
          </div>

          <div className="md:w-80 relative">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white flex items-center justify-between category-dropdown"
            >
              <span className="truncate">
                {filterCategory === 'all'
                  ? 'Tất cả danh mục'
                  : categories.find(cat => cat.id === filterCategory)?.name || 'Tất cả danh mục'
                }
              </span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto category-dropdown">
                <div
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setFilterCategory('all');
                    setIsCategoryDropdownOpen(false);
                    setPage(1);
                    setHasFetchedAfterInitial(true);
                  }}
                >
                  Tất cả danh mục
                </div>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setFilterCategory(category.id);
                        setIsCategoryDropdownOpen(false);
                        setPage(1);
                        setHasFetchedAfterInitial(true);
                      }}
                    >
                      {category.name}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category);
                          setIsCategoryModalOpen(true);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        title="Chỉnh sửa danh mục"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"? Hành động này không thể hoàn tác.`)) {
                            handleDeleteCategory(category.id);
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        title="Xóa danh mục"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="p-6">
          {isTableLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse">
                  {/* Skeleton Image */}
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700"></div>

                  {/* Skeleton Info */}
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 transition-opacity duration-300 ease-in-out">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  {/* Image */}
                  <div className="aspect-square relative">
                    <img
                      src={image.img_thumb}
                      alt={image.name || 'Editor Image'}
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onDoubleClick={() => handleImageDoubleClick(image)}
                    />

                    {/* Dropdown Menu Button */}
                    <div className="absolute top-2 right-2">
                      <button
                        ref={(el) => {
                          if (el) dropdownRefs.current[image.id] = el;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === image.id ? null : image.id);
                        }}
                        className="p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors"
                        title="Menu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {/* Dropdown Menu using Portal */}
                      <ImageDropdownMenu
                        image={image}
                        isOpen={openDropdown === image.id}
                        buttonRef={{ current: dropdownRefs.current[image.id] || null }}
                        onEdit={handleEditImage}
                        onDelete={deleteImage}
                        onDisplayToggle={handleDisplayToggle}
                        onBackgroundToggle={handleBackgroundToggle}
                      />
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {image.name || 'Untitled'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(image.createdAt)}
                    </p>
                    {image.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {image.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <EditorImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy hình ảnh</h3>
              <p className="text-gray-500 dark:text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc thêm hình ảnh mới</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {images.length > 0 && totalPages > 1 && (
        <div className="flex justify-between items-center rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="text-sm text-gray-700 dark:text-gray-400">
            Hiển thị <span className="font-medium">{((page - 1) * limit) + 1}</span> đến{' '}
            <span className="font-medium">{Math.min(page * limit, totalCount)}</span> trong tổng số{' '}
            <span className="font-medium">{totalCount}</span> hình ảnh
          </div>
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              ‹ Trước
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                // Adjust start page if we're near the end
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                // Add first page and ellipsis if needed
                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => handlePageChange(1)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span key="start-ellipsis" className="px-2 py-1 text-sm text-gray-500">
                        ...
                      </span>
                    );
                  }
                }

                // Add visible page numbers
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`px-3 py-1 text-sm border rounded transition-colors ${
                        i === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }

                // Add last page and ellipsis if needed
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="end-ellipsis" className="px-2 py-1 text-sm text-gray-500">
                        ...
                      </span>
                    );
                  }
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              Sau ›
            </button>

            {/* Page Jump Input */}
            {totalPages > 10 && (
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Đến trang:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const newPage = parseInt(e.target.value);
                    if (newPage >= 1 && newPage <= totalPages) {
                      handlePageChange(newPage);
                    }
                  }}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-colors"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor Image Modal */}
      <EditorImageModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editingImage={editingImage}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCategoryModalClose}
        onSuccess={handleCategoryModalSuccess}
        editingCategory={editingCategory}
      />

      {/* Image Preview Modal */}
      {isImagePreviewOpen && previewImage && (
        <div className="fixed inset-0 z-99999">
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-black opacity-75 backdrop-blur-sm" onClick={handleImagePreviewClose} />

          {/* Image container - positioned above overlay */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button
              onClick={handleImagePreviewClose}
              className="absolute top-4 right-4 z-20 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-200 hover:scale-110"
              title="Đóng (ESC)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image with enhanced visibility */}
            <div className="relative max-w-full max-h-full z-10">
              <img
                src={previewImage.img}
                alt={previewImage.name || 'Preview'}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl filter brightness-105 contrast-105"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Image info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent text-white p-6 rounded-b-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold mb-2 truncate">{previewImage.name || 'Untitled'}</h3>
                    <p className="text-sm opacity-90 mb-1">
                      📅 {formatDate(previewImage.createdAt)}
                    </p>
                    <div className="flex items-center gap-4 text-sm opacity-80">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        previewImage.display === 1
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {previewImage.display === 1 ? 'Hiển thị' : 'Ẩn'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        previewImage.is_background === 1
                          ? 'bg-purple-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {previewImage.is_background === 1 ? 'Background' : 'Ảnh thường'}
                      </span>
                    </div>
                    {previewImage.description && (
                      <p className="text-sm opacity-80 mt-3 line-clamp-3">{previewImage.description}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditImage(previewImage);
                        handleImagePreviewClose();
                      }}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(previewImage.id, previewImage.name);
                        handleImagePreviewClose();
                      }}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}