import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Nama produk minimal 2 karakter").max(255),
  categoryId: z.string().uuid("Kategori tidak valid"),
  basePrice: z.coerce.number().min(0, "Harga dasar tidak boleh negatif"),
});

export const variantSchema = z.object({
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  photoUrl: z.string().min(1, "Foto varian wajib diunggah (BR-11)"),
  priceOverride: z.coerce.number().optional().nullable(),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
