import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { User } from '@/models';
import connectDB from '@/libs/mongoose';
import { z } from 'zod';

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100, 'Tên không được quá 100 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await (User as any).findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email này đã được sử dụng',
        },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate unique UID for user (Penci-specific)
    const generateUID = () => {
      return Math.random().toString(36).substr(2, 9).toUpperCase();
    };

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 3, // Default user role
      status: 1, // Active status
      uid: generateUID(),
      email_verified_at: null, // Will be set when email is verified
      created_at: new Date(),
      updated_at: new Date(),
      // Default Penci-specific values
      ai_points: 0,
      point: 0,
      card_limit: 5,
      language: 'vi',
      penci_purpose: null,
      // Social login defaults
      is_facebook_linked: false,
      is_google_linked: false,
      facebook_id: null,
      google_id: null,
      // Feature flags
      is_about: 0,
      is_intro: 0,
      is_marketing_mail_synced: false,
      isPenci: 0,
      is_contributor: 'N',
    });

    await newUser.save();

    // Return success response (don't include password)
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      uid: newUser.uid,
      created_at: newUser.created_at,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Đăng ký thành công! Vui lòng đăng nhập.',
        user: userResponse,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Dữ liệu không hợp lệ',
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.',
      },
      { status: 500 }
    );
  }
}