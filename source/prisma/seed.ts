/** npm run db:seed — loads data/catalog.json into a CatalogSnapshot and seeds default site settings. */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs/promises';
import { CatalogSchema } from '../lib/catalog/schema';
import { announcements, trending } from '../config/navigation';
import { site } from '../config/site';

const prisma = new PrismaClient();
const cat = CatalogSchema.parse(JSON.parse(await fs.readFile('data/catalog.json', 'utf8')));
await prisma.catalogSnapshot.create({ data: { source: cat.source, json: JSON.stringify(cat) } });
for (const [key, json] of Object.entries({ announcements, trending, flashSale: site.flashSale, express: site.express })) {
  await prisma.siteSetting.upsert({ where: { key }, create: { key, json: JSON.stringify(json) }, update: {} });
}
console.log(`✔ seeded ${cat.products.length} products and ${4} settings`);
await prisma.$disconnect();
