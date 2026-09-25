/* Kipu · data model, persistence and every calculation. All screens read from derive(). */
(function () {
  const K = (window.K = window.K || {});
  const VERSION = 1;
  const KEY = 'kipu-data-v1';

  // ---------------------------------------------------------------- dates
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = (s) => { if (!s) return null; const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const addMonths = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth() + n, 1); const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); x.setDate(Math.min(d.getDate(), last)); return x; };
  const monthKey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1);
  const days = (a, b) => Math.round((b - a) / 86400000);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  Object.assign(K, { pad, iso, parse, today, addDays, addMonths, monthKey, days, MON, MONTH_LONG });
  K.fmtDate = (s, withYear) => { const d = typeof s === 'string' ? parse(s) : s; if (!d) return ''; return MON[d.getMonth()] + ' ' + d.getDate() + (withYear ? ', ' + d.getFullYear() : ''); };
  K.fmtMonth = (d) => MON[d.getMonth()] + ' ' + d.getFullYear();

  const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
  const sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
  const uid = (p) => (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  Object.assign(K, { r2, sum, uid });

  // ---------------------------------------------------------------- reference data
  const CATS = {
    housing: { name: 'Housing', icon: 'home', tone: 'p' }, bills: { name: 'Bills & utilities', icon: 'bolt', tone: 'b' }, transport: { name: 'Transportation', icon: 'car', tone: 'b' },
    groceries: { name: 'Groceries', icon: 'basket', tone: 'g' }, dining: { name: 'Dining', icon: 'cup', tone: 'a' }, shopping: { name: 'Shopping', icon: 'bag', tone: 'r' },
    subs: { name: 'Subscriptions', icon: 'repeat', tone: 'p' }, entertainment: { name: 'Entertainment', icon: 'ticket', tone: 'a' }, health: { name: 'Health', icon: 'heart', tone: 'g' },
    travel: { name: 'Travel', icon: 'plane', tone: 'b' }, education: { name: 'Education', icon: 'book', tone: 'p' }, family: { name: 'Family', icon: 'people', tone: 'g' }, other: { name: 'Other', icon: 'dots', tone: 'n' },
  };
  K.CATS = CATS; K.CAT_ORDER = Object.keys(CATS);
  // Categories people add themselves live in data.customCats and join the built-in ones, before Other
  const BUILT_IN = Object.assign({}, CATS);
  K.isBuiltInCat = (k) => !!BUILT_IN[k];
  K.syncCats = (data) => {
    const custom = (data && data.customCats) || [];
    Object.keys(CATS).forEach((k) => { if (!BUILT_IN[k]) delete CATS[k]; });
    custom.forEach((c) => { CATS[c.id] = { name: c.name, icon: c.icon || 'tag', tone: c.tone || 'p', custom: true }; });
    const order = Object.keys(BUILT_IN).filter((k) => k !== 'other').concat(custom.map((c) => c.id), ['other']);
    K.CAT_ORDER.length = 0; order.forEach((k) => K.CAT_ORDER.push(k));
  };
  K.addCategory = (d, c) => { const id = 'c_' + uid(''); return [Object.assign({}, d, { customCats: (d.customCats || []).concat([{ id, name: c.name.trim(), icon: c.icon || 'tag', tone: c.tone || 'p' }]) }), id]; };
  K.editCategory = (d, id, patch) => Object.assign({}, d, { customCats: (d.customCats || []).map((c) => (c.id === id ? Object.assign({}, c, patch) : c)) });
  // Deleting moves its transactions, bills and rules to Other; nothing is lost
  K.deleteCategory = (d, id) => { const budget = Object.assign({}, d.budget); delete budget[id]; return Object.assign({}, d, { customCats: (d.customCats || []).filter((c) => c.id !== id), txns: d.txns.map((t) => (t.cat === id ? Object.assign({}, t, { cat: 'other' }) : t)), bills: d.bills.map((b) => (b.cat === id ? Object.assign({}, b, { cat: 'other' }) : b)), rules: d.rules.filter((r) => r.cat !== id), budget }); };
  K.CURRENCIES = { CAD: ['CA$', 'Canadian dollar'], USD: ['US$', 'US dollar'], PEN: ['S/', 'Peruvian sol'], EUR: ['€', 'Euro'], GBP: ['£', 'British pound'], MXN: ['MX$', 'Mexican peso'], COP: ['COL$', 'Colombian peso'], CLP: ['CLP$', 'Chilean peso'], ARS: ['AR$', 'Argentine peso'], BRL: ['R$', 'Brazilian real'], JPY: ['¥', 'Japanese yen'], AUD: ['A$', 'Australian dollar'], CHF: ['Fr', 'Swiss franc'] };
  // Fallback rates per 1 USD, used until live rates arrive
  const USD_RATES = { USD: 1, CAD: 1.364, PEN: 3.72, EUR: 0.92, GBP: 0.79, MXN: 18.1, COP: 4150, CLP: 940, ARS: 980, BRL: 5.6, JPY: 148, AUD: 1.52, CHF: 0.88 };
  // Words that suggest a category when a merchant has no rule yet
  const KEYWORDS = [
    [/costco|walmart|loblaw|metro|sobeys|no frills|superstore|tottus|plaza vea|wong|whole foods|safeway|kroger|grocer|market|mercado/i, 'groceries'],
    [/uber(?! ?eats)|lyft|shell|esso|petro|chevron|gas|presto|transit|parking|taxi|cabify|rail|toll/i, 'transport'],
    [/uber ?eats|doordash|skip|restaurant|cafe|café|coffee|starbucks|tim hortons|mcdonald|pizza|sushi|bar |grill|bistro/i, 'dining'],
    [/netflix|spotify|crave|disney|prime|icloud|apple\.com|adobe|youtube|audible|hbo|gym|fitness/i, 'subs'],
    [/amazon|uniqlo|zara|h&m|best buy|ikea|shop|store|mall/i, 'shopping'],
    [/rent|mortgage|condo|strata/i, 'housing'],
    [/hydro|internet|rogers|bell|telus|fido|phone|water|electric|utility/i, 'bills'],
    [/pharmacy|shoppers|drug|clinic|dental|doctor|hospital/i, 'health'],
    [/airbnb|hotel|airline|air canada|westjet|latam|expedia|booking/i, 'travel'],
    [/cinema|cineplex|theatre|concert|ticket|steam|playstation|xbox/i, 'entertainment'],
  ];
  K.guessCat = (data, merchant) => {
    const m = (merchant || '').toLowerCase();
    const rule = (data.rules || []).find((r) => m.includes(r.merchant.toLowerCase()));
    if (rule) return rule.cat;
    const prev = data.txns.find((t) => t.type === 'expense' && t.merchant && t.merchant.toLowerCase() === m);
    if (prev) return prev.cat;
    for (const [re, c] of KEYWORDS) if (re.test(merchant || '')) return c;
    return 'other';
  };

  // ---------------------------------------------------------------- factory state

  // ---------------------------------------------------------------- merging edits made on two devices
  // base = what both started from, local = this device, remote = the other device. Lists merge by id;
  // balances merge by adding both sides' changes, because each side's transactions moved them.
  const sameJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const DELTA = { accounts: ['bal'], cards: ['bal', 'bal2', 'stmtBal', 'stmtBal2'], loans: ['bal'], goals: ['saved'] };
  const mergeObj = (b, l, r) => {
    b = b || {}; l = l || {}; r = r || {};
    const out = {};
    new Set(Object.keys(l).concat(Object.keys(r))).forEach((k) => { const v = sameJSON(l[k], b[k]) ? r[k] : l[k]; if (v !== undefined) out[k] = v; });
    return out;
  };
  const mergeList = (b, l, r, delta) => {
    const byId = (a) => new Map((a || []).map((x) => [x.id, x]));
    const B = byId(b), L = byId(l), Rm = byId(r);
    const order = (r || []).map((x) => x.id).concat((l || []).map((x) => x.id).filter((id) => !Rm.has(id)));
    const out = [];
    order.forEach((id) => {
      const bi = B.get(id), li = L.get(id), ri = Rm.get(id);
      if (!li) { if (!(bi && sameJSON(ri, bi))) out.push(ri); return; }
      if (!ri) { if (!(bi && sameJSON(li, bi))) out.push(li); return; }
      if (sameJSON(li, bi) || !bi) { out.push(sameJSON(li, bi) ? ri : mergeObj({}, li, ri)); return; }
      if (sameJSON(ri, bi)) { out.push(li); return; }
      const m = mergeObj(bi, li, ri);
      (delta || []).forEach((f) => { if (typeof bi[f] === 'number' || typeof li[f] === 'number' || typeof ri[f] === 'number') m[f] = r2((bi[f] || 0) + ((li[f] || 0) - (bi[f] || 0)) + ((ri[f] || 0) - (bi[f] || 0))); });
      out.push(m);
    });
    return out;
  };
  const isIdList = (a) => Array.isArray(a) && a.every((x) => x && typeof x === 'object' && 'id' in x);
  K.mergeData = (base, local, remote) => {
    if (!base) return local;
    if (sameJSON(local, base)) return remote;
    if (sameJSON(remote, base)) return local;
    const out = {};
    new Set(Object.keys(local).concat(Object.keys(remote))).forEach((k) => {
      const b = base[k], l = local[k], r = remote[k];
      if (isIdList(l || []) && isIdList(r || []) && (Array.isArray(l) || Array.isArray(r))) out[k] = mergeList(b || [], l || [], r || [], DELTA[k]);
      else if (Array.isArray(l) || Array.isArray(r)) out[k] = sameJSON(l, b) ? r : sameJSON(r, b) ? l : [...new Set([].concat(r || [], l || []))];
      else if (l && r && typeof l === 'object' && typeof r === 'object') out[k] = mergeObj(b, l, r);
      else out[k] = sameJSON(l, b) ? r : l;
    });
    return out;
  };

  K.factory = () => ({
    v: VERSION, createdAt: iso(today()), onboarded: false, demo: false,
    profile: { name: '', email: '', photo: '' },
    base: 'CAD', active: ['CAD'],
    fx: { usd: Object.assign({}, USD_RATES), updated: null, source: 'Built-in reference rates' },
    accounts: [], cards: [], loans: [], txns: [], bills: [], income: [], budget: {}, goals: [], trips: [], rules: [], imports: [],
    household: { enabled: false, name: '' },
    fxPairs: { fav: [], use: {} },
    customCats: [],
    snapshots: {},
    prefs: { utilRef: 30, horizon: 12, assumption: 'Recent average', insightFreq: 'Balanced' },
  });
  K.load = () => {
    try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); if (d && d.v === VERSION) { const out = Object.assign(K.factory(), d); K.syncCats(out); return out; } } } catch (e) {}
    return K.factory();
  };
  K.save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } };
  K.wipe = () => { try { localStorage.removeItem(KEY); } catch (e) {} };

  // ---------------------------------------------------------------- currency
  // Every stored transaction keeps its original amount and currency plus the base-currency amount at the rate used then.
  // A missing rate is null, never 1: amounts without a rate stay out of totals until the rate arrives
  K.rate = (data, from, to) => { to = to || data.base; from = from || data.base; if (from === to) return 1; const u = data.fx.usd; if (!u[from] || !u[to]) return null; return u[to] / u[from]; };
  K.toBase = (data, amt, cur) => { const k = K.rate(data, cur, data.base); return k == null || amt == null ? null : r2(amt * k); };
  K.hasRateFor = (data, cur) => K.rate(data, cur, data.base) != null;
  // Currencies in use that have no rate yet
  K.missingRates = (data) => { const s = new Set(); const add = (c) => { if (c && !K.hasRateFor(data, c)) s.add(c); }; data.accounts.forEach((a) => add(a.cur)); data.cards.forEach((c) => { add(c.cur); add(c.cur2); }); data.loans.forEach((l) => add(l.cur)); data.bills.forEach((b) => add(b.cur)); data.income.forEach((i) => add(i.cur)); data.txns.forEach((t) => { if (t.base == null) add(t.cur); }); return [...s]; };
  // When a rate arrives, transactions saved without one join the totals at that rate
  K.fillPendingRates = (data) => { let changed = false; const txns = data.txns.map((t) => { if (t.base != null) return t; const k = K.rate(data, t.cur, data.base); if (k == null) return t; changed = true; return Object.assign({}, t, { base: r2(t.amt * k), rate: k, rateLater: true }); }); return changed ? Object.assign({}, data, { txns }) : data; };
  K.sym = (cur) => (K.CURRENCIES[cur] || [cur + ' '])[0];
  K.refreshFx = async (data) => {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!r.ok) throw new Error('rates');
    const j = await r.json();
    if (!j || !j.rates) throw new Error('rates');
    // Keep every rate the service returns so any currency can be enabled or converted
    const usd = {}; Object.keys(j.rates).forEach((c) => { if (/^[A-Z]{3}$/.test(c) && j.rates[c] > 0) usd[c] = j.rates[c]; });
    return { usd: Object.assign({}, data.fx.usd, usd), updated: new Date().toISOString(), source: 'ExchangeRate-API (open.er-api.com)' };
  };

  // Using a currency anywhere adds it to the active list
  K.useCurrency = (d, c) => (!c || d.active.includes(c) ? d : Object.assign({}, d, { active: d.active.concat([c]) }));
  // Changing the main currency: amounts Kipu keeps in the main currency are converted once at today's rate.
  // Each transaction keeps its original amount and currency; only its main-currency value is restated.
  K.changeBase = (d, nb) => {
    const ob = d.base; if (nb === ob) return d;
    const k = K.rate(d, ob, nb); if (k == null) throw new Error('NO_RATE:' + nb);
    const c = (v) => (v == null ? v : r2(v * k));
    const snaps = {}; Object.keys(d.snapshots || {}).forEach((m) => { const x = d.snapshots[m]; snaps[m] = Object.assign({}, x, { nw: c(x.nw), debt: c(x.debt), loans: c(x.loans), cards: c(x.cards) }); });
    const budget = {}; Object.keys(d.budget || {}).forEach((cat) => (budget[cat] = c(d.budget[cat])));
    return Object.assign({}, d, {
      base: nb, active: [nb].concat(d.active.filter((x) => x !== nb)),
      txns: d.txns.map((t) => Object.assign({}, t, { base: c(t.base), rate: t.rate != null ? t.rate * k : t.rate, principal: c(t.principal), interest: c(t.interest) })),
      // Legacy cards had no currency and were denominated in the old base.
      cards: d.cards.map((x) => x.cur ? x : Object.assign({}, x, { cur: ob })),
      loans: d.loans.map((x) => Object.assign({}, x, { orig: c(x.orig), bal: c(x.bal), pay: c(x.pay) })),
      goals: d.goals.map((x) => Object.assign({}, x, { target: c(x.target), monthly: c(x.monthly), saved: c(x.saved) })),
      trips: d.trips.map((x) => Object.assign({}, x, { budget: c(x.budget) })),
      budget, snapshots: snaps,
    });
  };

  // ---------------------------------------------------------------- schedules
  const step = (d, freq, dir) => {
    const s = dir || 1;
    if (freq === 'Weekly') return addDays(d, 7 * s);
    if (freq === 'Bi-weekly') return addDays(d, 14 * s);
    if (freq === 'Twice monthly') return d.getDate() < 15 ? (s > 0 ? new Date(d.getFullYear(), d.getMonth(), 15) : new Date(d.getFullYear(), d.getMonth() - 1, 15)) : (s > 0 ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : new Date(d.getFullYear(), d.getMonth(), 1));
    if (freq === 'Quarterly') return addMonths(d, 3 * s);
    if (freq === 'Yearly' || freq === 'Annual') return addMonths(d, 12 * s);
    return addMonths(d, s);
  };
  // All dates of a schedule anchored at `anchor` between from and to (inclusive)
  const occurrences = (anchor, freq, from, to) => {
    let d = parse(anchor); if (!d) return [];
    let guard = 0;
    while (d > from && guard++ < 600) d = step(d, freq, -1);
    const out = []; guard = 0;
    while (d <= to && guard++ < 600) { if (d >= from) out.push(new Date(d)); d = step(d, freq, 1); }
    return out;
  };
  K.occurrences = occurrences;
  // Loan `next` is an outstanding due date, not the original schedule anchor.
  const futureOccurrences = (anchor, freq, from, to) => {
    let d = parse(anchor); if (!d) return [];
    const out = []; let guard = 0;
    while (d <= to && guard++ < 600) { if (d >= from) out.push(new Date(d)); d = step(d, freq, 1); }
    return out;
  };
  K.perYear = (f) => ({ Weekly: 52, 'Bi-weekly': 26, 'Twice monthly': 24, Monthly: 12, Quarterly: 4, Yearly: 1, Annual: 1 }[f] || 12);
  const billAnchor = (b) => (b.kind === 'Annual' ? new Date(today().getFullYear(), (b.month || 1) - 1, b.day || 1) : new Date(today().getFullYear(), today().getMonth(), b.day || 1));
  const billFreq = (b) => (b.kind === 'Annual' ? 'Yearly' : 'Monthly');
  K.nextDate = (anchor, freq, after) => { let d = parse(anchor) || today(); let g = 0; while (d < after && g++ < 600) d = step(d, freq, 1); while (g++ < 1200 && step(d, freq, -1) >= after) d = step(d, freq, -1); return d; };

  // ---------------------------------------------------------------- loans
  K.payoff = (bal, rate, pay, perYear, extra) => {
    const i = rate / 100 / perYear, P = pay + (extra || 0);
    let b = bal, n = 0, interest = 0;
    if (P <= b * i) return { n: Infinity, interest: Infinity };
    while (b > 0.005 && n < 1200) { const int = b * i; interest += int; b = b + int - P; n++; if (b < 0) b = 0; }
    return { n, interest: r2(interest) };
  };
  K.payoffDate = (loan, extraMonthly) => {
    if (!loan.pay || !loan.bal) return { n: 0, interest: 0, label: loan.bal ? 'Add a payment amount' : 'Paid off' };
    const py = K.perYear(loan.freq);
    const p = K.payoff(loan.bal, loan.rate || 0, loan.pay, py, ((extraMonthly || 0) * 12) / py);
    if (!isFinite(p.n)) return Object.assign(p, { label: 'Payment doesn’t cover interest' });
    let d = K.nextDate(loan.next || iso(today()), loan.freq, today());
    for (let k = 1; k < p.n; k++) d = step(d, loan.freq, 1);
    return Object.assign(p, { date: d, label: K.fmtMonth(d) });
  };
  K.loanSplit = (loan) => { const i = (loan.rate || 0) / 100 / K.perYear(loan.freq); const interest = r2(loan.bal * i); const principal = r2(Math.min(loan.bal, Math.max(0, (loan.pay || 0) - interest))); return { interest, principal }; };

  // ---------------------------------------------------------------- mutations (pure: return new data)
  const upd = (arr, id, fn) => arr.map((x) => (x.id === id ? fn(x) : x));
  const moveBal = (d, where, delta) => {
    if (!where) return d;
    const [kind, id] = where.split(':');
    if (kind === 'acct') return Object.assign({}, d, { accounts: upd(d.accounts, id, (a) => Object.assign({}, a, { bal: r2(a.bal + delta) })) });
    if (kind === 'card') return Object.assign({}, d, { cards: upd(d.cards, id, (c) => Object.assign({}, c, { bal: r2(c.bal - delta) })) });
    return d;
  };
  // Each posting is in the account's or card's own currency. Without a rate, only same-currency postings are possible.
  const postingAmount = (d, t, where, sign) => {
    const [kind, id] = (where || '').split(':');
    const item = kind === 'acct' ? d.accounts.find((a) => a.id === id) : kind === 'card' ? d.cards.find((c) => c.id === id) : null;
    if (!item) return 0;
    const currency = item.cur || d.base;
    if (currency === t.cur && t.amt != null) return r2(sign * t.amt);
    const k = K.rate(d, currency, d.base);
    if (t.base == null || k == null) throw new Error('NO_RATE:' + (t.base == null ? t.cur : currency));
    return r2((sign * t.base) / k);
  };
  const postingsFor = (d, t) => {
    const out = [];
    const post = (where, sign) => { if (where && (where.startsWith('acct:') || where.startsWith('card:'))) out.push({ where, amount: postingAmount(d, t, where, sign) }); };
    if (t.type === 'expense') post(t.from, -1);
    if (t.type === 'income') post(t.from, 1);
    if (['transfer', 'saving', 'debt'].includes(t.type)) { post(t.from, -1); post(t.to, 1); }
    return out;
  };
  // Forms ask first so nothing is saved with an invented conversion
  K.canPost = (d, t) => { try { postingsFor(d, Object.assign({ cur: d.base }, t, { base: t.base != null ? t.base : K.toBase(d, t.amt, t.cur || d.base) })); return null; } catch (e) { return String(e.message).startsWith('NO_RATE:') ? e.message.slice(8) : e.message; } };
  const effects = (d, t, sign) => {
    const s = sign || 1;
    const postings = t.postings || postingsFor(d, t);
    postings.forEach((p) => { d = moveBal(d, p.where, p.amount * s); });
    if (t.type === 'saving' && t.goal && !(t.to && t.to.startsWith('acct:'))) d = Object.assign({}, d, { goals: upd(d.goals, t.goal, (g) => Object.assign({}, g, { saved: r2((g.saved || 0) + t.base * s) })) });
    if (t.type === 'debt' && t.loan) d = Object.assign({}, d, { loans: upd(d.loans, t.loan, (l) => Object.assign({}, l, { bal: r2(l.bal - (t.principal || 0) * s), next: s > 0 ? (t.loanNextAfter || l.next) : (l.next === t.loanNextAfter ? t.loanNextBefore : l.next) })) });
    return d;
  };
  // An expense that looks like a bill (similar name, amount within 3% or $1, within a week of its due date) pays that bill
  const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  K.matchBill = (d, t) => {
    if (!t || t.type !== 'expense' || t.base == null) return null;
    const m = norm(t.merchant), when = parse(t.date || iso(today()));
    if (!m) return null;
    const words = m.split(' ').filter((w) => w.length >= 4);
    const hits = (d.bills || []).filter((b) => {
      const n = norm(b.name); if (!n) return false;
      const named = m.includes(n) || n.includes(m) || words.some((w) => n.split(' ').includes(w));
      if (!named) return false;
      const amt = K.toBase(d, b.amt, b.cur || d.base); if (amt == null) return false;
      if (Math.abs(amt - t.base) > Math.max(1, amt * 0.03)) return false;
      const due = b.kind === 'Annual' ? new Date(when.getFullYear(), (b.month || 1) - 1, b.day || 1) : new Date(when.getFullYear(), when.getMonth(), b.day || 1);
      const near = [addMonths(due, -1), due, addMonths(due, 1)].some((x) => Math.abs(days(x, when)) <= 7);
      if (!near) return false;
      const month = monthKey(when);
      return !d.txns.some((x) => x.recurring === b.id && x.date && x.date.slice(0, 7) === month);
    });
    return hits.length === 1 ? hits[0] : null;
  };
  K.addTxn = (d, t) => {
    const cur = t.cur || d.base;
    const base = t.base != null ? t.base : K.toBase(d, t.amt, cur);
    t = Object.assign({ id: uid('t'), date: iso(today()), cur, base, rate: K.rate(d, cur, d.base), source: 'manual', shared: false }, t, { base });
    t.postings = postingsFor(d, t);
    if (t.type === 'expense' && !t.recurring && t.billMatch !== 'off') { const b = K.matchBill(d, t); if (b) { t.recurring = b.id; t.billMatch = 'auto'; } }
    if (t.type === 'expense' && !t.trip) { const trip = K.activeTrip(d, parse(t.date)); if (trip && t.autoTrip !== false && cur !== d.base) t.trip = trip.id; }
    d = effects(d, t, 1);
    return K.snapshot(Object.assign({}, d, { txns: d.txns.concat([t]) }));
  };
  K.removeTxn = (d, id) => { const t = d.txns.find((x) => x.id === id); if (!t) return d; d = effects(d, t, -1); return K.snapshot(Object.assign({}, d, { txns: d.txns.filter((x) => x.id !== id) })); };
  K.editTxn = (d, id, patch) => {
    const t = d.txns.find((x) => x.id === id); if (!t) return d;
    const financial = ['amt', 'cur', 'base', 'from', 'to', 'type', 'goal', 'loan', 'principal'].some((k) => Object.prototype.hasOwnProperty.call(patch, k) && patch[k] !== t[k]);
    if (!financial) return Object.assign({}, d, { txns: upd(d.txns, id, (x) => Object.assign({}, x, patch)) });
    const next = Object.assign({}, t, patch);
    delete next.postings;
    if (patch.amt != null || patch.cur != null) { next.base = K.toBase(d, next.amt, next.cur); next.rate = K.rate(d, next.cur, d.base); }
    else if (patch.base != null) next.rate = next.amt ? next.base / next.amt : 1;
    d = K.removeTxn(d, id);
    return K.addTxn(d, next);
  };
  K.upsert = (d, coll, item) => {
    const old = d[coll].find((x) => x.id === item.id);
    const next = Object.assign({}, d, { [coll]: old ? upd(d[coll], item.id, () => item) : d[coll].concat([Object.assign({ id: uid(coll[0]) }, item)]) });
    if (old && ['accounts', 'cards'].includes(coll) && (old.cur || d.base) !== (item.cur || d.base)) {
      const where = (coll === 'cards' ? 'card:' : 'acct:') + item.id;
      const ratio = K.rate(d, old.cur || d.base, item.cur || d.base);
      if (ratio == null) throw new Error('NO_RATE:' + (K.hasRateFor(d, old.cur || d.base) ? item.cur : old.cur));
      next.txns = d.txns.map((t) => t.postings ? Object.assign({}, t, { postings: t.postings.map((p) => p.where === where ? Object.assign({}, p, { amount: r2(p.amount * ratio) }) : p) }) : t);
    }
    return K.snapshot(next);
  };
  K.remove = (d, coll, id) => K.snapshot(Object.assign({}, d, { [coll]: d[coll].filter((x) => x.id !== id) }));
  K.payLoan = (d, loanId, fromAcct, extra) => {
    const l = d.loans.find((x) => x.id === loanId); if (!l) return d;
    const { interest } = K.loanSplit(l);
    const amt = r2((l.pay || 0) + (extra || 0));
    const principal = r2(Math.min(l.bal, Math.max(0, amt - interest)));
    const loanNextBefore = l.next;
    const loanNextAfter = iso(step(K.nextDate(l.next || iso(today()), l.freq, today()), l.freq, 1));
    return K.addTxn(d, { type: 'debt', cat: 'debt', merchant: l.name + ' payment', amt, cur: d.base, from: fromAcct, loan: l.id, principal, interest, loanNextBefore, loanNextAfter });
  };
  K.payBill = (d, billId, fromWhere) => {
    const b = d.bills.find((x) => x.id === billId); if (!b) return d;
    return K.addTxn(d, { type: 'expense', cat: b.cat || 'bills', merchant: b.name, amt: b.amt, cur: b.cur || d.base, from: fromWhere || b.pay, recurring: b.id, shared: !!b.shared });
  };

  // Net worth parts in base currency
  K.balances = (d, scope) => {
    const inS = (x) => (scope === 'household' ? !!x.shared : true);
    const accts = d.accounts.filter((a) => !a.archived && inS(a)).map((a) => Object.assign({}, a, { baseBal: r2(a.bal * K.rate(d, a.cur, d.base)) }));
    const cash = r2(sum(accts.filter((a) => ['Everyday', 'Savings', 'Cash'].includes(a.kind)), (a) => a.baseBal));
    const invest = r2(sum(accts.filter((a) => a.kind === 'Investments'), (a) => a.baseBal));
    const property = r2(sum(accts.filter((a) => a.kind === 'Property'), (a) => a.baseBal));
    const cards = d.cards.filter(inS);
    const cardBal = r2(sum(cards, (c) => K.toBase(d, c.bal, c.cur || d.base))), cardLimit = r2(sum(cards, (c) => K.toBase(d, c.limit || 0, c.cur || d.base)));
    const loans = d.loans.filter(inS);
    const loanBal = r2(sum(loans, (l) => l.bal));
    const debt = r2(cardBal + loanBal);
    return { accts, cash, invest, property, cards, cardBal, cardLimit, util: cardLimit ? r2((cardBal / cardLimit) * 100) : 0, loans, loanBal, debt, assets: r2(cash + invest + property), netWorth: r2(cash + invest + property - debt) };
  };
  // Keep one record per month so net worth, debt and utilization have history
  K.snapshot = (d) => { const b = K.balances(d, 'personal'); const key = monthKey(today()); return Object.assign({}, d, { snapshots: Object.assign({}, d.snapshots, { [key]: { nw: b.netWorth, debt: b.debt, util: b.util, loans: b.loanBal, cards: b.cardBal } }) }); };

  K.whereName = (d, w) => { if (!w) return ''; const [k, id] = w.split(':'); const x = (k === 'card' ? d.cards : d.accounts).find((a) => a.id === id); return x ? x.name : ''; };
  K.whereOptions = (d, opts) => d.accounts.filter((a) => !a.archived && (!opts || !opts.cashOnly || ['Everyday', 'Savings', 'Cash'].includes(a.kind))).map((a) => ['acct:' + a.id, a.name + (a.cur !== d.base ? ' (' + a.cur + ')' : '')]).concat(opts && opts.noCards ? [] : d.cards.map((c) => ['card:' + c.id, c.name]));
  K.activeTrip = (d, when) => { const w = when || today(); return d.trips.find((t) => parse(t.start) <= w && w <= parse(t.end)); };

  // ---------------------------------------------------------------- derive: everything a screen shows
  K.derive = (data, ctx) => {
    const T = today();
    const scope = ctx.scope;
    const inS = (x) => (scope === 'household' ? !!x.shared : true);
    const monthStart = new Date(T.getFullYear(), T.getMonth(), 1), monthEnd = new Date(T.getFullYear(), T.getMonth() + 1, 0);
    const txAll = data.txns.filter(inS).slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const cur = ctx.currency;
    const tx = cur === 'Combined' ? txAll : txAll.filter((t) => t.cur === cur);
    const val = (t) => (cur === 'Combined' ? t.base : t.amt);
    const inMonth = (t, y, m) => { const d = parse(t.date); return d.getFullYear() === y && d.getMonth() === m; };
    const agg = (list, y, m, useVal) => {
      const f = useVal ? val : (t) => t.base;
      const mt = list.filter((t) => inMonth(t, y, m));
      const cats = {}; K.CAT_ORDER.forEach((c) => (cats[c] = 0));
      mt.filter((t) => t.type === 'expense').forEach((t) => (cats[t.cat] = r2((cats[t.cat] || 0) + f(t))));
      const o = { income: r2(sum(mt.filter((t) => t.type === 'income'), f)), spending: r2(sum(mt.filter((t) => t.type === 'expense'), f)), saved: r2(sum(mt.filter((t) => t.type === 'saving'), f)), debtPaid: r2(sum(mt.filter((t) => t.type === 'debt'), f)), interest: r2(sum(mt.filter((t) => t.type === 'debt'), (t) => t.interest || 0)), count: mt.length, cats };
      o.net = r2(o.income - o.spending - o.saved - o.debtPaid); o.rate = o.income ? r2((o.saved / o.income) * 100) : 0;
      return o;
    };
    const month = agg(tx, T.getFullYear(), T.getMonth(), true);
    const B = K.balances(data, scope);

    // Plan: the one source of Safe to Spend
    const bills = data.bills.filter(inS);
    const billDates = (b) => occurrences(iso(billAnchor(b)), billFreq(b), monthStart, monthEnd);
    const commitments = r2(sum(bills, (b) => billDates(b).length * K.toBase(data, b.amt, b.cur || data.base)));
    const loanPays = B.loans.filter((l) => l.bal > 0 && l.pay).map((l) => ({ l, n: futureOccurrences(l.next || iso(T), l.freq, monthStart, monthEnd).length }));
    const debtPlanned = r2(sum(loanPays, (x) => x.n * x.l.pay));
    const goals0 = data.goals.filter(inS);
    const savingsPlanned = r2(sum(goals0, (g) => g.monthly || 0));
    const incomeSrc = data.income.filter(inS);
    const incomeExpected = r2(sum(incomeSrc, (s) => occurrences(s.next || iso(T), s.freq, monthStart, monthEnd).length * K.toBase(data, s.amt, s.cur || data.base)));
    const monthAll = agg(txAll, T.getFullYear(), T.getMonth(), false);
    const expectedIncome = r2(Math.max(incomeExpected, monthAll.income));
    const flexSpent = r2(sum(txAll.filter((t) => t.type === 'expense' && !t.recurring && inMonth(t, T.getFullYear(), T.getMonth())), (t) => t.base));
    const available = r2(expectedIncome - commitments - debtPlanned - savingsPlanned);
    const budgetRows = Object.keys(data.budget).filter((c) => data.budget[c] > 0).map((c) => ({ cat: c, plan: data.budget[c], actual: monthAll.cats[c] || 0 }));

    // Safe to Spend = cash you can use today minus everything due before your next payday
    // (or month end when no income is set). It works from the first day, without history.
    const nextPays = incomeSrc.map((s) => K.nextDate(s.next || iso(T), s.freq, addDays(T, 1)));
    const nextPay = nextPays.length ? nextPays.reduce((a, b) => (b < a ? b : a)) : null;
    const until = nextPay ? addDays(nextPay, -1) : monthEnd;
    const inWin = (d) => d >= T && d <= until;
    const paidThisMonth0 = (id) => txAll.filter((t) => t.recurring === id && inMonth(t, T.getFullYear(), T.getMonth())).length;
    const spendable = B.accts.filter((a) => a.kind === 'Everyday' || a.kind === 'Cash');
    const cashNow = r2(sum(spendable, (a) => a.baseBal));
    const billsDue = bills.map((b) => ({ b, n: Math.max(0, occurrences(iso(billAnchor(b)), billFreq(b), T, until).length - paidThisMonth0(b.id)) })).filter((x) => x.n && !(x.b.pay || '').startsWith('card:'));
    const billsDueAmt = r2(sum(billsDue, (x) => x.n * K.toBase(data, x.b.amt, x.b.cur || data.base)));
    const cardsDue = B.cards.map((c) => {
      if (!c.dueDay || !(c.stmtBal > 0)) return null;
      const due = K.nextDate(iso(new Date(T.getFullYear(), T.getMonth(), c.dueDay)), 'Monthly', T);
      if (!inWin(due)) return null;
      const priorDue = addMonths(due, -1);
      const paid = sum(txAll.filter((t) => t.to === 'card:' + c.id && parse(t.date) > priorDue && parse(t.date) <= T), (t) => {
        const p = (t.postings || []).find((x) => x.where === 'card:' + c.id);
        return p ? p.amount : t.base / K.rate(data, c.cur || data.base, data.base);
      });
      return Object.assign({}, c, { dueAmount: r2(Math.max(0, Math.min(c.bal, c.stmtBal - paid))) });
    }).filter((c) => c && c.dueAmount > 0);
    const cardsDueAmt = r2(sum(cardsDue, (c) => K.toBase(data, c.dueAmount, c.cur || data.base)));
    const loansDue = B.loans.filter((l) => l.bal > 0 && l.pay).map((l) => ({ l, n: futureOccurrences(l.next || iso(T), l.freq, T, until).length })).filter((x) => x.n);
    const loansDueAmt = r2(sum(loansDue, (x) => x.n * x.l.pay));
    const savingsLeft = r2(Math.max(0, savingsPlanned - monthAll.saved));
    const safe = r2(cashNow - billsDueAmt - cardsDueAmt - loansDueAmt - savingsLeft);
    const daysLeft = days(T, until) + 1;
    const plan = { hasAccounts: spendable.length > 0, hasIncome: incomeSrc.length > 0, cashNow, billsDue, billsDueAmt, cardsDue, cardsDueAmt, loansDue, loansDueAmt, savingsLeft, until, nextPay, expectedIncome, commitments, debtPlanned, savingsPlanned, available, flexibleSpent: flexSpent, safe, daysLeft, perDay: r2(Math.max(0, safe) / daysLeft), budgetRows, budgetPlan: r2(sum(budgetRows, (b) => b.plan)), budgetActual: r2(sum(budgetRows, (b) => b.actual)), savedSoFar: monthAll.saved, debtSoFar: monthAll.debtPaid, monthEnd };

    // Series: last 12 months, current month last
    const series = [];
    for (let k = 11; k >= 0; k--) {
      const d = new Date(T.getFullYear(), T.getMonth() - k, 1);
      const a = agg(txAll, d.getFullYear(), d.getMonth(), false);
      const snap = k === 0 ? { nw: B.netWorth, debt: B.debt, util: B.util, loans: B.loanBal, cards: B.cardBal } : data.snapshots[monthKey(d)];
      series.push(Object.assign(a, { key: monthKey(d), m: MON[d.getMonth()], y: d.getFullYear(), mi: d.getMonth(), date: d, current: k === 0, netWorth: snap ? snap.nw : null, debt: snap ? snap.debt : null, util: snap ? snap.util : null, loans: snap ? snap.loans : null, cards: snap ? snap.cards : null }));
    }
    const firstTx = data.txns.length ? data.txns.reduce((a, t) => (t.date < a ? t.date : a), data.txns[0].date) : null;
    const activeSeries = series.filter((s) => s.count > 0 || s.current || s.netWorth != null);

    // Goals
    const goals = goals0.map((g) => {
      const acct = g.linked && data.accounts.find((a) => a.id === g.linked);
      const s = acct ? r2(acct.bal * K.rate(data, acct.cur, data.base)) : g.saved || 0;
      const left = Math.max(0, g.target - s);
      const months = g.monthly > 0 ? Math.ceil(left / g.monthly) : null;
      const eta = months == null ? null : new Date(T.getFullYear(), T.getMonth() + months, 1);
      return Object.assign({}, g, { savedNow: s, pct: g.target ? Math.min(100, Math.round((s / g.target) * 100)) : 0, left, months, eta, etaLabel: left <= 0 ? 'Funded' : eta ? K.fmtMonth(eta) : 'No monthly amount' });
    });

    // Trips
    const trips = data.trips.map((tr) => {
      const tt = data.txns.filter((t) => t.trip === tr.id && t.type === 'expense');
      const s = parse(tr.start), e = parse(tr.end);
      const total = days(s, e) + 1, day = Math.min(total, days(s, T) + 1);
      const status = T < s ? 'planned' : T > e ? 'done' : 'active';
      return Object.assign({}, tr, { spent: r2(sum(tt, (t) => t.base)), native: r2(sum(tt.filter((t) => t.cur === tr.cur), (t) => t.amt)), total, day, status, txns: tt });
    });

    // Upcoming (next 45 days)
    const horizon = addDays(T, 45), upcoming = [];
    bills.forEach((b) => occurrences(iso(billAnchor(b)), billFreq(b), addDays(T, 1), horizon).forEach((d) => upcoming.push({ date: iso(d), name: b.name, amt: K.toBase(data, b.amt, b.cur || data.base), kind: b.kind, route: { r: 'plan', tab: 'bills' }, billId: b.id })));
    B.loans.filter((l) => l.bal > 0 && l.pay).forEach((l) => futureOccurrences(l.next || iso(T), l.freq, T, horizon).forEach((d) => upcoming.push({ date: iso(d), name: l.name, amt: l.pay, kind: 'Loan payment', route: { r: 'loan', id: l.id } })));
    B.cards.filter((c) => c.dueDay && (c.stmtBal || c.bal) > 0).forEach((c) => { const d = K.nextDate(iso(new Date(T.getFullYear(), T.getMonth(), c.dueDay)), 'Monthly', T); if (d <= horizon) upcoming.push({ date: iso(d), name: c.name + ' payment', amt: K.toBase(data, c.stmtBal || c.bal, c.cur || data.base), kind: 'Card due', route: { r: 'card', id: c.id } }); });
    incomeSrc.forEach((s) => occurrences(s.next || iso(T), s.freq, T, horizon).forEach((d) => upcoming.push({ date: iso(d), name: s.name, amt: K.toBase(data, s.amt, s.cur || data.base), kind: 'Income', income: true, route: { r: 'plan', tab: 'overview' } })));
    upcoming.sort((a, b) => (a.date < b.date ? -1 : 1));
    // Bills due this month and not paid yet
    const paidThisMonth = new Set(txAll.filter((t) => t.recurring && inMonth(t, T.getFullYear(), T.getMonth())).map((t) => t.recurring));
    const unpaid = bills.filter((b) => billDates(b).some((d) => d <= T && (!b.since || iso(d) >= b.since)) && !paidThisMonth.has(b.id));

    return Object.assign({ ctx, cur, sym: cur === 'Combined' ? K.sym(data.base) : K.sym(cur), noRate: K.missingRates(data), T, month, plan, series, activeSeries, firstTx, goals, trips, activeTrip: trips.find((t) => t.status === 'active'), tx, txAll, upcoming, unpaid, bills, incomeSrc, agg, empty: data.txns.length === 0 && data.accounts.length === 0 }, B);
  };

  // ---------------------------------------------------------------- forecast (plain arithmetic)
  K.forecast = (data, D, opts) => {
    const sc = opts.scen || {};
    const T = today();
    const closed = D.series.filter((s) => !s.current && s.count > 0).slice(-3);
    const recurringBase = sum(D.bills.filter((b) => b.kind !== 'Annual'), (b) => K.toBase(data, b.amt, b.cur || data.base));
    let flexible = closed.length ? sum(closed, (s) => s.spending - sum(D.bills.filter((b) => b.kind !== 'Annual'), (b) => K.toBase(data, b.amt, b.cur || data.base))) / closed.length : D.plan.flexibleSpent;
    if (opts.assumption === 'Budget based' && D.plan.budgetPlan) flexible = Math.max(0, D.plan.budgetPlan - recurringBase);
    if (opts.assumption === 'Conservative') flexible *= 1.1;
    flexible = Math.max(0, flexible);
    const savingsBase = D.plan.savingsPlanned;
    const run = (s) => {
      const L = D.loans.filter((l) => l.bal > 0 && l.pay).map((l) => ({ id: l.id, name: l.name, bal: l.bal, rate: l.rate || 0, pay: l.pay, freq: l.freq, next: l.next || iso(T), paidOff: null }));
      let nw = D.netWorth; const out = [];
      const goalSaved = {}; D.goals.forEach((g) => (goalSaved[g.id] = g.savedNow)); const goalDone = {};
      for (let k = 1; k <= 12; k++) {
        const ms = new Date(T.getFullYear(), T.getMonth() + k, 1), me = new Date(T.getFullYear(), T.getMonth() + k + 1, 0);
        let income = sum(D.incomeSrc, (x) => occurrences(x.next || iso(T), x.freq, ms, me).length * K.toBase(data, x.amt, x.cur || data.base)) + (s.income || 0);
        if (opts.assumption === 'Conservative') income *= 0.95;
        const annual = sum(D.bills.filter((b) => b.kind === 'Annual' && (b.month || 1) - 1 === ms.getMonth()), (b) => K.toBase(data, b.amt, b.cur || data.base));
        const commitments = recurringBase + annual - (s.pause || 0);
        const spending = commitments + flexible - (s.cut || 0);
        const savings = savingsBase + (s.save || 0);
        let debtPay = 0, interest = 0;
        L.forEach((l, j) => {
          const i = l.rate / 100 / K.perYear(l.freq); let first = true;
          futureOccurrences(l.next, l.freq, ms, me).forEach(() => { if (l.bal <= 0) return; const int = l.bal * i; const p = Math.min(l.bal + int, l.pay + (j === 0 && first ? s.loan || 0 : 0)); l.bal = Math.max(0, l.bal + int - p); interest += int; debtPay += p; first = false; });
          if (l.bal <= 0 && !l.paidOff) l.paidOff = K.fmtMonth(ms);
        });
        D.goals.forEach((g, j) => { if (goalSaved[g.id] < g.target) { goalSaved[g.id] += (g.monthly || 0) + (j === 0 ? s.save || 0 : 0); if (goalSaved[g.id] >= g.target && !goalDone[g.id]) goalDone[g.id] = K.fmtMonth(ms); } });
        const net = income - spending - savings - debtPay;
        nw += income - spending - interest;
        out.push({ label: MON[ms.getMonth()] + (ms.getMonth() === 0 ? ' ’' + String(ms.getFullYear()).slice(2) : ''), income: r2(income), spending: r2(spending), savings: r2(savings), debtPay: r2(debtPay), interest: r2(interest), net: r2(net), safe: r2(income - commitments - debtPay - savings), loanBal: r2(sum(L, (l) => l.bal)), nw: r2(nw), util: D.util, goal0: D.goals[0] ? r2(Math.min(goalSaved[D.goals[0].id], D.goals[0].target)) : null });
      }
      return { months: out, goalDone, payoffs: Object.fromEntries(L.map((l) => [l.id, l.paidOff])) };
    };
    const base = run({}), scen = run(sc);
    const h = opts.horizon || 12;
    const tot = (r, k) => r2(sum(r.months.slice(0, h), (x) => x[k]));
    return { base, scen, h, flexible: r2(flexible), savingsBase, summary: { net: [tot(base, 'net'), tot(scen, 'net')], savings: [tot(base, 'savings'), tot(scen, 'savings')], interest: [tot(base, 'interest'), tot(scen, 'interest')], nw: [base.months[h - 1].nw, scen.months[h - 1].nw], loan: [base.months[h - 1].loanBal, scen.months[h - 1].loanBal] } };
  };

  // ---------------------------------------------------------------- insights (rule-based, only with enough data)
  K.insights = (data, D) => {
    const out = [];
    const f = (n) => K.sym(data.base) + Math.round(n).toLocaleString('en-US');
    const over = D.plan.budgetRows.filter((b) => b.actual > b.plan + 0.5);
    over.forEach((b) => out.push({ id: 'over-' + b.cat, kind: 'Priority', icon: 'alert', title: K.CATS[b.cat].name + ' is past its plan with ' + D.plan.daysLeft + ' days of the month left.', why: 'You planned ' + f(b.plan) + ' and have spent ' + f(b.actual) + '.', cta: 'Open budget', route: { r: 'plan', tab: 'budget' } }));
    if (D.plan.hasAccounts && D.plan.safe < 0) out.push({ id: 'neg', kind: 'Priority', icon: 'alert', title: 'What’s due before ' + K.fmtDate(D.plan.until) + ' is ' + f(-D.plan.safe) + ' more than your everyday cash.', why: 'Bills, card and loan payments and planned savings are all counted.', cta: 'See the calculation', route: { r: 'plan', tab: 'overview' } });
    if (D.util > data.prefs.utilRef) out.push({ id: 'util', kind: 'Credit', icon: 'card', title: 'Card utilization is ' + D.util.toFixed(0) + '%, above your ' + data.prefs.utilRef + '% reference.', why: 'Paying down ' + f(D.cardBal - (data.prefs.utilRef / 100) * D.cardLimit) + ' brings it back under.', cta: 'Open cards', route: { r: 'money', tab: 'cards' } });
    const loans = D.loans.filter((l) => l.bal > 0 && l.rate);
    if (loans.length > 1) { const hi = loans.slice().sort((a, b) => b.rate - a.rate)[0]; out.push({ id: 'debt', kind: 'Debt', icon: 'loan', title: 'Extra payments go furthest on ' + hi.name + ' at ' + hi.rate + '%.', why: 'It has the highest rate of your loans.', cta: 'Try it in Forecast', route: { r: 'stats', tab: 'forecast', scen: { loan: 100 } } }); }
    const cur = D.series[11], prev = D.series[10];
    if (prev.count > 5 && cur.count > 5) {
      const diffs = K.CAT_ORDER.map((c) => [c, cur.cats[c] - prev.cats[c]]).sort((a, b) => b[1] - a[1]);
      if (diffs[0][1] > 50) out.push({ id: 'grow', kind: 'Spending', icon: 'trend', title: K.CATS[diffs[0][0]].name + ' is your fastest growing category this month.', why: 'Up ' + f(diffs[0][1]) + ' compared with last month so far.', cta: 'See spending', route: { r: 'stats', tab: 'spending' } });
    }
    const subs = D.bills.filter((b) => b.kind === 'Subscription');
    if (subs.length >= 3) out.push({ id: 'subs', kind: 'Recurring', icon: 'repeat', title: subs.length + ' subscriptions add up to ' + f(sum(subs, (b) => K.toBase(data, b.amt, b.cur || data.base)) * 12) + ' a year.', why: 'Reviewing them once a year keeps recurring costs honest.', cta: 'Open bills', route: { r: 'plan', tab: 'bills' } });
    D.goals.filter((g) => !g.targetDate && g.left > 0).forEach((g) => out.push({ id: 'goal-' + g.id, kind: 'Goals', icon: 'target', title: g.name + ' has no target date, so Kipu can’t tell whether the monthly amount is enough.', why: g.monthly ? 'At the current pace it’s done in ' + g.etaLabel + '.' : 'It has no monthly amount yet.', cta: 'Open goal', route: { r: 'goal', id: g.id } }));
    (D.cards || []).forEach((c) => { const ex = K.expiryInfo && K.expiryInfo(c); if (!ex) return; if (ex.expired) out.push({ id: 'exp-' + c.id, kind: 'Priority', icon: 'card', title: c.name + (c.last4 ? ' ending ' + c.last4 : '') + ' expired in ' + K.fmtMonth(ex.end) + '.', why: 'Add the new expiry date once the replacement card arrives.', cta: 'Open card', route: { r: 'card', id: c.id } }); else if (ex.soon) out.push({ id: 'exp-' + c.id, kind: 'Credit', icon: 'card', title: c.name + (c.last4 ? ' ending ' + c.last4 : '') + ' expires at the end of ' + K.fmtMonth(ex.end) + '.', why: 'Watch for the replacement and update subscriptions that use this card.', cta: 'Open card', route: { r: 'card', id: c.id } }); });
    if (D.unpaid.length) out.push({ id: 'unpaid', kind: 'Priority', icon: 'calendar', title: D.unpaid.length === 1 ? D.unpaid[0].name + ' was due and isn’t marked as paid.' : D.unpaid.length + ' bills were due and aren’t marked as paid.', why: 'Marking them paid keeps Safe to Spend accurate.', cta: 'Open bills', route: { r: 'plan', tab: 'bills' } });
    const order = { Priority: 0, Credit: 1, Debt: 2, Spending: 3, Savings: 4, Goals: 5, Recurring: 6 };
    return out.sort((a, b) => order[a.kind] - order[b.kind]);
  };

  // ---------------------------------------------------------------- sample data for demos
  K.sampleData = () => {
    let d = Object.assign(K.factory(), { onboarded: true, demo: true, profile: { name: 'Alex Morgan', email: '' }, active: ['CAD', 'USD', 'PEN'] });
    const T = today();
    const ago = (n) => iso(addDays(T, -n));
    d.accounts = [
      { id: 'chq', name: 'Everyday Chequing', inst: 'CIBC', kind: 'Everyday', cur: 'CAD', bal: 5200 },
      { id: 'sav', name: 'Emergency Savings', inst: 'EQ Bank', kind: 'Savings', cur: 'CAD', bal: 4800, shared: true },
      { id: 'usd', name: 'USD Account', inst: 'Wise', kind: 'Everyday', cur: 'USD', bal: 1200 },
      { id: 'rrsp', name: 'RRSP', inst: 'Wealthsimple', kind: 'Investments', cur: 'CAD', bal: 38000 },
    ];
    d.cards = [{ id: 'visa', name: 'Visa Infinite', network: 'Visa', last4: '1187', limit: 10000, bal: 0, stmtBal: 0, closeDay: 8, dueDay: 3, minPay: 10, expiry: iso(addMonths(today(), 1)).slice(0, 7) }, { id: 'mc', name: 'Costco Mastercard', network: 'Mastercard', last4: '4821', limit: 6000, bal: 0, stmtBal: 0, closeDay: 18, dueDay: 12, minPay: 10, expiry: (today().getFullYear() + 3) + '-04' }];
    d.loans = [{ id: 'car', name: 'Car loan', kind: 'Vehicle', lender: 'CIBC', orig: 32000, bal: 18420, rate: 9, pay: 253.73, freq: 'Bi-weekly', next: iso(addDays(T, 3)) }];
    d.income = [{ id: 'sal', name: 'Salary', amt: 3200, cur: 'CAD', freq: 'Bi-weekly', next: iso(addDays(T, 6)), to: 'acct:chq' }];
    d.bills = [{ id: 'rent', name: 'Rent', kind: 'Bill', amt: 1650, day: 1, cat: 'housing', pay: 'acct:chq' }, { id: 'net', name: 'Internet', kind: 'Bill', amt: 75, day: 18, cat: 'bills', pay: 'card:visa' }, { id: 'nf', name: 'Netflix', kind: 'Subscription', amt: 20.99, day: 5, cat: 'subs', pay: 'card:visa' }, { id: 'sp', name: 'Spotify', kind: 'Subscription', amt: 11.99, day: 9, cat: 'subs', pay: 'card:mc' }, { id: 'gym', name: 'Gym', kind: 'Subscription', amt: 49, day: 2, cat: 'subs', pay: 'acct:chq' }];
    d.goals = [{ id: 'ef', name: 'Emergency Fund', target: 10000, monthly: 500, targetDate: iso(addMonths(T, 14)).slice(0, 7), linked: 'sav', shared: true }, { id: 'cam', name: 'New camera', target: 2500, saved: 400, monthly: 150 }];
    d.budget = { housing: 1650, bills: 100, groceries: 600, dining: 300, transport: 250, shopping: 200, subs: 90, entertainment: 100 };
    const add = (t) => (d = K.addTxn(d, t));
    const spend = [['Costco', 'groceries', 186.4, 'card:mc', 2], ['Loblaws', 'groceries', 92.35, 'card:mc', 5], ['Pai Northern Thai', 'dining', 48.6, 'card:visa', 3], ['Shell', 'transport', 72.4, 'card:visa', 7], ['Uber', 'transport', 23.5, 'card:visa', 1], ['Amazon', 'shopping', 64.99, 'card:mc', 4], ['Tim Hortons', 'dining', 12.4, 'card:visa', 0], ['Cineplex', 'entertainment', 34.5, 'card:visa', 6]];
    const from = addDays(T, -85);
    occurrences(d.income[0].next, 'Bi-weekly', from, T).forEach((x) => add({ type: 'income', cat: 'income', merchant: 'Salary', amt: 3200, from: 'acct:chq', date: iso(x) }));
    d.bills.forEach((b) => occurrences(iso(billAnchor(b)), 'Monthly', from, T).forEach((x) => add({ type: 'expense', cat: b.cat, merchant: b.name, amt: b.amt, from: b.pay, recurring: b.id, date: iso(x) })));
    for (let mback = 2; mback >= 0; mback--) {
      const shift = mback * 30;
      spend.forEach(([m, c, a, f, dd]) => add({ type: 'expense', cat: c, merchant: m, amt: r2(a * (1 + (mback - 1) * 0.08)), from: f, date: ago(shift + dd + 2) }));
      add({ type: 'saving', cat: 'saving', merchant: 'Emergency Fund', amt: 500, from: 'acct:chq', to: 'acct:sav', goal: 'ef', date: ago(shift + 11) });
    }
    occurrences(iso(addDays(T, 3)), 'Bi-weekly', from, addDays(T, -1)).forEach((x) => { const l = d.loans[0]; const s = K.loanSplit(l); add({ type: 'debt', cat: 'debt', merchant: 'Car loan payment', amt: l.pay, from: 'acct:chq', loan: 'car', principal: s.principal, interest: s.interest, date: iso(x) }); });
    d.cards = d.cards.map((c) => Object.assign({}, c, { stmtBal: r2(c.bal * 0.8) }));
    return K.snapshot(d);
  };
})();
