import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";

// GET: Ambil daftar seluruh user (Admin Only)
export async function GET() {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json(allUsers);
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal memuat pengguna" } },
      { status: 500 }
    );
  }
}

// POST: Tambah akun kasir / admin baru (Admin Only)
export async function POST(request: Request) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Username, kata sandi, dan role wajib diisi" } },
        { status: 400 }
      );
    }

    // Cek duplikasi username
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username.trim().toLowerCase()));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Username sudah digunakan" } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        username: username.trim().toLowerCase(),
        passwordHash,
        role,
      })
      .returning({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
      });

    return NextResponse.json(newUser, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal membuat pengguna" } },
      { status: 500 }
    );
  }
}
