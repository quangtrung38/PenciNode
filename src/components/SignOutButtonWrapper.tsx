'use client';

import { signOut } from 'next-auth/react';

interface SignOutButtonWrapperProps {
  children: React.ReactNode;
  locale: string;
}

export default function SignOutButtonWrapper({ children, locale }: SignOutButtonWrapperProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: `/${locale}` });
  };

  return (
    <button 
      onClick={handleSignOut}
      className="border-none text-gray-700 hover:text-gray-900" 
      type="button"
    >
      {children}
    </button>
  );
}