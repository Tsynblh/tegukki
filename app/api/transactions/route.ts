import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  transactions,
  transactionItems,
  transactionDiscounts,
  productVariants,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { transactionCreateSchema } from "@/lib/validations/transaction";
import { eq, inArray } from "drizzle-orm";
import { triggerPusherEvent } from "@/lib/pusher";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Harus login untuk bertransaksi" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = transactionCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: validation.error.issues[0]?.message || "Payload tidak valid",
          },
        },
        { status: 400 }
      );
    }

    const { paymentMethod, cashReceived, items, discounts: appliedDiscounts } =
      validation.data;

    // 1. Validasi Stok di Backend (Mencegah Race Condition)
    const variantIds = items.map((i) => i.productVariantId);
    const existingVariants = await db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.id, variantIds));

    for (const item of items) {
      const variant = existingVariants.find((v) => v.id === item.productVariantId);
      if (!variant) {
        return NextResponse.json(
          { error: { code: "ITEM_NOT_FOUND", message: `Item tidak ditemukan di sistem` } },
          { status: 400 }
        );
      }
      if (variant.stock < item.quantity) {
        return NextResponse.json(
          {
            error: {
              code: "OUT_OF_STOCK",
              message: `Stok untuk ${item.productNameSnapshot} tidak mencukupi (sisa: ${variant.stock})`,
            },
          },
          { status: 400 }
        );
      }
    }

    // 2. Kalkulasi Total & PPN (11%)
    const subtotal = items.reduce((acc, curr) => acc + curr.lineTotal, 0);

    // Kalkulasi diskon stacking
    const totalDiscountPercentage = appliedDiscounts.reduce(
      (acc, d) => acc + d.discountPercentageSnapshot,
      0
    );
    const totalDiscountAmount = (subtotal * totalDiscountPercentage) / 100;
    const afterDiscount = Math.max(0, subtotal - totalDiscountAmount);

    // PPN 11% (tidak dibulatkan, BR-5)
    const taxAmount = afterDiscount * 0.11;
    const totalAmount = afterDiscount + taxAmount;

    // 3. Validasi Uang Cash (BR-10)
    let changeAmount: number | null = null;
    if (paymentMethod === "cash") {
      if (!cashReceived || cashReceived < totalAmount) {
        return NextResponse.json(
          {
            error: {
              code: "INSUFFICIENT_CASH",
              message: "Nominal uang yang diterima kurang dari total transaksi",
            },
          },
          { status: 400 }
        );
      }
      changeAmount = cashReceived - totalAmount;
    }

    // 4. Generate Nomor Transaksi (e.g., TRX-YYYYMMDD-XXXX)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const transactionCode = `TRX-${today}-${randomSuffix}`;

    // 5. Simpan Transaksi Induk
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        transactionCode,
        userId: user.id,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalDiscountAmount: totalDiscountAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        paymentMethod,
        cashReceived: cashReceived ? cashReceived.toFixed(2) : null,
        changeAmount: changeAmount !== null ? changeAmount.toFixed(2) : null,
      })
      .returning();

    // 6. Simpan Snapshot Transaction Items & Kurangi Stok
    for (const item of items) {
      await db.insert(transactionItems).values({
        transactionId: newTransaction.id,
        productVariantId: item.productVariantId,
        productNameSnapshot: item.productNameSnapshot,
        priceSnapshot: item.priceSnapshot.toFixed(2),
        quantity: item.quantity,
        lineTotal: item.lineTotal.toFixed(2),
      });

      // Kurangi stok varian
      const current = existingVariants.find((v) => v.id === item.productVariantId);
      if (current) {
        await db
          .update(productVariants)
          .set({ stock: current.stock - item.quantity })
          .where(eq(productVariants.id, item.productVariantId));
      }
    }

    // 7. Simpan Snapshot Transaction Discounts
    for (const disc of appliedDiscounts) {
      await db.insert(transactionDiscounts).values({
        transactionId: newTransaction.id,
        discountId: disc.discountId,
        discountNameSnapshot: disc.discountNameSnapshot,
        discountPercentageSnapshot: disc.discountPercentageSnapshot.toFixed(2),
      });
    }

    // Realtime broadcast ke Admin & Kasir lain
    await triggerPusherEvent("pos-channel", "transaction-created", {
      transactionCode,
      totalAmount,
      cashier: user.username,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        transaction: {
          id: newTransaction.id,
          transactionCode,
          createdAt: newTransaction.createdAt,
          subtotal,
          taxAmount,
          totalDiscountAmount,
          totalAmount,
          paymentMethod,
          cashReceived,
          changeAmount,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Submit transaction error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal memproses transaksi" } },
      { status: 500 }
    );
  }
}
