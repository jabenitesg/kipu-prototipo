/* Kipu · Home and Money */
(function () {
  const K = window.K;
  const { useState } = React;
  const { html, useApp, Icon, Metric, SectionHeader, Row, Tile, Bar, Stripe, TxnRow, AccountRow, CardPreview, LoanRow, UpcomingItem, InsightCard, ContextFilter, Tabs, Chips, EmptyState } = K;

  const initials = (n) => (n || 'K').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  K.initials = initials;
  // Profile photo when there is one, initials otherwise
  const Face = ({ s = 40 }) => { const { data } = useApp(); const photo = data.profile.photo; return html`<span style=${{ width: s + 'px', height: s + 'px', borderRadius: '999px', background: photo ? 'var(--surface2)' : 'var(--grad)', color: 'var(--hero-ink)', fontWeight: 700, fontSize: s * 0.36 + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>${photo ? html`<img src=${photo} alt="" style=${{ width: '100%', height: '100%', objectFit: 'cover' }} />` : initials(data.profile.name)}</span>`; };
  K.Face = Face;
  const Avatar = ({ s = 40 }) => { const { go } = useApp(); return html`<button onClick=${() => go({ r: 'settings' })} aria-label="Profile and settings" style=${{ borderRadius: '999px', flexShrink: 0 }}><${Face} s=${s} /></button>`; };
  K.Avatar = Avatar;
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
  const longDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // ---------------------------------------------------------------- Safe to Spend
  const SafeHero = () => {
    const { D, fmt, go, openSheet } = useApp();
    const p = D.plan;
    if (!p.hasAccounts) return html`<div class="card" style=${{ background: 'var(--accbg)', borderColor: 'transparent', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <span style=${{ fontWeight: 700, color: 'var(--acc)' }}>Safe to Spend</span>
      <span class="disp" style=${{ fontSize: '22px', fontWeight: 800 }}>Add an everyday account to see what’s safe to spend</span>
      <span class="small muted" style=${{ lineHeight: 1.5 }}>Kipu starts from the cash you have and subtracts what’s due before your next payday.</span>
      <button class="btn pri sm" style=${{ alignSelf: 'flex-start' }} onClick=${() => openSheet({ k: 'addAccount' })}><${Icon} n="plus" s=${15} w=${2.4} />Add account</button></div>`;
    const neg = p.safe < 0;
    const due = p.billsDueAmt + p.cardsDueAmt + p.loansDueAmt + p.savingsLeft;
    return html`<button class="hero" style=${{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', textAlign: 'left' }} onClick=${() => go({ r: 'plan', tab: 'overview' })}>
      <span class="between"><span class="soft" style=${{ fontSize: '13px', fontWeight: 500 }}>Safe to Spend</span><span class="soft tiny">${p.nextPay ? 'until payday · ' : 'until '}${K.fmtDate(p.nextPay || p.until)}</span></span>
      <span class="disp num" style=${{ fontSize: '44px', lineHeight: '46px', fontWeight: 800 }}>${fmt(p.safe)}</span>
      ${p.cashNow > 0 && html`<span style=${{ display: 'flex', gap: '2px', height: '8px' }}><i style=${{ width: Math.min(100, Math.max(0, (due / p.cashNow) * 100)) + '%', background: 'rgba(255,255,255,0.35)', borderRadius: '999px 3px 3px 999px' }}></i><i style=${{ flex: 1, background: 'currentColor', borderRadius: '3px 999px 999px 3px', opacity: 0.95 }}></i></span>`}
      <span class="between small" style=${{ gap: '10px' }}><span class="soft">${neg ? 'Short by ' + fmt(-p.safe) : 'Cash ' + fmt(p.cashNow) + ' · due ' + fmt(due)}</span><span style=${{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>${neg ? 'See why' : 'About ' + fmt(p.perDay, { dec: 0 }) + '/day'}<${Icon} n="next" s=${13} w=${2.4} /></span></span>
      ${!p.hasIncome && html`<span class="soft tiny">Add your income so Kipu knows when your next payday is.</span>`}
    </button>`;
  };
  K.SafeHero = SafeHero;

  // First-run checklist: disappears once the basics exist
  const Setup = () => {
    const { data, openSheet } = useApp();
    const steps = [
      ['account', 'Add an account', 'Chequing, savings or cash, with today’s balance', data.accounts.length > 0, () => openSheet({ k: 'addAccount' })],
      ['income', 'Add your income', 'So Kipu can work out Safe to Spend', data.income.length > 0, () => openSheet({ k: 'addIncomeSource' })],
      ['bill', 'Add a bill or subscription', 'Rent, phone, streaming…', data.bills.length > 0, () => openSheet({ k: 'addBill' })],
      ['expense', 'Record an expense', 'Type it, scan a receipt or import a statement', data.txns.some((t) => t.type === 'expense'), () => openSheet({ k: 'quickAdd' })],
    ];
    const done = steps.filter((s) => s[3]).length;
    if (done === steps.length) return null;
    return html`<div class="card stack" style=${{ gap: '12px' }}>
      <div class="between"><span style=${{ fontWeight: 700, fontSize: '16px' }}>Set up Kipu</span><span class="small muted">${done} of ${steps.length}</span></div>
      <${Bar} pct=${(done / steps.length) * 100} />
      <div class="list">${steps.map(([k, t, s, ok, fn]) => html`<button key=${k} class="lrow" style=${{ padding: '10px 0' }} onClick=${fn} disabled=${ok}><span class=${'ic ' + (ok ? 'g' : 'p')} style=${{ width: '30px', height: '30px', borderRadius: '999px' }}><${Icon} n=${ok ? 'check' : 'plus'} s=${14} w=${2.6} /></span><span class="grow stack-s" style=${{ gap: '2px' }}><span class="t1" style=${{ textDecoration: ok ? 'line-through' : null, color: ok ? 'var(--muted)' : null }}>${t}</span>${!ok && html`<span class="t2">${s}</span>`}</span>${!ok && html`<${Icon} n="next" s=${15} c="var(--muted)" />`}</button>`)}</div></div>`;
  };

  const QuickRow = () => {
    const { openSheet, wide } = useApp();
    const items = [['expense', 'plus', 'Add expense', true], ['receipt', 'scan', 'Scan receipt'], ['statement', 'upload', 'Upload statement'], ['income', 'income', 'Add income']];
    if (wide) return html`<div class="row" style=${{ gap: '10px', flexWrap: 'wrap' }}>${items.map(([k, ic, l, pri]) => html`<button key=${k} onClick=${() => openSheet({ k })} class=${pri ? 'btn pri pill' : 'pill-soft'} style=${pri ? null : { fontWeight: 600 }}><${Icon} n=${ic} s=${17} w=${2} />${l}</button>`)}</div>`;
    return html`<div class="stack-s"><h2 style=${{ fontSize: '18px', fontWeight: 700 }}>Quick add</h2><div class="grid g4" style=${{ gap: '8px' }}>${items.map(([k, ic, l, pri]) => html`<button key=${k} onClick=${() => openSheet({ k })} class="stack-s" style=${{ alignItems: 'center', gap: '8px' }}><span style=${{ width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: pri ? 'var(--grad)' : 'var(--surface)', color: pri ? 'var(--hero-ink)' : 'var(--ink)', border: pri ? 0 : '1px solid var(--line)', boxShadow: pri ? 'var(--glow)' : null }}><${Icon} n=${ic} s=${22} w=${2} /></span><span class="small" style=${{ fontWeight: 600, textAlign: 'center' }}>${l}</span></button>`)}</div></div>`;
  };

  // ---------------------------------------------------------------- Home
  K.Home = function Home() {
    const { D, fmt, go, data, ctx, wide, insights, openSheet } = useApp();
    const m = D.month, prev = D.series[10];
    const top = insights[0];
    const trip = D.activeTrip;
    const month = html`<button class="card tint" style=${{ padding: '16px 18px', width: '100%' }} onClick=${() => go({ r: 'stats', tab: 'overview' })}>
      <div class="between" style=${{ marginBottom: '12px' }}><span class="small muted">${K.MONTH_LONG[D.T.getMonth()]} so far</span><span class="link">Statistics<${Icon} n="next" s=${13} w=${2.2} /></span></div>
      <div class="grid g3" style=${{ gap: '8px', textAlign: 'left' }}>
        <${Metric} label="Income" value=${fmt.ctx(D, m.income)} sub=${prev.count ? 'Last month ' + fmt(prev.income) : null} />
        <${Metric} label="Spent" value=${fmt.ctx(D, m.spending)} sub=${D.plan.budgetPlan ? 'Plan ' + fmt(D.plan.budgetPlan) : null} />
        <${Metric} label="Saved" value=${fmt.ctx(D, m.saved)} sub=${D.plan.savingsPlanned ? 'of ' + fmt(D.plan.savingsPlanned) + ' planned' : null} />
      </div></button>`;
    const upcoming = html`<div class="stack-s"><${SectionHeader} title="Coming up" action="Bills & recurring" onAction=${() => go({ r: 'plan', tab: 'bills' })} />${D.upcoming.length ? html`<div class="card tight list">${D.upcoming.slice(0, 4).map((u, i) => html`<${UpcomingItem} key=${i} u=${u} />`)}</div>` : html`<div class="card"><${EmptyState} icon="calendar" title="Nothing scheduled" text="Add bills, subscriptions, loans and income to see what’s coming." action="Add a bill" onAction=${() => openSheet({ k: 'addBill' })} /></div>`}</div>`;
    const over = D.util > data.prefs.utilRef;
    const credit = D.cards.length > 0 && html`<button class="card solid" style=${{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }} onClick=${() => go({ r: 'money', tab: 'cards' })}>
      <span class="between"><span class="row" style=${{ gap: '10px' }}><span class="ic" style=${{ background: 'rgba(255,255,255,0.16)', color: '#FFFFFF' }}><${Icon} n="card" s=${17} /></span><span class="stack-s" style=${{ gap: '2px', textAlign: 'left' }}><span class="t1" style=${{ fontWeight: 600 }}>Credit utilization</span><span class="t2" style=${{ color: 'rgba(255,255,255,0.76)' }}>${fmt(D.cardBal)} of ${fmt(D.cardLimit)}</span></span></span><span class="disp num" style=${{ fontWeight: 800, fontSize: '22px' }}>${D.util.toFixed(1)}%</span></span>
      <${K.Segs} pct=${D.util} color=${over ? '#F6C36A' : '#FFFFFF'} track="rgba(255,255,255,0.22)" mark=${data.prefs.utilRef} markColor="#FFFFFF" />
      <span class="tiny" style=${{ textAlign: 'left', fontWeight: 600, color: over ? '#FFD58A' : 'rgba(255,255,255,0.76)' }}>${over ? 'Above your ' + data.prefs.utilRef + '% reference' : 'Under your ' + data.prefs.utilRef + '% reference'}</span></button>`;
    const tripStyled = trip && trip.look && trip.look.kind && trip.look.kind !== 'theme';
    const tripPct = trip && trip.budget > 0 ? (trip.spent / trip.budget) * 100 : 0;
    const tripCard = trip && html`<button class="card" style=${Object.assign({ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }, tripStyled ? { background: K.lookBg(trip.look), color: '#FFFFFF', border: 0, boxShadow: 'var(--glow)' } : {})} onClick=${() => go({ r: 'trip', id: trip.id })}>
      <span class="between"><span class="row" style=${{ gap: '10px' }}>${tripStyled ? html`<span class="ic" style=${{ background: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }}><${Icon} n="plane" s=${17} /></span>` : html`<${Tile} icon="plane" tone="p" />`}<span class="stack-s" style=${{ gap: '2px', textAlign: 'left' }}><span class="t1">${trip.name}</span><span class="t2" style=${tripStyled ? { color: 'rgba(255,255,255,0.78)' } : null}>Day ${trip.day} of ${trip.total}</span></span></span><span class="amt">${fmt(trip.spent)}</span></span>
      ${trip.budget > 0 && html`<${K.Segs} pct=${tripPct} color=${tripStyled ? '#FFFFFF' : tripPct > 100 ? 'var(--crit2)' : tripPct > (trip.day / trip.total) * 100 + 10 ? 'var(--warn2)' : 'var(--acc)'} track=${tripStyled ? 'rgba(255,255,255,0.25)' : null} mark=${(trip.day / trip.total) * 100} />`}</button>`;
    const goal = D.goals.filter((g) => g.pct < 100).sort((a, b) => b.pct - a.pct)[0] || D.goals[0];
    const goalCard = goal && html`<div class="stack-s"><${SectionHeader} title="Featured goal" action="Goals" onAction=${() => go({ r: 'plan', tab: 'goals' })} /><${K.GoalProgress} g=${goal} featured=${true} onClick=${() => go({ r: 'goal', id: goal.id })} /></div>`;
    const insight = top && html`<div class="stack-s"><${SectionHeader} title="Worth a look" action="Insights" onAction=${() => go({ r: 'stats', tab: 'insights' })} /><${InsightCard} i=${top} compact=${true} /></div>`;
    const head = html`<header class="between" style=${{ paddingTop: wide ? 0 : '10px', alignItems: 'flex-start' }}><div class="stack-s" style=${{ gap: '4px' }}><span class="eyebrow">${longDate()}</span><h1 style=${{ fontSize: wide ? '30px' : '26px', fontWeight: 800 }}>${greeting()}${data.profile.name ? ', ' + data.profile.name.split(' ')[0] : ''}</h1></div>${wide ? html`<${ContextFilter} show=${['scope', 'currency']} />` : html`<${Avatar} />`}</header>`;
    const ctxChip = !wide && data.household.enabled && html`<div><${ContextFilter} show=${['scope', 'currency']} /></div>`;
    if (wide) {
      const badge = (a, b, goodUp) => { if (!prev.count || !b) return null; const d = ((a - b) / Math.abs(b)) * 100; if (Math.abs(d) < 0.5) return null; return html`<span class=${'b ' + ((d > 0) === goodUp ? 'pos' : 'warn')}>${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(0)}%</span>`; };
      const kpis = html`<div class="kpis">
        <button class="kpi" onClick=${() => go({ r: 'stats', tab: 'overview' })}><span class="v">${fmt.ctx(D, m.income)}</span><span class="l">Income ${badge(m.income, prev.income, true)}</span></button>
        <button class="kpi" onClick=${() => go({ r: 'stats', tab: 'overview' })}><span class="v">${fmt.ctx(D, m.spending)}</span><span class="l">Spent${D.plan.budgetPlan ? ' of ' + fmt(D.plan.budgetPlan) : ''} ${badge(m.spending, prev.spending, false)}</span></button>
        <button class="kpi" onClick=${() => go({ r: 'stats', tab: 'overview' })}><span class="v">${fmt.ctx(D, m.saved)}</span><span class="l">Saved${D.plan.savingsPlanned ? ' of ' + fmt(D.plan.savingsPlanned) : ''}</span></button></div>`;
      const featured = goal && html`<${K.GoalProgress} g=${goal} featured=${true} onClick=${() => go({ r: 'goal', id: goal.id })} />`;
      // Dashboard widgets: the same numbers the app already has, all on one screen
      const W = ({ title, action, onAction, children, cls, style, area }) => html`<div class=${'card stack ' + (cls || '')} style=${Object.assign({ gap: '14px', gridArea: area }, style)}><div class="between"><h3 style=${{ fontSize: '16px' }}>${title}</h3>${action && html`<button class="pill-link" onClick=${onAction}>${action}<${Icon} n="next" s=${13} w=${2.2} /></button>`}</div>${children}</div>`;
      const Empty = ({ text, action, onAction }) => html`<div class="stack-s" style=${{ gap: '8px', alignItems: 'flex-start' }}><span class="small muted" style=${{ lineHeight: 1.5 }}>${text}</span>${action && html`<button class="btn sec sm" onClick=${onAction}>${action}</button>`}</div>`;
      const cats = K.CAT_ORDER.filter((c) => (m.cats[c] || 0) > 0).sort((a, b) => m.cats[b] - m.cats[a]).slice(0, 5);
      const catMax = cats.length ? m.cats[cats[0]] : 1;
      const spendW = html`<${W} area="cat" title="Spending by category" action="Details" onAction=${() => go({ r: 'stats', tab: 'spending' })}>${cats.length ? html`<div class="stack-s" style=${{ gap: '12px' }}>${cats.map((c, i) => html`<div key=${c} class="stack-s" style=${{ gap: '5px' }}><div class="between small"><span class="row" style=${{ gap: '8px' }}><${Icon} n=${K.CATS[c].icon} s=${15} c="var(--muted)" />${K.CATS[c].name}</span><b class="num">${fmt(m.cats[c])}</b></div><${Bar} pct=${(m.cats[c] / catMax) * 100} color=${'var(--c' + (i + 1) + ')'} h=${6} /></div>`)}</div>` : html`<${Empty} text="No spending yet this month." action="Add expense" onAction=${() => openSheet({ k: 'expense' })} />`}</${W}>`;
      const rows = D.plan.budgetRows.slice().sort((a, b) => b.actual / b.plan - a.actual / a.plan).slice(0, 4);
      const budgetW = html`<${W} area="bud" title="Budget" action="Plan" onAction=${() => go({ r: 'plan', tab: 'budget' })}>${rows.length ? html`<div class="stack-s" style=${{ gap: '12px' }}>${rows.map((b) => { const pct = b.plan ? (b.actual / b.plan) * 100 : 0; return html`<div key=${b.cat} class="stack-s" style=${{ gap: '6px' }}><div class="between small"><span>${K.CATS[b.cat] ? K.CATS[b.cat].name : b.cat}</span><span class="num"><b>${fmt(b.actual)}</b><span class="muted"> / ${fmt(b.plan)}</span></span></div><${K.Segs} pct=${pct} n=${16} h=${6} color=${pct > 100.5 ? 'var(--warn2)' : 'var(--acc)'} /></div>`; })}<span class="tiny muted num">${fmt(D.plan.budgetActual)} of ${fmt(D.plan.budgetPlan)} planned · ${D.plan.daysLeft} days left</span></div>` : html`<${Empty} text="Set a monthly amount per category to follow your pace here." action="Create a budget" onAction=${() => go({ r: 'plan', tab: 'budget' })} />`}</${W}>`;
      const nwW = html`<${W} area="nw" title="Net worth" action="Money" onAction=${() => go({ r: 'money' })}>${D.accts.length || D.cards.length || D.loans.length ? html`<div class="stack-s" style=${{ gap: '12px' }}><span class="disp num" style=${{ fontSize: '30px', fontWeight: 600, letterSpacing: '-0.03em' }}>${fmt(D.netWorth)}</span><${K.Stripe} h=${10} parts=${[[D.cash, 'var(--c1)'], [D.invest + D.property, 'var(--c2)'], [D.cardBal + D.loanBal, 'var(--c3)']]} />
          <div class="list">${D.accts.slice().sort((a, b) => b.baseBal - a.baseBal).slice(0, 4).map((a) => html`<button key=${a.id} class="between small" style=${{ width: '100%', padding: '8px 0' }} onClick=${() => go({ r: 'account', id: a.id })}><span style=${{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${a.name}</span><b class="num">${a.cur === data.base ? fmt(a.bal) : fmt.native(a.bal, a.cur)}</b></button>`)}${D.cardBal + D.loanBal > 0 && html`<button class="between small" style=${{ width: '100%', padding: '8px 0' }} onClick=${() => go({ r: 'money', tab: 'loans' })}><span class="muted">Cards and loans</span><b class="num">−${fmt(D.cardBal + D.loanBal)}</b></button>`}</div></div>` : html`<${Empty} text="Add your accounts to see what you own and owe." action="Add account" onAction=${() => openSheet({ k: 'addAccount' })} />`}</${W}>`;
      const S = D.activeSeries.slice(-6);
      const flowW = html`<${W} area="flow" title="Income and spending" action="Statistics" onAction=${() => go({ r: 'stats', tab: 'overview' })}>${S.length > 1 ? html`<${K.BarChart} groups=${S.map((x) => ({ label: x.m, values: [x.income, x.spending] }))} colors=${['var(--c2)', 'var(--c1)']} hi=${S.length - 1} fmtY=${fmt.k} h=${190} /><div class="legend"><span><i class="dotk" style=${{ background: 'var(--c2)' }}></i>Income</span><span><i class="dotk" style=${{ background: 'var(--c1)' }}></i>Spending</span><span>Last ${S.length} months</span></div>` : html`<${Empty} text="The chart fills in after your first month of activity. Importing a statement brings in history right away." action="Import a statement" onAction=${() => openSheet({ k: 'statement' })} />`}</${W}>`;
      const goalsW = html`<${W} area="gls" title="Goals" action="All goals" onAction=${() => go({ r: 'plan', tab: 'goals' })}>${D.goals.length ? html`<div class="stack-s" style=${{ gap: '14px' }}>${D.goals.slice(0, 4).map((g) => html`<button key=${g.id} class="stack-s" style=${{ gap: '6px', width: '100%', textAlign: 'left' }} onClick=${() => go({ r: 'goal', id: g.id })}><span class="between small"><span style=${{ fontWeight: 600 }}>${g.name}</span><span class="num muted">${g.pct}%</span></span><${K.Segs} pct=${g.pct} n=${16} h=${6} color=${g.pct >= 100 ? 'var(--pos2)' : 'var(--acc)'} /><span class="tiny muted num">${fmt(g.savedNow)} of ${fmt(g.target)}</span></button>`)}</div>` : html`<${Empty} text="Save toward something: a trip, a cushion, a new laptop." action="Add goal" onAction=${() => openSheet({ k: 'addGoal' })} />`}</${W}>`;
      const recentW = html`<div class="card" style=${{ gridArea: 'rec', padding: '6px 0 4px' }}><div class="between" style=${{ padding: '12px 16px 8px' }}><h3 style=${{ fontSize: '16px' }}>Recent activity</h3><button class="pill-link" onClick=${() => go({ r: 'money', tab: 'activity' })}>See all<${Icon} n="next" s=${13} w=${2.2} /></button></div>${D.tx.length ? html`<div class="list" style=${{ borderTop: '1px solid var(--line)' }}>${D.tx.slice(0, 5).map((t) => html`<${K.TxnRow} key=${t.id} t=${t} />`)}</div>` : html`<div style=${{ padding: '4px 16px 16px' }}><${Empty} text="Expenses, income and transfers appear here." action="Add expense" onAction=${() => openSheet({ k: 'expense' })} /></div>`}</div>`;
      const insW = html`<div class="card" style=${{ gridArea: 'ins', padding: '6px 0 4px' }}><div class="between" style=${{ padding: '12px 16px 8px' }}><h3 style=${{ fontSize: '16px' }}>Worth a look</h3><button class="pill-link" onClick=${() => go({ r: 'stats', tab: 'insights' })}>Insights<${Icon} n="next" s=${13} w=${2.2} /></button></div>${insights.length ? html`<div class="list" style=${{ borderTop: '1px solid var(--line)' }}>${insights.slice(0, 3).map((i) => html`<button key=${i.id} class="lrow" style=${{ alignItems: 'flex-start' }} onClick=${() => go(i.route)}><${Tile} icon=${i.icon} tone=${i.kind === 'Priority' ? 'a' : 'p'} /><span class="grow stack-s" style=${{ gap: '4px', textAlign: 'left' }}><span style=${{ fontSize: '14px', lineHeight: 1.4, fontWeight: 500 }}>${i.title}</span><span class="link">${i.cta}<${Icon} n="next" s=${12} w=${2.2} /></span></span></button>`)}</div>` : html`<div style=${{ padding: '4px 16px 16px' }}><${Empty} text="Nothing needs your attention right now." /></div>`}</div>`;
      const dockItems = [['expense', 'plus', 'Add expense'], ['receipt', 'scan', 'Scan receipt'], ['statement', 'upload', 'Upload statement'], ['income', 'income', 'Add income']];
      const dock = html`<div class="dock" role="toolbar" aria-label="Quick add">${dockItems.map(([k, ic, l], i) => html`<button key=${k} class=${i === 0 ? 'pri' : ''} aria-label=${l} onClick=${() => openSheet({ k })}><${Icon} n=${ic} s=${20} w=${2.1} /><span class="tip">${l}</span></button>`)}</div>`;
      const r2 = featured && credit ? 'goal cred' : featured ? 'goal goal' : credit ? 'cred cred' : null;
      const areasLg = ['"hero hero up nw"', r2 ? '"' + r2 + ' up nw"' : null, '"flow flow cat bud"', '"rec rec ins gls"'].filter(Boolean).join(' ');
      const areasMd = ['"hero hero"', r2 ? '"' + r2 + '"' : null, '"up nw"', '"flow flow"', '"cat bud"', '"rec rec"', '"ins gls"'].filter(Boolean).join(' ');
      const upcomingW = html`<div class="card" style=${{ gridArea: 'up', padding: '6px 0 4px' }}><div class="between" style=${{ padding: '12px 16px 8px' }}><h3 style=${{ fontSize: '16px' }}>Coming up</h3><button class="pill-link" onClick=${() => go({ r: 'plan', tab: 'bills' })}>Bills<${Icon} n="next" s=${13} w=${2.2} /></button></div>${D.upcoming.length ? html`<div class="list" style=${{ borderTop: '1px solid var(--line)' }}>${D.upcoming.slice(0, 5).map((u, i) => html`<${UpcomingItem} key=${i} u=${u} />`)}</div>` : html`<div style=${{ padding: '4px 16px 16px' }}><${Empty} text="Add bills, subscriptions, loans and income to see what’s coming." action="Add a bill" onAction=${() => openSheet({ k: 'addBill' })} /></div>`}</div>`;
      return html`<div class="stack" style=${{ gap: '26px' }}>
        <header class="between" style=${{ alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px 32px' }}><div class="stack-s" style=${{ gap: '8px' }}><span class="eyebrow">${K.MONTH_LONG[D.T.getMonth()]} so far</span><h1>${greeting()}${data.profile.name ? ', ' + data.profile.name.split(' ')[0] : ''}</h1></div>${kpis}</header>
        <${Setup} />
        <div class="bento" style=${{ '--areas-lg': areasLg, '--areas-md': areasMd }}>
          <div style=${{ gridArea: 'hero' }}><${SafeHero} /></div>
          ${featured && html`<div style=${{ gridArea: 'goal' }}>${featured}</div>`}${credit && html`<div style=${{ gridArea: 'cred' }}>${credit}</div>`}
          ${upcomingW}${nwW}${flowW}${spendW}${budgetW}${recentW}${insW}
          <div class="stack" style=${{ gridArea: 'gls', gap: '16px' }}>${goalsW}${tripCard}</div>
        </div>${dock}</div>`;
    }
    return html`<div class="stack">${head}${ctxChip}<${Setup} /><${SafeHero} />${month}<${QuickRow} />${goalCard}${upcoming}${tripCard}${credit}${insight}</div>`;
  };

  // ---------------------------------------------------------------- Money
  const MONEY_TABS = [['overview', 'Overview'], ['accounts', 'Accounts'], ['cards', 'Cards'], ['loans', 'Loans'], ['activity', 'Activity']];
  K.Money = function Money({ route }) {
    const { go, wide } = useApp();
    const tab = route.tab || 'overview';
    const Body = { overview: MoneyOverview, accounts: Accounts, cards: Cards, loans: Loans, activity: Activity }[tab];
    return html`<div class="stack">
      <div class="between" style=${{ paddingTop: wide ? 0 : '8px' }}><div class="stack-s" style=${{ gap: '4px' }}><span class="eyebrow">Your money</span><h1 style=${{ fontSize: '30px', fontWeight: 800 }}>Money</h1></div><${ContextFilter} show=${['scope', 'currency']} /></div>
      <${Tabs} tabs=${MONEY_TABS} value=${tab} onChange=${(t) => go({ r: 'money', tab: t }, true)} />
      <${Body} /></div>`;
  };

  const AddRow = ({ label, sheet }) => { const { openSheet } = useApp(); return html`<button class="lrow" style=${{ color: 'var(--acc)', fontWeight: 600 }} onClick=${() => openSheet({ k: sheet })}><span class="ic p"><${Icon} n="plus" s=${17} w=${2.2} /></span>${label}</button>`; };
  K.AddRow = AddRow;

  function MoneyOverview() {
    const { D, fmt, go, wide, openSheet } = useApp();
    if (!D.accts.length && !D.cards.length && !D.loans.length) return html`<div class="card"><${EmptyState} icon="wallet" title="Add your first account" text="Chequing, savings, cash or investments. Enter today’s balance; you can import history later." action="Add account" onAction=${() => openSheet({ k: 'addAccount' })} /></div>`;
    const liab = D.cardBal + D.loanBal;
    const net = html`<div class="card stack" style=${{ gap: '14px' }}>
      <div class="stack-s" style=${{ gap: '4px' }}><span class="small muted">Net position</span><span class="disp num" style=${{ fontSize: '34px', fontWeight: 800 }}>${fmt(D.netWorth)}</span><span class="small muted">What you own minus what you owe</span></div>
      <${Stripe} parts=${[[D.cash, 'var(--acc)'], [D.invest + D.property, 'color-mix(in srgb, var(--acc) 45%, var(--surface2))'], [liab, 'var(--info2)']]} h=${12} />
      <div>${[['Cash & savings', D.cash, 'var(--acc)', 'accounts'], ['Investments & property', D.invest + D.property, 'color-mix(in srgb, var(--acc) 45%, var(--surface2))', 'accounts'], ['Credit card balances', -D.cardBal, 'var(--info2)', 'cards'], ['Loan balances', -D.loanBal, 'var(--info2)', 'loans']].map(([l, v, c, t]) => html`<button key=${l} class="between" style=${{ width: '100%', padding: '10px 0', borderTop: '1px solid var(--line)' }} onClick=${() => go({ r: 'money', tab: t }, true)}><span class="row" style=${{ gap: '10px' }}><span class="dotk" style=${{ background: c }}></span><span>${l}</span></span><span class="row" style=${{ gap: '6px' }}><span class="amt">${fmt(v)}</span><span class="muted"><${Icon} n="next" s=${14} /></span></span></button>`)}</div>
      <span class="tiny muted">Balances in other currencies use today’s exchange rate for this total.</span></div>`;
    const recent = html`<div class="stack-s"><${SectionHeader} title="Recent activity" action="See all" onAction=${() => go({ r: 'money', tab: 'activity' }, true)} />${D.tx.length ? html`<div class="card tight list">${D.tx.slice(0, 6).map((t) => html`<${TxnRow} key=${t.id} t=${t} />`)}</div>` : html`<div class="card"><${EmptyState} icon="history" title="No activity yet" text="Expenses, income and transfers you add will appear here." action="Add expense" onAction=${() => openSheet({ k: 'expense' })} /></div>`}</div>`;
    return wide ? html`<div class="grid w2" style=${{ alignItems: 'start' }}>${net}${recent}</div>` : html`<div class="stack">${net}${recent}</div>`;
  }

  function Accounts() {
    const { D, fmt, wide } = useApp();
    const groups = ['Everyday', 'Savings', 'Cash', 'Investments', 'Property'];
    return html`<div class=${wide ? 'grid w2' : 'stack'} style=${{ alignItems: 'start' }}>${groups.map((g) => {
      const list = D.accts.filter((a) => a.kind === g);
      if (!list.length) return null;
      return html`<div class="stack-s" key=${g}><div class="between"><span class="eyebrow">${g}</span><span class="small muted num">${fmt(K.sum(list, (a) => a.baseBal))}</span></div><div class="card tight list">${list.map((a) => html`<${AccountRow} key=${a.id} a=${a} />`)}</div></div>`;
    })}<div class="card tight"><${AddRow} label="Add account" sheet="addAccount" /></div></div>`;
  }

  function Cards() {
    const { D, fmt, go, data, openSheet } = useApp();
    if (!D.cards.length) return html`<div class="card"><${EmptyState} icon="card" title="No credit cards yet" text="Add a card to track balance, utilization and due dates. Only the last four digits are stored." action="Add credit card" onAction=${() => openSheet({ k: 'addCard' })} /></div>`;
    return html`<div class="stack">
      <div class="card stack-s"><div class="between"><span class="small muted">Across ${D.cards.length} ${D.cards.length === 1 ? 'card' : 'cards'}</span><span class="disp num" style=${{ fontWeight: 700, fontSize: '18px' }}>${D.util.toFixed(1)}% used</span></div><${K.Segs} pct=${D.util} color=${D.util > data.prefs.utilRef ? 'var(--warn2)' : 'var(--acc)'} mark=${data.prefs.utilRef} h=${10} /><div class="between tiny muted num"><span>${fmt(D.cardBal)} owed · ${fmt(D.cardLimit - D.cardBal)} available</span><span>${data.prefs.utilRef}% reference</span></div></div>
      <div class="grid" style=${{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>${D.cards.map((c) => html`<div key=${c.id} class="stack-s"><${CardPreview} c=${c} onClick=${() => go({ r: 'card', id: c.id })} /><span class="small muted" style=${{ padding: '0 4px' }}>${[c.closeDay && 'Closes the ' + K.ord(c.closeDay), c.dueDay ? 'due the ' + K.ord(c.dueDay) : 'No due date set'].filter(Boolean).join(' · ').replace(/^due/, 'Due')}${(() => { const ex = K.expiryInfo(c); return ex && (ex.expired || ex.soon) ? html` · <b style=${{ color: 'var(--warn)' }}>${ex.expired ? 'Expired' : 'Expires ' + ex.label}</b>` : ''; })()}</span></div>`)}</div>
      <div class="card tight"><${AddRow} label="Add credit card" sheet="addCard" /></div></div>`;
  }

  function Loans() {
    const { D, fmt } = useApp();
    if (!D.loans.length) return html`<div class="card"><${EmptyState} icon="loan" title="No loans" text="Track car loans, student loans, mortgages or lines of credit and see when they’re paid off." /><${AddRow} label="Add loan" sheet="addLoan" /></div>`;
    const paid = K.sum(D.loans, (l) => Math.max(0, (l.orig || l.bal) - l.bal)), orig = K.sum(D.loans, (l) => l.orig || l.bal);
    return html`<div class="stack">
      <div class="card stack-s"><div class="between"><span class="small muted">Loan balances</span><span class="disp num" style=${{ fontWeight: 700, fontSize: '22px' }}>${fmt(D.loanBal)}</span></div><${K.Segs} pct=${orig ? (paid / orig) * 100 : 0} color="var(--acc)" h=${10} /><span class="tiny muted num">${fmt(paid)} paid of ${fmt(orig)} borrowed</span></div>
      <div class="card tight list">${D.loans.map((l) => html`<${LoanRow} key=${l.id} l=${l} />`)}</div>
      <div class="card tight"><${AddRow} label="Add loan" sheet="addLoan" /></div></div>`;
  }

  function Activity() {
    const { D, openSheet } = useApp();
    const [f, setF] = useState('All');
    const [q, setQ] = useState('');
    const match = (t) => (f === 'All' || (f === 'Spending' && t.type === 'expense') || (f === 'Income' && t.type === 'income') || (f === 'Transfers' && ['transfer', 'saving', 'debt'].includes(t.type)) || (f === 'Trips' && t.trip)) && (!q || (t.merchant || '').toLowerCase().includes(q.toLowerCase()) || (t.note || '').toLowerCase().includes(q.toLowerCase()));
    const list = D.tx.filter(match).slice(0, 300);
    const byDay = {}; list.forEach((t) => (byDay[t.date] = byDay[t.date] || []).push(t));
    if (!D.tx.length) return html`<div class="card"><${EmptyState} icon="history" title="No transactions yet" text="Add them one by one, scan a receipt, or import a bank or card statement." action="Import a statement" onAction=${() => openSheet({ k: 'statement' })} /></div>`;
    return html`<div class="stack">
      <div class="row" style=${{ gap: '8px', padding: '0 12px', height: '44px', borderRadius: '14px', background: 'var(--surface2)' }}><${Icon} n="search" s=${17} c="var(--muted)" /><input id="tx-search" class="grow" placeholder="Search" value=${q} onInput=${(e) => setQ(e.target.value)} style=${{ border: 0, background: 'transparent', outline: 'none', fontSize: '15px', minWidth: 0 }} /></div>
      <${Chips} options=${['All', 'Spending', 'Income', 'Transfers', 'Trips']} value=${f} onChange=${setF} scroll=${true} />
      ${Object.keys(byDay).map((d) => html`<div key=${d} class="stack-s"><span class="eyebrow">${K.fmtDate(d, K.parse(d).getFullYear() !== D.T.getFullYear())}</span><div class="card tight list">${byDay[d].map((t) => html`<${TxnRow} key=${t.id} t=${t} />`)}</div></div>`)}
      ${!list.length && html`<${EmptyState} icon="search" title="Nothing matches" text="Try another filter or search." />`}</div>`;
  }

  // ---------------------------------------------------------------- detail views
  const DetailHead = ({ title, sub, right }) => html`<div class="between" style=${{ alignItems: 'flex-start', gap: '16px' }}><div class="stack-s" style=${{ gap: '4px', minWidth: 0 }}><h1 style=${{ fontSize: '26px', fontWeight: 800 }}>${title}</h1>${sub && html`<span class="muted">${sub}</span>`}</div>${right}</div>`;
  K.DetailHead = DetailHead;
  const Facts = ({ rows }) => html`<div class="card tight list">${rows.filter(Boolean).map(([k, v, tone]) => html`<div key=${k} class="between" style=${{ padding: '12px 16px' }}><span class="muted">${k}</span><span style=${{ fontWeight: 600, textAlign: 'right', color: tone ? 'var(--' + tone + ')' : null }} class="num">${v}</span></div>`)}</div>`;
  K.Facts = Facts;
  // Two-step delete, built into the page
  const DangerButton = ({ label, onConfirm }) => {
    const [armed, setArmed] = useState(false);
    return armed ? html`<div class="card stack-s" style=${{ borderColor: 'var(--crit2)' }}><span style=${{ fontWeight: 600 }}>${label}?</span><span class="small muted">This can’t be undone.</span><div class="grid g2" style=${{ gap: '8px' }}><button class="btn sec sm" onClick=${() => setArmed(false)}>Keep it</button><button class="btn dan sm" onClick=${onConfirm}>${label}</button></div></div>` : html`<button class="btn dan block" style=${{ height: '44px', fontSize: '14px' }} onClick=${() => setArmed(true)}>${label}</button>`;
  };
  K.DangerButton = DangerButton;
  const EditBtn = ({ onClick }) => html`<button class="btn sec sm" onClick=${onClick}><${Icon} n="sliders" s=${14} />Edit</button>`;
  K.EditBtn = EditBtn;

  K.AccountDetail = function AccountDetail({ route }) {
    const { data, D, fmt, openSheet, wide, commit, back, toast, go } = useApp();
    const a = data.accounts.find((x) => x.id === route.id);
    if (!a) return html`<${EmptyState} title="Account not found" />`;
    const tx = D.txAll.filter((t) => t.from === 'acct:' + a.id || t.to === 'acct:' + a.id);
    const goal = D.goals.find((g) => g.linked === a.id);
    const left = html`<div class="stack">
      <div class="card stack-s"><span class="small muted">${a.kind}${a.inst ? ' · ' + a.inst : ''}</span><span class="disp num" style=${{ fontSize: '34px', fontWeight: 800 }}>${a.cur === data.base ? fmt(a.bal) : fmt.native(a.bal, a.cur)}</span>${a.cur !== data.base && html`<span class="small muted num">≈ ${fmt(K.toBase(data, a.bal, a.cur))} at today’s rate. Used for totals only.</span>`}
        <div class="row" style=${{ gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}><button class="btn sec sm" onClick=${() => openSheet({ k: 'transfer', from: 'acct:' + a.id })}><${Icon} n="transfer" s=${15} />Transfer</button><button class="btn sec sm" onClick=${() => openSheet({ k: 'adjust', id: a.id })}><${Icon} n="sliders" s=${15} />Update balance</button><${EditBtn} onClick=${() => openSheet({ k: 'addAccount', item: a })} /></div></div>
      ${goal && html`<div class="stack-s"><${SectionHeader} title="Linked goal" /><${K.GoalProgress} g=${goal} onClick=${() => go({ r: 'goal', id: goal.id })} /></div>`}
      <${DangerButton} label="Delete account" onConfirm=${() => { commit(K.remove(data, 'accounts', a.id)); toast('Account deleted'); back(); }} /></div>`;
    const right = html`<div class="stack-s"><${SectionHeader} title="Activity" />${tx.length ? html`<div class="card tight list">${tx.slice(0, 30).map((t) => html`<${K.TxnRow} key=${t.id} t=${t} />`)}</div>` : html`<div class="card"><${EmptyState} icon="history" title="No activity" text="Transactions paid from or into this account appear here." /></div>`}</div>`;
    return html`<div class="stack"><${DetailHead} title=${a.name} sub=${a.cur + ' account' + (a.shared ? ' · Shared' : '')} />${wide ? html`<div class="grid w2" style=${{ alignItems: 'start' }}>${left}${right}</div>` : html`${left}${right}`}</div>`;
  };

  K.CardDetail = function CardDetail({ route }) {
    const { data, D, fmt, openSheet, wide, commit, back, toast } = useApp();
    const c = data.cards.find((x) => x.id === route.id);
    if (!c) return html`<${EmptyState} title="Card not found" />`;
    const util = c.limit ? (c.bal / c.limit) * 100 : 0;
    const tx = D.txAll.filter((t) => t.from === 'card:' + c.id || t.to === 'card:' + c.id);
    const left = html`<div class="stack">
      <${CardPreview} c=${c} selected=${true} />
      <div class="grid g3" style=${{ gap: '8px' }}><${Metric} label="Balance" value=${fmt(c.bal)} /><${Metric} label="Available" value=${fmt((c.limit || 0) - c.bal)} /><${Metric} label="Limit" value=${fmt(c.limit || 0)} /></div>
      <div class="card stack-s"><div class="between"><span class="small muted">Utilization</span><span class="amt">${util.toFixed(1)}%</span></div><${K.Segs} pct=${util} color=${util > data.prefs.utilRef ? 'var(--warn2)' : 'var(--acc)'} mark=${data.prefs.utilRef} /><span class="tiny muted">The line is your ${data.prefs.utilRef}% reference. It’s a visual guide, not a credit score rule.</span></div>
      <${Facts} rows=${[['Statement balance', fmt(c.stmtBal || 0, { dec: 2 })], ['Minimum payment', fmt(c.minPay || 0, { dec: 2 })], ['Statement closes', c.closeDay ? 'The ' + K.ord(c.closeDay) + ' · next ' + K.fmtDate(K.nextDate(K.iso(new Date(K.today().getFullYear(), K.today().getMonth(), c.closeDay)), 'Monthly', K.today())) : 'Not set'], ['Payment due', c.dueDay ? 'The ' + K.ord(c.dueDay) + ' · next ' + K.fmtDate(K.nextDate(K.iso(new Date(K.today().getFullYear(), K.today().getMonth(), c.dueDay)), 'Monthly', K.today())) : 'Not set'], ['Expires', (() => { const ex = K.expiryInfo(c); return ex ? ex.label + (ex.expired ? ' · expired' : ex.soon ? ' · soon' : '') : 'Not set'; })(), (() => { const ex = K.expiryInfo(c); return ex && (ex.expired || ex.soon) ? 'warn' : null; })()], ['Foreign transaction fee', (c.fxFee != null ? c.fxFee : 2.5) + '%']]} />
      <div class="grid g2" style=${{ gap: '8px' }}><button class="btn pri" onClick=${() => openSheet({ k: 'transfer', toWhere: 'card:' + c.id, amount: c.stmtBal || c.bal })}>Pay card</button><button class="btn sec" onClick=${() => openSheet({ k: 'addCard', item: c })}>Edit</button></div>
      <${DangerButton} label="Delete card" onConfirm=${() => { commit(K.remove(data, 'cards', c.id)); toast('Card deleted'); back(); }} /></div>`;
    const right = html`<div class="stack-s"><${SectionHeader} title="Recent charges" />${tx.length ? html`<div class="card tight list">${tx.slice(0, 30).map((t) => html`<${K.TxnRow} key=${t.id} t=${t} />`)}</div>` : html`<div class="card"><${EmptyState} icon="card" title="No charges yet" text="Expenses paid with this card appear here." /></div>`}</div>`;
    return html`<div class="stack"><${DetailHead} title=${c.name} sub=${c.last4 ? '•••• ' + c.last4 : c.network} />${wide ? html`<div class="grid w2" style=${{ alignItems: 'start' }}>${left}${right}</div>` : html`${left}${right}`}</div>`;
  };

  K.LoanDetail = function LoanDetail({ route }) {
    const { data, fmt, go, wide, openSheet, commit, back, toast } = useApp();
    const l = data.loans.find((x) => x.id === route.id);
    if (!l) return html`<${EmptyState} title="Loan not found" />`;
    const pct = l.orig ? ((l.orig - l.bal) / l.orig) * 100 : 0;
    const p = K.payoffDate(l);
    const pays = data.txns.filter((t) => t.loan === l.id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const split = K.loanSplit(l);
    const left = html`<div class="stack">
      <div class="card stack" style=${{ gap: '12px' }}><div class="between"><span class="stack-s" style=${{ gap: '2px' }}><span class="small muted">Remaining</span><span class="disp num" style=${{ fontSize: '32px', fontWeight: 800 }}>${fmt(l.bal)}</span></span>${l.orig ? html`<span class="pill pos">${pct.toFixed(0)}% paid</span>` : null}</div>${l.orig ? html`<${K.Segs} pct=${pct} color="var(--acc)" h=${12} />` : null}</div>
      <${Facts} rows=${[['Interest rate', (l.rate || 0).toFixed(2) + '%'], ['Payment', fmt(l.pay || 0, { dec: 2 }) + ' · ' + (l.freq || '').toLowerCase()], ['Next payment', l.next ? K.fmtDate(K.nextDate(l.next, l.freq, D0()), true) : 'Not set'], l.lender && ['Lender', l.lender], ['Next payment split', fmt(split.principal, { dec: 2 }) + ' principal · ' + fmt(split.interest, { dec: 2 }) + ' interest']]} />
      <div class="grid g2" style=${{ gap: '8px' }}><button class="btn pri" onClick=${() => openSheet({ k: 'payLoan', id: l.id })}>Record payment</button><button class="btn sec" onClick=${() => openSheet({ k: 'addLoan', item: l })}>Edit</button></div></div>`;
    const right = html`<div class="stack">
      <div class="card stack" style=${{ gap: '12px' }}><div class="between"><h3 style=${{ fontSize: '16px' }}>Payoff</h3><span class="tag">Estimate</span></div><div class="grid g3" style=${{ gap: '8px' }}><${Metric} label="Paid off" value=${p.label} /><${Metric} label="Payments left" value=${isFinite(p.n) ? p.n : '—'} /><${Metric} label="Interest left" value=${isFinite(p.interest) ? '≈ ' + fmt(p.interest) : '—'} /></div>
        <button class="btn sec block" onClick=${() => go({ r: 'stats', tab: 'forecast', metric: 'debt', scen: { loan: 100 } })}><${Icon} n="trend" s=${16} />Try an extra payment</button></div>
      <div class="stack-s"><${SectionHeader} title="Payments" />${pays.length ? html`<div class="card tight list">${pays.map((t) => html`<${K.TxnRow} key=${t.id} t=${t} />`)}</div>` : html`<div class="card"><${EmptyState} icon="loan" title="No payments recorded" text="Use Record payment each time you pay; Kipu splits principal and interest." /></div>`}</div>
      <${DangerButton} label="Delete loan" onConfirm=${() => { commit(K.remove(data, 'loans', l.id)); toast('Loan deleted'); back(); }} /></div>`;
    return html`<div class="stack"><${DetailHead} title=${l.name} sub=${(l.kind || 'Loan') + (l.lender ? ' · ' + l.lender : '')} />${wide ? html`<div class="grid w2" style=${{ alignItems: 'start' }}>${left}${right}</div>` : html`${left}${right}`}</div>`;
  };
  const D0 = () => K.today();

  K.TxnDetail = function TxnDetail({ route }) {
    const { data, commit, fmt, go, toast, back, openSheet } = useApp();
    const t = data.txns.find((x) => x.id === route.id);
    if (!t) return html`<${EmptyState} title="Transaction not found" text="It may have been deleted." />`;
    const foreign = t.cur !== data.base;
    const liveNow = foreign ? K.toBase(data, t.amt, t.cur) : null;
    const trip = t.trip && data.trips.find((x) => x.id === t.trip);
    const typeLabel = { expense: 'Expense', income: 'Income', saving: 'Saved to goal', debt: 'Loan payment', transfer: 'Transfer' }[t.type];
    const c = K.CATS[t.cat];
    return html`<div class="stack" style=${{ maxWidth: '640px' }}>
      <div class="card stack-s" style=${{ alignItems: 'center', textAlign: 'center', padding: '24px 18px' }}><${Tile} icon=${c ? c.icon : t.type === 'income' ? 'income' : 'transfer'} tone=${c ? c.tone : 'n'} /><span class="t1" style=${{ marginTop: '6px' }}>${t.merchant || typeLabel}</span><span class="disp num" style=${{ fontSize: '34px', fontWeight: 800, color: t.type === 'income' ? 'var(--pos)' : null }}>${t.type === 'income' ? '+' : ''}${foreign ? fmt.native(t.amt, t.cur, { dec: 2 }) : fmt(t.base, { dec: 2 })}</span>${foreign && html`<span class="small muted num">${fmt(t.base, { dec: 2 })}${t.estimate ? ' estimated' : ''}</span>`}<span class="pill neu">${typeLabel}</span></div>
      ${foreign && html`<div class="card stack-s"><div class="between"><span style=${{ fontWeight: 600 }}>Stored conversion</span><span class="pill pos"><${Icon} n="lock" s=${12} w=${2.2} />Locked</span></div><span class="small muted num" style=${{ lineHeight: 1.5 }}>1 ${t.cur} = ${K.sym(data.base)}${(t.rate || 0).toFixed(4)} on ${K.fmtDate(t.date)}. Today’s rate would make it ${fmt(liveNow, { dec: 2 })}, but past amounts don’t change.</span></div>`}
      ${t.type === 'expense' && html`<div class="stack-s"><span class="eyebrow">Category</span><div class="chips">${K.CAT_ORDER.map((k) => html`<button key=${k} class=${'chip' + (t.cat === k ? ' on' : '')} onClick=${() => { commit(K.editTxn(data, t.id, { cat: k })); toast('Category updated'); }}>${K.CATS[k].name}</button>`)}</div><button class="link" style=${{ alignSelf: 'flex-start' }} onClick=${() => { commit(Object.assign({}, data, { rules: data.rules.filter((r) => r.merchant.toLowerCase() !== (t.merchant || '').toLowerCase()).concat([{ id: K.uid('r'), merchant: t.merchant, cat: t.cat }]) })); toast('New ' + t.merchant + ' purchases will use ' + K.CATS[t.cat].name); }}>Always use this category for ${t.merchant}</button></div>`}
      <${Facts} rows=${[['Date', K.fmtDate(t.date, true)], t.from && [t.type === 'income' ? 'Into' : 'From', K.whereName(data, t.from)], t.to && ['To', K.whereName(data, t.to)], trip && ['Trip', trip.name], t.goal && ['Goal', (data.goals.find((g) => g.id === t.goal) || {}).name], t.principal != null && ['Principal / interest', fmt(t.principal, { dec: 2 }) + ' / ' + fmt(t.interest, { dec: 2 })], ['Added from', { receipt: 'Receipt scan', statement: 'Statement import', manual: 'Manual entry' }[t.source] || 'Manual entry'], t.recurring && ['Recurring', 'Yes · in Bills & recurring'], t.note && ['Note', t.note]]} />
      <div class="grid g2" style=${{ gap: '8px' }}><button class="btn sec" onClick=${() => openSheet({ k: t.type === 'income' ? 'income' : 'expense', item: t })} disabled=${!['expense', 'income'].includes(t.type)}>Edit</button>${trip ? html`<button class="btn sec" onClick=${() => go({ r: 'trip', id: trip.id })}>Open trip</button>` : html`<span></span>`}</div>
      <${DangerButton} label="Delete transaction" onConfirm=${() => { commit(K.removeTxn(data, t.id)); toast('Transaction deleted · balances updated'); back(); }} />
    </div>`;
  };
})();
