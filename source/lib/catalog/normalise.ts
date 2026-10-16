/** Turns raw Catlog store + items into the canonical Catalog shape. Shared by the sync script and CatlogProvider.
 *  Mirrors the import run on 2026-10-14 that produced data/catalog.json. */
import categoryMap from '@/data/category-map.json';   // { [productId]: categorySlug } — photo-based mapping, client to confirm
import { collections, colours } from '@/config/merchandising';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const normSize = (s: string) => s.trim().toUpperCase().replace('XXL', '2XL');

export function normaliseCatlog(store: any, items: any[], opts: { imageMode: 'local' | 'remote' }) {
  const cats = Object.fromEntries(store.categories.map((c: any) => [c.id, { id: c.id, name: c.name.trim(), slug: slugify(c.name), emoji: c.emoji }]));
  const products = items.map(x => {
    const opts_ = x.variants?.options ?? [];
    const variants = opts_.map((o: any) => ({
      id: o.id, sku: o.sku ?? null, size: normSize(o.values?.size ?? ''), rawSize: o.values?.size ?? '',
      price: o.price, salePrice: o.discount_price ?? null, available: o.is_available !== false,
    })).sort((a: any, b: any) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));
    const sale = x.discount_price ?? (variants.find((v: any) => v.salePrice)?.salePrice ?? null);
    const tags = (x.tags ?? []).filter((t: any) => cats[t.id]).map((t: any) => cats[t.id].slug);
    const primary = (categoryMap as Record<string, string>)[x.id] ?? tags[0] ?? 'tracksuits-and-two-piece-designs';
    const lname = x.name.toLowerCase();
    return {
      id: x.id, slug: x.slug, catlogSlug: x.slug, sku: x.sku ?? null, name: x.name.trim(), description: (x.description ?? '').trim(),
      currency: 'NGN' as const, price: sale ?? x.price, compareAtPrice: sale ? x.price : null,
      discountPercent: sale ? Math.round((1 - sale / x.price) * 100) : 0,
      images: x.images.map((u: string) => {
        const key = u.split('/').pop()!.replace(/\.\w+$/, '');
        return { src: opts.imageMode === 'local' ? `/products/${key}.webp` : u, sourceUrl: u, width: 1080, height: 1350, status: 'client-owned, verify' as const };
      }),
      variants, sizes: variants.map((v: any) => v.size),
      category: primary, categorySource: tags.includes(primary) ? 'catlog' : 'mapped-from-photo (client to confirm)',
      categories: [...new Set([primary, ...tags])], catlogTags: tags,
      catlogPrimaryCategoryId: x.category?.id ?? null,
      collections: collections.filter(c => c.match.test(lname)).map(c => c.slug),
      colourHints: colours.filter(c => new RegExp('\\b' + c.slug).test(lname)).map(c => c.slug),
      available: !!x.available, featured: !!x.is_featured, limited: /limited/i.test(x.description ?? ''),
      lowStock: !!x.is_low_stock, totalOrders: Math.max(0, x.total_orders ?? 0),
      createdAt: x.created_at, updatedAt: x.updated_at,
      catlogUrl: `https://${store.slug}.catlog.shop/products/${x.slug}`,
    };
  });
  return {
    source: `https://api.catlog.shop/items/public?filter[store]=${store.id}`,
    storeId: store.id, syncedAt: new Date().toISOString(),
    store: {
      name: store.name, description: store.description, logo: store.logo, heroImage: store.hero_image, phone: store.phone,
      whatsapp: store.checkout_channels?.whatsapp?.[0]?.phone ?? store.phone, instagram: store.socials?.instagram ?? '',
      currency: 'NGN' as const, tagline: (store.configuration?.custom_message ?? '').trim(),
      deliveryTimeline: store.extra_info?.delivery_timeline ?? '', deliveryLocations: (store.delivery_locations ?? '').trim(),
      refundPolicy: store.extra_info?.refund_policy ?? '',
      paymentOptions: (store.payment_options?.NGN ?? []).filter((p: any) => p.enabled).map((p: any) => p.type),
      deliveryAreas: (store.delivery_areas ?? []).filter((a: any) => a.active).map((a: any) => a.name.trim()),
      itemCount: store.item_count,
    },
    catlogCategories: Object.values(cats),
    collections: collections.map(({ slug, name }) => ({ slug, name })),
    colours: colours.map(({ slug, name, hex }) => ({ slug, name, hex })),
    products,
  };
}
