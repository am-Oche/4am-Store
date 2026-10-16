import type { Catalog } from '@/lib/catalog/schema';
import { site } from './site';

/** Nav labels for Catlog categories (Catlog names stay untouched in data; these are display labels). */
export const categoryLabels: Record<string, string> = {
  't-shirts': 'Tees & Tops',
  'tracksuits-and-two-piece-designs': 'Tracksuits & Sets',
};

export const priceBands = [
  { label: 'Under ₦45,000', min: undefined, max: 45000 },
  { label: '₦45,000 – ₦80,000', min: 45000, max: 80000 },
  { label: '₦80,000 and above', min: 80000, max: undefined },
];

export type NavItem = { label: string; href: string; mega?: 'category' | 'collections' | 'featured'; category?: string; accent?: boolean };

/** Built from the real catalog, so empty categories never appear (unless site.showEmptyCategories). */
export function buildNavigation(cat: Catalog): NavItem[] {
  const counts = new Map<string, number>();
  cat.products.forEach(p => p.categories.forEach(c => counts.set(c, (counts.get(c) ?? 0) + 1)));
  const cats = cat.catlogCategories
    .filter(c => site.showEmptyCategories || (counts.get(c.slug) ?? 0) > 0)
    .sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0));
  return [
    { label: 'New Arrivals', href: '/new-arrivals', mega: 'featured' },
    ...cats.map(c => ({ label: categoryLabels[c.slug] ?? c.name, href: `/shop/${c.slug}`, mega: 'category' as const, category: c.slug })),
    { label: 'Collections', href: '/collections', mega: 'collections' },
    { label: 'Best Sellers', href: '/best-sellers' },
    ...(cat.products.some(p => p.compareAtPrice) ? [{ label: 'Sale', href: '/sale', accent: true }] : []),
  ];
}

export const announcements = [
  { text: 'Lagos delivery within 24 hours · Nationwide & international shipping', href: '/shipping' },
  { text: 'Order on WhatsApp — tap to chat with the 4AM team', href: 'whatsapp' },
  { text: 'Need help with sizing or orders? Visit the Help Centre', href: '/help' },
];

export const trending = ['Tracksuits', 'Signature', 'Stone Wash', 'Wavy', 'Astro', 'Legacy', 'DNX', 'Rckstr', 'Hoodie set', 'Flare pants', 'Longsleeves', '4AMWRLD'];

export const footer = {
  customerService: [['Help Centre', '/help'], ['Track order', '/track-order'], ['Shipping & delivery', '/shipping'], ['Returns', '/returns'], ['Size guide', '/size-guide'], ['Contact us', '/contact']],
  about: [['Our story', '/about'], ['4AM Community', '/community'], ['Journal', '/blog'], ['Pickup & contact', '/stores']],
  useful: [['New Arrivals', '/new-arrivals'], ['Best Sellers', '/best-sellers'], ['Gift cards', '/gift-cards']],
  legal: [['Terms', '/legal/terms'], ['Privacy', '/legal/privacy'], ['Cookies', '/legal/cookies']],
} as const;
