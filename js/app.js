/* Kipu · app shell: phone layout with a tab bar, dashboard with a sidebar on tablet and desktop */
(function () {
  const K = window.K;
  const { useState, useMemo, useEffect, useRef, useCallback } = React;
  const { html, Ctx, Icon } = K;

  const SKEY = 'kipu-settings-v1';
  const loadSettings = () => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { return {}; } };
  const DEFAULT_SETTINGS = { theme: 'Kipu', mode: 'System', hide: false, reduce: false, ai: { insights: true } };
  const TITLES = { account: 'Account', card: 'Credit card', loan: 'Loan', txn: 'Transaction', goal: 'Goal', trip: 'Trip', settings: 'Settings' };
  const SCREENS = () => ({ home: K.Home, money: K.Money, plan: K.Plan, stats: K.Stats, settings: K.Settings, account: K.AccountDetail, card: K.CardDetail, loan: K.LoanDetail, txn: K.TxnDetail, goal: K.GoalDetail, trip: K.TripDetail });
  const WIDE_AT = 768;

  function useSystemDark() {
    const q = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const [dark, setDark] = useState(!!(q && q.matches));
    useEffect(() => { if (!q) return; const on = () => setDark(q.matches); q.addEventListener ? q.addEventListener('change', on) : q.addListener(on); return () => (q.removeEventListener ? q.removeEventListener('change', on) : q.removeListener(on)); }, []);
    return dark;
  }

  function App() {
    const [data, setData] = useState(() => K.load());
    const [ctx, setCtxRaw] = useState({ scope: 'personal', currency: 'Combined', period: 11 });
    const [settings, setSettingsRaw] = useState(() => { const s = Object.assign({}, DEFAULT_SETTINGS, loadSettings()); s.theme = K.themeName(s.theme); if (!['Light', 'Dark', 'System'].includes(s.mode)) s.mode = 'Dark'; return s; });
    const [stack, setStack] = useState([{ r: 'home' }]);
    const [sheet, setSheet] = useState(null);
    const [toastMsg, setToast] = useState(null);
    const [vw, setVw] = useState(window.innerWidth);
    const sysDark = useSystemDark();
    const wideRef = useRef(false);

    useEffect(() => { const on = () => setVw(window.innerWidth); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
    const commit = useCallback((next) => { setData(next); if (!K.save(next)) setToast('Storage is full. Export a backup in Settings.'); }, []);
    const setCtx = useCallback((o) => setCtxRaw((c) => Object.assign({}, c, o)), []);
    const setSettings = useCallback((o) => setSettingsRaw((s) => { const n = Object.assign({}, s, o); try { localStorage.setItem(SKEY, JSON.stringify(n)); } catch (e) {} return n; }), []);
    const effectiveDark = settings.mode === 'Dark' || (settings.mode !== 'Light' && sysDark);
    useEffect(() => { const v = K.themeVars(settings.theme, effectiveDark); const st = document.documentElement.style; Object.keys(v).forEach((k) => st.setProperty(k, v[k])); const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', v['--bg']); }, [settings.theme, effectiveDark]);

    // Live exchange rates, at most twice a day
    useEffect(() => {
      if (!data.onboarded) return;
      const age = data.fx.updated ? Date.now() - new Date(data.fx.updated).getTime() : Infinity;
      if (age < 12 * 3600 * 1000 && Object.keys(data.fx.usd).length > 40) return;
      K.refreshFx(data).then((fx) => setData((d) => { const n = Object.assign({}, d, { fx }); K.save(n); return n; })).catch(() => {});
    }, [data.onboarded, data.active.join()]);
    // Month change: record this month’s balances even without new activity
    useEffect(() => { if (data.onboarded && !data.snapshots[K.monthKey(K.today())]) commit(K.snapshot(data)); }, [data.onboarded]);

    const route = stack[stack.length - 1];
    const go = useCallback((r, replace) => {
      setSheet(null);
      const tabs = wideRef.current ? ['home', 'money', 'plan', 'stats', 'settings'] : ['home', 'money', 'plan', 'stats'];
      const isTab = tabs.includes(r.r) && !r.metric && !r.scen && !(r.r === 'settings' && r.s && !wideRef.current);
      setStack((s) => { const next = isTab ? [r] : replace ? s.slice(0, -1).concat([r]) : s.concat([r]); if (!isTab && !replace) try { history.pushState({ depth: next.length }, ''); } catch (e) {} return next; });
    }, []);
    const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
    useEffect(() => { const on = () => { setSheet(null); setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)); }; window.addEventListener('popstate', on); return () => window.removeEventListener('popstate', on); }, []);
    useEffect(() => { window.scrollTo(0, 0); }, [stack.length, route.r, route.id, route.tab]);

    K.syncCats(data);
    const D = useMemo(() => K.derive(data, ctx), [data, ctx]);
    const fmt = useMemo(() => K.makeFmt(settings, data), [settings.hide, data.base]);
    const insights = useMemo(() => (settings.ai.insights && data.onboarded ? K.insights(data, D) : []), [data, D, settings.ai.insights]);
    const toast = useCallback((m) => { setToast(m); clearTimeout(window.__kt); window.__kt = setTimeout(() => setToast(null), 2800); }, []);
    const resetAll = useCallback(() => { K.wipe(); setData(K.factory()); setCtxRaw({ scope: 'personal', currency: 'Combined', period: 11 }); setStack([{ r: 'home' }]); setSheet(null); }, []);

    const wide = vw >= WIDE_AT;
    wideRef.current = wide;
    const value = { data, commit, ctx, setCtx, D, fmt, go, back, route, stack, openSheet: setSheet, closeSheet: () => setSheet(null), toast, settings: Object.assign({}, settings, { effectiveDark }), setSettings, wide, insights, resetAll };
    const cls = 'app' + (wide ? ' wide' : '') + (settings.reduce ? ' reduce' : '');

    if (!data.onboarded) return html`<${Ctx.Provider} value=${value}><div class=${cls}><${K.Onboarding} /></div></${Ctx.Provider}>`;

    const Screen = SCREENS()[route.r] || K.Home;
    const content = html`<${Screen} key=${JSON.stringify(route)} route=${route} />`;
    const sheetEl = sheet && (() => { const close = () => setSheet(null); if (sheet.k === 'budgetEdit') return html`<${K.BudgetEditSheet} cat=${sheet.cat} onClose=${close} />`; const C = K.SHEETS[sheet.k]; return C ? html`<${C} onClose=${close} show=${sheet.show || ['scope', 'currency']} preset=${sheet.preset || sheet} item=${sheet.item} id=${sheet.id} />` : null; })();
    const toastEl = toastMsg && html`<div class="toast" role="status"><${Icon} n="check" s=${15} w=${2.6} />${toastMsg}</div>`;
    const rootOf = stack[0].r;

    if (wide) {
      const nav = [['home', 'home', 'Home'], ['money', 'wallet', 'Money'], ['plan', 'plan', 'Plan'], ['stats', 'chart', 'Stats'], ['settings', 'gear', 'Settings']];
      const SECTION = { home: 'Home', money: 'Money', plan: 'Plan', stats: 'Stats', settings: 'Settings' };
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const alerts = insights.filter((i) => i.kind === 'Priority').length;
      // Desktop shows every section; tablet keeps the icon rail
      const full = vw >= 1100;
      const subLabel = (() => { const g = [['money', [['accounts', 'Accounts'], ['cards', 'Cards'], ['loans', 'Loans'], ['activity', 'Activity']]], ['plan', [['budget', 'Budget'], ['bills', 'Bills & recurring'], ['goals', 'Goals'], ['trips', 'Trips']]], ['stats', [['insights', 'Insights'], ['reviews', 'Reviews'], ['forecast', 'Forecast']]]].find((x) => x[0] === rootOf); const t = g && g[1].find((x) => x[0] === (stack[0].tab || 'overview')); return t ? t[1] : null; })();
      const rootTab = stack[0].tab || 'overview';
      const SIDE = [['home', 'home', 'Home'], ['money', 'wallet', 'Money', [['overview', 'Overview'], ['accounts', 'Accounts'], ['cards', 'Cards'], ['loans', 'Loans'], ['activity', 'Activity']]], ['plan', 'plan', 'Plan', [['overview', 'Overview'], ['budget', 'Budget'], ['bills', 'Bills & recurring'], ['goals', 'Goals'], ['trips', 'Trips']]], ['stats', 'chart', 'Stats', [['overview', 'Statistics'], ['insights', 'Insights', insights.length || null], ['reviews', 'Reviews'], ['forecast', 'Forecast']]]];
      return html`<${Ctx.Provider} value=${value}><div class=${cls}><div class=${'d-shell' + (full ? ' full' : '')}>
        ${full ? html`<aside class="side" aria-label="Primary">
          <button class="side-brand" onClick=${() => go({ r: 'home' })}><span class="mark"></span><span class="disp" style=${{ fontSize: '20px', fontWeight: 800 }}>Kipu</span></button>
          <nav class="side-nav">${SIDE.map(([r, ic, l, subs]) => { const on = rootOf === r; return html`<div key=${r} class="side-group">
            <button class=${'side-item' + (on && (!subs || rootTab === subs[0][0]) ? ' on' : on ? ' open' : '')} aria-current=${on ? 'page' : null} onClick=${() => go({ r })}><${Icon} n=${ic} s=${19} />${l}</button>
            ${subs && html`<div class="side-subs">${subs.slice(1).map(([t, tl, badge]) => html`<button key=${t} class=${'side-sub' + (on && rootTab === t ? ' on' : '')} onClick=${() => go({ r, tab: t })}><span>${tl}</span>${badge ? html`<i class="side-badge">${badge}</i>` : null}</button>`)}</div>`}</div>`; })}</nav>
          <div class="side-foot"><button class=${'side-item' + (rootOf === 'settings' ? ' on' : '')} onClick=${() => go({ r: 'settings' })}><${Icon} n="gear" s=${19} />Settings</button>
            <button class="side-me" onClick=${() => go({ r: 'settings', s: 'profile' })}><${K.Face} s=${36} /><span class="stack-s" style=${{ gap: 0, textAlign: 'left', minWidth: 0 }}><span style=${{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${data.profile.name || 'You'}</span><span class="tiny muted">${ctx.scope === 'household' ? 'Household view' : 'Personal view'}</span></span></button></div>
        </aside>` : html`<aside class="rail" aria-label="Primary">
          <button class="rail-mark" aria-label="Kipu home" onClick=${() => go({ r: 'home' })}><span></span></button>
          <button class="rail-add" aria-label="Add" title="Add" onClick=${() => setSheet({ k: 'quickAdd' })}><${Icon} n="plus" s=${22} w=${2.4} /></button>
          <nav class="rail-nav">${nav.slice(0, 4).map(([r, ic, l]) => html`<button key=${r} class=${'rail-btn' + (rootOf === r ? ' on' : '')} aria-label=${l} aria-current=${rootOf === r ? 'page' : null} onClick=${() => go({ r })}><${Icon} n=${ic} s=${20} /><span class="rail-tip">${l}</span></button>`)}</nav>
          <div class="rail-foot"><button class=${'rail-btn' + (rootOf === 'settings' ? ' on' : '')} aria-label="Settings" onClick=${() => go({ r: 'settings' })}><${Icon} n="gear" s=${20} /><span class="rail-tip">Settings</span></button><button class="rail-face" aria-label="Profile" onClick=${() => go({ r: 'settings', s: 'profile' })}><${K.Face} s=${40} /><span class="rail-tip">${data.profile.name || 'Profile'}</span></button></div>
        </aside>`}
        <main class="d-main">
          <div class="d-bar">
            ${stack.length > 1 ? html`<button class="circle-btn" aria-label="Back" onClick=${back}><${Icon} n="back" s=${18} w=${2.2} /></button>` : null}
            <span class="crumb"><span class="muted">Kipu</span><${Icon} n="next" s=${13} c="var(--muted)" /><span class=${stack.length > 1 || subLabel ? 'muted' : ''}>${SECTION[rootOf] || 'Home'}</span>${subLabel && html`<${Icon} n="next" s=${13} c="var(--muted)" /><span class=${stack.length > 1 ? 'muted' : ''}>${subLabel}</span>`}${stack.length > 1 && html`<${Icon} n="next" s=${13} c="var(--muted)" /><span>${TITLES[route.r] || ''}</span>`}</span>
            <span class="grow"></span>
            ${rootOf === 'home' && stack.length === 1 && html`<${K.ContextFilter} show=${['scope', 'currency']} />`}
            <span class="pill-soft"><${Icon} n="calendar" s=${16} c="var(--muted)" />${today}</span>
            <button class="circle-btn" aria-label=${alerts ? alerts + ' things need attention' : 'Insights'} onClick=${() => go({ r: 'stats', tab: 'insights' })} style=${{ position: 'relative' }}><${Icon} n="bell" s=${18} />${alerts > 0 && html`<i class="bell-dot"></i>`}</button>
            <button class="btn pri sm pill" onClick=${() => setSheet({ k: 'quickAdd' })}><${Icon} n="plus" s=${16} w=${2.4} />Add</button>
          </div>
          <div class="d-content">${content}</div></main></div>${sheetEl}${toastEl}</div></${Ctx.Provider}>`;
    }
    const showTop = stack.length > 1;
    return html`<${Ctx.Provider} value=${value}><div class=${cls}>
      <div class="m-page">
        ${showTop ? html`<div class="m-top"><button class="ic n" style=${{ background: 'transparent' }} aria-label="Back" onClick=${() => { try { history.back(); } catch (e) { back(); } }}><${Icon} n="back" s=${22} w=${2} /></button><span class="t">${TITLES[route.r] && route.r !== 'settings' ? TITLES[route.r] : ''}</span></div>` : html`<div style=${{ height: '6px' }}></div>`}
        ${content}
      </div>
      <nav class="bnav" aria-label="Primary">
        ${[['home', 'home', 'Home'], ['money', 'wallet', 'Money'], null, ['plan', 'plan', 'Plan'], ['stats', 'chart', 'Stats']].map((it) => it ? html`<button key=${it[0]} class=${rootOf === it[0] ? 'on' : ''} aria-current=${rootOf === it[0] ? 'page' : null} onClick=${() => go({ r: it[0] })}><${Icon} n=${it[1]} s=${21} w=${rootOf === it[0] ? 2.1 : 1.8} />${it[2]}<span class="dot"></span></button>` : html`<div key="add"><button class="add" aria-label="Add" onClick=${() => setSheet({ k: 'quickAdd' })}><${Icon} n="plus" s=${26} w=${2.4} /></button></div>`)}
      </nav>${sheetEl}${toastEl}</div></${Ctx.Provider}>`;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
})();
