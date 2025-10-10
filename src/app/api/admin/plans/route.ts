import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Plan } from '@/models';

// Get Plan model with proper typing
const getPlanModel = () => {
  return Plan;
};

// Response caching headers
const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=0, must-revalidate',
  'ETag': `W/"${Date.now()}"`,
};

// Helper function to format dates without milliseconds (with caching)
const dateFormatCache = new Map<string, string>();
function formatDate(date: Date | null | string): string | null {
  if (!date) {
    return null;
  }

  const dateStr = date.toString();
  if (dateFormatCache.has(dateStr)) {
    return dateFormatCache.get(dateStr)!;
  }

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) {
      return null;
    }

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

// GET - Fetch plans with pagination and filters
async function handleGetPlans(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const active = searchParams.get('active') || 'all';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

    const PlanModel = getPlanModel();

    // Build MongoDB query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (active && active !== 'all') {
      query.active = active === 'true';
    }

    // Parallel queries for better performance
    const [rawPlans, totalCount] = await Promise.all([
      (PlanModel as any)
        .find(query)
        .select('name type storage_capacity ai_points template_limit downloads_limit template_library graphics_library customer_support price ai_duration_unit active createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      PlanModel.countDocuments(query),
    ]);

    // Format plans for response
    const plans = rawPlans.map((plan: any) => ({
      id: plan._id.toString(),
      name: plan.name,
      type: plan.type,
      storage_capacity: plan.storage_capacity,
      ai_points: plan.ai_points,
      template_limit: plan.template_limit,
      downloads_limit: plan.downloads_limit,
      template_library: plan.template_library,
      graphics_library: plan.graphics_library,
      customer_support: plan.customer_support,
      price: plan.price,
      ai_duration_unit: plan.ai_duration_unit,
      active: plan.active,
      createdAt: formatDate(plan.createdAt),
      updatedAt: formatDate(plan.updatedAt),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      plans,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create a new plan
async function handleCreatePlan(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB();

    const body = await request.json();
    const {
      name,
      type,
      storage_capacity,
      ai_points,
      template_limit,
      downloads_limit,
      template_library,
      graphics_library,
      customer_support,
      price,
      ai_duration_unit,
      active,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 },
      );
    }

    const PlanModel = getPlanModel();

    // Check if plan name already exists
    const existingPlan = await (PlanModel as any).findOne({ name }).select('_id').lean();

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Plan name already exists' },
        { status: 409 },
      );
    }

    // Create new plan
    const rawNewPlan = await (PlanModel as any).create({
      name: name.trim(),
      type,
      storage_capacity: storage_capacity ? Number.parseInt(storage_capacity) : undefined,
      ai_points: ai_points ? Number.parseInt(ai_points) : undefined,
      template_limit: template_limit ? Number.parseInt(template_limit) : undefined,
      downloads_limit: downloads_limit ? Number.parseInt(downloads_limit) : undefined,
      template_library: template_library || 'basic',
      graphics_library: graphics_library || 'basic',
      customer_support: customer_support || 'basic',
      price: price ? Number.parseInt(price) : 0,
      ai_duration_unit: ai_duration_unit || 'month',
      active: active !== undefined ? active : true,
    });

    const newPlan = {
      id: rawNewPlan._id.toString(),
      name: rawNewPlan.name,
      type: rawNewPlan.type,
      storage_capacity: rawNewPlan.storage_capacity,
      ai_points: rawNewPlan.ai_points,
      template_limit: rawNewPlan.template_limit,
      downloads_limit: rawNewPlan.downloads_limit,
      template_library: rawNewPlan.template_library,
      graphics_library: rawNewPlan.graphics_library,
      customer_support: rawNewPlan.customer_support,
      price: rawNewPlan.price,
      ai_duration_unit: rawNewPlan.ai_duration_unit,
      active: rawNewPlan.active,
      createdAt: formatDate(rawNewPlan.createdAt),
      updatedAt: formatDate(rawNewPlan.updatedAt),
    };

    return NextResponse.json({
      message: 'Plan created successfully',
      plan: newPlan,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PATCH - Update plan
async function handleUpdatePlan(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB();

    const body = await request.json();
    const { planId, updates } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 },
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 },
      );
    }

    const PlanModel = getPlanModel();

    // Validate allowed updates
    const allowedUpdates = [
      'name',
      'type',
      'storage_capacity',
      'ai_points',
      'template_limit',
      'downloads_limit',
      'template_library',
      'graphics_library',
      'customer_support',
      'price',
      'ai_duration_unit',
      'active',
    ];
    const filteredUpdates: any = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        if (['storage_capacity', 'ai_points', 'template_limit', 'downloads_limit', 'price'].includes(key)) {
          filteredUpdates[key] = value ? Number.parseInt(value as string) : undefined;
        } else if (key === 'active') {
          filteredUpdates[key] = Boolean(value);
        } else {
          filteredUpdates[key] = value;
        }
      }
    }

    // Check if plan name already exists (if name is being updated)
    if (filteredUpdates.name) {
      const existingPlan = await (PlanModel as any).findOne({
        name: filteredUpdates.name,
        _id: { $ne: planId },
      }).select('_id').lean();

      if (existingPlan) {
        return NextResponse.json(
          { error: 'Plan name already exists' },
          { status: 409 },
        );
      }
    }

    // Update plan
    const rawUpdatedPlan = await (PlanModel as any).findByIdAndUpdate(
      planId,
      filteredUpdates,
      {
        new: true,
        select: 'name type storage_capacity ai_points template_limit downloads_limit template_library graphics_library customer_support price ai_duration_unit active createdAt updatedAt',
      },
    ).lean();

    if (!rawUpdatedPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 },
      );
    }

    const updatedPlan = {
      id: rawUpdatedPlan._id.toString(),
      name: rawUpdatedPlan.name,
      type: rawUpdatedPlan.type,
      storage_capacity: rawUpdatedPlan.storage_capacity,
      ai_points: rawUpdatedPlan.ai_points,
      template_limit: rawUpdatedPlan.template_limit,
      downloads_limit: rawUpdatedPlan.downloads_limit,
      template_library: rawUpdatedPlan.template_library,
      graphics_library: rawUpdatedPlan.graphics_library,
      customer_support: rawUpdatedPlan.customer_support,
      price: rawUpdatedPlan.price,
      ai_duration_unit: rawUpdatedPlan.ai_duration_unit,
      active: rawUpdatedPlan.active,
      createdAt: formatDate(rawUpdatedPlan.createdAt),
      updatedAt: formatDate(rawUpdatedPlan.updatedAt),
    };

    return NextResponse.json({
      message: 'Plan updated successfully',
      plan: updatedPlan,
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE - Delete plan
async function handleDeletePlan(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB();

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 },
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 },
      );
    }

    const PlanModel = getPlanModel();

    // Delete plan
    const deletedPlan = await (PlanModel as any).findByIdAndDelete(planId);

    if (!deletedPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Export wrapped handlers with admin auth middleware
export const GET = withAdminAuth(handleGetPlans);
export const POST = withAdminAuth(handleCreatePlan);
export const PATCH = withAdminAuth(handleUpdatePlan);
export const DELETE = withAdminAuth(handleDeletePlan);