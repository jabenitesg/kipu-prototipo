/* Kipu · Settings and first-run welcome */
(function () {
  const K = window.K;
  const { useState, useRef } = React;
  const { html, useApp, Icon, Row, Tile, Bar, Seg, Chips, Switch, ToggleRow, Field, EmptyState, Facts, ThemePreview, DangerButton } = K;

  // ---------------------------------------------------------------- first run
  K.Onboarding = function Onboarding() {
    const { data, commit, setSettings } = useApp();
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [base, setBase] = useState('CAD');
    const [extra, setExtra] = useState([]);
    const finish = (sample) => {
      if (sample) { commit(K.sampleData()); return; }
      commit(K.snapshot(Object.assign({}, data, { onboarded: true, profile: { name: name.trim(), email: '' }, base, active: [base].concat(extra.filter((c) => c !== base)) })));
    };
    const Dot = ({ i }) => html`<span style=${{ width: i === step ? '22px' : '8px', height: '8px', borderRadius: '999px', background: i <= step ? 'var(--acc)' : 'var(--neutral)', transition: 'width 0.2s' }}></span>`;
    return html`<div class="onb"><div class="onb-card stack" style=${{ gap: '22px' }}>
      <div class="row" style=${{ gap: '10px' }}><span style=${{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--grad)' }}></span><span class="disp" style=${{ fontSize: '22px', fontWeight: 800 }}>Kipu</span><span class="grow"></span><div class="row" style=${{ gap: '6px' }}>${[0, 1, 2].map((i) => html`<${Dot} key=${i} i=${i} />`)}</div></div>
      ${step === 0 && html`<div class="stack" style=${{ gap: '14px' }}><h1 style=${{ fontSize: '32px', lineHeight: '38px', fontWeight: 800 }}>Money, calmly.</h1><p class="muted" style=${{ fontSize: '16px', lineHeight: 1.5 }}>Kipu keeps your accounts, bills, goals and trips in one place and tells you what’s safe to spend. Everything stays on this device.</p>
        <button class="btn pri block" onClick=${() => setStep(1)}>Get started</button><button class="btn sec block" onClick=${() => finish(true)}>Explore with sample data</button></div>`}
      ${step === 1 && html`<div class="stack" style=${{ gap: '14px' }}><h1 style=${{ fontSize: '26px', fontWeight: 800 }}>What should we call you?</h1><${Field} label="First name"><input id="onb-name" class="input" value=${name} onInput=${(e) => setName(e.target.value)} placeholder="Your name" autofocus /></${Field}><button class="btn pri block" onClick=${() => setStep(2)}>Continue</button></div>`}
      ${step === 2 && html`<div class="stack" style=${{ gap: '14px' }}><h1 style=${{ fontSize: '26px', fontWeight: 800 }}>Your main currency</h1><p class="muted">Totals, Safe to Spend and net worth use it. You can still record anything in other currencies.</p>
        <div class="chips">${Object.keys(K.CURRENCIES).map((c) => html`<button key=${c} class=${'chip' + (c === base ? ' on' : '')} onClick=${() => setBase(c)}>${c} · ${K.CURRENCIES[c][0]}</button>`)}</div>
        <span class="eyebrow">Other currencies you use</span><div class="chips">${Object.keys(K.CURRENCIES).filter((c) => c !== base).map((c) => html`<button key=${c} class=${'chip' + (extra.includes(c) ? ' on' : '')} onClick=${() => setExtra(extra.includes(c) ? extra.filter((x) => x !== c) : extra.concat([c]))}>${c}</button>`)}</div>
        <button class="btn pri block" onClick=${() => finish(false)}>Start with a clean slate</button><button class="link" onClick=${() => setStep(1)}>Back</button></div>`}
    </div></div>`;
  };

  // ---------------------------------------------------------------- Settings
  const SECTIONS = [
    ['Money', [['household', 'people', 'p', 'Household'], ['currencies', 'globe', 'g', 'Currencies & exchange rates'], ['categories', 'tag', 'a', 'Category rules'], ['finance', 'sliders', 'b', 'Financial preferences']]],
    ['Experience', [['appearance', 'palette', 'p', 'Appearance & theme'], ['ai', 'spark', 'p', 'Insights'], ['profile', 'user', 'b', 'Profile']]],
    ['Protection', [['privacy', 'eye', 'b', 'Privacy'], ['data', 'upload', 'n', 'Data, backup & reset']]],
  ];
  K.Settings = function Settings({ route }) {
    const { wide } = useApp();
    const s = route.s;
    if (s && !wide) return html`<${Section} s=${s} />`;
    if (wide) return html`<div class="grid" style=${{ gridTemplateColumns: '320px minmax(0, 1fr)', gap: '28px', alignItems: 'start' }}><${Index} active=${s || 'appearance'} /><div class="card" style=${{ padding: '24px' }}><${Section} s=${s || 'appearance'} /></div></div>`;
    return html`<${Index} />`;
  };
  function Index({ active }) {
    const { data, go, settings, wide } = useApp();
    const T = K.THEMES[settings.theme];
    const val = { household: data.household.enabled ? data.household.name || 'On' : 'Off', currencies: data.base + ' · ' + data.active.length + ' active', appearance: settings.theme, ai: settings.ai.insights ? 'On' : 'Off', privacy: settings.hide ? 'Amounts hidden' : 'Amounts shown', categories: data.rules.length + ' rules', finance: data.prefs.utilRef + '% reference' };
    return html`<div class="stack">
      <header class="between" style=${{ paddingTop: wide ? 0 : '8px', alignItems: 'flex-start' }}><div class="stack-s" style=${{ gap: '6px' }}><span class="eyebrow">Preferences</span><h1 style=${{ fontSize: '30px', fontWeight: 800 }}>Settings</h1><p class="muted">Make Kipu work the way you do.</p></div><${K.Avatar} s=${46} /></header>
      <button class="hero" style=${{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', width: '100%' }} onClick=${() => go({ r: 'settings', s: 'appearance' }, wide)}><span class="soft eyebrow" style=${{ color: 'inherit' }}>Appearance & theme</span><span class="disp" style=${{ fontSize: '20px', fontWeight: 800 }}>${settings.theme}</span><span class="soft small">${settings.mode === 'System' ? 'Follows your device' : settings.mode + ' mode'} · ${T.desc}</span><span class="row" style=${{ gap: '6px' }}>${Object.keys(K.THEMES).map((n) => html`<span key=${n} style=${{ width: '18px', height: '18px', borderRadius: '999px', background: 'linear-gradient(135deg, ' + K.THEMES[n].g.join(', ') + ')', boxShadow: '0 0 0 2px rgba(255,255,255,0.85)' }}></span>`)}</span></button>
      ${SECTIONS.map(([g, items]) => html`<div key=${g} class="stack-s"><span class="eyebrow">${g}</span><div class="card tight list">${items.map(([k, ic, tone, l]) => html`<button key=${k} class="lrow" style=${active === k ? { background: 'var(--accbg)' } : null} onClick=${() => go({ r: 'settings', s: k }, wide)}><${Tile} icon=${ic} tone=${tone} /><span class="grow t1" style=${{ textAlign: 'left' }}>${l}</span><span class="t2">${val[k] || ''}</span><${Icon} n="next" s=${15} c="var(--muted)" /></button>`)}</div></div>`)}
      <span class="tiny muted" style=${{ textAlign: 'center' }}>Kipu · your data stays on this device</span></div>`;
  }
  const SubHead = ({ title, sub }) => html`<div class="stack-s" style=${{ gap: '4px' }}><h2 style=${{ fontSize: '24px', fontWeight: 800 }}>${title}</h2>${sub && html`<p class="muted" style=${{ lineHeight: 1.45 }}>${sub}</p>`}</div>`;
  function Section({ s }) {
    const C = { profile: Profile, household: Household, currencies: Currencies, categories: Categories, appearance: Appearance, ai: AI, privacy: Privacy, data: DataSec, finance: Finance }[s] || Appearance;
    return html`<div class="stack"><${C} /></div>`;
  }

  function Appearance() {
    const { settings, setSettings, toast, wide } = useApp();
    const [pick, setPick] = useState(settings.theme);
    const [pv, setPv] = useState(settings.effectiveMode);
    const T = K.THEMES[pick];
    return html`<${SubHead} title="Appearance & theme" sub="Brightness and color theme are set separately." />
      <div class="stack-s"><span class="eyebrow">Appearance</span>
        <div class="grid" style=${{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '8px' }}>${['System'].concat(Object.keys(K.MODES)).map((m) => { const on = settings.mode === m || (m === 'System' && !K.MODES[settings.mode]); const sw = m === 'System' ? 'linear-gradient(135deg, ' + K.modeBg(settings.theme, 'Light') + ' 50%, ' + K.modeBg(settings.theme, 'Dark') + ' 50%)' : K.modeBg(settings.theme, m); return html`<button key=${m} aria-pressed=${on} onClick=${() => { setSettings({ mode: m }); if (m !== 'System') setPv(m); }} class="stack-s" style=${{ gap: '8px', padding: '10px', borderRadius: '16px', background: 'var(--surface)', border: '1.5px solid ' + (on ? 'var(--acc)' : 'var(--line)'), alignItems: 'flex-start', textAlign: 'left' }}><span style=${{ width: '100%', height: '38px', borderRadius: '10px', background: sw, border: '1px solid rgba(128,128,128,0.25)', display: 'flex', alignItems: 'flex-end', padding: '6px' }}><span style=${{ width: '22px', height: '6px', borderRadius: '6px', background: 'var(--grad)' }}></span></span><span style=${{ fontSize: '13px', fontWeight: on ? 700 : 500 }}>${m}</span><span class="tiny muted" style=${{ lineHeight: '14px' }}>${m === 'System' ? 'Light or Dark, like your device' : K.MODES[m]}</span></button>`; })}</div></div>
      <div class="stack-s"><span class="eyebrow">Theme</span><div class="grid" style=${{ gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: '10px 6px' }}>${Object.keys(K.THEMES).map((n) => html`<button key=${n} aria-pressed=${n === pick} onClick=${() => setPick(n)} class="stack-s" style=${{ alignItems: 'center', gap: '6px' }}><span style=${{ width: '48px', height: '48px', borderRadius: '999px', padding: '3px', boxShadow: n === pick ? 'inset 0 0 0 2px var(--ink)' : 'none', display: 'flex' }}><span style=${{ flex: 1, borderRadius: '999px', background: 'linear-gradient(135deg, ' + K.THEMES[n].g.join(', ') + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', color: K.THEMES[n].light.heroInk }}>${n === pick && html`<${Icon} n="check" s=${16} w=${3} />`}</span></span><span style=${{ fontSize: '11px', fontWeight: n === pick ? 700 : 500, textAlign: 'center', lineHeight: '13px' }}>${n}</span></button>`)}</div></div>
      <div class="card flat stack" style=${{ gap: '14px' }}><div class="between"><span class="stack-s" style=${{ gap: '2px' }}><span style=${{ fontWeight: 700 }}>${pick}</span><span class="tiny muted">${T.desc}</span></span></div>
        <div class="chips" style=${{ justifyContent: 'center' }}>${Object.keys(K.MODES).map((m) => html`<button key=${m} class=${'chip' + (m === pv ? ' on' : '')} onClick=${() => setPv(m)}>${m}</button>`)}</div>
        <div class="row" style=${{ justifyContent: 'center', gap: '16px', flexWrap: 'wrap', padding: '16px', borderRadius: '18px', background: 'var(--surface)' }}>${wide && pv !== 'Light' && html`<${ThemePreview} name=${pick} mode="Light" w=${200} />`}<${ThemePreview} name=${pick} mode=${pv} w=${wide ? 200 : 190} /></div>
        <button class="btn pri block" disabled=${pick === settings.theme} onClick=${() => { setSettings({ theme: pick }); toast(pick + ' applied'); }} style=${{ background: 'linear-gradient(135deg, ' + T.g.join(', ') + ')', color: T.light.heroInk }}>${pick === settings.theme ? '✓ Current theme' : 'Apply theme'}</button></div>
      <div class="card tight"><${ToggleRow} title="Reduce motion" on=${settings.reduce} onChange=${(v) => setSettings({ reduce: v })} /></div>`;
  }

  function Profile() {
    const { data, commit } = useApp();
    const upd = (k) => (e) => commit(Object.assign({}, data, { profile: Object.assign({}, data.profile, { [k]: e.target.value }) }));
    return html`<${SubHead} title="Profile" sub="Used for the greeting and your avatar." /><${Field} label="Name"><input id="p-name" class="input" value=${data.profile.name} onInput=${upd('name')} /></${Field}><${Field} label="Email" hint="Optional. Kept on this device."><input id="p-email" class="input" type="email" value=${data.profile.email} onInput=${upd('email')} /></${Field}>`;
  }

  function Household() {
    const { data, commit, toast, openSheet, setCtx } = useApp();
    const hh = data.household;
    if (!hh.enabled) return html`<${SubHead} title="Household" sub="Optional. Kipu works fully without one." /><div class="card"><${EmptyState} icon="people" title="Manage shared money?" text="Mark the accounts, cards, loans, bills and goals you share, then switch to Household to see just those." action="Turn on Household" onAction=${() => openSheet({ k: 'createHousehold' })} /></div>`;
    const toggle = (coll, id) => commit(K.upsert(data, coll, Object.assign({}, data[coll].find((x) => x.id === id), { shared: !data[coll].find((x) => x.id === id).shared })));
    const groups = [['accounts', 'Accounts'], ['cards', 'Cards'], ['loans', 'Loans'], ['bills', 'Bills'], ['goals', 'Goals'], ['income', 'Income']];
    return html`<${SubHead} title=${hh.name || 'Household'} sub="Household is a view of what you mark as shared. Inviting other people needs cloud sync, which comes later." />
      <button class="btn sec" onClick=${() => { setCtx({ scope: 'household' }); toast('Viewing Household'); }}>View as Household</button>
      ${groups.map(([c, l]) => data[c].length > 0 && html`<div key=${c} class="stack-s"><span class="eyebrow">${l}</span><div class="card tight list">${data[c].map((x) => html`<${ToggleRow} key=${x.id} title=${x.name} sub=${x.shared ? 'Shared' : 'Private'} on=${!!x.shared} onChange=${() => toggle(c, x.id)} />`)}</div></div>`)}
      <button class="btn sec block" style=${{ color: 'var(--crit)' }} onClick=${() => { commit(Object.assign({}, data, { household: { enabled: false, name: hh.name } })); setCtx({ scope: 'personal' }); toast('Household off'); }}>Turn off Household</button>`;
  }

  function Currencies() {
    const { data, commit, toast } = useApp();
    const [busy, setBusy] = useState(false);
    const toggle = (c) => commit(Object.assign({}, data, { active: data.active.includes(c) ? data.active.filter((x) => x !== c) : data.active.concat([c]) }));
    const refresh = async () => { setBusy(true); try { commit(Object.assign({}, data, { fx: await K.refreshFx(data) })); toast('Exchange rates updated'); } catch (e) { toast('Couldn’t reach the rate service. Check your connection.'); } setBusy(false); };
    return html`<${SubHead} title="Currencies & exchange rates" sub=${'Your main currency is ' + data.base + '. Every transaction keeps its original amount and the rate used that day.'} />
      <div class="stack-s"><span class="eyebrow">Currencies you use</span><div class="card tight list">${Object.keys(K.CURRENCIES).map((c) => html`<div key=${c} class="lrow"><span class="ic n" style=${{ fontWeight: 700, fontSize: '11px' }}>${K.CURRENCIES[c][0]}</span><span class="grow stack-s" style=${{ gap: '2px' }}><span class="t1">${c}</span><span class="t2">${K.CURRENCIES[c][1]}${c === data.base ? ' · main' : ''}</span></span>${c === data.base ? html`<span class="pill acc">Main</span>` : html`<${Switch} on=${data.active.includes(c)} onChange=${() => toggle(c)} label=${c} />`}</div>`)}</div></div>
      <div class="stack-s"><span class="eyebrow">Exchange rates</span><${Facts} rows=${[['Source', data.fx.source], ['Last updated', data.fx.updated ? new Date(data.fx.updated).toLocaleString() : 'Never (built-in rates)']].concat(data.active.filter((c) => c !== data.base).map((c) => ['1 ' + c, K.sym(data.base) + K.rate(data, c, data.base).toFixed(4)]))} /><button class="btn sec" disabled=${busy} onClick=${refresh}>${busy ? 'Updating…' : 'Update rates now'}</button><span class="tiny muted">Rates update automatically when you open Kipu. Past transactions keep their stored rate.</span></div>`;
  }

  function Categories() {
    const { data, commit, toast } = useApp();
    return html`<${SubHead} title="Category rules" sub="When a merchant matches a rule, new expenses get that category. Create a rule from any transaction." />
      ${data.rules.length ? html`<div class="card tight list">${data.rules.map((r) => html`<div key=${r.id} class="lrow"><${Tile} icon=${K.CATS[r.cat].icon} tone=${K.CATS[r.cat].tone} /><span class="grow stack-s" style=${{ gap: '2px' }}><span class="t1">${r.merchant}</span><span class="t2">${K.CATS[r.cat].name}</span></span><button class="link" onClick=${() => { commit(Object.assign({}, data, { rules: data.rules.filter((x) => x.id !== r.id) })); toast('Rule removed'); }}>Remove</button></div>`)}</div>` : html`<div class="card"><${EmptyState} icon="tag" title="No rules yet" text="Open any expense and choose “Always use this category”." /></div>`}
      <span class="tiny muted">Without a rule, Kipu suggests a category from the merchant name and your past choices.</span>`;
  }

  function AI() {
    const { settings, setSettings } = useApp();
    return html`<${SubHead} title="Insights" sub="Rule-based notes about your money, worked out on this device." /><div class="card tight"><${ToggleRow} title="Show insights" sub="Budget warnings, unpaid bills, utilization and more" on=${settings.ai.insights} onChange=${(v) => setSettings({ ai: Object.assign({}, settings.ai, { insights: v }) })} /></div>`;
  }

  function Privacy() {
    const { settings, setSettings } = useApp();
    return html`<${SubHead} title="Privacy" sub="Your data never leaves this device unless you export it." /><div class="card tight"><${ToggleRow} title="Hide amounts" sub="Shows •••••• instead of numbers. Useful in public." on=${settings.hide} onChange=${(v) => setSettings({ hide: v })} icon="eyeoff" tone="b" /></div>`;
  }

  function Finance() {
    const { data, commit } = useApp();
    const setP = (k) => (v) => commit(Object.assign({}, data, { prefs: Object.assign({}, data.prefs, { [k]: v }) }));
    return html`<${SubHead} title="Financial preferences" sub="Defaults Kipu plans around." />
      <div class="card stack-s"><div class="between"><span style=${{ fontWeight: 600 }}>Credit utilization</span><span class="tag">Reference threshold</span></div><${Chips} options=${[10, 20, 30, 50]} value=${data.prefs.utilRef} onChange=${setP('utilRef')} labels=${['10%', '20%', '30%', '50%']} /><span class="tiny muted">Used for chart lines and insights. It isn’t a credit score rule.</span></div>
      <div class="stack-s"><span class="eyebrow">Forecast defaults</span><${Seg} options=${[3, 6, 12]} value=${data.prefs.horizon} onChange=${setP('horizon')} labels=${['3 months', '6 months', '12 months']} /><${Chips} options=${['Recent average', 'Budget based', 'Conservative']} value=${data.prefs.assumption} onChange=${setP('assumption')} /></div>
      <div class="stack-s"><span class="eyebrow">Income sources</span>${K.IncomeList && html`<${K.IncomeList} />`}</div>`;
  }
  K.IncomeList = function IncomeList() {
    const { data, openSheet, fmt } = useApp();
    return html`<div class="card tight list">${data.income.map((s) => html`<${Row} key=${s.id} icon="income" tone="g" title=${s.name} sub=${s.freq + ' · next ' + K.fmtDate(K.nextDate(s.next, s.freq, K.today()))} right=${fmt.native(s.amt, s.cur || data.base)} chevron=${true} onClick=${() => openSheet({ k: 'addIncomeSource', item: s })} />`)}<button class="lrow" style=${{ color: 'var(--acc)', fontWeight: 600 }} onClick=${() => openSheet({ k: 'addIncomeSource' })}><span class="ic p"><${Icon} n="plus" s=${17} w=${2.2} /></span>Add income source</button></div>`;
  };

  function DataSec() {
    const { data, commit, toast, resetAll } = useApp();
    const fileRef = useRef(null);
    const stamp = K.iso(K.today());
    const restore = async (file) => { try { const d = JSON.parse(await file.text()); if (!d || d.v !== 1 || !Array.isArray(d.txns)) throw new Error('format'); commit(Object.assign(K.factory(), d)); toast('Backup restored'); } catch (e) { toast('That file isn’t a Kipu backup'); } };
    return html`<${SubHead} title="Data, backup & reset" sub="Everything is stored in this browser on this device." />
      <${Facts} rows=${[['Transactions', String(data.txns.length)], ['Accounts, cards and loans', String(data.accounts.length + data.cards.length + data.loans.length)], ['Bills and goals', String(data.bills.length + data.goals.length)], ['Imports', String(data.imports.length)]]} />
      <div class="stack-s"><span class="eyebrow">Export</span><div class="grid g2" style=${{ gap: '8px' }}><button class="btn sec" onClick=${() => K.download('kipu-backup-' + stamp + '.json', JSON.stringify(data, null, 1), 'application/json')}><${Icon} n="download" s=${16} />Backup (JSON)</button><button class="btn sec" disabled=${!data.txns.length} onClick=${() => K.download('kipu-transactions-' + stamp + '.csv', K.toCSV(data), 'text/csv')}><${Icon} n="download" s=${16} />Transactions (CSV)</button></div><span class="tiny muted">Keep a backup before clearing your browser or changing phones.</span></div>
      <div class="stack-s"><span class="eyebrow">Restore</span><button class="btn sec" onClick=${() => fileRef.current && fileRef.current.click()}><${Icon} n="upload" s=${16} />Restore a backup</button><input ref=${fileRef} id="restore-file" type="file" accept="application/json,.json" style=${{ display: 'none' }} onChange=${(e) => e.target.files[0] && restore(e.target.files[0])} /></div>
      <div class="stack-s"><span class="eyebrow">Start over</span><${DangerButton} label="Erase everything and reset" onConfirm=${resetAll} /><span class="tiny muted">Returns Kipu to factory state and shows the welcome again. Export a backup first if you might need it.</span></div>`;
  }
})();
