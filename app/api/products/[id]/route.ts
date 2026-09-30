import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import { productSchema } from "@/lib/validations/product";
import { eq } from "drizzle-orm";

interface Params {
  params: { id: string };
}

export async function PUT(request: Request, { params }: Params) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const validation = productSchema.safeParse(body);

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

    const { name, categoryId, basePrice } = validation.data;

    const [updated] = await db
      .update(products)
      .set({
        name,
        categoryId,
        basePrice: basePrice.toString(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Produk tidak ditemukan" } },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal memperbarui produk" } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, params.id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Produk tidak ditemukan" } },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal menghapus produk" } },
      { status: 500 }
    );
  }
}
