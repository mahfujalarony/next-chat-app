import { connectToDB } from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// GET /api/users
export async function GET() {
  await connectToDB();
  try {
    const users = await User.find({});
    console.log('Fetched users:', users);
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(request: Request) {
  await connectToDB();
  try {
    const body = await request.json();

    // Validation (optional but recommended)
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, message: 'Name and email are required' },
        { status: 400 }
      );
    }

    const user = await User.create(body);

    return NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
