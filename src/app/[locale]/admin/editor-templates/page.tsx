'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import TemplateDropdownMenu from '@/components/admin/common/TemplateDropdownMenu';
import EditorTemplateModal from '@/components/modals/EditorTemplateModal';
import CollectionModal from '@/components/modals/CollectionModal';

const TemplateIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

// EditorTemplate interface
interface EditorTemplate {
  id: string;
  name: string;
  slug: string;
  img: string | null;
  display: number;
  is_favorite: 'Y' | 'N';
  cate_dn: string | null;
  collection_id: string | null;
  views: number;
  img_download_count: number;
  pdf_download_count: number;
  use_count: number;
  homePenci: number;
  is_confirm: number;
  createdAt: string;
  updatedAt: string;
}

// Product interface (for categories)
interface Product {
  id: string;
  name: string;
  display: number;
}

// Collection interface
interface Collection {
  _id: string;
  name: string;
  slug: string;
  img: string | null;
  position: number;
  display: number;
  createdAt: string;
  updatedAt: string;
}

// User interface
interface User {
  _id: string;
  name?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  displayName?: string;
}

export default function EditorTemplatesPage() {
  const [templates, setTemplates] = useState<EditorTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EditorTemplate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDisplay, setFilterDisplay] = useState('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filterCollection, setFilterCollection] = useState('all');
  const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [totalCollections, setTotalCollections] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [filterUser, setFilterUser] = useState('all');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLButtonElement }>({});

  // Fetch categories count
  const fetchCategoriesCount = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products?limit=1');
      if (response.ok) {
        const data = await response.json();
        setTotalCategories(data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching categories count:', error);
      setTotalCategories(0);
    }
  }, []);

  // Fetch categories for filter dropdown
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

  // Fetch collections for filter dropdown
  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/editor-collections?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
        setTotalCollections(data.total || 0);
      } else {
        console.error('Failed to fetch collections');
        setCollections([]);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    }
  }, []);

  // Fetch users for filter dropdown (only super admins with role = 1)
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?limit=1000&status=all&role=1');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  }, []);

  // Handle delete collection
  const handleDeleteCollection = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/editor-collections/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Xóa bộ sưu tập thành công');
        await fetchCollections();
        // Reset filter if deleted collection was selected
        if (filterCollection === id) {
          setFilterCollection('all');
        }
      } else {
        alert('Có lỗi xảy ra khi xóa bộ sưu tập');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Có lỗi xảy ra khi xóa bộ sưu tập');
    }
  };

  // Handle add collection
  const handleAddCollection = () => {
    setEditingCollection(null);
    setIsCollectionModalOpen(true);
  };

  // Fetch templates
  const fetchTemplates = async (isInitialLoad = false) => {
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

      if (filterCollection !== 'all') {
        params.append('collection_id', filterCollection);
      }

      if (filterUser !== 'all') {
        params.append('user_id', filterUser);
      }

      const response = await fetch(`/api/admin/editor-templates?${params}`);
      const data = await response.json();

      if (data.editorTemplates) {
        setTemplates(data.editorTemplates);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
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
      await fetchTemplates(true);
      await fetchCategoriesCount();
      await fetchProducts();
      await fetchCollections();
      await fetchUsers();
    };
    loadInitialData();
  }, [fetchCategoriesCount, fetchProducts, fetchCollections, fetchUsers]);

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
      fetchTemplates(false);
    }
  }, [searchTerm, filterDisplay, filterCategory, filterCollection, filterUser, currentPage, loading]);

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

      if (isCollectionDropdownOpen && !target.closest('.collection-dropdown')) {
        setIsCollectionDropdownOpen(false);
      }

      if (isUserDropdownOpen && !target.closest('.user-dropdown')) {
        setIsUserDropdownOpen(false);
      }
    };

    if (openDropdown || isCategoryDropdownOpen || isCollectionDropdownOpen || isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [openDropdown, isCategoryDropdownOpen, isCollectionDropdownOpen, isUserDropdownOpen]);

  const handleDelete = async (id: string, name?: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa template "${name || 'này'}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/editor-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates((prevTemplates) => prevTemplates.filter((template) => template.id !== id));
        setTotalCount((prev) => prev - 1);
        setOpenDropdown(null);
        alert('Xóa template thành công');
      } else {
        alert('Có lỗi xảy ra khi xóa template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Có lỗi xảy ra khi xóa template');
    }
  };

  const handleToggleDisplay = async (id: string, currentDisplay: number) => {
    const newDisplay = currentDisplay === 1 ? 0 : 1;

    // Optimistic update
    setTemplates((prevTemplates) =>
      prevTemplates.map((template) =>
        template.id === id ? { ...template, display: newDisplay } : template
      )
    );

    try {
      const response = await fetch(`/api/admin/editor-templates/${id}`, {
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
      console.error('Error updating template:', error);
      // Revert optimistic update on error
      setTemplates((prevTemplates) =>
        prevTemplates.map((template) =>
          template.id === id ? { ...template, display: currentDisplay } : template
        )
      );
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleToggleFavorite = async (id: string, currentFavorite: 'Y' | 'N') => {
    const newFavorite = currentFavorite === 'Y' ? 'N' : 'Y';

    // Optimistic update
    setTemplates((prevTemplates) =>
      prevTemplates.map((template) =>
        template.id === id ? { ...template, is_favorite: newFavorite } : template
      )
    );

    try {
      const response = await fetch(`/api/admin/editor-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_favorite: newFavorite,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      // Revert optimistic update on error
      setTemplates((prevTemplates) =>
        prevTemplates.map((template) =>
          template.id === id ? { ...template, is_favorite: currentFavorite } : template
        )
      );
      alert('Có lỗi xảy ra khi cập nhật trạng thái yêu thích');
    }
  };

  const handleEditTemplate = (template: EditorTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
    setOpenDropdown(null);
  };

  const handleModalSuccess = (_action: 'create' | 'update', data?: any) => {
    if (_action === 'create' && data) {
      // Add new template to the list
      setTemplates(prevTemplates => [data, ...prevTemplates]);
      setTotalCount(prev => prev + 1);
      setCurrentPage(1);
    } else if (_action === 'update' && data) {
      // Update existing template in the list
      setTemplates(prevTemplates =>
        prevTemplates.map(template => template.id === data.id ? data : template)
      );
    }
    setShowModal(false);
    setEditingTemplate(null);
  };

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
          Quản lý Template
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Quản lý tất cả template trong hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <TemplateIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số template</p>
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
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bộ sưu tập</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCollections}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingTemplate(null);
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm Template
            </button>
            <button
              type="button"
              onClick={handleAddCollection}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Tạo bộ sưu tập
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm template..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap gap-2">
            {/* Display Status */}
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white min-w-[120px]"
              value={filterDisplay}
              onChange={(e) => {
                setFilterDisplay(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Trạng thái</option>
              <option value="1">Hiển thị</option>
              <option value="0">Ẩn</option>
            </select>

            {/* Category Filter */}
            <div className="relative min-w-[140px]">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white flex items-center justify-between category-dropdown"
              >
                <span className="truncate">
                  {filterCategory === 'all'
                    ? 'Danh mục'
                    : products.find(cat => cat.id === filterCategory)?.name || 'Danh mục'
                  }
                </span>
                <svg className="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setFilterCategory(product.id);
                      setIsCategoryDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                  >
                    {product.name}
                  </div>
                ))}
              </div>
            )}
            </div>

            {/* Collection Filter */}
            <div className="relative min-w-[140px]">
              <button
                type="button"
                onClick={() => setIsCollectionDropdownOpen(!isCollectionDropdownOpen)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white flex items-center justify-between collection-dropdown"
              >
                <span className="truncate">
                  {filterCollection === 'all'
                    ? 'Bộ sưu tập'
                    : collections.find(col => col._id === filterCollection)?.name || 'Bộ sưu tập'
                  }
                </span>
                <svg className="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

            {isCollectionDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto collection-dropdown">
                <div
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setFilterCollection('all');
                    setIsCollectionDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                >
                  Tất cả bộ sưu tập
                </div>
                {collections.map((collection) => (
                  <div
                    key={collection._id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setFilterCollection(collection._id);
                        setIsCollectionDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      {collection.name}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCollection(collection);
                          setIsCollectionModalOpen(true);
                          setIsCollectionDropdownOpen(false);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        title="Chỉnh sửa bộ sưu tập"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Bạn có chắc chắn muốn xóa bộ sưu tập "${collection.name}"? Hành động này không thể hoàn tác.`)) {
                            handleDeleteCollection(collection._id);
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        title="Xóa bộ sưu tập"
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

            {/* User Filter */}
            <div className="relative min-w-[140px]">
              <button
                type="button"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white flex items-center justify-between user-dropdown"
              >
                <span className="truncate">
                  {filterUser === 'all'
                    ? 'Người dùng'
                    : (() => {
                        const user = users.find(u => u._id === filterUser);
                        return user ? (user.name || user.email) : 'Người dùng';
                      })()
                  }
                </span>
                <svg className="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

            {isUserDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto user-dropdown">
                <div
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setFilterUser('all');
                    setIsUserDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                >
                  Tất cả người dùng
                </div>
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setFilterUser(user._id);
                      setIsUserDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.name || user.email}
                    </div>
                    {user.name && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
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
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 transition-opacity duration-300 ease-in-out">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  {/* Template Image */}
                  <div className="aspect-square relative">
                    {template.img ? (
                      <img
                        src={template.img}
                        alt={template.name}
                        className="w-full h-full object-cover cursor-pointer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <TemplateIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    {/* Action Buttons - Top Right */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {/* Toggle Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(template.id, template.is_favorite);
                        }}
                        className="p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors"
                        title={template.is_favorite === 'Y' ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                      >
                        {template.is_favorite === 'Y' ? (
                          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        )}
                      </button>

                      {/* Dropdown Menu Button */}
                      <button
                        ref={(el) => {
                          if (el) dropdownRefs.current[template.id] = el;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === template.id ? null : template.id);
                        }}
                        className="p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors"
                        title="Menu"
                      >
                        <DotsVerticalIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dropdown Menu using Portal */}
                    <TemplateDropdownMenu
                      template={template as any}
                      isOpen={openDropdown === template.id}
                      buttonRef={{ current: dropdownRefs.current[template.id] as HTMLButtonElement }}
                      onEdit={handleEditTemplate as any}
                      onDelete={handleDelete}
                      onDisplayToggle={handleToggleDisplay}
                      onFavoriteToggle={handleToggleFavorite}
                    />
                  </div>

                  {/* Template Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(template.createdAt)}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        template.display === 1
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {template.display === 1 ? 'Hiển thị' : 'Ẩn'}
                      </span>
                      {template.homePenci === 1 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                          Trang chủ
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span title="Lượt xem">👁️ {template.views}</span>
                      <span title="Lượt dùng">📝 {template.use_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TemplateIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy template</h3>
              <p className="text-gray-500 dark:text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc thêm template mới</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {templates.length > 0 && totalPages > 1 && (
        <div className="flex justify-between items-center rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="text-sm text-gray-700 dark:text-gray-400">
            Hiển thị <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> đến{' '}
            <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> trong tổng số{' '}
            <span className="font-medium">{totalCount}</span> template
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

      {/* Template Modal */}
      <EditorTemplateModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTemplate(null);
        }}
        onSuccess={handleModalSuccess}
        editingTemplate={editingTemplate}
      />

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setEditingCollection(null);
        }}
        onSave={() => {
          fetchCollections();
        }}
        collection={editingCollection}
      />
    </div>
  );
}
