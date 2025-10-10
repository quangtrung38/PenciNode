'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Pagination from '@/components/admin/tables/Pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/admin/ui/table';

// SVG Icons
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

// Notification Template interface
type NotificationTemplate = {
  id: string;
  code: string;
  title: string;
  message: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function NotificationTemplatesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // API state
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset page when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1);
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId],
    );
  };

  const handleSelectAll = () => {
    if (selectedTemplates.length === templates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(templates.map(t => t.id));
    }
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

  // Toggle template status with optimistic updates
  const toggleTemplateStatus = async (templateId: string, currentStatus: boolean) => {
    try {
      // Optimistically update UI first
      setTemplates(prevTemplates =>
        prevTemplates.map(template =>
          template.id === templateId
            ? { ...template, isActive: !currentStatus }
            : template,
        ),
      );

      const response = await fetch(`/api/admin/notification-templates/${templateId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert the optimistic update on error
        setTemplates(prevTemplates =>
          prevTemplates.map(template =>
            template.id === templateId
              ? { ...template, isActive: currentStatus }
              : template,
          ),
        );
        throw new Error('Failed to toggle template status');
      }

      const data = await response.json();
      if (!data.success) {
        // Revert the optimistic update on API error
        setTemplates(prevTemplates =>
          prevTemplates.map(template =>
            template.id === templateId
              ? { ...template, isActive: currentStatus }
              : template,
          ),
        );
        throw new Error(data.error || 'Failed to toggle template status');
      }
    } catch (error) {
      console.error('Error toggling template status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái mẫu thông báo');
    }
  };

  // Delete template with confirmation
  const deleteTemplate = async (templateId: string, templateCode: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mẫu thông báo "${templateCode}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/notification-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      // Remove from UI
      setTemplates(prevTemplates =>
        prevTemplates.filter(template => template.id !== templateId),
      );

      // Update total count
      setTotalCount(prev => prev - 1);

      alert('Xóa mẫu thông báo thành công');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Có lỗi xảy ra khi xóa mẫu thông báo');
    }
  };

  const fetchTemplates = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsTableLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        search: searchTerm,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/admin/notification-templates?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setTemplates(data.templates || []);
      setTotalCount(data.pagination?.totalCount || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
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
    fetchTemplates(true);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch templates when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchTemplates(false);
    }
  }, [searchTerm, page]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="mb-2 h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="h-4 w-2/3 rounded bg-gray-200"></div>
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-gray-200"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Quản lý mẫu thông báo
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Quản lý các mẫu thông báo trong hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/20">
                <TemplateIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số mẫu</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/admin/notification-templates/add')}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Thêm mẫu thông báo
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã code, tiêu đề hoặc nội dung..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                value={searchInput}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-full">
              {/* Table Header */}
              <TableHeader>
                <TableRow>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedTemplates.length === templates.length && templates.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                  >
                    Mã Code
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                  >
                    Tiêu đề
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                  >
                    Nội dung
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                  >
                    Loại
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                  >
                    Ngày tạo
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                  >
                    Trạng thái
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                  >
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isTableLoading ? (
                  // Loading rows
                  Array.from({ length: limit }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  templates.map(template => (
                    <TableRow
                      key={template.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <TableCell className="px-5 py-4 text-start">
                        <div onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedTemplates.includes(template.id)}
                            onChange={() => handleSelectTemplate(template.id)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-800">
                          {template.code}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {template.title}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <span className="text-theme-sm block max-w-xs truncate text-gray-600 dark:text-gray-400">
                          {template.message}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          template.type === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : template.type === 'error'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : template.type === 'warning'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}
                        >
                          {template.type === 'success'
                            ? 'Thành công'
                            : template.type === 'error'
                              ? 'Lỗi'
                              : template.type === 'warning'
                                ? 'Cảnh báo'
                                : 'Thông tin'}
                        </span>
                      </TableCell>
                      <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                        {formatDate(template.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTemplateStatus(template.id, template.isActive);
                          }}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:outline-none ${
                            template.isActive ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              template.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`ml-2 text-sm ${template.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {template.isActive ? 'Hoạt động' : 'Tắt'}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/notification-templates/${template.id}/edit`);
                            }}
                            className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(template.id, template.code);
                            }}
                            className="inline-flex items-center rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                          >
                            Xóa
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
              </TableBody>
            </Table>
          </div>
        </div>

        {templates.length === 0 && !isTableLoading && (
          <div className="py-12 text-center">
            <TemplateIcon className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Không tìm thấy mẫu thông báo</h3>
            <p className="text-gray-500 dark:text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc thêm mẫu thông báo mới</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {templates.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="text-sm text-gray-700 dark:text-gray-400">
            Hiển thị
            {' '}
            <span className="font-medium">{((page - 1) * limit) + 1}</span>
            {' '}
            đến
            {' '}
            <span className="font-medium">{Math.min(page * limit, totalCount)}</span>
            {' '}
            trong tổng số
            {' '}
            <span className="font-medium">{totalCount}</span>
            {' '}
            mẫu thông báo
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
