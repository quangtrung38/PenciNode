'use client';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quản lý người dùng
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Quản lý tất cả người dùng trong hệ thống
        </p>
      </div>
      
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <p>Đây là trang users với admin layout đầy đủ</p>
      </div>
    </div>
  );
}