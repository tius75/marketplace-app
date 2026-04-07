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

    // Security: Validasi ukuran file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File terlalu besar. Maksimal 10MB. Ukuran file: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
      }, { status: 400 });
    }

    // Security: Validasi MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `Tipe file tidak diizinkan. Tipe file: ${file.type}. Tipe yang diizinkan: ${ALLOWED_MIME_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Security: Validasi ekstensi file (cegah file berbahaya)
    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => fileNameLower.endsWith(ext));
    
    if (!hasValidExt) {
      return NextResponse.json({ 
        error: `Ekstensi file tidak diizinkan. Ekstensi yang diizinkan: ${ALLOWED_EXTENSIONS.join(', ')}` 
      }, { status: 400 });
    }

    // Security: Sanitasi nama file (cegah path traversal)
    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')  // Ganti karakter berbahaya dengan _
      .replace(/\.{2,}/g, '.')            // Cegah multiple dots
      .replace(/^\.+/, '')                // Hapus dots di awal
      .substring(0, 100);                 // Batasi panjang nama file

    // Security: Tambah timestamp untuk uniqueness
    const finalFileName = `${Date.now()}-${safeFileName}`;
    
    const publicUrl = await uploadToR2(file, finalFileName);

    return NextResponse.json({ 
      url: publicUrl,
      fileName: safeFileName,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: "Gagal upload file. Silakan coba lagi." 
    }, { status: 500 });
  }
}
