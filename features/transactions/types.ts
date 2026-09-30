export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantDetail: string; // misal: "500ml • Terracotta"
  photoUrl: string;
  price: number;
  stock: number;
  quantity: number;
}

export interface AppliedDiscount {
  id: string;
  name: string;
  percentage: number;
}

export type PaymentMethod = "cash" | "qris" | "other";

export interface TransactionSummary {
  transactionCode: string;
  createdAt: string;
  cashierName: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number | null;
  changeAmount?: number | null;
}
