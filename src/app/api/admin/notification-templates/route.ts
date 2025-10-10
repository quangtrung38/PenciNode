import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import connectDB from '@/libs/mongoose';
import { NotificationTemplate } from '@/models';

// GET all notification templates
async function handleGetTemplates(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Build search query
    const query: any = {};
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch templates and total count
    const [templates, totalCount] = await Promise.all([
      (NotificationTemplate as any).find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      NotificationTemplate.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      templates: templates.map((template: any) => ({
        ...template,
        id: template._id.toString()
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('Error fetching notification templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification templates' },
      { status: 500 }
    );
  }
}

// POST create notification template
async function handleCreateTemplate(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { code, title, message, type = 'info' } = body;

    // Validation
    if (!code || !title || !message) {
      return NextResponse.json(
        { error: 'Code, title, and message are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingTemplate = await (NotificationTemplate as any).findOne({ 
      code: code.toUpperCase() 
    });
    
    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Notification template with this code already exists' },
        { status: 409 }
      );
    }

    // Create new template
    const template = new NotificationTemplate({
      code: code.toUpperCase(),
      title,
      message,
      type,
      isActive: true
    });

    await template.save();

    return NextResponse.json({
      message: 'Notification template created successfully',
      template: {
        id: template._id.toString(),
        code: template.code,
        title: template.title,
        message: template.message,
        type: template.type,
        isActive: template.isActive,
        variables: template.variables,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }
    });

  } catch (error) {
    console.error('Error creating notification template:', error);
    return NextResponse.json(
      { error: 'Failed to create notification template' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(handleGetTemplates);
export const POST = withAdminAuth(handleCreateTemplate);