import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CatalogSchema, type Catalog, type Product, type ProductOverride } from './schema';
import { prisma } from '@/lib/db';
import { normaliseCatlog } from './normalise';

export interface CatalogProvider {
  name: 'json' | 'catlog' | 'db';
  load(): Promise<Catalog>;
}

/** Default. Reads data/catalog.json (written by `npm run sync:catlog`). */
export class JsonProvider implements CatalogProvider {
  name = 'json' as const;
  constructor(private file = path.join(process.cwd(), 'data/catalog.json')) {}
  async load() {
    const raw = JSON.parse(await fs.readFile(this.file, 'utf8'));
    return CatalogSchema.parse(raw);
  }
}

/** Live read of the public Catlog store, cached with ISR (revalidate every CATLOG_REVALIDATE seconds). */
export class CatlogProvider implements CatalogProvider {
  name = 'catlog' as const;
  constructor(private storeSlug = process.env.CATLOG_STORE_SLUG ?? '4am') {}
  async load() {
    const revalidate = Number(process.env.CATLOG_REVALIDATE ?? 3600);
    const storeRes = await fetch(`https://${this.storeSlug}.catlog.shop/`, { next: { revalidate } });
    const html = await storeRes.text();
    const nextData = JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)![1]);
    const store = nextData.props.pageProps.data.data.store;
    const items: any[] = [];
    for (let page = 1; page < 50; page++) {
      const r = await fetch(`https://api.catlog.shop/items/public?filter%5Bstore%5D=${store.id}&page=${page}&per_page=50`, { next: { revalidate } });
      const d = (await r.json()).data.items;
      const batch = [...(d.other_items ?? []), ...(d.featured_items ?? [])].filter(x => !items.some(i => i.id === x.id));
      if (!batch.length) break;
      items.push(...batch);
    }
    // Live mode serves images from Catlog's S3 via next/image remotePatterns (no local re-host).
    return CatalogSchema.parse(normaliseCatlog(store, items, { imageMode: 'remote' }));
  }
}

/** Reads products from Prisma (after `npm run db:seed`). */
export class DbProvider implements CatalogProvider {
  name = 'db' as const;
  async load() {
    const snap = await prisma.catalogSnapshot.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!snap) throw new Error('No catalog in DB. Run `npm run db:seed`.');
    return CatalogSchema.parse(JSON.parse(snap.json));
  }
}

function applyOverrides(products: Product[], overrides: ProductOverride[]) {
  const map = new Map(overrides.map(o => [o.productId, o]));
  return products
    .map(p => {
      const o = map.get(p.id);
      if (!o) return p;
      const { productId, badge, hidden, ...rest } = o;
      return { ...p, ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)), _badge: badge, _hidden: hidden } as Product;
    })
    .filter(p => !(p as any)._hidden);
}

const providers = { json: JsonProvider, catlog: CatlogProvider, db: DbProvider };

/** Single entry point used by every page. Overrides from /admin always win and survive re-sync. */
export async function getCatalog(): Promise<Catalog> {
  const key = (process.env.CATALOG_PROVIDER ?? 'json') as keyof typeof providers;
  const cat = await new providers[key]().load();
  const overrides = (await prisma.productOverride.findMany()).map(o => JSON.parse(o.json) as ProductOverride);
  return { ...cat, products: applyOverrides(cat.products, overrides) };
}
