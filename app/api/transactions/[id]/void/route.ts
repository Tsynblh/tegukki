import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { transactions, transactionItems, productVariants } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { triggerPusherEvent } from "@/lib/pusher";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    // 1. Ambil transaksi
    const [existingTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, params.id));

    if (!existingTransaction) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Transaksi tidak ditemukan" } },
        { status: 404 }
      );
    }

    if (existingTransaction.deletedAt) {
      return NextResponse.json(
        { error: { code: "ALREADY_VOIDED", message: "Transaksi sudah dibatalkan sebelumnya" } },
        { status: 400 }
      );
    }

    // 2. Ambil item-item pada transaksi ini
    const items = await db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, params.id));

    // 3. Rollback stok ke setiap varian
    for (const item of items) {
      const [variant] = await db
        .select({ stock: productVariants.stock })
        .from(productVariants)
        .where(eq(productVariants.id, item.productVariantId));

      if (variant) {
        await db
          .update(productVariants)
          .set({
            stock: variant.stock + item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, item.productVariantId));
      }
    }

    // 4. Soft-delete transaksi (set deletedAt)
    const now = new Date();
    await db
      .update(transactions)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(transactions.id, params.id));

    // 5. Broadcast Pusher Realtime
    await triggerPusherEvent("pos-channel", "transaction-voided", {
      transactionCode: existingTransaction.transactionCode,
      voidedAt: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dibatalkan dan stok telah dikembalikan.",
    });
  } catch (error) {
    console.error("Void transaction error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal membatalkan transaksi" } },
      { status: 500 }
    );
  }
}
