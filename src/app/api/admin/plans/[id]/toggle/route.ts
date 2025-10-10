import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { Plan } from '@/models';

// Helper function to format dates without milliseconds
function formatDate(date: Date | null | string): string | null {
  if (!date) {
    return null;
  }

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) {
      return null;
    }

    return d.toISOString().slice(0, 19).replace('T', ' ');
  } catch {
    return null;
  }
}

// PATCH - Toggle plan status
async function handleTogglePlanStatus(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Ensure database connection
    await connectDB();

    const planId = params.id;

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

    // Find the current plan
    const currentPlan = await (Plan as any).findById(planId).select('active').lean();

    if (!currentPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 },
      );
    }

    // Toggle the status
    const newStatus = !currentPlan.active;

    // Update plan status
    const rawUpdatedPlan = await (Plan as any).findByIdAndUpdate(
      planId,
      { active: newStatus },
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
      success: true,
      message: `Plan ${newStatus ? 'activated' : 'deactivated'} successfully`,
      plan: updatedPlan,
    });
  } catch (error) {
    console.error('Error toggling plan status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const PATCH = withAdminAuth(handleTogglePlanStatus);
