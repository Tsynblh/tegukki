import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { discounts } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const [updated] = await db
      .update(discounts)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.percentage !== undefined && {
          percentage: body.percentage.toString(),
        }),
        ...(body.type && { type: body.type }),
        ...(body.dayCondition !== undefined && {
          dayCondition: body.dayCondition,
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(discounts.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Diskon tidak ditemukan" } },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal memperbarui diskon" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const [deleted] = await db
      .delete(discounts)
      .where(eq(discounts.id, params.id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Diskon tidak ditemukan" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal menghapus diskon" } },
      { status: 500 }
    );
  }
}
