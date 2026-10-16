import 'server-only';
import { cache } from 'react';
import { siteConfig } from '@/config/site';
import { applyOverrides, type CatalogProvider } from './provider';
import { JsonProvider } from './json-provider';
import { CatlogProvider } from './catlog-provider';
import { DbProvider } from './db-provider';
import { getOverrides } from './overrides';
import type { Catalog, Product } from './schema';

function pick(): CatalogProvider {
  switch (process.env.CATALOG_PROVIDER ?? 'json') {
    case 'catlog': return new CatlogProvider();
    case 'db': return new DbProvider();
    default: return new JsonProvider();
  }
}

/** Cached per request; ISR revalidates every CATALOG_REVALIDATE seconds. */
export const getCatalog = cache(async (): Promise<Catalog> => {
  const base = await pick().load();
  return applyOverrides(base, await getOverrides());
});

export async function getCategories() {
  const c = await getCatalog();
  const counts = new Map<string, number>();
  c.products.forEach(p => p.categories.forEach(s => counts.set(s, (counts.get(s) ?? 0) + 1)));
  return c.catlogCategories
    .map(cat => ({ ...cat, count: counts.get(cat.slug) ?? 0 }))
    .filter(cat => siteConfig.showEmptyCategories || cat.count > 0)
    .sort((a, b) => b.count - a.count);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getCatalog()).products.find(p => p.slug === slug);
}

export const isNew = (p: Product, now = Date.now()) => (now - +new Date(p.createdAt)) / 864e5 <= siteConfig.newArrivalDays;
export const onSale = (p: Product) => p.compareAtPrice != null && p.compareAtPrice > p.price;
export const bestSellers = (ps: Product[]) => ps.filter(p => p.totalOrders > 0).sort((a, b) => b.totalOrders - a.totalOrders);
export type { Catalog, Product };
