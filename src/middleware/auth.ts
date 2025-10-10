import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/libs/auth';

// Higher-order function to wrap user API handlers
export function withAuth(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any = {}) => {
    try {
      // Try to get session from cookies first (for browser requests)
      let session = await getServerSession(authOptions);
      
      // If no session from cookies, try JWT token from Authorization header
      if (!session?.user) {
        const token = await getToken({ 
          req: request, 
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        if (token) {
          // Create session-like object from JWT token
          session = {
            user: {
              id: token.sub || '',
              name: token.name || '',
              email: token.email || '',
              image: token.picture || '',
              role: (token as any).role || 3,
              status: (token as any).status || 1
            }
          };
        }
      }
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized. Authentication required.' },
          { status: 401 }
        );
      }

      // Pass session and context to the handler
      return await handler(request, { ...context, session });
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Alternative: Simple auth check utility
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized. Authentication required.');
  }
  
  return session;
}