import { db } from "@/lib/db/client";
import { products, productVariants, categories, discounts } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { CashierView } from "@/features/transactions/components/CashierView";
import { eq, desc, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TransaksiPage() {
  const user = await getCurrentUser();

  // 1. Fetch Kategori
  const allCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));

  // 2. Fetch Produk & Varian
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

  const formattedProducts = allProducts.map((prod) => ({
    ...prod,
    createdAt: prod.createdAt.toISOString(),
    updatedAt: prod.updatedAt.toISOString(),
    variants: allVariants
      .filter((v) => v.productId === prod.id)
      .map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      })),
  }));

  // 3. Fetch Diskon Aktif
  const activeDiscounts = await db
    .select()
    .from(discounts)
    .where(eq(discounts.isActive, true));

  return (
    <main className="min-h-screen bg-background">
      <CashierView
        products={formattedProducts}
        categories={allCategories}
        discounts={activeDiscounts}
        cashierName={user?.username || "Kasir"}
      />
    </main>
  );
}
