import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { UserPlan } from '@/models';

// GET /api/admin/user-plans - Get all user plans with pagination and filters
async function handleGetUserPlans(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'inactive', 'all'

    const skip = (page - 1) * limit;

    // Build filter conditions
    const matchConditions: any = {};

    // Status filter
    if (status && status !== 'all') {
      matchConditions.active = status === 'active';
    }

    // Aggregation pipeline for complex queries with populated data
    const pipeline = [
      { $match: matchConditions },
      // Populate user data
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_data',
        },
      },
      // Populate plan data
      {
        $lookup: {
          from: 'plans',
          localField: 'plan_id',
          foreignField: '_id',
          as: 'plan_data',
        },
      },
      // Unwind arrays (since they should be single documents)
      { $unwind: '$user_data' },
      { $unwind: '$plan_data' },
      // Search filter (after population)
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { 'user_data.name': { $regex: search, $options: 'i' } },
                  { 'user_data.email': { $regex: search, $options: 'i' } },
                  { 'plan_data.name': { $regex: search, $options: 'i' } },
                ],
              },
            },
          ]
        : []),
      // Sort by creation date (newest first)
      { $sort: { created_at: -1 } },
      // Add computed fields
      {
        $addFields: {
          is_expired: { $gt: [new Date(), '$end_date'] },
        },
      },
      // Project only needed fields
      {
        $project: {
          _id: 1,
          user_id: 1,
          plan_id: 1,
          price: 1,
          start_date: 1,
          end_date: 1,
          active: 1,
          created_at: 1,
          updated_at: 1,
          is_expired: 1,
          user_name: '$user_data.name',
          user_email: '$user_data.email',
          plan_name: '$plan_data.name',
          plan_type: '$plan_data.type',
        },
      },
    ];

    // Get total count for pagination
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await (UserPlan as any).aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Get paginated results
    const resultPipeline = [...pipeline, { $skip: skip }, { $limit: limit }];
    const userPlans = await (UserPlan as any).aggregate(resultPipeline);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: userPlans,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching user plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user plans' },
      { status: 500 },
    );
  }
}

// PUT /api/admin/user-plans - Bulk toggle active status
async function handleBulkUpdateUserPlans(request: NextRequest) {
  try {
    await connectDB();

    const { ids, active } = await request.json();

    if (!Array.isArray(ids) || typeof active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 },
      );
    }

    const result = await (UserPlan as any).updateMany(
      { _id: { $in: ids } },
      { active, updated_at: new Date() },
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} user plan(s)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error updating user plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user plans' },
      { status: 500 },
    );
  }
}

// Export handlers with admin authentication
export const GET = withAdminAuth(handleGetUserPlans);
export const PUT = withAdminAuth(handleBulkUpdateUserPlans);
