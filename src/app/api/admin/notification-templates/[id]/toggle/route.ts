import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { NotificationTemplate } from '@/models';

// PATCH - Toggle notification template status
async function handleToggleTemplateStatus(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Ensure database connection
    await connectDB();

    const templateId = params.id;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 },
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 },
      );
    }

    // Find the current template
    const currentTemplate = await (NotificationTemplate as any).findById(templateId).select('isActive').lean();

    if (!currentTemplate) {
      return NextResponse.json(
        { error: 'Notification template not found' },
        { status: 404 },
      );
    }

    // Toggle the status
    const newStatus = !currentTemplate.isActive;

    // Update template status
    const updatedTemplate = await (NotificationTemplate as any).findByIdAndUpdate(
      templateId,
      { isActive: newStatus },
      {
        new: true,
        select: 'code title message type isActive variables createdAt updatedAt',
      },
    ).lean();

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: 'Notification template not found' },
        { status: 404 },
      );
    }

    const formattedTemplate = {
      id: updatedTemplate._id.toString(),
      code: updatedTemplate.code,
      title: updatedTemplate.title,
      message: updatedTemplate.message,
      type: updatedTemplate.type,
      isActive: updatedTemplate.isActive,
      variables: updatedTemplate.variables,
      createdAt: updatedTemplate.createdAt,
      updatedAt: updatedTemplate.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: `Notification template ${newStatus ? 'activated' : 'deactivated'} successfully`,
      template: formattedTemplate,
    });
  } catch (error) {
    console.error('Error toggling template status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export const PATCH = withAdminAuth(handleToggleTemplateStatus);
