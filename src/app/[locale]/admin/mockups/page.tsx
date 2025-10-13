'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/admin/ui/table';
import Pagination from '@/components/admin/tables/Pagination';

// SVG Icons
const MockupIcon = ({ className }: { className?: string }) => (
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

// Mockup interface
interface Mockup {
  id: string;
  name: string;
  jsoncol?: string;
  image?: string;
  product_id: string;
  product_name: string;
  background_color?: string;
  size_img?: string;
  display: number;
  isViewMain: number;
  createdAt: string;
  updatedAt: string;
}

export default function MockupsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterDisplay, setFilterDisplay] = useState('all');
  const [filterViewMain, setFilterViewMain] = useState('all');
  const [selectedMockups, setSelectedMockups] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // REST API state
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset page when filter/search changes
  const handleFilterChange = (setter: (v: any) => void) => (e: any) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleSelectMockup = (mockupId: string) => {
    setSelectedMockups((prev) =>
      prev.includes(mockupId)
        ? prev.filter((id) => id !== mockupId)
        : [...prev, mockupId],
    );
  };

  const handleSelectAll = () => {
    if (selectedMockups.length === mockups.length) {
      setSelectedMockups([]);
    } else {
      setSelectedMockups(mockups.map((m) => m.id));
    }
  };

  // Fetch mockups from REST API
  const fetchMockups = async (isInitialLoad = false) => {
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
        isViewMain: filterViewMain,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/admin/mockups?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setMockups(data.mockups || []);
      setTotalCount(data.pagination?.totalCount || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mockups');
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
    fetchMockups(true);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch mockups when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchMockups(false);
    }
  }, [searchTerm, filterDisplay, filterViewMain, page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Toggle display status with optimistic updates
  const toggleDisplay = async (mockupId: string, currentStatus: number) => {
    try {
      setMockups((prevMockups) =>
        prevMockups.map((mockup) =>
          mockup.id === mockupId
            ? { ...mockup, display: currentStatus === 1 ? 0 : 1 }
            : mockup,
        ),
      );

      const response = await fetch(`/api/admin/mockups/${mockupId}/toggle-display`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setMockups((prevMockups) =>
          prevMockups.map((mockup) =>
            mockup.id === mockupId
              ? { ...mockup, display: currentStatus }
              : mockup,
          ),
        );
        throw new Error('Failed to toggle display status');
      }

      const data = await response.json();
      if (!data.success) {
        setMockups((prevMockups) =>
          prevMockups.map((mockup) =>
            mockup.id === mockupId
              ? { ...mockup, display: currentStatus }
              : mockup,
          ),
        );
        throw new Error(data.error || 'Failed to toggle display status');
      }
    } catch (error) {
      console.error('Error toggling display status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái hiển thị');
    }
  };

  // Toggle view main status with optimistic updates
  const toggleViewMain = async (mockupId: string, currentStatus: number) => {
    try {
      setMockups((prevMockups) =>
        prevMockups.map((mockup) =>
          mockup.id === mockupId
            ? { ...mockup, isViewMain: currentStatus === 1 ? 0 : 1 }
            : mockup,
        ),
      );

      const response = await fetch(`/api/admin/mockups/${mockupId}/toggle-viewmain`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setMockups((prevMockups) =>
          prevMockups.map((mockup) =>
            mockup.id === mockupId
              ? { ...mockup, isViewMain: currentStatus }
              : mockup,
          ),
        );
        throw new Error('Failed to toggle view main status');
      }

      const data = await response.json();
      if (!data.success) {
        setMockups((prevMockups) =>
          prevMockups.map((mockup) =>
            mockup.id === mockupId
              ? { ...mockup, isViewMain: currentStatus }
              : mockup,
          ),
        );
        throw new Error(data.error || 'Failed to toggle view main status');
      }
    } catch (error) {
      console.error('Error toggling view main status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái hiển thị chính');
    }
  };

  // Delete mockup with confirmation
  const deleteMockup = async (mockupId: string, mockupName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mockup "${mockupName}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/mockups/${mockupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete mockup');
      }

      setMockups((prevMockups) =>
        prevMockups.filter((mockup) => mockup.id !== mockupId),
      );

      setTotalCount((prev) => prev - 1);

      alert('Xóa mockup thành công');
    } catch (error) {
      console.error('Error deleting mockup:', error);
      alert('Có lỗi xảy ra khi xóa mockup');
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
            <MockupIcon className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'Đã xảy ra lỗi'}</p>
          <button
            onClick={() => fetchMockups()}
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
          Quản lý Mockups
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Quản lý tất cả mockups trong hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <MockupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số mockups</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
                {isTableLoading && (
                  <span className="text-xs text-blue-600 flex items-center">
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tải...
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/admin/mockups/add')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Thêm mockup mới
          </button>
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
                placeholder="Tìm kiếm theo tên mockup..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
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

          <div className="md:w-48">
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={filterViewMain}
              onChange={handleFilterChange(setFilterViewMain)}
            >
              <option value="all">Tất cả view main</option>
              <option value="1">View main</option>
              <option value="0">Không view main</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedMockups.length === mockups.length && mockups.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Hình ảnh
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Tên mockup
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Sản phẩm
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Màu nền
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Ngày tạo
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Hiển thị
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    View main
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isTableLoading
                  ? (
                      Array.from({ length: limit }).map((_, index) => (
                        <TableRow key={`loading-${index}`}>
                          <TableCell className="px-5 py-4 text-start">
                            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  : (
                      mockups.map((mockup) => (
                        <TableRow
                          key={mockup.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell className="px-5 py-4 text-start">
                            <div onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={selectedMockups.includes(mockup.id)}
                                onChange={() => handleSelectMockup(mockup.id)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            {mockup.image
                              ? (
                                  <img
                                    src={mockup.image}
                                    alt={mockup.name}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                )
                              : (
                                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                    <MockupIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <span className="font-medium text-gray-800 text-sm dark:text-white/90">
                              {mockup.name}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <span className="text-gray-600 text-sm dark:text-gray-400">
                              {mockup.product_name}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            {mockup.background_color
                              ? (
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-8 h-8 rounded border border-gray-300"
                                      style={{ backgroundColor: mockup.background_color }}
                                    ></div>
                                    <span className="text-xs text-gray-500">{mockup.background_color}</span>
                                  </div>
                                )
                              : (
                                  <span className="text-gray-400">-</span>
                                )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400">
                            {formatDate(mockup.createdAt)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDisplay(mockup.id, mockup.display);
                              }}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 ${
                                mockup.display === 1 ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  mockup.display === 1 ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleViewMain(mockup.id, mockup.isViewMain);
                              }}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 ${
                                mockup.isViewMain === 1 ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  mockup.isViewMain === 1 ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/mockups/${mockup.id}/edit`);
                                }}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMockup(mockup.id, mockup.name);
                                }}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                              >
                                Xóa
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
              </TableBody>
            </Table>
          </div>
        </div>

        {mockups.length === 0 && !isTableLoading && (
          <div className="text-center py-12">
            <MockupIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy mockup</h3>
            <p className="text-gray-500 dark:text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc thêm mockup mới</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {mockups.length > 0 && totalPages > 1 && (
        <div className="flex justify-between items-center rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="text-sm text-gray-700 dark:text-gray-400">
            Hiển thị <span className="font-medium">{((page - 1) * limit) + 1}</span> đến{' '}
            <span className="font-medium">{Math.min(page * limit, totalCount)}</span> trong tổng số{' '}
            <span className="font-medium">{totalCount}</span> mockups
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
