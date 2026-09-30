import { db } from "@/lib/db/client";
import {
  transactions,
  transactionItems,
  transactionDiscounts,
  users,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { TransactionHistoryView } from "@/features/transactions/components/TransactionHistoryView";
import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TransactionsHistoryPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  // 1. Fetch seluruh transaksi (diurutkan terbaru)
  const allTransactions = await db
    .select({
      id: transactions.id,
      transactionCode: transactions.transactionCode,
      createdAt: transactions.createdAt,
      subtotal: transactions.subtotal,
      taxAmount: transactions.taxAmount,
      totalDiscountAmount: transactions.totalDiscountAmount,
      totalAmount: transactions.totalAmount,
      paymentMethod: transactions.paymentMethod,
      cashReceived: transactions.cashReceived,
      changeAmount: transactions.changeAmount,
      deletedAt: transactions.deletedAt,
      cashierName: users.username,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .orderBy(desc(transactions.createdAt));

  const transactionIds = allTransactions.map((t) => t.id);

  // 2. Fetch Item Snapshot jika ada transaksi
  const allItems =
    transactionIds.length > 0
      ? await db
          .select({
            id: transactionItems.id,
            transactionId: transactionItems.transactionId,
            productName: transactionItems.productNameSnapshot,
            price: transactionItems.priceSnapshot,
            quantity: transactionItems.quantity,
            lineTotal: transactionItems.lineTotal,
          })
          .from(transactionItems)
          .where(inArray(transactionItems.transactionId, transactionIds))
      : [];

  // 3. Fetch Diskon Snapshot jika ada
  const allDiscounts =
    transactionIds.length > 0
      ? await db
          .select({
            id: transactionDiscounts.id,
            transactionId: transactionDiscounts.transactionId,
            name: transactionDiscounts.discountNameSnapshot,
            percentage: transactionDiscounts.discountPercentageSnapshot,
          })
          .from(transactionDiscounts)
          .where(inArray(transactionDiscounts.transactionId, transactionIds))
      : [];

  // Format data untuk komponen
  const formattedTransactions = allTransactions.map((trx) => ({
    ...trx,
    createdAt: trx.createdAt.toISOString(),
    deletedAt: trx.deletedAt ? trx.deletedAt.toISOString() : null,
    cashierName: trx.cashierName || "Kasir",
    items: allItems.filter((i) => i.transactionId === trx.id),
    discounts: allDiscounts.filter((d) => d.transactionId === trx.id),
  }));

  return (
    <main className="min-h-screen bg-background pb-12">
      <TransactionHistoryView
        initialTransactions={formattedTransactions}
        isAdmin={currentUser.role === "admin"}
      />
    </main>
  );
}
