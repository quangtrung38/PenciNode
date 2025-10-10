'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserActionsProps {
  locale: string;
}

export default function UserActions({ locale }: UserActionsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex justify-center gap-4 mb-12">
        <div className="animate-pulse bg-gray-300 h-12 w-24 rounded-lg"></div>
        <div className="animate-pulse bg-gray-300 h-12 w-24 rounded-lg"></div>
      </div>
    );
  }

  if (!session) {
    // Not logged in - show login/register buttons
    return (
      <div className="flex justify-center gap-4 mb-12">
        <a
          href={`/${locale}/api/auth/signin`}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
        >
          Đăng nhập
        </a>
        <a
          href={`/${locale}/api/auth/signin`}
          className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition duration-300 shadow-lg hover:shadow-xl"
        >
          Đăng ký
        </a>
      </div>
    );
  }

  // Logged in - show different options based on role
  const userRole = (session.user as any)?.role;
  const userName = session.user?.name || 'User';

  return (
    <div className="flex flex-col items-center gap-4 mb-12">
      {/* Welcome message */}
      <div className="text-center mb-4">
        <p className="text-lg text-gray-700">
          Chào mừng, <span className="font-semibold">{userName}</span>!
        </p>
        <p className="text-sm text-gray-500">
          Role: <span className="capitalize font-medium">{userRole}</span>
        </p>
      </div>

      {/* Action buttons based on role */}
      <div className="flex justify-center gap-4">
        {(userRole === 1 || userRole === 2) ? (
          <>
            <button
              onClick={() => router.push(`/${locale}/admin/dashboard`)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
            >
              🔧 Dashboard Admin
            </button>
            <button
              onClick={() => router.push(`/${locale}/profile`)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
            >
              👤 Hồ sơ cá nhân
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
            >
              📚 Dashboard học tập
            </button>
            <button
              onClick={() => router.push(`/${locale}/profile`)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
            >
              👤 Hồ sơ cá nhân
            </button>
          </>
        )}
        
        <button
          onClick={() => signOut()}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
        >
          🚪 Đăng xuất
        </button>
      </div>
    </div>
  );
}