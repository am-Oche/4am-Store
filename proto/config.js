/* 4AM Originals — site config (mirrors source/config/*.ts).
   Everything marked "client to confirm" is listed in CLIENT-CHECKLIST.md */
window.SITE = {
  name: '4AM Originals',
  legalName: '4am originals',
  tagline: 'Premium apparels',
  motto: 'Wavy every season, never basic', // from the client's Catlog storefront message
  catlogStoreUrl: 'https://4am.catlog.shop',
  instagram: '4am_originals',
  whatsapp: '+2348069784406', // Catlog WhatsApp checkout channel — client to confirm
  phoneDisplay: '+234 806 978 4406',
  email: null, // client to supply
  location: 'Lagos, Nigeria · Island / Mainland',

  // native | catlog-redirect | whatsapp
  checkout: { mode: 'native', bankTransfer: true },
  payments: { paystack: true, flutterwave: false, stripe: false, bankTransfer: true, whatsapp: true },

  currency: { default: 'NGN', options: ['NGN', 'USD'], usdRate: 1550 /* NGN per USD — client to confirm */ },

  announcements: [
    { text: 'Lagos delivery within 24 hours · Nationwide & international shipping', href: '/shipping' },
    { text: 'Order on WhatsApp — tap to chat with the 4AM team', href: 'whatsapp' },
    { text: 'Need help with sizing or orders? Visit the Help Centre', href: '/help' },
  ],

  trending: ['Tracksuits', 'Signature', 'Stone Wash', 'Wavy', 'Astro', 'Legacy', 'DNX', 'Rckstr', 'Hoodie set', 'Flare pants', 'Longsleeves', '4AMWRLD'],

  heroImages: ['79a4qjvxbj', 'ewwrlar833', 'jy3s5ufyui'],
  communityImages: ['da7a7bq17k', 'fa7k7b68ii', '6fe3hrxehp', '1exmzw4jez'],

  flashSale: { enabled: true, title: 'Flash Sale', endsAt: '2026-10-31T23:59:00+01:00' /* client to confirm */ },

  express: {
    title: 'Express Delivery',
    line: 'Lagos orders delivered within 24 hours.', // Catlog delivery_timeline: "24 hour(s)"
    sub: 'Island, Mainland, Lekki, Ajah, Ikorodu & more. Nationwide and international shipping available.',
  },

  newArrivalDays: 45,
  showEmptyCategories: false,

  // Generic oversized-fit guide. Client to confirm real measurements.
  sizeGuide: {
    cm: { S: [104, 70], M: [110, 72], L: [116, 74], XL: [122, 76], '2XL': [128, 78], '3XL': [134, 80], '4XL': [140, 82], '5XL': [146, 84] },
  },
  care: 'Wash inside out on cold. Do not tumble dry. Iron on reverse, avoid prints and embroidery.', // client to confirm
};
