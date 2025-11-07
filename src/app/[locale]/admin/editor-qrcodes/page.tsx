'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import QRCodeDropdownMenu from '@/components/admin/common/QRCodeDropdownMenu';
import EditorQRCodeModal from '@/components/modals/EditorQRCodeModal';
import EditorCategoryQRCodeModal from '@/components/modals/EditorCategoryQRCodeModal';
const QRCodeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M16 12v3m0 0h.01M16 15v3m0 0h.01M21 21v-1a2 2 0 00-2-2H5a2 2 0 00-2 2v1m18 0h2m-18 0h-2M5 12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2zM9 8h6m-6 4h6m-6 4h6" />
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

const DotsVerticalIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

// EditorQRCode interface
interface EditorQRCode {
  id: string;
  md5_id: string;
  name: string;
  img: string | null;
  elements: string | null;
  tags: string | null;
  display: number;
  cate_dn: string;
  user_id: number;
  createdAt: string;
  updatedAt: string;
}

// Category interface
interface Category {
  id: string;
  name: string;
  display: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export default function EditorQRCodesPage() {
  const [qrCodes, setQRCodes] = useState<EditorQRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQR, setEditingQR] = useState<EditorQRCode | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDisplay, setFilterDisplay] = useState('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLButtonElement }>({});

  // Fetch categories count
  const fetchCategoriesCount = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/editor-category-qrcode');
      if (response.ok) {
        const data = await response.json();
        setTotalCategories(data.categories?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching categories count:', error);
      setTotalCategories(0);
    }
  }, []);

  // Fetch categories for filter dropdown
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/editor-category-qrcode');
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

  // Fetch QR codes
  const fetchQRCodes = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsTableLoading(true);
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (filterDisplay !== 'all') {
        params.append('display', filterDisplay);
      }

      if (filterCategory !== 'all') {
        params.append('cate_dn', filterCategory);
      }

      const response = await fetch(`/api/admin/editor-qrcodes?${params}`);
      const data = await response.json();

      if (data.editorQRCodes) {
        setQRCodes(data.editorQRCodes);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsTableLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchQRCodes(true);
      await fetchCategoriesCount();
      await fetchCategories();
    };
    loadInitialData();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      if (searchInput !== '') {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch when filters or page change (after initial load)
  useEffect(() => {
    if (!loading) {
      fetchQRCodes(false);
    }
  }, [searchTerm, filterDisplay, filterCategory, currentPage, loading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (openDropdown && !target.closest('.dropdown-menu')) {
        setOpenDropdown(null);
      }

      if (isCategoryDropdownOpen && !target.closest('.category-dropdown')) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (openDropdown || isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [openDropdown, isCategoryDropdownOpen]);

  const handleDelete = async (id: string, name?: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa QR code "${name || 'này'}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/editor-qrcodes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQRCodes((prevQRCodes) => prevQRCodes.filter((qr) => qr.id !== id));
        setTotalCount((prev) => prev - 1);
        setOpenDropdown(null);
        alert('Xóa QR code thành công');
      } else {
        alert('Có lỗi xảy ra khi xóa QR code');
      }
    } catch (error) {
      console.error('Error deleting QR code:', error);
      alert('Có lỗi xảy ra khi xóa QR code');
    }
  };

  const handleToggleDisplay = async (id: string, currentDisplay: number) => {
    const newDisplay = currentDisplay === 1 ? 0 : 1;

    // Optimistic update
    setQRCodes((prevQRCodes) =>
      prevQRCodes.map((qr) =>
        qr.id === id ? { ...qr, display: newDisplay } : qr
      )
    );

    try {
      const response = await fetch(`/api/admin/editor-qrcodes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display: newDisplay,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update display status');
      }
    } catch (error) {
      console.error('Error updating QR code:', error);
      // Revert optimistic update on error
      setQRCodes((prevQRCodes) =>
        prevQRCodes.map((qr) =>
          qr.id === id ? { ...qr, display: currentDisplay } : qr
        )
      );
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleEditQR = (qr: EditorQRCode) => {
    setEditingQR(qr);
    setShowModal(true);
    setOpenDropdown(null);
  };

  const handleModalSuccess = (_action: 'create' | 'update', data?: any) => {
    if (_action === 'create' && data) {
      // Add new QR code to the list
      setQRCodes(prevQRCodes => [data, ...prevQRCodes]);
      setTotalCount(prev => prev + 1);
      setCurrentPage(1);
    } else if (_action === 'update' && data) {
      // Update existing QR code in the list
      setQRCodes(prevQRCodes =>
        prevQRCodes.map(qr => qr.id === data.id ? data : qr)
      );
    }
    setShowModal(false);
    setEditingQR(null);
  };

  // Category modal handlers
  const handleCategoryModalSuccess = useCallback(() => {
    // Refresh categories count and list
    fetchCategoriesCount();
    fetchCategories();
    setShowCategoryModal(false);
    setEditingCategory(null);
  }, [fetchCategoriesCount, fetchCategories]);

  // Delete category
  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/editor-category-qrcode/${categoryId}`, {
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
        setCurrentPage(1);
      }

      alert('Xóa danh mục thành công');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Có lỗi xảy ra khi xóa danh mục');
    }
  }, [fetchCategories, fetchCategoriesCount, filterCategory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Quản lý QR Code
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Quản lý tất cả QR code trong hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <QRCodeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số QR code</p>
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
              onClick={() => {
                setEditingQR(null);
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm QR Code
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
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
                placeholder="Tìm kiếm theo tên QR code..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="md:w-48">
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={filterDisplay}
              onChange={(e) => {
                setFilterDisplay(e.target.value);
                setCurrentPage(1);
              }}
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
                    setCurrentPage(1);
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
                        setCurrentPage(1);
                      }}
                    >
                      {category.name}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category);
                          setShowCategoryModal(true);
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

      {/* QR Codes Grid */}
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
          ) : qrCodes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 transition-opacity duration-300 ease-in-out">
              {qrCodes.map((qr) => (
                <div
                  key={qr.id}
                  className="relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  {/* QR Code Image */}
                  <div className="aspect-square relative">
                    {qr.img ? (
                      <img
                        src={qr.img}
                        alt={qr.name}
                        className="w-full h-full object-cover cursor-pointer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <QRCodeIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    {/* Dropdown Menu Button */}
                    <div className="absolute top-2 right-2">
                      <button
                        ref={(el) => {
                          if (el) dropdownRefs.current[qr.id] = el;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === qr.id ? null : qr.id);
                        }}
                        className="p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors"
                        title="Menu"
                      >
                        <DotsVerticalIcon className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu using Portal */}
                      <QRCodeDropdownMenu
                        qrCode={qr}
                        isOpen={openDropdown === qr.id}
                        buttonRef={{ current: dropdownRefs.current[qr.id] || null }}
                        onEdit={handleEditQR}
                        onDelete={handleDelete}
                        onDisplayToggle={handleToggleDisplay}
                      />
                    </div>
                  </div>

                  {/* QR Code Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {qr.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(qr.createdAt)}
                    </p>
                    {qr.md5_id && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono truncate">
                        {qr.md5_id}
                      </p>
                    )}
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        qr.display === 1
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {qr.display === 1 ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <QRCodeIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy QR code</h3>
              <p className="text-gray-500 dark:text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc thêm QR code mới</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {qrCodes.length > 0 && totalPages > 1 && (
        <div className="flex justify-between items-center rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="text-sm text-gray-700 dark:text-gray-400">
            Hiển thị <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> đến{' '}
            <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> trong tổng số{' '}
            <span className="font-medium">{totalCount}</span> QR code
          </div>
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              ‹ Trước
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
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
                      onClick={() => setCurrentPage(1)}
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
                      onClick={() => setCurrentPage(i)}
                      className={`px-3 py-1 text-sm border rounded transition-colors ${
                        i === currentPage
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
                      onClick={() => setCurrentPage(totalPages)}
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
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
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
                  value={currentPage}
                  onChange={(e) => {
                    const newPage = parseInt(e.target.value);
                    if (newPage >= 1 && newPage <= totalPages) {
                      setCurrentPage(newPage);
                    }
                  }}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-colors"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <EditorQRCodeModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingQR(null);
        }}
        onSuccess={handleModalSuccess}
        editingQR={editingQR}
      />
      <EditorCategoryQRCodeModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSuccess={handleCategoryModalSuccess}
        editing={editingCategory}
      />
    </div>
  );
}