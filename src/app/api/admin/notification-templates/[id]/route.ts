import type { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/libs/mongoose';
import { withAdminAuth } from '@/middleware/adminAuth';
import { NotificationTemplate } from '@/models';

// GET single notification template
async function handleGetTemplate(
  _request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = context.params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 },
      );
    }

    const template = await (NotificationTemplate as any).findById(id);

    if (!template) {
      return NextResponse.json(
        { error: 'Notification template not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      template: {
        id: template._id.toString(),
        code: template.code,
        title: template.title,
        message: template.message,
        type: template.type,
        isActive: template.isActive,
        variables: template.variables,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching notification template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification template' },
      { status: 500 },
    );
  }
}

// PUT update notification template
async function handleUpdateTemplate(
  request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = context.params;
    const body = await request.json();
    const { code, title, message, type, isActive } = body;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 },
      );
    }

    // Validation
    if (!code || !title || !message) {
      return NextResponse.json(
        { error: 'Code, title, and message are required' },
        { status: 400 },
      );
    }

    // Check if code already exists (excluding current template)
    const existingTemplate = await (NotificationTemplate as any).findOne({
      code: code.toUpperCase(),
      _id: { $ne: id },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Notification template with this code already exists' },
        { status: 409 },
      );
    }

    // Update template
    const updatedTemplate = await (NotificationTemplate as any).findByIdAndUpdate(
      id,
      {
        code: code.toUpperCase(),
        title,
        message,
        type: type || 'info',
        isActive: typeof isActive === 'boolean' ? isActive : true,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: 'Notification template not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: 'Notification template updated successfully',
      template: {
        id: updatedTemplate._id.toString(),
        code: updatedTemplate.code,
        title: updatedTemplate.title,
        message: updatedTemplate.message,
        type: updatedTemplate.type,
        isActive: updatedTemplate.isActive,
        variables: updatedTemplate.variables,
        createdAt: updatedTemplate.createdAt,
        updatedAt: updatedTemplate.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating notification template:', error);
    return NextResponse.json(
      { error: 'Failed to update notification template' },
      { status: 500 },
    );
  }
}

// DELETE notification template
async function handleDeleteTemplate(
  _request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await connectDB();

    const { id } = context.params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 },
      );
    }

    const deletedTemplate = await (NotificationTemplate as any).findByIdAndDelete(id);

    if (!deletedTemplate) {
      return NextResponse.json(
        { error: 'Notification template not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: 'Notification template deleted successfully',
      template: {
        id: deletedTemplate._id.toString(),
        code: deletedTemplate.code,
        title: deletedTemplate.title,
      },
    });
  } catch (error) {
    console.error('Error deleting notification template:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification template' },
      { status: 500 },
    );
  }
}

// Export handlers with admin auth
export const GET = withAdminAuth(handleGetTemplate);
export const PUT = withAdminAuth(handleUpdateTemplate);
export const DELETE = withAdminAuth(handleDeleteTemplate);
