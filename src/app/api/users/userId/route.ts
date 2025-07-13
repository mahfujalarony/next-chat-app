import User from "@/models/User";
import { connectToDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await connectToDB();

    const firebaseUid = params.userId;
    if (!firebaseUid) {
      return NextResponse.json({ message: "Missing Firebase UID" }, { status: 400 });
    }

    const user = await User.findOne({ firebaseUid }).select("_id");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    console.error("GET USER ERROR:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
