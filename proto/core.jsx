/* core: data, store, router, formatting, icons, Tabs, Rail, Img, Reveal */
const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, createContext, useContext } = React;

/* ---------------- data ---------------- */
const SYNC_DATE = new Date('2026-10-14T23:00:00Z');
function enrichCatalog(raw) {
  const S = window.SITE;
  const catCount = {};
  raw.products.forEach(p => p.categories.forEach(c => (catCount[c] = (catCount[c] || 0) + 1)));
  const NAV_LABEL = { 't-shirts': 'Tees & Tops', 'tracksuits-and-two-piece-designs': 'Tracksuits & Sets', 'gown-dresses': 'Gown Dresses' };
  const categories = raw.catlogCategories
    .map(c => ({ ...c, label: NAV_LABEL[c.slug] || c.name, count: catCount[c.slug] || 0 }))
    .filter(c => S.showEmptyCategories || c.count > 0)
    .sort((a, b) => b.count - a.count);
  const collCount = {};
  raw.products.forEach(p => p.collections.forEach(c => (collCount[c] = (collCount[c] || 0) + 1)));
  const collections = raw.collections.map(c => ({ ...c, count: collCount[c.slug] || 0 })).filter(c => c.count > 0);
  const colourMap = Object.fromEntries(raw.colours.map(c => [c.slug, c]));
  const products = raw.products.map((p, i) => {
    const ageDays = (SYNC_DATE - new Date(p.createdAt)) / 864e5;
    const isNew = ageDays <= S.newArrivalDays;
    const onSale = !!p.compareAtPrice;
    let badge = null;
    if (onSale) badge = { kind: 'sale', text: `-${p.discountPercent}%` };
    else if (isNew) badge = { kind: 'new', text: 'New Arrival' };
    else if (p.limited) badge = { kind: 'limited', text: 'Limited' };
    else if (p.lowStock) badge = { kind: 'low', text: 'Low stock' };
    return { ...p, idx: i, isNew, onSale, badge, colourObjs: p.colourHints.map(c => colourMap[c]).filter(Boolean) };
  });
  return { ...raw, categories, collections, products, bySlug: Object.fromEntries(products.map(p => [p.slug, p])) };
}
const img = key => `assets/products/${key}.webp`;

/* ---------------- formatting ---------------- */
function fmtPrice(ngn, cur) {
  if (cur === 'USD') return '$' + (ngn / window.SITE.currency.usdRate).toFixed(2);
  return '₦' + Math.round(ngn).toLocaleString('en-NG');
}

/* ---------------- router (hash) ---------------- */
function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = h.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs || '')) };
}
function useRoute() {
  const [r, setR] = useState(parseHash());
  useEffect(() => {
    const f = () => setR(parseHash());
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return r;
}
function go(to) {
  if (to === 'whatsapp') return openWhatsApp();
  location.hash = to;
}
function setQuery(patch, replace = true) {
  const { path, query } = parseHash();
  const q = { ...query, ...patch };
  Object.keys(q).forEach(k => (q[k] === '' || q[k] == null) && delete q[k]);
  const s = new URLSearchParams(q).toString();
  const url = '#' + path + (s ? '?' + s : '');
  if (replace) history.replaceState(null, '', url), dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = url.slice(1);
}
function Link({ to, children, className, onClick, ...rest }) {
  const href = to === 'whatsapp' ? waLink() : '#' + to;
  return (
    <a href={href} className={className} target={to === 'whatsapp' ? '_blank' : undefined} rel="noreferrer"
      onClick={e => { onClick && onClick(e); }} {...rest}>{children}</a>
  );
}
function waLink(text) {
  const n = window.SITE.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${n}${text ? '?text=' + encodeURIComponent(text) : ''}`;
}
function openWhatsApp(text) { window.open(waLink(text), '_blank', 'noopener'); }

/* ---------------- store (Zustand-equivalent, persisted) ---------------- */
const StoreCtx = createContext(null);
function usePersisted(key, init) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem('4am:' + key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { localStorage.setItem('4am:' + key, JSON.stringify(v)); }, [key, v]);
  return [v, setV];
}
function StoreProvider({ catalog, children }) {
  const [cart, setCart] = usePersisted('cart', []);
  const [wish, setWish] = usePersisted('wish', []);
  const [recent, setRecent] = usePersisted('recent', []);
  const [currency, setCurrency] = usePersisted('currency', window.SITE.currency.default);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const api = useMemo(() => ({
    catalog, cart, wish, recent, currency, cartOpen, toast,
    setCurrency, setCartOpen,
    add(slug, size, qty = 1) {
      const mode = window.SITE.checkout.mode;
      const p = catalog.bySlug[slug];
      if (mode === 'catlog-redirect') { window.open(p.catlogUrl, '_blank', 'noopener'); return; }
      if (mode === 'whatsapp') { openWhatsApp(`Hi 4AM Originals, I’d like to order: ${p.name} — size ${size} × ${qty} (${fmtPrice(p.price * qty, 'NGN')}). ${p.catlogUrl}`); return; }
      setCart(c => {
        const i = c.findIndex(l => l.slug === slug && l.size === size);
        if (i > -1) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + qty }; return n; }
        return [...c, { slug, size, qty }];
      });
      setCartOpen(true);
    },
    setQty(slug, size, qty) { setCart(c => qty <= 0 ? c.filter(l => !(l.slug === slug && l.size === size)) : c.map(l => l.slug === slug && l.size === size ? { ...l, qty } : l)); },
    toggleWish(slug) {
      setWish(w => {
        const has = w.includes(slug);
        setToast({ text: has ? 'Removed from wishlist' : 'Saved to wishlist', id: Date.now() });
        return has ? w.filter(s => s !== slug) : [slug, ...w];
      });
    },
    viewed(slug) { setRecent(r => [slug, ...r.filter(s => s !== slug)].slice(0, 12)); },
    notify(text) { setToast({ text, id: Date.now() }); },
    price: ngn => fmtPrice(ngn, currency),
  }), [catalog, cart, wish, recent, currency, cartOpen, toast]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2400); return () => clearTimeout(t); }, [toast]);
  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}
const useStore = () => useContext(StoreCtx);
function cartTotals(store) {
  const lines = store.cart.map(l => ({ ...l, p: store.catalog.bySlug[l.slug] })).filter(l => l.p);
  const sub = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const was = lines.reduce((s, l) => s + (l.p.compareAtPrice || l.p.price) * l.qty, 0);
  return { lines, sub, saved: was - sub, count: lines.reduce((s, l) => s + l.qty, 0) };
}

/* ---------------- icons (simple strokes only) ---------------- */
const IC = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c1.2-3.9 4-5.6 7.5-5.6s6.3 1.7 7.5 5.6" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />,
  bag: <><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chevR: <path d="M9.5 6l6 6-6 6" />,
  chevL: <path d="M14.5 6l-6 6 6 6" />,
  chevD: <path d="M6 9.5l6 6 6-6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  truck: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17.5" cy="17.5" r="1.6" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  share: <><circle cx="6" cy="12" r="2.3" /><circle cx="17" cy="6" r="2.3" /><circle cx="17" cy="18" r="2.3" /><path d="M8 11l7-4M8 13l7 4" /></>,
  ruler: <><path d="M3 15l12-12 6 6-12 12z" /><path d="M7 11l2 2M10 8l2 2M13 5l2 2" /></>,
  chat: <path d="M4 18.5l1.3-3.8A7.5 7.5 0 1 1 8.6 18z" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  pin: <><path d="M12 21s-6-5.4-6-11a6 6 0 0 1 12 0c0 5.6-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></>,
  bolt: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />,
  grid2: <><rect x="4" y="4" width="7" height="16" /><rect x="13" y="4" width="7" height="16" /></>,
  grid3: <><rect x="3" y="4" width="4.6" height="16" /><rect x="9.7" y="4" width="4.6" height="16" /><rect x="16.4" y="4" width="4.6" height="16" /></>,
  grid4: <><rect x="3" y="4" width="3.4" height="16" /><rect x="8" y="4" width="3.4" height="16" /><rect x="12.6" y="4" width="3.4" height="16" /><rect x="17.2" y="4" width="3.4" height="16" /></>,
};
function Icon({ name, size = 22, fill, stroke = 1.6, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {IC[name]}
    </svg>
  );
}

/* ---------------- Tabs / Segmented (sliding pill, ARIA, arrows, ?tab sync) ---------------- */
function Tabs({ items, value, onChange, urlKey, variant = 'pill', size = 'md', label, className = '' }) {
  const ref = useRef(null);
  const [pill, setPill] = useState(null);
  const route = useRoute();
  const cur = urlKey && route.query[urlKey] && items.some(i => i.value === route.query[urlKey]) ? route.query[urlKey] : value;
  useEffect(() => { if (urlKey && cur !== value) onChange(cur); }, [cur]);
  const measure = useCallback(() => {
    const el = ref.current && ref.current.querySelector('[aria-selected="true"]');
    if (el) setPill(o => (o && o.x === el.offsetLeft && o.w === el.offsetWidth ? o : { x: el.offsetLeft, w: el.offsetWidth }));
  }, []);
  useLayoutEffect(measure, [cur, items.length, measure]);
  useEffect(() => { addEventListener('resize', measure); return () => removeEventListener('resize', measure); }, [measure]);
  useEffect(() => {
    const el = ref.current && ref.current.querySelector('[aria-selected="true"]');
    if (el && ref.current.scrollWidth > ref.current.clientWidth) ref.current.scrollTo({ left: el.offsetLeft - 24, behavior: 'smooth' });
  }, [cur]);
  const select = v => { onChange(v); if (urlKey) setQuery({ [urlKey]: v }); };
  const onKey = e => {
    const i = items.findIndex(t => t.value === cur);
    let n = null;
    if (e.key === 'ArrowRight') n = (i + 1) % items.length;
    if (e.key === 'ArrowLeft') n = (i - 1 + items.length) % items.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = items.length - 1;
    if (n != null) { e.preventDefault(); select(items[n].value); ref.current.querySelectorAll('[role=tab]')[n].focus(); }
  };
  return (
    <div ref={ref} role="tablist" aria-label={label} onKeyDown={onKey} className={`tabs tabs--${variant} tabs--${size} ${className}`}>
      {pill && <span className="tabs__pill" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />}
      {items.map(t => (
        <button key={t.value} role="tab" type="button" aria-selected={t.value === cur} tabIndex={t.value === cur ? 0 : -1}
          className="tabs__tab" onClick={() => select(t.value)}>
          {t.label}{t.count != null && <span className="tabs__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Rail carousel (drag + snap + arrows) ---------------- */
function Rail({ children, className = '', itemClass = 'rail__item', ariaLabel }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ s: true, e: false });
  const upd = () => {
    const el = ref.current; if (!el) return;
    const s = el.scrollLeft < 8, e = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    setEdge(o => (o.s === s && o.e === e ? o : { s, e }));
  };
  const n = React.Children.count(children);
  useEffect(() => { upd(); const t = setTimeout(upd, 400); addEventListener('resize', upd); return () => { clearTimeout(t); removeEventListener('resize', upd); }; }, [n]);
  const page = d => { const el = ref.current; el.scrollBy({ left: d * el.clientWidth * 0.86, behavior: 'smooth' }); };
  // mouse drag (touch uses native momentum)
  const drag = useRef(null);
  const down = e => {
    if (e.pointerType !== 'mouse') return;
    drag.current = { x: e.clientX, l: ref.current.scrollLeft, moved: false };
    ref.current.classList.add('is-drag');
  };
  const move = e => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x; if (Math.abs(dx) > 4) d.moved = true;
    ref.current.scrollLeft = d.l - dx;
  };
  const up = () => {
    const d = drag.current; if (!d) return;
    ref.current.classList.remove('is-drag');
    if (d.moved) { const once = ev => { ev.preventDefault(); ev.stopPropagation(); }; ref.current.addEventListener('click', once, { capture: true, once: true }); setTimeout(() => ref.current && ref.current.removeEventListener('click', once, { capture: true }), 50); }
    drag.current = null;
  };
  return (
    <div className={`rail ${className}`}>
      <div ref={ref} className="rail__track" onScroll={upd} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        role="region" aria-label={ariaLabel} tabIndex={0}>
        {React.Children.map(children, c => c && <div className={itemClass}>{c}</div>)}
      </div>
      <button className="rail__btn rail__btn--prev" onClick={() => page(-1)} disabled={edge.s} aria-label="Previous"><Icon name="chevL" /></button>
      <button className="rail__btn rail__btn--next" onClick={() => page(1)} disabled={edge.e} aria-label="Next"><Icon name="chevR" /></button>
    </div>
  );
}

/* ---------------- Img (4:5, neutral backdrop, fade-in) ---------------- */
function Img({ src, alt, className = '', ratio = '4 / 5', eager, style }) {
  const [ok, setOk] = useState(false);
  return (
    <span className={`img ${ok ? 'is-loaded' : ''} ${className}`} style={{ aspectRatio: ratio, ...style }}>
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={() => setOk(true)} draggable="false" />
    </span>
  );
}

/* ---------------- Reveal on scroll ---------------- */
function Reveal({ children, as: As = 'div', className = '', delay = 0, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <As ref={ref} className={`reveal ${className}`} style={{ transitionDelay: delay + 'ms' }} {...rest}>{children}</As>;
}

/* ---------------- Countdown ---------------- */
function useCountdown(iso) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, new Date(iso) - now);
  return { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60, done: ms === 0 };
}

function Toast() {
  const { toast } = useStore();
  return <div className={`toast ${toast ? 'is-on' : ''}`} role="status" aria-live="polite">{toast && toast.text}</div>;
}

Object.assign(window, {
  enrichCatalog, img, fmtPrice, parseHash, useRoute, go, setQuery, Link, waLink, openWhatsApp,
  StoreProvider, useStore, cartTotals, Icon, Tabs, Rail, Img, Reveal, useCountdown, Toast,
});
