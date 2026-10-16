/* product detail page + size guide modal */

function SizeGuideModal({ open, onClose, highlight }) {
  const [unit, setUnit] = useState('cm');
  const G = window.SITE.sizeGuide.cm;
  useEffect(() => { if (!open) return; const f = e => e.key === 'Escape' && onClose(); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [open]);
  if (!open) return null;
  const conv = v => unit === 'cm' ? v : (v / 2.54).toFixed(1);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Size guide" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal__box">
        <div className="row-between"><h2 className="h-md">Size guide</h2><button className="hdr__icon" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        <p className="muted sm">Oversized streetwear fit. Measurements are garment chest width × body length. <b>Client to confirm.</b></p>
        <Tabs items={[{ value: 'cm', label: 'cm' }, { value: 'in', label: 'inches' }]} value={unit} onChange={setUnit} label="Units" size="sm" />
        <table className="sg">
          <thead><tr><th>Size</th><th>Chest</th><th>Length</th></tr></thead>
          <tbody>{Object.entries(G).map(([s, [c, l]]) => <tr key={s} className={s === highlight ? 'is-hi' : ''}><td>{s}</td><td>{conv(c)}</td><td>{conv(l)}</td></tr>)}</tbody>
        </table>
        <SizeRecommender />
      </div>
    </div>
  );
}

function SizeRecommender({ onPick }) {
  const [h, setH] = useState(''); const [w, setW] = useState(''); const [fit, setFit] = useState('regular');
  let rec = null;
  if (+h > 140 && +w > 35) {
    const bmi = +w / Math.pow(+h / 100, 2);
    const order = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    let i = bmi < 20 ? 0 : bmi < 22.5 ? 1 : bmi < 25 ? 2 : bmi < 27.5 ? 3 : bmi < 30 ? 4 : bmi < 33 ? 5 : bmi < 36 ? 6 : 7;
    if (+h > 188) i = Math.min(7, i + 1);
    if (fit === 'oversized') i = Math.min(7, i + 1);
    rec = order[i];
  }
  return (
    <div className="rec">
      <div className="eyebrow">Size recommender</div>
      <div className="rec__row">
        <label>Height (cm)<input inputMode="numeric" value={h} onChange={e => setH(e.target.value.replace(/\D/g, ''))} /></label>
        <label>Weight (kg)<input inputMode="numeric" value={w} onChange={e => setW(e.target.value.replace(/\D/g, ''))} /></label>
      </div>
      <Tabs items={[{ value: 'regular', label: 'True to size' }, { value: 'oversized', label: 'Oversized' }]} value={fit} onChange={setFit} label="Preferred fit" size="sm" />
      {rec && <p className="rec__out">We recommend <b>{rec}</b>{onPick && <button className="link" onClick={() => onPick(rec)}>Select {rec}</button>}</p>}
    </div>
  );
}

function Gallery({ p }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(null);
  const ref = useRef();
  useEffect(() => setI(0), [p.slug]);
  const onMove = e => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  const onScroll = () => { const el = ref.current; setI(Math.round(el.scrollLeft / el.clientWidth)); };
  return (
    <div className="gal">
      {p.images.length > 1 && (
        <div className="gal__thumbs" role="tablist" aria-label="Product images">
          {p.images.map((im, k) => <button key={im.src} role="tab" aria-selected={k === i} onClick={() => { setI(k); ref.current && ref.current.scrollTo({ left: k * ref.current.clientWidth }); }}><Img src={im.src} alt="" /></button>)}
        </div>
      )}
      <div className="gal__main" onMouseMove={onMove} onMouseLeave={() => setZoom(null)}>
        <div className="gal__track" ref={ref} onScroll={onScroll}>
          {p.images.map((im, k) => (
            <div className="gal__slide" key={im.src}>
              <Img src={im.src} alt={`${p.name} — image ${k + 1}`} eager={k === 0}
                style={zoom && k === i ? { '--zx': zoom.x + '%', '--zy': zoom.y + '%' } : undefined}
                className={zoom && k === i ? 'is-zoom' : ''} />
            </div>
          ))}
        </div>
        <Badge b={p.badge} />
        {p.images.length > 1 && <div className="gal__count">{i + 1} / {p.images.length}</div>}
      </div>
    </div>
  );
}

function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="pacc">
      {items.map((it, k) => (
        <div key={it.t} className={`acc ${open === k ? 'is-open' : ''}`}>
          <button className="acc__btn" aria-expanded={open === k} onClick={() => setOpen(open === k ? -1 : k)}>{it.t}<Icon name="chevD" size={18} /></button>
          <div className="acc__panel"><div><div className="acc__inner">{it.c}</div></div></div>
        </div>
      ))}
    </div>
  );
}

function deliveryEstimate() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

function ProductPage({ slug }) {
  const store = useStore();
  const { catalog, price, wish } = store;
  const p = catalog.bySlug[slug];
  const [size, setSize] = useState(null);
  const [err, setErr] = useState(false);
  const [sg, setSg] = useState(false);
  const [notify, setNotify] = useState(null);
  const buyRef = useRef();
  const [stickyOn, setStickyOn] = useState(false);
  useEffect(() => { if (p) { store.viewed(p.slug); setSize(null); scrollTo(0, 0); document.title = `${p.name} — 4AM Originals`; } }, [slug]);
  useEffect(() => {
    const el = buyRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setStickyOn(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el); return () => io.disconnect();
  }, [slug]);
  if (!p) return <NotFound />;
  const v = p.variants.find(x => x.size === size);
  const saved = wish.includes(p.slug);
  const cat = catalog.categories.find(c => c.slug === p.category);
  const needSize = p.variants.length > 0;
  const add = () => {
    if (needSize && !size) { setErr(true); return; }
    store.add(p.slug, size || 'One size');
  };
  const waText = `Hi 4AM Originals, I’d like to order: ${p.name}${size ? ' — size ' + size : ''} (${fmtPrice(p.price, 'NGN')}). ${p.catlogUrl}`;
  const share = async () => {
    const url = location.href;
    if (navigator.share) { try { await navigator.share({ title: p.name, url }); } catch { } }
    else { navigator.clipboard && navigator.clipboard.writeText(url); store.notify('Link copied'); }
  };
  // complete the look: other categories that share a collection, else other categories
  const look = catalog.products.filter(x => x.slug !== p.slug && (x.collections.some(c => p.collections.includes(c)) || x.category !== p.category))
    .sort((a, b) => (b.collections.some(c => p.collections.includes(c)) - a.collections.some(c => p.collections.includes(c))) || b.totalOrders - a.totalOrders).slice(0, 10);
  const recent = store.recent.filter(s => s !== p.slug).map(s => catalog.bySlug[s]).filter(Boolean);
  const S = window.SITE;
  const descSizes = /Available in sizes[^.]*\./i;
  return (
    <div className="pdp" data-screen-label={'PDP: ' + p.name}>
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link>{cat && <><span>/</span><Link to={'/shop/' + cat.slug}>{cat.label}</Link></>}<span>/</span><span aria-current="page">{p.name}</span></nav>
        <div className="pdp__grid">
          <Gallery p={p} />
          <div className="pdp__info">
            <div className="pdp__top">
              {p.collections.length > 0 && <Link to={'/collections/' + p.collections[0]} className="eyebrow">{(catalog.collections.find(c => c.slug === p.collections[0]) || {}).name} collection</Link>}
              <h1 className="h-lg pdp__name">{p.name}</h1>
              <div className="pdp__price">
                <span className={p.onSale ? 'is-sale' : ''}>{price(p.price)}</span>
                {p.compareAtPrice && <><s>{price(p.compareAtPrice)}</s><span className="badge badge--sale">Save {p.discountPercent}%</span></>}
              </div>
              {p.colourObjs.length > 0 && <div className="pdp__colour"><span className="muted">Colour:</span> {p.colourObjs.map(c => c.name).join(' / ')} <span className="card__dots">{p.colourObjs.map(c => <span key={c.slug} style={{ background: c.hex }} />)}</span></div>}
            </div>

            {needSize && (
              <div className="pdp__sizes">
                <div className="row-between"><span className="lbl">Size{size && <b>: {size}</b>}</span><button className="link sm" onClick={() => setSg(true)}><Icon name="ruler" size={16} /> Size guide</button></div>
                <div className={`sizes ${err ? 'is-err' : ''}`} role="radiogroup" aria-label="Size">
                  {p.variants.map(x => (
                    <button key={x.id} role="radio" aria-checked={size === x.size} className={size === x.size ? 'is-on' : ''} disabled={!x.available}
                      onClick={() => { setSize(x.size); setErr(false); }}>{x.size}</button>
                  ))}
                </div>
                {err && <p className="err" role="alert">Please select a size.</p>}
              </div>
            )}

            <div ref={buyRef} className="pdp__buy">
              {p.available ? (
                <button className="btn btn--block btn--lg" onClick={add}>Add to bag{v ? ' — ' + price(v.salePrice || v.price) : ''}</button>
              ) : (
                <BackInStock p={p} />
              )}
              <button className={`btn btn--line btn--sq ${saved ? 'is-on' : ''}`} aria-pressed={saved} aria-label="Wishlist" onClick={() => store.toggleWish(p.slug)}><Icon name="heart" fill={saved ? 'currentColor' : 'none'} /></button>
            </div>
            <a className="btn btn--wa btn--block" href={waLink(waText)} target="_blank" rel="noreferrer"><Icon name="chat" size={18} /> Order on WhatsApp</a>

            <ul className="pdp__perks">
              <li><Icon name="truck" size={20} /><span><b>Lagos: arrives by {deliveryEstimate()}</b><br /><span className="muted sm">Order today. Nationwide & international shipping available.</span></span></li>
              <li><Icon name="pin" size={20} /><span><b>{S.location}</b><br /><span className="muted sm">Pickup by arrangement. <Link to="/stores" className="link">Details</Link></span></span></li>
            </ul>

            <Accordion items={[
              { t: 'Details', c: <><p>{p.description.replace(descSizes, '').trim() || p.name}</p>{p.sizes.length > 0 && <p className="muted sm">Sizes: {p.sizes.join(', ')}</p>}{p.sku && <p className="muted sm">SKU: {p.sku}</p>}</> },
              { t: 'Care', c: <p>{S.care}</p> },
              { t: 'Shipping', c: <><p>Lagos deliveries within 24 hours. We ship to {window.CATALOG_RAW.store.deliveryLocations}.</p><Link to="/shipping" className="link">Delivery areas & rates</Link></> },
              { t: 'Returns', c: <><p>{window.CATALOG_RAW.store.refundPolicy}</p><Link to="/returns" className="link">Returns policy</Link></> },
            ]} />

            <div className="pdp__share">
              <button className="link" onClick={share}><Icon name="share" size={16} /> Share</button>
              <a className="link" href={p.catlogUrl} target="_blank" rel="noreferrer">View on Catlog</a>
            </div>
          </div>
        </div>
      </div>

      {look.length > 0 && (
        <section className="sec"><div className="wrap">
          <SectionHead title="Complete the look" />
          <Rail ariaLabel="Complete the look">{look.map(x => <ProductCard key={x.id} p={x} />)}</Rail>
        </div></section>
      )}
      {recent.length > 0 && (
        <section className="sec"><div className="wrap">
          <SectionHead title="Recently viewed" />
          <Rail ariaLabel="Recently viewed">{recent.map(x => <ProductCard key={x.id} p={x} />)}</Rail>
        </div></section>
      )}

      <div className={`stickybuy ${stickyOn ? 'is-on' : ''}`}>
        <div className="stickybuy__info"><b>{p.name}</b><span>{price(p.price)}{size ? ' · ' + size : ''}</span></div>
        <button className="btn" onClick={() => { if (needSize && !size) { scrollTo({ top: buyRef.current.getBoundingClientRect().top + scrollY - 260, behavior: 'smooth' }); setErr(true); } else add(); }}>Add to bag</button>
      </div>
      <SizeGuideModal open={sg} onClose={() => setSg(false)} highlight={size} />
    </div>
  );
}

function BackInStock({ p }) {
  const [e, setE] = useState(''); const [ok, setOk] = useState(false);
  return ok ? <p className="ok">We’ll email you when {p.name} is back.</p> : (
    <form className="bis" onSubmit={ev => { ev.preventDefault(); if (/\S+@\S+\.\S+/.test(e)) setOk(true); }}>
      <p className="muted sm">Sold out — get notified when it’s back.</p>
      <input type="email" placeholder="Email address" value={e} onChange={x => setE(x.target.value)} aria-label="Email for back-in-stock" />
      <button className="btn">Notify me</button>
    </form>
  );
}

Object.assign(window, { ProductPage, SizeGuideModal, SizeRecommender });
