import { prisma } from '@/lib/db';
import { OverrideSchema, type ProductOverride } from './schema';

/** Admin edits live in their own table keyed by Catlog product id, so `sync:catlog` never overwrites them. */
export async function getOverrides(): Promise<ProductOverride[]> {
  try {
    const rows = await prisma.productOverride.findMany();
    return rows.map(r => OverrideSchema.parse({ ...r, collections: r.collections ? JSON.parse(r.collections) : undefined }));
  } catch {
    return []; // DB not provisioned yet — storefront still works from JSON
  }
}

export async function saveOverride(o: ProductOverride) {
  const v = OverrideSchema.parse(o);
  const data = { ...v, collections: v.collections ? JSON.stringify(v.collections) : null };
  return prisma.productOverride.upsert({ where: { productId: v.productId }, create: data, update: data });
}
