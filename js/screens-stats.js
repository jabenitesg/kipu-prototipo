/* Kipu · Stats: statistics (actuals only), insights, reviews, forecast (projections only) */
(function () {
  const K = window.K;
  const { useState, useMemo } = React;
  const { html, useApp, Icon, Metric, Trend, SectionHeader, Row, Tile, Bar, Stripe, KeyRow, ContextFilter, Tabs, Chips, Seg, EmptyState, LineChart, BarChart, ChartBox, InsightCard } = K;
  const pctCh = (a, b) => (b ? ((a - b) / Math.abs(b)) * 100 : 0);

  const STATS_TABS = [['overview', 'Statistics'], ['insights', 'Insights'], ['reviews', 'Reviews'], ['forecast', 'Forecast']];
  K.Stats = function Stats({ route }) {
    const { go, wide, D } = useApp();
    const tab = route.tab || 'overview';
    const Body = { overview: Statistics, spending: Statistics, income: Statistics, insights: Insights, reviews: Reviews, forecast: Forecast }[tab] || Statistics;
    return html`<div class="stack">
      <div class="between" style=${{ paddingTop: wide ? 0 : '8px', flexWrap: 'wrap' }}><div class="stack-s" style=${{ gap: '4px' }}><span class="eyebrow">Financial performance</span><h1 style=${{ fontSize: '30px', fontWeight: 800 }}>Stats</h1></div><${ContextFilter} show=${tab === 'overview' || tab === 'spending' || tab === 'income' ? ['scope', 'currency', 'period'] : ['scope']} /></div>
      <${Tabs} tabs=${STATS_TABS} value=${['spending', 'income'].includes(tab) ? 'overview' : tab} onChange=${(t) => go({ r: 'stats', tab: t }, true)} />
      ${D.noRate && D.noRate.length > 0 && html`<${K.RateNote} list=${D.noRate} />`}<${K.BalanceLineNote} /><${K.LoanPayNote} /><${K.TransferNote} /><${K.CardPayNote} /><${K.PurchaseNote} />
      <${Body} route=${route} /></div>`;
  };

  // ---------------------------------------------------------------- Statistics
  const SECTIONS = [['overview', 'Overview'], ['big', 'Big picture'], ['spending', 'Spending'], ['income', 'Income'], ['cashflow', 'Cash flow'], ['networth', 'Net worth'], ['debt', 'Debt'], ['credit', 'Credit']];
  function Statistics({ route }) {
    const { D, openSheet, wide } = useApp();
    const [sec, setSec] = useState(route.tab === 'spending' || route.tab === 'income' ? route.tab : route.sub || 'overview');
    if (!D.txAll.length) return html`<div class="card"><${EmptyState} icon="chart" title="No numbers yet" text="Statistics fill in as you add transactions. Importing a statement is the fastest way to bring in history." action="Import a statement" onAction=${() => openSheet({ k: 'statement' })} /></div>`;
    const Body = { overview: SOverview, big: SBig, spending: SSpending, income: SIncome, cashflow: SCash, networth: SNW, debt: SDebt, credit: SCredit }[sec];
    // Computer and tablet: every section on one page. Phone: one section at a time.
    const BODIES = { overview: SOverview, big: SBig, spending: SSpending, income: SIncome, cashflow: SCash, networth: SNW, debt: SDebt, credit: SCredit };
    if (wide) return html`<div class="stack" style=${{ gap: '28px' }}><${MonthNav} />${SECTIONS.map(([k, label]) => { const B = BODIES[k]; return html`<section key=${k} class="stack" style=${{ gap: '14px' }}>${k !== 'overview' && html`<h2 class="stats-h">${label}</h2>`}<${B} /></section>`; })}</div>`;
    return html`<div class="stack"><${Chips} options=${SECTIONS.map((s) => s[0])} labels=${SECTIONS.map((s) => s[1])} value=${sec} onChange=${setSec} scroll=${true} />${['overview', 'spending', 'income'].includes(sec) && html`<${MonthNav} />`}<${Body} /></div>`;
  }
  // ---------------------------------------------------------------- Big picture: all history by month or by year, and any two periods side by side
  function SBig() {
    const { D, fmt, wide } = useApp();
    const H = useMemo(() => K.history(D.txAll), [D.txAll]);
    const [mode, setMode] = useState('month');
    const list = mode === 'year' ? H.years : H.months;
    const filled = list.filter((x) => x.count > 0);
    const byKey = (k) => list.find((x) => x.key === k);
    const latest = filled[filled.length - 1];
    const defB = (x) => { if (!x) return null; if (mode === 'year') return byKey(String(x.year - 1)); const ly = byKey(String(x.year - 1) + x.key.slice(4)); if (ly && ly.count) return ly; const i = filled.indexOf(x); return filled[i - 1] || null; };
    const [aKey, setA] = useState(null), [bKey, setB] = useState(null);
    const A0 = (aKey && byKey(aKey)) || latest, B0 = (bKey && byKey(bKey)) || defB(A0);
    // When one side is the period we're in, the other is cut to the same stretch so they compare fairly
    const cut = A0 && B0 && (A0.current || B0.current) && !(A0.current && B0.current);
    const A = cut && B0.current ? Object.assign({}, A0, K.sameStretch(D.txAll, A0)) : A0;
    const B = cut && A0.current ? Object.assign({}, B0, K.sameStretch(D.txAll, B0)) : B0;
    const change = (a, b) => (b ? ((a - b) / Math.abs(b)) * 100 : null);
    const pct = (v) => (v == null || !isFinite(v) ? '' : (v > 0 ? '+' : '') + v.toFixed(0) + '%');
    const signed = (v) => (v >= 0 ? '+' : '−') + fmt(Math.abs(v));
    if (!filled.length) return null;
    // Long histories scroll sideways and open on the most recent months
    const bars = html`<div style=${{ overflowX: 'auto' }} ref=${(el) => { if (el && !el.dataset.end) { el.scrollLeft = el.scrollWidth; el.dataset.end = '1'; } }}><div style=${{ minWidth: list.length > 12 ? list.length * 46 + 'px' : null }}><${BarChart} groups=${list.map((x, i) => ({ label: list.length <= 12 || x === A0 || i % Math.ceil(list.length / 8) === 0 ? x.label : '', values: [x.income, x.out] }))} colors=${['var(--c2)', 'var(--c1)']} hi=${list.indexOf(A0)} fmtY=${fmt.k} h=${200} /></div></div>`;
    const rows = list.slice().reverse().filter((x) => x.count > 0 || x.current);
    const opts = rows.map((x) => html`<option key=${x.key} value=${x.key}>${x.long}</option>`);
    const cats = A && B ? Array.from(new Set(Object.keys(A.cats).concat(Object.keys(B.cats)))).map((c) => ({ c, a: A.cats[c] || 0, b: B.cats[c] || 0 })).sort((x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b)).slice(0, 6) : [];
    const metric = (label, a, b, goodUp) => { const d = b == null ? null : a - b; return html`<div class="card flat stack-s" style=${{ gap: '4px', padding: '12px 14px' }}><span class="tiny muted">${label}</span><b class="num" style=${{ fontSize: '18px' }}>${fmt(a)}</b>${d != null && html`<span class="tiny num" style=${{ color: d === 0 ? 'var(--muted)' : (d > 0) === goodUp ? 'var(--pos)' : 'var(--crit)' }}>${signed(d)}${change(a, b) != null ? ' · ' + pct(change(a, b)) : ''}</span>`}</div>`; };
    return html`<div class="stack" style=${{ gap: '14px' }}>
      <div class="between" style=${{ flexWrap: 'wrap', gap: '10px' }}><span class="small muted" style=${{ maxWidth: '46ch', lineHeight: 1.45 }}>Everything since your first movement. Out is spending plus loan payments; transfers between your own accounts don't count.</span><div style=${{ minWidth: '200px' }}><${Seg} options=${['month', 'year']} labels=${['Months', 'Years']} value=${mode} onChange=${(m) => { setMode(m); setA(null); setB(null); }} /></div></div>
      <${ChartBox} title=${mode === 'year' ? 'Year by year' : 'Month by month'} question="Did more come in than went out?" legend=${[['var(--c2)', 'Money in'], ['var(--c1)', 'Money out']]}>${bars}</${ChartBox}>
      <div class=${wide ? 'grid g2' : 'stack'} style=${{ gap: '14px', alignItems: 'start' }}>
        <div class="card tight list">${rows.map((x, i) => { const prev = rows[i + 1]; const d = prev && prev.count ? x.left - prev.left : null; return html`<div key=${x.key} class="lrow" style=${{ gap: '10px', alignItems: 'flex-start' }}><span class="grow stack-s" style=${{ gap: '2px', minWidth: 0 }}><span class="t1" style=${{ fontSize: '14px' }}>${x.long}${x.current ? html`<span class="muted" style=${{ fontWeight: 400 }}> · so far</span>` : ''}</span><span class="tiny muted num">Money in ${fmt(x.income)}<span style=${{ padding: '0 5px' }}>·</span>Money out ${fmt(x.out)}${x.rate != null ? html`<span style=${{ padding: '0 5px' }}>·</span>${x.rate.toFixed(0) + '% kept'}` : ''}</span></span><span class="stack-s" style=${{ gap: '2px', alignItems: 'flex-end' }}><b class="num" style=${{ color: x.left >= 0 ? 'var(--pos)' : 'var(--crit)' }}>${signed(x.left)}</b>${d != null && html`<span class="tiny muted num">${(d >= 0 ? '▲ ' : '▼ ') + fmt(Math.abs(d))}</span>`}</span></div>`; })}</div>
        ${A && html`<div class="card stack" style=${{ gap: '12px' }}><h3 style=${{ fontSize: '16px' }}>Compare</h3>
          <div class="grid" style=${{ gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}><select class="input" aria-label="First period" value=${A0.key} onChange=${(e) => setA(e.target.value)}>${opts}</select><span class="small muted">vs</span><select class="input" aria-label="Second period" value=${B0 ? B0.key : ''} onChange=${(e) => setB(e.target.value)}>${opts}</select></div>
          ${cut && html`<span class="tiny muted">${mode === 'year' ? 'Same stretch in both: January 1 to ' + K.fmtDate(K.iso(K.today())) + '.' : 'Same stretch in both: day 1 to ' + K.today().getDate() + '.'}</span>`}
          <div class="grid g3" style=${{ gap: '8px' }}>${metric('Money in', A.income, B && B.income, true)}${metric('Money out', A.out, B && B.out, false)}${metric('Left over', A.left, B && B.left, true)}</div>
          ${cats.length > 0 && html`<div class="stack-s" style=${{ gap: '0' }}><span class="eyebrow" style=${{ paddingBottom: '6px' }}>Biggest changes by category</span>${cats.map((r) => { const d = r.a - r.b; return html`<div key=${r.c} class="between small" style=${{ padding: '8px 0', borderTop: '1px solid var(--line)', gap: '8px' }}><span style=${{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${(K.CATS[r.c] || { name: r.c }).name}</span><span class="num muted" style=${{ marginLeft: 'auto' }}>${fmt(r.b)} → ${fmt(r.a)}</span><b class="num" style=${{ minWidth: '84px', textAlign: 'right', color: d === 0 ? 'var(--muted)' : d > 0 ? 'var(--crit)' : 'var(--pos)' }}>${signed(d)}</b></div>`; })}</div>`}
        </div>`}
      </div></div>`;
  }

  // ‹ August 2026 ›: step through months; the current month is marked when it has nothing yet
  function MonthNav() {
    const { D, ctx, setCtx } = useApp();
    const i = K.statIdx(D, ctx);
    if (i == null) return html`<div class="between"><span class="small muted">Last 12 months</span><button class="link" onClick=${() => setCtx({ period: K.statIdx(D, {}), periodSet: false })}>By month</button></div>`;
    const x = D.series[i];
    const empty = D.series[11] && !D.series[11].count && i !== 11 && !ctx.periodSet;
    const go = (j) => setCtx({ period: Math.max(0, Math.min(11, j)), periodSet: true });
    return html`<div class="stack-s" style=${{ gap: '4px' }}><div class="month-nav"><button class="ic n" aria-label="Previous month" disabled=${i <= 0} onClick=${() => go(i - 1)}><${Icon} n="back" s=${18} w=${2.2} /></button><span class="grow" style=${{ textAlign: 'center', fontWeight: 700 }}>${K.MONTH_LONG[x.mi] + ' ' + x.y}${x.current ? html`<span class="muted" style=${{ fontWeight: 400 }}> · so far</span>` : ''}</span><button class="ic n" aria-label="Next month" disabled=${i >= 11} onClick=${() => go(i + 1)}><${Icon} n="next" s=${18} w=${2.2} /></button></div>
      ${empty && html`<span class="tiny muted" style=${{ textAlign: 'center' }}>${K.MONTH_LONG[D.series[11].mi] + ' has no movements yet, so this shows the latest month that does.'}</span>`}</div>`;
  }
  const pick = (D, ctx) => { const i = K.statIdx(D, ctx); return i == null ? null : D.series[i]; };
  const periodTotals = (D, ctx) => {
    const s = pick(D, ctx);
    if (s) return Object.assign({ label: K.MONTH_LONG[s.mi] + ' ' + s.y + (s.current ? ' so far' : '') }, s);
    const o = { label: 'Last 12 months', income: 0, spending: 0, saved: 0, debtPaid: 0, net: 0, cats: {} };
    D.series.forEach((x) => { ['income', 'spending', 'saved', 'debtPaid', 'net'].forEach((k) => (o[k] += x[k])); K.CAT_ORDER.forEach((c) => (o.cats[c] = (o.cats[c] || 0) + x.cats[c])); });
    o.rate = o.income ? (o.saved / o.income) * 100 : 0; o.netWorth = D.netWorth; o.debt = D.debt;
    return o;
  };

  function SOverview() {
    const { D, ctx, fmt, wide } = useApp();
    const p = periodTotals(D, ctx);
    const idx = K.statIdx(D, ctx);
    const prev = idx != null && idx > 0 && D.series[idx - 1].count ? D.series[idx - 1] : null;
    const tr = (a, b, goodUp, isPts) => (b == null ? null : html`<${Trend} small=${true} d=${a - b} good=${a === b ? null : (a > b) === goodUp} text=${isPts ? (a - b > 0 ? '+' : '') + (a - b).toFixed(1) + ' pts' : (pctCh(a, b) > 0 ? '+' : '') + pctCh(a, b).toFixed(1) + '%'} />`);
    const S = D.activeSeries;
    const Tile2 = ({ cls, label, value, trend, children }) => html`<div class=${'card ' + (cls || '')} style=${{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}><span class="metric stack-s" style=${{ gap: '4px' }}><span class="l">${label}</span><span class="v num" style=${{ fontSize: '22px' }}>${value}</span></span>${trend && html`<span>${trend}</span>`}${children}</div>`;
    return html`<div class="stack">
      <div class="between"><h3 style=${{ fontSize: '16px' }}>${p.label}</h3>${prev && html`<span class="tiny muted">vs ${K.MONTH_LONG[prev.mi]}</span>`}</div>
      <div class=${wide ? 'grid w3' : 'grid g2'} style=${{ gap: '12px' }}>
        <${Tile2} cls="solid" label="Spending" value=${fmt(p.spending)} trend=${tr(p.spending, prev && prev.spending, false)} />
        <${Tile2} cls="tint" label="Income" value=${fmt(p.income)} trend=${tr(p.income, prev && prev.income, true)} />
        <${Tile2} cls="tint" label="Saved" value=${fmt(p.saved)} trend=${tr(p.saved, prev && prev.saved, true)} />
        <${Tile2} label="Savings rate" value=${(p.rate || 0).toFixed(1) + '%'} trend=${tr(p.rate, prev && prev.rate, true, true)}><${K.Segs} pct=${p.rate || 0} n=${20} h=${6} color="var(--acc)" /></${Tile2}>
        <${Tile2} cls="tint" label="Net worth" value=${p.netWorth != null ? fmt(p.netWorth) : '—'} />
        <${Tile2} label="Total debt" value=${p.debt != null ? fmt(p.debt) : '—'} />
      </div>
      ${prev && html`<span class="tiny muted">Green helps you, amber deserves a look.</span>`}
      ${S.length > 1 && html`<${ChartBox} title="Income and spending" question="Did more come in than went out each month?" legend=${[['var(--c2)', 'Income'], ['var(--c1)', 'Spending']]}><${BarChart} groups=${S.map((s) => ({ label: s.m, values: [s.income, s.spending] }))} colors=${['var(--c2)', 'var(--c1)']} hi=${S.length - 1} fmtY=${fmt.k} /></${ChartBox}>`}</div>`;
  }

  function SSpending() {
    const { D, ctx, fmt, wide, data } = useApp();
    const p = periodTotals(D, ctx);
    const idx = K.statIdx(D, ctx);
    const prevCats = idx != null && idx > 0 && D.series[idx - 1].count ? D.series[idx - 1].cats : null;
    const order = K.CAT_ORDER.filter((c) => (p.cats[c] || 0) > 0).sort((a, b) => p.cats[b] - p.cats[a]);
    const max = p.cats[order[0]] || 1;
    const S = D.activeSeries;
    const avg = S.length > 1 ? K.sum(S.slice(0, -1), (s) => s.spending) / (S.length - 1) : null;
    const mt = D.txAll.filter((t) => t.type === 'expense' && (idx == null || t.date.slice(0, 7) === D.series[idx].key));
    const merchants = {}; mt.forEach((t) => { const n = K.txnName(data, t); merchants[n] = (merchants[n] || 0) + t.base; });
    const topM = Object.keys(merchants).sort((a, b) => merchants[b] - merchants[a]).slice(0, 6);
    const cat = html`<div class="card stack" style=${{ gap: '12px' }}><div class="between"><h3 style=${{ fontSize: '16px' }}>Where it went · ${p.label}</h3><span class="amt">${fmt(p.spending)}</span></div>
      ${order.length ? order.map((c) => html`<div key=${c} class="stack-s" style=${{ gap: '5px' }}><div class="between small"><span class="row" style=${{ gap: '8px' }}><${Icon} n=${K.CATS[c].icon} s=${15} c="var(--muted)" />${K.CATS[c].name}</span><span class="row" style=${{ gap: '8px' }}>${prevCats && Math.abs(p.cats[c] - prevCats[c]) >= 20 && html`<span class="tiny" style=${{ color: p.cats[c] > prevCats[c] ? 'var(--warn)' : 'var(--pos)' }}>${p.cats[c] > prevCats[c] ? '▲' : '▼'} ${fmt(Math.abs(p.cats[c] - prevCats[c]))}</span>`}<span class="amt">${fmt(p.cats[c])}</span></span></div><${Bar} pct=${(p.cats[c] / max) * 100} color="var(--c1)" mark=${prevCats ? (prevCats[c] / max) * 100 : null} /></div>`) : html`<span class="muted small">No spending in this period.</span>`}
      ${prevCats && html`<span class="tiny muted">Tick = previous month.</span>`}</div>`;
    const trend = S.length > 1 && html`<${ChartBox} title="Spending over time" question="Is spending steady, or are some months unusual?"><${LineChart} labels=${S.map((s) => s.m)} series=${[{ values: S.map((s) => s.spending), color: 'var(--c1)', area: true }]} ref=${avg ? { value: avg, label: 'avg ' + fmt(avg), color: 'var(--muted)' } : null} fmtY=${fmt.k} /><span class="tiny muted">The current month is month to date.</span></${ChartBox}>`;
    const mer = topM.length > 0 && html`<div class="stack-s"><${SectionHeader} title="Top merchants" /><div class="card tight list">${topM.map((m) => html`<${Row} key=${m} title=${m} right=${fmt(merchants[m])} />`)}</div></div>`;
    return wide ? html`<div class="grid w2" style=${{ alignItems: 'start' }}>${cat}<div class="stack">${trend}${mer}</div></div>` : html`<div class="stack">${cat}${trend}${mer}</div>`;
  }

  function SIncome() {
    const { D, fmt, data } = useApp();
    const S = D.activeSeries;
    const byCur = {}; D.txAll.filter((t) => t.type === 'income').forEach((t) => (byCur[t.cur] = (byCur[t.cur] || 0) + t.amt));
    const tot = K.sum(S, (s) => s.income);
    return html`<div class="stack">
      <${ChartBox} title="Income by month" question="How steady is what comes in?"><${BarChart} groups=${S.map((s) => ({ label: s.m, values: [s.income] }))} colors=${['var(--c2)']} hi=${S.length - 1} fmtY=${fmt.k} labelTop=${fmt.k} /></${ChartBox}>
      <div class="grid g3" style=${{ gap: '10px' }}><div class="card solid"><${Metric} label="Total" value=${fmt(tot)} /></div><div class="card tint"><${Metric} label="Monthly average" value=${fmt(tot / Math.max(1, S.length))} /></div><div class="card tint"><${Metric} label="Sources" value=${String(D.incomeSrc.length)} /></div></div>
      ${Object.keys(byCur).length > 1 && html`<div class="card stack-s"><h3 style=${{ fontSize: '16px' }}>By original currency</h3>${Object.keys(byCur).map((c) => html`<div key=${c} class="between small"><span>${c}</span><b class="num">${fmt.native(byCur[c], c)}</b></div>`)}<span class="tiny muted">Each payment keeps its own amount and rate.</span></div>`}</div>`;
  }

  function SCash() {
    const { D, ctx, fmt, wide } = useApp();
    const p = periodTotals(D, ctx);
    const left = p.income - p.spending - p.saved - p.debtPaid;
    const S = D.activeSeries;
    return html`<div class=${wide ? 'grid w2' : 'stack'} style=${wide ? { alignItems: 'start' } : null}>
      <div class="card stack" style=${{ gap: '12px' }}><h3 style=${{ fontSize: '16px' }}>Where income went · ${p.label}</h3>
        ${p.income > 0 && html`<${Stripe} h=${16} parts=${[[p.spending, 'var(--c1)'], [p.saved, 'var(--c2)'], [p.debtPaid, 'var(--c3)'], [Math.max(0, left), 'var(--neutral)']]} />`}
        <${KeyRow} color="transparent" label="Income" value=${fmt(p.income)} bold=${true} /><${KeyRow} color="var(--c1)" label="Spending" value=${'−' + fmt(p.spending)} /><${KeyRow} color="var(--c2)" label="Saved to goals" value=${'−' + fmt(p.saved)} /><${KeyRow} color="var(--c3)" label="Loan payments" value=${'−' + fmt(p.debtPaid)} />
        <div style=${{ borderTop: '1.5px solid var(--ink)', paddingTop: '10px' }}><${KeyRow} color="var(--neutral)" label="Left over" value=${fmt(left, { sign: true })} bold=${true} /></div>
        <span class="tiny muted">Transfers between your own accounts and card payments aren’t counted, so nothing appears twice.</span></div>
      ${S.length > 1 && html`<${ChartBox} title="Left over each month" question="Which months added to your cushion?"><${BarChart} groups=${S.map((s) => ({ label: s.m, values: [Math.max(0, s.net)] }))} colors=${['var(--c2)']} fmtY=${fmt.k} hi=${S.length - 1} labelTop=${fmt.k} /></${ChartBox}>`}</div>`;
  }

  function SNW() {
    const { D, fmt, wide } = useApp();
    const S = D.series.filter((s) => s.netWorth != null);
    return html`<div class=${wide ? 'grid w2' : 'stack'} style=${wide ? { alignItems: 'start' } : null}>
      <${ChartBox} title="Net worth" question="Is what you own growing faster than what you owe?">
        <div class="grid g2" style=${{ gap: '8px' }}><${Metric} label="Now" value=${fmt(D.netWorth)} />${S.length > 1 && html`<${Metric} label=${'Since ' + S[0].m} value=${fmt(D.netWorth - S[0].netWorth, { sign: true })} tone=${D.netWorth >= S[0].netWorth ? 'pos' : 'warn'} />`}</div>
        ${S.length > 1 ? html`<${LineChart} labels=${S.map((s) => s.m)} series=${[{ values: S.map((s) => s.netWorth), color: 'var(--c1)', area: true }]} fmtY=${fmt.k} />` : html`<span class="small muted">Kipu records net worth once a month. The chart appears after your second month.</span>`}</${ChartBox}>
      <div class="card stack" style=${{ gap: '12px' }}><h3 style=${{ fontSize: '16px' }}>What it’s made of</h3><${Stripe} h=${14} parts=${[[D.cash, 'var(--c1)'], [D.invest, 'var(--c2)'], [D.property, 'var(--c3)']]} />
        <${KeyRow} color="var(--c1)" label="Cash & savings" value=${fmt(D.cash)} /><${KeyRow} color="var(--c2)" label="Investments" value=${fmt(D.invest)} /><${KeyRow} color="var(--c3)" label="Property" value=${fmt(D.property)} /><${KeyRow} color="var(--c5)" label="Debt" value=${'−' + fmt(D.debt)} /></div></div>`;
  }

  function SDebt() {
    const { D, fmt, wide } = useApp();
    if (!D.loans.length && !D.cards.length) return html`<div class="card"><${EmptyState} icon="loan" title="No debt tracked" text="Add loans or credit cards in Money to see progress here." /></div>`;
    const S = D.series.filter((s) => s.debt != null);
    const interest = K.sum(D.series, (s) => s.interest);
    return html`<div class=${wide ? 'grid w2' : 'stack'} style=${wide ? { alignItems: 'start' } : null}>
      <${ChartBox} title="Total debt" question="Is debt actually going down?" legend=${[['var(--c1)', 'Loans'], ['var(--c3)', 'Cards']]}><div class="grid g2" style=${{ gap: '8px' }}><${Metric} label="Now" value=${fmt(D.debt)} />${S.length > 1 && html`<${Metric} label=${'Change since ' + S[0].m} value=${fmt(D.debt - S[0].debt, { sign: true })} tone=${D.debt <= S[0].debt ? 'pos' : 'warn'} />`}</div>
        ${S.length > 1 ? html`<${BarChart} groups=${S.map((s) => ({ label: s.m, values: [s.loans || 0, s.cards || 0] }))} colors=${['var(--c1)', 'var(--c3)']} stacked=${true} fmtY=${fmt.k} hi=${S.length - 1} />` : html`<span class="small muted">The trend appears after your second month.</span>`}</${ChartBox}>
      <div class="stack">${D.loans.length > 0 && html`<div class="card tight list">${D.loans.map((l) => html`<${K.LoanRow} key=${l.id} l=${l} />`)}</div>`}<div class="card stack-s"><div class="between"><span class="muted">Loan interest paid (12 months)</span><span class="amt">${fmt(interest)}</span></div></div></div></div>`;
  }

  function SCredit() {
    const { D, fmt, data, wide } = useApp();
    if (!D.cards.length) return html`<div class="card"><${EmptyState} icon="card" title="No cards tracked" text="Add credit cards in Money to follow utilization." /></div>`;
    const ref = data.prefs.utilRef;
    const S = D.series.filter((s) => s.util != null);
    return html`<div class=${wide ? 'grid w2' : 'stack'} style=${wide ? { alignItems: 'start' } : null}>
      <${ChartBox} title="Card utilization" question="How much of your available credit are you using?"><${Metric} label="Now" value=${D.util.toFixed(1) + '%'} />${S.length > 1 ? html`<${LineChart} labels=${S.map((s) => s.m)} series=${[{ values: S.map((s) => s.util), color: 'var(--c1)', area: true }]} ref=${{ value: ref, label: ref + '% reference' }} min=${0} fmtY=${(v) => Math.round(v) + '%'} />` : html`<${K.Segs} pct=${D.util} color=${D.util > ref ? 'var(--warn2)' : 'var(--acc)'} mark=${ref} h=${10} />`}<span class="tiny muted">The reference is your own threshold from Settings. Kipu doesn’t estimate credit scores.</span></${ChartBox}>
      <div class="card stack" style=${{ gap: '12px' }}><h3 style=${{ fontSize: '16px' }}>By card</h3>${D.cards.map((c) => html`<div key=${c.id} class="stack-s" style=${{ gap: '5px' }}><div class="between small"><span>${c.name}</span><span class="num"><b>${c.limit ? ((c.bal / c.limit) * 100).toFixed(1) : 0}%</b> <span class="muted">${fmt.native(c.bal, c.cur || data.base)} of ${fmt.native(c.limit || 0, c.cur || data.base)}</span></span></div><${K.Segs} pct=${c.limit ? (c.bal / c.limit) * 100 : 0} color=${c.limit && (c.bal / c.limit) * 100 > ref ? 'var(--warn2)' : 'var(--acc)'} mark=${ref} h=${6} /></div>`)}</div></div>`;
  }

  // ---------------------------------------------------------------- Insights
  function Insights() {
    const { insights, wide, settings, go } = useApp();
    const [f, setF] = useState('All');
    if (!settings.ai.insights) return html`<div class="card"><${EmptyState} icon="spark" title="Insights are off" text="Everything else keeps working. Turn them back on in Settings." action="Open settings" onAction=${() => go({ r: 'settings', s: 'ai' })} /></div>`;
    if (!insights.length) return html`<div class="card"><${EmptyState} icon="spark" title="Nothing to flag right now" text="Insights appear when something deserves attention: a category past its plan, a bill due but not paid, utilization above your reference, and more." /></div>`;
    const kinds = ['All'].concat([...new Set(insights.map((i) => i.kind))]);
    const list = insights.filter((i) => f === 'All' || i.kind === f);
    return html`<div class="stack"><${Chips} options=${kinds} value=${f} onChange=${setF} scroll=${true} /><div class=${wide ? 'grid w2' : 'stack-s'} style=${{ gap: '12px' }}>${list.map((i) => html`<${InsightCard} key=${i.id} i=${i} />`)}</div><span class="tiny muted" style=${{ textAlign: 'center' }}>Worked out from your own data on this device.</span></div>`;
  }

  // ---------------------------------------------------------------- Reviews
  const RSection = ({ title, children }) => html`<div class="card stack" style=${{ gap: '10px' }}><h3 style=${{ fontSize: '17px' }}>${title}</h3>${children}</div>`;
  const CompareRow = ({ label, a, b, text, d, good }) => html`<div class="between" style=${{ padding: '11px 0', borderTop: '1px solid var(--line)' }}><span class="stack-s" style=${{ gap: '2px' }}><span style=${{ fontWeight: 500 }}>${label}</span><span class="tiny muted num">${a} → ${b}</span></span><${Trend} d=${d} good=${good} text=${text} /></div>`;
  function Reviews({ route }) {
    const { D, fmt, go, wide } = useApp();
    const months = D.series.filter((s) => !s.current && s.count > 0).reverse();
    const [sel, setSel] = useState(route.m || (months[0] && months[0].key));
    if (!months.length) return html`<div class="card"><${EmptyState} icon="review" title="Your first review is on its way" text=${'Monthly reviews appear once a month with activity has finished. ' + K.MONTH_LONG[D.T.getMonth()] + ' closes on ' + K.fmtDate(D.plan.monthEnd) + '.'} /></div>`;
    const i = D.series.findIndex((s) => s.key === sel);
    const c = D.series[i], p = D.series[i - 1] && D.series[i - 1].count ? D.series[i - 1] : null;
    const diffs = p ? K.CAT_ORDER.map((k) => [k, c.cats[k] - p.cats[k]]).filter((x) => Math.abs(x[1]) >= 10).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4) : [];
    const over = Object.keys(D.plan.budgetRows.reduce((o, b) => { if (c.cats[b.cat] > b.plan) o[b.cat] = 1; return o; }, {}));
    const sentence = p ? (c.rate > p.rate ? 'You kept a larger share of your income than in ' + K.MONTH_LONG[p.mi] + '.' : c.rate < p.rate ? 'You kept a smaller share of your income than in ' + K.MONTH_LONG[p.mi] + '.' : 'Your savings rate held steady.') : 'Your first full month in Kipu.';
    return html`<div class="stack" style=${{ maxWidth: wide ? '980px' : null }}>
      <${Chips} options=${months.map((m) => m.key)} labels=${months.map((m) => m.m + ' ' + m.y)} value=${sel} onChange=${setSel} scroll=${true} />
      <div class="hero stack" style=${{ gap: '14px' }}><span class="soft eyebrow" style=${{ color: 'inherit' }}>Monthly review</span><h1 style=${{ fontSize: '32px', fontWeight: 800 }}>${K.MONTH_LONG[c.mi]} ${c.y}</h1>
        <div class="grid g2" style=${{ gap: '12px' }}>${[['Income', fmt(c.income)], ['Spending', fmt(c.spending)], ['Saved', fmt(c.saved) + ' · ' + c.rate.toFixed(1) + '%'], ['Left over', fmt(c.net, { sign: true })]].map(([l, v]) => html`<span key=${l} class="stack-s" style=${{ gap: '2px' }}><span class="soft small">${l}</span><span class="disp num" style=${{ fontSize: '20px', fontWeight: 700 }}>${v}</span></span>`)}</div>
        <p style=${{ fontSize: '15px', lineHeight: 1.5, paddingTop: '12px', borderTop: '1px solid color-mix(in srgb, var(--hero-ink) 20%, transparent)' }}>${sentence}</p></div>
      <div class=${wide ? 'grid w2' : 'stack'} style=${wide ? { alignItems: 'start' } : null}>
        ${p && html`<${RSection} title=${'Compared with ' + K.MONTH_LONG[p.mi]}><${CompareRow} label="Income" a=${fmt(p.income)} b=${fmt(c.income)} d=${c.income - p.income} good=${c.income >= p.income} text=${(pctCh(c.income, p.income) > 0 ? '+' : '') + pctCh(c.income, p.income).toFixed(1) + '%'} /><${CompareRow} label="Spending" a=${fmt(p.spending)} b=${fmt(c.spending)} d=${c.spending - p.spending} good=${c.spending <= p.spending} text=${(pctCh(c.spending, p.spending) > 0 ? '+' : '') + pctCh(c.spending, p.spending).toFixed(1) + '%'} /><${CompareRow} label="Savings rate" a=${p.rate.toFixed(1) + '%'} b=${c.rate.toFixed(1) + '%'} d=${c.rate - p.rate} good=${c.rate >= p.rate} text=${(c.rate - p.rate > 0 ? '+' : '') + (c.rate - p.rate).toFixed(1) + ' pts'} />${c.netWorth != null && p.netWorth != null && html`<${CompareRow} label="Net worth" a=${fmt(p.netWorth)} b=${fmt(c.netWorth)} d=${c.netWorth - p.netWorth} good=${c.netWorth >= p.netWorth} text=${fmt(c.netWorth - p.netWorth, { sign: true })} />`}</${RSection}>`}
        ${diffs.length > 0 && html`<${RSection} title="Biggest spending changes">${diffs.map(([k, d]) => html`<div key=${k} class="between" style=${{ padding: '6px 0' }}><span class="row" style=${{ gap: '10px' }}><${Tile} icon=${K.CATS[k].icon} tone=${K.CATS[k].tone} s=${30} />${K.CATS[k].name}</span><span class="amt" style=${{ color: d > 0 ? 'var(--warn)' : 'var(--pos)' }}>${d > 0 ? '▲ ' : '▼ '}${fmt(Math.abs(d))}</span></div>`)}</${RSection}>`}
        <${RSection} title="Savings and debt"><div class="grid g2" style=${{ gap: '12px' }}><${Metric} label="Saved" value=${fmt(c.saved)} sub=${c.rate.toFixed(1) + '% of income'} /><${Metric} label="Loan payments" value=${fmt(c.debtPaid)} sub=${c.interest ? fmt(c.interest) + ' interest' : null} /></div></${RSection}>
        ${over.length > 0 && html`<${RSection} title="Worth watching next month">${over.map((k) => html`<div key=${k} class="row" style=${{ gap: '10px', padding: '10px 12px', borderRadius: '14px', background: 'var(--warnbg)' }}><${Icon} n="alert" s=${16} c="var(--warn)" /><span>${K.CATS[k].name} went past its plan.</span></div>`)}</${RSection}>`}
      </div>
      <button class="btn sec block" onClick=${() => go({ r: 'stats', tab: 'overview' }, true)}>Full numbers in Statistics</button></div>`;
  }

  // ---------------------------------------------------------------- Forecast
  const METRICS = [['cash', 'Cash flow'], ['safe', 'Safe to Spend'], ['savings', 'Savings'], ['debt', 'Debt'], ['networth', 'Net worth']];
  function Forecast({ route }) {
    const { D, data, fmt, ctx, wide, openSheet } = useApp();
    const [metric, setMetric] = useState(route.metric || 'cash');
    const [h, setH] = useState(data.prefs.horizon || 12);
    const [assumption, setAssumption] = useState(data.prefs.assumption);
    const [scen, setScen] = useState(route.scen || {});
    const F = useMemo(() => K.forecast(data, D, { horizon: h, assumption, scen }), [data, D, h, assumption, scen]);
    if (!D.incomeSrc.length) return html`<div class="card"><${EmptyState} icon="trend" title="Forecast needs your income" text="Add at least one income source. Bills, loans and goals make the projection sharper." action="Add income" onAction=${() => openSheet({ k: 'addIncomeSource' })} /></div>`;
    const topSub = D.bills.filter((b) => b.kind === 'Subscription').sort((a, b) => b.amt - a.amt)[0];
    const SCEN = [['cut', 100, 'Spend ' + fmt(100) + ' less a month'], ['save', 200, 'Save ' + fmt(200) + ' more'], D.loans.length && ['loan', 100, 'Loan +' + fmt(100) + '/mo'], topSub && ['pause', K.toBase(data, topSub.amt, topSub.cur || data.base), 'Pause ' + topSub.name], ['income', 300, 'Income +' + fmt(300) + '/mo']].filter(Boolean);
    const any = Object.keys(scen).some((k) => scen[k]);
    const B = F.base.months.slice(0, h), Sc = F.scen.months.slice(0, h);
    const key = { cash: 'net', safe: 'safe', savings: 'savings', debt: 'loanBal', networth: 'nw' }[metric];
    const series = [{ values: B.map((x) => x[key]), color: 'var(--c1)', dash: true }].concat(any ? [{ values: Sc.map((x) => x[key]), color: 'var(--c2)', dash: true }] : []);
    const s = F.summary;
    const rows = [['Left over', s.net, true], ['Saved', s.savings, true], ['Loan interest', s.interest, false], ['Net worth at end', s.nw, true], ['Loans at end', s.loan, false]];
    const chart = html`<${ChartBox} title=${METRICS.find((m) => m[0] === metric)[1]} tag=${html`<span class="tag proj">Projected</span>`} legend=${[['var(--c1)', 'Baseline', true]].concat(any ? [['var(--c2)', 'Scenario', true]] : [])}><${LineChart} labels=${B.map((x) => x.label)} series=${series} fmtY=${fmt.k} min=${metric === 'debt' ? 0 : null} /><span class="tiny muted">Starts next month. Everyday spending assumed at ${fmt(F.flexible)} a month.</span></${ChartBox}>`;
    const summary = html`<div class="card stack" style=${{ gap: '8px' }}><div class="between"><h3 style=${{ fontSize: '16px' }}>Next ${h} months</h3><span class="tag proj">Projected</span></div><div class="xscroll"><table class="tbl"><thead><tr><th></th><th>Baseline</th>${any && html`<th>Scenario</th><th>Difference</th>`}</tr></thead><tbody>${rows.map(([l, v, up]) => html`<tr key=${l}><td>${l}</td><td>${fmt(v[0])}</td>${any && html`<td>${fmt(v[1])}</td><td style=${{ color: Math.abs(v[1] - v[0]) < 0.5 ? 'var(--muted)' : (v[1] > v[0]) === up ? 'var(--pos)' : 'var(--warn)', fontWeight: 600 }}>${Math.abs(v[1] - v[0]) < 0.5 ? '—' : fmt(v[1] - v[0], { sign: true })}</td>`}</tr>`)}</tbody></table></div></div>`;
    const controls = html`<div class="stack-s"><${Seg} options=${[3, 6, 12]} value=${h} onChange=${setH} labels=${['3 months', '6 months', '12 months']} />
      <span class="eyebrow" style=${{ marginTop: '6px' }}>Assumption</span><${Chips} options=${['Recent average', 'Budget based', 'Conservative']} value=${assumption} onChange=${setAssumption} />
      <span class="eyebrow" style=${{ marginTop: '6px' }}>Try a scenario</span><div class="chips">${SCEN.map(([k, v, l]) => html`<button key=${k} class=${'chip' + (scen[k] ? ' on' : '')} onClick=${() => setScen(Object.assign({}, scen, { [k]: scen[k] ? 0 : v }))}>${scen[k] ? '✓ ' : ''}${l}</button>`)}</div></div>`;
    return html`<div class="stack"><${Chips} options=${METRICS.map((m) => m[0])} labels=${METRICS.map((m) => m[1])} value=${metric} onChange=${setMetric} scroll=${true} />
      ${wide ? html`<div class="grid w2" style=${{ alignItems: 'start' }}><div class="stack">${chart}${summary}</div><div class="card stack">${controls}</div></div>` : html`${controls}${chart}${summary}`}
      <span class="tiny muted">Plain arithmetic from your income, bills, loans, goals and recent spending. Not a prediction.</span></div>`;
  }
})();
