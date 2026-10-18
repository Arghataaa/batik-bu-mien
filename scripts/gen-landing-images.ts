import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "public", "landing");
fs.mkdirSync(OUT, { recursive: true });

type Job = { name: string; size: string; prompt: string };

const jobs: Job[] = [
  {
    name: "hero",
    size: "1024x1024",
    prompt:
      "Premium editorial photograph of a modern heritage batik fashion boutique display. Elegant mannequins wearing ready-to-wear batik shirts and daster in warm cream, brown, terracotta and gold tones. Folded sarung and sorban on a wooden shelf, a blangkon on a stand. Soft golden studio lighting, cream background, luxurious minimalist composition, high-end fashion catalog aesthetic. No text.",
  },
  {
    name: "kemeja-batik",
    size: "1024x1024",
    prompt:
      "Professional e-commerce product photograph of a neatly folded men's long-sleeve batik shirt in deep brown and cream tones with traditional kawung motif. Placed on a warm cream linen surface, soft directional studio lighting, minimal premium catalog styling, terracotta accent. No text.",
  },
  {
    name: "daster-batik",
    size: "1024x1024",
    prompt:
      "Professional e-commerce product photograph of a folded batik daster (Indonesian house dress) in warm terracotta and cream tones with sidomukti motif. On a cream linen surface, soft studio lighting, premium minimal catalog styling, gold accent. No text.",
  },
  {
    name: "sarung",
    size: "1024x1024",
    prompt:
      "Professional e-commerce product photograph of a folded batik sarung in dark brown, gold and cream tones with parang motif. On a warm cream linen surface, soft directional studio lighting, premium minimal catalog styling. No text.",
  },
  {
    name: "sorban",
    size: "1024x1024",
    prompt:
      "Professional e-commerce product photograph of a neatly folded batik sorban (head cloth) in cream and brown tones with mega mendung motif, draped elegantly. On a cream linen surface, soft studio lighting, premium minimal catalog styling, gold accent. No text.",
  },
  {
    name: "blangkon",
    size: "1024x1024",
    prompt:
      "Professional e-commerce product photograph of a traditional Javanese blangkon (Yogyakarta style head cap) in dark brown with golden batik motif accent, displayed on a small wooden stand. Cream background, soft studio lighting, premium minimal catalog styling. No text.",
  },
];

async function main() {
  const zai = await ZAI.create();
  for (const job of jobs) {
    const outPath = path.join(OUT, `${job.name}.png`);
    if (fs.existsSync(outPath)) {
      console.log(`skip ${job.name} (exists)`);
      continue;
    }
    try {
      console.log(`generating ${job.name} (${job.size})...`);
      const res = await zai.images.generations.create({
        prompt: job.prompt,
        size: job.size as any,
      });
      const b64 = res.data[0].base64;
      fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
      console.log(`  ok saved ${outPath}`);
    } catch (e: any) {
      console.error(`  fail ${job.name}:`, e?.message || e);
    }
  }
  console.log("done");
}

main();
