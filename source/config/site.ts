/** Site config. Values marked CONFIRM are in CLIENT-CHECKLIST.md. Contact values come from the client's Catlog store. */
export const site = {
  name: '4AM Originals',
  tagline: 'Premium apparels',
  motto: 'Wavy every season, never basic',          // Catlog storefront custom_message
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://4amoriginals.com', // CONFIRM domain
  catlogStoreUrl: 'https://4am.catlog.shop',
  contact: {
    whatsapp: '+2348069784406',                     // CONFIRM (Catlog WhatsApp checkout channel "Main")
    phone: '+234 806 978 4406',                     // CONFIRM
    email: null as string | null,                   // CONFIRM — client to supply
    instagram: '4am_originals',                     // CONFIRM
    location: 'Lagos, Nigeria · Island / Mainland', // CONFIRM pickup address
  },
  checkout: {
    mode: (process.env.CHECKOUT_MODE ?? 'native') as 'native' | 'catlog-redirect' | 'whatsapp',
    bankTransfer: true,
  },
  payments: {               // footer shows marks for enabled methods only
    paystack: true,         // enabled on the client's Catlog (PAYSTACK)
    flutterwave: false,
    stripe: false,
    bankTransfer: true,     // enabled on Catlog (TRANSFER)
    whatsapp: true,
  },
  currency: { default: 'NGN' as const, options: ['NGN', 'USD'] as const, usdRate: Number(process.env.USD_RATE ?? 1550) }, // CONFIRM rate source
  newArrivalDays: 45,
  showEmptyCategories: false,
  flashSale: { enabled: true, title: 'Flash Sale', endsAt: '2026-10-31T23:59:00+01:00' }, // CONFIRM
  express: { title: 'Express Delivery', line: 'Lagos orders delivered within 24 hours.', sub: 'Island, Mainland, Lekki, Ajah, Ikorodu & more.' }, // CONFIRM terms
  theme: { accent: '#C8382A', ink: '#0B0B0B', paper: '#FFFFFF', surface: '#F2F2F0', darkMode: 'optional' as const },
};
export type Site = typeof site;
