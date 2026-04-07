import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const publicUrl = await uploadToR2(file, fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}