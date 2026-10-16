/* header: announcement bar, sticky header, live search, nav + mega menu, trending ticker, mobile drawer */

const PRICE_BANDS = [
  { label: 'Under ₦45,000', q: 'max=45000' },
  { label: '₦45,000 – ₦80,000', q: 'min=45000&max=80000' },
  { label: '₦80,000 and above', q: 'min=80000' },
];

function buildNav(catalog) {
  // mirrors source/config/navigation.ts — built from real categories
  const cats = catalog.categories;
  const catItem = c => ({ label: c.label, to: `/shop/${c.slug}`, mega: true, cat: c.slug });
  return [
    { label: 'New Arrivals', to: '/new-arrivals', mega: true },
    ...cats.map(catItem),
    { label: 'Collections', to: '/collections', mega: true, kind: 'collections' },
    { label: 'Best Sellers', to: '/best-sellers' },
    { label: 'Sale', to: '/sale', accent: true, hide: !catalog.products.some(p => p.onSale) },
  ].filter(n => !n.hide);
}

function AnnouncementBar() {
  const items = window.SITE.announcements;
  const [i, setI] = useState(0);
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('4am:ann') === '0');
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused) return; const t = setInterval(() => setI(x => (x + 1) % items.length), 4500); return () => clearInterval(t); }, [paused, items.length]);
  if (hidden) return null;
  return (
    <div className="ann" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <button className="ann__nav" aria-label="Previous message" onClick={() => setI((i - 1 + items.length) % items.length)}><Icon name="chevL" size={16} /></button>
      <div className="ann__viewport" aria-live="polite">
        {items.map((a, k) => (
          <Link key={k} to={a.href} className={`ann__msg ${k === i ? 'is-on' : ''}`} aria-hidden={k !== i} tabIndex={k === i ? 0 : -1}>{a.text}</Link>
        ))}
      </div>
      <button className="ann__nav" aria-label="Next message" onClick={() => setI((i + 1) % items.length)}><Icon name="chevR" size={16} /></button>
      <button className="ann__close" aria-label="Dismiss announcements" onClick={() => { sessionStorage.setItem('4am:ann', '0'); setHidden(true); }}><Icon name="x" size={14} /></button>
    </div>
  );
}

function Logo({ className = '' }) {
  return (
    <Link to="/" className={`logo ${className}`} aria-label="4AM Originals — home">
      <img src="assets/brand/logo-sticker.png" alt="4am" />
    </Link>
  );
}

function searchProducts(products, q) {
  const t = q.trim().toLowerCase(); if (!t) return [];
  const words = t.split(/\s+/);
  return products
    .map(p => {
      const hay = (p.name + ' ' + p.description + ' ' + p.categories.join(' ') + ' ' + p.collections.join(' ')).toLowerCase();
      let s = 0; words.forEach(w => { if (p.name.toLowerCase().includes(w)) s += 3; else if (hay.includes(w)) s += 1; else s -= 10; });
      return { p, s };
    })
    .filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.p);
}

function SearchBox({ onDone, autoFocus }) {
  const { catalog, price } = useStore();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const res = useMemo(() => searchProducts(catalog.products, q).slice(0, 6), [q]);
  const terms = window.SITE.trending.filter(t => !q || t.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
  const submit = e => { e && e.preventDefault(); if (!q.trim()) return; go('/search?q=' + encodeURIComponent(q.trim())); setOpen(false); onDone && onDone(); };
  const onKey = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(res.length - 1, h + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(-1, h - 1)); }
    if (e.key === 'Enter' && hi > -1) { e.preventDefault(); go('/product/' + res[hi].slug); setOpen(false); onDone && onDone(); }
    if (e.key === 'Escape') setOpen(false);
  };
  return (
    <form className={`search ${open ? 'is-open' : ''}`} onSubmit={submit} role="search" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <Icon name="search" size={19} className="search__ic" />
      <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); setHi(-1); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
        placeholder="Search tracksuits, tees, collections…" aria-label="Search products" autoFocus={autoFocus}
        role="combobox" aria-expanded={open} aria-controls="search-pop" autoComplete="off" />
      {q && <button type="button" className="search__clear" onClick={() => setQ('')} aria-label="Clear"><Icon name="x" size={14} /></button>}
      {open && (
        <div className="search__pop" id="search-pop" role="listbox">
          <div className="search__terms">
            <div className="eyebrow">{q ? 'Suggestions' : 'Trending searches'}</div>
            {terms.map(t => <button type="button" key={t} className="search__term" onMouseDown={e => e.preventDefault()} onClick={() => { go('/search?q=' + encodeURIComponent(t)); setOpen(false); onDone && onDone(); }}><Icon name="search" size={14} /> {t}</button>)}
          </div>
          {q && (
            <div className="search__res">
              <div className="eyebrow">{res.length ? 'Products' : 'No products match “' + q + '”'}</div>
              {res.map((p, k) => (
                <Link key={p.id} to={'/product/' + p.slug} className={`search__item ${k === hi ? 'is-hi' : ''}`} onClick={() => { setOpen(false); onDone && onDone(); }}>
                  <Img src={p.images[0].src} alt="" />
                  <span><b>{p.name}</b><em>{price(p.price)}</em></span>
                </Link>
              ))}
              {res.length > 0 && <button className="btn btn--line btn--sm" type="submit">View all results</button>}
            </div>
          )}
        </div>
      )}
    </form>
  );
}

function MegaMenu({ item, catalog, onClose }) {
  const { price } = useStore();
  const pool = item.cat ? catalog.products.filter(p => p.categories.includes(item.cat)) : catalog.products;
  const promo = [...pool].sort((a, b) => b.totalOrders - a.totalOrders)[0];
  const base = item.cat ? `/shop/${item.cat}` : '/shop';
  return (
    <div className="mega" onMouseLeave={onClose}>
      <div className="mega__inner wrap">
        <div className="mega__col">
          <div className="mega__h">Shop by category</div>
          <Link to="/shop" onClick={onClose}>Shop all <span className="mega__n">{catalog.products.length}</span></Link>
          {catalog.categories.map(c => <Link key={c.slug} to={`/shop/${c.slug}`} onClick={onClose} className={c.slug === item.cat ? 'is-cur' : ''}>{c.label} <span className="mega__n">{c.count}</span></Link>)}
        </div>
        <div className="mega__col">
          <div className="mega__h">Shop by collection</div>
          {catalog.collections.slice(0, 10).map(c => <Link key={c.slug} to={`/collections/${c.slug}`} onClick={onClose}>{c.name}</Link>)}
          <Link to="/collections" onClick={onClose} className="mega__all">All collections <Icon name="arrow" size={14} /></Link>
        </div>
        <div className="mega__col">
          <div className="mega__h">Featured</div>
          <Link to="/new-arrivals" onClick={onClose}>New Arrivals</Link>
          <Link to="/best-sellers" onClick={onClose}>Best Sellers</Link>
          {catalog.products.some(p => p.onSale) && <Link to="/sale" onClick={onClose} className="accent">Sale</Link>}
          <Link to="/gift-cards" onClick={onClose}>Gift Cards</Link>
          <div className="mega__h" style={{ marginTop: 24 }}>Shop by price</div>
          {PRICE_BANDS.map(b => <Link key={b.q} to={`${base}?${b.q}`} onClick={onClose}>{b.label}</Link>)}
        </div>
        {promo && (
          <Link to={'/product/' + promo.slug} className="mega__promo" onClick={onClose}>
            <Img src={promo.images[0].src} alt={promo.name} />
            <span className="mega__promoTxt"><span className="eyebrow">Most ordered</span><b>{promo.name}</b><em>{price(promo.price)}</em></span>
          </Link>
        )}
      </div>
    </div>
  );
}

function Header() {
  const store = useStore();
  const { catalog, wish } = store;
  const { count } = cartTotals(store);
  const nav = useMemo(() => buildNav(catalog), [catalog]);
  const [mega, setMega] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [searchM, setSearchM] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const route = useRoute();
  const timer = useRef();
  useEffect(() => {
    let last = 0;
    const f = () => { const y = scrollY; setCondensed(y > 120 && y > last - 2); last = y; };
    addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f);
  }, []);
  useEffect(() => { setMega(null); setDrawer(false); setSearchM(false); }, [route.path]);
  const hdrRef = useRef();
  useEffect(() => {
    const el = hdrRef.current;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--hdr-h', el.offsetHeight + 'px'));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const enter = n => { clearTimeout(timer.current); timer.current = setTimeout(() => setMega(n.mega ? n : null), 90); };
  const leave = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setMega(null), 160); };

  return (
    <>
      <header ref={hdrRef} className={`hdr ${condensed ? 'is-condensed' : ''}`} onMouseLeave={leave}>
        <div className="hdr__main wrap">
          <button className="hdr__icon hdr__burger" aria-label="Open menu" onClick={() => setDrawer(true)}><Icon name="menu" /></button>
          <Logo />
          <div className="hdr__search"><SearchBox /></div>
          <div className="hdr__actions">
            <button className="hdr__icon hdr__searchBtn" aria-label="Search" onClick={() => setSearchM(true)}><Icon name="search" /></button>
            <Link to="/account" className="hdr__icon" aria-label="Account"><Icon name="user" /><span className="hdr__lbl">Account</span></Link>
            <Link to="/wishlist" className="hdr__icon" aria-label={`Wishlist, ${wish.length} items`}><Icon name="heart" />{wish.length > 0 && <span className="dot">{wish.length}</span>}<span className="hdr__lbl">Wishlist</span></Link>
            <button className="hdr__icon" aria-label={`Bag, ${count} items`} onClick={() => store.setCartOpen(true)}><Icon name="bag" />{count > 0 && <span className="dot dot--ink">{count}</span>}<span className="hdr__lbl">Bag</span></button>
          </div>
        </div>
        <nav className="hdr__nav" aria-label="Main">
          <ul className="wrap">
            {nav.map(n => (
              <li key={n.to} onMouseEnter={() => enter(n)}>
                <Link to={n.to} className={`hdr__link ${n.accent ? 'accent' : ''} ${mega && mega.to === n.to ? 'is-open' : ''} ${route.path === n.to ? 'is-cur' : ''}`}
                  aria-haspopup={n.mega ? 'true' : undefined} aria-expanded={n.mega ? !!(mega && mega.to === n.to) : undefined}
                  onFocus={() => n.mega && setMega(n)}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={`mega-wrap ${mega ? 'is-on' : ''}`} onMouseEnter={() => clearTimeout(timer.current)}>
          {mega && <MegaMenu key={mega.to} item={mega} catalog={catalog} onClose={() => setMega(null)} />}
        </div>
      </header>
      <div className={`scrim ${mega ? 'is-on' : ''}`} onClick={() => setMega(null)} />
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} nav={nav} />
      {searchM && (
        <div className="msearch" role="dialog" aria-label="Search">
          <div className="msearch__bar"><SearchBox autoFocus onDone={() => setSearchM(false)} /><button className="hdr__icon" onClick={() => setSearchM(false)} aria-label="Close search"><Icon name="x" /></button></div>
        </div>
      )}
    </>
  );
}

function MobileDrawer({ open, onClose, nav }) {
  const { catalog } = useStore();
  const [acc, setAcc] = useState(null);
  return (
    <>
      <div className={`scrim scrim--top ${open ? 'is-on' : ''}`} onClick={onClose} />
      <aside className={`drawer drawer--left ${open ? 'is-on' : ''}`} aria-hidden={!open} aria-label="Menu">
        <div className="drawer__head"><Logo /><button className="hdr__icon" onClick={onClose} aria-label="Close menu"><Icon name="x" /></button></div>
        <div className="drawer__body">
          {nav.map(n => n.mega ? (
            <div key={n.to} className={`acc ${acc === n.to ? 'is-open' : ''}`}>
              <button className="acc__btn" aria-expanded={acc === n.to} onClick={() => setAcc(acc === n.to ? null : n.to)}>{n.label}<Icon name="chevD" size={18} /></button>
              <div className="acc__panel"><div>
                <Link to={n.to}>Shop all {n.label}</Link>
                {n.kind === 'collections'
                  ? catalog.collections.map(c => <Link key={c.slug} to={`/collections/${c.slug}`}>{c.name}</Link>)
                  : PRICE_BANDS.map(b => <Link key={b.q} to={`${n.to === '/new-arrivals' ? '/shop' : n.to}?${b.q}`}>{b.label}</Link>)}
              </div></div>
            </div>
          ) : <Link key={n.to} to={n.to} className={`acc__btn ${n.accent ? 'accent' : ''}`}>{n.label}</Link>)}
          <div className="drawer__links">
            <Link to="/account">Account</Link><Link to="/wishlist">Wishlist</Link><Link to="/track-order">Track order</Link><Link to="/help">Help Centre</Link><Link to="whatsapp">Order on WhatsApp</Link>
          </div>
        </div>
      </aside>
    </>
  );
}

function TrendingTicker() {
  const t = window.SITE.trending;
  const row = [...t, ...t];
  return (
    <div className="ticker" aria-label="Trending searches">
      <span className="ticker__lbl"><Icon name="bolt" size={14} fill="currentColor" stroke={0} /> Trending</span>
      <div className="ticker__view">
        <div className="ticker__row">
          {row.map((x, i) => <Link key={i} to={'/search?q=' + encodeURIComponent(x)} tabIndex={i >= t.length ? -1 : 0} aria-hidden={i >= t.length}>{x}</Link>)}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Header, AnnouncementBar, TrendingTicker, Logo, searchProducts, PRICE_BANDS, buildNav });
