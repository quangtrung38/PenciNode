'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AddCategoryNewsModal from '@/components/modals/AddCategoryNewsModal';

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

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

interface News {
  id: string;
  title: string;
  slug: string;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  author: string | null;
  image: string | null;
  display: number;
  enable: number;
  view_count: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  img?: string;
  display: number;
  position: number;
  parent_id: string | null;
}

export default function NewsPage() {
  const router = useRouter();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [filterDisplay, setFilterDisplay] = useState('all');
  const [filterEnable, setFilterEnable] = useState('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch categories with cache
  const fetchCategories = async () => {
    try {
      // Try to get from cache first (valid for 5 minutes)
      const cached = localStorage.getItem('news_categories_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > 5 * 60 * 1000; // 5 minutes
        if (!isExpired) {
          setCategories(data);
          return;
        }
      }

      // Fetch from API if no cache or expired
      const response = await fetch('/api/admin/editor-category-news');
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
        // Cache the result
        localStorage.setItem('news_categories_cache', JSON.stringify({
          data: data.categories,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch news
  const fetchNews = async (isInitialLoad = false) => {
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

      if (filterEnable !== 'all') {
        params.append('enable', filterEnable);
      }

      if (filterCategory !== 'all') {
        params.append('category_id', filterCategory);
      }

      const response = await fetch(`/api/admin/news?${params}`);
      const data = await response.json();

      if (data.news) {
        setNews(data.news);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
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
    fetchNews(true);
    fetchCategories();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Fetch when filters or page change
  useEffect(() => {
    if (!loading) {
      fetchNews(false);
    }
  }, [searchTerm, filterDisplay, filterEnable, filterCategory, currentPage, loading]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tin "${title}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Xóa tin tức thành công');
        await fetchNews(false);
      } else {
        alert('Có lỗi xảy ra khi xóa tin tức');
      }
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('Có lỗi xảy ra khi xóa tin tức');
    }
  };

  const handleToggleDisplay = async (id: string, currentDisplay: number) => {
    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display: currentDisplay === 1 ? 0 : 1,
        }),
      });

      if (response.ok) {
        await fetchNews(false);
      }
    } catch (error) {
      console.error('Error toggling display:', error);
    }
  };

  const handleToggleEnable = async (id: string, currentEnable: number) => {
    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enable: currentEnable === 1 ? 0 : 1,
        }),
      });

      if (response.ok) {
        await fetchNews(false);
      }
    } catch (error) {
      console.error('Error toggling enable:', error);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
    setIsCategoryDropdownOpen(false);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/editor-category-news/${category._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Xóa danh mục thành công');
        // Clear cache before fetching
        localStorage.removeItem('news_categories_cache');
        await fetchCategories();
        if (filterCategory === category._id) {
          setFilterCategory('all');
        }
      } else {
        alert('Có lỗi xảy ra khi xóa danh mục');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Có lỗi xảy ra khi xóa danh mục');
    }
  };

  const handleCategoryModalSuccess = () => {
    // Clear cache before fetching
    localStorage.removeItem('news_categories_cache');
    fetchCategories();
    setEditingCategory(null);
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý Tin tức</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Quản lý tất cả tin tức trong hệ thống</p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Tổng số tin tức */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số tin tức</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
              </div>
            </div>

            {/* Tổng số danh mục */}
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số danh mục</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/admin/news/create')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Thêm Tin tức
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tin tức..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white min-w-[120px]"
              value={filterDisplay}
              onChange={(e) => {
                setFilterDisplay(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Hiển thị</option>
              <option value="1">Đang hiển thị</option>
              <option value="0">Đang ẩn</option>
            </select>

            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white min-w-[120px]"
              value={filterEnable}
              onChange={(e) => {
                setFilterEnable(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Trạng thái</option>
              <option value="1">Kích hoạt</option>
              <option value="0">Vô hiệu hóa</option>
            </select>

            {/* Category Filter with Edit/Delete */}
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white min-w-[150px]"
              >
                <span className="truncate">
                  {filterCategory === 'all'
                    ? 'Danh mục'
                    : categories.find(c => c._id === filterCategory)?.name || 'Danh mục'}
                </span>
                <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setIsCategoryModalOpen(true);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg mb-1"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Thêm danh mục mới
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterCategory('all');
                        setCurrentPage(1);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg ${
                        filterCategory === 'all'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Tất cả danh mục
                    </button>
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        className={`group flex items-center justify-between px-3 py-2 text-sm rounded-lg ${
                          filterCategory === category._id
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setFilterCategory(category._id);
                            setCurrentPage(1);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="flex-1 text-left truncate"
                        >
                          {category.name}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCategory(category);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                            title="Sửa"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                            title="Xóa"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tác giả
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lượt xem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {isTableLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : news.length > 0 ? (
                news.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center max-w-md">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-10 w-10 rounded object-cover mr-3 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={item.title}>
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={item.slug}>
                            {item.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {item.category_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {item.author || '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {item.view_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {/* Display Toggle */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleDisplay(item.id, item.display)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                              item.display === 1 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                item.display === 1 ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {item.display === 1 ? 'Hiển thị' : 'Ẩn'}
                          </span>
                        </div>
                        {/* Enable Toggle */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleEnable(item.id, item.enable)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                              item.enable === 1 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                item.enable === 1 ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {item.enable === 1 ? 'Kích hoạt' : 'Vô hiệu hóa'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => router.push(`/admin/news/${item.id}`)}
                          className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Sửa"
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Xóa"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Không có tin tức nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> trong{' '}
                  <span className="font-medium">{totalCount}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Trước</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Sau</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      <AddCategoryNewsModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSuccess={handleCategoryModalSuccess}
        editingCategory={editingCategory}
        categories={categories}
      />
    </div>
  );
}
