// src/app/api/users/route.ts
import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"

export async function GET() {
  await connectToDB()
  const users = await User.find()
  return NextResponse.json(users)
}
