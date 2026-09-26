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
    const dataRef = useRef(data);
    const vaultRef = useRef(null);
    const cloudUserRef = useRef(undefined);
    const spaceChoiceRef = useRef(false);
    // Spaces already unlocked in this session (personal and each Household), so switching back needs no passphrase
    const openVaultsRef = useRef({});
    const makeVault = (household) => { const v = household ? new K.CloudVault(K.cloudClient, (status, error) => { if (vaultRef.current === v) setCloud((c) => Object.assign({}, c, { sync: status, error: error || '' })); }, 'household_vaults', 'household_id') : new K.CloudVault(K.cloudClient, (status, error) => { if (vaultRef.current === v) setCloud((c) => Object.assign({}, c, { sync: status, error: error || '' })); }); return v; };
    // Personal and Household open together: the Household file sits next to yours, and saves go to each by item
    const hhVaultRef = useRef(null);
    const hhDataRef = useRef(null);
    const closeCombined = () => { if (hhVaultRef.current) hhVaultRef.current.clear(); hhVaultRef.current = null; hhDataRef.current = null; };
    const forgetVaults = () => { Object.values(openVaultsRef.current).forEach((v) => v !== vaultRef.current && v.clear()); openVaultsRef.current = {}; closeCombined(); };
    const [cloud, setCloud] = useState({ status: 'checking', user: null, error: '', target: 'personal', households: [] });
    const cloudRef = useRef(cloud); cloudRef.current = cloud;
    // When another device saved first, the vault merges both and hands the result back here
    K.onVaultMerged = (vault, merged) => {
      const c = cloudRef.current;
      if (c.combined && vault === hhVaultRef.current) { hhDataRef.current = merged; const next = K.combineSpaces(K.splitSpaces(dataRef.current, merged)[0], merged, c.household); dataRef.current = next; setData(next); return; }
      if (vault !== vaultRef.current) return;
      const next = c.combined && hhDataRef.current ? K.combineSpaces(merged, hhDataRef.current, c.household) : c.target === 'household' && c.household ? K.jointData(merged, c.household.name) : merged;
      dataRef.current = next; setData(next);
    };
    if (!vaultRef.current && K.cloudClient) vaultRef.current = new K.CloudVault(K.cloudClient, (status, error) => setCloud((c) => Object.assign({}, c, { sync: status, error: error || '' })));
    useEffect(() => {
      if (!K.cloudClient) { setCloud({ status: 'guest', user: null, error: 'Cloud sign-in is unavailable.' }); return; }
      const { data: listener } = K.cloudClient.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED') return;
        const user = session && session.user;
        if (event === 'PASSWORD_RECOVERY' && user) { setCloud((c) => Object.assign({}, c, { status: 'reset-password', user, error: '' })); return; }
        const id = user ? user.id : null;
        if (cloudUserRef.current === id) return;
        cloudUserRef.current = id;
        spaceChoiceRef.current = false;
        forgetVaults();
        if (vaultRef.current) vaultRef.current.clear();
        vaultRef.current = new K.CloudVault(K.cloudClient, (status, error) => setCloud((c) => Object.assign({}, c, { sync: status, error: error || '' })));
        const next = user ? K.factory() : K.load(); dataRef.current = next; setData(next);
        setCloud({ status: user ? 'locked' : 'guest', user: user || null, error: '', target: 'personal', household: null, households: [] });
        if (user) K.cloudHouseholds().then((households) => {
          if (cloudUserRef.current !== id) return;
          let preferred = null;
          try { preferred = localStorage.getItem('kipu-cloud-space:' + id); } catch (e) {}
          // Personal opens first (the Household joins it once unlocked); a Household alone only if you chose that before
          const household = households.find((h) => h.id === preferred) || null;
          if (household && !spaceChoiceRef.current) {
            if (vaultRef.current) vaultRef.current.clear();
            vaultRef.current = new K.CloudVault(K.cloudClient, (status, error) => setCloud((c) => Object.assign({}, c, { sync: status, error: error || '' })), 'household_vaults', 'household_id');
            setCtxRaw({ scope: 'household', currency: 'Combined', period: 11 });
            setCloud((c) => Object.assign({}, c, { households, target: 'household', household }));
          } else setCloud((c) => Object.assign({}, c, { households }));
        }).catch((error) => { if (cloudUserRef.current === id) setCloud((c) => Object.assign({}, c, { error: error.message })); });
      });
      return () => listener.subscription.unsubscribe();
    }, []);
    const [ctx, setCtxRaw] = useState({ scope: 'personal', currency: 'Combined', period: 11, country: 'All' });
    const [settings, setSettingsRaw] = useState(() => { const s = Object.assign({}, DEFAULT_SETTINGS, loadSettings()); s.theme = K.themeName(s.theme); if (!['Light', 'Graphite', 'Dark', 'Midnight', 'System'].includes(s.mode)) s.mode = 'Dark'; return s; });
    const [stack, setStack] = useState([{ r: 'home' }]);
    const [sheet, setSheet] = useState(null);
    const [fly, setFly] = useState(null);
    // App lock: locked on open, and again after the chosen time away
    const [locked, setLocked] = useState(() => K.lockCfg().enabled);
    useEffect(() => { let hiddenAt = 0; const on = () => { const c = K.lockCfg(); if (!c.enabled) return; if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt >= (c.auto || 0) * 1000) { setSheet(null); setLocked(true); } }; document.addEventListener('visibilitychange', on); return () => document.removeEventListener('visibilitychange', on); }, []);
    useEffect(() => { if (!fly) return; const off = () => setFly(null); const esc = (e) => e.key === 'Escape' && setFly(null); document.addEventListener('click', off); document.addEventListener('keydown', esc); return () => { document.removeEventListener('click', off); document.removeEventListener('keydown', esc); }; }, [fly]);
    const [toastMsg, setToast] = useState(null);
    const [vw, setVw] = useState(window.innerWidth);
    const sysDark = useSystemDark();
    const wideRef = useRef(false);

    useEffect(() => { const on = () => setVw(window.innerWidth); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
    const commit = useCallback((next) => {
      const cc = cloudRef.current;
      if (cc.combined && hhVaultRef.current && vaultRef.current && vaultRef.current.key) {
        const [mine, ours] = K.splitSpaces(next, hhDataRef.current);
        dataRef.current = next; setData(next);
        vaultRef.current.enqueue(mine);
        if (JSON.stringify(ours) !== JSON.stringify(hhDataRef.current)) { hhDataRef.current = ours; hhVaultRef.current.enqueue(ours); }
        return;
      }
      if (cloud.target === 'household') next = K.jointData(next, cloud.household.name);
      dataRef.current = next;
      setData(next);
      if (vaultRef.current && vaultRef.current.key && vaultRef.current.revision) vaultRef.current.enqueue(next);
      else if (!K.save(next)) setToast('Storage is full. Export a backup in Settings.');
    }, [cloud.target, cloud.household]);
    const commitRef = useRef(commit); commitRef.current = commit;
    const cloudOpen = useCallback(async (passphrase, seed) => {
      if (!cloud.user) throw new Error('Sign in first');
      setCloud((c) => Object.assign({}, c, { status: 'opening', error: '' }));
      try {
        const remote = await vaultRef.current.open(cloud.target === 'household' ? cloud.household.id : cloud.user.id, passphrase);
        if (remote) { const next = cloud.target === 'household' ? K.jointData(remote, cloud.household.name) : remote; dataRef.current = next; setData(next); setCloud((c) => Object.assign({}, c, { status: 'ready', sync: vaultRef.current.error ? 'error' : 'synced', error: vaultRef.current.error ? vaultRef.current.error.message : '' })); return 'opened'; }
        if (cloud.target === 'household') throw new Error('This Household is still being set up. Ask its creator to finish setup.');
        if (!seed) { setCloud((c) => Object.assign({}, c, { status: 'choose' })); return 'choose'; }
        const initial = seed === 'local' ? K.load() : K.factory();
        if (initial.demo) throw new Error('Sample data stays in demo mode. Start your account with zero data.');
        await vaultRef.current.create(initial);
        if (seed === 'local') K.wipe();
        dataRef.current = initial; setData(initial);
        setCloud((c) => Object.assign({}, c, { status: 'ready', sync: 'synced' }));
        return 'created';
      } catch (e) { vaultRef.current.clear(); setCloud((c) => Object.assign({}, c, { status: 'locked', error: e.message })); throw e; }
    }, [cloud.user, cloud.target, cloud.household]);
    const cloudCreate = useCallback(async (seed) => {
      try { const initial = seed === 'local' ? K.load() : K.factory(); if (initial.demo) throw new Error('Sample data stays in demo mode. Start your account with zero data.'); await vaultRef.current.create(initial); if (seed === 'local') K.wipe(); dataRef.current = initial; setData(initial); setCloud((c) => Object.assign({}, c, { status: 'ready', sync: 'synced', error: '' })); }
      catch (e) { setCloud((c) => Object.assign({}, c, { error: e.message })); throw e; }
    }, []);
    // Switch spaces. A space opened earlier in this session opens straight away; otherwise it asks for its passphrase.
    const switchSpace = (household) => {
      if (cloudRef.current.combined) { if (hhVaultRef.current && (hhVaultRef.current.latest || hhVaultRef.current.busy)) throw new Error('Wait for sync before switching spaces.'); closeCombined(); setCloud((x) => Object.assign({}, x, { combined: false })); cloudRef.current = Object.assign({}, cloudRef.current, { combined: false }); }
      const cur = vaultRef.current;
      if (cur && (cur.latest || cur.busy)) throw new Error('Wait for sync before switching spaces.');
      const from = cloudRef.current.target === 'household' && cloudRef.current.household ? cloudRef.current.household.id : 'personal';
      if (cur && cur.key && cur.revision) openVaultsRef.current[from] = cur; else if (cur) cur.clear();
      const to = household ? household.id : 'personal';
      const kept = openVaultsRef.current[to];
      spaceChoiceRef.current = true;
      try { localStorage.setItem('kipu-cloud-space:' + cloudUserRef.current, to); } catch (e) {}
      setCtxRaw(household ? { scope: 'household', currency: 'Combined', period: 11 } : { scope: 'personal', currency: 'Combined', period: 11, country: 'All' }); setStack([{ r: 'home' }]); setSheet(null);
      if (kept && kept.key && kept.base) {
        vaultRef.current = kept;
        const next = household ? K.jointData(kept.base, household.name) : kept.base; dataRef.current = next; setData(next);
        setCloud((c) => Object.assign({}, c, { status: 'ready', target: household ? 'household' : 'personal', household: household || null, error: '', sync: 'synced' }));
        kept.refresh().then((fresh) => { if (fresh && vaultRef.current === kept) { const n = household ? K.jointData(fresh, household.name) : fresh; dataRef.current = n; setData(n); } }).catch(() => {});
        return;
      }
      vaultRef.current = makeVault(household);
      const next = K.factory(); dataRef.current = next; setData(next);
      setCloud((c) => Object.assign({}, c, { status: 'locked', target: household ? 'household' : 'personal', household: household || null, error: '', sync: null }));
    };
    const cloudSelectHousehold = useCallback((household) => switchSpace(household), []);
    const cloudSelectPersonal = useCallback(() => switchSpace(null), []);
    // Open a Household next to your personal space. With `remember`, its passphrase is kept inside your own
    // encrypted file, so next time unlocking your personal space opens both.
    const cloudOpenHousehold = useCallback(async (household, passphrase, remember) => {
      const c = cloudRef.current;
      if (!c.user || c.target !== 'personal' || c.status !== 'ready') throw new Error('Unlock your personal space first.');
      const v = new K.CloudVault(K.cloudClient, (status, error) => { if (hhVaultRef.current === v) setCloud((x) => Object.assign({}, x, { sync: status, error: error || '' })); }, 'household_vaults', 'household_id');
      const remote = await v.open(household.id, passphrase);
      if (!remote) { v.clear(); throw new Error('This Household is still being set up. Ask its creator to finish setup.'); }
      closeCombined();
      hhVaultRef.current = v; hhDataRef.current = remote;
      let next = K.combineSpaces(dataRef.current, remote, household);
      if (remember) next = Object.assign({}, next, { hhKeys: Object.assign({}, next.hhKeys, { [household.id]: passphrase }) });
      cloudRef.current = Object.assign({}, c, { combined: true, household });
      setCloud((x) => Object.assign({}, x, { combined: true, household, error: '' }));
      setCtxRaw((x) => Object.assign({}, x, { scope: 'personal' }));
      commitRef.current(next);
    }, []);
    const cloudCloseHousehold = useCallback(() => {
      const c = cloudRef.current;
      if (!c.combined) return;
      if (hhVaultRef.current && (hhVaultRef.current.latest || hhVaultRef.current.busy)) throw new Error('Wait for sync first.');
      const mine = K.splitSpaces(dataRef.current, hhDataRef.current)[0];
      const next = Object.assign({}, mine, { household: Object.assign({}, mine.household, { enabled: false, mode: 'solo' }), hhKeys: undefined });
      closeCombined();
      cloudRef.current = Object.assign({}, c, { combined: false, household: null });
      setCloud((x) => Object.assign({}, x, { combined: false, household: null }));
      setCtxRaw((x) => Object.assign({}, x, { scope: 'personal' }));
      commitRef.current(next);
    }, []);
    // A Household you asked Kipu to remember opens with your personal space
    useEffect(() => {
      if (cloud.status !== 'ready' || cloud.target !== 'personal' || cloud.combined || !cloud.user) return;
      const keys = data.hhKeys || {};
      const h = (cloud.households || []).find((x) => keys[x.id]);
      if (h) cloudOpenHousehold(h, keys[h.id], true).catch((e) => setCloud((x) => Object.assign({}, x, { error: 'Couldn’t open ' + h.name + ': ' + e.message })));
    }, [cloud.status, cloud.target, cloud.combined, (cloud.households || []).length]);
    const cloudStartHousehold = useCallback(() => {
      cloudSelectPersonal();
      setCloud((c) => Object.assign({}, c, { status: 'household-create' }));
    }, [cloudSelectPersonal]);
    const cloudCreateHousehold = useCallback(async (name, inviteEmail, passphrase, currency) => {
      if (!cloud.user) throw new Error('Sign in first.');
      if (passphrase.length < 12) throw new Error('Use at least 12 characters for the Household passphrase.');
      if (vaultRef.current && (vaultRef.current.latest || vaultRef.current.busy)) throw new Error('Wait for sync before creating a Household.');
      const email = inviteEmail.trim().toLowerCase();
      if (!email || email === (cloud.user.email || '').toLowerCase()) throw new Error('Enter your partner’s email address.');
      const { data: household, error } = await K.cloudClient.from('households').insert({ name: name.trim() || 'Our Household', owner_id: cloud.user.id, invite_email: email }).select('id,name,owner_id,invite_email').single();
      if (error) throw error;
      let created = false;
      try {
        const vault = new K.CloudVault(K.cloudClient, (status, issue) => setCloud((c) => Object.assign({}, c, { sync: status, error: issue || '' })), 'household_vaults', 'household_id');
        await vault.open(household.id, passphrase);
        const initial = K.jointData(Object.assign(K.factory(), { onboarded: true, base: currency, active: [currency] }), household.name);
        await vault.create(initial); created = true;
        // From your personal space: the new Household opens next to it, and what you had marked shared moves in
        const c = cloudRef.current;
        if (c.target === 'personal' && vaultRef.current && vaultRef.current.key && vaultRef.current.revision) {
          closeCombined(); hhVaultRef.current = vault; hhDataRef.current = initial;
          const next = Object.assign({}, K.combineSpaces(dataRef.current, initial, household), { hhKeys: Object.assign({}, dataRef.current.hhKeys, { [household.id]: passphrase }) });
          cloudRef.current = Object.assign({}, c, { combined: true, household, households: (c.households || []).concat([household]) });
          setCloud((x) => Object.assign({}, x, { status: 'ready', combined: true, household, households: (x.households || []).concat([household]), error: '' }));
          setStack([{ r: 'home' }]); setSheet(null);
          commitRef.current(next);
          return;
        }
        if (vaultRef.current) vaultRef.current.clear();
        vaultRef.current = vault; dataRef.current = initial; setData(initial);
        spaceChoiceRef.current = true;
        try { localStorage.setItem('kipu-cloud-space:' + cloud.user.id, household.id); } catch (e) {}
        setCtxRaw({ scope: 'household', currency: 'Combined', period: 11 }); setStack([{ r: 'home' }]); setSheet(null);
        setCloud((c) => Object.assign({}, c, { status: 'ready', target: 'household', household, households: (c.households || []).concat([household]), sync: 'synced', error: '' }));
      } catch (e) {
        if (!created) await K.cloudClient.from('households').delete().eq('id', household.id);
        throw e;
      }
    }, [cloud.user]);
    const cloudSignOut = useCallback(async () => { if ((vaultRef.current && (vaultRef.current.latest || vaultRef.current.busy)) || (hhVaultRef.current && (hhVaultRef.current.latest || hhVaultRef.current.busy))) throw new Error('Wait for sync or export a backup before signing out.'); const { error } = await K.cloudClient.auth.signOut(); if (error) throw error; }, []);
    useEffect(() => {
      if (cloud.status !== 'ready') return;
      const check = async () => {
        if (document.hidden) return;
        try {
          const fresh = await vaultRef.current.refresh();
          const freshH = cloud.combined && hhVaultRef.current ? await hhVaultRef.current.refresh() : null;
          if (freshH) hhDataRef.current = freshH;
          if (!fresh && !freshH) return;
          const mine = fresh || (cloud.combined ? K.splitSpaces(dataRef.current, hhDataRef.current)[0] : dataRef.current);
          const next = cloud.combined && hhDataRef.current ? K.combineSpaces(mine, hhDataRef.current, cloud.household) : cloud.target === 'household' ? K.jointData(mine, cloud.household.name) : mine;
          dataRef.current = next; setData(next); setCloud((c) => Object.assign({}, c, { sync: 'synced' }));
        } catch (e) { setCloud((c) => Object.assign({}, c, { sync: 'error', error: e.message })); }
      };
      const timer = setInterval(check, 30000);
      window.addEventListener('focus', check);
      return () => { clearInterval(timer); window.removeEventListener('focus', check); };
    }, [cloud.status, cloud.target, cloud.household, cloud.combined]);
    const setCtx = useCallback((o) => setCtxRaw((c) => Object.assign({}, c, o)), []);
    const setSettings = useCallback((o) => setSettingsRaw((s) => { const n = Object.assign({}, s, o); try { localStorage.setItem(SKEY, JSON.stringify(n)); } catch (e) {} return n; }), []);
    const effectiveMode = settings.mode === 'System' ? (sysDark ? 'Dark' : 'Light') : K.modeName(settings.mode);
    const effectiveDark = effectiveMode !== 'Light';
    K.setCustom(settings.custom);
    const customKey = JSON.stringify(settings.custom || null);
    useEffect(() => { const v = K.themeVars(settings.theme, effectiveMode); const st = document.documentElement.style; Object.keys(v).forEach((k) => st.setProperty(k, v[k])); const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', v['--bg']); }, [settings.theme, effectiveMode, customKey]);

    // Live exchange rates, at most twice a day
    useEffect(() => {
      if (!data.onboarded || !['guest', 'ready'].includes(cloud.status)) return;
      const age = data.fx.updated ? Date.now() - new Date(data.fx.updated).getTime() : Infinity;
      if (age < 12 * 3600 * 1000 && Object.keys(data.fx.usd).length > 40) return;
      K.refreshFx(data).then((fx) => commit(K.fillPendingRates(Object.assign({}, dataRef.current, { fx })))).catch(() => {});
    }, [data.onboarded, data.active.join(), cloud.status]);
    // Month change: record this month’s balances even without new activity
    useEffect(() => { if (['guest', 'ready'].includes(cloud.status) && data.onboarded && !data.snapshots[K.monthKey(K.today())]) commit(K.snapshot(dataRef.current)); }, [data.onboarded, cloud.status]);

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
    K.scopeNow = ctx.scope;
    // Global (everything in the main currency) or one country in its own currency. `data` stays the full record for edits.
    const view = useMemo(() => (ctx.country && ctx.country !== 'All' && K.countries(data).includes(ctx.country) ? K.countryView(data, ctx.country) : data), [data, ctx.country]);
    const D = useMemo(() => Object.assign(K.derive(view, ctx), { view: view.view || null, countries: K.countries(data) }), [view, ctx, data]);
    const fmt = useMemo(() => K.makeFmt(settings, view), [settings.hide, view.base]);
    const insights = useMemo(() => (settings.ai.insights && data.onboarded ? K.insights(data, D) : []), [data, D, settings.ai.insights]);
    const displayName = cloud.target === 'household' && cloud.user ? (cloud.user.user_metadata && (cloud.user.user_metadata.full_name || cloud.user.user_metadata.name)) || (cloud.user.email || '').split('@')[0] : data.profile.name;
    // Payment reminders when Kipu opens, comes back to the front, and every hour while open
    useEffect(() => {
      if (!settings.remind || !data.onboarded) return;
      const run = () => { if (!document.hidden) K.remindNow(D, fmt); };
      run();
      const timer = setInterval(run, 3600 * 1000);
      document.addEventListener('visibilitychange', run);
      return () => { clearInterval(timer); document.removeEventListener('visibilitychange', run); };
    }, [settings.remind, data.onboarded, D]);
    const toast = useCallback((m) => { setToast(m); clearTimeout(window.__kt); window.__kt = setTimeout(() => setToast(null), 2800); }, []);
    // Anything that would need a missing exchange rate stops and says so instead of guessing
    useEffect(() => { const on = (e) => { const msg = String((e.reason || e.error || {}).message || e.message || ''); const i = msg.indexOf('NO_RATE:'); if (i < 0) return; e.preventDefault && e.preventDefault(); toast('Kipu needs the exchange rate for ' + msg.slice(i + 8).trim() + ' first. Tap Update rates.'); }; window.addEventListener('error', on); window.addEventListener('unhandledrejection', on); return () => { window.removeEventListener('error', on); window.removeEventListener('unhandledrejection', on); }; }, []);
    const updateRates = useCallback(async () => { try { const fx = await K.refreshFx(dataRef.current); commit(K.fillPendingRates(Object.assign({}, dataRef.current, { fx }))); toast('Exchange rates updated'); return true; } catch (e) { toast('Couldn’t reach the rate service. Check your connection.'); return false; } }, []);
    const resetAll = useCallback(() => {
      // With the Household open, only your personal things are erased; the Household is left as it is
      if (cloudRef.current.combined && hhDataRef.current) { commit(K.combineSpaces(Object.assign(K.factory(), { onboarded: true, base: dataRef.current.base, active: [dataRef.current.base], hhKeys: dataRef.current.hhKeys }), hhDataRef.current, cloudRef.current.household)); setStack([{ r: 'home' }]); setSheet(null); return; }
      if (vaultRef.current && vaultRef.current.key) {
        const empty = cloud.target === 'household'
          ? K.jointData(Object.assign(K.factory(), { onboarded: true, base: dataRef.current.base, active: [dataRef.current.base] }), cloud.household.name)
          : K.factory();
        commit(empty);
      } else {
        K.wipe(); const next = K.factory(); dataRef.current = next; setData(next);
      }
      setCtxRaw({ scope: cloud.target === 'household' ? 'household' : 'personal', currency: 'Combined', period: 11 });
      setStack([{ r: 'home' }]); setSheet(null);
    }, [cloud.target, cloud.household, commit]);

    const wide = vw >= WIDE_AT;
    wideRef.current = wide;
    const value = { data, view, updateRates, displayName, commit, cloud, cloudOpen, cloudOpenHousehold, cloudCloseHousehold, cloudCreate, cloudCreateHousehold, cloudSelectHousehold, cloudSelectPersonal, cloudStartHousehold, cloudSignOut, cloudPasswordResetDone: () => setCloud((c) => Object.assign({}, c, { status: 'locked' })), cloudLogin: () => setCloud((c) => Object.assign({}, c, { status: 'login' })), cloudCancel: () => setCloud((c) => Object.assign({}, c, { status: 'guest' })), cloudRetry: () => vaultRef.current && vaultRef.current.retry(), ctx, setCtx, D, fmt, go, back, route, stack, openSheet: setSheet, closeSheet: () => setSheet(null), toast, settings: Object.assign({}, settings, { effectiveDark, effectiveMode }), setSettings, lockNow: () => { setSheet(null); setFly(null); setLocked(true); }, wide, insights, resetAll };
    const cls = 'app' + (wide ? ' wide' : '') + (settings.reduce ? ' reduce' : '');

    if (!['guest', 'ready'].includes(cloud.status)) return html`<${Ctx.Provider} value=${value}><div class=${cls}><${K.CloudAccess} /></div></${Ctx.Provider}>`;
    if (!data.onboarded) return html`<${Ctx.Provider} value=${value}><div class=${cls}><${K.Onboarding} /></div></${Ctx.Provider}>`;
    if (locked && K.lockCfg().enabled) return html`<${Ctx.Provider} value=${value}><div class=${cls}><${K.LockScreen} onUnlock=${() => setLocked(false)} wide=${wide} vw=${vw} /></div></${Ctx.Provider}>`;

    const Screen = SCREENS()[route.r] || K.Home;
    const content = html`<${Screen} key=${JSON.stringify(route)} route=${route} />`;
    const sheetEl = sheet && (() => { const close = () => setSheet(null); if (sheet.k === 'budgetEdit') return html`<${K.BudgetEditSheet} cat=${sheet.cat} onClose=${close} />`; const C = K.SHEETS[sheet.k]; return C ? html`<${C} onClose=${close} show=${sheet.show || ['scope', 'currency']} preset=${sheet.preset || sheet} item=${sheet.item} id=${sheet.id} where=${sheet.where} />` : null; })();
    const toastEl = toastMsg && html`<div class="toast" role="status"><${Icon} n="check" s=${15} w=${2.6} />${toastMsg}</div>`;
    const rootOf = stack[0].r;

    // Same menu as the rail's sections: what you can add, one tap each
    const ADD = [['expense', 'expense', 'r', 'Add expense'], ['income', 'income', 'g', 'Add income'], ['receipt', 'scan', 'p', 'Scan receipt'], ['statement', 'upload', 'b', 'Upload statement'], ['transfer', 'transfer', 'n', 'Transfer']];
    const addMenu = (cls) => html`<div class=${cls} role="menu" aria-label="Add" onClick=${(e) => e.stopPropagation()}><span class="fly-title">Add</span>${ADD.map(([k, ic, tone, l]) => html`<button key=${k} role="menuitem" class="fly-item" onClick=${() => { setFly(null); setSheet({ k }); }}><span class="row" style=${{ gap: '10px' }}><span class=${'ic ' + tone} style=${{ width: '30px', height: '30px', borderRadius: '10px' }}><${Icon} n=${ic} s=${15} /></span>${l}</span></button>`)}<span class="tiny muted" style=${{ padding: '6px 12px 4px', lineHeight: 1.4 }}>Accounts, cards and loans are in Money. Bills, goals and trips in Plan.</span></div>`;
    if (wide) {
      const nav = [['home', 'home', 'Home'], ['money', 'wallet', 'Money'], ['plan', 'plan', 'Plan'], ['stats', 'chart', 'Stats'], ['settings', 'gear', 'Settings']];
      const SECTION = { home: 'Home', money: 'Money', plan: 'Plan', stats: 'Stats', settings: 'Settings' };
      const today = new Date().toLocaleDateString(K.loc(), { weekday: 'long', month: 'long', day: 'numeric' });
      const alerts = insights.filter((i) => i.kind === 'Priority').length;
      const subLabel = (() => { const g = [['money', [['accounts', 'Accounts'], ['cards', 'Cards'], ['loans', 'Loans'], ['activity', 'Activity']]], ['plan', [['budget', 'Budget'], ['bills', 'Bills & recurring'], ['goals', 'Goals'], ['trips', 'Trips']]], ['stats', [['insights', 'Insights'], ['reviews', 'Reviews'], ['forecast', 'Forecast']]]].find((x) => x[0] === rootOf); const t = g && g[1].find((x) => x[0] === (stack[0].tab || 'overview')); return t ? t[1] : null; })();
      const rootTab = stack[0].tab || 'overview';
      const SIDE = [['home', 'home', 'Home'], ['money', 'wallet', 'Money', [['overview', 'Overview'], ['accounts', 'Accounts'], ['cards', 'Cards'], ['loans', 'Loans'], ['activity', 'Activity']]], ['plan', 'plan', 'Plan', [['overview', 'Overview'], ['budget', 'Budget'], ['bills', 'Bills & recurring'], ['goals', 'Goals'], ['trips', 'Trips']]], ['stats', 'chart', 'Stats', [['overview', 'Statistics'], ['insights', 'Insights', insights.length || null], ['reviews', 'Reviews'], ['forecast', 'Forecast']]]];
      return html`<${Ctx.Provider} value=${value}><div class=${cls}><div class="d-shell">
        <aside class="rail" aria-label="Primary">
          <button class="rail-mark" aria-label="Kipu home" onClick=${() => go({ r: 'home' })}><span></span></button>
          <div class="rail-wrap"><button class=${'rail-add' + (fly === 'add' ? ' flying' : '')} aria-label="Add" aria-haspopup="menu" aria-expanded=${fly === 'add'} onClick=${(e) => { e.stopPropagation(); setFly(fly === 'add' ? null : 'add'); }}><${Icon} n="plus" s=${22} w=${2.4} /></button>${fly === 'add' && addMenu('fly')}</div>
          <nav class="rail-nav">${SIDE.map(([r, ic, l, subs]) => html`<div key=${r} class="rail-wrap">
            <button class=${'rail-btn' + (rootOf === r ? ' on' : '') + (fly === r ? ' flying' : '')} aria-label=${l} aria-current=${rootOf === r ? 'page' : null} aria-expanded=${subs ? fly === r : null} aria-haspopup=${subs ? 'menu' : null} onClick=${(e) => { e.stopPropagation(); if (subs) setFly(fly === r ? null : r); else { setFly(null); go({ r }); } }}><${Icon} n=${ic} s=${20} />${fly !== r && html`<span class="rail-tip">${l}</span>`}</button>
            ${subs && fly === r && html`<div class="fly" role="menu" aria-label=${l} onClick=${(e) => e.stopPropagation()}><span class="fly-title">${l}</span>${subs.map(([t, tl, badge]) => html`<button key=${t} role="menuitem" class=${'fly-item' + (rootOf === r && rootTab === t ? ' on' : '')} onClick=${() => { setFly(null); go(t === 'overview' ? { r } : { r, tab: t }); }}><span>${tl}</span>${badge ? html`<i class="side-badge">${badge}</i>` : null}</button>`)}</div>`}</div>`)}</nav>
          <div class="rail-foot"><button class=${'rail-btn' + (rootOf === 'settings' ? ' on' : '')} aria-label="Settings" onClick=${() => go({ r: 'settings' })}><${Icon} n="gear" s=${20} /><span class="rail-tip">Settings</span></button><button class="rail-face" aria-label="Profile" onClick=${() => go({ r: 'settings', s: 'profile' })}><${K.Face} s=${40} /><span class="rail-tip">${displayName || 'Profile'}</span></button></div>
        </aside>
        <main class="d-main">
          <div class="d-bar">
            ${stack.length > 1 ? html`<button class="circle-btn" aria-label="Back" onClick=${back}><${Icon} n="back" s=${18} w=${2.2} /></button>` : null}
            <span class="crumb"><span class="muted">Kipu</span><${Icon} n="next" s=${13} c="var(--muted)" /><span class=${stack.length > 1 || subLabel ? 'muted' : ''}>${SECTION[rootOf] || 'Home'}</span>${subLabel && html`<${Icon} n="next" s=${13} c="var(--muted)" /><span class=${stack.length > 1 ? 'muted' : ''}>${subLabel}</span>`}${stack.length > 1 && html`<${Icon} n="next" s=${13} c="var(--muted)" /><span>${TITLES[route.r] || ''}</span>`}</span>
            <span class="grow"></span>
            ${stack.length === 1 && ['home', 'money', 'plan', 'stats'].includes(rootOf) && html`<${K.SpaceSwitch} />`}
            ${rootOf === 'home' && stack.length === 1 && html`<${K.ContextFilter} show=${['scope', 'currency']} />`}
            <span class="pill-soft"><${Icon} n="calendar" s=${16} c="var(--muted)" />${today}</span>
            ${K.lockCfg().enabled && html`<button class="circle-btn" aria-label="Lock Kipu" title="Lock" onClick=${() => { setFly(null); setLocked(true); }}><${Icon} n="lock" s=${17} /></button>`}
            <button class="circle-btn" aria-label=${alerts ? alerts + ' things need attention' : 'Insights'} onClick=${() => go({ r: 'stats', tab: 'insights' })} style=${{ position: 'relative' }}><${Icon} n="bell" s=${18} />${alerts > 0 && html`<i class="bell-dot"></i>`}</button>
            <div class="rail-wrap"><button class="btn pri sm pill" aria-haspopup="menu" aria-expanded=${fly === 'addTop'} onClick=${(e) => { e.stopPropagation(); setFly(fly === 'addTop' ? null : 'addTop'); }}><${Icon} n="plus" s=${16} w=${2.4} />Add</button>${fly === 'addTop' && addMenu('fly fly-down')}</div>
          </div>
          <div class="d-content">${content}</div></main></div>${sheetEl}${toastEl}</div></${Ctx.Provider}>`;
    }
    const showTop = stack.length > 1;
    return html`<${Ctx.Provider} value=${value}><div class=${cls}>
      <div class="m-page">
        ${showTop ? html`<div class="m-top"><button class="ic n" style=${{ background: 'transparent' }} aria-label="Back" onClick=${() => { try { history.back(); } catch (e) { back(); } }}><${Icon} n="back" s=${22} w=${2} /></button><span class="t">${TITLES[route.r] && route.r !== 'settings' ? TITLES[route.r] : ''}</span></div>` : html`<div style=${{ height: '6px' }}></div>`}
        ${!showTop && ['home', 'money', 'plan', 'stats'].includes(route.r) && html`<div class="space-bar"><${K.SpaceSwitch} /></div>`}
        ${content}
      </div>
      <nav class="bnav" aria-label="Primary">
        ${[['home', 'home', 'Home'], ['money', 'wallet', 'Money'], null, ['plan', 'plan', 'Plan'], ['stats', 'chart', 'Stats']].map((it) => it ? html`<button key=${it[0]} class=${rootOf === it[0] ? 'on' : ''} aria-current=${rootOf === it[0] ? 'page' : null} onClick=${() => go({ r: it[0] })}><${Icon} n=${it[1]} s=${20} w=${rootOf === it[0] ? 2.2 : 1.9} /><span>${it[2]}</span></button>` : html`<div key="add" class="rail-wrap"><button class=${'add' + (fly === 'addBottom' ? ' flying' : '')} aria-label="Add" aria-haspopup="menu" aria-expanded=${fly === 'addBottom'} onClick=${(e) => { e.stopPropagation(); setFly(fly === 'addBottom' ? null : 'addBottom'); }}><${Icon} n=${fly === 'addBottom' ? 'x' : 'plus'} s=${24} w=${2.4} /></button>${fly === 'addBottom' && addMenu('fly fly-up')}</div>`)}
      </nav>${sheetEl}${toastEl}</div></${Ctx.Provider}>`;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
})();
