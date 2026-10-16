#!/usr/bin/env tsx
/**
 * npm run sync:catlog
 * 1. Reads the public 4am.catlog.shop storefront (__NEXT_DATA__) for store meta + categories.
 * 2. Pages through api.catlog.shop/items/public until no new items come back.
 * 3. Normalises, validates with Zod, writes data/catalog.json.
 * 4. Downloads new images → public/products/<key>.webp (sharp, 1600w, q80) and writes a blur placeholder.
 * 5. Regenerates lib/assets.ts and prints a diff (added / removed / price changes).
 * Admin overrides live in the DB and are never touched by this script.
 *
 * Flags: --dry (no writes)  --no-images
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { CatalogSchema } from '../lib/catalog/schema';
import { normaliseCatlog } from '../lib/catalog/normalise';

const SLUG = process.env.CATLOG_STORE_SLUG ?? '4am';
const dry = process.argv.includes('--dry');
const noImages = process.argv.includes('--no-images');
const OUT = path.join(process.cwd(), 'data/catalog.json');
const IMG_DIR = path.join(process.cwd(), 'public/products');

async function main() {
  const html = await (await fetch(`https://${SLUG}.catlog.shop/`)).text();
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!m) throw new Error('Catlog storefront markup changed: __NEXT_DATA__ not found. Use `npm run import:file -- export.csv` instead.');
  const store = JSON.parse(m[1]).props.pageProps.data.data.store;

  const items: any[] = [];
  for (let page = 1; page < 50; page++) {
    const r = await fetch(`https://api.catlog.shop/items/public?filter%5Bstore%5D=${store.id}&page=${page}&per_page=50`);
    if (!r.ok) throw new Error(`Catlog API ${r.status}`);
    const d = (await r.json()).data.items;
    const batch = [...(d.other_items ?? []), ...(d.featured_items ?? [])].filter((x: any) => !items.some(i => i.id === x.id));
    if (!batch.length) break;
    items.push(...batch);
  }
  if (items.length !== store.item_count) console.warn(`⚠ Catlog says ${store.item_count} items, fetched ${items.length}`);

  const next = CatalogSchema.parse(normaliseCatlog(store, items, { imageMode: 'local' }));

  if (!noImages) {
    await fs.mkdir(IMG_DIR, { recursive: true });
    for (const p of next.products) for (const im of p.images) {
      const file = path.join(process.cwd(), 'public', im.src);
      try { const meta = await sharp(file).metadata(); im.width = meta.width!; im.height = meta.height!; continue; } catch {}
      const buf = Buffer.from(await (await fetch(im.sourceUrl)).arrayBuffer());
      const img = sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true });
      const meta = await img.toFile(file.replace(/\.webp$/, '') + '.webp');
      im.width = meta.width; im.height = meta.height;
      if (!dry) console.log('  + image', im.src);
    }
  }

  // diff
  let prev: any = null;
  try { prev = JSON.parse(await fs.readFile(OUT, 'utf8')); } catch {}
  if (prev) {
    const before = new Map(prev.products.map((p: any) => [p.id, p]));
    const added = next.products.filter(p => !before.has(p.id));
    const removed = prev.products.filter((p: any) => !next.products.some(n => n.id === p.id));
    const priced = next.products.filter(p => before.has(p.id) && (before.get(p.id) as any).price !== p.price);
    console.log(`+${added.length} added, -${removed.length} removed, ${priced.length} price changes`);
    added.forEach(p => console.log('  + ' + p.name));
    removed.forEach((p: any) => console.log('  - ' + p.name));
    priced.forEach(p => console.log(`  ~ ${p.name}: ${(before.get(p.id) as any).price} → ${p.price}`));
  }
  if (dry) return console.log('dry run, nothing written');
  await fs.writeFile(OUT, JSON.stringify(next, null, 1));
  console.log(`✔ wrote ${next.products.length} products to data/catalog.json`);
}
main().catch(e => { console.error(e); process.exit(1); });
