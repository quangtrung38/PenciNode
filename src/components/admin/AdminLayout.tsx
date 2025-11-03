'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useActivePath } from '@/utils/useActivePath';
import { usePathname } from 'next/navigation';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href?: string;
  children?: MenuItem[];
}

// Icon components
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const IconUser = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconShield = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconDocument = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconFolder = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconTool = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  </svg>
);

const IconLock = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const IconBell = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconTag = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <IconDashboard />,
    href: '/admin'
  },
  {
    id: 'users',
    title: 'Quan ly nguoi dung',
    icon: <IconUsers />,
    children: [
      { id: 'all-users', title: 'Tat ca nguoi dung', icon: <IconUser />, href: '/admin/users' },
      { id: 'admin-users', title: 'Quan tri vien', icon: <IconShield />, href: '/admin/users/admins' }
    ]
  },
  {
    id: 'content',
    title: 'Quan ly noi dung',
    icon: <IconDocument />,
    children: [
      { id: 'posts', title: 'Bai viet', icon: <IconDocument />, href: '/admin/dashboard/posts' },
      { id: 'categories', title: 'Danh muc', icon: <IconFolder />, href: '/admin/dashboard/categories' },
      { id: 'tags', title: 'Tag', icon: <IconTag />, href: '/admin/editor-tags' }
    ]
  },
  {
    id: 'settings',
    title: 'Cai dat',
    icon: <IconSettings />,
    children: [
      { id: 'general', title: 'Cai dat chung', icon: <IconTool />, href: '/admin/dashboard/settings/general' },
      { id: 'security', title: 'Bao mat', icon: <IconLock />, href: '/admin/dashboard/settings/security' }
    ]
  },
  {
    id: 'notifications',
    title: 'Notification Templates',
    icon: <IconBell />,
    href: '/admin/notification-templates',
  }
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard']);
  const isActive = useActivePath();
  const pathname = usePathname();
  
  function findActiveParentIds(items: MenuItem[], isActiveFn: (href?: string) => boolean, parents: string[] = []): string[] {
    for (const item of items) {
      if (item.children) {
        const childResult = findActiveParentIds(item.children, isActiveFn, [...parents, item.id]);
        if (childResult.length) return childResult;
      } else if (item.href && isActiveFn(item.href)) {
        return [...parents, item.id];
      }
    }
    return [];
  }

  React.useEffect(() => {
    const activeParents = findActiveParentIds(menuItems, isActive);
    setExpandedItems(prev => {
      const newExpanded = [...new Set([...prev, ...activeParents])];
      return newExpanded;
    });
  }, [pathname, isActive]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isItemActive = item.href && isActive(item.href);

    if (!hasChildren && item.href) {
      // For menu items with href, use Link component for better performance
      return (
        <li key={item.id} className="mb-1">
          <Link
            href={item.href}
            prefetch={false}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
              isItemActive 
                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            } ${level > 0 ? 'ml-4' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <span className={`${isItemActive ? 'text-blue-700' : 'text-gray-500'}`}>
                {item.icon}
              </span>
              <span className={`font-medium ${isItemActive ? 'text-blue-700' : ''}`}>
                {item.title}
              </span>
            </div>
          </Link>
        </li>
      );
    }

    return (
      <li key={item.id} className="mb-1">
        <div
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
            isItemActive 
              ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          } ${level > 0 ? 'ml-4' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <span className={`${isItemActive ? 'text-blue-700' : 'text-gray-500'}`}>
              {item.icon}
            </span>
            <span className={`font-medium ${isItemActive ? 'text-blue-700' : ''}`}>
              {item.title}
            </span>
          </div>
          {hasChildren && (
            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <ul className="mt-2 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-64'} hidden lg:block`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {menuItems.map(item => renderMenuItem(item))}
          </ul>
        </nav>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="mt-6 px-4">
              <ul className="space-y-2">
                {menuItems.map(item => renderMenuItem(item))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome to Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
