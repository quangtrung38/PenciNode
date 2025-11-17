import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/libs/mongoose';
import { EditorCollection } from '@/models/EditorCollection';
import { withAdminAuth } from '@/middleware/adminAuth';

// Helper to generate slug from Vietnamese text
function generateSlug(text: string): string {
  const from = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
  const to = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';
  
  let slug = text.toLowerCase();
  for (let i = 0; i < from.length; i++) {
    const fromChar = from.charAt(i);
    const toChar = to.charAt(i);
    slug = slug.replace(new RegExp(fromChar, 'g'), toChar);
  }
  
  slug = slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return slug;
}

// PUT /api/admin/editor-collections/[id] - Update collection
async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await req.json();
    const { name, img, position, display } = body;

    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }
    if (img !== undefined) updateData.img = img;
    if (position !== undefined) updateData.position = position;
    if (display !== undefined) updateData.display = display;

    const collection = await EditorCollection.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ collection });
  } catch (error: any) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

// DELETE /api/admin/editor-collections/[id] - Delete collection
async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;

    const collection = await EditorCollection.findByIdAndDelete(id);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Collection deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}

// Apply admin authentication middleware
const PUT_WITH_AUTH = withAdminAuth(PUT);
const DELETE_WITH_AUTH = withAdminAuth(DELETE);

// Export with middleware
export { PUT_WITH_AUTH as PUT, DELETE_WITH_AUTH as DELETE };
