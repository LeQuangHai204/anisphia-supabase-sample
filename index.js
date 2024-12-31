import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { promises as fs } from "fs";
dotenv.config();
const supabaseUrl = "https://krlntbrdfozotirdnbri.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get MIME type based on file extension
function getMimeType(filename) {
  const ext = filename.toLowerCase().split(".").pop();
  const mimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

async function uploadFile(localFilePath, bucketName = "images") {
  try {
    const fileBuffer = await fs.readFile(localFilePath);
    const fileName = localFilePath.split("/").pop();
    const storagePath = `public/${fileName}`;
    const contentType = getMimeType(fileName);

    // Upload to Supabase storage with explicit content-type
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: contentType, // Explicitly set the content type
      });

    if (error) throw error;

    // Get regular public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

    // Get signed URL that expires in 1 hour
    const {
      data: { signedUrl },
    } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 3600);

    console.log("File uploaded successfully!");
    console.log("Content-Type:", contentType);
    console.log("Public URL:", publicUrl);
    console.log("Signed URL:", signedUrl);

    return {
      publicUrl,
      signedUrl,
      contentType,
      path: storagePath,
    };
  } catch (error) {
    console.error("Error uploading:", error.message);
    throw error;
  }
}

// Example usage
const testFilePath = "./picture.png"; // Replace with your actual file path
uploadFile(testFilePath)
  .then((result) => {
    console.log("\nUpload complete");
    console.log("Content-Type:", result.contentType);
    console.log("Public URL:", result.publicUrl);
    console.log("Signed URL:", result.signedUrl);
  })
  .catch((error) => {
    console.error("Upload failed:", error);
  });
