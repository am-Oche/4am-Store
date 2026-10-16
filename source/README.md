# 4AM Originals — storefront

Next.js App Router · TypeScript · Tailwind · Framer Motion · Lenis · Embla · Zustand · RHF + Zod · Prisma (SQLite → MySQL) · NextAuth · MDX.

**Phase 1 status:** the catalog import, tokens, Tabs, nav config, header/mega-menu and Home are done. The clickable reference build is `4AM Originals.html` at the project root, and it uses the same data and config. Listing, PDP, cart and checkout already work in that build too, as a preview of P2.

## Quick start
```bash
cp .env.example .env
npm i
npm run db:push && npm run db:seed
npm run dev
```

## Catalog
- **Source of truth:** the client's Catlog store `4am.catlog.shop` (store id `61886298e331805dca8216e4`).
- **Imported:** 96 / 96 products and 147 images. The full list is in `PRODUCTS.md`; please verify it.
- `data/catalog.json` is validated by `lib/catalog/schema.ts` (Zod) on every load and every sync.
- **Providers** (`lib/catalog/providers.ts`), selected with `CATALOG_PROVIDER`:
  - `json` (default): reads `data/catalog.json`.
  - `catlog`: live read of the public store with ISR (`CATLOG_REVALIDATE` seconds). Images come from Catlog S3.
  - `db`: latest `CatalogSnapshot` in Prisma.
- **Re-sync:** `npm run sync:catlog` (add `--dry` to only print the diff). It downloads new images into `public/products`, rewrites `data/catalog.json` and prints added, removed and price-changed products. It is also exposed as a button in `/admin` (P3).
- **Fallback:** if Catlog's markup or API ever changes, export the products and run `npm run import:file -- export.csv`. The column spec is `ImportRowSchema`.
- **Admin overrides** (title, price, category, badge, featured, hidden, collections, colours) are stored in `ProductOverride` and merged over provider data on every read, so a re-sync never loses them.
- **Category mapping:** Catlog tags only 15 products. The other 81 are mapped from their photos in `data/category-map.json` and marked `categorySource: "mapped-from-photo"`. Tagging them in Catlog is the cleanest fix.
- **Collections and colours** are inferred from product names (`config/merchandising.ts`), because Catlog has no fields for them.

## Checkout modes
`CHECKOUT_MODE` (or `site.checkout.mode`):
| mode | "Add to bag" does |
|---|---|
| `native` (default) | Cart drawer → `/checkout` (Delivery → Payment → Review). Paystack, Flutterwave and Stripe adapters use a **mock** until keys are set. Bank transfer and WhatsApp confirmation are always offered. |
| `catlog-redirect` | Opens the product's own Catlog page (`product.catlogUrl`), so the client keeps the current flow. |
| `whatsapp` | Opens WhatsApp with a pre-filled order: product, size, qty, price and link. |

Every PDP and the cart drawer also show **Order on WhatsApp**, whatever the mode.

## Editing navigation, tabs and content
- **Nav:** `config/navigation.ts → buildNavigation()`. It is generated from real categories, and empty ones are hidden unless `site.showEmptyCategories = true`. Display labels are in `categoryLabels`.
- **Announcements and trending terms:** `config/navigation.ts`, editable in `/admin` (stored in `SiteSetting`).
- **Tabs:** every switch uses `components/ui/Tabs.tsx`. Pass `items` from config or the catalog, and use `urlKey="tab"` for `?tab=` sync.
- **Home imagery:** `config/merchandising.ts → home` (keys = image file names).
- **Colours / accent:** `styles/tokens.css` + `site.theme.accent`.

## Assets
Images are the client's own Catlog uploads, re-hosted under `/public/products` and served through `next/image` (AVIF/WebP, 4:5 `object-cover` on a neutral `surface` backdrop, blur placeholder). Products with one image use a subtle zoom on hover instead of an image swap. Per-file source URLs and the "client-owned, verify" status are in `lib/assets.ts` (generated). See `ASSETS.md`.

## Not copied from the reference
No Hype DC name, logo, copy, photos or third-party brand marks are used. Sections were renamed: "Hyperdrive" → **Express Delivery**, "Hype World" → **4AM Community**, "Shop by Brand" → **Shop by Collection**.
