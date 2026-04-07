import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const uploadToR2 = async (file, fileName) => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
  });

  try {
    await s3Client.send(command);
    // Mengembalikan URL publik file tersebut
    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error("R2 Upload Error:", error);
    throw error;
  }
};