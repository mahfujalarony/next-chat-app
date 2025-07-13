// app/api/users/upsert/route.ts

import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectToDB();
    const body = await req.json();

    const { firebaseUid, ...updateFields } = body;

    if (!firebaseUid) {
      return NextResponse.json({ error: "Firebase UID is required" }, { status: 400 });
    }

    const result = await User.updateOne(
      { firebaseUid },             
      { $set: updateFields },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId || null
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
