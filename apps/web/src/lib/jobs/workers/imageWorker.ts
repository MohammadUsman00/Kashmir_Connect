import path from "path";
import sharp from "sharp";
import { Job, Worker } from "bullmq";
import { prisma } from "@kashmir/db";
import { supabaseAdmin } from "@/lib/supabase";
import { redisConnection } from "../queues";

type ImageJobPayload = {
  bucket?: string;
  sourcePath: string;
  entityType: "PRODUCT" | "STOREFRONT";
  entityId: string;
  imageRole?: "cover" | "logo" | "gallery";
};

const sizes = [
  { label: "thumbnail", width: 200 },
  { label: "medium", width: 600 },
  { label: "large", width: 1200 }
] as const;

function buildTargetPath(sourcePath: string, label: string): string {
  const extless = sourcePath.replace(path.extname(sourcePath), "");
  return `${extless}-${label}.webp`;
}

export const imageWorker = new Worker<ImageJobPayload>(
  "image-processing",
  async (job: Job<ImageJobPayload>) => {
    const bucket = job.data.bucket ?? process.env.SUPABASE_MEDIA_BUCKET ?? "media";
    const { data: download, error: downloadError } = await supabaseAdmin.storage
      .from(bucket)
      .download(job.data.sourcePath);

    if (downloadError || !download) {
      throw new Error(`Failed to download source image: ${downloadError?.message ?? "unknown"}`);
    }

    const inputBuffer = Buffer.from(await download.arrayBuffer());
    const generatedUrls: Record<string, string> = {};

    for (const size of sizes) {
      const transformed = await sharp(inputBuffer)
        .resize({ width: size.width, withoutEnlargement: true })
        .webp({ quality: 84 })
        .toBuffer();
      const targetPath = buildTargetPath(job.data.sourcePath, size.label);
      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(targetPath, transformed, {
          contentType: "image/webp",
          upsert: true
        });
      if (uploadError) {
        throw new Error(`Failed uploading ${size.label}: ${uploadError.message}`);
      }
      const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(targetPath);
      generatedUrls[size.label] = publicData.publicUrl;
    }

    if (job.data.entityType === "PRODUCT") {
      const product = await prisma.product.findUnique({
        where: { id: job.data.entityId },
        select: { id: true, images: true }
      });
      if (product) {
        const existing = Array.isArray(product.images) ? (product.images as string[]) : [];
        await prisma.product.update({
          where: { id: product.id },
          data: {
            images: [...existing, generatedUrls.thumbnail, generatedUrls.medium, generatedUrls.large]
          }
        });
      }
    } else {
      if (job.data.imageRole === "logo") {
        await prisma.storefront.update({
          where: { id: job.data.entityId },
          data: { logoUrl: generatedUrls.medium }
        });
      } else {
        await prisma.storefront.update({
          where: { id: job.data.entityId },
          data: { coverUrl: generatedUrls.large }
        });
      }
    }

    await supabaseAdmin.storage.from(bucket).remove([job.data.sourcePath]);
    return generatedUrls;
  },
  {
    connection: redisConnection,
    concurrency: 6
  }
);
