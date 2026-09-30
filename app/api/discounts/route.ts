import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { discounts } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allDiscounts = await db
      .select()
      .from(discounts)
      .orderBy(desc(discounts.createdAt));
    return NextResponse.json(allDiscounts);
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal memuat diskon" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const [newDiscount] = await db
      .insert(discounts)
      .values({
        name: body.name,
        percentage: body.percentage.toString(),
        type: body.type,
        dayCondition: body.dayCondition || null,
        isActive: body.isActive ?? true,
      })
      .returning();

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (error) {
    console.error("Create discount error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal membuat diskon" } },
      { status: 500 }
    );
  }
}
