/** Collections and colours are inferred from product names (Catlog has no collection or colour fields).
 *  Edit the regexes here, or override per product in /admin. */
export const collections = [
  { slug: 'astro', name: 'Astro', match: /astro/ },
  { slug: 'dnx', name: 'DNX', match: /dnx/ },
  { slug: 'legacy', name: 'Legacy', match: /legacy/ },
  { slug: 'signature', name: 'Signature', match: /signature/ },
  { slug: 'wavy', name: 'Wavy', match: /wav/ },
  { slug: 'gseries', name: 'G-Series', match: /gseries/ },
  { slug: '4amwrld', name: '4AMWRLD', match: /4amwrld/ },
  { slug: 'rckstr', name: 'Rckstr', match: /rc?kstr|rcstr/ },
  { slug: 'gritty-motion', name: 'Gritty Motion', match: /gritty/ },
  { slug: 'paradise', name: 'Paradise', match: /paradise/ },
  { slug: 'elys', name: 'ELYS', match: /elys/ },
  { slug: 'infinity', name: 'Infinity', match: /infinity/ },
  { slug: 'stone-wash', name: 'Stone Wash', match: /stone.?wash/ },
  { slug: 'graffiti', name: 'Graffiti', match: /graffiti/ },
  { slug: 'gothic', name: 'Gothic', match: /gothic/ },
  { slug: 'urban', name: 'Urban', match: /urban/ },
];

export const colours = [
  { slug: 'black', name: 'Black', hex: '#111111' }, { slug: 'white', name: 'White', hex: '#F4F4F2' },
  { slug: 'navy', name: 'Navy', hex: '#1E2A4A' }, { slug: 'grey', name: 'Grey', hex: '#8A8A8A' },
  { slug: 'ash', name: 'Ash', hex: '#B9B6AF' }, { slug: 'pink', name: 'Pink', hex: '#E8A6C0' },
  { slug: 'red', name: 'Red', hex: '#B3262B' }, { slug: 'green', name: 'Green', hex: '#2F5D3A' },
  { slug: 'blue', name: 'Blue', hex: '#2F5FA8' },
];

/** Home merchandising. Image keys refer to /public/products/<key>.webp (client's own photos). */
export const home = {
  heroImages: ['79a4qjvxbj', 'ewwrlar833', 'jy3s5ufyui'],
  collectionCovers: { signature: 'exfk8hdj4j', wavy: '1exmzw4jez', 'stone-wash': 'k5j42sbt3i', astro: 'hsxia3zei7', legacy: 'da7a7bq17k', dnx: 'jy3s5ufyui' } as Record<string, string>,
  communityImages: ['da7a7bq17k', 'fa7k7b68ii', '6fe3hrxehp', '1exmzw4jez'],
};
