/* app shell: routing, page transitions, smooth scroll, tweaks */

const TWEAK_DEFAULTS = window.__TWEAKS__;

function Router() {
  const { catalog } = useStore();
  const { path } = useRoute();
  const parts = path.split('/').filter(Boolean);
  useEffect(() => { if (!path.startsWith('/product/')) { document.title = '4AM Originals — Premium apparels'; } }, [path]);
  const P = catalog.products;
  if (path === '/') return <HomePage />;
  if (path === '/shop') return <ListingPage title="Shop all" base={P} tabs={<CategoryChips />} />;
  if (parts[0] === 'shop' && parts[1]) {
    const c = catalog.categories.find(x => x.slug === parts[1]);
    if (!c) return <NotFound />;
    return <ListingPage key={c.slug} title={c.label} base={P.filter(p => p.categories.includes(c.slug))} crumbs={[{ to: '/shop', label: 'Shop' }]} hideCat tabs={<CategoryChips current={c.slug} />} />;
  }
  if (path === '/new-arrivals') return <ListingPage title="New Arrivals" base={P.filter(p => p.isNew)} intro={`Dropped in the last ${window.SITE.newArrivalDays} days.`} />;
  if (path === '/best-sellers') return <ListingPage title="Best Sellers" base={[...P].filter(p => p.totalOrders > 0)} intro="Ranked by real orders on the 4AM store." />;
  if (path === '/sale') { const s = P.filter(p => p.onSale); return s.length ? <ListingPage title="Sale" base={s} /> : <NotFound />; }
  if (path === '/collections') return <CollectionsIndex />;
  if (parts[0] === 'collections' && parts[1]) {
    const c = catalog.collections.find(x => x.slug === parts[1]);
    if (!c) return <NotFound />;
    return <ListingPage key={c.slug} title={c.name + ' Collection'} base={P.filter(p => p.collections.includes(c.slug))} crumbs={[{ to: '/collections', label: 'Collections' }]} />;
  }
  if (parts[0] === 'product' && parts[1]) return <ProductPage slug={parts[1]} />;
  if (path === '/search') return <SearchPage />;
  if (path === '/wishlist') return <WishlistPage />;
  if (path === '/cart') return <CartPage />;
  if (path === '/checkout') return <CheckoutPage />;
  if (path === '/checkout/success') return <SuccessPage />;
  if (path === '/track-order') return <TrackPage />;
  if (path === '/size-guide') return <SizeGuidePage />;
  if (INFO[path]) return <InfoPage path={path} />;
  return <NotFound />;
}

function PageTransition({ children }) {
  const { path } = useRoute();
  const [k, setK] = useState(path);
  useEffect(() => {
    if (path !== k) {
      setK(path);
      if (!path.startsWith('/product/')) scrollTo({ top: 0 });
    }
  }, [path]);
  return <main id="main" key={k} className="page-in">{children}</main>;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const store = useStore();
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', t.accent);
    r.dataset.theme = t.dark ? 'dark' : 'light';
    window.SITE.checkout.mode = t.checkoutMode;
  }, [t]);
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <AnnouncementBar />
      <Header />
      <TrendingTicker />
      <PageTransition><Router /></PageTransition>
      <Newsletter />
      <Footer />
      <CartDrawer />
      <Toast />
      <TweaksPanel>
        <TweakSection label="Brand">
          <TweakColor label="Accent" value={t.accent} options={['#C8382A', '#E0452B', '#1F4FD8', '#111111']} onChange={v => setTweak('accent', v)} />
          <TweakToggle label="Dark mode" value={t.dark} onChange={v => setTweak('dark', v)} />
        </TweakSection>
        <TweakSection label="Commerce">
          <TweakRadio label="Checkout mode" value={t.checkoutMode} options={['native', 'catlog-redirect', 'whatsapp']} onChange={v => setTweak('checkoutMode', v)} />
          <TweakRadio label="Currency" value={store.currency} options={['NGN', 'USD']} onChange={v => store.setCurrency(v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

(async function boot() {
  const raw = await fetch('data/catalog.json').then(r => r.json());
  window.CATALOG_RAW = raw;
  const catalog = enrichCatalog(raw);
  ReactDOM.createRoot(document.getElementById('root')).render(<StoreProvider catalog={catalog}><App /></StoreProvider>);
})();
