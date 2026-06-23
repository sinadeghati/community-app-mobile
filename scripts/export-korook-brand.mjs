/**
 * Export Korook brand SVGs to PNG / ICO raster assets.
 * Run: node scripts/export-korook-brand.mjs
 */
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "assets", "brand", "korook");

async function main() {
  const sharp = (await import("sharp")).default;
  let pngToIco;
  try {
    pngToIco = (await import("png-to-ico")).default;
  } catch {
    pngToIco = null;
  }

  mkdirSync(OUT, { recursive: true });

  const exports = [
    { svg: "logo-primary.svg", png: "logo-primary.png", width: 1280 },
    { svg: "logo-vertical.svg", png: "logo-vertical.png", width: 960 },
    { svg: "logo-horizontal.svg", png: "logo-horizontal.png", width: 1440 },
    { svg: "logo-dark.svg", png: "logo-dark.png", width: 1280 },
    { svg: "logo-light.svg", png: "logo-light.png", width: 1280 },
    { svg: "logo-primary.svg", png: "transparent-logo.png", width: 1280, transparent: true },
    { svg: "korook-pin-symbol.svg", png: "korook-pin-symbol.png", width: 400 },
    { svg: "app-icon.svg", png: "app-icon-1024.png", width: 1024, height: 1024 },
    { svg: "app-icon.svg", png: "app-icon-512.png", width: 512, height: 512 },
    { svg: "favicon.svg", png: "favicon-16.png", width: 16, height: 16 },
    { svg: "favicon.svg", png: "favicon-32.png", width: 32, height: 32 },
    { svg: "favicon.svg", png: "favicon-64.png", width: 64, height: 64 },
  ];

  for (const item of exports) {
    const svgPath = join(OUT, item.svg);
    const pngPath = join(OUT, item.png);
    const svg = readFileSync(svgPath);

    let pipeline = sharp(svg, { density: 300 });
    if (item.width && item.height) {
      pipeline = pipeline.resize(item.width, item.height, { fit: "contain", background: item.transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : undefined });
    } else if (item.width) {
      pipeline = pipeline.resize(item.width, null, { fit: "inside" });
    }

    await pipeline.png().toFile(pngPath);
    console.log(`✓ ${item.png}`);
  }

  // Overwrite legacy mobile reference
  await sharp(readFileSync(join(OUT, "logo-primary.svg")), { density: 300 })
    .resize(880, null, { fit: "inside" })
    .png()
    .toFile(join(OUT, "korook-logo-primary.png"));
  console.log("✓ korook-logo-primary.png (mobile lockup)");

  if (pngToIco) {
    const ico = await pngToIco([
      join(OUT, "favicon-16.png"),
      join(OUT, "favicon-32.png"),
      join(OUT, "favicon-64.png"),
    ]);
    const { writeFileSync } = await import("node:fs");
    writeFileSync(join(OUT, "favicon.ico"), ico);
    console.log("✓ favicon.ico");
  } else {
    console.warn("png-to-ico not installed — skipping favicon.ico");
  }

  console.log("\nKorook brand export complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
