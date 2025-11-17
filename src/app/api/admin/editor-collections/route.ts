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

// GET /api/admin/editor-collections - Get all collections
async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 50);
    const skip = (page - 1) * limit;

    // Search and filter
    const search = searchParams.get('search') || '';
    const display = searchParams.get('display');

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    if (display !== null && display !== '') {
      filter.display = parseInt(display, 10);
    }

    const [collections, total] = await Promise.all([
      EditorCollection.find(filter)
        .sort({ position: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EditorCollection.countDocuments(filter),
    ]);

    return NextResponse.json({
      collections,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

// POST /api/admin/editor-collections - Create collection
async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, img, position, display } = body;

    if (!name) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    // Generate slug from name
    const slug = generateSlug(name);

    const collection = await EditorCollection.create({
      name,
      slug,
      img: img || null,
      position: position || 0,
      display: display !== undefined ? display : 1,
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}

// Apply admin authentication middleware
const GET_WITH_AUTH = withAdminAuth(GET);
const POST_WITH_AUTH = withAdminAuth(POST);

// Export with middleware
export { GET_WITH_AUTH as GET, POST_WITH_AUTH as POST };
