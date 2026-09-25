/* Kipu · Plan: overview, budget, bills & recurring, goals, trips */
(function () {
  const K = window.K;
  const { useState } = React;
  const { html, useApp, Icon, Metric, SectionHeader, Row, Tile, Bar, Stripe, KeyRow, UpcomingItem, GoalProgress, ContextFilter, Tabs, Chips, EmptyState, AddRow, Facts, DetailHead, BarChart, Sheet, DangerButton } = K;

  const PLAN_TABS = [['overview', 'Overview'], ['budget', 'Budget'], ['bills', 'Bills & recurring'], ['goals', 'Goals'], ['trips', 'Trips']];
  K.Plan = function Plan({ route }) {
    const { go, wide } = useApp();
    const tab = route.tab || 'overview';
    const Body = { overview: PlanOverview, budget: Budget, bills: Bills, goals: Goals, trips: Trips }[tab];
    return html`<div class="stack">
      <div class="between" style=${{ paddingTop: wide ? 0 : '8px' }}><div class="stack-s" style=${{ gap: '4px' }}><span class="eyebrow">Money plan</span><h1 style=${{ fontSize: '30px', fontWeight: 800 }}>Plan</h1></div><${ContextFilter} show=${['scope']} /></div>
      <${Tabs} tabs=${PLAN_TABS} value=${tab} onChange=${(t) => go({ r: 'plan', tab: t }, true)} />
      <${Body} /></div>`;
  };

  // The only place Safe to Spend is explained
  const Calc = () => {
    const { D, fmt, openSheet, data } = useApp();
    const p = D.plan;
    if (!p.hasAccounts) return null;
    const step = (label, v, sub, color, strong, act) => html`<div class="between" style=${{ padding: '11px 0', borderTop: '1px solid var(--line)' }}><span class="row" style=${{ gap: '10px', minWidth: 0 }}><span class="dotk" style=${{ background: color }}></span><span class="stack-s" style=${{ gap: '1px', minWidth: 0 }}><span style=${{ fontWeight: strong ? 700 : 500 }}>${label}</span>${sub && html`<span class="tiny muted">${sub}</span>`}</span></span><span class="row" style=${{ gap: '8px' }}>${act}<span class="amt" style=${{ fontSize: strong ? '17px' : '14px' }}>${v}</span></span></div>`;
    const names = (arr) => arr.slice(0, 3).join(', ') + (arr.length > 3 ? ' and more' : '');
    return html`<div class="card stack" style=${{ gap: '12px' }}>
      <div class="between"><h3 style=${{ fontSize: '16px' }}>How Safe to Spend is worked out</h3><span class="tag">to ${K.fmtDate(p.until)}</span></div>
      <div>
        ${step('Cash in everyday accounts', fmt(p.cashNow), 'Chequing and cash. Savings and investments aren’t counted.', 'var(--acc)', true)}
        ${step('Bills due', '−' + fmt(p.billsDueAmt), p.billsDue.length ? names(p.billsDue.map((x) => x.b.name)) : 'None before ' + K.fmtDate(p.until), '#8C7BE0', false, html`<button class="link" style=${{ fontSize: '12px' }} onClick=${() => openSheet({ k: 'addBill' })}>Add</button>`)}
        ${step('Card payments due', '−' + fmt(p.cardsDueAmt), p.cardsDue.length ? names(p.cardsDue.map((c) => c.name)) : 'None in this window', 'var(--info2)')}
        ${step('Loan payments due', '−' + fmt(p.loansDueAmt), p.loansDue.length ? names(p.loansDue.map((x) => x.l.name)) : 'None in this window', 'var(--info2)')}
        ${step('Planned savings left this month', '−' + fmt(p.savingsLeft), p.savingsPlanned ? fmt(p.savedSoFar) + ' of ' + fmt(p.savingsPlanned) + ' already moved' : 'Set a monthly amount on a goal', 'var(--pos2)')}
        <div class="between" style=${{ padding: '14px 0 0', borderTop: '1.5px solid var(--ink)' }}><span style=${{ fontWeight: 700, fontSize: '16px' }}>Safe to Spend</span><span class="disp num" style=${{ fontSize: '24px', fontWeight: 800, color: p.safe < 0 ? 'var(--crit)' : 'var(--acc)' }}>${fmt(p.safe)}</span></div>
      </div>
      <span class="tiny muted" style=${{ lineHeight: 1.5 }}>${p.nextPay ? 'Your next payday is ' + K.fmtDate(p.nextPay, true) + '.' : 'No income set, so this runs to the end of the month.'} Bills paid by card are covered by the card payment.</span></div>`;
  };

  function PlanOverview() {
    const { D, go, wide, openSheet } = useApp();
    const up = html`<div class="stack-s"><${SectionHeader} title="Coming up" action="All" onAction=${() => go({ r: 'plan', tab: 'bills' }, true)} />${D.upcoming.length ? html`<div class="card tight list">${D.upcoming.slice(0, 6).map((u, i) => html`<${UpcomingItem} key=${i} u=${u} />`)}</div>` : html`<div class="card"><${EmptyState} icon="calendar" title="Nothing scheduled" text="Bills, loan payments and income will show here." action="Add a bill" onAction=${() => openSheet({ k: 'addBill' })} /></div>`}</div>`;
    const next = html`<button class="card flat" style=${{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }} onClick=${() => go({ r: 'stats', tab: 'forecast', metric: 'safe' })}><${Tile} icon="trend" tone="p" /><span class="grow stack-s" style=${{ gap: '2px', textAlign: 'left' }}><span class="t1">Next months</span><span class="t2">Projected Safe to Spend, savings and debt in Forecast</span></span><${Icon} n="next" s=${15} /></button>`;
    return wide ? html`<div class="grid w2" style=${{ alignItems: 'start' }}><div class="stack"><${K.SafeHero} /><${Calc} /></div><div class="stack">${up}${next}</div></div>` : html`<div class="stack"><${K.SafeHero} /><${Calc} />${up}${next}</div>`;
  }

  function Budget() {
    const { D, fmt, openSheet, wide } = useApp();
    const p = D.plan;
    const T = D.T, elapsed = (T.getDate() / new Date(T.getFullYear(), T.getMonth() + 1, 0).getDate()) * 100;
    if (!p.budgetRows.length) return html`<div class="card"><${EmptyState} icon="sliders" title="No budget yet" text="Set a monthly amount for the categories you want to watch. Kipu compares it with what you actually spend." action="Set up budget" onAction=${() => openSheet({ k: 'budgetEdit', cat: 'groceries' })} /></div>`;
    const row = (b) => {
      const pct = b.plan ? (b.actual / b.plan) * 100 : 0, over = b.actual > b.plan + 0.5, c = K.CATS[b.cat];
      return html`<button key=${b.cat} class="lrow" style=${{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }} onClick=${() => openSheet({ k: 'budgetEdit', cat: b.cat })}>
        <span class="between"><span class="row" style=${{ gap: '10px' }}><${Tile} icon=${c.icon} tone=${c.tone} s=${30} /><span class="t1">${c.name}</span>${over && html`<span class="pill warn" style=${{ height: '22px' }}><${Icon} n="alert" s=${11} w=${2.4} />Over</span>`}</span><span class="small num"><b>${fmt(b.actual)}</b><span class="muted"> of ${fmt(b.plan)}</span></span></span>
        <${K.Segs} pct=${pct} n=${24} h=${7} color=${pct > 100 ? 'var(--crit2)' : pct > 90 ? 'var(--warn2)' : 'var(--acc)'} mark=${elapsed} />
        <span class="tiny muted num" style=${{ textAlign: 'left' }}>${over ? fmt(b.actual - b.plan) + ' over plan' : fmt(b.plan - b.actual) + ' left'}</span></button>`;
    };
    const unplanned = K.CAT_ORDER.filter((c) => !D.plan.budgetRows.some((b) => b.cat === c) && (D.month.cats[c] || 0) > 0);
    return html`<div class="stack">
      <div class="card stack" style=${{ gap: '12px' }}><div class="grid g3" style=${{ gap: '8px' }}><${Metric} label="Planned" value=${fmt(p.budgetPlan)} /><${Metric} label="Spent" value=${fmt(p.budgetActual)} /><${Metric} label="Left" value=${fmt(p.budgetPlan - p.budgetActual)} tone=${p.budgetPlan >= p.budgetActual ? 'pos' : 'warn'} /></div><${Bar} pct=${p.budgetPlan ? (p.budgetActual / p.budgetPlan) * 100 : 0} mark=${elapsed} h=${10} /><span class="tiny muted">The tick shows how far through the month we are.</span></div>
      <div class="card tight list">${p.budgetRows.map(row)}</div>
      ${unplanned.length > 0 && html`<div class="stack-s"><span class="eyebrow">Spending without a plan</span><div class="chips">${unplanned.map((c) => html`<button key=${c} class="chip" onClick=${() => openSheet({ k: 'budgetEdit', cat: c })}>${K.CATS[c].name} · ${fmt(D.month.cats[c])}</button>`)}</div></div>`}
      <button class="btn sec block" onClick=${() => openSheet({ k: 'budgetEdit', cat: K.CAT_ORDER.find((c) => !data0(D).has(c)) || 'other' })}><${Icon} n="plus" s=${15} />Add a category to the plan</button></div>`;
  }
  const data0 = (D) => new Set(D.plan.budgetRows.map((b) => b.cat));

  K.BudgetEditSheet = function BudgetEditSheet({ cat, onClose }) {
    const { data, commit, toast } = useApp();
    const [c, setC] = useState(cat || 'groceries');
    const [v, setV] = useState(String(data.budget[cat] || ''));
    return html`<${Sheet} title="Monthly plan" sub="How much you want to spend on this category each month." onClose=${onClose}>
      <div class="chips">${K.CAT_ORDER.map((k) => html`<button key=${k} class=${'chip' + (k === c ? ' on' : '')} onClick=${() => { setC(k); setV(String(data.budget[k] || '')); }}>${K.CATS[k].name}</button>`)}</div>
      <input id="budget-amt" class="amount-in num" inputmode="decimal" placeholder="0" value=${v} onInput=${(e) => setV(e.target.value.replace(/[^0-9.]/g, ''))} aria-label="Monthly plan" />
      <div class="grid g2" style=${{ gap: '8px' }}>${data.budget[c] ? html`<button class="btn sec" onClick=${() => { const b = Object.assign({}, data.budget); delete b[c]; commit(Object.assign({}, data, { budget: b })); toast('Removed from plan'); onClose(); }}>Remove</button>` : html`<span></span>`}<button class="btn pri" disabled=${!parseFloat(v)} onClick=${() => { commit(Object.assign({}, data, { budget: Object.assign({}, data.budget, { [c]: parseFloat(v) || 0 }) })); toast('Plan saved'); onClose(); }}>Save</button></div></${Sheet}>`;
  };

  function Bills() {
    const { D, data, fmt, commit, toast, openSheet, wide } = useApp();
    const [f, setF] = useState('All');
    if (!D.bills.length && !D.loans.length) return html`<div class="card"><${EmptyState} icon="calendar" title="No bills yet" text="Add rent, utilities, phone, subscriptions and yearly costs. They count in Safe to Spend and show up before they’re due." action="Add bill or subscription" onAction=${() => openSheet({ k: 'addBill' })} /></div>`;
    const monthly = (b) => { const v = K.toBase(data, b.amt, b.cur || data.base); return b.kind === 'Annual' ? v / 12 : v; };
    const loanItems = D.loans.filter((l) => l.pay).map((l) => ({ id: l.id, name: l.name, kind: 'Loan', amt: (l.pay * K.perYear(l.freq)) / 12, loan: true, freq: l.freq }));
    const items = D.bills.map((b) => Object.assign({}, b, { m: monthly(b) })).concat(loanItems.map((l) => Object.assign({}, l, { m: l.amt })));
    const kindOf = (i) => (i.loan ? 'Loans' : i.kind === 'Subscription' ? 'Subscriptions' : i.kind === 'Annual' ? 'Annual' : 'Bills');
    const parts = [['Bills', '#8C7BE0'], ['Loans', 'var(--info2)'], ['Subscriptions', 'var(--warn2)'], ['Annual', 'var(--neutral)']];
    const tot = (k) => K.sum(items.filter((i) => kindOf(i) === k), (i) => i.m), total = K.sum(items, (i) => i.m);
    const unpaid = new Set(D.unpaid.map((b) => b.id));
    const shown = items.filter((i) => f === 'All' || kindOf(i) === f);
    return html`<div class="stack">
      <div class="card stack" style=${{ gap: '12px' }}><div class="between"><span class="stack-s" style=${{ gap: '2px' }}><span class="small muted">Monthly commitments</span><span class="disp num" style=${{ fontSize: '26px', fontWeight: 800 }}>${fmt(total)}</span></span><span class="small muted num">${fmt(total * 12)} a year</span></div>
        <${Stripe} parts=${parts.map(([k, c]) => [tot(k), c])} h=${12} /><div class=${wide ? 'grid w4' : 'grid g2'} style=${{ gap: '8px 16px' }}>${parts.map(([k, c]) => html`<${KeyRow} key=${k} color=${c} label=${k} value=${fmt(tot(k))} />`)}</div></div>
      ${D.unpaid.length > 0 && html`<div class="card stack-s" style=${{ borderColor: 'color-mix(in srgb, var(--warn2) 50%, var(--line))' }}><span style=${{ fontWeight: 700 }}>Due and not marked paid</span>${D.unpaid.map((b) => html`<div key=${b.id} class="between"><span>${b.name} · ${fmt(K.toBase(data, b.amt, b.cur || data.base))}</span><button class="btn sec sm" onClick=${() => { commit(K.payBill(data, b.id)); toast(b.name + ' marked as paid'); }}>Mark paid</button></div>`)}</div>`}
      <${Chips} options=${['All', 'Bills', 'Subscriptions', 'Loans', 'Annual']} value=${f} onChange=${setF} scroll=${true} />
      <div class="card tight list">${shown.map((i) => html`<${Row} key=${i.id} icon=${i.loan ? 'car' : i.kind === 'Subscription' ? 'repeat' : i.kind === 'Annual' ? 'calendar' : (K.CATS[i.cat] || {}).icon || 'bolt'} tone=${i.loan ? 'b' : i.kind === 'Subscription' ? 'a' : 'p'} title=${i.name} sub=${(i.loan ? i.freq : i.kind === 'Annual' ? 'Every ' + K.MONTH_LONG[(i.month || 1) - 1] + ' ' + i.day : 'Monthly on day ' + i.day) + (i.pay ? ' · ' + K.whereName(data, i.pay) : '') + (unpaid.has(i.id) ? ' · due' : '')} right=${fmt(i.loan ? i.m : K.toBase(data, i.amt, i.cur || data.base))} rightSub=${i.kind === 'Annual' ? '≈ ' + fmt(i.m) + '/mo' : i.loan ? 'a month' : null} onClick=${() => openSheet(i.loan ? { k: 'addLoan', item: data.loans.find((l) => l.id === i.id) } : { k: 'addBill', item: data.bills.find((b) => b.id === i.id) })} chevron=${true} />`)}</div>
      <div class="card tight"><${AddRow} label="Add bill or subscription" sheet="addBill" /></div></div>`;
  }

  function Goals() {
    const { D, fmt, go, wide, openSheet } = useApp();
    if (!D.goals.length) return html`<div class="card"><${EmptyState} icon="target" title="No goals yet" text="Save for an emergency fund, a trip or a big purchase. Link a savings account and its balance counts automatically." action="Add goal" onAction=${() => openSheet({ k: 'addGoal' })} /></div>`;
    const saved = K.sum(D.goals, (g) => g.savedNow), target = K.sum(D.goals, (g) => g.target);
    return html`<div class="stack">
      <div class="card stack-s"><div class="between"><span class="small muted">Saved toward ${D.goals.length} ${D.goals.length === 1 ? 'goal' : 'goals'}</span><span class="disp num" style=${{ fontWeight: 700, fontSize: '20px' }}>${fmt(saved)}</span></div><${Bar} pct=${target ? (saved / target) * 100 : 0} h=${10} /><span class="tiny muted num">${fmt(target)} in targets · ${fmt(D.plan.savedSoFar)} added this month</span></div>
      <div class=${wide ? 'grid w2' : 'stack-s'} style=${{ gap: '12px' }}>${D.goals.map((g) => html`<${GoalProgress} key=${g.id} g=${g} onClick=${() => go({ r: 'goal', id: g.id })} />`)}</div>
      <div class="card tight"><${AddRow} label="Add goal" sheet="addGoal" /></div></div>`;
  }

  function Trips() {
    const { D, fmt, go, openSheet } = useApp();
    if (!D.trips.length) return html`<div class="card"><${EmptyState} icon="plane" title="No trips yet" text="Plan a trip with dates, currency and budget. Spending abroad during those dates is tagged to it automatically." action="Plan a trip" onAction=${() => openSheet({ k: 'addTrip' })} /></div>`;
    const a = D.activeTrip;
    const planned = D.trips.filter((t) => t.status === 'planned'), past = D.trips.filter((t) => t.status === 'done');
    const list = (title, arr) => arr.length > 0 && html`<div class="stack-s"><${SectionHeader} title=${title} /><div class="card tight list">${arr.map((t) => html`<${Row} key=${t.id} icon="plane" tone=${t.status === 'planned' ? 'b' : 'n'} title=${t.name} sub=${K.fmtDate(t.start) + ' – ' + K.fmtDate(t.end, true) + (t.place ? ' · ' + t.place : '')} right=${fmt(t.status === 'planned' ? t.budget : t.spent)} rightSub=${t.status === 'planned' ? 'budget' : t.budget ? (t.spent > t.budget ? fmt(t.spent - t.budget) + ' over' : 'within budget') : null} onClick=${() => go({ r: 'trip', id: t.id })} chevron=${true} />`)}</div></div>`;
    return html`<div class="stack">
      ${a && html`<button class="hero" style=${{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', width: '100%' }} onClick=${() => go({ r: 'trip', id: a.id })}><span class="between"><span class="soft small">Active trip · day ${a.day} of ${a.total}</span><span class="soft tiny">${K.fmtDate(a.start)} – ${K.fmtDate(a.end)}</span></span><span class="disp" style=${{ fontSize: '26px', fontWeight: 800 }}>${a.name}</span>${a.budget > 0 && html`<span style=${{ display: 'flex', gap: '2px', height: '8px' }}><i style=${{ width: Math.min(100, (a.spent / a.budget) * 100) + '%', background: 'currentColor', borderRadius: '999px' }}></i><i style=${{ flex: 1, background: 'rgba(255,255,255,0.3)', borderRadius: '999px' }}></i></span>`}<span class="small num">${fmt(a.spent)}${a.budget ? ' of ' + fmt(a.budget) : ''}</span></button>`}
      ${list('Coming up', planned)}${list('Past trips', past)}
      <div class="card tight"><${AddRow} label="Plan a trip" sheet="addTrip" /></div>
      <span class="tiny muted">Trip spending stays in your normal categories and is tagged to the trip, so nothing is counted twice.</span></div>`;
  }

  K.GoalDetail = function GoalDetail({ route }) {
    const { D, data, fmt, openSheet, commit, toast, wide, back } = useApp();
    const g = D.goals.find((x) => x.id === route.id);
    const [m, setM] = useState(g ? g.monthly || 0 : 0);
    if (!g) return html`<${EmptyState} title="Goal not found" />`;
    const months = m > 0 ? Math.ceil(g.left / m) : null;
    const eta = months != null ? new Date(D.T.getFullYear(), D.T.getMonth() + months, 1) : null;
    const hist = data.txns.filter((t) => t.goal === g.id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const acct = g.linked && data.accounts.find((a) => a.id === g.linked);
    const target = g.targetDate ? K.parse(g.targetDate + '-01') : null;
    const ahead = eta && target ? (target.getFullYear() - eta.getFullYear()) * 12 + target.getMonth() - eta.getMonth() : null;
    const left = html`<div class="stack">
      <div class="card stack" style=${{ gap: '12px' }}><div class="between"><span class="stack-s" style=${{ gap: '2px' }}><span class="small muted">Saved</span><span class="disp num" style=${{ fontSize: '32px', fontWeight: 800 }}>${fmt(g.savedNow)}</span></span><span class="disp num" style=${{ fontSize: '22px', fontWeight: 800, color: 'var(--acc)' }}>${g.pct}%</span></div><${Bar} pct=${g.pct} h=${12} /><span class="tiny muted num">${fmt(g.left)} to go of ${fmt(g.target)}</span></div>
      ${g.left > 0 && html`<div class="card stack" style=${{ gap: '12px' }}><div class="between"><h3 style=${{ fontSize: '16px' }}>Monthly amount</h3><span class="amt">${fmt(m)}</span></div><input id="goal-monthly" type="range" min="0" max=${Math.max(1000, (g.monthly || 0) * 3, Math.ceil(g.left / 6))} step="10" value=${m} onInput=${(e) => setM(+e.target.value)} aria-label="Monthly amount" style=${{ width: '100%', accentColor: 'var(--acc)' }} />
        <div class="between"><span class="small muted">Done by</span><span style=${{ fontWeight: 700 }}>${eta ? K.fmtMonth(eta) : 'Add a monthly amount'}</span></div>
        ${ahead != null && html`<span class=${'pill ' + (ahead >= 0 ? 'pos' : 'warn')} style=${{ alignSelf: 'flex-start' }}><${Icon} n=${ahead >= 0 ? 'check' : 'alert'} s=${12} w=${2.4} />${ahead >= 0 ? ahead + ' months before the target date' : -ahead + ' months after the target date'}</span>`}
        ${m !== (g.monthly || 0) && html`<button class="btn pri block" onClick=${() => { commit(K.upsert(data, 'goals', Object.assign({}, data.goals.find((x) => x.id === g.id), { monthly: m }))); toast('Monthly amount saved · counts in Safe to Spend'); }}>Save ${fmt(m)} a month</button>`}</div>`}
      <${Facts} rows=${[['Target', fmt(g.target)], ['Target date', target ? K.fmtMonth(target) : 'None set'], ['Linked account', acct ? acct.name + ' · balance counts automatically' : 'Tracked in Kipu']]} />
      <div class="grid g2" style=${{ gap: '8px' }}><button class="btn pri" onClick=${() => openSheet({ k: 'transfer', goal: g.id })}>Add money</button><button class="btn sec" onClick=${() => openSheet({ k: 'addGoal', item: data.goals.find((x) => x.id === g.id) })}>Edit</button></div>
      <${DangerButton} label="Delete goal" onConfirm=${() => { commit(K.remove(data, 'goals', g.id)); toast('Goal deleted'); back(); }} /></div>`;
    const right = html`<div class="stack-s"><${SectionHeader} title="Contributions" />${hist.length ? html`<div class="card tight list">${hist.map((t) => html`<${K.TxnRow} key=${t.id} t=${t} />`)}</div>` : html`<div class="card"><${EmptyState} icon="target" title="No contributions yet" text=${acct ? 'Transfers into ' + acct.name + ' count toward this goal.' : 'Use Add money to move savings here.'} /></div>`}</div>`;
    return html`<div class="stack"><${DetailHead} title=${g.name} sub=${g.left <= 0 ? 'Funded' : g.monthly ? 'On track for ' + g.etaLabel : 'No monthly amount yet'} />${wide ? html`<div class="grid w2" style=${{ alignItems: 'start' }}>${left}${right}</div>` : html`${left}${right}`}</div>`;
  };

  K.TripDetail = function TripDetail({ route }) {
    const { D, data, fmt, openSheet, wide, commit, toast, back } = useApp();
    const t = D.trips.find((x) => x.id === route.id);
    if (!t) return html`<${EmptyState} title="Trip not found" />`;
    const shown = Math.max(1, Math.min(t.total, t.status === 'planned' ? 0 : t.day));
    const dayList = []; for (let i = 0; i < shown; i++) dayList.push(K.addDays(K.parse(t.start), i));
    const perDay = dayList.map((d) => K.sum(t.txns.filter((x) => x.date === K.iso(d)), (x) => x.base));
    const byCat = {}; t.txns.forEach((x) => (byCat[x.cat] = (byCat[x.cat] || 0) + x.base));
    const cats = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]);
    const live = K.sum(t.txns, (x) => K.toBase(data, x.amt, x.cur));
    const left = html`<div class="stack">
      <div class="card stack" style=${{ gap: '12px' }}><div class="between"><span class="stack-s" style=${{ gap: '2px' }}><span class="small muted">Spent</span><span class="disp num" style=${{ fontSize: '30px', fontWeight: 800 }}>${fmt(t.spent)}</span>${t.cur !== data.base && t.native > 0 && html`<span class="small muted num">${fmt.native(t.native, t.cur)} in ${t.cur}</span>`}</span><span class="stack-s" style=${{ alignItems: 'flex-end', gap: '2px' }}><span class="small muted">Budget</span><span class="amt">${t.budget ? fmt(t.budget) : 'Not set'}</span></span></div>
        ${t.budget > 0 && html`<${K.Segs} pct=${(t.spent / t.budget) * 100} color=${t.spent > t.budget ? 'var(--crit2)' : 'var(--acc)'} mark=${t.status === 'active' ? (t.day / t.total) * 100 : null} h=${10} />`}</div>
      ${t.txns.length > 0 && html`<${K.ChartBox} title="Daily spending" question="Which days cost the most?"><${BarChart} groups=${perDay.map((v, i) => ({ label: String(dayList[i].getDate()), values: [v] }))} colors=${['var(--info)']} h=${150} hi=${perDay.indexOf(Math.max(...perDay))} labelTop=${(v) => fmt.k(v)} fmtY=${fmt.k} /></${K.ChartBox}>`}
      ${cats.length > 0 && html`<div class="card stack-s"><h3 style=${{ fontSize: '16px' }}>By category</h3>${cats.map((c) => html`<div key=${c} class="stack-s" style=${{ gap: '5px' }}><div class="between small"><span>${K.CATS[c].name}</span><span class="amt">${fmt(byCat[c])}</span></div><${Bar} pct=${(byCat[c] / byCat[cats[0]]) * 100} color="var(--info)" /></div>`)}</div>`}</div>`;
    const right = html`<div class="stack">
      ${t.txns.some((x) => x.cur !== data.base) && html`<div class="card stack-s"><div class="between"><h3 style=${{ fontSize: '16px' }}>Exchange rates</h3><span class="pill pos"><${Icon} n="lock" s=${12} w=${2.2} />Stored</span></div><span class="small muted" style=${{ lineHeight: 1.5 }}>Each purchase keeps the rate it was recorded at. At today’s rates the same spending would be ${fmt(live, { dec: 2 })}.</span></div>`}
      <div class="grid g2" style=${{ gap: '8px' }}><button class="btn pri" onClick=${() => openSheet({ k: 'expense', preset: { cur: t.cur, trip: t.id } })}><${Icon} n="plus" s=${16} w=${2.4} />Add expense</button><button class="btn sec" onClick=${() => openSheet({ k: 'addTrip', item: data.trips.find((x) => x.id === t.id) })}>Edit</button></div>
      <div class="stack-s"><${SectionHeader} title="Trip transactions" />${t.txns.length ? html`<div class="card tight list">${t.txns.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((x) => html`<${K.TxnRow} key=${x.id} t=${x} />`)}</div>` : html`<div class="card"><${EmptyState} icon="plane" title="No trip spending yet" text="Expenses during the trip dates in another currency are tagged automatically. You can also tag any expense to this trip." /></div>`}</div>
      <${DangerButton} label="Delete trip" onConfirm=${() => { commit(Object.assign({}, K.remove(data, 'trips', t.id), { txns: data.txns.map((x) => (x.trip === t.id ? Object.assign({}, x, { trip: null }) : x)) })); toast('Trip deleted · its expenses were kept'); back(); }} /></div>`;
    return html`<div class="stack"><${DetailHead} title=${t.name} sub=${(t.place ? t.place + ' · ' : '') + K.fmtDate(t.start) + ' – ' + K.fmtDate(t.end, true)} right=${html`<span class="pill info">${t.status === 'active' ? 'Day ' + t.day + ' of ' + t.total : t.status === 'planned' ? 'Upcoming' : 'Finished'}</span>`} />${wide ? html`<div class="grid w2" style=${{ alignItems: 'start' }}>${left}${right}</div>` : html`${left}${right}`}</div>`;
  };
})();
