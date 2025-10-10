'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (session && status === 'authenticated') {
      const userRole = (session.user as any)?.role;
      
      // Only redirect regular users away from admin pages they shouldn't access
      if (userRole === 3 && pathname?.includes('/admin')) {
        router.push('/vi');
      }
      
      // No automatic admin redirects - let admin users navigate freely
    }
  }, [session, status, router, pathname]);

  return null; // This component doesn't render anything
}