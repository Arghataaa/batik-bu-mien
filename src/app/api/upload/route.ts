import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { adminGuard, apiRun } from "@/lib/api-helpers";

const MAX_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  return apiRun(async () => {
    await adminGuard();
    const form = await request.formData();
    const value = form.get("file");

    if (!(value instanceof File)) throw new Error("File gambar belum dipilih");
    if (!allowedTypes.has(value.type)) {
      throw new Error("Format gambar harus JPG, PNG, WEBP, atau GIF");
    }
    if (value.size === 0) throw new Error("File gambar kosong");
    if (value.size > MAX_SIZE) throw new Error("Ukuran gambar maksimal 5 MB");

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${randomUUID()}.${extensions[value.type]}`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(await value.arrayBuffer()));

    return { url: `/uploads/${filename}` };
  });
}
