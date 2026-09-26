/* Kipu · every currency: names, symbols, flags, search, picker and converter */
(function () {
  const K = window.K;
  const { useState, useMemo } = React;
  const { html, useApp, Icon } = K;

  // Funds, metals and test codes are not money people spend
  const SKIP = new Set('XAG XAU XPD XPT XDR XSU XUA XBA XBB XBC XBD XTS XXX BOV CHE CHW CLF COU MXV USN UYI UYW VED ZWG'.split(' '));
  const REGION = { EUR: ['eu', 'Eurozone'], XOF: [null, 'West Africa'], XAF: [null, 'Central Africa'], XCD: [null, 'Eastern Caribbean'], XPF: [null, 'French Pacific territories'], ANG: ['cw', 'Curaçao and Sint Maarten'] };
  const ALSO = {
    EUR: 'Europe European Union Spain France Germany Italy Portugal Netherlands Ireland Austria Belgium Finland Greece Croatia Slovakia Slovenia Estonia Latvia Lithuania Luxembourg Malta Cyprus Montenegro Kosovo Andorra Monaco',
    USD: 'America Ecuador El Salvador Panama Puerto Rico', XOF: 'CFA Senegal Ivory Coast Côte d’Ivoire Mali Burkina Faso Benin Togo Niger', XAF: 'CFA Cameroon Gabon Chad Congo Equatorial Guinea',
    XCD: 'Antigua Dominica Grenada Saint Lucia Saint Kitts Saint Vincent Anguilla Montserrat', AUD: 'Kiribati Nauru Tuvalu', CHF: 'Liechtenstein', NZD: 'Cook Islands', GBP: 'England Scotland Wales Britain UK',
  };
  // Country and currency names come from the browser, in the app's language
  const names = {};
  const namesFor = (type) => { const l = K.lang ? K.lang() : 'en', k = type + l; if (!(k in names)) { try { names[k] = new Intl.DisplayNames([l], { type, fallback: type === 'region' ? 'none' : 'code' }); } catch (e) { names[k] = null; } } return names[k]; };
  const curNames = { of: (c) => namesFor('currency') && namesFor('currency').of(c) }, regNames = { of: (c) => namesFor('region') && namesFor('region').of(c) };
  const country = (code) => {
    if (REGION[code]) return REGION[code];
    const cc = code.slice(0, 2);
    let name; try { name = regNames && regNames.of(cc); } catch (e) {}
    return name ? [cc.toLowerCase(), name] : [null, ''];
  };
  const symCache = {};
  K.sym = (cur) => {
    if (!cur) return '';
    if (K.CURRENCIES[cur]) return K.CURRENCIES[cur][0];
    if (symCache[cur]) return symCache[cur];
    let s = cur + ' ';
    try { const p = new Intl.NumberFormat('en', { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol' }).formatToParts(1).find((x) => x.type === 'currency'); if (p) s = p.value === '$' ? cur.slice(0, 2) + '$' : p.value === cur ? cur + ' ' : p.value; } catch (e) {}
    return (symCache[cur] = s);
  };
  K.curName = (c) => { if (K.CURRENCIES[c]) return K.CURRENCIES[c][1]; try { const n = curNames && curNames.of(c); if (n && n !== c) return n.charAt(0).toUpperCase() + n.slice(1); } catch (e) {} return c; };
  K.curCountry = (c) => country(c)[1];
  // ISO country code for a currency (null for shared ones like the euro)
  K.countryOfCur = (c) => { const f = country(c || '')[0]; return f && f !== 'eu' ? f.toUpperCase() : null; };
  K.countryName = (cc) => { if (!cc) return ''; try { return (regNames && regNames.of(cc)) || cc; } catch (e) { return cc; } };

  let list = null;
  K.allCurrencies = (data) => {
    if (list && (!data || list.n === Object.keys(data.fx.usd).length)) return list.items;
    let codes = [];
    try { codes = Intl.supportedValuesOf('currency'); } catch (e) {}
    const fromRates = data ? Object.keys(data.fx.usd) : [];
    codes = [...new Set(codes.concat(fromRates, Object.keys(K.CURRENCIES)))].filter((c) => /^[A-Z]{3}$/.test(c) && !SKIP.has(c));
    const items = codes.map((code) => { const [flag, place] = country(code); const name = K.curName(code); return { code, name, place, flag, hay: (code + ' ' + name + ' ' + place + ' ' + (ALSO[code] || '')).toLowerCase() }; }).sort((a, b) => a.name.localeCompare(b.name));
    list = { n: fromRates.length, items };
    return items;
  };
  K.findCurrencies = (data, q) => {
    const all = K.allCurrencies(data);
    q = (q || '').trim().toLowerCase();
    if (!q) return all;
    const exact = all.filter((c) => c.code.toLowerCase() === q);
    const starts = all.filter((c) => c.code.toLowerCase() !== q && (c.name.toLowerCase().startsWith(q) || c.place.toLowerCase().startsWith(q)));
    const rest = all.filter((c) => !exact.includes(c) && !starts.includes(c) && c.hay.includes(q));
    return exact.concat(starts, rest);
  };
  K.hasRate = (data, c) => !!data.fx.usd[c];

  // ---------------------------------------------------------------- flag (image, so it looks the same on every system)
  K.Flag = function Flag({ cur, s }) {
    const size = s || 24;
    const f = country(cur)[0];
    const box = { width: size + 'px', height: size + 'px', borderRadius: '999px', flexShrink: 0, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', boxShadow: 'inset 0 0 0 1px var(--line)' };
    if (!f) return html`<span style=${box} aria-hidden="true"><${Icon} n="globe" s=${Math.round(size * 0.62)} c="var(--muted)" /></span>`;
    return html`<span style=${box} aria-hidden="true"><img src=${'https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/1x1/' + f + '.svg'} alt="" width=${size} height=${size} loading="lazy" style=${{ width: '100%', height: '100%', objectFit: 'cover' }} /></span>`;
  };
  const Flag = K.Flag;
  K.CountryFlag = function CountryFlag({ cc, s }) {
    const size = s || 24;
    const box = { width: size + 'px', height: size + 'px', borderRadius: '999px', flexShrink: 0, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', boxShadow: 'inset 0 0 0 1px var(--line)' };
    if (!cc || !/^[A-Z]{2}$/.test(cc)) return html`<span style=${box} aria-hidden="true"><${Icon} n="globe" s=${Math.round(size * 0.62)} c="var(--muted)" /></span>`;
    return html`<span style=${box} aria-hidden="true"><img src=${'https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/1x1/' + cc.toLowerCase() + '.svg'} alt="" width=${size} height=${size} loading="lazy" style=${{ width: '100%', height: '100%', objectFit: 'cover' }} /></span>`;
  };

  // ---------------------------------------------------------------- search list
  const CurrencyList = ({ onPick, exclude, selected, autoFocus, max }) => {
    const { data } = useApp();
    const [q, setQ] = useState('');
    const found = useMemo(() => K.findCurrencies(data, q).filter((c) => !(exclude || []).includes(c.code)), [q, data.fx.usd, exclude]);
    const shown = found.slice(0, max || 60);
    return html`<div class="stack-s" style=${{ gap: '8px' }}>
      <div class="row" style=${{ gap: '8px', padding: '0 12px', height: '44px', borderRadius: '14px', background: 'var(--surface2)' }}><${Icon} n="search" s=${17} c="var(--muted)" /><input class="grow" aria-label="Search currencies" placeholder="Country, currency or code" value=${q} onInput=${(e) => setQ(e.target.value)} autofocus=${autoFocus} style=${{ border: 0, background: 'transparent', outline: 'none', fontSize: '15px', minWidth: 0 }} /></div>
      <div class="card tight list" style=${{ maxHeight: '300px', overflowY: 'auto' }}>
        ${shown.map((c) => html`<button key=${c.code} type="button" class="lrow" style=${{ minHeight: '54px', padding: '8px 14px', background: selected === c.code ? 'var(--accbg)' : null }} onClick=${() => onPick(c.code)}><${Flag} cur=${c.code} s=${28} /><span class="grow stack-s" style=${{ gap: '1px', textAlign: 'left', minWidth: 0 }}><span class="t1" style=${{ fontSize: '14px' }}><b>${c.code}</b> · ${c.name}</span><span class="t2" style=${{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${c.place || 'International'}${K.hasRate(data, c.code) ? '' : ' · rate after next update'}</span></span>${selected === c.code && html`<${Icon} n="check" s=${16} c="var(--acc)" w=${2.4} />`}</button>`)}
        ${!shown.length && html`<div class="lrow muted small">No currency matches “${q}”.</div>`}
      </div>${found.length > shown.length && html`<span class="tiny muted">Showing ${shown.length} of ${found.length}. Keep typing to narrow it down.</span>`}</div>`;
  };
  K.CurrencyList = CurrencyList;

  // A field that shows the chosen currency and opens the search below it
  K.CurrencySelect = function CurrencySelect({ label, value, onChange, hint }) {
    const [open, setOpen] = useState(false);
    return html`<div class="field"><span>${label || 'Currency'}</span>
      <button type="button" class="input row" aria-expanded=${open} style=${{ gap: '10px', justifyContent: 'flex-start', textAlign: 'left' }} onClick=${() => setOpen(!open)}><${Flag} cur=${value} s=${22} /><span class="grow"><b>${value}</b> <span class="muted">· ${K.curName(value)}</span></span><${Icon} n=${open ? 'x' : 'down'} s=${15} c="var(--muted)" /></button>
      ${open && html`<${CurrencyList} selected=${value} autoFocus=${true} onPick=${(c) => { onChange(c); setOpen(false); }} />`}
      ${hint && html`<span class="tiny muted" style=${{ fontWeight: 400 }}>${hint}</span>`}</div>`;
  };

  // ---------------------------------------------------------------- countries
  const EXTRA_COUNTRIES = 'AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES EC SV PA PR MC AD SM VA ME XK'.split(' ');
  let countryList = null;
  K.allCountries = (data) => {
    if (countryList) return countryList;
    const seen = new Map();
    K.allCurrencies(data).forEach((c) => { if (c.flag && c.flag !== 'eu' && c.place) seen.set(c.flag.toUpperCase(), c.place); });
    EXTRA_COUNTRIES.forEach((cc) => { if (!seen.has(cc)) seen.set(cc, K.countryName(cc)); });
    countryList = [...seen.entries()].map(([cc, name]) => ({ cc, name })).filter((x) => x.name && x.name !== x.cc).sort((a, b) => a.name.localeCompare(b.name));
    return countryList;
  };
  K.CountrySelect = function CountrySelect({ label, value, onChange, hint }) {
    const { data } = useApp();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const used = K.countries(data);
    const all = K.allCountries(data);
    const list = (q ? all.filter((c) => (c.name + ' ' + c.cc).toLowerCase().includes(q.trim().toLowerCase())) : used.map((cc) => all.find((c) => c.cc === cc) || { cc, name: K.countryName(cc) }).concat(all.filter((c) => !used.includes(c.cc)))).slice(0, 60);
    return html`<div class="field"><span>${label || 'Country'}</span>
      <button type="button" class="input row" aria-expanded=${open} style=${{ gap: '10px', justifyContent: 'flex-start', textAlign: 'left' }} onClick=${() => setOpen(!open)}><${K.CountryFlag} cc=${value} s=${22} /><span class="grow">${value ? K.countryName(value) : 'Choose a country'}</span><${Icon} n=${open ? 'x' : 'down'} s=${15} c="var(--muted)" /></button>
      ${open && html`<div class="stack-s" style=${{ gap: '8px' }}><div class="row" style=${{ gap: '8px', padding: '0 12px', height: '44px', borderRadius: '14px', background: 'var(--surface2)' }}><${Icon} n="search" s=${17} c="var(--muted)" /><input class="grow" aria-label="Search countries" placeholder="Search a country" value=${q} autofocus onInput=${(e) => setQ(e.target.value)} style=${{ border: 0, background: 'transparent', outline: 'none', fontSize: '15px', minWidth: 0 }} /></div>
        <div class="card tight list" style=${{ maxHeight: '280px', overflowY: 'auto' }}>${list.map((c) => html`<button key=${c.cc} type="button" class="lrow" style=${{ minHeight: '50px', padding: '8px 14px', background: value === c.cc ? 'var(--accbg)' : null }} onClick=${() => { onChange(c.cc); setOpen(false); setQ(''); }}><${K.CountryFlag} cc=${c.cc} s=${26} /><span class="grow t1" style=${{ fontSize: '14px', textAlign: 'left' }}>${c.name}</span>${used.includes(c.cc) && html`<span class="tiny muted">In use</span>`}</button>`)}${!list.length && html`<div class="lrow muted small">No country matches “${q}”.</div>`}</div></div>`}
      ${hint && html`<span class="tiny muted" style=${{ fontWeight: 400 }}>${hint}</span>`}</div>`;
  };

  // ---------------------------------------------------------------- converter
  const pairKey = (a, b) => a + '>' + b;
  K.Converter = function Converter() {
    const { data, commit } = useApp();
    const fxp = data.fxPairs || { fav: [], use: {} };
    const others = data.active.filter((c) => c !== data.base);
    const [from, setFrom] = useState(data.base);
    const [to, setTo] = useState(others[0] || (data.base === 'USD' ? 'CAD' : 'USD'));
    const [amt, setAmt] = useState('1000');
    const [picking, setPicking] = useState(null);
    const n = parseFloat(String(amt).replace(/,/g, '')) || 0;
    const ok = K.hasRate(data, from) && K.hasRate(data, to);
    const rate = K.rate(data, from, to);
    const out = n * rate;
    const saveUse = (a, b) => commit(Object.assign({}, data, { fxPairs: { fav: fxp.fav, use: Object.assign({}, fxp.use, { [pairKey(a, b)]: (fxp.use[pairKey(a, b)] || 0) + 1 }) } }));
    const setPair = (a, b) => { setFrom(a); setTo(b); if (a !== b) saveUse(a, b); };
    const key = pairKey(from, to);
    const isFav = fxp.fav.includes(key);
    const toggleFav = () => commit(Object.assign({}, data, { fxPairs: { use: fxp.use, fav: isFav ? fxp.fav.filter((k) => k !== key) : fxp.fav.concat([key]) } }));
    // Pairs you favorite come first, then the ones you use most, then your main currency to each active one
    const pairs = [...new Set(fxp.fav.concat(Object.keys(fxp.use).sort((a, b) => fxp.use[b] - fxp.use[a]), others.map((c) => pairKey(data.base, c)), others.map((c) => pairKey(c, data.base))))].filter((k) => { const [a, b] = k.split('>'); return a !== b; }).slice(0, 6);
    const dec = (v) => (Math.abs(v) >= 100 ? 2 : Math.abs(v) >= 1 ? 2 : 4);
    const fmtN = (v, c) => K.sym(c) + (K.sym(c).length > 1 && /[A-Z/]$/.test(K.sym(c)) ? ' ' : '') + v.toLocaleString('en-US', { minimumFractionDigits: dec(v), maximumFractionDigits: dec(v) });
    const Side = ({ which, cur }) => html`<button type="button" class="row" style=${{ gap: '8px', padding: '6px 10px 6px 6px', borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--line)', flexShrink: 0 }} aria-label=${'Change ' + which + ' currency, now ' + cur} onClick=${() => setPicking(picking === which ? null : which)}><${Flag} cur=${cur} s=${26} /><b>${cur}</b><${Icon} n="down" s=${14} c="var(--muted)" /></button>`;
    return html`<div class="card stack" style=${{ gap: '14px', background: 'var(--tint)' }}>
      <div class="between"><h3 style=${{ fontSize: '17px' }}>Currency converter</h3><button type="button" class="chip" aria-pressed=${isFav} onClick=${toggleFav} style=${{ height: '30px', background: isFav ? 'var(--accbg)' : 'var(--surface)', color: isFav ? 'var(--acc)' : null }}><${Icon} n="star" s=${13} />${isFav ? 'Saved pair' : 'Save pair'}</button></div>
      ${pairs.length > 0 && html`<div class="chips">${pairs.map((k) => { const [a, b] = k.split('>'); return html`<button key=${k} type="button" class=${'chip' + (k === key ? ' on' : '')} style=${{ height: '30px', fontSize: '12px' }} onClick=${() => setPair(a, b)}>${a} → ${b}</button>`; })}</div>`}
      <div class="card" style=${{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div class="between"><${Side} which="from" cur=${from} /><input aria-label=${'Amount in ' + from} class="amount-in num" inputmode="decimal" value=${K.groupNum ? K.groupNum(amt) : amt} onInput=${(e) => setAmt(K.cleanNum ? K.cleanNum(e.target.value) : e.target.value.replace(/[^0-9.]/g, ''))} style=${{ fontSize: '26px', textAlign: 'right', minWidth: 0 }} /></div>
        ${picking === 'from' && html`<${CurrencyList} selected=${from} autoFocus=${true} onPick=${(c) => { setPicking(null); setPair(c, to); }} />`}
        <div class="row" style=${{ gap: '10px' }}><span class="grow" style=${{ height: '1px', background: 'var(--line)' }}></span><button type="button" aria-label="Swap currencies" onClick=${() => setPair(to, from)} style=${{ width: '40px', height: '40px', borderRadius: '999px', background: 'var(--solid)', color: 'var(--hero-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(90deg)' }}><${Icon} n="transfer" s=${18} w=${2.2} /></button><span class="grow" style=${{ height: '1px', background: 'var(--line)' }}></span></div>
        <div class="between"><${Side} which="to" cur=${to} /><span class="disp num" style=${{ fontSize: (ok && fmtN(out, to).length > 11 ? 20 : 26) + 'px', fontWeight: 800, textAlign: 'right', minWidth: 0, wordBreak: 'break-all' }}>${ok ? fmtN(out, to) : '—'}</span></div>
        ${picking === 'to' && html`<${CurrencyList} selected=${to} autoFocus=${true} onPick=${(c) => { setPicking(null); setPair(from, c); }} />`}
      </div>
      ${ok ? html`<div class="stack-s" style=${{ gap: '4px' }}><span class="small num"><b>1 ${from} = ${rate.toLocaleString('en-US', { maximumFractionDigits: rate >= 100 ? 2 : 4 })} ${to}</b> <span class="muted">· 1 ${to} = ${(1 / rate).toLocaleString('en-US', { maximumFractionDigits: 1 / rate >= 100 ? 2 : 4 })} ${from}</span></span><span class="tiny muted">${data.fx.updated ? 'Updated ' + new Date(data.fx.updated).toLocaleString() : 'Built-in reference rate'} · ${data.fx.source}. For reference only; saved transactions keep their own rate.</span></div>` : html`<span class="small muted">No rate for ${!K.hasRate(data, from) ? from : to} yet. Update rates to add it.</span>`}
    </div>`;
  };
})();
