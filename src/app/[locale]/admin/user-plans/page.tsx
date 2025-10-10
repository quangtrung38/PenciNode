'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type UserPlan = {
  _id: string;
  user_id: string;
  plan_id: string;
  price: number;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  is_expired: boolean;
  user_name: string;
  user_email: string;
  plan_name: string;
  plan_type: string;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export default function UserPlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Check authentication and admin role
  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session?.user || (session.user.role !== 1 && session.user.role !== 2)) {
      router.push('/vi/login');
    }
  }, [session, status, router]);

  // Fetch user plans
  const fetchUserPlans = async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        status,
      });

      const response = await fetch(`/api/admin/user-plans?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user plans');
      }

      const data = await response.json();
      if (data.success) {
        setUserPlans(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch user plans');
      }
    } catch (error) {
      console.error('Error fetching user plans:', error);
      alert('Có lỗi xảy ra khi tải danh sách gói người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Toggle single user plan status
  const toggleUserPlanStatus = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistically update UI first
      setUserPlans(prevPlans =>
        prevPlans.map(plan =>
          plan._id === id
            ? { ...plan, active: !currentStatus }
            : plan,
        ),
      );

      const response = await fetch(`/api/admin/user-plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentStatus }),
      });

      if (!response.ok) {
        // Revert the optimistic update on error
        setUserPlans(prevPlans =>
          prevPlans.map(plan =>
            plan._id === id
              ? { ...plan, active: currentStatus }
              : plan,
          ),
        );
        throw new Error('Failed to toggle user plan status');
      }

      const data = await response.json();
      if (!data.success) {
        // Revert the optimistic update on API error
        setUserPlans(prevPlans =>
          prevPlans.map(plan =>
            plan._id === id
              ? { ...plan, active: currentStatus }
              : plan,
          ),
        );
        throw new Error(data.error || 'Failed to toggle user plan status');
      }
    } catch (error) {
      console.error('Error toggling user plan status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái gói người dùng');
    }
  };

  useEffect(() => {
    if (session?.user && (session.user.role === 1 || session.user.role === 2)) {
      fetchUserPlans();
    }
  }, [session]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUserPlans(1, searchTerm, statusFilter);
  };

  // Handle status filter change
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchUserPlans(1, searchTerm, newStatus);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Format plan type
  const formatPlanType = (type: string) => {
    const typeMap: { [key: string]: { label: string; color: string } } = {
      individual: { label: 'Cá nhân', color: 'bg-blue-100 text-blue-800' },
      group: { label: 'Nhóm', color: 'bg-green-100 text-green-800' },
      classroom: { label: 'Lớp học', color: 'bg-purple-100 text-purple-800' },
    };

    return typeMap[type.toLowerCase()] || { label: type, color: 'bg-gray-100 text-gray-800' };
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user || (session.user.role !== 1 && session.user.role !== 2)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Gói người dùng</h1>
      </div>

      {/* Search and Filter */}
      <div className="rounded-lg bg-white p-4 shadow">
        <form onSubmit={handleSearch} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên người dùng, email, tên gói..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={e => handleStatusFilterChange(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* User Plans Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Gói dịch vụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Ngày bắt đầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Ngày kết thúc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {userPlans.map(userPlan => (
                <tr key={userPlan._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {userPlan.user_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {userPlan.user_email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{userPlan.plan_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {userPlan.price === 0 ? 'Miễn phí' : formatPrice(userPlan.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                    {formatDate(userPlan.start_date)}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                    {formatDate(userPlan.end_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${formatPlanType(userPlan.plan_type).color}`}>
                      {formatPlanType(userPlan.plan_type).label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleUserPlanStatus(userPlan._id, userPlan.active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                          userPlan.active
                            ? 'bg-green-600'
                            : 'bg-gray-200'
                        }`}
                        role="switch"
                        aria-checked={userPlan.active}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            userPlan.active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>

                      {/* Status Text */}
                      <span className={`w-16 text-sm font-medium ${
                        userPlan.active ? 'text-green-800' : 'text-gray-500'
                      }`}
                      >
                        {userPlan.active ? 'Bật' : 'Tắt'}
                      </span>
                    </div>

                    {userPlan.is_expired && (
                      <div className="mt-2">
                        <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                          Đã hết hạn
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {userPlans.length === 0 && !loading && (
          <div className="py-12 text-center">
            <p className="text-gray-500">Không có gói người dùng nào.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => fetchUserPlans(pagination.page - 1, searchTerm, statusFilter)}
              disabled={!pagination.hasPrevPage}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => fetchUserPlans(pagination.page + 1, searchTerm, statusFilter)}
              disabled={!pagination.hasNextPage}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị
                {' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>
                {' '}
                đến
                {' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                {' '}
                trong
                {' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}
                kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => fetchUserPlans(pagination.page - 1, searchTerm, statusFilter)}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) {
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchUserPlans(pageNum, searchTerm, statusFilter)}
                      className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'z-10 border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchUserPlans(pagination.page + 1, searchTerm, statusFilter)}
                  disabled={!pagination.hasNextPage}
                  className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
