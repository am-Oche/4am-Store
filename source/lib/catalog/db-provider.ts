import { prisma } from '@/lib/db';
import { CatalogSchema, type Catalog } from './schema';
import type { CatalogProvider } from './provider';

/** Reads the last synced snapshot from the database (CatalogSnapshot table). */
export class DbProvider implements CatalogProvider {
  readonly name = 'db' as const;
  async load(): Promise<Catalog> {
    const snap = await prisma.catalogSnapshot.findFirst({ orderBy: { syncedAt: 'desc' } });
    if (!snap) throw new Error('No catalog snapshot in DB — run `npm run sync:catlog -- --to=db`');
    return CatalogSchema.parse(JSON.parse(snap.json));
  }
}
