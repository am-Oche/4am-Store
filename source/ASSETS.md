# Assets table

147 product images + 3 brand files. All of them are the client's own Catlog uploads, with status **client-owned, verify**. Images were re-encoded to WebP at 800px wide for the prototype. In production, next/image serves AVIF/WebP from the originals.

Every Catlog original is at least 1080px wide (most are 1080–1440px), so none needs replacing for size. They are compressed Instagram-style JPEGs, though, so ask the client for uncompressed originals of the hero and collection-tile images.

The full per-file table (source URL, dimensions, status) is in `lib/assets.ts`.
