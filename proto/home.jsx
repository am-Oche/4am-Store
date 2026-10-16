/* home sections + footer */

function SectionHead({ title, to, cta = 'Shop all', children, eyebrow }) {
  return (
    <div className="sec__head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="h-lg">{title}</h2>
      </div>
      <div className="sec__headR">
        {children}
        {to && <Link to={to} className="link-arrow">{cta} <Icon name="arrow" size={16} /></Link>}
      </div>
    </div>
  );
}

function Hero() {
  const { catalog } = useStore();
  const imgs = window.SITE.heroImages;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI(x => (x + 1) % imgs.length), 6000); return () => clearInterval(t);
  }, []);
  const pills = catalog.categories.slice(0, 4).map(c => ({ label: c.label, to: `/shop/${c.slug}` }))
    .concat(catalog.collections.slice(0, 2).map(c => ({ label: c.name, to: `/collections/${c.slug}` })));
  return (
    <section className="hero" data-screen-label="Home hero">
      <div className="hero__media">
        {imgs.map((k, n) => <img key={k} src={img(k)} alt="" className={n === i ? 'is-on' : ''} loading={n ? 'lazy' : 'eager'} />)}
      </div>
      <div className="hero__copy wrap">
        <div className="eyebrow eyebrow--light">New season · Lagos</div>
        <h1 className="h-hero">Wavy every season.<br />Never basic.</h1>
        <div className="hero__ctas">
          <Link to="/new-arrivals" className="btn btn--light">Shop new arrivals</Link>
          <Link to="/shop/tracksuits-and-two-piece-designs" className="btn btn--ghostLight">Shop tracksuits</Link>
        </div>
        <div className="hero__pills">
          <span className="hero__pillsLbl">Shop top styles</span>
          {pills.map(p => <Link key={p.to} to={p.to} className="pill pill--light">{p.label}</Link>)}
        </div>
      </div>
      <div className="hero__dots" role="tablist" aria-label="Hero slides">
        {imgs.map((k, n) => <button key={k} role="tab" aria-selected={n === i} aria-label={`Slide ${n + 1}`} onClick={() => setI(n)} />)}
      </div>
    </section>
  );
}

function Clock({ iso }) {
  const c = useCountdown(iso);
  const u = [['d', 'Days'], ['h', 'Hrs'], ['m', 'Min'], ['s', 'Sec']];
  return (
    <div className="clock" role="timer" aria-label="Sale ends in">
      {u.map(([k, l]) => <div key={k} className="clock__u"><span key={c[k]} className="clock__n">{String(c[k]).padStart(2, '0')}</span><span className="clock__l">{l}</span></div>)}
    </div>
  );
}

function FlashSale() {
  const { catalog } = useStore();
  const S = window.SITE.flashSale;
  const items = catalog.products.filter(p => p.onSale).sort((a, b) => b.discountPercent - a.discountPercent);
  if (!S.enabled || !items.length) return null;
  const maxOff = Math.max(...items.map(p => p.discountPercent));
  return (
    <section className="sec flash" data-screen-label="Flash sale">
      <div className="wrap flash__grid">
        <Reveal className="flash__panel">
          <div className="eyebrow eyebrow--light"><Icon name="bolt" size={14} fill="currentColor" stroke={0} /> Limited time</div>
          <h2 className="h-xl">{S.title}</h2>
          <p className="flash__off">Up to <b>{maxOff}% off</b></p>
          <div className="flash__ends">Ends in</div>
          <Clock iso={S.endsAt} />
          <Link to="/sale" className="btn btn--light">Shop the sale</Link>
        </Reveal>
        <div className="flash__items">
          {items.length <= 2
            ? <div className={`flash__few n${items.length}`}>{items.map(p => <ProductCard key={p.id} p={p} />)}</div>
            : <Rail ariaLabel="Flash sale products">{items.map(p => <ProductCard key={p.id} p={p} />)}</Rail>}
        </div>
      </div>
    </section>
  );
}

function TrendingRail() {
  const { catalog } = useStore();
  const chips = [{ value: 'all', label: 'All' }, ...catalog.categories.map(c => ({ value: c.slug, label: c.label }))];
  const [tab, setTab] = useState('all');
  const list = catalog.products
    .filter(p => tab === 'all' || p.categories.includes(tab))
    .sort((a, b) => (b.totalOrders + (b.isNew ? 6 : 0)) - (a.totalOrders + (a.isNew ? 6 : 0)))
    .slice(0, 14);
  return (
    <section className="sec" data-screen-label="Shop all trending">
      <div className="wrap">
        <SectionHead title="Shop All Trending" to={tab === 'all' ? '/shop' : `/shop/${tab}`} />
        <Tabs items={chips} value={tab} onChange={setTab} label="Trending categories" variant="chip" className="sec__tabs" />
        <Rail key={tab} ariaLabel="Trending products">{list.map((p, i) => <ProductCard key={p.id} p={p} eager={i < 4} />)}</Rail>
      </div>
    </section>
  );
}

function CollectionTiles() {
  const { catalog } = useStore();
  const COVERS = { signature: 'exfk8hdj4j', wavy: '1exmzw4jez', 'stone-wash': 'k5j42sbt3i', astro: 'hsxia3zei7', legacy: 'da7a7bq17k', dnx: 'jy3s5ufyui', rckstr: '79a4qjvxbj', urban: 'k22puajrp1' };
  const tiles = catalog.collections.filter(c => c.count >= 2).sort((a, b) => b.count - a.count).slice(0, 6).map(c => {
    const first = catalog.products.find(p => p.collections.includes(c.slug));
    return { ...c, cover: COVERS[c.slug] ? img(COVERS[c.slug]) : first.images[0].src };
  });
  return (
    <section className="sec" data-screen-label="Shop by collection">
      <div className="wrap">
        <SectionHead title="Shop by Collection" to="/collections" cta="All collections" />
        <div className="tiles">
          {tiles.map((t, i) => (
            <Reveal key={t.slug} delay={i * 60} className={`tile tile--${i}`}>
              <Link to={`/collections/${t.slug}`} className="tile__link">
                <Img src={t.cover} alt={t.name + ' collection'} ratio="auto" />
                <span className="tile__lbl"><b>{t.name}</b><em>{t.count} styles <Icon name="arrow" size={14} /></em></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function BestSellers() {
  const { catalog } = useStore();
  const list = [...catalog.products].filter(p => p.totalOrders > 0).sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 12);
  if (!list.length) return null;
  return (
    <section className="sec" data-screen-label="Best sellers">
      <div className="wrap">
        <SectionHead title="Best Sellers" to="/best-sellers" eyebrow="Ranked by real orders" />
        <Rail ariaLabel="Best sellers">{list.map((p, i) => (
          <div className="rank" key={p.id}><span className="rank__n" aria-hidden="true">{i + 1}</span><ProductCard p={p} /></div>
        ))}</Rail>
      </div>
    </section>
  );
}

function ExpressBanner() {
  const E = window.SITE.express;
  return (
    <section className="sec" data-screen-label="Express delivery">
      <div className="wrap">
        <Reveal className="express">
          <div className="express__ic"><Icon name="truck" size={40} stroke={1.3} /></div>
          <div className="express__copy">
            <h2 className="h-lg">{E.title}</h2>
            <p className="express__line">{E.line}</p>
            <p className="muted">{E.sub}</p>
          </div>
          <div className="express__ctas">
            <Link to="/shipping" className="btn">Delivery areas</Link>
            <Link to="/track-order" className="btn btn--line">Track an order</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Community() {
  const ims = window.SITE.communityImages;
  return (
    <section className="sec community" data-screen-label="4AM Community">
      <div className="wrap community__grid">
        <Reveal className="community__copy">
          <div className="eyebrow">4AM Community</div>
          <h2 className="h-xl">Made for the ones still out at 4AM.</h2>
          <p className="lead">Premium streetwear from Lagos — tracksuits, sets and signature pieces worn by the 4AM family across Nigeria, Ghana, the UK and the US.</p>
          <div className="community__ctas">
            <a className="btn" href={`https://instagram.com/${window.SITE.instagram}`} target="_blank" rel="noreferrer">Follow @{window.SITE.instagram}</a>
            <Link to="/community" className="link-arrow">Our story <Icon name="arrow" size={16} /></Link>
          </div>
        </Reveal>
        <div className="community__imgs">
          {ims.map((k, i) => <Reveal key={k} delay={i * 80} className={`community__img c${i}`}><Img src={img(k)} alt="4AM community" /></Reveal>)}
        </div>
      </div>
    </section>
  );
}

function Newsletter({ dark }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ s: 'idle' });
  const submit = e => {
    e.preventDefault();
    // mirrors zod: z.string().trim().email().max(254)
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || v.length > 254) return setState({ s: 'err', msg: 'Enter a valid email address.' });
    const list = JSON.parse(localStorage.getItem('4am:newsletter') || '[]');
    if (list.includes(v.toLowerCase())) return setState({ s: 'ok', msg: 'You’re already on the list.' });
    localStorage.setItem('4am:newsletter', JSON.stringify([...list, v.toLowerCase()]));
    setState({ s: 'ok', msg: 'You’re in. Watch your inbox for drops.' }); setEmail('');
  };
  return (
    <section className="news" data-screen-label="Newsletter">
      <div className="wrap news__grid">
        <div>
          <h2 className="h-lg">Be first to every drop</h2>
          <p className="muted">New arrivals, restocks and flash sales — straight to your inbox.</p>
        </div>
        <form className="news__form" onSubmit={submit} noValidate>
          <label htmlFor="nl" className="sr">Email address</label>
          <input id="nl" type="email" placeholder="Email address" value={email} onChange={e => { setEmail(e.target.value); setState({ s: 'idle' }); }}
            aria-invalid={state.s === 'err'} aria-describedby="nl-msg" />
          <button className="btn" type="submit">Sign up</button>
          <p id="nl-msg" className={`news__msg ${state.s}`} role="status">{state.msg || ' '}</p>
        </form>
      </div>
    </section>
  );
}

function PayMarks() {
  const P = window.SITE.payments;
  const marks = [P.paystack && 'Paystack', P.flutterwave && 'Flutterwave', P.stripe && 'Card', P.bankTransfer && 'Bank transfer', P.whatsapp && 'WhatsApp order'].filter(Boolean);
  return <div className="pay">{marks.map(m => <span key={m} className="pay__m">{m}</span>)}</div>;
}

function Footer() {
  const store = useStore();
  const { catalog } = store;
  const S = window.SITE;
  const cols = [
    { h: 'Customer Service', l: [['Help Centre', '/help'], ['Track order', '/track-order'], ['Shipping & delivery', '/shipping'], ['Returns', '/returns'], ['Size guide', '/size-guide'], ['Contact us', '/contact']] },
    { h: 'About 4AM', l: [['Our story', '/about'], ['4AM Community', '/community'], ['Journal', '/blog'], ['Pickup & contact', '/stores']] },
    { h: 'Useful Links', l: [['New Arrivals', '/new-arrivals'], ['Best Sellers', '/best-sellers'], ...catalog.categories.slice(0, 3).map(c => [c.label, '/shop/' + c.slug]), ['Gift cards', '/gift-cards']] },
  ];
  return (
    <footer className="ftr" data-screen-label="Footer">
      <div className="wrap ftr__top">
        <div className="ftr__brand">
          <Logo />
          <p className="ftr__motto">{S.motto}</p>
          <div className="ftr__social">
            <a href={`https://instagram.com/${S.instagram}`} target="_blank" rel="noreferrer">Instagram</a>
            <a href={waLink()} target="_blank" rel="noreferrer">WhatsApp</a>
            <a href={S.catlogStoreUrl} target="_blank" rel="noreferrer">Catlog store</a>
          </div>
          <div className="ftr__cur">
            <span className="sm">Currency</span>
            <Tabs items={S.currency.options.map(c => ({ value: c, label: c === 'NGN' ? '₦ NGN' : '$ USD' }))} value={store.currency} onChange={store.setCurrency} label="Currency" size="sm" variant="dark" />
          </div>
        </div>
        {cols.map(c => (
          <div key={c.h} className="ftr__col">
            <h3>{c.h}</h3>
            <ul>{c.l.map(([t, to]) => <li key={to}><Link to={to}>{t}</Link></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="wrap ftr__bot">
        <PayMarks />
        <div className="ftr__legal">
          <span>© {new Date().getFullYear()} 4AM Originals. Lagos, Nigeria.</span>
          <Link to="/legal/terms">Terms</Link><Link to="/legal/privacy">Privacy</Link><Link to="/legal/cookies">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <FlashSale />
      <TrendingRail />
      <CollectionTiles />
      <BestSellers />
      <ExpressBanner />
      <Community />
    </>
  );
}

Object.assign(window, { HomePage, Footer, Newsletter, SectionHead, Clock, PayMarks });
