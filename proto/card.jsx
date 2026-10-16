/* product card, quick-add, cart drawer */

function Badge({ b }) {
  if (!b) return null;
  return <span className={`badge badge--${b.kind}`}>{b.text}</span>;
}

function ProductCard({ p, eager }) {
  const store = useStore();
  const { price, wish } = store;
  const [qa, setQa] = useState(false);
  const two = p.images.length > 1;
  const saved = wish.includes(p.slug);
  return (
    <article className={`card ${two ? 'card--swap' : 'card--zoom'} ${qa ? 'is-qa' : ''}`} onMouseLeave={() => setQa(false)}>
      <div className="card__media">
        <Link to={'/product/' + p.slug} className="card__imgs" aria-label={p.name} tabIndex={-1}>
          <Img src={p.images[0].src} alt={p.name} eager={eager} className="card__img card__img--a" />
          {two && <Img src={p.images[1].src} alt="" className="card__img card__img--b" />}
        </Link>
        <Badge b={p.badge} />
        <button className={`card__wish ${saved ? 'is-on' : ''}`} aria-pressed={saved} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => store.toggleWish(p.slug)}>
          <Icon name="heart" size={19} fill={saved ? 'currentColor' : 'none'} />
        </button>
        {p.variants.length > 0 ? (
          <div className="card__qa">
            {!qa ? (
              <button className="card__qaBtn" onClick={() => setQa(true)}><Icon name="plus" size={15} /> Quick add</button>
            ) : (
              <div className="card__sizes" role="group" aria-label={`Select size for ${p.name}`}>
                <div className="card__sizesHd"><span>Select size</span><button onClick={() => setQa(false)} aria-label="Close"><Icon name="x" size={14} /></button></div>
                <div className="card__sizesGrid">
                  {p.variants.map(v => (
                    <button key={v.id} disabled={!v.available} onClick={() => { store.add(p.slug, v.size); setQa(false); }}>{v.size}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card__qa"><button className="card__qaBtn" onClick={() => store.add(p.slug, 'One size')}><Icon name="plus" size={15} /> Add to bag</button></div>
        )}
      </div>
      <div className="card__body">
        {p.colourObjs.length > 0 && (
          <div className="card__dots" aria-label={'Colours: ' + p.colourObjs.map(c => c.name).join(', ')}>
            {p.colourObjs.map(c => <span key={c.slug} style={{ background: c.hex }} title={c.name} />)}
          </div>
        )}
        <Link to={'/product/' + p.slug} className="card__name">{p.name}</Link>
        <div className="card__price">
          <span className={p.onSale ? 'is-sale' : ''}>{price(p.price)}</span>
          {p.compareAtPrice && <s>{price(p.compareAtPrice)}</s>}
        </div>
        <div className="card__ship"><Icon name="truck" size={14} /> 24h Lagos delivery</div>
      </div>
    </article>
  );
}

function CartDrawer() {
  const store = useStore();
  const { lines, sub, saved, count } = cartTotals(store);
  const { price } = store;
  const open = store.cartOpen;
  const close = () => store.setCartOpen(false);
  useEffect(() => {
    if (!open) return;
    const f = e => e.key === 'Escape' && close();
    addEventListener('keydown', f); return () => removeEventListener('keydown', f);
  }, [open]);
  const waText = () => 'Hi 4AM Originals, I’d like to order:\n' + lines.map(l => `• ${l.p.name} — size ${l.size} × ${l.qty} (${fmtPrice(l.p.price * l.qty, 'NGN')})`).join('\n') + `\nSubtotal: ${fmtPrice(sub, 'NGN')}`;
  return (
    <>
      <div className={`scrim scrim--top ${open ? 'is-on' : ''}`} onClick={close} />
      <aside className={`drawer drawer--right ${open ? 'is-on' : ''}`} aria-hidden={!open} aria-label="Shopping bag" role="dialog">
        <div className="drawer__head"><h2 className="h-sm">Your bag <span className="muted">({count})</span></h2><button className="hdr__icon" onClick={close} aria-label="Close bag"><Icon name="x" /></button></div>
        {lines.length === 0 ? (
          <div className="drawer__empty">
            <p className="h-sm">Your bag is empty</p>
            <p className="muted">Start with what’s trending right now.</p>
            <button className="btn" onClick={() => { close(); go('/new-arrivals'); }}>Shop new arrivals</button>
          </div>
        ) : (
          <>
            <div className="drawer__body">
              {lines.map(l => (
                <div className="line" key={l.slug + l.size}>
                  <Link to={'/product/' + l.slug} onClick={close} className="line__img"><Img src={l.p.images[0].src} alt={l.p.name} /></Link>
                  <div className="line__info">
                    <Link to={'/product/' + l.slug} onClick={close} className="line__name">{l.p.name}</Link>
                    <div className="muted sm">Size {l.size}</div>
                    <div className="line__row">
                      <div className="qty" role="group" aria-label="Quantity">
                        <button onClick={() => store.setQty(l.slug, l.size, l.qty - 1)} aria-label="Decrease"><Icon name="minus" size={14} /></button>
                        <span aria-live="polite">{l.qty}</span>
                        <button onClick={() => store.setQty(l.slug, l.size, l.qty + 1)} aria-label="Increase"><Icon name="plus" size={14} /></button>
                      </div>
                      <div className="line__price">{price(l.p.price * l.qty)}{l.p.compareAtPrice && <s>{price(l.p.compareAtPrice * l.qty)}</s>}</div>
                    </div>
                    <button className="link sm" onClick={() => store.setQty(l.slug, l.size, 0)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="drawer__foot">
              {saved > 0 && <div className="row-between sm"><span>You save</span><span className="sale">{price(saved)}</span></div>}
              <div className="row-between"><b>Subtotal</b><b>{price(sub)}</b></div>
              <p className="muted sm">Delivery calculated at checkout. Lagos orders arrive within 24 hours.</p>
              <button className="btn btn--block" onClick={() => { close(); go('/checkout'); }}>Checkout</button>
              <a className="btn btn--line btn--block" href={waLink(waText())} target="_blank" rel="noreferrer"><Icon name="chat" size={18} /> Order on WhatsApp</a>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function CardSkeleton() {
  return <div className="card card--skel"><div className="skel" style={{ aspectRatio: '4/5' }} /><div className="skel skel--line" style={{ width: '80%' }} /><div className="skel skel--line" style={{ width: '40%' }} /></div>;
}

Object.assign(window, { ProductCard, CartDrawer, Badge, CardSkeleton });
