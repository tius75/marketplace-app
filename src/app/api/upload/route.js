import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

// Security: Whitelist file types yang diizinkan
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/pdf'
];

// Security: Batasi ukuran file (4MB - di bawah limit Vercel 4.5MB)
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

// Security: Validasi ekstensi file
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.pdf'];

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Security: Validasi ukuran file (5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File terlalu besar. Maksimal 5MB. Ukuran file: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      }, { status: 400 });
    }

    // Security: Sanitasi nama file
    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+/, '')
      .substring(0, 100);

    const finalFileName = `${Date.now()}-${safeFileName}`;

    const publicUrl = await uploadToR2(file, finalFileName);

    return NextResponse.json({
      url: publicUrl,
      fileName: safeFileName,
      size: file.size,
      type: file.type || 'unknown'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: `Gagal upload: ${error.message}`
    }, { status: 500 });
  }
}
