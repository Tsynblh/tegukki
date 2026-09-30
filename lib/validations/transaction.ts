import { z } from "zod";

export const transactionItemSchema = z.object({
  productVariantId: z.string().uuid(),
  productNameSnapshot: z.string().min(1),
  priceSnapshot: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(1),
  lineTotal: z.coerce.number().min(0),
});

export const transactionDiscountSchema = z.object({
  discountId: z.string().uuid(),
  discountNameSnapshot: z.string().min(1),
  discountPercentageSnapshot: z.coerce.number().min(0).max(100),
});

export const transactionCreateSchema = z.object({
  paymentMethod: z.enum(["cash", "qris", "other"]),
  cashReceived: z.coerce.number().optional().nullable(),
  items: z.array(transactionItemSchema).min(1, "Keranjang belanja tidak boleh kosong"),
  discounts: z.array(transactionDiscountSchema).default([]),
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
