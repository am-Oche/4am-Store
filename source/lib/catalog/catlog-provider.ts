/**
 * CatlogProvider — reads the client's PUBLIC Catlog storefront API (the same endpoint the
 * storefront at https://4am.catlog.shop calls in the browser). No scraping of rendered HTML,
 * no Instagram.
 *
 *   GET https://api.catlog.shop/items/public?filter[store]=<storeId>&page=1&per_page=200
 *   → { data: { items: { featured_items: [...], other_items: [...] } } }
 *
 * Store meta (categories, WhatsApp, delivery areas) comes from __NEXT_DATA__ on the storefront.
 */
import { CatalogSchema, type Catalog, type Product } from './schema';
import type { CatalogProvider } from './provider';
import { COLLECTION_RULES, COLOUR_RULES, CATEGORY_MAP } from './rules';

const API = 'https://api.catlog.shop';
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type RawItem = any; // Catlog's response is untyped; we validate the OUTPUT with Zod.

export class CatlogProvider implements CatalogProvider {
  readonly name = 'catlog' as const;
  constructor(private opts = { storeSlug: process.env.CATLOG_STORE_SLUG ?? '4am', storeUrl: process.env.CATLOG_STORE_URL ?? 'https://4am.catlog.shop' }) {}

  private async storeMeta() {
    const html = await fetch(this.opts.storeUrl, { headers: { 'user-agent': '4am-sync/1.0' } }).then(r => r.text());
    const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m) throw new Error('Catlog storefront meta not found — page structure changed');
    return JSON.parse(m[1]).props.pageProps.data.data.store;
  }

  private async items(storeId: string): Promise<RawItem[]> {
    const seen = new Map<string, RawItem>();
    for (let page = 1; page < 50; page++) {
      const url = `${API}/items/public?filter%5Bstore%5D=${storeId}&page=${page}&per_page=100`;
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`Catlog items ${res.status}`);
      const { data } = await res.json();
      const list: RawItem[] = [...(data.items.other_items ?? []), ...(data.items.featured_items ?? [])];
      let added = 0;
      for (const it of list) if (it?.id && !seen.has(it.id)) { seen.set(it.id, it); added++; }
      if (added === 0) break;
    }
    return [...seen.values()];
  }

  async load(): Promise<Catalog> {
    const s = await this.storeMeta();
    const raw = await this.items(s.id);
    const cats = s.categories.map((c: any) => ({ id: c.id, name: c.name.trim(), slug: slugify(c.name.trim()), emoji: c.emoji }));
    const catById = new Map(cats.map((c: any) => [c.id, c]));

    const products: Product[] = raw.map((x: RawItem) => {
      const opts = x.variants?.options ?? [];
      const variants = opts.map((o: any) => {
        const rawSize = String(o.values?.size ?? '');
        return { id: o.id, sku: o.sku ?? null, size: rawSize.trim().toUpperCase().replace('XXL', '2XL'), rawSize, price: o.price, salePrice: o.discount_price ?? null, available: o.is_available !== false };
      }).sort((a: any, b: any) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));
      const dp = variants.map((v: any) => v.salePrice).filter(Boolean) as number[];
      const sale = x.discount_price ?? (dp.length ? Math.min(...dp) : null);
      const tags = (x.tags ?? []).map((t: any) => (catById.get(t.id) as any)?.slug).filter(Boolean);
      const primary = CATEGORY_MAP[x.id] ?? tags[0] ?? 'tracksuits-and-two-piece-designs';
      const name = String(x.name).trim();
      return {
        id: x.id, slug: x.slug, catlogSlug: x.slug, sku: x.sku ?? null, name,
        description: String(x.description ?? '').trim(), currency: 'NGN',
        price: sale ?? x.price, compareAtPrice: sale ? x.price : null,
        discountPercent: sale ? Math.round((1 - sale / x.price) * 100) : 0,
        images: (x.images ?? []).map((u: string) => {
          const key = u.split('/').pop()!.replace(/\.\w+$/, '');
          return { src: `/products/${key}.webp`, sourceUrl: u, width: 800, height: 1000, status: 'client-owned, verify' as const };
        }),
        variants, sizes: variants.map((v: any) => v.size),
        category: primary, categorySource: tags.includes(primary) ? 'catlog' : 'mapped-from-photo (client to confirm)',
        categories: Array.from(new Set([primary, ...tags])), catlogTags: tags,
        catlogPrimaryCategoryId: x.category?.id ?? null,
        collections: COLLECTION_RULES.filter(r => r.re.test(name)).map(r => r.slug),
        colourHints: COLOUR_RULES.filter(r => r.re.test(name)).map(r => r.slug),
        available: !!x.available, featured: !!x.is_featured, limited: /limited/i.test(x.description ?? ''),
        lowStock: !!x.is_low_stock, totalOrders: Math.max(0, x.total_orders ?? 0),
        createdAt: x.created_at, updatedAt: x.updated_at,
        catlogUrl: `${this.opts.storeUrl}/products/${x.slug}`,
      };
    });

    return CatalogSchema.parse({
      source: `${API}/items/public?filter[store]=${s.id}`, storeId: s.id, syncedAt: new Date().toISOString(),
      store: {
        name: s.name, description: s.description, logo: s.logo, heroImage: s.hero_image ?? null, phone: s.phone,
        whatsapp: s.checkout_channels?.whatsapp?.[0]?.phone ?? s.phone, instagram: s.socials?.instagram ?? '',
        currency: 'NGN', tagline: (s.configuration?.custom_message ?? '').trim(),
        deliveryTimeline: s.extra_info?.delivery_timeline ?? '', deliveryLocations: (s.delivery_locations ?? '').trim(),
        refundPolicy: s.extra_info?.refund_policy ?? '', paymentOptions: (s.payment_options?.NGN ?? []).filter((p: any) => p.enabled).map((p: any) => p.type),
        deliveryAreas: (s.delivery_areas ?? []).filter((a: any) => a.active).map((a: any) => a.name.trim()), itemCount: s.item_count,
      },
      catlogCategories: cats,
      collections: COLLECTION_RULES.map(({ slug, name }) => ({ slug, name })),
      colours: COLOUR_RULES.map(({ slug, name, hex }) => ({ slug, name, hex })),
      products,
    });
  }
}
