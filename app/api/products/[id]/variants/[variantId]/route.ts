import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { productVariants } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import { variantSchema } from "@/lib/validations/product";
import { eq, and } from "drizzle-orm";

interface Params {
  params: { id: string; variantId: string };
}

export async function PUT(request: Request, { params }: Params) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const validation = variantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: validation.error.issues[0]?.message || "Input tidak valid",
          },
        },
        { status: 400 }
      );
    }

    const { size, color, photoUrl, priceOverride, stock } = validation.data;

    const [updated] = await db
      .update(productVariants)
      .set({
        size: size || null,
        color: color || null,
        photoUrl,
        priceOverride: priceOverride ? priceOverride.toString() : null,
        stock,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productVariants.id, params.variantId),
          eq(productVariants.productId, params.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Varian tidak ditemukan" } },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update variant error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal memperbarui varian" } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const [deleted] = await db
      .delete(productVariants)
      .where(
        and(
          eq(productVariants.id, params.variantId),
          eq(productVariants.productId, params.id)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Varian tidak ditemukan" } },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete variant error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal menghapus varian" } },
      { status: 500 }
    );
  }
}
