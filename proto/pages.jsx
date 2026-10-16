/* remaining routes. P1 = fully working shop flow; P2/P3 pages are functional stubs that link correctly (no dead links). */

function NotFound() {
  return (
    <div className="wrap page page--center" data-screen-label="404">
      <div className="eyebrow">Error 404</div>
      <h1 className="h-xl">It’s 4AM. This page went home.</h1>
      <p className="muted">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="row-gap"><Link to="/" className="btn">Back to home</Link><Link to="/shop" className="btn btn--line">Shop all</Link></div>
    </div>
  );
}

function CollectionsIndex() {
  const { catalog } = useStore();
  return (
    <div className="wrap page" data-screen-label="Collections">
      <nav className="crumbs"><Link to="/">Home</Link><span>/</span><span>Collections</span></nav>
      <h1 className="h-xl">Collections</h1>
      <div className="colidx">
        {catalog.collections.sort((a, b) => b.count - a.count).map(c => {
          const ps = catalog.products.filter(p => p.collections.includes(c.slug));
          return (
            <Link key={c.slug} to={'/collections/' + c.slug} className="colidx__item">
              <div className="colidx__imgs">{ps.slice(0, 3).map(p => <Img key={p.id} src={p.images[0].src} alt="" />)}</div>
              <div className="row-between"><b className="h-sm">{c.name}</b><span className="muted sm">{c.count} styles</span></div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function CartPage() {
  const store = useStore();
  const { lines, sub, saved } = cartTotals(store);
  const { price } = store;
  return (
    <div className="wrap page" data-screen-label="Cart">
      <h1 className="h-xl">Your bag</h1>
      {!lines.length ? <div className="empty"><p>Your bag is empty.</p><Link to="/new-arrivals" className="btn">Shop new arrivals</Link></div> : (
        <div className="cartpg">
          <div>{lines.map(l => (
            <div className="line line--lg" key={l.slug + l.size}>
              <Link to={'/product/' + l.slug} className="line__img"><Img src={l.p.images[0].src} alt={l.p.name} /></Link>
              <div className="line__info">
                <Link to={'/product/' + l.slug} className="line__name">{l.p.name}</Link>
                <div className="muted sm">Size {l.size}</div>
                <div className="line__row">
                  <div className="qty"><button onClick={() => store.setQty(l.slug, l.size, l.qty - 1)} aria-label="Decrease"><Icon name="minus" size={14} /></button><span>{l.qty}</span><button onClick={() => store.setQty(l.slug, l.size, l.qty + 1)} aria-label="Increase"><Icon name="plus" size={14} /></button></div>
                  <b>{price(l.p.price * l.qty)}</b>
                </div>
                <button className="link sm" onClick={() => store.setQty(l.slug, l.size, 0)}>Remove</button>
              </div>
            </div>))}
          </div>
          <aside className="summary">
            <h2 className="h-sm">Summary</h2>
            <div className="row-between"><span>Subtotal</span><span>{price(sub)}</span></div>
            {saved > 0 && <div className="row-between"><span>Savings</span><span className="sale">−{price(saved)}</span></div>}
            <div className="row-between muted"><span>Delivery</span><span>At checkout</span></div>
            <div className="row-between total"><b>Total</b><b>{price(sub)}</b></div>
            <Link to="/checkout" className="btn btn--block">Checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function CheckoutPage() {
  const store = useStore();
  const { lines, sub } = cartTotals(store);
  const { price } = store;
  const raw = window.CATALOG_RAW.store;
  const [step, setStep] = useState('details');
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '', area: raw.deliveryAreas[0], pay: 'paystack' });
  const [errs, setErrs] = useState({});
  const mode = window.SITE.checkout.mode;
  if (!lines.length) return <div className="wrap page page--center"><h1 className="h-lg">Your bag is empty</h1><Link to="/shop" className="btn">Shop all</Link></div>;
  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^\+?[\d\s-]{10,15}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number';
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
    if (f.address.trim().length < 6) e.address = 'Enter a delivery address';
    setErrs(e); return !Object.keys(e).length;
  };
  const steps = [{ value: 'details', label: '1 · Delivery' }, { value: 'pay', label: '2 · Payment' }, { value: 'review', label: '3 · Review' }];
  const next = () => { if (step === 'details' && !validate()) return; setStep(step === 'details' ? 'pay' : 'review'); };
  const place = () => {
    const id = '4AM-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    localStorage.setItem('4am:lastOrder', JSON.stringify({ id, lines: store.cart, sub, f, at: Date.now() }));
    store.cart.forEach(l => store.setQty(l.slug, l.size, 0));
    go('/checkout/success?id=' + id);
  };
  const field = (k, label, props = {}) => (
    <label className={`fld ${errs[k] ? 'is-err' : ''}`}><span>{label}</span><input value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} aria-invalid={!!errs[k]} {...props} />{errs[k] && <em role="alert">{errs[k]}</em>}</label>
  );
  return (
    <div className="wrap page" data-screen-label="Checkout">
      <h1 className="h-xl">Checkout</h1>
      {mode !== 'native' && <p className="note">Checkout mode is <b>{mode}</b> — customers are sent to {mode === 'whatsapp' ? 'WhatsApp' : 'the Catlog product page'} instead.</p>}
      <Tabs items={steps} value={step} onChange={v => { if (v === 'details' || validate()) setStep(v); }} label="Checkout steps" urlKey="step" className="co__steps" />
      <div className="cartpg">
        <div className="co__panel">
          {step === 'details' && <div className="co__form">
            {field('name', 'Full name', { autoComplete: 'name' })}
            {field('phone', 'Phone (WhatsApp)', { autoComplete: 'tel', inputMode: 'tel' })}
            {field('email', 'Email (optional)', { autoComplete: 'email', type: 'email' })}
            {field('address', 'Delivery address', { autoComplete: 'street-address' })}
            <label className="fld"><span>Delivery area</span><select value={f.area} onChange={e => setF({ ...f, area: e.target.value })}>{raw.deliveryAreas.map(a => <option key={a}>{a}</option>)}</select></label>
            <p className="muted sm">Delivery fee confirmed by the 4AM team for your area (client to supply rate table).</p>
          </div>}
          {step === 'pay' && <div className="co__pay">
            {[['paystack', 'Pay with Paystack', 'Card, bank, USSD — mock until keys are added'], ['transfer', 'Bank transfer', 'Account details shown after you place the order'], ['whatsapp', 'Confirm on WhatsApp', 'We’ll send your order to the 4AM team']].map(([v, t, d]) => (
              <label key={v} className={`payopt ${f.pay === v ? 'is-on' : ''}`}><input type="radio" name="pay" checked={f.pay === v} onChange={() => setF({ ...f, pay: v })} /><span><b>{t}</b><span className="muted sm">{d}</span></span></label>
            ))}
          </div>}
          {step === 'review' && <div className="co__review">
            <p><b>{f.name}</b> · {f.phone}<br />{f.address}, {f.area}</p>
            <p className="muted">Payment: {f.pay}</p>
          </div>}
          <div className="row-gap">
            {step !== 'review' ? <button className="btn" onClick={next}>Continue</button> : f.pay === 'whatsapp'
              ? <a className="btn btn--wa" target="_blank" rel="noreferrer" href={waLink(`Order from ${f.name} (${f.phone})\n` + lines.map(l => `• ${l.p.name} — ${l.size} × ${l.qty}`).join('\n') + `\nDeliver to: ${f.address}, ${f.area}\nSubtotal: ${fmtPrice(sub, 'NGN')}`)} onClick={place}>Send order on WhatsApp</a>
              : <button className="btn" onClick={place}>Place order · {price(sub)}</button>}
          </div>
        </div>
        <aside className="summary">
          <h2 className="h-sm">Order ({lines.length})</h2>
          {lines.map(l => <div key={l.slug + l.size} className="summary__line"><Img src={l.p.images[0].src} alt="" /><span>{l.p.name}<br /><span className="muted sm">{l.size} × {l.qty}</span></span><b>{price(l.p.price * l.qty)}</b></div>)}
          <div className="row-between total"><b>Subtotal</b><b>{price(sub)}</b></div>
        </aside>
      </div>
    </div>
  );
}

function SuccessPage() {
  const { query } = useRoute();
  return (
    <div className="wrap page page--center" data-screen-label="Order success">
      <div className="success__ic"><Icon name="check" size={36} stroke={2} /></div>
      <h1 className="h-xl">Order placed</h1>
      <p>Order <b>{query.id}</b>. The 4AM team will confirm delivery on WhatsApp.</p>
      <div className="row-gap"><Link to={'/track-order?id=' + query.id} className="btn">Track order</Link><Link to="/" className="btn btn--line">Continue shopping</Link></div>
    </div>
  );
}

function WishlistPage() {
  const store = useStore();
  const list = store.wish.map(s => store.catalog.bySlug[s]).filter(Boolean);
  const share = () => { const url = location.href.split('#')[0] + '#/wishlist?items=' + store.wish.join(','); navigator.clipboard && navigator.clipboard.writeText(url); store.notify('Wishlist link copied'); };
  const { query } = useRoute();
  const shared = query.items ? query.items.split(',').map(s => store.catalog.bySlug[s]).filter(Boolean) : null;
  const show = shared || list;
  return (
    <div className="wrap page" data-screen-label="Wishlist">
      <div className="row-between"><h1 className="h-xl">{shared ? 'Shared wishlist' : 'Wishlist'}</h1>{!shared && list.length > 0 && <button className="btn btn--line btn--sm" onClick={share}><Icon name="share" size={16} /> Share list</button>}</div>
      {show.length ? <div className="grid grid--4">{show.map(p => <ProductCard key={p.id} p={p} />)}</div>
        : <div className="empty"><p>Tap the heart on any style to save it here.</p><Link to="/best-sellers" className="btn">Shop best sellers</Link></div>}
    </div>
  );
}

function SearchPage() {
  const { catalog } = useStore();
  const { query } = useRoute();
  const q = query.q || '';
  const base = useMemo(() => searchProducts(catalog.products, q), [q]);
  return <ListingPage title={q ? `Results for “${q}”` : 'Search'} base={base.length ? base : []} intro={!base.length && q ? 'No exact matches. Try “tracksuit”, “tee” or a collection name.' : null} />;
}

const INFO = {
  '/about': ['About 4AM', s => [<p key="a">{s.name} — {s.description}. Based in Lagos ({s.address || 'Island/Mainland'}), shipping to {s.deliveryLocations}.</p>, <p key="b" className="note">Brand story to be supplied by the client.</p>]],
  '/community': ['4AM Community', s => [<p key="a">Tag <b>@{window.SITE.instagram}</b> to be featured.</p>, <p key="b" className="note">Community story, UGC and events to be supplied by the client.</p>]],
  '/contact': ['Contact', s => [<p key="a">WhatsApp: <a className="link" href={waLink()} target="_blank" rel="noreferrer">{window.SITE.phoneDisplay}</a><br />Instagram: <a className="link" href={'https://instagram.com/' + window.SITE.instagram} target="_blank" rel="noreferrer">@{window.SITE.instagram}</a></p>, <p key="b" className="note">Email address — client to confirm.</p>]],
  '/stores': ['Pickup & contact', s => [<p key="a">{window.SITE.location}. Pickup by arrangement on WhatsApp.</p>, <p key="b" className="note">Physical pickup address — client to confirm.</p>]],
  '/help': ['Help Centre', s => [<p key="a">Quick answers: <Link className="link" to="/shipping">Shipping</Link> · <Link className="link" to="/returns">Returns</Link> · <Link className="link" to="/size-guide">Size guide</Link> · <Link className="link" to="/track-order">Track order</Link></p>, <p key="b">Still stuck? <a className="link" href={waLink()} target="_blank" rel="noreferrer">Chat on WhatsApp</a>.</p>]],
  '/shipping': ['Shipping & delivery', s => [<p key="a">Delivery timeline: <b>{s.deliveryTimeline}</b> in Lagos. We ship to {s.deliveryLocations}.</p>, <h3 key="h" className="h-sm">Delivery areas</h3>, <ul key="l" className="areas">{s.deliveryAreas.map(a => <li key={a}>{a}</li>)}</ul>, <p key="n" className="note">Rates per area — client to confirm.</p>]],
  '/returns': ['Returns', s => [<p key="a">{s.refundPolicy}</p>, <p key="b" className="note">Full returns policy — client to confirm.</p>]],
  '/gift-cards': ['Gift cards', () => [<p key="a" className="note">Gift card denominations and redemption — client to confirm. Phase 3.</p>]],
  '/blog': ['Journal', () => [<p key="a" className="note">MDX journal ships in Phase 3.</p>]],
  '/account': ['Account', () => [<AccountStub key="a" />]],
  '/login': ['Sign in', () => [<p key="a" className="note">NextAuth sign-in ships in Phase 3.</p>]],
  '/signup': ['Create account', () => [<p key="a" className="note">NextAuth sign-up ships in Phase 3.</p>]],
  '/legal/terms': ['Terms', () => [<p key="a" className="note">Legal copy — client to supply.</p>]],
  '/legal/privacy': ['Privacy', () => [<p key="a" className="note">Legal copy — client to supply.</p>]],
  '/legal/cookies': ['Cookies', () => [<p key="a" className="note">Legal copy — client to supply.</p>]],
};

function AccountStub() {
  const [t, setT] = useState('orders');
  const last = JSON.parse(localStorage.getItem('4am:lastOrder') || 'null');
  return (
    <>
      <Tabs items={[{ value: 'orders', label: 'Orders' }, { value: 'addresses', label: 'Addresses' }, { value: 'wishlist', label: 'Wishlist' }, { value: 'profile', label: 'Profile' }]} value={t} onChange={setT} urlKey="tab" label="Account" />
      <div className="acct__panel" role="tabpanel">
        {t === 'orders' && (last ? <p>Last order <b>{last.id}</b> · {fmtPrice(last.sub, 'NGN')} · <Link className="link" to={'/track-order?id=' + last.id}>Track</Link></p> : <p className="muted">No orders yet.</p>)}
        {t === 'addresses' && <p className="muted">Saved addresses — Phase 3.</p>}
        {t === 'wishlist' && <Link to="/wishlist" className="link">Open wishlist</Link>}
        {t === 'profile' && <p className="muted">Profile — Phase 3 (NextAuth).</p>}
      </div>
    </>
  );
}

function InfoPage({ path }) {
  const [title, body] = INFO[path];
  return (
    <div className="wrap page page--narrow" data-screen-label={title}>
      <nav className="crumbs"><Link to="/">Home</Link><span>/</span><span>{title}</span></nav>
      <h1 className="h-xl">{title}</h1>
      <div className="prose">{body(window.CATALOG_RAW.store)}</div>
    </div>
  );
}

function TrackPage() {
  const { query } = useRoute();
  const [id, setId] = useState(query.id || '');
  const last = JSON.parse(localStorage.getItem('4am:lastOrder') || 'null');
  const found = last && last.id === id.trim().toUpperCase();
  return (
    <div className="wrap page page--narrow" data-screen-label="Track order">
      <h1 className="h-xl">Track order</h1>
      <form className="news__form" onSubmit={e => e.preventDefault()}><input value={id} onChange={e => setId(e.target.value)} placeholder="Order number e.g. 4AM-XXXXXX" aria-label="Order number" /><button className="btn">Track</button></form>
      {id && (found ? (
        <ol className="track">{['Order placed', 'Confirmed on WhatsApp', 'Out for delivery', 'Delivered'].map((s, i) => <li key={s} className={i === 0 ? 'is-done' : ''}>{s}</li>)}</ol>
      ) : <p className="muted">No order found with that number on this device. Live tracking connects to the order database in Phase 3.</p>)}
    </div>
  );
}

function SizeGuidePage() {
  const [open] = useState(true);
  return (
    <div className="wrap page page--narrow" data-screen-label="Size guide">
      <h1 className="h-xl">Size guide</h1>
      <SizeGuideInline />
    </div>
  );
}
function SizeGuideInline() {
  const [unit, setUnit] = useState('cm');
  const G = window.SITE.sizeGuide.cm;
  const conv = v => unit === 'cm' ? v : (v / 2.54).toFixed(1);
  return (<>
    <Tabs items={[{ value: 'cm', label: 'cm' }, { value: 'in', label: 'inches' }]} value={unit} onChange={setUnit} urlKey="unit" label="Units" size="sm" />
    <table className="sg"><thead><tr><th>Size</th><th>Chest</th><th>Length</th></tr></thead><tbody>{Object.entries(G).map(([s, [c, l]]) => <tr key={s}><td>{s}</td><td>{conv(c)}</td><td>{conv(l)}</td></tr>)}</tbody></table>
    <p className="note">Measurements — client to confirm.</p>
    <SizeRecommender />
  </>);
}

Object.assign(window, { NotFound, CollectionsIndex, CartPage, CheckoutPage, SuccessPage, WishlistPage, SearchPage, InfoPage, INFO, TrackPage, SizeGuidePage });
