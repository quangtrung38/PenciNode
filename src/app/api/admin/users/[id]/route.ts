import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Ensure database connection
import '@/libs/DB';

// Get User model with proper typing
const getUserModel = () => {
  return mongoose.model('User');
};

// GET single user
async function handleGetUser(_request: NextRequest, userId: string) {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const User = getUserModel();
    const user = await User.findById(new Types.ObjectId(userId))
      .select('name email image role status createdAt updatedAt lastLoginAt emailVerified')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format response
    const formattedUser = {
      id: (user as any)._id.toString(),
      name: (user as any).name,
      email: (user as any).email,
      image: (user as any).image,
      role: (user as any).role,
      status: (user as any).status,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
      lastLoginAt: (user as any).lastLoginAt,
      emailVerified: (user as any).emailVerified,
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update user
async function handleUpdateUser(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    const { name, email, password, role, status } = body;

    // Convert role and status to numbers
    const roleNumber = parseInt(role) || 3; // default to user (3)
    const statusNumber = parseInt(status) || 1; // default to active (1)

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const User = getUserModel();
    
    // Check if user exists
    const existingUser = await User.findById(new Types.ObjectId(userId)).lean();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email is taken by another user
    if (email !== (existingUser as any).email) {
      const emailExists = await User.findOne({ 
        email,
        _id: { $ne: userId }
      }).lean();

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role: roleNumber,
      status: statusNumber,
    };

    // Hash password if provided
    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true, 
        select: 'name email role status createdAt updatedAt lastLoginAt emailVerified' 
      }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Format response
    const formattedUser = {
      id: (updatedUser as any)._id.toString(),
      name: (updatedUser as any).name,
      email: (updatedUser as any).email,
      role: (updatedUser as any).role,
      status: (updatedUser as any).status,
      createdAt: (updatedUser as any).createdAt,
      updatedAt: (updatedUser as any).updatedAt,
      lastLoginAt: (updatedUser as any).lastLoginAt,
      emailVerified: (updatedUser as any).emailVerified,
    };

    return NextResponse.json({
      message: 'User updated successfully',
      user: formattedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE user
async function handleDeleteUser(_request: NextRequest, userId: string, currentUserId: string) {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const User = getUserModel();
    
    // Check if user exists
    const existingUser = await User.findById(new Types.ObjectId(userId)).lean();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deleting themselves
    if (currentUserId === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    await User.findByIdAndDelete(userId);

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

export const GET = withAdminAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  return handleGetUser(request, params.id);
});

export const PUT = withAdminAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  return handleUpdateUser(request, params.id);
});

export const DELETE = withAdminAuth(async (request: NextRequest, { params, session }: { params: { id: string }, session: any }) => {
  return handleDeleteUser(request, params.id, session.user.id);
});