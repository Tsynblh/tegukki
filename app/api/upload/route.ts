import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireRole } from "@/lib/auth";

export async function POST(request: Request) {
  // Hanya Admin yang boleh upload foto produk
  const { errorResponse } = await requireRole(["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: "NO_FILE", message: "Foto wajib disertakan" } },
        { status: 400 }
      );
    }

    // Jika BLOB_READ_WRITE_TOKEN ada, upload ke Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN !== "your_blob_read_write_token") {
      const blob = await put(`variants/${Date.now()}-${file.name}`, file, {
        access: "public",
      });
      return NextResponse.json({ url: blob.url });
    }

    // Fallback development lokal (Base64 Data URL)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ url: base64 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: { code: "UPLOAD_FAILED", message: "Gagal mengunggah foto" } },
      { status: 500 }
    );
  }
}
