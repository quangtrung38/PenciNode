import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/auth';

// Higher-order function to wrap admin API handlers
export function withAdminAuth(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any = {}) => {
    try {
      // Verify admin session
      const session = await getServerSession(authOptions);
      
      if (!session?.user || (session.user.role !== 1 && session.user.role !== 2)) {
        return NextResponse.json(
          { error: 'Unauthorized. Admin access required.' },
          { status: 401 }
        );
      }

      // Pass session and context to the handler
      return await handler(request, { ...context, session });
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Alternative: Simple admin auth check utility
export async function requireAdminAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user.role !== 1 && session.user.role !== 2)) {
    throw new Error('Unauthorized. Admin access required.');
  }
  
  return session;
}