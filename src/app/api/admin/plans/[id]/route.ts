import type { NextRequest } from 'next/server';
import mongoose, { Types } from 'mongoose';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Plan } from '@/models';

// Get Plan model with proper typing
const getPlanModel = () => {
  return Plan;
};

// GET single plan
async function handleGetPlan(_request: NextRequest, planId: string) {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 },
      );
    }

    // Ensure database connection
    await connectDB();

    const PlanModel = getPlanModel();
    const plan = await (PlanModel as any)
      .findById(new Types.ObjectId(planId))
      .select('name type storage_capacity ai_points template_limit downloads_limit template_library graphics_library customer_support price ai_duration_unit active createdAt updatedAt')
      .lean();

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 },
      );
    }

    // Format response
    const formattedPlan = {
      id: (plan as any)._id.toString(),
      name: (plan as any).name,
      type: (plan as any).type,
      storage_capacity: (plan as any).storage_capacity,
      ai_points: (plan as any).ai_points,
      template_limit: (plan as any).template_limit,
      downloads_limit: (plan as any).downloads_limit,
      template_library: (plan as any).template_library,
      graphics_library: (plan as any).graphics_library,
      customer_support: (plan as any).customer_support,
      price: (plan as any).price,
      ai_duration_unit: (plan as any).ai_duration_unit,
      active: (plan as any).active,
      createdAt: (plan as any).createdAt,
      updatedAt: (plan as any).updatedAt,
    };

    return NextResponse.json(formattedPlan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PUT update plan
async function handleUpdatePlan(request: NextRequest, planId: string) {
  try {
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

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 },
      );
    }

    // Ensure database connection
    await connectDB();

    const PlanModel = getPlanModel();

    // Check if plan exists
    const existingPlan = await (PlanModel as any).findById(new Types.ObjectId(planId)).lean();

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 },
      );
    }

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 },
      );
    }

    // Check if plan name is taken by another plan
    if (name !== (existingPlan as any).name) {
      const nameExists = await (PlanModel as any).findOne({
        name,
        _id: { $ne: planId },
      }).lean();

      if (nameExists) {
        return NextResponse.json(
          { error: 'Plan name is already taken by another plan' },
          { status: 409 },
        );
      }
    }

    // Prepare update data
    const updateData: any = {
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
      active: active !== undefined ? Boolean(active) : true,
    };

    // Update plan
    const updatedPlan = await (PlanModel as any).findByIdAndUpdate(
      planId,
      updateData,
      {
        new: true,
        select: 'name type storage_capacity ai_points template_limit downloads_limit template_library graphics_library customer_support price ai_duration_unit active createdAt updatedAt',
      },
    ).lean();

    if (!updatedPlan) {
      return NextResponse.json(
        { error: 'Failed to update plan' },
        { status: 500 },
      );
    }

    // Format response
    const formattedPlan = {
      id: (updatedPlan as any)._id.toString(),
      name: (updatedPlan as any).name,
      type: (updatedPlan as any).type,
      storage_capacity: (updatedPlan as any).storage_capacity,
      ai_points: (updatedPlan as any).ai_points,
      template_limit: (updatedPlan as any).template_limit,
      downloads_limit: (updatedPlan as any).downloads_limit,
      template_library: (updatedPlan as any).template_library,
      graphics_library: (updatedPlan as any).graphics_library,
      customer_support: (updatedPlan as any).customer_support,
      price: (updatedPlan as any).price,
      ai_duration_unit: (updatedPlan as any).ai_duration_unit,
      active: (updatedPlan as any).active,
      createdAt: (updatedPlan as any).createdAt,
      updatedAt: (updatedPlan as any).updatedAt,
    };

    return NextResponse.json({
      message: 'Plan updated successfully',
      plan: formattedPlan,
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE plan
async function handleDeletePlan(_request: NextRequest, planId: string) {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 },
      );
    }

    // Ensure database connection
    await connectDB();

    const PlanModel = getPlanModel();

    // Check if plan exists
    const existingPlan = await (PlanModel as any).findById(new Types.ObjectId(planId)).lean();

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 },
      );
    }

    // Delete plan
    await (PlanModel as any).findByIdAndDelete(planId);

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

export const GET = withAdminAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  return handleGetPlan(request, params.id);
});

export const PUT = withAdminAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  return handleUpdatePlan(request, params.id);
});

export const DELETE = withAdminAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  return handleDeletePlan(request, params.id);
});