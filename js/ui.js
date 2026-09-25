/* Kipu MVP · shared components. Every screen builds from these. */
(function () {
  const K = window.K;
  const { createContext, useContext, useState, useMemo, useEffect, useRef, Fragment } = React;
  const html = htm.bind(React.createElement);
  K.html = html;
  const Ctx = createContext(null);
  K.Ctx = Ctx;
  const useApp = () => useContext(Ctx);
  K.useApp = useApp;

  // ---------------------------------------------------------------- icons
  const P = {
    home: 'M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z',
    wallet: 'M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V9a1.5 1.5 0 0 0-1.5-1.5H5.5M16.5 13.7h.01',
    plan: 'M4 5h16M4 12h10M4 19h6M17 15l2 2 3-4',
    chart: 'M5 20V12M11 20V5M17 20v-9M3 20.5h18',
    trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    plus: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6 6 18', back: 'm15 18-6-6 6-6', next: 'm9 6 6 6-6 6', down: 'm6 9 6 6 6-6', check: 'M20 6 9 17l-5-5',
    up: 'M12 19V5M6 11l6-6 6 6', dn: 'M12 5v14M6 13l6 6 6-6', flat: 'M5 12h14',
    card: 'M3 6h18v12H3zM3 10h18M7 15h4', bank: 'M4 19h16M6 16v-5M10 16v-5M14 16v-5M18 16v-5M3 10l9-5 9 5z', cash: 'M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 10v4M18 10v4',
    loan: 'M4 19h16M6 16V10M10 16V10M14 16V10M18 16V10M3 9l9-5 9 5z', car: 'M5 11 6.6 6.9A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.4L19 11M5 11h14a2 2 0 0 1 2 2v4H3v-4a2 2 0 0 1 2-2zM6 17v2M18 17v2',
    basket: 'M4 9h16l-1.5 10h-13zM8 9l3-5M16 9l-3-5', cup: 'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2M12 3v2',
    bag: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2', repeat: 'M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5',
    ticket: 'M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3zM14 4v16', heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
    plane: 'M10.5 21 12 13l-8-3 16-7-5 18-2.5-3', dots: 'M6 12h.01M12 12h.01M18 12h.01', bolt: 'M13 3 5 14h6l-1 7 8-11h-6z',
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01', flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
    income: 'M12 19V5M5 12l7-7 7 7', transfer: 'M4 8h13l-3-3M20 16H7l3 3', scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10',
    doc: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5', upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3',
    expense: 'M12 5v14M5 12l7 7 7-7', people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6.5 6.5 0 0 1 3.5 6',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', lock: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11', eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    eyeoff: 'M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.5 4.9-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z',
    fx: 'M4 8h13l-3-3M20 16H7l3 3', tag: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01', bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0',
    palette: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1 .2-2.2 1.3-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10zM7.5 11h.01M10 7h.01M15 7.5h.01',
    spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
    sliders: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6', calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
    alert: 'M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5', book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16', phone: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
    monitor: 'M3 5h18v11H3zM8 20h8M12 16v4', review: 'M4 4h16v16H4zM8 9h8M8 13h5M8 17h3', history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2', copy: 'M9 9h11v11H9zM5 15V4h11', star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
    gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10.5 3.5 6 3.5 7 6.5c.4 1 2 .5 5 .5M12 7c1.5-3.5 6-3.5 5-.5-.4 1-2 .5-5 .5', music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    paw: 'M12 12c-3 0-5 3.5-5 5.5 0 1.5 1.5 2 3 1.5 1-.3 1.4-.5 2-.5s1 .2 2 .5c1.5.5 3 0 3-1.5 0-2-2-5.5-5-5.5zM9.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM17.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM6.5 11.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM20.5 11.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
    tool: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
    sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
    moonstar: 'M19 15A7.5 7.5 0 1 1 9 5a6 6 0 0 0 10 10zM17.5 3v3.5M15.75 4.75h3.5', cloud: 'M7 18.5h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 12 3.3 3.3 0 0 0 7 18.5z',
  };
  const Icon = ({ n, s = 18, w = 1.9, c = 'currentColor' }) => html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke=${c} stroke-width=${w} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${P[n] || P.dots}></path></svg>`;
  K.Icon = Icon;

  // ---------------------------------------------------------------- money formatting (one place)
  // Amounts in the model are stored in CA$. Display converts to the chosen base currency at the live rate.
  function makeFmt(settings, data) {
    const base = data.base;
    const num = (n, dec) => Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const core = (n, sym, o) => {
      o = o || {};
      if (n == null || isNaN(n)) return '—';
      if (settings.hide && !o.show) return '••••••';
      const dec = o.dec != null ? o.dec : Math.abs(n) >= 1000 || Number.isInteger(n) ? 0 : 2;
      const sign = n < 0 ? '−' : o.sign && n > 0 ? '+' : '';
      return sign + sym + (sym.length > 1 && /[A-Z/]$/.test(sym) ? ' ' : '') + num(n, dec);
    };
    const f = (v, o) => core(v, K.sym(base), o);
    f.native = (amt, cur, o) => core(amt, K.sym(cur), o);
    f.ctx = (D, amt, o) => (D.cur === 'Combined' ? f(amt, o) : core(amt, K.sym(D.cur), o));
    f.k = (v) => { if (settings.hide) return '•••'; if (v == null) return ''; return Math.abs(v) >= 1000 ? (v / 1000).toFixed(Math.abs(v) >= 100000 ? 0 : 1) + 'k' : String(Math.round(v)); };
    f.sym = K.sym(base); f.base = base;
    return f;
  }
  K.makeFmt = makeFmt;

  // ---------------------------------------------------------------- basic components
  const SectionHeader = ({ title, action, onAction, sub, tag }) => html`<div class="sec-h"><div class="row" style=${{ gap: '8px' }}><h2>${title}</h2>${tag}</div>${action && html`<button class="link" onClick=${onAction}>${action}<${Icon} n="next" s=${14} w=${2.2} /></button>`}${sub && html`<span class="small muted">${sub}</span>`}</div>`;
  K.SectionHeader = SectionHeader;

  // Trend: arrow + text + tone. Never relies on color alone.
  const Trend = ({ d, good, text, small }) => {
    const dir = d > 0.05 ? 'up' : d < -0.05 ? 'dn' : 'flat';
    const tone = dir === 'flat' ? 'neu' : good === null ? 'neu' : good ? 'pos' : 'warn';
    return html`<span class=${'pill ' + tone} style=${small ? { height: '22px', fontSize: '11px' } : null}><${Icon} n=${dir} s=${12} w=${2.4} />${text}</span>`;
  };
  K.Trend = Trend;

  const Metric = ({ label, value, sub, trend, onClick, big, tone }) => {
    const inner = html`<span class="metric stack-s" style=${{ gap: '3px' }}><span class="l">${label}</span><span class="v num" style=${{ fontSize: big ? '26px' : null, color: tone ? 'var(--' + tone + ')' : null }}>${value}</span>${sub && html`<span class="tiny muted num">${sub}</span>`}${trend}</span>`;
    return onClick ? html`<button onClick=${onClick} style=${{ textAlign: 'left' }}>${inner}</button>` : inner;
  };
  K.Metric = Metric;

  const Seg = ({ options, value, onChange, labels }) => html`<div class="seg" role="tablist">${options.map((o, i) => html`<button key=${o} role="tab" aria-selected=${o === value} class=${o === value ? 'on' : ''} onClick=${() => onChange(o)}>${labels ? labels[i] : o}</button>`)}</div>`;
  K.Seg = Seg;
  const Chips = ({ options, value, onChange, labels, scroll }) => html`<div class=${'chips' + (scroll ? ' scroll' : '')}>${options.map((o, i) => html`<button key=${String(o)} class=${'chip' + (o === value ? ' on' : '')} aria-pressed=${o === value} onClick=${() => onChange(o)}>${labels ? labels[i] : o}</button>`)}</div>`;
  K.Chips = Chips;
  const Tabs = ({ tabs, value, onChange }) => html`<div class="tabs" role="tablist">${tabs.map(([k, l]) => html`<button key=${k} role="tab" aria-selected=${k === value} class=${k === value ? 'on' : ''} onClick=${() => onChange(k)}>${l}</button>`)}</div>`;
  K.Tabs = Tabs;
  const Switch = ({ on, onChange, label }) => html`<button role="switch" aria-checked=${!!on} aria-label=${label} class=${'switch' + (on ? ' on' : '')} onClick=${() => onChange(!on)}><i></i></button>`;
  K.Switch = Switch;
  const Bar = ({ pct, color, mark, h }) => html`<div class="bar" style=${{ height: (h || 8) + 'px' }}><i style=${{ width: Math.max(0, Math.min(100, pct)) + '%', background: color || 'var(--acc)' }}></i>${mark != null && html`<span class="mark" style=${{ left: Math.min(99, mark) + '%' }}></span>`}</div>`;
  K.Bar = Bar;
  const Stripe = ({ parts, h }) => { const t = parts.reduce((s, p) => s + Math.max(0, p[0]), 0) || 1; return html`<div class="stripe" style=${{ height: (h || 10) + 'px' }}>${parts.filter((p) => p[0] > 0).map((p, i) => html`<i key=${i} style=${{ width: (p[0] / t) * 100 + '%', background: p[1] }}></i>`)}</div>`; };
  K.Stripe = Stripe;
  const KeyRow = ({ color, label, value, sub, bold }) => html`<div class="between" style=${{ minHeight: '24px' }}><span class="row" style=${{ gap: '10px' }}><span class="dotk" style=${{ background: color }}></span><span class="stack-s" style=${{ gap: '1px' }}><span style=${{ fontSize: '13px', color: 'var(--ink2)', fontWeight: bold ? 600 : 400 }}>${label}</span>${sub && html`<span class="tiny muted">${sub}</span>`}</span></span><span class="amt" style=${{ fontSize: '14px', fontWeight: bold ? 700 : 600 }}>${value}</span></div>`;
  K.KeyRow = KeyRow;
  const Tile = ({ icon, tone, s }) => html`<span class=${'ic ' + (tone || 'n')} style=${s ? { width: s + 'px', height: s + 'px' } : null}><${Icon} n=${icon} s=${17} /></span>`;
  K.Tile = Tile;

  const Row = ({ icon, tone, title, sub, right, rightSub, onClick, chevron, children }) => {
    const inner = html`${icon && html`<${Tile} icon=${icon} tone=${tone} />`}<span class="grow stack-s" style=${{ gap: '2px' }}><span class="t1" style=${{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${title}</span>${sub && html`<span class="t2">${sub}</span>`}${children}</span>${(right || rightSub) && html`<span class="stack-s" style=${{ gap: '2px', alignItems: 'flex-end' }}><span class="amt">${right}</span>${rightSub && html`<span class="t2 num">${rightSub}</span>`}</span>`}${chevron && html`<span class="muted"><${Icon} n="next" s=${15} w=${2.2} /></span>`}`;
    return onClick ? html`<button class="lrow" onClick=${onClick}>${inner}</button>` : html`<div class="lrow">${inner}</div>`;
  };
  K.Row = Row;

  const Card = ({ children, flat, tight, style, onClick }) => onClick
    ? html`<button class=${'card' + (flat ? ' flat' : '') + (tight ? ' tight' : '')} style=${Object.assign({ display: 'block', width: '100%' }, style)} onClick=${onClick}>${children}</button>`
    : html`<div class=${'card' + (flat ? ' flat' : '') + (tight ? ' tight' : '')} style=${style}>${children}</div>`;
  K.Card = Card;

  const EmptyState = ({ icon, title, text, action, onAction }) => html`<div class="empty"><${Tile} icon=${icon || 'info'} tone="p" /><strong style=${{ fontSize: '15px' }}>${title}</strong><span class="small muted" style=${{ maxWidth: '34ch', lineHeight: 1.5 }}>${text}</span>${action && html`<button class="btn sec sm" onClick=${onAction}>${action}</button>`}</div>`;
  K.EmptyState = EmptyState;

  // ---------------------------------------------------------------- domain components
  const TxnRow = ({ t }) => {
    const { go, fmt, data } = useApp();
    const cat = K.CATS[t.cat];
    const isIn = t.type === 'income';
    const icon = t.type === 'income' ? 'income' : t.type === 'saving' ? 'target' : t.type === 'debt' ? 'loan' : t.type === 'transfer' ? 'transfer' : cat ? cat.icon : 'dots';
    const tone = t.type === 'income' ? 'g' : t.type === 'saving' ? 'p' : t.type === 'debt' ? 'b' : t.type === 'transfer' ? 'n' : cat ? cat.tone : 'n';
    const src = K.whereName(data, t.from);
    const label = t.type === 'saving' ? 'Saved to goal' : t.type === 'debt' ? 'Loan payment' : t.type === 'transfer' ? 'Transfer' : isIn ? 'Income' : cat ? cat.name : '';
    const main = (isIn ? '+' : '') + (t.cur === data.base ? fmt(t.base) : fmt.native(t.amt, t.cur));
    return html`<${Row} icon=${icon} tone=${tone} title=${t.merchant} sub=${label + ' · ' + K.fmtDate(t.date) + (src ? ' · ' + src : '') + (t.trip ? ' · Trip' : '')} right=${html`<span style=${{ color: isIn ? 'var(--pos)' : null }}>${main}</span>`} rightSub=${t.cur !== data.base ? fmt(t.base) + (t.estimate ? ' est.' : '') : null} onClick=${() => go({ r: 'txn', id: t.id })} />`;
  };
  K.TxnRow = TxnRow;

  const AccountRow = ({ a }) => {
    const { go, fmt, data } = useApp();
    const icon = a.kind === 'Savings' ? 'target' : a.kind === 'Cash' ? 'cash' : a.kind === 'Investments' ? 'trend' : a.kind === 'Property' ? 'car' : 'bank';
    const tone = a.kind === 'Savings' ? 'p' : a.kind === 'Investments' ? 'g' : a.kind === 'Cash' ? 'a' : 'b';
    return html`<${Row} icon=${icon} tone=${tone} title=${a.name} sub=${(a.inst || a.kind) + (a.shared ? ' · Shared' : '')} right=${a.cur === data.base ? fmt(a.bal) : fmt.native(a.bal, a.cur)} rightSub=${a.cur !== data.base ? '≈ ' + fmt(a.baseBal) : null} onClick=${() => go({ r: 'account', id: a.id })} />`;
  };
  K.AccountRow = AccountRow;

  // Default card looks when the person hasn't chosen one: theme gradient, theme solid, graphite
  const CARD_DEFAULTS = ['var(--grad)', 'var(--solid)', 'linear-gradient(140deg, #1C1C1E 0%, #48484C 100%)'];
  K.cardInk = (c) => (c.look && c.look.kind && c.look.kind !== 'theme' ? K.inkFor(c.look) : (c.style != null ? c.style : [...String(c.id || '')].reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3 === 2 ? '#FFFFFF' : 'var(--hero-ink)');
  K.cardBg = (c) => K.lookBg(c.look, CARD_DEFAULTS[(c.style != null ? c.style : [...String(c.id || '')].reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3]);
  K.expiryInfo = (c) => {
    if (!c.expiry) return null;
    const [y, m] = c.expiry.split('-').map(Number);
    const end = new Date(y, m, 0);
    const days = K.days(K.today(), end);
    return { label: K.pad(m) + '/' + String(y).slice(2), days, expired: days < 0, soon: days >= 0 && days <= 60, end };
  };
  const CardPreview = ({ c, selected, onClick, compact }) => {
    const { fmt, data } = useApp();
    const util = c.limit ? (c.bal / c.limit) * 100 : 0;
    const ex = K.expiryInfo(c);
    return html`<button onClick=${onClick} aria-label=${c.name} style=${{ position: 'relative', overflow: 'hidden', width: compact ? '220px' : '100%', flexShrink: 0, aspectRatio: '1.6', maxWidth: '100%', borderRadius: '20px', padding: '16px', color: K.cardInk(c), background: K.cardBg(c), display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: selected ? 'var(--glow)' : '0 8px 20px rgba(10, 8, 30, 0.18)', textAlign: 'left' }}>
      <span aria-hidden="true" style=${{ position: 'absolute', right: '-50px', top: '-70px', width: '200px', height: '200px', borderRadius: '999px', background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)', pointerEvents: 'none' }}></span>
      <span class="between"><span style=${{ fontSize: '13px', fontWeight: 600, opacity: 0.92 }}>${c.name}</span><span style=${{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.85 }}>${(c.network || '').toUpperCase()}</span></span>
      <span class="stack-s" style=${{ gap: '2px' }}><span style=${{ fontSize: '11px', opacity: 0.75 }}>Balance</span><span class="disp num" style=${{ fontSize: '24px', fontWeight: 700 }}>${fmt.native(c.bal, c.cur || data.base)}</span></span>
      <span class="between" style=${{ fontSize: '12px', opacity: 0.9 }}><span class="num">${c.last4 ? '•••• ' + c.last4 : ''}${ex ? '  ·  ' + ex.label : ''}</span><span class="num">${util.toFixed(0)}% used</span></span>
    </button>`;
  };
  K.CardPreview = CardPreview;

  const LoanRow = ({ l }) => {
    const { go, fmt } = useApp();
    const pct = l.orig ? ((l.orig - l.bal) / l.orig) * 100 : 0;
    return html`<button class="lrow" style=${{ alignItems: 'flex-start', flexDirection: 'column', gap: '8px' }} onClick=${() => go({ r: 'loan', id: l.id })}>
      <span class="between" style=${{ width: '100%' }}><span class="row"><${Tile} icon=${l.kind === 'Vehicle' ? 'car' : 'loan'} tone="b" /><span class="stack-s" style=${{ gap: '2px' }}><span class="t1">${l.name}</span><span class="t2">${(l.rate || 0).toFixed(2)}% · ${fmt(l.pay || 0, { dec: 2 })} ${(l.freq || '').toLowerCase()}</span></span></span><span class="stack-s" style=${{ gap: '2px', alignItems: 'flex-end' }}><span class="amt">${fmt(l.bal)}</span><span class="t2">left</span></span></span>
      <span style=${{ width: '100%' }}><${K.Segs} pct=${pct} color="var(--acc)" h=${6} /></span>
      <span class="between tiny muted" style=${{ width: '100%' }}><span>${pct.toFixed(0)}% paid off</span><span>${K.payoffDate(l).label}</span></span>
    </button>`;
  };
  K.LoanRow = LoanRow;

  const GoalProgress = ({ g, onClick, featured }) => {
    const { fmt } = useApp();
    const styled = featured || (g.look && g.look.kind && g.look.kind !== 'theme');
    const sub = g.pct >= 100 ? 'Funded' : g.monthly ? 'On track for ' + g.etaLabel : 'No monthly amount yet';
    const ink = K.inkFor(g.look);
    if (styled) return html`<button class="card" style=${{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', background: K.lookBg(g.look, 'var(--grad2)'), color: ink, border: 0, boxShadow: 'var(--glow)' }} onClick=${onClick}>
      <span aria-hidden="true" style=${{ position: 'absolute', right: '-60px', top: '-80px', width: '220px', height: '220px', borderRadius: '999px', background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)' }}></span>
      <span class="between"><span class="row" style=${{ gap: '10px' }}><span class="ic" style=${{ background: 'color-mix(in srgb, ' + ink + ' 18%, transparent)', color: ink }}><${Icon} n=${g.trip ? 'plane' : 'target'} s=${17} /></span><span class="stack-s" style=${{ gap: '2px', textAlign: 'left' }}><span class="t1" style=${{ fontWeight: 600 }}>${g.name}</span><span class="t2" style=${{ color: 'color-mix(in srgb, ' + ink + ' 78%, transparent)' }}>${sub}${g.shared ? ' · Shared' : ''}</span></span></span><span class="disp num" style=${{ fontWeight: 800, fontSize: '22px' }}>${g.pct}%</span></span>
      <${K.Segs} pct=${g.pct} color=${ink} track=${'color-mix(in srgb, ' + ink + ' 25%, transparent)'} />
      <span class="between tiny num" style=${{ color: 'color-mix(in srgb, ' + ink + ' 82%, transparent)' }}><span>${fmt(g.savedNow)} of ${fmt(g.target)}</span><span>${g.monthly ? fmt(g.monthly) + ' a month' : 'No monthly amount'}</span></span>
    </button>`;
    return html`<button class="card" style=${{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }} onClick=${onClick}>
      <span class="between"><span class="row" style=${{ gap: '10px' }}><${Tile} icon=${g.trip ? 'plane' : 'target'} tone="p" /><span class="stack-s" style=${{ gap: '2px', textAlign: 'left' }}><span class="t1">${g.name}</span><span class="t2">${sub}${g.shared ? ' · Shared' : ''}</span></span></span><span class="disp num" style=${{ fontWeight: 700, fontSize: '17px' }}>${g.pct}%</span></span>
      <${K.Segs} pct=${g.pct} color=${g.pct >= 100 ? 'var(--pos2)' : 'var(--acc)'} />
      <span class="between tiny muted num"><span>${fmt(g.savedNow)} of ${fmt(g.target)}</span><span>${g.monthly ? fmt(g.monthly) + ' a month' : 'No monthly amount'}</span></span>
    </button>`;
  };
  K.GoalProgress = GoalProgress;

  const UpcomingItem = ({ u }) => {
    const { go, fmt } = useApp();
    const d = K.parse(u.date);
    const tone = u.kind === 'Card due' ? 'b' : u.kind === 'Loan payment' ? 'b' : u.kind === 'Planned saving' ? 'p' : u.kind === 'Subscription' ? 'a' : 'n';
    return html`<button class="lrow" onClick=${() => go(u.route)}>
      <span class="stack-s" style=${{ width: '40px', alignItems: 'center', gap: 0 }}><span class="tiny muted">${K.MON[d.getMonth()].toUpperCase()}</span><span class="disp num" style=${{ fontSize: '18px', fontWeight: 700 }}>${d.getDate()}</span></span>
      <span class="grow stack-s" style=${{ gap: '2px' }}><span class="t1">${u.name}</span><span class="t2">${u.kind}</span></span>
      <span class="amt">${fmt(u.amt)}</span></button>`;
  };
  K.UpcomingItem = UpcomingItem;

  const InsightCard = ({ i, compact }) => {
    const { go } = useApp();
    const tone = { Priority: 'a', Spending: 'a', Savings: 'g', Debt: 'b', Credit: 'b', Goals: 'p', Recurring: 'p' }[i.kind] || 'p';
    return html`<button class="card" style=${{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%', borderColor: i.kind === 'Priority' ? 'color-mix(in srgb, var(--warn2) 45%, var(--line))' : null }} onClick=${() => go(i.route)}>
      <${Tile} icon=${i.icon} tone=${tone} />
      <span class="grow stack-s" style=${{ gap: '6px' }}><span class="row" style=${{ gap: '6px' }}><span class="tag" style=${{ background: 'var(--surface2)', color: 'var(--muted)' }}>${i.kind}</span></span><span style=${{ fontSize: '15px', lineHeight: 1.45, fontWeight: 500 }}>${i.title}</span>${!compact && i.why && html`<span class="small muted" style=${{ lineHeight: 1.5 }}>${i.why}</span>`}<span class="link">${i.cta}<${Icon} n="next" s=${13} w=${2.2} /></span></span></button>`;
  };
  K.InsightCard = InsightCard;

  const ChartBox = ({ title, question, tag, children, footer, legend }) => html`<div class="card stack" style=${{ gap: '14px' }}>
    <div class="stack-s" style=${{ gap: '4px' }}><div class="between"><h3 style=${{ fontSize: '16px' }}>${title}</h3>${tag}</div>${question && html`<span class="small muted">${question}</span>`}</div>
    ${children}${legend && html`<div class="legend">${legend.map(([c, l, dash]) => html`<span key=${l}><i class="dotk" style=${{ background: dash ? 'transparent' : c, border: dash ? '1.5px dashed ' + c : null }}></i>${l}</span>`)}</div>`}${footer}</div>`;
  K.ChartBox = ChartBox;

  // ---------------------------------------------------------------- charts (SVG, drawn to one scale)
  const niceMax = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; };
  // series: [{ values:[..], color, dash, area, label }], labels:[..], ref:{ value, label, color }
  const LineChart = ({ labels, series, h = 170, ref, min, fmtY, highlight, split }) => {
    const W = 600, pl = 44, pr = 12, pt = 16, pb = 24;
    const all = series.flatMap((s) => s.values.filter((v) => v != null)).concat(ref ? [ref.value] : []);
    let lo = min != null ? min : Math.min(...all), hi = Math.max(...all);
    if (min == null) { const pad = (hi - lo) * 0.15 || hi * 0.1; lo = Math.max(0, lo - pad); }
    hi = hi + (hi - lo) * 0.08;
    const X = (i) => pl + (i * (W - pl - pr)) / Math.max(1, labels.length - 1);
    const Y = (v) => pt + (1 - (v - lo) / (hi - lo || 1)) * (h - pt - pb);
    const ticks = [0, 0.5, 1].map((t) => lo + t * (hi - lo));
    const step = labels.length > 14 ? 3 : labels.length > 9 ? 2 : 1;
    return html`<svg class="chart" viewBox=${'0 0 ' + W + ' ' + h} width="100%" role="img" style=${{ display: 'block', overflow: 'visible' }}>
      ${ticks.map((t, i) => html`<g key=${i}><line x1=${pl} x2=${W - pr} y1=${Y(t)} y2=${Y(t)} stroke="var(--line)" stroke-width="1"></line><text x=${pl - 8} y=${Y(t) + 3} text-anchor="end">${fmtY ? fmtY(t) : Math.round(t)}</text></g>`)}
      ${split != null && html`<g><rect x=${X(split)} y=${pt - 6} width=${W - pr - X(split)} height=${h - pt - pb + 6} fill="var(--surface2)" opacity="0.6"></rect><text x=${X(split) + 6} y=${pt + 4} style=${{ fontWeight: 600 }}>Projected</text></g>`}
      ${ref && html`<g><line x1=${pl} x2=${W - pr} y1=${Y(ref.value)} y2=${Y(ref.value)} stroke=${ref.color || 'var(--warn2)'} stroke-width="1.5" stroke-dasharray="5 5"></line><text x=${W - pr} y=${Y(ref.value) - 6} text-anchor="end" style=${{ fill: ref.color || 'var(--warn)' }}>${ref.label}</text></g>`}
      ${series.map((s, k) => {
        const pts = s.values.map((v, i) => (v == null ? null : [X(i), Y(v)])).filter(Boolean);
        if (!pts.length) return null;
        const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
        const area = s.area ? d + ' L' + pts[pts.length - 1][0].toFixed(1) + ',' + Y(lo).toFixed(1) + ' L' + pts[0][0].toFixed(1) + ',' + Y(lo).toFixed(1) + ' Z' : null;
        const last = pts[pts.length - 1];
        return html`<g key=${k}>${area && html`<path d=${area} fill=${s.color} opacity="0.1"></path>`}<path d=${d} fill="none" stroke=${s.color} stroke-width=${s.w || 2.4} stroke-dasharray=${s.dash ? '6 5' : null} stroke-linejoin="round" stroke-linecap="round"></path>${!s.noDot && html`<circle cx=${last[0]} cy=${last[1]} r="4" fill=${s.color} stroke="var(--surface)" stroke-width="2"></circle>`}</g>`;
      })}
      ${highlight && highlight.map((hl, k) => html`<g key=${'h' + k}><circle cx=${X(hl.i)} cy=${Y(hl.v)} r="5" fill=${hl.color} stroke="var(--surface)" stroke-width="2"></circle><text class="lbl" x=${X(hl.i)} y=${Y(hl.v) + (hl.below ? 18 : -10)} text-anchor="middle">${hl.label}</text></g>`)}
      ${labels.map((l, i) => (i % step === 0 || i === labels.length - 1) && html`<text key=${'x' + i} x=${X(i)} y=${h - 6} text-anchor="middle">${l}</text>`)}
    </svg>`;
  };
  K.LineChart = LineChart;

  // groups: [{ label, values:[v1, v2...] }], colors per value index; stacked or side by side
  const BarChart = ({ groups, colors, h = 160, stacked, fmtY, hi, ref, labelTop }) => {
    const W = 600, pl = 44, pr = 8, pt = 18, pb = 24;
    const tot = groups.map((g) => (stacked ? g.values.reduce((s, v) => s + Math.max(0, v), 0) : Math.max(...g.values)));
    const mx = niceMax(Math.max(...tot, ref ? ref.value : 0));
    const Y = (v) => pt + (1 - v / mx) * (h - pt - pb);
    const slot = (W - pl - pr) / groups.length, bw = Math.min(34, slot * (stacked ? 0.56 : 0.72));
    return html`<svg class="chart" viewBox=${'0 0 ' + W + ' ' + h} width="100%" role="img" style=${{ display: 'block' }}>
      ${[0, 0.5, 1].map((t, i) => html`<g key=${i}><line x1=${pl} x2=${W - pr} y1=${Y(t * mx)} y2=${Y(t * mx)} stroke="var(--line)"></line><text x=${pl - 8} y=${Y(t * mx) + 3} text-anchor="end">${fmtY ? fmtY(t * mx) : Math.round(t * mx)}</text></g>`)}
      ${ref && html`<line x1=${pl} x2=${W - pr} y1=${Y(ref.value)} y2=${Y(ref.value)} stroke=${ref.color || 'var(--warn2)'} stroke-dasharray="5 5" stroke-width="1.5"></line>`}
      ${groups.map((g, i) => {
        const cx = pl + slot * i + slot / 2;
        let acc = 0;
        const n = g.values.length;
        return html`<g key=${i} opacity=${hi != null && hi !== i ? 0.55 : 1}>
          ${g.values.map((v, j) => {
            if (stacked) { const y0 = Y(acc), y1 = Y(acc + Math.max(0, v)); acc += Math.max(0, v); return html`<rect key=${j} x=${cx - bw / 2} y=${y1} width=${bw} height=${Math.max(0, y0 - y1)} rx="3" fill=${(g.colors || colors)[j]}></rect>`; }
            const w = bw / n, x = cx - bw / 2 + j * w;
            return html`<rect key=${j} x=${x + 1} y=${Y(Math.max(0, v))} width=${w - 2} height=${Math.max(0, Y(0) - Y(Math.max(0, v)))} rx="3" fill=${(g.colors || colors)[j]} opacity=${g.dash && j === n - 1 ? 0.45 : 1}></rect>`;
          })}
          ${labelTop && hi === i && html`<text class="lbl" x=${cx} y=${Y(tot[i]) - 6} text-anchor="middle">${labelTop(tot[i])}</text>`}
          <text x=${cx} y=${h - 6} text-anchor="middle" style=${hi === i ? { fill: 'var(--ink)', fontWeight: 700 } : null}>${g.label}</text></g>`;
      })}
    </svg>`;
  };
  K.BarChart = BarChart;

  const Sheet = ({ title, sub, onClose, children, label }) => html`<div class="sheet-bg" onClick=${(e) => e.target === e.currentTarget && onClose()}>
    <div class="sheet" role="dialog" aria-modal="true" aria-label=${label || title}>
      <div class="grab"></div>
      ${title && html`<div class="between" style=${{ alignItems: 'flex-start' }}><div class="stack-s" style=${{ gap: '4px' }}><h2 style=${{ fontSize: '22px' }}>${title}</h2>${sub && html`<span class="small muted" style=${{ lineHeight: 1.45 }}>${sub}</span>`}</div><button class="ic n" style=${{ borderRadius: '999px' }} aria-label="Close" onClick=${onClose}><${Icon} n="x" s=${16} w=${2.2} /></button></div>`}
      ${children}
    </div></div>`;
  K.Sheet = Sheet;

  // One context control: scope · currency · period
  const ContextFilter = ({ show }) => {
    const { ctx, data, openSheet, D, cloud } = useApp();
    const parts = [];
    if (cloud.target === 'household' || (data.household.enabled && show.includes('scope'))) parts.push(cloud.target === 'household' || ctx.scope === 'household' ? 'Household' : 'Personal');
    if (show.includes('currency')) parts.push(ctx.currency === 'Combined' ? 'All · ' + K.sym(data.base) : ctx.currency);
    if (show.includes('period')) { const S = D.series; parts.push(ctx.period === 'ytd' ? 'Last 12 months' : S[ctx.period].m + ' ' + S[ctx.period].y); }
    return html`<button class="chip" style=${{ background: 'var(--surface)', border: '1px solid var(--line)' }} onClick=${() => openSheet({ k: 'context', show })} aria-label="Change scope, currency or period"><${Icon} n=${ctx.scope === 'household' ? 'people' : 'user'} s=${14} />${show.includes('currency') && ctx.currency !== 'Combined' && html`<${K.Flag} cur=${ctx.currency} s=${16} />`}${parts.join(' · ')}<${Icon} n="down" s=${14} w=${2.2} /></button>`;
  };
  K.ContextFilter = ContextFilter;

  const Field = ({ label, children, hint }) => html`<label class="field"><span>${label}</span>${children}${hint && html`<span class="tiny muted" style=${{ fontWeight: 400 }}>${hint}</span>`}</label>`;
  K.Field = Field;

  const ToggleRow = ({ title, sub, on, onChange, icon, tone }) => html`<div class="lrow">${icon && html`<${Tile} icon=${icon} tone=${tone} />`}<span class="grow stack-s" style=${{ gap: '2px' }}><span class="t1">${title}</span>${sub && html`<span class="t2" style=${{ lineHeight: 1.4 }}>${sub}</span>`}</span><${Switch} on=${on} onChange=${onChange} label=${title} /></div>`;
  K.ToggleRow = ToggleRow;

  const PageHead = ({ eyebrow, title, sub, right }) => html`<header class="between" style=${{ alignItems: 'flex-end', paddingTop: '4px' }}><div class="stack-s" style=${{ gap: '6px' }}>${eyebrow && html`<span class="eyebrow">${eyebrow}</span>`}<h1 style=${{ fontSize: '30px', lineHeight: '36px', fontWeight: 800 }}>${title}</h1>${sub && html`<p class="muted" style=${{ fontSize: '15px', lineHeight: 1.45 }}>${sub}</p>`}</div>${right}</header>`;
  K.PageHead = PageHead;

  // ---------------------------------------------------------------- make or edit a category
  const CAT_ICONS = ['tag', 'basket', 'cup', 'bag', 'car', 'home', 'heart', 'plane', 'book', 'ticket', 'bolt', 'people', 'gift', 'paw', 'music', 'tool', 'target', 'spark'];
  const CAT_TONES = [['p', 'Theme'], ['b', 'Blue'], ['g', 'Green'], ['a', 'Amber'], ['r', 'Rose'], ['n', 'Gray']];
  K.CategoryForm = function CategoryForm({ initial, onSave, onCancel, saveLabel }) {
    const { data } = useApp();
    const [name, setName] = useState((initial && initial.name) || '');
    const [icon, setIcon] = useState((initial && initial.icon) || 'tag');
    const [tone, setTone] = useState((initial && initial.tone) || 'p');
    const clash = name.trim() && Object.keys(K.CATS).some((k) => K.CATS[k].name.toLowerCase() === name.trim().toLowerCase() && (!initial || k !== initial.id));
    return html`<div class="card flat stack-s" style=${{ gap: '12px' }}>
      <div class="row" style=${{ gap: '10px' }}><${Tile} icon=${icon} tone=${tone} /><input class="input grow" aria-label="Category name" placeholder="e.g. Pets, Gifts, Kids" value=${name} maxlength="28" autofocus onInput=${(e) => setName(e.target.value)} style=${{ background: 'var(--surface)' }} /></div>
      ${clash && html`<span class="tiny" style=${{ color: 'var(--warn)' }}>There’s already a category with that name.</span>`}
      <div class="grid" style=${{ gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '6px' }}>${CAT_ICONS.map((ic) => html`<button key=${ic} type="button" aria-label=${ic} aria-pressed=${icon === ic} onClick=${() => setIcon(ic)} style=${{ height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: icon === ic ? 'var(--accbg)' : 'var(--surface)', color: icon === ic ? 'var(--acc)' : 'var(--ink2)', boxShadow: icon === ic ? 'inset 0 0 0 1.5px var(--acc)' : 'none' }}><${Icon} n=${ic} s=${18} /></button>`)}</div>
      <div class="row" style=${{ gap: '8px', flexWrap: 'wrap' }}>${CAT_TONES.map(([t, l]) => html`<button key=${t} type="button" aria-label=${l} aria-pressed=${tone === t} onClick=${() => setTone(t)} class="ic" style=${{ width: '32px', height: '32px', borderRadius: '999px', color: '#FFFFFF', background: { p: 'var(--acc)', b: 'var(--info2)', g: 'var(--pos2)', a: 'var(--warn2)', r: 'var(--crit2)', n: 'var(--muted)' }[t], boxShadow: tone === t ? '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)' : 'none' }}>${tone === t && html`<${Icon} n="check" s=${14} w=${2.6} />`}</button>`)}</div>
      <div class="grid g2" style=${{ gap: '8px' }}><button type="button" class="btn sec sm" onClick=${onCancel}>Cancel</button><button type="button" class="btn pri sm" disabled=${!name.trim() || clash} onClick=${() => onSave({ name: name.trim(), icon, tone })}>${saveLabel || 'Add category'}</button></div></div>`;
  };

  // ---------------------------------------------------------------- segmented progress (budget, utilization, goals, payoff, trips)
  // tone: a CSS color; mark: a target marker in percent
  const Segs = ({ pct, n = 20, color, h = 8, mark, gap = 3, track, markColor }) => {
    const filled = Math.max(0, Math.min(n, Math.round(((pct || 0) / 100) * n)));
    return html`<div style=${{ position: 'relative', display: 'flex', gap: gap + 'px', paddingTop: mark != null ? '4px' : 0, paddingBottom: mark != null ? '4px' : 0 }} role="img" aria-label=${Math.round(pct || 0) + '%'}>
      ${Array.from({ length: n }, (_, i) => html`<i key=${i} style=${{ flex: 1, height: h + 'px', borderRadius: Math.min(3, h / 2) + 'px', background: i < filled ? color || 'var(--acc)' : track || 'var(--neutral)' }}></i>`)}
      ${mark != null && html`<span style=${{ position: 'absolute', top: 0, bottom: 0, left: 'calc(' + Math.min(99.5, Math.max(0, mark)) + '% - 1px)', width: '2px', borderRadius: '2px', background: markColor || 'var(--ink)' }}></span>`}</div>`;
  };
  K.Segs = Segs;
  // Theme color unless there is a real problem
  K.stateColor = (pct, warnAt, critAt) => (critAt != null && pct > critAt ? 'var(--crit2)' : warnAt != null && pct > warnAt ? 'var(--warn2)' : 'var(--acc)');

  // ---------------------------------------------------------------- date pickers: tap a date field, pick from a calendar
  K.ord = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
  const PickerField = ({ label, hint, open, onToggle, display, icon, children, placeholder }) => html`<div class="field"><span>${label}</span>
    <button type="button" class="input row" aria-expanded=${open} style=${{ gap: '10px', justifyContent: 'space-between', textAlign: 'left', borderColor: open ? 'var(--acc)' : null, background: open ? 'var(--surface)' : null }} onClick=${onToggle}><span style=${{ color: display ? null : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${display || placeholder || 'Choose'}</span><${Icon} n=${icon || 'calendar'} s=${17} c="var(--muted)" /></button>
    ${open && html`<div class="picker">${children}</div>`}
    ${hint && html`<span class="tiny muted" style=${{ fontWeight: 400 }}>${hint}</span>`}</div>`;
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // A regular month calendar: selected date on top, full weeks with the neighbouring months' days, tap the month to jump
  const Calendar = ({ value, onPick, onClear, min, max }) => {
    const sel = value ? K.parse(value) : null;
    const [view, setView] = useState(() => { const d = sel || K.today(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [jump, setJump] = useState(false);
    const [jy, setJy] = useState(view.getFullYear());
    const T = K.iso(K.today());
    const start = K.addDays(view, -view.getDay());
    const weeks = Math.ceil((view.getDay() + new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()) / 7);
    const cells = Array.from({ length: weeks * 7 }, (_, i) => K.addDays(start, i));
    const move = (m) => setView(new Date(view.getFullYear(), view.getMonth() + m, 1));
    const pick = (s) => { const d = K.parse(s); setView(new Date(d.getFullYear(), d.getMonth(), 1)); onPick(s); };
    return html`<div class="stack-s" style=${{ gap: '10px' }}>
      <div class="cal-head"><span class="small" style=${{ opacity: 0.8 }}>${sel ? WEEKDAY[sel.getDay()] : 'No date chosen'}</span><span class="disp" style=${{ fontSize: '24px', fontWeight: 800 }}>${sel ? K.MONTH_LONG[sel.getMonth()] + ' ' + sel.getDate() + ', ' + sel.getFullYear() : 'Pick a day'}</span></div>
      <div class="between"><button type="button" class="chip" aria-expanded=${jump} onClick=${() => { setJy(view.getFullYear()); setJump(!jump); }} style=${{ fontWeight: 700, color: 'var(--ink)' }}>${K.MONTH_LONG[view.getMonth()]} ${view.getFullYear()}<${Icon} n=${jump ? 'x' : 'down'} s=${14} w=${2.2} /></button>
        ${!jump && html`<span class="row" style=${{ gap: '6px' }}><button type="button" class="ic n" aria-label="Previous month" onClick=${() => move(-1)}><${Icon} n="back" s=${16} w=${2.2} /></button><button type="button" class="ic n" aria-label="Next month" onClick=${() => move(1)}><${Icon} n="next" s=${16} w=${2.2} /></button></span>`}</div>
      ${jump ? html`<div class="stack-s" style=${{ gap: '8px' }}><div class="between"><button type="button" class="ic n" aria-label="Previous year" onClick=${() => setJy(jy - 1)}><${Icon} n="back" s=${16} w=${2.2} /></button><b>${jy}</b><button type="button" class="ic n" aria-label="Next year" onClick=${() => setJy(jy + 1)}><${Icon} n="next" s=${16} w=${2.2} /></button></div>
          <div class="cal months">${K.MON.map((m, i) => html`<button key=${m} type="button" aria-pressed=${jy === view.getFullYear() && i === view.getMonth()} class=${jy === view.getFullYear() && i === view.getMonth() ? 'on' : ''} onClick=${() => { setView(new Date(jy, i, 1)); setJump(false); }}>${m}</button>`)}</div></div>`
        : html`<div class="cal">${WD.map((w) => html`<span key=${w} class="wd">${w}</span>`)}${cells.map((d) => { const s = K.iso(d); const out = d.getMonth() !== view.getMonth(); const off = (min && s < min) || (max && s > max); return html`<button key=${s} type="button" disabled=${off} aria-pressed=${value === s} aria-label=${WEEKDAY[d.getDay()] + ', ' + K.fmtDate(s, true)} class=${[value === s ? 'on' : '', s === T ? 'today' : '', out ? 'out' : ''].join(' ')} onClick=${() => pick(s)}>${d.getDate()}</button>`; })}</div>`}
      <div class="between"><button type="button" class="link" onClick=${() => pick(T)}>Today</button>${onClear && html`<button type="button" class="link" style=${{ color: 'var(--muted)' }} onClick=${onClear}>Clear</button>`}</div></div>`;
  };
  K.Calendar = Calendar;
  K.DateInput = function DateInput({ label, value, onChange, hint, optional, min, max, placeholder }) {
    const [open, setOpen] = useState(false);
    const d = value ? K.parse(value) : null;
    const display = d ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
    return html`<${PickerField} label=${label} hint=${hint} open=${open} onToggle=${() => setOpen(!open)} display=${display} placeholder=${placeholder || 'Choose a date'}><${Calendar} value=${value} min=${min} max=${max} onPick=${(s) => { onChange(s); setOpen(false); }} onClear=${optional ? () => { onChange(''); setOpen(false); } : null} /></${PickerField}>`;
  };
  // Day of the month, for due dates, closing dates and bills
  K.DayInput = function DayInput({ label, value, onChange, hint, max, optional, placeholder }) {
    const [open, setOpen] = useState(false);
    const n = parseInt(value) || null;
    return html`<${PickerField} label=${label} hint=${hint} open=${open} onToggle=${() => setOpen(!open)} display=${n ? K.ord(n) + ' of the month' : ''} placeholder=${placeholder || 'Choose a day'}>
      <div class="cal days">${Array.from({ length: max || 31 }, (_, i) => i + 1).map((d) => html`<button key=${d} type="button" aria-pressed=${n === d} class=${n === d ? 'on' : ''} onClick=${() => { onChange(String(d)); setOpen(false); }}>${d}</button>`)}</div>
      ${(max || 31) > 28 && html`<span class="tiny muted">In shorter months, days past the end use the last day.</span>`}${optional && n && html`<button type="button" class="link" style=${{ color: 'var(--muted)', alignSelf: 'flex-start' }} onClick=${() => { onChange(''); setOpen(false); }}>Clear</button>`}</${PickerField}>`;
  };
  // Month and year ('YYYY-MM'), for card expiry and goal target months
  K.MonthInput = function MonthInput({ label, value, onChange, hint, optional, placeholder, fromYear }) {
    const [open, setOpen] = useState(false);
    const [y0, m0] = value ? value.split('-').map(Number) : [K.today().getFullYear(), 0];
    const [year, setYear] = useState(y0);
    const display = value ? K.MON[m0 - 1] + ' ' + y0 : '';
    const minY = fromYear || K.today().getFullYear() - 1;
    return html`<${PickerField} label=${label} hint=${hint} open=${open} onToggle=${() => setOpen(!open)} display=${display} placeholder=${placeholder || 'Choose a month'}>
      <div class="between"><button type="button" class="ic n" aria-label="Previous year" disabled=${year <= minY} onClick=${() => setYear(year - 1)}><${Icon} n="back" s=${16} w=${2.2} /></button><b>${year}</b><button type="button" class="ic n" aria-label="Next year" onClick=${() => setYear(year + 1)}><${Icon} n="next" s=${16} w=${2.2} /></button></div>
      <div class="cal months">${K.MON.map((m, i) => { const s = year + '-' + K.pad(i + 1); return html`<button key=${s} type="button" aria-pressed=${value === s} class=${value === s ? 'on' : ''} onClick=${() => { onChange(s); setOpen(false); }}>${m}</button>`; })}</div>
      ${optional && value && html`<button type="button" class="link" style=${{ color: 'var(--muted)', alignSelf: 'flex-start' }} onClick=${() => { onChange(''); setOpen(false); }}>Clear</button>`}</${PickerField}>`;
  };
})();
