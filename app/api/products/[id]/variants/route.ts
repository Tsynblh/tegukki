import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { productVariants, products } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import { variantSchema } from "@/lib/validations/product";
import { eq } from "drizzle-orm";

interface Params {
  params: { id: string };
}

export async function POST(request: Request, { params }: Params) {
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
            message: validation.error.issues[0]?.message || "Input varian tidak valid",
          },
        },
        { status: 400 }
      );
    }

    // Cek keberadaan produk induk
    const [prod] = await db
      .select()
      .from(products)
      .where(eq(products.id, params.id))
      .limit(1);

    if (!prod) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Produk induk tidak ditemukan" } },
        { status: 404 }
      );
    }

    const { size, color, photoUrl, priceOverride, stock } = validation.data;

    const [newVariant] = await db
      .insert(productVariants)
      .values({
        productId: params.id,
        size: size || null,
        color: color || null,
        photoUrl,
        priceOverride: priceOverride ? priceOverride.toString() : null,
        stock,
      })
      .returning();

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error) {
    console.error("Create variant error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal menambah varian" } },
      { status: 500 }
    );
  }
}
