#!/usr/bin/env tsx
/**
 * Fallback importer: npm run import:file -- ./catlog-export.csv   (or .json)
 * Use this only if the Catlog API is ever unreadable. CSV columns are listed in ImportRowSchema
 * (name, price, sale_price, description, category, sizes "S|M|L", images "url|url", available, catlog_url).
 */
import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { ImportRowSchema, CatalogSchema } from '../lib/catalog/schema';

const file = process.argv[2];
if (!file) { console.error('usage: npm run import:file -- <file.csv|file.json>'); process.exit(1); }
const text = await fs.readFile(file, 'utf8');
const rows = file.endsWith('.json') ? JSON.parse(text) : parse(text, { columns: true, skip_empty_lines: true });
const errors: string[] = [];
const products = rows.map((r: unknown, i: number) => {
  const p = ImportRowSchema.safeParse(r);
  if (!p.success) { errors.push(`row ${i + 2}: ${p.error.issues.map(x => x.path + ' ' + x.message).join(', ')}`); return null; }
  const d = p.data; const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sizes = d.sizes.split('|').map(s => s.trim()).filter(Boolean);
  return {
    id: 'imp-' + i, slug, catlogSlug: slug, name: d.name, description: d.description, currency: 'NGN',
    price: d.sale_price ?? d.price, compareAtPrice: d.sale_price ? d.price : null,
    discountPercent: d.sale_price ? Math.round((1 - d.sale_price / d.price) * 100) : 0,
    images: d.images.split('|').map(u => ({ src: u, sourceUrl: u, width: 1080, height: 1350, status: 'client-owned, verify' })),
    variants: sizes.map((s, k) => ({ id: `imp-${i}-${k}`, size: s, rawSize: s, price: d.price, salePrice: d.sale_price ?? null, available: d.available })),
    sizes, category: d.category, categorySource: 'import', categories: [d.category], catlogTags: [], catlogPrimaryCategoryId: null,
    collections: [], colourHints: [], available: d.available, featured: false, limited: false, lowStock: false, totalOrders: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), catlogUrl: d.catlog_url ?? 'https://4am.catlog.shop',
  };
}).filter(Boolean);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const existing = JSON.parse(await fs.readFile('data/catalog.json', 'utf8'));
await fs.writeFile('data/catalog.json', JSON.stringify(CatalogSchema.parse({ ...existing, products, syncedAt: new Date().toISOString(), source: file }), null, 1));
console.log(`✔ imported ${products.length} products from ${file}`);
