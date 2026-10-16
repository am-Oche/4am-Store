import fs from 'node:fs/promises';
import path from 'node:path';
import { CatalogSchema, type Catalog } from './schema';
import type { CatalogProvider } from './provider';

export class JsonProvider implements CatalogProvider {
  readonly name = 'json' as const;
  constructor(private file = path.join(process.cwd(), 'data/catalog.json')) {}
  async load(): Promise<Catalog> {
    const raw = JSON.parse(await fs.readFile(this.file, 'utf8'));
    return CatalogSchema.parse(raw); // throws with a readable path if Catlog changes shape
  }
}
