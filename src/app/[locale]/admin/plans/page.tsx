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
const PlansIcon = ({ className }: { className?: string }) => (
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

// Plan interface
type Plan = {
  id: string;
  name: string;
  type: 'group' | 'individual' | 'classroom';
  storage_capacity?: number;
  ai_points?: number;
  template_limit?: number;
  downloads_limit?: number;
  template_library: 'basic' | 'premium';
  graphics_library: 'basic' | 'premium';
  customer_support: 'basic' | 'priority' | 'special';
  price: number;
  ai_duration_unit: 'day' | 'month';
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function PlansPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For immediate UI update
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // REST API state
  const [plans, setPlans] = useState<Plan[]>([]);
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

  // Fetch plans from REST API
  const fetchPlans = async (isInitialLoad = false) => {
    try {
      // Use different loading states for initial load vs. filters/search
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsTableLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        search: searchTerm,
        type: filterType,
        active: filterActive,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/admin/plans?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setPlans(data.plans || []);
      setTotalCount(data.pagination?.totalCount || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
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
    fetchPlans(true);
  }, []);

  // Debounce search input (wait 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch plans when filters change (not initial load)
  useEffect(() => {
    // Skip first render (initial load)
    if (isLoading) {
      return;
    }
    fetchPlans(false);
  }, [searchTerm, filterType, filterActive, page]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlans(prev =>
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId],
    );
  };

  const handleSelectAll = () => {
    if (selectedPlans.length === plans.length) {
      setSelectedPlans([]);
    } else {
      setSelectedPlans(plans.map(plan => plan.id));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return 'Chưa có';
    }
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getTypeBadge = (type: 'group' | 'individual' | 'classroom') => {
    const typeMap = {
      group: { label: 'Nhóm', color: 'bg-blue-100 text-blue-800' },
      individual: { label: 'Cá nhân', color: 'bg-green-100 text-green-800' },
      classroom: { label: 'Lớp học', color: 'bg-purple-100 text-purple-800' },
    };

    const { label, color } = typeMap[type];
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  const formatPrice = (price: number) => {
    if (price === 0) {
      return (
        <span className="font-medium text-green-600">Miễn phí</span>
      );
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Toggle plan status with optimistic updates
  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      // Optimistically update UI first
      setPlans(prevPlans =>
        prevPlans.map(plan =>
          plan.id === planId
            ? { ...plan, active: !currentStatus }
            : plan,
        ),
      );

      const response = await fetch(`/api/admin/plans/${planId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert the optimistic update on error
        setPlans(prevPlans =>
          prevPlans.map(plan =>
            plan.id === planId
              ? { ...plan, active: currentStatus }
              : plan,
          ),
        );
        throw new Error('Failed to toggle plan status');
      }

      const data = await response.json();
      if (!data.success) {
        // Revert the optimistic update on API error
        setPlans(prevPlans =>
          prevPlans.map(plan =>
            plan.id === planId
              ? { ...plan, active: currentStatus }
              : plan,
          ),
        );
        throw new Error(data.error || 'Failed to toggle plan status');
      }
    } catch (error) {
      console.error('Error toggling plan status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái gói dịch vụ');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="mb-2 h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>

        {/* Stats skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="animate-pulse rounded-xl bg-gray-200 p-3 dark:bg-gray-700">
                  <div className="h-6 w-6"></div>
                </div>
                <div>
                  <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
            <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>

        {/* Search skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="md:w-48">
              <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="md:w-48">
              <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="h-96 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-red-600">
            <PlansIcon className="mx-auto mb-2 h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Lỗi tải dữ liệu</h3>
          <p className="mb-4 text-gray-500 dark:text-gray-400">{error || 'Đã xảy ra lỗi'}</p>
          <button
            onClick={() => fetchPlans()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
          Quản lý gói dịch vụ
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Quản lý tất cả gói dịch vụ trong hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/20">
                <PlansIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số gói</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
                {isTableLoading && (
                  <span className="flex items-center text-xs text-blue-600">
                    <svg className="mr-1 -ml-1 h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            onClick={() => router.push('/admin/plans/add')}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Thêm gói mới
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
                placeholder="Tìm kiếm theo tên gói..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="md:w-48">
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              value={filterType}
              onChange={handleFilterChange(setFilterType)}
            >
              <option value="all">Tất cả loại</option>
              <option value="individual">Cá nhân</option>
              <option value="group">Nhóm</option>
              <option value="classroom">Lớp học</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              value={filterActive}
              onChange={handleFilterChange(setFilterActive)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Không hoạt động</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPlans.length > 0 && plans.length > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 dark:text-blue-300">
                Đã chọn
                {' '}
                {selectedPlans.length}
                {' '}
                gói
              </span>
              <div className="flex space-x-2">
                <button className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">
                  Kích hoạt
                </button>
                <button className="rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700">
                  Vô hiệu hóa
                </button>
                <button className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700">
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plans Table */}
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
                      checked={selectedPlans.length === plans.length && plans.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                  >
                    Tên gói
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
                    Giá
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
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="mb-1 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                            <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  plans.map(plan => (
                    <TableRow key={plan.id} className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="px-5 py-4 text-start">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedPlans.includes(plan.id)}
                          onChange={() => handleSelectPlan(plan.id)}
                          onClick={e => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div
                          className="cursor-pointer"
                          onClick={() => router.push(`/admin/plans/${plan.id}/edit`)}
                        >
                          <span className="text-theme-sm block font-medium text-gray-800 dark:text-white/90">
                            {plan.name}
                          </span>
                          <span className="text-theme-xs block text-gray-500 dark:text-gray-400">
                            {plan.ai_points && `${plan.ai_points} điểm AI`}
                            {plan.storage_capacity && ` • ${plan.storage_capacity}MB`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div
                          className="cursor-pointer"
                          onClick={() => router.push(`/admin/plans/${plan.id}/edit`)}
                        >
                          {getTypeBadge(plan.type)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div
                          className="cursor-pointer"
                          onClick={() => router.push(`/admin/plans/${plan.id}/edit`)}
                        >
                          {formatPrice(plan.price)}
                        </div>
                      </TableCell>
                      <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                        <div
                          className="cursor-pointer"
                          onClick={() => router.push(`/admin/plans/${plan.id}/edit`)}
                        >
                          {formatDate(plan.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center space-x-3">
                          {/* Toggle Switch */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlanStatus(plan.id, plan.active);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                              plan.active
                                ? 'bg-green-600'
                                : 'bg-gray-200'
                            }`}
                            role="switch"
                            aria-checked={plan.active}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                plan.active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>

                          {/* Status Text */}
                          <span className={`w-16 text-sm font-medium ${
                            plan.active ? 'text-green-800' : 'text-gray-500'
                          }`}
                          >
                            {plan.active ? 'Bật' : 'Tắt'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
              </TableBody>
            </Table>
          </div>
        </div>

        {plans.length === 0 && !isTableLoading && (
          <div className="py-12 text-center">
            <PlansIcon className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Không tìm thấy gói dịch vụ</h3>
            <p className="text-gray-500 dark:text-gray-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {plans.length > 0 && totalPages > 1 && (
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
            gói
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
