import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name));
    return NextResponse.json(allCategories);
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal mengambil kategori" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Nama kategori wajib diisi" } },
        { status: 400 }
      );
    }

    const [newCat] = await db
      .insert(categories)
      .values({ name: body.name.trim() })
      .returning();

    return NextResponse.json(newCat, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Gagal membuat kategori" } },
      { status: 500 }
    );
  }
}
