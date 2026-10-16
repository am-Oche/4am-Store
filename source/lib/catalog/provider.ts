import type { Catalog, Product, ProductOverride } from './schema';

export interface CatalogProvider {
  readonly name: 'json' | 'catlog' | 'db';
  load(): Promise<Catalog>;
}

/** Merge admin overrides on top of synced data. Overrides win; hidden products are removed. */
export function applyOverrides(catalog: Catalog, overrides: ProductOverride[]): Catalog {
  const byId = new Map(overrides.map(o => [o.productId, o]));
  const products: Product[] = [];
  for (const p of catalog.products) {
    const o = byId.get(p.id);
    if (!o) { products.push(p); continue; }
    if (o.hidden) continue;
    const price = o.price ?? p.price;
    const compareAtPrice = o.compareAtPrice !== undefined ? o.compareAtPrice : p.compareAtPrice;
    products.push({
      ...p,
      name: o.name ?? p.name,
      price,
      compareAtPrice,
      discountPercent: compareAtPrice ? Math.round((1 - price / compareAtPrice) * 100) : 0,
      category: o.category ?? p.category,
      categories: o.category ? Array.from(new Set([o.category, ...p.catlogTags])) : p.categories,
      featured: o.featured ?? p.featured,
      collections: o.collections ?? p.collections,
    });
  }
  return { ...catalog, products };
}
