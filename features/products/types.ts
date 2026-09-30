export interface ProductVariant {
  id: string;
  productId: string;
  size: string | null;
  color: string | null;
  photoUrl: string;
  priceOverride: string | number | null;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithVariants {
  id: string;
  categoryId: string;
  categoryName?: string | null;
  name: string;
  basePrice: string | number;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
}
