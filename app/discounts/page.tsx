import { db } from "@/lib/db/client";
import { discounts } from "@/lib/db/schema";
import { DiscountManagementView } from "@/features/discounts/components/DiscountManagementView";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const allDiscounts = await db
    .select()
    .from(discounts)
    .orderBy(desc(discounts.createdAt));

  const formattedDiscounts = allDiscounts.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-background pb-12">
      <DiscountManagementView initialDiscounts={formattedDiscounts} />
    </main>
  );
}
