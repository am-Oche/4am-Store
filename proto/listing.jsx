/* listing: sticky filter bar, chips, sort, column toggle, URL-synced, load more + infinite scroll, skeletons */

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'new', label: 'Newest' },
  { value: 'best', label: 'Best selling' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];
const SIZE_ORDER = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const PAGE = 16;

function applyFilters(list, q) {
  const sizes = q.size ? q.size.split(',') : [];
  const cols = q.colour ? q.colour.split(',') : [];
  const cats = q.cat ? q.cat.split(',') : [];
  let r = list.filter(p =>
    (!cats.length || cats.some(c => p.categories.includes(c))) &&
    (!sizes.length || sizes.some(s => p.variants.some(v => v.size === s && v.available))) &&
    (!cols.length || cols.some(c => p.colourHints.includes(c))) &&
    (!q.min || p.price >= +q.min) && (!q.max || p.price <= +q.max) &&
    (!q.sale || p.onSale) && (!q.instock || p.available)
  );
  const s = q.sort || 'featured';
  const by = {
    featured: (a, b) => (b.featured - a.featured) || (b.totalOrders + (b.isNew ? 8 : 0)) - (a.totalOrders + (a.isNew ? 8 : 0)),
    new: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    best: (a, b) => b.totalOrders - a.totalOrders,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
  }[s];
  return [...r].sort(by);
}

function Dropdown({ label, active, children, align }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef();
  const toggle = () => {
    if (!open) { const r = ref.current.getBoundingClientRect(); setPos({ top: r.bottom, left: Math.min(r.left, innerWidth - 256) }); }
    setOpen(!open);
  };
  useEffect(() => {
    if (!open) return;
    const f = e => !ref.current.contains(e.target) && setOpen(false);
    const k = e => e.key === 'Escape' && setOpen(false);
    const s = () => setOpen(false);
    document.addEventListener('mousedown', f); addEventListener('keydown', k); addEventListener('scroll', s, { passive: true });
    return () => { document.removeEventListener('mousedown', f); removeEventListener('keydown', k); removeEventListener('scroll', s); };
  }, [open]);
  return (
    <div className={`dd ${open ? 'is-open' : ''}`} ref={ref}>
      <button className={`dd__btn ${active ? 'is-active' : ''}`} aria-expanded={open} onClick={toggle}>{label}<Icon name="chevD" size={16} /></button>
      {open && <div className="dd__pop" style={pos ? { top: pos.top, left: Math.max(8, pos.left) } : undefined}>{children}</div>}
    </div>
  );
}

function toggleCsv(csv, v) {
  const a = csv ? csv.split(',') : [];
  return (a.includes(v) ? a.filter(x => x !== v) : [...a, v]).join(',');
}

function FilterBar({ q, base, catalog, total, hideCat }) {
  const sizes = q.size ? q.size.split(',') : [];
  const cols = q.colour ? q.colour.split(',') : [];
  const cats = q.cat ? q.cat.split(',') : [];
  const [cols4, setCols4] = useState(q.cols || '4');
  const prices = base.map(p => p.price);
  const pmin = Math.min(...prices), pmax = Math.max(...prices);
  const availColours = catalog.colours.filter(c => base.some(p => p.colourHints.includes(c.slug)));
  const availCats = catalog.categories.filter(c => base.some(p => p.categories.includes(c.slug)));
  const chips = [
    ...cats.map(c => ({ k: 'cat', v: c, l: (catalog.categories.find(x => x.slug === c) || {}).label })),
    ...sizes.map(s => ({ k: 'size', v: s, l: 'Size ' + s })),
    ...cols.map(c => ({ k: 'colour', v: c, l: (catalog.colours.find(x => x.slug === c) || {}).name })),
    ...(q.min || q.max ? [{ k: 'price', l: `${q.min ? fmtPrice(+q.min, 'NGN') : fmtPrice(pmin, 'NGN')} – ${q.max ? fmtPrice(+q.max, 'NGN') : fmtPrice(pmax, 'NGN')}` }] : []),
    ...(q.sale ? [{ k: 'sale', l: 'On sale' }] : []),
    ...(q.instock ? [{ k: 'instock', l: 'In stock' }] : []),
  ];
  const remove = c => {
    if (c.k === 'price') return setQuery({ min: '', max: '' });
    if (c.k === 'sale' || c.k === 'instock') return setQuery({ [c.k]: '' });
    setQuery({ [c.k]: toggleCsv(q[c.k], c.v) });
  };
  return (
    <div className="fbar">
      <div className="wrap fbar__row">
        <div className="fbar__filters">
          <span className="fbar__lbl"><Icon name="filter" size={18} /> Filter</span>
          {!hideCat && availCats.length > 1 && (
            <Dropdown label="Category" active={cats.length}>
              {availCats.map(c => (
                <label key={c.slug} className="chk"><input type="checkbox" checked={cats.includes(c.slug)} onChange={() => setQuery({ cat: toggleCsv(q.cat, c.slug) })} />{c.label}<span className="muted">{base.filter(p => p.categories.includes(c.slug)).length}</span></label>
              ))}
            </Dropdown>
          )}
          <Dropdown label="Size" active={sizes.length}>
            <div className="sizegrid">
              {SIZE_ORDER.map(s => <button key={s} className={sizes.includes(s) ? 'is-on' : ''} aria-pressed={sizes.includes(s)} onClick={() => setQuery({ size: toggleCsv(q.size, s) })}>{s}</button>)}
            </div>
          </Dropdown>
          {availColours.length > 0 && (
            <Dropdown label="Colour" active={cols.length}>
              {availColours.map(c => (
                <label key={c.slug} className="chk"><input type="checkbox" checked={cols.includes(c.slug)} onChange={() => setQuery({ colour: toggleCsv(q.colour, c.slug) })} /><span className="swatch" style={{ background: c.hex }} />{c.name}</label>
              ))}
            </Dropdown>
          )}
          <Dropdown label="Price" active={q.min || q.max}>
            {PRICE_BANDS.map(b => {
              const o = Object.fromEntries(new URLSearchParams(b.q));
              const on = (q.min || '') === (o.min || '') && (q.max || '') === (o.max || '');
              return <label key={b.q} className="chk"><input type="radio" name="pb" checked={on} onChange={() => setQuery({ min: o.min || '', max: o.max || '' })} />{b.label}</label>;
            })}
          </Dropdown>
          <Dropdown label="Availability" active={q.instock || q.sale}>
            <label className="chk"><input type="checkbox" checked={!!q.instock} onChange={() => setQuery({ instock: q.instock ? '' : '1' })} />In stock</label>
            {base.some(p => p.onSale) && <label className="chk"><input type="checkbox" checked={!!q.sale} onChange={() => setQuery({ sale: q.sale ? '' : '1' })} />On sale</label>}
          </Dropdown>
        </div>
        <div className="fbar__right">
          <span className="fbar__count">{total} {total === 1 ? 'style' : 'styles'}</span>
          <label className="sort"><span className="sr">Sort by</span>
            <select value={q.sort || 'featured'} onChange={e => setQuery({ sort: e.target.value === 'featured' ? '' : e.target.value })}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <Icon name="chevD" size={16} />
          </label>
          <div className="colsw" role="group" aria-label="Grid columns">
            {['2', '3', '4'].map(n => <button key={n} className={`colsw__b colsw__b--${n} ${(q.cols || '4') === n ? 'is-on' : ''}`} aria-pressed={(q.cols || '4') === n} aria-label={`${n} columns`} onClick={() => setQuery({ cols: n === '4' ? '' : n })}><Icon name={'grid' + n} size={18} stroke={1.4} /></button>)}
          </div>
        </div>
      </div>
      {chips.length > 0 && (
        <div className="wrap fbar__chips">
          {chips.map((c, i) => <button key={i} className="fchip" onClick={() => remove(c)}>{c.l}<Icon name="x" size={12} /></button>)}
          <button className="link sm" onClick={() => setQuery({ size: '', colour: '', cat: '', min: '', max: '', sale: '', instock: '' })}>Clear all</button>
        </div>
      )}
    </div>
  );
}

function ProductGrid({ list, cols, resetKey }) {
  const [n, setN] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const sent = useRef();
  useEffect(() => { setN(PAGE); setLoading(true); const t = setTimeout(() => setLoading(false), 260); return () => clearTimeout(t); }, [resetKey]);
  useEffect(() => {
    const el = sent.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && n < list.length && n < PAGE * 3) setN(x => x + PAGE); }, { rootMargin: '600px' });
    io.observe(el); return () => io.disconnect();
  }, [n, list.length]);
  if (loading) return <div className={`grid grid--${cols}`}>{Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}</div>;
  if (!list.length) return (
    <div className="empty">
      <p className="h-sm">No styles match those filters</p>
      <button className="btn btn--line" onClick={() => setQuery({ size: '', colour: '', cat: '', min: '', max: '', sale: '', instock: '' })}>Clear filters</button>
    </div>
  );
  return (
    <>
      <div className={`grid grid--${cols}`}>{list.slice(0, n).map((p, i) => <ProductCard key={p.id} p={p} eager={i < 4} />)}</div>
      <div ref={sent} />
      {n < list.length && (
        <div className="more">
          <p className="muted sm">Showing {Math.min(n, list.length)} of {list.length}</p>
          <div className="more__bar"><span style={{ transform: `scaleX(${Math.min(n, list.length) / list.length})` }} /></div>
          <button className="btn btn--line" onClick={() => setN(n + PAGE)}>Load more</button>
        </div>
      )}
    </>
  );
}

function ListingPage({ title, base, intro, crumbs, hideCat, tabs }) {
  const { catalog } = useStore();
  const { query: q, path } = useRoute();
  const list = useMemo(() => applyFilters(base, q), [base, q]);
  return (
    <div className="listing" data-screen-label={'Listing: ' + title}>
      <div className="wrap listing__head">
        <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link>{(crumbs || []).map(c => <React.Fragment key={c.to}><span>/</span><Link to={c.to}>{c.label}</Link></React.Fragment>)}<span>/</span><span aria-current="page">{title}</span></nav>
        <h1 className="h-xl">{title}</h1>
        {intro && <p className="muted listing__intro">{intro}</p>}
        {tabs}
      </div>
      <FilterBar q={q} base={base} catalog={catalog} total={list.length} hideCat={hideCat} />
      <div className="wrap"><ProductGrid list={list} cols={q.cols || '4'} resetKey={path + JSON.stringify(q)} /></div>
    </div>
  );
}

function CategoryChips({ current }) {
  const { catalog } = useStore();
  return (
    <div className="catchips">
      <Link to="/shop" className={`pill ${!current ? 'is-on' : ''}`}>All</Link>
      {catalog.categories.map(c => <Link key={c.slug} to={'/shop/' + c.slug} className={`pill ${current === c.slug ? 'is-on' : ''}`}>{c.label}</Link>)}
    </div>
  );
}

Object.assign(window, { ListingPage, applyFilters, CategoryChips, ProductGrid });
