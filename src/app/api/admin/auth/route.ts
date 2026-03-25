import { NextRequest, NextResponse } from "next/server";
import { validatePassword, createSession, destroySession } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!validatePassword(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await createSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
