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
    const [more, setMore] = useState(false);
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
        <${K.CurrencySelect} label="Main currency" value=${base} onChange=${setBase} />
        <span class="eyebrow">Other currencies you use</span><div class="chips">${[...new Set(['USD', 'EUR', 'CAD', 'PEN', 'MXN', 'GBP'].concat(extra))].filter((c) => c !== base).map((c) => html`<button key=${c} class=${'chip' + (extra.includes(c) ? ' on' : '')} onClick=${() => setExtra(extra.includes(c) ? extra.filter((x) => x !== c) : extra.concat([c]))}><${K.Flag} cur=${c} s=${18} />${c}</button>`)}<button class="chip" aria-expanded=${more} onClick=${() => setMore(!more)}><${Icon} n=${more ? 'x' : 'search'} s=${14} />${more ? 'Close' : 'Any other'}</button></div>
        ${more && html`<${K.CurrencyList} exclude=${[base].concat(extra)} autoFocus=${true} onPick=${(c) => { setExtra(extra.concat([c])); setMore(false); }} />`}
        <button class="btn pri block" onClick=${() => finish(false)}>Start with a clean slate</button><button class="link" onClick=${() => setStep(1)}>Back</button></div>`}
    </div></div>`;
  };

  // ---------------------------------------------------------------- Settings
  const SECTIONS = [
    ['Money', [['household', 'people', 'p', 'Household'], ['currencies', 'globe', 'g', 'Currencies & exchange rates'], ['categories', 'tag', 'a', 'Categories & rules'], ['finance', 'sliders', 'b', 'Financial preferences']]],
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
    const val = { household: data.household.enabled ? data.household.name || 'On' : 'Off', currencies: data.base + ' · ' + data.active.length + ' active', appearance: K.themeName(settings.theme), ai: settings.ai.insights ? 'On' : 'Off', privacy: settings.hide ? 'Amounts hidden' : 'Amounts shown', categories: (data.customCats || []).length ? (data.customCats || []).length + ' yours · ' + data.rules.length + ' rules' : data.rules.length + ' rules', finance: data.prefs.utilRef + '% reference' };
    return html`<div class="stack">
      <header class="between" style=${{ paddingTop: wide ? 0 : '8px', alignItems: 'flex-start' }}><div class="stack-s" style=${{ gap: '6px' }}><span class="eyebrow">Preferences</span><h1 style=${{ fontSize: '30px', fontWeight: 800 }}>Settings</h1><p class="muted">Make Kipu work the way you do.</p></div><${K.Avatar} s=${46} /></header>
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
    const current = K.themeName(settings.theme);
    const [pick, setPick] = useState(current);
    const T = K.THEMES[pick];
    const pw = wide ? 210 : 128;
    return html`<${SubHead} title="Appearance & theme" sub="Brightness and color theme are set separately. Every theme has a light and a dark palette." />
      <div class="stack-s"><span class="eyebrow">Appearance</span>
        <div class="grid" style=${{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '8px' }}>${['System'].concat(Object.keys(K.MODES)).map((m) => { const on = (settings.mode || 'System') === m; const pal = K.palette(current, m !== 'Light'); const bg = m === 'System' ? 'linear-gradient(135deg, #FFFFFF 50%, #09090B 50%)' : K.MODES[m].base.bg; return html`<button key=${m} aria-pressed=${on} onClick=${() => setSettings({ mode: m })} class="stack-s" style=${{ gap: '8px', padding: '10px', borderRadius: '18px', background: 'var(--surface)', border: '1.5px solid ' + (on ? 'var(--acc)' : 'var(--line)'), alignItems: 'flex-start', textAlign: 'left' }}><span style=${{ width: '100%', height: '40px', borderRadius: '11px', background: bg, border: '1px solid rgba(128,128,128,0.25)', display: 'flex', alignItems: 'flex-end', padding: '6px', gap: '4px' }}><span style=${{ width: '26px', height: '8px', borderRadius: '4px', background: K.gradCss(pal.grad) }}></span><span style=${{ width: '12px', height: '8px', borderRadius: '4px', background: m === 'Light' ? '#E9E9EE' : 'rgba(255,255,255,0.18)' }}></span></span><span style=${{ fontSize: '13px', fontWeight: on ? 700 : 600 }}>${m}</span><span class="tiny muted" style=${{ lineHeight: '14px' }}>${m === 'System' ? 'Light or Dark, like your device' : K.MODES[m].desc}</span></button>`; })}</div></div>
      <div class="stack-s"><span class="eyebrow">Theme</span><div class="grid" style=${{ gridTemplateColumns: 'repeat(auto-fill, minmax(' + (wide ? 180 : 140) + 'px, 1fr))', gap: '10px' }}>${Object.keys(K.THEMES).map((n) => { const L = K.THEMES[n].light, Dk = K.THEMES[n].dark, on = n === pick; return html`<button key=${n} aria-pressed=${on} onClick=${() => setPick(n)} class="card" style=${{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', borderColor: on ? 'var(--acc)' : null, boxShadow: on ? '0 0 0 1px var(--acc)' : null }}>
        <span style=${{ height: '58px', borderRadius: '12px', display: 'flex', overflow: 'hidden', border: '1px solid var(--line)' }}><span style=${{ flex: 1, background: L.bg, padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px' }}><span style=${{ height: '16px', borderRadius: '5px', background: K.gradCss(L.grad) }}></span><span style=${{ height: '6px', width: '60%', borderRadius: '3px', background: L.solid }}></span></span><span style=${{ flex: 1, background: Dk.bg, padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px' }}><span style=${{ height: '16px', borderRadius: '5px', background: K.gradCss(Dk.grad) }}></span><span style=${{ height: '6px', width: '60%', borderRadius: '3px', background: Dk.acc }}></span></span></span>
        <span class="between"><span style=${{ fontWeight: 700 }}>${n}</span>${n === current && html`<span class="pill acc" style=${{ height: '20px', fontSize: '10px' }}>Current</span>`}</span>
        <span class="row" style=${{ gap: '4px' }}>${L.chart.map((c, i) => html`<i key=${i} style=${{ width: '14px', height: '14px', borderRadius: '999px', background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}></i>`)}</span></button>`; })}</div></div>
      <div class="card flat stack" style=${{ gap: '14px' }}><div class="stack-s" style=${{ gap: '2px' }}><span style=${{ fontWeight: 700 }}>${pick}</span><span class="tiny muted">${T.desc}</span></div>
        <div class="row" style=${{ justifyContent: 'center', gap: wide ? '20px' : '10px', padding: wide ? '18px' : '12px 6px', borderRadius: '18px', background: 'var(--surface)' }}><div class="stack-s" style=${{ alignItems: 'center', gap: '6px' }}><${ThemePreview} name=${pick} dark=${false} w=${pw} /><span class="tiny muted">Light</span></div><div class="stack-s" style=${{ alignItems: 'center', gap: '6px' }}><${ThemePreview} name=${pick} mode=${settings.effectiveMode === 'Light' ? 'Dark' : settings.effectiveMode} w=${pw} /><span class="tiny muted">${settings.effectiveMode === 'Light' ? 'Dark' : settings.effectiveMode}</span></div></div>
        <button class="btn block" disabled=${pick === current} onClick=${() => { setSettings({ theme: pick }); toast(pick + ' applied'); }} style=${{ background: K.gradCss(T.light.grad), color: '#FFFFFF' }}>${pick === current ? '✓ Current theme' : 'Apply ' + pick}</button></div>
      <div class="card tight"><${ToggleRow} title="Reduce motion" on=${settings.reduce} onChange=${(v) => setSettings({ reduce: v })} /></div>`;
  }

  // Photos are cropped to a square and shrunk so they fit comfortably in on-device storage
  const shrinkPhoto = (file) => new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { const S = 256, c = document.createElement('canvas'); c.width = S; c.height = S; const m = Math.min(img.width, img.height); c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.85)); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('image')); };
    img.src = url;
  });
  function Profile() {
    const { data, commit, toast } = useApp();
    const fileRef = useRef(null);
    const setP = (o) => commit(Object.assign({}, data, { profile: Object.assign({}, data.profile, o) }));
    const upd = (k) => (e) => setP({ [k]: e.target.value });
    const choose = async (file) => { if (!file) return; try { setP({ photo: await shrinkPhoto(file) }); toast('Photo updated'); } catch (e) { toast('That image couldn’t be read'); } };
    return html`<${SubHead} title="Profile" sub="Used for the greeting and your avatar." />
      <div class="card row" style=${{ gap: '16px' }}><${K.Face} s=${72} /><div class="stack-s" style=${{ gap: '8px' }}><button class="btn sec sm" onClick=${() => fileRef.current && fileRef.current.click()}><${Icon} n="upload" s=${15} />${data.profile.photo ? 'Change photo' : 'Add a photo'}</button>${data.profile.photo && html`<button class="link" style=${{ color: 'var(--muted)' }} onClick=${() => { setP({ photo: '' }); toast('Photo removed'); }}>Remove photo</button>`}<span class="tiny muted">Stays on this device.</span></div><input ref=${fileRef} type="file" accept="image/*" style=${{ display: 'none' }} onChange=${(e) => { choose(e.target.files[0]); e.target.value = ''; }} /></div>
      <${Field} label="Name"><input id="p-name" class="input" value=${data.profile.name} onInput=${upd('name')} /></${Field}><${Field} label="Email" hint="Optional. Kept on this device."><input id="p-email" class="input" type="email" value=${data.profile.email} onInput=${upd('email')} /></${Field}>`;
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
    const { data, commit, toast, fmt } = useApp();
    const [busy, setBusy] = useState(false);
    const [adding, setAdding] = useState(false);
    const [changing, setChanging] = useState(false);
    const [nextBase, setNextBase] = useState(null);
    const [ordering, setOrdering] = useState(false);
    const favs = data.favCur || [];
    const refresh = async (d, quiet) => { setBusy(true); try { const n = Object.assign({}, d || data, { fx: await K.refreshFx(d || data) }); commit(n); if (!quiet) toast('Exchange rates updated'); } catch (e) { if (d) commit(d); toast('Couldn’t reach the rate service. Check your connection.'); } setBusy(false); };
    const add = (c) => { const d = K.useCurrency(data, c); setAdding(false); if (!K.hasRate(data, c)) refresh(d, true); else commit(d); toast(c + ' added'); };
    const remove = (c) => { commit(Object.assign({}, data, { active: data.active.filter((x) => x !== c), favCur: favs.filter((x) => x !== c) })); toast(c + ' removed · past transactions keep it'); };
    const move = (c, dir) => { const a = data.active.slice(), i = a.indexOf(c), j = i + dir; if (j < 1 || j >= a.length) return; a[i] = a[j]; a[j] = c; commit(Object.assign({}, data, { active: a })); };
    const fav = (c) => commit(Object.assign({}, data, { favCur: favs.includes(c) ? favs.filter((x) => x !== c) : favs.concat([c]) }));
    const age = data.fx.updated ? (Date.now() - new Date(data.fx.updated).getTime()) / 3600000 : null;
    const status = age == null ? ['Built-in reference rates', 'warn'] : age < 24 ? ['Live · updated ' + (age < 1 ? 'less than an hour ago' : Math.round(age) + ' h ago'), 'pos'] : ['Last updated ' + Math.round(age / 24) + ' days ago', 'warn'];
    const others = data.active.filter((c) => c !== data.base);
    return html`<${SubHead} title="Currencies & exchange rates" sub="Use any currency. Every transaction keeps its original amount and the rate used that day." />
      <div class="stack-s"><span class="eyebrow">Main currency</span>
        <div class="card row" style=${{ gap: '14px' }}><${K.Flag} cur=${data.base} s=${44} /><span class="grow stack-s" style=${{ gap: '2px' }}><span style=${{ fontWeight: 700, fontSize: '17px' }}>${data.base} · ${K.curName(data.base)}</span><span class="small muted">Totals, Safe to Spend and net worth</span></span><button class="btn sec sm" onClick=${() => { setChanging(!changing); setNextBase(null); }}>${changing ? 'Cancel' : 'Change'}</button></div>
        ${changing && !nextBase && html`<${K.CurrencyList} selected=${data.base} autoFocus=${true} onPick=${(c) => (c === data.base ? setChanging(false) : setNextBase(c))} />`}
        ${changing && nextBase && html`<div class="card stack-s" style=${{ borderColor: 'var(--warn2)' }}><span style=${{ fontWeight: 600 }}>Change main currency to ${nextBase}?</span><span class="small muted" style=${{ lineHeight: 1.5 }}>Card, loan, goal and budget amounts Kipu keeps in ${data.base} are converted once at today’s rate (1 ${data.base} = ${K.rate(data, data.base, nextBase).toFixed(4)} ${nextBase}). Each transaction keeps its original amount and currency.</span>${!K.hasRate(data, nextBase) && html`<span class="small" style=${{ color: 'var(--warn)' }}>No rate for ${nextBase} yet. Update rates first.</span>`}<div class="grid g2" style=${{ gap: '8px' }}><button class="btn sec sm" onClick=${() => setNextBase(null)}>Pick another</button><button class="btn pri sm" disabled=${!K.hasRate(data, nextBase)} onClick=${() => { commit(K.changeBase(data, nextBase)); setChanging(false); setNextBase(null); toast('Main currency is now ' + nextBase); }}>Change to ${nextBase}</button></div></div>`}</div>
      <div class="stack-s"><div class="between"><span class="eyebrow">Currencies you use</span>${others.length > 1 ? html`<button class="link" onClick=${() => setOrdering(!ordering)}>${ordering ? 'Done' : 'Reorder'}</button>` : html`<span class="tiny muted">${data.active.length} active</span>`}</div>
        <div class="card tight list">${data.active.map((c, i) => html`<div key=${c} class="lrow" style=${{ gap: '10px' }}><${K.Flag} cur=${c} s=${34} /><span class="grow stack-s" style=${{ gap: '1px', minWidth: 0 }}><span class="t1 row" style=${{ gap: '6px' }}><b>${c}</b>${favs.includes(c) && html`<${Icon} n="star" s=${12} c="var(--acc)" w=${2.4} />`}</span><span class="t2 num" style=${{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${K.curName(c)}${c === data.base ? '' : K.hasRate(data, c) ? ' · 1 = ' + fmt(K.rate(data, c, data.base), { dec: K.rate(data, c, data.base) < 0.1 ? 4 : 2, show: true }) : ' · rate after next update'}</span></span>
          ${c === data.base ? html`<span class="pill acc">Main</span>` : ordering ? html`<button class="ic n" aria-label=${'Move ' + c + ' up'} disabled=${i <= 1} onClick=${() => move(c, -1)} style=${{ opacity: i <= 1 ? 0.3 : 1 }}><${Icon} n="up" s=${15} w=${2.2} /></button><button class="ic n" aria-label=${'Move ' + c + ' down'} disabled=${i === data.active.length - 1} onClick=${() => move(c, 1)} style=${{ opacity: i === data.active.length - 1 ? 0.3 : 1 }}><${Icon} n="dn" s=${15} w=${2.2} /></button>` : html`<button class="ic n" aria-label=${(favs.includes(c) ? 'Unfavorite ' : 'Favorite ') + c} aria-pressed=${favs.includes(c)} onClick=${() => fav(c)} style=${{ color: favs.includes(c) ? 'var(--acc)' : null, background: favs.includes(c) ? 'var(--accbg)' : null }}><${Icon} n="star" s=${15} /></button><button class="ic n" aria-label=${'Remove ' + c} onClick=${() => remove(c)}><${Icon} n="x" s=${14} w=${2.2} /></button>`}</div>`)}
          <button class="lrow" style=${{ color: 'var(--acc)', fontWeight: 600 }} onClick=${() => setAdding(!adding)}><span class="ic p"><${Icon} n=${adding ? 'x' : 'plus'} s=${17} w=${2.2} /></span>${adding ? 'Close' : 'Add a currency'}</button></div>
        ${adding && html`<${K.CurrencyList} exclude=${data.active} autoFocus=${true} onPick=${add} />`}
        <span class="tiny muted">Starred currencies come first when you add expenses. Removing one hides it from pickers; transactions already recorded in it stay as they are.</span></div>
      <div class="stack-s"><span class="eyebrow">Exchange rates</span><${Facts} rows=${[['Status', status[0], status[1]], ['Source', data.fx.source], ['Last updated', data.fx.updated ? new Date(data.fx.updated).toLocaleString() : 'Never']]} /><button class="btn sec" disabled=${busy} onClick=${() => refresh()}>${busy ? 'Updating…' : 'Update rates now'}</button><span class="tiny muted">Rates update by themselves when you open Kipu. Past transactions keep their stored rate.</span></div>
      <${K.Converter} />`;
  }

  function Categories() {
    const { data, commit, toast } = useApp();
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirmDel, setConfirmDel] = useState(null);
    const custom = data.customCats || [];
    const uses = (id) => data.txns.filter((t) => t.cat === id).length;
    const save = (d, msg) => { K.syncCats(d); commit(d); toast(msg); };
    return html`<${SubHead} title="Categories & rules" sub="Add the categories that fit your life. They work everywhere: expenses, budget, statistics and imports." />
      <div class="stack-s"><span class="eyebrow">Your categories</span>
        <div class="card tight list">${custom.map((c) => editing === c.id ? html`<div key=${c.id} style=${{ padding: '8px' }}><${K.CategoryForm} initial=${c} saveLabel="Save" onCancel=${() => setEditing(null)} onSave=${(v) => { save(K.editCategory(data, c.id, v), 'Category updated'); setEditing(null); }} />
            ${confirmDel === c.id ? html`<div class="card stack-s" style=${{ marginTop: '8px', borderColor: 'var(--crit2)' }}><span style=${{ fontWeight: 600 }}>Delete ${c.name}?</span><span class="small muted">${uses(c.id) ? uses(c.id) + ' transactions move to Other. ' : ''}Rules for it are removed.</span><div class="grid g2" style=${{ gap: '8px' }}><button class="btn sec sm" onClick=${() => setConfirmDel(null)}>Keep it</button><button class="btn dan sm" onClick=${() => { save(K.deleteCategory(data, c.id), c.name + ' deleted'); setConfirmDel(null); setEditing(null); }}>Delete</button></div></div>` : html`<button class="link" style=${{ color: 'var(--crit)', marginTop: '8px' }} onClick=${() => setConfirmDel(c.id)}>Delete category</button>`}</div>`
          : html`<button key=${c.id} class="lrow" onClick=${() => { setEditing(c.id); setConfirmDel(null); setAdding(false); }}><${Tile} icon=${c.icon} tone=${c.tone} /><span class="grow stack-s" style=${{ gap: '2px', textAlign: 'left' }}><span class="t1">${c.name}</span><span class="t2">${uses(c.id)} ${uses(c.id) === 1 ? 'transaction' : 'transactions'}</span></span><${Icon} n="sliders" s=${15} c="var(--muted)" /></button>`)}
          ${!adding && html`<button class="lrow" style=${{ color: 'var(--acc)', fontWeight: 600 }} onClick=${() => { setAdding(true); setEditing(null); }}><span class="ic p"><${Icon} n="plus" s=${17} w=${2.2} /></span>Add a category</button>`}</div>
        ${adding && html`<${K.CategoryForm} onCancel=${() => setAdding(false)} onSave=${(v) => { save(K.addCategory(data, v)[0], v.name + ' added'); setAdding(false); }} />`}
        ${!custom.length && !adding && html`<span class="tiny muted">For example Pets, Gifts, Kids or Church. You can also add one while recording an expense.</span>`}</div>
      <div class="stack-s"><span class="eyebrow">Built in</span><div class="chips">${K.CAT_ORDER.filter((k) => K.isBuiltInCat(k)).map((k) => html`<span key=${k} class="chip" style=${{ cursor: 'default' }}><${Icon} n=${K.CATS[k].icon} s=${13} />${K.CATS[k].name}</span>`)}</div></div>
      <div class="stack-s"><span class="eyebrow">Rules</span>
      ${data.rules.length ? html`<div class="card tight list">${data.rules.filter((r) => K.CATS[r.cat]).map((r) => html`<div key=${r.id} class="lrow"><${Tile} icon=${K.CATS[r.cat].icon} tone=${K.CATS[r.cat].tone} /><span class="grow stack-s" style=${{ gap: '2px' }}><span class="t1">${r.merchant}</span><span class="t2">${K.CATS[r.cat].name}</span></span><button class="link" onClick=${() => { commit(Object.assign({}, data, { rules: data.rules.filter((x) => x.id !== r.id) })); toast('Rule removed'); }}>Remove</button></div>`)}</div>` : html`<div class="card"><${EmptyState} icon="tag" title="No rules yet" text="Open any expense and choose “Always use this category”." /></div>`}
      <span class="tiny muted">When a merchant matches a rule, new expenses get that category. Without a rule, Kipu suggests one from the merchant name and your past choices.</span></div>`;
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
