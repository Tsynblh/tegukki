import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// PUT: Update username, role, atau reset password
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.username) {
      const cleanUsername = body.username.trim().toLowerCase();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.username, cleanUsername));

      if (existing.length > 0 && existing[0].id !== params.id) {
        return NextResponse.json(
          { error: { code: "CONFLICT", message: "Username sudah digunakan oleh akun lain" } },
          { status: 409 }
        );
      }
      updateData.username = cleanUsername;
    }

    if (body.role) updateData.role = body.role;
    if (body.password && body.password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(body.password.trim(), 10);
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, params.id))
      .returning({
        id: users.id,
        username: users.username,
        role: users.role,
        updatedAt: users.updatedAt,
      });

    if (!updated) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Pengguna tidak ditemukan" } },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal memperbarui pengguna" } },
      { status: 500 }
    );
  }
}

// DELETE: Hapus akun pengguna (Admin Only)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  if (user?.id === params.id) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Tidak dapat menghapus akun sendiri" } },
      { status: 400 }
    );
  }

  try {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, params.id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Pengguna tidak ditemukan" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal menghapus pengguna" } },
      { status: 500 }
    );
  }
}
