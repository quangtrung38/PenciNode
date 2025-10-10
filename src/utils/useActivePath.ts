import { usePathname } from 'next/navigation';

/**
 * Returns a function to check if a menu item's href is active (matches current path).
 * Supports exact and partial (startsWith) match for nested routes.
 */
export function useActivePath() {
  const pathname = usePathname();
  return (href?: string) => {
    if (!href) return false;
    // Exact match or current path starts with href (for nested menu)
    return pathname === href || pathname.startsWith(href + '/');
  };
}
