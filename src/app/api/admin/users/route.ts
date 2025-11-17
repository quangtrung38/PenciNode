import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '@/models';
import connectDB from '@/libs/mongoose';

// Get User model with proper typing
const getUserModel = () => {
  return User;
};

// Response caching headers
const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=0, must-revalidate',
  'ETag': `W/"${Date.now()}"`,
};

// Helper function to format dates without milliseconds (with caching)
const dateFormatCache = new Map<string, string>();
function formatDate(date: Date | null | string): string | null {
  if (!date) return null;
  
  const dateStr = date.toString();
  if (dateFormatCache.has(dateStr)) {
    return dateFormatCache.get(dateStr)!;
  }
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    
    const formatted = d.toISOString().slice(0, 19).replace('T', ' ');
    dateFormatCache.set(dateStr, formatted);
    
    // Clean cache if it gets too large
    if (dateFormatCache.size > 1000) {
      const firstKey = dateFormatCache.keys().next().value;
      if (firstKey) {
        dateFormatCache.delete(firstKey);
      }
    }
    
    return formatted;
  } catch {
    return null;
  }
}

// GET - Optimized users fetch with efficient queries
async function handleGetUsers(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

    const User = getUserModel();

    // Build MongoDB query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    // Parallel queries for better performance
    const [rawUsers, totalCount] = await Promise.all([
      (User as any).find(query)
        .select('name email image role status first_name last_name createdAt updatedAt lastLoginAt emailVerified')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Batch format dates for better performance
    const users = rawUsers.map((user: any) => {
      // Convert numbers back to strings for UI compatibility
      const roleString = user.role.toString();
      const statusString = user.status.toString();
      
      // Get display name
      let displayName = user.name;
      if (user.first_name && user.last_name) {
        displayName = `${user.first_name} ${user.last_name}`;
      } else if (!displayName) {
        displayName = user.email;
      }
      
      return {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: displayName,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        image: user.image,
        role: roleString,
        status: statusString,
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt),
        lastLoginAt: formatDate(user.lastLoginAt),
        emailVerified: formatDate(user.emailVerified)
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, {
      headers: CACHE_HEADERS
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Optimized user update
async function handleUpdateUser(request: NextRequest, session: any) {
  try {
    // Ensure database connection
    await connectDB();
    
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const User = getUserModel();

    // Validate allowed updates
    const allowedUpdates = ['role', 'status', 'name'];
    const filteredUpdates: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        if (key === 'role') {
          filteredUpdates[key] = parseInt(value as string) || 3;
        } else if (key === 'status') {
          filteredUpdates[key] = parseInt(value as string) || 1;
        } else {
          filteredUpdates[key] = value;
        }
      }
    }

    // Prevent self-role change for admin/super admin
    if (session.user.id === userId && filteredUpdates.role && (filteredUpdates.role !== 1 && filteredUpdates.role !== 2)) {
      return NextResponse.json(
        { error: 'Cannot change your own admin role' },
        { status: 400 }
      );
    }

    // Optimized update with selective fields
    const rawUpdatedUser = await (User as any).findByIdAndUpdate(
      userId,
      filteredUpdates,
      {
        new: true,
        select: 'name email image role status createdAt updatedAt lastLoginAt'
      }
    ).lean();

    if (!rawUpdatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Convert numbers back to strings for UI compatibility
    const roleString = (rawUpdatedUser as any).role.toString();
    const statusString = (rawUpdatedUser as any).status.toString();
    
    const updatedUser = {
      id: (rawUpdatedUser as any)._id.toString(),
      name: (rawUpdatedUser as any).name,
      email: (rawUpdatedUser as any).email,
      image: (rawUpdatedUser as any).image,
      role: roleString,
      status: statusString,
      createdAt: formatDate((rawUpdatedUser as any).createdAt),
      updatedAt: formatDate((rawUpdatedUser as any).updatedAt),
      lastLoginAt: formatDate((rawUpdatedUser as any).lastLoginAt)
    };

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Optimized user creation
async function handleCreateUser(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB();
    
    const body = await request.json();
    const { name, email, password, role, status } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    // Convert to numbers (form sends numbers now)
    const roleNumber = parseInt(role) || 3;
    const statusNumber = parseInt(status) || 1;

    const User = getUserModel();

    // Check if email exists (optimized query)
    const existingUser = await (User as any).findOne({ email }).select('_id').lean();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create with selective return fields
    const rawNewUser = await (User as any).create({
      name,
      email,
      password: hashedPassword,
      role: roleNumber,
      status: statusNumber
    });

    // Convert numbers back to strings for UI compatibility
    const roleString = rawNewUser.role.toString();
    const statusString = rawNewUser.status.toString();

    const newUser = {
      id: rawNewUser._id.toString(),
      name: rawNewUser.name,
      email: rawNewUser.email,
      image: (rawNewUser as any).image,
      role: roleString,
      status: statusString,
      createdAt: formatDate((rawNewUser as any).createdAt),
      updatedAt: formatDate((rawNewUser as any).updatedAt),
      lastLoginAt: formatDate((rawNewUser as any).lastLoginAt),
      emailVerified: formatDate((rawNewUser as any).emailVerified)
    };

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Optimized user deletion
async function handleDeleteUser(request: NextRequest, session: any) {
  try {
    // Ensure database connection
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const User = getUserModel();

    // Prevent self-deletion
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Single query deletion
    const deletedUser = await (User as any).findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export wrapped handlers with admin auth middleware
export const GET = withAdminAuth(handleGetUsers);
export const PATCH = withAdminAuth(handleUpdateUser);
export const POST = withAdminAuth(handleCreateUser);
export const DELETE = withAdminAuth(handleDeleteUser);