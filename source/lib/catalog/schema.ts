import { z } from 'zod';

/** Canonical catalog schema. data/catalog.json is validated against this on load and on every sync. */

export const ImageSchema = z.object({
  src: z.string(),                       // local path under /public (re-hosted)
  sourceUrl: z.string().url(),           // original Catlog S3 URL
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  status: z.enum(['client-owned, verify', 'client-owned, verified', 'replace-with-original']),
});

export const VariantSchema = z.object({
  id: z.string(),
  sku: z.string().nullable().optional(),
  size: z.string(),                      // normalised: S M L XL 2XL 3XL 4XL 5XL
  rawSize: z.string(),                   // exactly as typed in Catlog
  price: z.number().nonnegative(),
  salePrice: z.number().nonnegative().nullable(),
  available: z.boolean(),
});

export const CategoryRefSchema = z.object({ id: z.string(), name: z.string(), slug: z.string(), emoji: z.string().optional() });

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  catlogSlug: z.string(),
  sku: z.string().nullable().optional(),
  name: z.string().min(1),               // never renamed on import; admin override only
  description: z.string(),
  currency: z.literal('NGN'),
  price: z.number().nonnegative(),       // current selling price
  compareAtPrice: z.number().nonnegative().nullable(), // struck-through price when on sale
  discountPercent: z.number().int().min(0).max(100),
  images: z.array(ImageSchema).min(1),
  variants: z.array(VariantSchema),
  sizes: z.array(z.string()),
  category: z.string(),                  // primary category slug (one of catlogCategories)
  categorySource: z.string(),            // 'catlog' | 'mapped-from-photo (client to confirm)'
  categories: z.array(z.string()),
  catlogTags: z.array(z.string()),
  catlogPrimaryCategoryId: z.string().nullable(),
  collections: z.array(z.string()),
  colourHints: z.array(z.string()),
  available: z.boolean(),
  featured: z.boolean(),
  limited: z.boolean(),
  lowStock: z.boolean(),
  totalOrders: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  catlogUrl: z.string().url(),
});

export const CatalogSchema = z.object({
  source: z.string(),
  storeId: z.string(),
  syncedAt: z.string(),
  store: z.object({
    name: z.string(), description: z.string(), logo: z.string().url(), heroImage: z.string().url(),
    phone: z.string(), whatsapp: z.string(), instagram: z.string(), currency: z.literal('NGN'),
    tagline: z.string(), deliveryTimeline: z.string(), deliveryLocations: z.string(), refundPolicy: z.string(),
    paymentOptions: z.array(z.string()), deliveryAreas: z.array(z.string()), itemCount: z.number(),
  }),
  catlogCategories: z.array(CategoryRefSchema),
  collections: z.array(z.object({ slug: z.string(), name: z.string() })),
  colours: z.array(z.object({ slug: z.string(), name: z.string(), hex: z.string() })),
  products: z.array(ProductSchema),
});

/** Admin overrides — stored in DB (ProductOverride), merged on read, never touched by sync. */
export const ProductOverrideSchema = z.object({
  productId: z.string(),
  name: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  compareAtPrice: z.number().nonnegative().nullable().optional(),
  category: z.string().optional(),
  collections: z.array(z.string()).optional(),
  colourHints: z.array(z.string()).optional(),
  badge: z.enum(['new', 'sale', 'limited', 'restock', 'none']).optional(),
  featured: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
export type Catalog = z.infer<typeof CatalogSchema>;
export type ProductOverride = z.infer<typeof ProductOverrideSchema>;

/** CSV/JSON fallback import row (if the Catlog API ever becomes unreadable). */
export const ImportRowSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  sale_price: z.coerce.number().nonnegative().optional(),
  description: z.string().default(''),
  category: z.string().default(''),
  sizes: z.string().default(''),          // "S|M|L|XL"
  images: z.string().min(1),              // "url1|url2"
  available: z.coerce.boolean().default(true),
  catlog_url: z.string().url().optional(),
});
