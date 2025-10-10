import type { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { UserPlan } from '@/models';

// GET /api/admin/user-plans/[id] - Get single user plan
async function handleGetUserPlan(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user plan ID' },
        { status: 400 },
      );
    }

    const userPlan = await (UserPlan as any)
      .findById(id)
      .populate('user_id', 'name email')
      .populate('plan_id', 'name type price');

    if (!userPlan) {
      return NextResponse.json(
        { success: false, error: 'User plan not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: userPlan,
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user plan' },
      { status: 500 },
    );
  }
}

// PUT /api/admin/user-plans/[id] - Toggle single user plan active status
async function handleToggleUserPlan(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;
    const { active } = await request.json();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user plan ID' },
        { status: 400 },
      );
    }

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Active status must be boolean' },
        { status: 400 },
      );
    }

    const userPlan = await (UserPlan as any).findByIdAndUpdate(
      id,
      { active, updated_at: new Date() },
      { new: true },
    ).populate('user_id', 'name email').populate('plan_id', 'name type price');

    if (!userPlan) {
      return NextResponse.json(
        { success: false, error: 'User plan not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `User plan ${active ? 'activated' : 'deactivated'} successfully`,
      data: userPlan,
    });
  } catch (error) {
    console.error('Error toggling user plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle user plan status' },
      { status: 500 },
    );
  }
}

// Export handlers with admin authentication
export const GET = withAdminAuth(handleGetUserPlan);
export const PUT = withAdminAuth(handleToggleUserPlan);
