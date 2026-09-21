import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const root = new URL('../public/hero/', import.meta.url);
await fs.mkdir(new URL('optimized/', root), { recursive: true });
let before = 0, after = 0;
for (const name of await fs.readdir(root)) {
  if (!/^gm-hero-.*\.(png|jpg)$/.test(name)) continue;
  const input = new URL(name, root);
  const output = new URL(`optimized/${path.parse(name).name}.webp`, root);
  before += (await fs.stat(input)).size;
  await sharp(fileURLToPath(input)).rotate().resize({ width: name.includes('mobile') ? 800 : 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(fileURLToPath(output));
  after += (await fs.stat(output)).size;
}
console.log(`Hero images: ${(before / 1048576).toFixed(2)} MB → ${(after / 1048576).toFixed(2)} MB`);
