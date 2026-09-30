import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { products, productVariants, categories } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import { productSchema } from "@/lib/validations/product";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    // Ambil produk dan variasinya
    const allProducts = await db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        categoryName: categories.name,
        name: products.name,
        basePrice: products.basePrice,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));

    const allVariants = await db.select().from(productVariants);

    const productsWithVariants = allProducts.map((prod) => ({
      ...prod,
      variants: allVariants.filter((v) => v.productId === prod.id),
    }));

    return NextResponse.json(productsWithVariants);
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal memuat produk" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        categoryId,
        basePrice: basePrice.toString(),
      })
      .returning();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal membuat produk" } },
      { status: 500 }
    );
  }
}
