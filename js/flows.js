/* Kipu · add, edit and import flows. Every save goes through the store, so all screens update. */
(function () {
  const K = window.K;
  const { useState, useEffect, useRef } = React;
  const { html, useApp, Icon, Sheet, Field, Seg, Chips, ToggleRow, Tile, Row, Metric, Bar, EmptyState } = K;

  // Shows 1,500.25 while you type; the stored value stays a plain number
  const grouped = (v) => { if (v == null || v === '') return ''; const [i, d] = String(v).split('.'); return (i ? Number(i).toLocaleString('en-US') : '0') + (d != null ? '.' + d : ''); };
  const Amount = ({ value, onChange, cur, id }) => html`<div class="stack-s" style=${{ alignItems: 'center', gap: '2px' }}><span class="small muted">${K.sym(cur)} · ${cur}</span><input id=${id || 'amount'} class="amount-in num" type="text" inputmode="decimal" pattern="[0-9.,]*" enterkeyhint="done" placeholder="0.00" value=${grouped(value)} onInput=${(e) => { let v = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, ''); const k = v.indexOf('.'); if (k >= 0) v = v.slice(0, k + 1) + v.slice(k + 1).replace(/\./g, '').slice(0, 2); onChange(v); }} aria-label="Amount" autofocus /></div>`;
  const Select = ({ value, onChange, options, id, placeholder }) => html`<select id=${id} class="input" value=${value || ''} onChange=${(e) => onChange(e.target.value)}>${placeholder && html`<option value="">${placeholder}</option>`}${options.map(([v, l]) => html`<option key=${v} value=${v}>${l}</option>`)}</select>`;
  // Money fields show 4,800 while you type and hand back the plain number
  const cleanNum = (raw) => { let v = String(raw).replace(/[^0-9.]/g, ''); const i = v.indexOf('.'); if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '').slice(0, 2); return v; };
  K.cleanNum = cleanNum; K.groupNum = (v) => grouped(cleanNum(v));
  const In = ({ id, label, value, onInput, ph, mode, hint, type }) => {
    const money = mode === 'decimal';
    const shown = value == null ? '' : money ? grouped(cleanNum(value)) : value;
    const input = money ? (e) => onInput({ target: { value: cleanNum(e.target.value) } }) : onInput;
    return html`<${Field} label=${label} hint=${hint}><input id=${id} class=${'input' + (money ? ' num' : '')} type=${type || 'text'} value=${shown} onInput=${input} placeholder=${ph || ''} inputmode=${mode || 'text'} /></${Field}>`;
  };
  const useForm = (init) => { const [s, set] = useState(init); return [s, (k) => (e) => set((p) => Object.assign({}, p, { [k]: e && e.target ? e.target.value : e })), set]; };
  const numv = (v) => { const n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? 0 : n; };
  // Main currency first, then favorites, then the rest in your order
  const curOptions = (data) => { const f = data.favCur || []; const a = data.active.filter((c, i, x) => x.indexOf(c) === i); return [data.base].concat(a.filter((c) => c !== data.base && f.includes(c)), a.filter((c) => c !== data.base && !f.includes(c))); };
  const NoPlace = ({ onClose }) => { const { openSheet } = useApp(); return html`<div class="card flat stack-s"><span class="small">You need an account or card to record this.</span><button class="btn sec sm" onClick=${() => openSheet({ k: 'addAccount' })}>Add an account</button></div>`; };

  // ---------------------------------------------------------------- quick add
  const QuickAdd = ({ onClose }) => {
    const { openSheet } = useApp();
    const items = [['expense', 'expense', 'r', 'Add expense', 'Card, cash or account, in any currency'], ['income', 'income', 'g', 'Add income', 'Salary, freelance or a refund'], ['receipt', 'scan', 'p', 'Scan receipt', 'Take a photo; Kipu reads it and you confirm'], ['statement', 'upload', 'b', 'Upload statement', 'Import a CSV or PDF from your bank or card'], ['transfer', 'transfer', 'n', 'Transfer', 'Between accounts, to a goal, or pay a card']];
    return html`<${Sheet} title="Add" sub="Accounts, cards and loans are added in Money. Bills, goals and trips in Plan." onClose=${onClose}>
      <div class="card tight list">${items.map(([k, ic, tone, t, s]) => html`<button key=${k} class="lrow" onClick=${() => openSheet({ k })}><${Tile} icon=${ic} tone=${tone} /><span class="grow stack-s" style=${{ gap: '2px', textAlign: 'left' }}><span class="t1">${t}</span><span class="t2">${s}</span></span><${Icon} n="next" s=${15} c="var(--muted)" /></button>`)}</div></${Sheet}>`;
  };

  const ContextSheet = ({ show, onClose }) => {
    const { ctx, setCtx, data, D, cloud } = useApp();
    const curs = ['Combined'].concat(curOptions(data));
    return html`<${Sheet} title="View" sub="Country, scope, currency and period apply across Kipu." onClose=${onClose}>
      ${data.household.enabled && cloud.target !== 'household' && show.includes('scope') && html`<div class="stack-s"><span class="eyebrow">Scope</span><${Seg} options=${['personal', 'household']} labels=${['Personal', 'Household']} value=${ctx.scope} onChange=${(v) => setCtx({ scope: v })} /><span class="tiny muted">${ctx.scope === 'household' ? 'Only items marked as shared.' : 'Everything that belongs to you.'}</span></div>`}
      ${D.countries && D.countries.length > 1 && html`<div class="stack-s"><span class="eyebrow">Country</span><${Chips} options=${['All'].concat(D.countries)} value=${ctx.country || 'All'} onChange=${(v) => setCtx({ country: v })} labels=${['All'].concat(D.countries).map((c) => (c === 'All' ? html`<${Icon} n="globe" s=${16} />Global · ${K.sym(data.base)}` : html`<${K.CountryFlag} cc=${c} s=${18} />${K.countryName(c)} · ${K.sym(K.countryCur(data, c))}`))} /><span class="tiny muted">${(ctx.country || 'All') === 'All' ? 'Everything, converted to ' + data.base + ' at today’s rates.' : 'Only ' + K.countryName(ctx.country) + ', in its own currency.'}</span></div>`}
      ${show.includes('currency') && curs.length > 2 && html`<div class="stack-s"><span class="eyebrow">Currency</span><${Chips} options=${curs} value=${ctx.currency} onChange=${(v) => setCtx({ currency: v })} labels=${curs.map((c) => (c === 'Combined' ? html`<${Icon} n="globe" s=${16} />All · ${K.sym(data.base)}` : html`<${K.Flag} cur=${c} s=${18} />${c} only`))} /></div>`}
      ${show.includes('period') && html`<div class="stack-s"><span class="eyebrow">Period</span><${Chips} options=${[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 'ytd']} value=${K.statIdx(D, ctx) == null ? 'ytd' : K.statIdx(D, ctx)} onChange=${(v) => setCtx({ period: v, periodSet: true })} labels=${[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((i) => D.series[i].m + ' ' + String(D.series[i].y).slice(2)).concat(['12 months'])} /></div>`}
      <button class="btn pri block" onClick=${onClose}>Done</button></${Sheet}>`;
  };

  // ---------------------------------------------------------------- expense (new, edit, or from a receipt)
  const ExpenseSheet = ({ onClose, preset, item }) => {
    const { data, commit, ctx, fmt, toast, D } = useApp();
    preset = preset || {};
    const src = item || preset;
    const places = K.whereOptions(data);
    const [amt, setAmt] = useState(src.amt != null ? String(src.amt) : '');
    const [cur, setCur] = useState(src.cur || data.base);
    const [merchant, setMerchant] = useState(src.merchant || '');
    const [cat, setCat] = useState(src.cat || '');
    const [newCat, setNewCat] = useState(false);
    // A new name: for every movement from that shop, only the ones for this amount (Apple, Google…), or just this one
    const [scope, setScope] = useState(item ? K.renameScope(item) : 'all');
    const others = item ? { all: K.sameShopTxns(data, item, 'all').length, amt: K.sameShopTxns(data, item, 'amt').length } : null;
    const [date, setDate] = useState(src.date || K.iso(K.today()));
    const [from, setFrom] = useState(src.from || (places[0] || [])[0] || '');
    const [note, setNote] = useState(src.note || '');
    const [trip, setTrip] = useState(src.trip || (K.activeTrip(data, K.parse(date)) || {}).id || '');
    const [shared, setShared] = useState(src.shared != null ? src.shared : ctx.scope === 'household');
    const guessed = !cat && merchant ? K.guessCat(data, merchant) : null;
    const category = cat || guessed || 'other';
    const v = numv(amt);
    const curs = curOptions(data).concat(src.cur && !data.active.includes(src.cur) ? [src.cur] : []);
    const blocked = v && from ? K.canPost(data, { type: 'expense', amt: v, cur, from }) : null;
    const noRate = !K.hasRateFor(data, cur);
    const save = () => {
      const t = { type: 'expense', merchant: merchant.trim() || 'Expense', cat: category, amt: v, cur, from, date, note, trip: trip || null, autoTrip: false, shared, source: preset.source || (item && item.source) || 'manual' };
      let next = item ? K.editTxn(data, item.id, t) : K.addTxn(data, t);
      if (item && (item.merchant !== t.merchant || item.cat !== t.cat || item.date !== t.date || item.note !== t.note || item.trip !== t.trip)) next = K.editTxn(next, item.id, { merchant: t.merchant, cat: t.cat, date: t.date, note: t.note, trip: t.trip, shared: t.shared });
      // A new name for the shop goes to its other movements and to the next statements
      const renaming = item && item.merchant !== t.merchant && t.merchant !== 'Expense';
      const renamed = renaming ? K.sameShopTxns(data, item, scope).length : 0;
      if (renaming) next = K.renameShop(next, item, t.merchant, scope);
      commit(next);
      const safe = K.derive(next, ctx).plan;
      toast(item ? (renamed ? 'Expense updated · ' + renamed + (renamed === 1 ? ' more renamed' : ' more renamed') : 'Expense updated') : 'Expense added' + (safe.hasIncome ? ' · Safe to Spend ' + fmt(safe.safe) : ''));
      onClose();
    };
    return html`<${Sheet} title=${item ? 'Edit expense' : preset.source === 'receipt' ? 'Check the receipt' : 'Add expense'} sub=${preset.source === 'receipt' ? 'Kipu read these from the photo. Fix anything that looks wrong.' : null} onClose=${onClose}>
      ${preset.image && html`<img src=${preset.image} alt="Receipt" style=${{ maxHeight: '160px', objectFit: 'contain', borderRadius: '14px', background: 'var(--surface2)' }} />`}
      <${Amount} value=${amt} onChange=${setAmt} cur=${cur} />
      ${curs.length > 1 && html`<${Seg} options=${curs} value=${cur} onChange=${setCur} labels=${curs.map((c) => html`<span class="row" style=${{ gap: '6px', justifyContent: 'center' }}><${K.Flag} cur=${c} s=${18} />${c}</span>`)} />`}
      ${cur !== data.base && v > 0 && html`<div class="card flat" style=${{ padding: '12px 14px' }}><div class="between small"><span class="muted">In ${data.base} at today’s rate</span><b class="num">${fmt(K.toBase(data, v, cur), { dec: 2 })}</b></div><span class="tiny muted">The rate is locked when you save.</span></div>`}
      <${In} id="e-merchant" label="Merchant" value=${merchant} onInput=${(e) => setMerchant(e.target.value)} ph="Where did you spend?" />
      ${item && others.all > 0 && merchant.trim() && merchant.trim() !== item.merchant && html`<div class="card flat stack-s" style=${{ gap: '10px', padding: '14px' }}><span class="small" style=${{ fontWeight: 600 }}>Rename which ones?</span>
        <${Seg} options=${others.amt > 0 && others.amt < others.all ? ['all', 'amt', 'one'] : ['all', 'one']} labels=${others.amt > 0 && others.amt < others.all ? ['All (' + (others.all + 1) + ')', 'Same amount (' + (others.amt + 1) + ')', 'Only this'] : ['All (' + (others.all + 1) + ')', 'Only this']} value=${scope === 'amt' && !(others.amt > 0 && others.amt < others.all) ? 'all' : scope} onChange=${setScope} />
        <span class="tiny muted" style=${{ lineHeight: 1.5 }}>${scope === 'one' ? 'Only this movement changes.' : scope === 'amt' && others.amt > 0 && others.amt < others.all ? 'Movements of ' + fmt.native(item.amt, item.cur) + ' from ' + (item.raw || item.merchant) + ' change, and the next ones for that amount. Useful when one line bills several subscriptions.' : 'Every movement from ' + (item.raw || item.merchant) + ' changes, and the next statements use this name.'}</span></div>`}
      <div class="stack-s"><span class="small muted" style=${{ fontWeight: 600 }}>Category${guessed && !cat ? ' · suggested' : ''}</span><div class="chips">${K.CAT_ORDER.map((c) => html`<button key=${c} class=${'chip' + (c === category ? ' on' : '')} onClick=${() => setCat(c)}>${K.CATS[c].custom && html`<${Icon} n=${K.CATS[c].icon} s=${13} />`}${K.CATS[c].name}</button>`)}${!newCat && html`<button type="button" class="chip" style=${{ color: 'var(--acc)', background: 'var(--accbg)' }} onClick=${() => setNewCat(true)}><${Icon} n="plus" s=${13} w=${2.4} />New category</button>`}</div>
        ${newCat && html`<${K.CategoryForm} onCancel=${() => setNewCat(false)} onSave=${(c) => { const [d, id] = K.addCategory(data, c); K.syncCats(d); commit(d); setCat(id); setNewCat(false); toast(c.name + ' added'); }} />`}</div>
      ${places.length ? html`<${Field} label="Paid with"><${Select} id="e-from" value=${from} onChange=${setFrom} options=${places} /></${Field}>` : html`<${NoPlace} />`}
      <${K.DateInput} label="Date" value=${date} onChange=${setDate} /><${In} id="e-note" label="Note" value=${note} onInput=${(e) => setNote(e.target.value)} ph="Optional" />
      ${(D.trips.length > 0 || data.household.enabled) && html`<div class="card tight list">${D.trips.length > 0 && html`<div class="lrow"><${Tile} icon="plane" tone="b" /><span class="grow t1">Trip</span><select id="e-trip" class="input" style=${{ width: '55%' }} value=${trip} onChange=${(e) => setTrip(e.target.value)}><option value="">None</option>${D.trips.map((t) => html`<option key=${t.id} value=${t.id}>${t.name}</option>`)}</select></div>`}${data.household.enabled && html`<${ToggleRow} title="Share with Household" on=${shared} onChange=${setShared} icon="people" tone="p" />`}</div>`}
      ${(blocked || (noRate && v > 0)) && html`<${K.RateNote} cur=${blocked || cur} blocked=${!!blocked} />`}
      <button class="btn pri block" disabled=${!v || !from || !!blocked} onClick=${save}>${item ? 'Save changes' : 'Add ' + (v ? (cur === data.base ? fmt(v, { dec: 2 }) : fmt.native(v, cur, { dec: 2 })) : 'expense')}</button></${Sheet}>`;
  };

  const IncomeSheet = ({ onClose, item }) => {
    const { data, commit, fmt, toast } = useApp();
    const places = K.whereOptions(data, { cashOnly: true, noCards: true });
    const [f, on] = useForm({ amt: item ? String(item.amt) : '', cur: item ? item.cur : data.base, merchant: item ? item.merchant : '', from: item ? item.from : (places[0] || [])[0] || '', date: item ? item.date : K.iso(K.today()) });
    const v = numv(f.amt);
    const save = () => { const t = { type: 'income', cat: 'income', merchant: f.merchant || 'Income', amt: v, cur: f.cur, from: f.from, date: f.date }; const renamed = item && f.merchant && item.merchant !== t.merchant ? K.sameShopTxns(data, item).length : 0; let next = item ? K.editTxn(K.editTxn(data, item.id, t), item.id, { merchant: t.merchant, date: t.date }) : K.addTxn(data, t); if (item && f.merchant && item.merchant !== t.merchant) next = K.renameShop(next, item, t.merchant); commit(next); toast(item ? (renamed ? 'Income updated · ' + renamed + ' more renamed' : 'Income updated') : 'Income added'); onClose(); };
    return html`<${Sheet} title=${item ? 'Edit income' : 'Add income'} sub="For a one-off payment. Regular pay goes in Plan › income sources." onClose=${onClose}>
      <${Amount} value=${f.amt} onChange=${on('amt')} cur=${f.cur} />${curOptions(data).length > 1 && html`<${Seg} options=${curOptions(data)} value=${f.cur} onChange=${on('cur')} labels=${curOptions(data).map((c) => html`<span class="row" style=${{ gap: '6px', justifyContent: 'center' }}><${K.Flag} cur=${c} s=${18} />${c}</span>`)} />`}
      <${In} id="i-src" label="From" value=${f.merchant} onInput=${on('merchant')} ph="Employer, client or refund" />
      ${places.length ? html`<${Field} label="Into"><${Select} id="i-to" value=${f.from} onChange=${on('from')} options=${places} /></${Field}>` : html`<${NoPlace} />`}
      <${K.DateInput} label="Date" value=${f.date} onChange=${on('date')} />
      <button class="btn pri block" disabled=${!v || !f.from} onClick=${save}>${item ? 'Save changes' : 'Add income'}</button></${Sheet}>`;
  };

  const TransferSheet = ({ onClose, preset, item }) => {
    const { data, commit, fmt, toast } = useApp();
    preset = item || preset || {};
    const accts = K.whereOptions(data, { cashOnly: true, noCards: true });
    const goalOpts = data.goals.map((g) => ['goal:' + g.id, 'Goal · ' + g.name]);
    const toOpts = data.cards.map((c) => ['card:' + c.id, 'Pay ' + c.name]).concat(goalOpts, accts);
    const [amt, setAmt] = useState(preset.amt != null ? String(preset.amt) : preset.amount ? String(preset.amount) : '');
    const [cur, setCur] = useState(preset.cur || data.base);
    const [from, setFrom] = useState(preset.from || (accts[0] || [])[0] || '');
    const [to, setTo] = useState(preset.toWhere || (preset.goal ? 'goal:' + preset.goal : preset.to || (toOpts.find((o) => o[0] !== from) || [])[0] || ''));
    const v = numv(amt);
    const kind = to.startsWith('goal:') ? 'saving' : 'transfer';
    const draftT = { type: kind, amt: v, cur, from, to: to.startsWith('goal:') ? null : to };
    const blocked = v && to ? K.canPost(data, draftT) : null;
    // Show exactly what leaves and what arrives when currencies differ, with the rate used
    const moves = v && to && !blocked ? (K.previewPostings(data, draftT) || []).filter((p) => { const it = K.whereItem ? K.whereItem(data, p.where) : null; return it && (p.slot === 2 ? it.cur2 : it.cur || data.base) !== cur; }) : [];
    const save = () => {
      let t = { amt: v, cur, from };
      if (to.startsWith('goal:')) { const g = data.goals.find((x) => 'goal:' + x.id === to); t = Object.assign(t, { type: 'saving', cat: 'saving', goal: g.id, to: g.linked ? 'acct:' + g.linked : null, merchant: g.name, shared: !!g.shared }); }
      else t = Object.assign(t, { type: 'transfer', cat: 'transfer', to, merchant: (to.startsWith('card:') ? 'Payment to ' : 'Transfer to ') + K.whereName(data, to) });
      commit(item ? K.editTxn(data, item.id, t) : K.addTxn(data, t)); toast(item ? 'Transfer updated' : to.startsWith('goal:') ? 'Saved to goal' : 'Transfer recorded · not counted as spending'); onClose();
    };
    if (!accts.length) return html`<${Sheet} title="Transfer" onClose=${onClose}><${NoPlace} /></${Sheet}>`;
    return html`<${Sheet} title="Transfer" sub="Transfers and card payments are never counted as spending." onClose=${onClose}>
      <${Amount} value=${amt} onChange=${setAmt} cur=${cur} />
      ${curOptions(data).length > 1 && html`<${Field} label="Transaction currency"><${Select} value=${cur} onChange=${setCur} options=${curOptions(data).map((c) => [c, c])} /></${Field}>`}
      <${Field} label="From"><${Select} id="t-from" value=${from} onChange=${setFrom} options=${accts} /></${Field}>
      <${Field} label="To"><${Select} id="t-to" value=${to} onChange=${setTo} options=${toOpts.filter((o) => o[0] !== from)} placeholder="Choose where it goes" /></${Field}>
      ${moves.length > 0 && html`<div class="card flat stack-s" style=${{ gap: '6px', padding: '12px 14px' }}><span class="small" style=${{ fontWeight: 600 }}>Currency exchange</span>${moves.map((p, i) => { const it = K.whereItem(data, p.where); const c = p.slot === 2 ? it.cur2 : it.cur || data.base; return html`<div key=${i} class="between small"><span class="muted">${p.amount < 0 ? 'Leaves ' : 'Arrives in '}${it.name}</span><b class="num">${fmt.native(Math.abs(p.amount), c, { dec: 2 })}</b></div>`; })}<span class="tiny muted">${'1 ' + cur + ' = ' + moves.map((p) => { const it = K.whereItem(data, p.where); const c = p.slot === 2 ? it.cur2 : it.cur || data.base; const r = K.rate(data, cur, c); return (r >= 100 ? r.toFixed(2) : r.toFixed(4)) + ' ' + c; }).join(' · ') + ' · today’s rate, locked when you save'}</span></div>`}
      ${blocked && html`<${K.RateNote} cur=${blocked} blocked=${true} />`}
      <button class="btn pri block" disabled=${!v || !to || !!blocked} onClick=${save}>Move ${v ? fmt.native(v, cur, { dec: 2 }) : 'money'}</button></${Sheet}>`;
  };

  const DebtSheet = ({ onClose, item }) => {
    const { data, commit, toast, fmt } = useApp();
    if (!item) return null;
    const places = K.whereOptions(data, { cashOnly: true, noCards: true });
    const [amt, setAmt] = useState(String(item.amt));
    const [cur, setCur] = useState(item.cur || data.base);
    const [from, setFrom] = useState(item.from || '');
    const [principal, setPrincipal] = useState(String(item.principal || 0));
    const baseAmount = K.toBase(data, numv(amt), cur);
    const p = numv(principal);
    const save = () => {
      commit(K.editTxn(data, item.id, { amt: numv(amt), cur, from, principal: p, interest: K.r2(baseAmount - p) }));
      toast('Loan payment updated'); onClose();
    };
    return html`<${Sheet} title="Edit loan payment" sub="Principal and interest are shown in your main currency. Check them against your lender’s statement." onClose=${onClose}>
      <${Amount} value=${amt} onChange=${setAmt} cur=${cur} />
      ${curOptions(data).length > 1 && html`<${Field} label="Payment currency"><${Select} value=${cur} onChange=${setCur} options=${curOptions(data).map((c) => [c, c])} /></${Field}>`}
      <${Field} label="Paid from"><${Select} value=${from} onChange=${setFrom} options=${places} /></${Field}>
      <${In} label=${'Principal (' + data.base + ')'} value=${principal} onInput=${(e) => setPrincipal(e.target.value)} mode="decimal" />
      <div class="card flat small">${fmt(baseAmount, { dec: 2 })} total · ${fmt(K.r2(baseAmount - p), { dec: 2 })} interest</div>
      <button class="btn pri block" disabled=${!numv(amt) || !from || p > baseAmount} onClick=${save}>Save payment</button>
    </${Sheet}>`;
  };

  // ---------------------------------------------------------------- receipt scan (real OCR on the device)
  const ReceiptSheet = ({ onClose }) => {
    const { data, openSheet } = useApp();
    const [state, setState] = useState({ step: 'pick' });
    const run = async (file) => {
      if (!file) return;
      const image = URL.createObjectURL(file);
      setState({ step: 'reading', pct: 0, msg: 'Loading the reader…', image });
      try {
        const text = await K.readReceipt(file, (pct, msg) => setState((s) => Object.assign({}, s, pct != null ? { pct, msg: 'Reading text…' } : { msg: msg === 'loading language traineddata' ? 'Downloading language data (first time only)…' : 'Preparing…' })));
        const r = K.parseReceipt(text, data.base);
        if (!r.total) { setState({ step: 'fail', image, text }); return; }
        openSheet({ k: 'expense', preset: { amt: r.total, cur: data.active.includes(r.cur) ? r.cur : data.base, merchant: r.merchant, date: r.date, source: 'receipt', image } });
      } catch (e) { setState({ step: 'fail', image, err: String(e.message || e) }); }
    };
    return html`<${Sheet} title="Scan receipt" sub="Reading happens on this device. You always confirm before anything is saved." onClose=${onClose}>
      ${state.step === 'pick' && html`<label class="card flat" style=${{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '28px', cursor: 'pointer' }}><${Tile} icon="scan" tone="p" /><span style=${{ fontWeight: 600 }}>Take a photo or choose one</span><span class="tiny muted" style=${{ textAlign: 'center' }}>Flat, well lit, whole receipt in frame</span><input id="r-file" type="file" accept="image/*" capture="environment" style=${{ display: 'none' }} onChange=${(e) => run(e.target.files[0])} /></label>`}
      ${state.step === 'reading' && html`<div class="card flat stack-s" style=${{ alignItems: 'center', padding: '20px' }}>${state.image && html`<img src=${state.image} alt="" style=${{ maxHeight: '140px', borderRadius: '12px' }} />`}<span style=${{ fontWeight: 600 }}>${state.msg}</span><div style=${{ width: '100%' }}><${Bar} pct=${state.pct || 5} /></div><span class="tiny muted">The first scan downloads the text reader, about 10 MB.</span></div>`}
      ${state.step === 'fail' && html`<div class="card flat stack-s">${state.image && html`<img src=${state.image} alt="" style=${{ maxHeight: '140px', borderRadius: '12px', alignSelf: 'center' }} />`}<span style=${{ fontWeight: 600 }}>Couldn’t find a total</span><span class="small muted">${state.err ? 'The reader couldn’t load. Check your connection and try again.' : 'Try a sharper photo, or enter it by hand.'}</span><div class="grid g2" style=${{ gap: '8px' }}><button class="btn sec" onClick=${() => setState({ step: 'pick' })}>Try again</button><button class="btn pri" onClick=${() => openSheet({ k: 'expense', preset: { source: 'receipt', image: state.image } })}>Enter by hand</button></div></div>`}</${Sheet}>`;
  };

  // ---------------------------------------------------------------- statement import (real parsing)
  const StatementSheet = ({ onClose }) => {
    const { data, commit, fmt, toast, openSheet } = useApp();
    const places = K.whereOptions(data);
    const [where, setWhere] = useState((places[0] || [])[0] || '');
    const [st, setSt] = useState({ step: 'pick' });
    const [sign, setSign] = useState('auto');
    const [cur, setCur] = useState(data.base);
    const [paidMode, setPaidMode] = useState('auto');
    const isCard = where.startsWith('card:');
    const run = async (file) => {
      if (!file) return;
      setSt({ step: 'reading', name: file.name });
      try {
        const read = (w) => { const acc = K.whereItem(data, w) || {}; return K.readStatement(file, { dmy: !['CAD', 'USD'].includes(acc.cur || data.base), card: w.startsWith('card:') }); };
        let target = where, rows = await read(where), note = null;
        // A credit card statement picked for a bank account: move it to the card it belongs to
        if (rows.kind && rows.kind.card && !where.startsWith('card:')) {
          const cards = data.cards || [];
          const card = (rows.kind.last4 && cards.find((c) => K.cardNumbers(c).includes(rows.kind.last4))) || (cards.length === 1 ? cards[0] : null);
          if (card) { target = 'card:' + card.id; rows = await read(target); note = { moved: card.name }; }
          else note = { noCard: rows.kind.last4 || true };
        }
        if (target !== where) setWhere(target);
        if (rows.kind && rows.kind.last4 && target.startsWith('card:')) { const c = K.whereItem(data, target); if (c && !K.cardNumbers(c).includes(rows.kind.last4)) note = Object.assign({}, note, { otherNumber: rows.kind.last4, card: c.name }); }
        if (!rows.length) { setSt({ step: 'fail', name: file.name }); return; }
        setSt({ step: 'review', name: file.name, file, kind: rows.kind, note, rows: rows.map((r, i) => Object.assign({ i, keep: true }, r)) });
      } catch (e) { setSt({ step: 'fail', name: file.name, err: String(e.message || e) }); }
    };
    // Which sign is spending: cards list charges as positive; banks as negative
    const autoSign = K.spendSign(st.rows || [], isCard);
    const negIsSpend = sign === 'auto' ? autoSign < 0 : sign === 'neg';
    // A bank file where every amount is positive: the words on each line say whether money went out or came in
    const allPositive = !isCard && (st.rows || []).length > 0 && (st.rows || []).every((r) => r.amt > 0 && !r.dir);
    const classify = (r) => {
      const amt = Math.abs(r.amt);
      // On a card statement, "PAYMENT THANK YOU / PAIEMENT MERCI" is your payment, whatever sign the bank prints
      if (isCard && K.looksLikePayment(r.desc)) return { type: 'transfer', amt, from: null, to: where };
      const spend = sign === 'auto' && r.dir ? r.dir === 'out' : sign === 'auto' && allPositive ? K.moneyDir(r.desc) !== 'in' && !K.isPayroll(r.desc) : negIsSpend ? r.amt < 0 : r.amt > 0;
      // On a bank statement, paying a card moves money between your own accounts: it isn't spending
      const pays = spend && !isCard ? K.cardPaymentFor(data, r.desc) : null;
      if (pays) return { type: 'transfer', amt, from: where, to: pays.card ? 'card:' + pays.card.id : null, cardPay: pays.card ? pays.card.name : true };
      // "E-TRANSFER", "TRANSFER TO SAVINGS": a transfer, in or out as the statement says; not spending or income
      if (K.isTransferText(r.desc)) return spend ? { type: 'transfer', amt, from: where, to: null, xfer: 'out' } : { type: 'transfer', amt, from: null, to: where, xfer: 'in' };
      // On a card, a credit without payment wording is a refund: it lowers what you owe, it isn't a payment
      if (isCard && !spend && !K.looksLikePayment(r.desc)) return { type: 'income', amt, from: where, refund: true };
      // A loan taken by automatic debit (car, financing, mortgage): a loan payment, not spending
      const loan = spend ? K.loanPaymentFor(data, r.desc, amt) : null;
      if (loan) return { type: 'debt', amt, from: where, loan: loan.id, loanName: loan.name };
      if (spend) return { type: 'expense', amt, from: where };
      if (!isCard && K.looksLikePayment(r.desc) && /thank you|merci|gracias/i.test(r.desc)) return { type: 'transfer', amt, from: null, to: where, xfer: 'in' };
      return isCard ? { type: 'transfer', amt, from: null, to: where } : { type: 'income', amt, from: where, payroll: K.isPayroll(r.desc) };
    };
    const dups = K.markDuplicates(data, st.rows || [], where);
    const rows = (st.rows || []).map((r, ri) => { const c = classify(r); const base = K.toBase(data, c.amt, cur); return Object.assign({}, r, c, { dup: !r.force && !!dups[ri], name: K.shopName(data, r.desc, r.amt), cat: (() => { const nm = K.shopName(data, r.desc, r.amt); let g = K.guessCat(data, nm); if (g === 'other' && nm !== r.desc) g = K.guessCat(data, r.desc); return g === 'other' && r.bankCat ? r.bankCat : g; })(), bill: c.type === 'expense' ? K.matchBill(data, { type: 'expense', merchant: r.desc, base, date: r.date }) : null }); });
    const chosen = rows.filter((r) => r.keep && !r.dup);
    // Lines up to the day the balance was typed in are already inside it: history for statistics.
    // Without that date, a statement older than 40 days is taken as already paid.
    const balDate = K.balDate(data, where);
    const newest = rows.reduce((m, r) => (r.date && r.date > m ? r.date : m), '');
    const oldFile = !!newest && K.days(K.parse(newest), K.today()) > 40;
    const isPaid = (r) => (paidMode === 'all' ? true : paidMode === 'none' ? false : balDate ? !!r.date && r.date <= balDate : oldFile);
    const paidCount = chosen.filter(isPaid).length;
    // Salary: every payroll deposit found, plus the ones already in Kipu, sets the expected pay
    const [useSalary, setUseSalary] = useState(true);
    const payroll = chosen.filter((r) => r.payroll);
    const salary = payroll.length ? K.payrollPlan(payroll.map((r) => ({ date: r.date, amt: r.amt })).concat(K.payrollDeposits(data, where))) : null;
    // Payments that come back every month (insurance, phone, gym): offer them as bills
    const [skipBills, setSkipBills] = useState([]);
    const recurring = st.step === 'review' ? K.findRecurring(data, chosen.map((r) => ({ type: r.type, date: r.date, amt: r.amt, desc: r.desc, cat: r.cat, where: r.from }))) : [];
    const newBills = recurring.filter((r) => !skipBills.includes(r.key));
    const doImport = () => {
      let d = data;
      const imp = K.uid('i');
      const linked = new Set();
      chosen.forEach((r) => { if (r.type === 'transfer' && r.from === where && (r.to || '').startsWith('card:')) { const t = K.findCardPaymentIn(d, r, linked); if (t) { linked.add(t.id); d = K.editTxn(d, t.id, { from: where }); return; } } const l = r.type === 'debt' && d.loans.find((x) => x.id === r.loan); if (l) { d = K.addTxn(d, Object.assign(K.loanPayment(d, l, r.amt, r.date), { imp, settled: isPaid(r) || undefined, merchant: r.desc, amt: r.amt, cur, from: r.from, date: r.date, source: 'statement' })); return; } d = K.addTxn(d, { imp, settled: isPaid(r) || undefined, type: r.type, cat: r.type === 'expense' ? r.cat : r.type === 'income' ? 'income' : 'transfer', merchant: r.name || r.desc, raw: r.name && r.name !== r.desc ? r.desc : undefined, amt: r.amt, cur, from: r.from, to: r.to || null, date: r.date, source: 'statement', payroll: r.payroll || undefined }); });
      if (salary && useSalary) d = K.syncPayroll(d, where);
      if (newBills.length) d = K.addRecurringBills(d, newBills);
      if (recurring.length > newBills.length) d = K.dismissRecurring(d, recurring.filter((r) => skipBills.includes(r.key)));
      d = Object.assign({}, d, { imports: [{ id: imp, name: st.name, when: K.iso(K.today()), count: chosen.length, where, settled: paidCount, kind: st.kind && st.kind.card ? 'card' : undefined }].concat(d.imports) });
      commit(d); toast(newBills.length ? chosen.length + ' transactions imported · ' + newBills.length + (newBills.length === 1 ? ' bill added' : ' bills added') : salary && useSalary ? chosen.length + ' transactions imported · salary updated' : paidCount === chosen.length ? chosen.length + ' transactions imported · balances unchanged' : chosen.length + ' transactions imported'); onClose();
    };
    // "Which card is it?": re-read the file for that card and remember the number on it
    const pickCard = async (id) => {
      const c = data.cards.find((x) => x.id === id); if (!c || !st.file) return;
      const w = 'card:' + id, n = st.kind && st.kind.last4;
      if (n && !K.cardNumbers(c).includes(n)) commit(K.upsert(data, 'cards', Object.assign({}, c, c.last4 ? { oldLast4: (c.oldLast4 || []).concat([n]) } : { last4: n })));
      const rows = await K.readStatement(st.file, { dmy: !['CAD', 'USD'].includes(c.cur || data.base), card: true });
      setWhere(w);
      setSt(Object.assign({}, st, { note: { moved: c.name }, rows: rows.map((r, i) => Object.assign({ i, keep: true }, r)) }));
    };
    const toggle = (i) => setSt(Object.assign({}, st, { rows: st.rows.map((r) => (r.i === i ? Object.assign({}, r, { keep: !r.keep, force: r.keep ? false : r.force }) : r)) }));
    // "Already in Kipu" is a guess: tapping it imports the line anyway
    const force = (i) => setSt(Object.assign({}, st, { rows: st.rows.map((r) => (r.i === i ? Object.assign({}, r, { keep: true, force: true }) : r)) }));
    if (!places.length) return html`<${Sheet} title="Upload statement" onClose=${onClose}><${NoPlace} /></${Sheet}>`;
    return html`<${Sheet} title="Upload statement" sub="CSV from any bank works best. PDFs are read line by line; check the result before importing." onClose=${onClose}>
      ${st.step === 'pick' && html`<${Field} label="Statement for"><${Select} id="s-where" value=${where} onChange=${setWhere} options=${places} /></${Field}>
        <label class="card flat" style=${{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '24px', cursor: 'pointer' }}><${Tile} icon="doc" tone="b" /><span style=${{ fontWeight: 600 }}>Choose a CSV or PDF</span><input id="s-file" type="file" accept=".csv,.pdf,text/csv,application/pdf" style=${{ display: 'none' }} onChange=${(e) => run(e.target.files[0])} /></label>`}
      ${st.step === 'reading' && html`<div class="card flat stack-s" style=${{ alignItems: 'center', padding: '28px' }}><${Tile} icon="doc" tone="b" /><span style=${{ fontWeight: 600 }}>Reading ${st.name}…</span><div style=${{ width: '100%' }}><${Bar} pct=${60} color="var(--info)" /></div></div>`}
      ${st.step === 'fail' && html`<div class="card flat stack-s"><span style=${{ fontWeight: 600 }}>No transactions found in ${st.name}</span><span class="small muted">${st.err ? 'The file couldn’t be read.' : 'Kipu looks for a date, a description and an amount on each line. Try the CSV export from your bank.'}</span><button class="btn sec" onClick=${() => setSt({ step: 'pick' })}>Choose another file</button></div>`}
      ${st.step === 'review' && html`
        ${st.note && st.note.moved && html`<div class="row small" style=${{ gap: '10px', padding: '12px 14px', borderRadius: '14px', background: 'var(--accbg)', alignItems: 'center' }}><${Icon} n="card" s=${16} /><span class="grow" style=${{ lineHeight: 1.45 }}>${'This is a credit card statement, so it goes to ' + st.note.moved + '.'}</span></div>`}
        ${st.note && st.note.otherNumber && html`<div class="row small" style=${{ gap: '10px', padding: '12px 14px', borderRadius: '14px', background: 'var(--accbg)', alignItems: 'center', flexWrap: 'wrap' }}><${Icon} n="card" s=${16} /><span class="grow" style=${{ lineHeight: 1.45, minWidth: '180px' }}>${st.note.remembered ? 'Card ending ' + st.note.otherNumber + ' now counts as ' + st.note.card + '.' : 'This statement is for the card ending ' + st.note.otherNumber + '. Same account as ' + st.note.card + ' with another number?'}</span>${!st.note.remembered && html`<button class="btn sec sm" onClick=${() => { const c = K.whereItem(data, where); if (c) commit(K.upsert(data, 'cards', Object.assign({}, c, { oldLast4: K.cardNumbers(c).filter((n) => n !== c.last4).concat([st.note.otherNumber]) }))); setSt(Object.assign({}, st, { note: Object.assign({}, st.note, { remembered: true }) })); }}>Yes, remember it</button>`}</div>`}
        ${st.note && st.note.noCard && html`<div class="row small" style=${{ gap: '10px', padding: '12px 14px', borderRadius: '14px', background: 'var(--warnbg)', color: 'var(--warn)', alignItems: 'center', flexWrap: 'wrap' }}><${Icon} n="alert" s=${16} /><span class="grow" style=${{ lineHeight: 1.45, minWidth: '180px' }}>${'This looks like a credit card statement' + (st.note.noCard !== true ? ' (card ending ' + st.note.noCard + ')' : '') + (data.cards.length ? '. Pick the card it belongs to so payments and credits are read right.' : '. Add the card first and import it there, so payments and credits are read right.')}</span>${data.cards.length ? html`<select class="input cat-pick" aria-label="Which card is it?" value="" onChange=${(e) => e.target.value && pickCard(e.target.value)}><option value="">Which card is it?</option>${data.cards.map((c) => html`<option key=${c.id} value=${c.id}>${c.name}${c.last4 ? ' ·' + c.last4 : ''}</option>`)}</select>` : html`<button class="btn sec sm" onClick=${() => openSheet({ k: 'addCard' })}>Add card</button>`}</div>`}
        <div class="grid g3" style=${{ gap: '8px' }}><div class="card flat" style=${{ padding: '12px' }}><${Metric} label="Found" value=${String(rows.length)} /></div><div class="card flat" style=${{ padding: '12px' }}><${Metric} label="Already in Kipu" value=${String(rows.filter((r) => r.dup).length)} /></div><div class="card flat" style=${{ padding: '12px' }}><${Metric} label="To import" value=${String(chosen.length)} tone="pos" /></div></div>
        <div class="grid g2" style=${{ gap: '8px' }}><${Field} label="Spending shows as"><${Select} id="s-sign" value=${sign} onChange=${setSign} options=${[['auto', (st.rows || []).some((r) => r.dir) ? 'Automatic · by column' : allPositive ? 'Automatic · by description' : 'Automatic · ' + (autoSign < 0 ? 'negative' : 'positive')], ['pos', 'Positive amounts'], ['neg', 'Negative amounts']]} /></${Field}><${Field} label="Currency"><${Select} id="s-cur" value=${cur} onChange=${setCur} options=${curOptions(data).map((c) => [c, c])} /></${Field}></div>
        <div class="card tight list" style=${{ maxHeight: '320px', overflowY: 'auto' }}>${rows.map((r) => html`<button key=${r.i} class="lrow" style=${{ opacity: r.dup || !r.keep ? 0.45 : 1 }} onClick=${() => (r.dup ? force(r.i) : toggle(r.i))}><span class=${'ic ' + (r.dup ? 'n' : r.keep ? 'p' : 'n')} style=${{ width: '26px', height: '26px', borderRadius: '8px' }}><${Icon} n=${r.dup ? 'copy' : r.keep ? 'check' : 'x'} s=${13} w=${2.4} /></span><span class="grow stack-s" style=${{ gap: '1px', textAlign: 'left', minWidth: 0 }}><span class="t1" style=${{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${r.desc}</span><span class="t2">${K.fmtDate(r.date, true)} · ${r.dup ? 'Already in Kipu · tap to import anyway' : r.bill ? 'Pays ' + r.bill.name : r.cardPay ? (r.cardPay === true ? 'Card payment · not spending' : 'Pays ' + r.cardPay + ' · not spending') : r.type === 'expense' ? K.CATS[r.cat].name : r.refund ? 'Refund' : r.payroll ? 'Salary' : r.loanName ? 'Pays ' + r.loanName + ' · loan payment' : r.xfer ? (r.xfer === 'out' ? 'Transfer out · not spending' : 'Transfer in · not income') : r.type === 'income' ? 'Income' : 'Payment'}</span></span><span class="amt" style=${{ color: r.type === 'income' ? 'var(--pos)' : null }}>${fmt.native(r.amt, cur, { dec: 2 })}</span></button>`)}</div>
        ${salary && html`<div class="card tight"><${ToggleRow} title="Use as my salary" sub=${payroll.length + ' payroll deposits · usually ' + fmt.native(salary.amt, cur) + ' · ' + { Weekly: 'weekly', 'Bi-weekly': 'every two weeks', 'Twice monthly': 'twice a month', Monthly: 'monthly' }[salary.freq] + ' · next ' + K.fmtDate(salary.next)} on=${useSalary} onChange=${setUseSalary} icon="income" tone="g" /></div>`}
        ${recurring.length > 0 && html`<div class="card stack-s" style=${{ gap: '8px' }}><span style=${{ fontWeight: 600 }}>Payments that repeat</span><span class="small muted" style=${{ lineHeight: 1.45 }}>These come back every month. Saved as bills, Safe to Spend sets money aside for the next one. Tap one that isn’t a bill to leave it out.</span>
          <div class="list">${recurring.map((r) => { const on = !skipBills.includes(r.key); return html`<button key=${r.key} class="lrow" style=${{ gap: '10px', opacity: on ? 1 : 0.5 }} onClick=${() => setSkipBills(on ? skipBills.concat([r.key]) : skipBills.filter((k) => k !== r.key))}><span class=${'ic ' + (on ? 'p' : 'n')} style=${{ width: '26px', height: '26px', borderRadius: '8px' }}><${Icon} n=${on ? 'check' : 'x'} s=${13} w=${2.4} /></span><span class="grow stack-s" style=${{ gap: '1px', textAlign: 'left', minWidth: 0 }}><span class="t1" style=${{ fontSize: '14px' }}>${r.name}</span><span class="t2">${K.ord(r.day) + ' of the month'} · ${r.count + ' times'}</span></span><span class="amt">${fmt.native(r.amt, cur, { dec: 2 })}</span></button>`; })}</div></div>`}
        <div class="card stack-s" style=${{ gap: '10px' }}><span style=${{ fontWeight: 600 }}>Already paid?</span><${Seg} options=${['auto', 'all', 'none']} labels=${['Automatic', 'All', 'None']} value=${paidMode} onChange=${setPaidMode} />
          <span class="small muted" style=${{ lineHeight: 1.5 }}>${paidMode === 'auto' ? (balDate ? 'Up to ' + K.fmtDate(balDate, true) + ', when you typed this balance, movements are already inside it.' : oldFile ? 'This statement is more than 40 days old, so it’s taken as already paid.' : 'This looks like a current statement.') + ' ' : ''}${paidCount ? paidCount + ' only for statistics' : ''}${paidCount && paidCount < chosen.length ? ' · ' : ''}${paidCount < chosen.length ? (chosen.length - paidCount) + (isCard ? ' change what you owe' : ' change the balance') : ''}.</span></div>
        <button class="btn pri block" disabled=${!chosen.length} onClick=${doImport}>Import ${chosen.length} transactions</button>`}</${Sheet}>`;
  };

  // ---------------------------------------------------------------- categories reviewed once per shop
  const ReviewCats = ({ onClose }) => {
    const { data, commit, toast, fmt } = useApp();
    const [view, setView] = useState('todo');
    const groups = K.categoryGroups(data);
    const todo = groups.filter((g) => g.cat === 'other' || g.mixed);
    const list = view === 'todo' ? todo : groups;
    const set = (g, cat) => { commit(K.setShopCategory(data, g.key, cat)); toast(g.name + ' · ' + K.CATS[cat].name); };
    return html`<${Sheet} title="Review categories" sub="One choice per shop: it applies to all its expenses and to the next ones." onClose=${onClose}>
      <${Seg} options=${['todo', 'all']} labels=${['To review (' + todo.length + ')', 'All shops']} value=${view} onChange=${setView} />
      ${list.length ? html`<div class="card tight list">${list.slice(0, 150).map((g) => html`<div key=${g.key} class="lrow" style=${{ gap: '10px', flexWrap: 'wrap' }}><span class="grow stack-s" style=${{ gap: '2px', minWidth: '150px' }}><span class="t1" style=${{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${g.name}</span><span class="tiny muted num">${(g.count === 1 ? '1 expense' : g.count + ' expenses') + ' · ' + fmt(g.total)}${g.mixed ? html`<span style=${{ color: 'var(--warn)' }}>${' · mixed'}</span>` : ''}</span></span><select class="input cat-pick" aria-label=${'Category for ' + g.name} value=${g.mixed ? '' : g.cat} onChange=${(e) => e.target.value && set(g, e.target.value)}>${g.mixed && html`<option value="">Choose…</option>`}${K.CAT_ORDER.map((c) => html`<option key=${c} value=${c}>${K.CATS[c].name}</option>`)}</select></div>`)}</div>` : html`<div class="card flat stack-s" style=${{ alignItems: 'center', textAlign: 'center', padding: '24px' }}><${Icon} n="check" s=${22} c="var(--pos)" w=${2.4} /><span style=${{ fontWeight: 600 }}>All sorted</span><span class="small muted">Every shop has a category.</span></div>`}
    </${Sheet}>`;
  };

  // ---------------------------------------------------------------- imported statements that were already paid
  const SettleImports = ({ onClose, where }) => {
    const { data, commit, toast, fmt } = useApp();
    const all = K.importedOn(data, where);
    const [before, setBefore] = useState(() => all.reduce((m, t) => (t.date > m ? t.date : m), ''));
    const list = K.importedOn(data, where, before);
    const name = (K.whereItem(data, where) || {}).name || '';
    const save = () => { commit(K.settleImported(data, where, before)); toast(list.length + ' marked as already paid · balance updated'); onClose(); };
    return html`<${Sheet} title="Already paid" sub=${'Imported movements on ' + name + ' stay in statistics, but no longer change its balance.'} onClose=${onClose}>
      <${K.DateInput} label="Up to" value=${before} onChange=${setBefore} />
      <div><${K.Facts} rows=${[['Movements', String(list.length)], ['Total', fmt(list.reduce((a, t) => a + (t.type === 'expense' ? t.base || 0 : 0), 0))]]} /></div>
      <span class="small muted">Use this for old statements you had already paid. After this, update the balance so it matches your bank today.</span>
      <button class="btn pri block" disabled=${!list.length} onClick=${save}>Mark ${list.length} as already paid</button></${Sheet}>`;
  };

  // ---------------------------------------------------------------- create and edit
  const Form = ({ title, sub, onClose, children, onSave, cta, disabled, onDelete }) => html`<${Sheet} title=${title} sub=${sub} onClose=${onClose}>${children}<button class="btn pri block" disabled=${disabled} onClick=${onSave}>${cta}</button>${onDelete && html`<${K.DangerButton} label="Delete" ask=${'Delete ' + (title || '').replace(/^Edit /, '') + '?'} onConfirm=${onDelete} />`}</${Sheet}>`;

  const AddAccount = ({ onClose, item }) => {
    const { data, commit, toast, openSheet } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { bal: String(item.bal) }) : { name: '', kind: 'Everyday', cur: data.base, bal: '', inst: '', shared: false });
    const country = f.country || K.countryOfCur(f.cur) || null;
    const save = () => { const a = Object.assign({}, item || {}, { name: f.name || f.kind + ' account', inst: f.inst, kind: f.kind, cur: f.cur, country, bal: numv(f.bal), shared: !!f.shared }); commit(K.upsert(K.useCurrency(data, a.cur), 'accounts', a)); toast(item ? 'Account updated' : 'Account added'); onClose(); };
    return html`<${Form} title=${item ? 'Edit account' : 'Add account'} onClose=${onClose} cta=${item ? 'Save' : 'Add account'} onSave=${save}>
      <${Chips} options=${item ? ['Everyday', 'Savings', 'Cash', 'Investments', 'Property'] : ['Everyday', 'Savings', 'Cash', 'Credit card', 'Loan', 'Investments', 'Property']} value=${f.kind} onChange=${(k) => (k === 'Credit card' ? openSheet({ k: 'addCard' }) : k === 'Loan' ? openSheet({ k: 'addLoan' }) : on('kind')(k))} />
      <${In} id="aa-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Everyday Chequing" />
      <${In} id="aa-inst" label="Institution" value=${f.inst} onInput=${on('inst')} ph="Optional" />
      <${K.CurrencySelect} label="Currency" value=${f.cur} onChange=${on('cur')} />
      <${K.CountrySelect} label="Country" value=${country} onChange=${on('country')} hint="Kipu groups your money by country, each in its own currency." />
      <${In} id="aa-bal" label=${item ? 'Balance' : 'Current balance'} value=${f.bal} onInput=${on('bal')} mode="decimal" ph="0.00" hint=${item ? 'Changing it here doesn’t create a transaction.' : 'Today’s balance. Later transactions move it automatically.'} />
      ${data.household.enabled && html`<div class="card tight"><${ToggleRow} title="Share with Household" on=${!!f.shared} onChange=${on('shared')} /></div>`}</${Form}>`;
  };

  const AdjustSheet = ({ onClose, id }) => {
    const { data, commit, toast } = useApp();
    const a = data.accounts.find((x) => x.id === id);
    const [v, setV] = useState(String(a ? a.bal : ''));
    if (!a) return null;
    return html`<${Form} title="Update balance" sub=${'What does ' + a.name + ' show right now? Kipu adjusts without adding spending or income.'} onClose=${onClose} cta="Save balance" onSave=${() => { commit(K.upsert(data, 'accounts', Object.assign({}, a, { bal: numv(v) }))); toast('Balance updated'); onClose(); }}><${Amount} value=${v} onChange=${setV} cur=${a.cur} /></${Form}>`;
  };

  const AddCard = ({ onClose, item }) => {
    const { data, commit, toast } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { cur: item.cur || data.base, cur2: item.cur2 || '', bal2: String(item.bal2 || ''), stmtBal2: String(item.stmtBal2 || ''), limit: String(item.limit || ''), bal: String(item.bal || ''), stmtBal: String(item.stmtBal || ''), dueDay: String(item.dueDay || ''), closeDay: String(item.closeDay || ''), payDay: String(item.payDay || ''), oldLast4: (item.oldLast4 || []).join(', '), minPay: String(item.minPay || ''), expiry: item.expiry || '' }) : { name: '', network: 'Visa', cur: data.base, last4: '', limit: '', bal: '', stmtBal: '', dueDay: '', closeDay: '', minPay: '', expiry: '', look: null });
    const country = f.country || K.countryOfCur(f.cur) || null;
    const two = !!f.cur2;
    // A new card starts at zero and fills from expenses and imported statements; balances are only a later correction
    const [showBal, setShowBal] = useState(false);
    const preview = { name: f.name || f.network + ' card', network: f.network, cur: f.cur, cur2: f.cur2 || null, bal2: numv(f.bal2), last4: f.last4, limit: numv(f.limit), bal: numv(f.bal), expiry: f.expiry, look: f.look, style: item ? item.style : data.cards.length };
    const save = () => { commit(K.upsert(K.useCurrency(data, f.cur), 'cards', Object.assign({}, item || { style: data.cards.length }, { name: f.name || f.network + ' card', network: f.network, cur: f.cur, country, cur2: two ? f.cur2 : null, bal2: two ? numv(f.bal2) : 0, stmtBal2: two ? numv(f.stmtBal2) : 0, last4: String(f.last4 || '').replace(/\D/g, '').slice(-4), oldLast4: String(f.oldLast4 || '').split(/[\s,]+/).map((x) => x.replace(/\D/g, '').slice(-4)).filter((x) => x.length === 4), limit: numv(f.limit), bal: numv(f.bal), stmtBal: numv(f.stmtBal), closeDay: parseInt(f.closeDay) || null, dueDay: parseInt(f.dueDay) || null, payDay: parseInt(f.payDay) || null, stmtDate: item && numv(f.stmtBal) !== (item.stmtBal || 0) ? K.iso(K.today()) : (item && item.stmtDate) || null, minPay: numv(f.minPay), expiry: f.expiry || null, look: f.look || null, shared: !!f.shared }))); toast(item ? 'Card updated' : 'Card added'); onClose(); };
    return html`<${Form} title=${item ? 'Edit card' : 'Add credit card'} sub="Only the last four digits are stored." onClose=${onClose} cta=${item ? 'Save' : 'Add card'} onSave=${save}>
      <div style=${{ maxWidth: '300px', width: '100%', alignSelf: 'center' }}><${K.CardPreview} c=${preview} /></div>
      <${Chips} options=${['Visa', 'Mastercard', 'Amex', 'Other']} value=${f.network} onChange=${on('network')} />
      <${K.CurrencySelect} label="Card currency" value=${f.cur} onChange=${on('cur')} />
      <${K.CountrySelect} label="Country" value=${country} onChange=${on('country')} />
      <div class="card tight"><${ToggleRow} title="Two-currency card" sub=${'Common in Peru and Latin America: charges in ' + (f.cur2 || 'US dollars') + ' keep their own balance, sharing one limit.'} on=${two} onChange=${(v) => on('cur2')(v ? (f.cur === 'USD' ? data.base : 'USD') : '')} /></div>
      ${two && html`<${K.CurrencySelect} label="Second currency" value=${f.cur2} onChange=${on('cur2')} />`}
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="ac-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Travel Visa" /><${In} id="ac-last4" label="Last four" value=${f.last4} onInput=${(e) => on('last4')(e.target.value.replace(/\D/g, '').slice(0, 4))} mode="numeric" ph="1234" /></div>
      ${item && html`<${In} id="ac-old4" label="Previous numbers" value=${f.oldLast4 || ''} onInput=${(e) => on('oldLast4')(e.target.value.replace(/[^\d, ]/g, ''))} mode="numeric" ph="e.g. 4011" hint="If the bank replaced the card (lost, stolen, hacked): its old last four, so old statements still land here." />`}
      <${In} id="ac-limit" label="Credit limit" value=${f.limit} onInput=${on('limit')} mode="decimal" ph="0" />
      ${item && !showBal && html`<button type="button" class="link" style=${{ alignSelf: 'flex-start' }} onClick=${() => setShowBal(true)}>Balances (optional)</button>`}
      ${item && showBal && html`<div class="stack-s" style=${{ gap: '10px' }}>
        <div class="grid g2" style=${{ gap: '10px' }}><${In} id="ac-bal" label=${two ? 'Balance in ' + f.cur : 'Current balance'} value=${f.bal} onInput=${on('bal')} mode="decimal" ph="0" /><${In} id="ac-stmt" label=${two ? 'Statement in ' + f.cur : 'Statement balance'} value=${f.stmtBal} onInput=${on('stmtBal')} mode="decimal" ph="0" /></div>
        ${two && html`<div class="grid g2" style=${{ gap: '10px' }}><${In} id="ac-bal2" label=${'Balance in ' + f.cur2} value=${f.bal2} onInput=${on('bal2')} mode="decimal" ph="0" /><${In} id="ac-stmt2" label=${'Statement in ' + f.cur2} value=${f.stmtBal2} onInput=${on('stmtBal2')} mode="decimal" ph="0" /></div>`}
        <${In} id="ac-min" label="Minimum payment" value=${f.minPay} onInput=${on('minPay')} mode="decimal" ph="0" /></div>`}
      <${K.DayInput} label="Statement closing day" value=${f.closeDay} onChange=${on('closeDay')} optional=${true} hint="The day your statement is cut. Purchases after it go on the next statement." />
      <${K.DayInput} label="Payment due day" value=${f.dueDay} onChange=${on('dueDay')} optional=${true} hint="Usually about three weeks after the closing day." />
      <${K.DayInput} label="You usually pay on" value=${f.payDay} onChange=${on('payDay')} optional=${true} hint="If you pay before the due date. Safe to Spend sets the statement aside for that day." />
      <${K.MonthInput} label="Expiry date" value=${f.expiry} onChange=${on('expiry')} optional=${true} placeholder="MM / YY" fromYear=${K.today().getFullYear() - 1} hint="Kipu reminds you two months before it expires." />
      <${K.LookPicker} label="Card color" value=${f.look} onChange=${on('look')} fallback=${['var(--grad)', 'var(--solid)', 'linear-gradient(140deg, #1C1C1E 0%, #48484C 100%)'][(item ? item.style || 0 : data.cards.length) % 3]} />
      ${data.household.enabled && html`<div class="card tight"><${ToggleRow} title="Share with Household" on=${!!f.shared} onChange=${on('shared')} /></div>`}</${Form}>`;
  };

  const AddLoan = ({ onClose, item, preset }) => {
    const { data, commit, toast, fmt } = useApp();
    const from = preset && preset.fromRecurring;
    const [f, on] = useForm(item ? Object.assign({}, item, { cur: item.cur || data.base, orig: String(item.orig || ''), bal: String(item.bal), rate: String(item.rate || ''), pay: String(item.pay || ''), from: item.from || '' }) : { name: from ? from.name : '', kind: from ? 'Other' : 'Vehicle', lender: '', orig: '', bal: '', rate: '', pay: from ? String(from.amt) : '', freq: 'Monthly', next: from ? K.iso(K.nextDate(from.last, 'Monthly', K.addDays(K.today(), 1))) : K.iso(K.addDays(K.today(), 7)), from: from ? from.where : '' });
    const loan = { bal: numv(f.bal), rate: numv(f.rate), pay: numv(f.pay), freq: f.freq, next: f.next };
    const p = loan.bal && loan.pay ? K.payoffDate(loan) : null;
    const save = () => { let d = K.upsert(data, 'loans', Object.assign({}, item || {}, { name: f.name || f.kind + ' loan', kind: f.kind, lender: f.lender, cur: f.cur || data.base, country: f.country || K.countryOfCur(f.cur || data.base) || null, orig: numv(f.orig) || numv(f.bal), bal: numv(f.bal), rate: numv(f.rate), pay: numv(f.pay), freq: f.freq, next: f.next, from: f.from || null, match: (item && item.match) || (from && from.key) || undefined, shared: !!f.shared })); if (from) { d = K.dismissRecurring(d, [from]); d = K.fixLoanPayments(d); } commit(d); toast(item ? 'Loan updated' : 'Loan added'); onClose(); };
    return html`<${Form} title=${item ? 'Edit loan' : 'Add loan'} sub="Track what you owe and when it’s paid off." onClose=${onClose} cta=${item ? 'Save' : 'Add loan'} onSave=${save} disabled=${!numv(f.bal)}>
      <${Chips} options=${['Vehicle', 'Personal', 'Student', 'Mortgage', 'Line of credit', 'Other']} value=${f.kind} onChange=${on('kind')} />
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="al-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Car loan" /><${In} id="al-lender" label="Lender" value=${f.lender} onInput=${on('lender')} ph="Optional" /></div>
      <${K.CurrencySelect} label="Loan currency" value=${f.cur || data.base} onChange=${on('cur')} />
      <${K.CountrySelect} label="Country" value=${f.country || K.countryOfCur(f.cur || data.base)} onChange=${on('country')} />
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="al-orig" label="Original amount" value=${f.orig} onInput=${on('orig')} mode="decimal" /><${In} id="al-bal" label="Balance today" value=${f.bal} onInput=${on('bal')} mode="decimal" /></div>
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="al-rate" label="Interest rate %" value=${f.rate} onInput=${on('rate')} mode="decimal" /><${In} id="al-pay" label="Payment" value=${f.pay} onInput=${on('pay')} mode="decimal" /></div>
      <${Chips} options=${['Weekly', 'Bi-weekly', 'Twice monthly', 'Monthly', 'Quarterly']} value=${f.freq} onChange=${on('freq')} />
      <${K.DateInput} label="Next payment" value=${f.next} onChange=${on('next')} />
      <${Field} label="Paid from" hint="If it’s taken automatically, imported statements recognize the payment by the loan’s name or lender."><${Select} id="al-from" value=${f.from || ''} onChange=${on('from')} options=${K.whereOptions(data)} placeholder="Not set" /></${Field}>
      <div class="card flat small">${p ? 'Paid off ' + p.label + (isFinite(p.interest) ? ' · about ' + fmt(p.interest) + ' interest left' : '') + ' · estimate' : 'Add the balance, rate and payment to see when it’s paid off.'}</div></${Form}>`;
  };

  const PayLoan = ({ onClose, id }) => {
    const { data, commit, toast, fmt } = useApp();
    const l = data.loans.find((x) => x.id === id);
    const places = K.whereOptions(data, { cashOnly: true, noCards: true });
    const [from, setFrom] = useState((places[0] || [])[0] || '');
    const [extra, setExtra] = useState('');
    if (!l) return null;
    const s = K.loanSplit(l);
    const lc = l.cur || data.base, m = (v) => fmt.native(v, lc, { dec: 2 });
    const blocked = from ? K.canPost(data, { type: 'debt', amt: (l.pay || 0) + numv(extra), cur: lc, from }) : null;
    return html`<${Form} title=${'Pay ' + l.name} sub=${'Scheduled payment ' + m(l.pay) + ': about ' + m(s.principal) + ' principal and ' + m(s.interest) + ' interest.'} onClose=${onClose} cta="Record payment" disabled=${!from || !!blocked} onSave=${() => { commit(K.payLoan(data, l.id, from, numv(extra))); toast('Payment recorded · balance updated'); onClose(); }}>
      ${places.length ? html`<${Field} label="Paid from"><${Select} id="pl-from" value=${from} onChange=${setFrom} options=${places} /></${Field}>` : html`<${NoPlace} />`}
      <${In} id="pl-extra" label="Extra toward principal" value=${extra} onInput=${(e) => setExtra(e.target.value)} mode="decimal" ph="Optional" />
      ${blocked && html`<${K.RateNote} cur=${blocked} blocked=${true} />`}</${Form}>`;
  };

  const AddGoal = ({ onClose, item }) => {
    const { data, commit, toast, fmt } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { target: String(item.target), monthly: String(item.monthly || ''), saved: String(item.saved || ''), targetDate: item.targetDate || '', linked: item.linked || '' }) : { name: '', target: '', monthly: '', saved: '', targetDate: '', linked: '' });
    const left = numv(f.target) - numv(f.saved), m = numv(f.monthly);
    const eta = m > 0 && left > 0 ? K.addMonths(K.today(), Math.ceil(left / m)) : null;
    const save = () => { commit(K.upsert(data, 'goals', Object.assign({}, item || {}, { name: f.name || 'Goal', target: numv(f.target), monthly: m, saved: numv(f.saved), targetDate: f.targetDate || null, linked: f.linked || null, shared: !!f.shared, look: f.look || null }))); toast(item ? 'Goal updated' : 'Goal added · its monthly amount counts in Safe to Spend'); onClose(); };
    return html`<${Form} title=${item ? 'Edit goal' : 'Add goal'} onClose=${onClose} cta=${item ? 'Save' : 'Add goal'} onSave=${save} disabled=${!numv(f.target)}>
      <${In} id="ag-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Emergency fund" />
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="ag-target" label="Target" value=${f.target} onInput=${on('target')} mode="decimal" /><${In} id="ag-monthly" label="Monthly amount" value=${f.monthly} onInput=${on('monthly')} mode="decimal" /></div>
      <${Field} label="Linked savings account" hint="If linked, its balance is the goal’s progress."><${Select} id="ag-linked" value=${f.linked} onChange=${on('linked')} options=${data.accounts.filter((a) => a.kind === 'Savings' || a.kind === 'Investments').map((a) => [a.id, a.name])} placeholder="Not linked" /></${Field}>
      ${!f.linked && html`<${In} id="ag-saved" label="Already saved" value=${f.saved} onInput=${on('saved')} mode="decimal" ph="0" />`}
      <${K.MonthInput} label="Target month" value=${f.targetDate} onChange=${on('targetDate')} optional=${true} placeholder="No target month" fromYear=${K.today().getFullYear()} />
      ${eta && html`<div class="card flat between small"><span class="muted">At ${fmt(m)} a month</span><b>Done by ${K.fmtMonth(eta)}</b></div>`}
      <${K.LookPicker} label="Goal card" value=${f.look} onChange=${on('look')} fallback="var(--grad2)" /></${Form}>`;
  };

  const AddBill = ({ onClose, item }) => {
    const { data, commit, toast, fmt, ctx } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { amt: String(item.amt), day: String(item.day || 1), month: String(item.month || 1) }) : { name: '', kind: 'Bill', amt: '', cur: data.base, day: '1', month: String(K.today().getMonth() + 1), cat: 'bills', pay: (K.whereOptions(data)[0] || [])[0] || '' });
    const save = () => { const next = K.upsert(data, 'bills', Object.assign({ since: K.iso(K.today()) }, item || {}, { name: f.name || 'Bill', kind: f.kind, amt: numv(f.amt), cur: f.cur || data.base, day: Math.min(28, Math.max(1, parseInt(f.day) || 1)), month: f.kind === 'Annual' ? parseInt(f.month) || 1 : undefined, cat: f.kind === 'Subscription' ? 'subs' : f.cat, pay: f.pay, end: f.end || null, shared: !!f.shared })); commit(next); const p = K.derive(next, ctx).plan; toast((item ? 'Updated' : 'Added') + (p.hasIncome ? ' · Safe to Spend ' + fmt(p.safe) : '')); onClose(); };
    return html`<${Form} title=${item ? 'Edit ' + item.name : 'Add bill or subscription'} sub="It counts in Safe to Spend and shows up before it’s due." onClose=${onClose} cta=${item ? 'Save' : 'Add'} onSave=${save} disabled=${!numv(f.amt)} onDelete=${item && (() => { commit(K.removeBill(data, item.id)); toast('Deleted'); onClose(); })}>
      <${Seg} options=${['Bill', 'Subscription', 'Annual']} value=${f.kind} onChange=${on('kind')} />
      <${In} id="ab-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Rent, Netflix" />
      <${In} id="ab-amt" label="Amount" value=${f.amt} onInput=${on('amt')} mode="decimal" /><${K.DayInput} label=${f.kind === 'Annual' ? 'Day' : 'Due day'} value=${f.day} onChange=${on('day')} max=${28} />
      ${f.kind === 'Annual' && html`<${Field} label="Month"><${Select} id="ab-month" value=${f.month} onChange=${on('month')} options=${K.MONTH_LONG.map((m, i) => [String(i + 1), m])} /></${Field}>`}
      ${f.kind !== 'Subscription' && html`<${Field} label="Category"><${Select} id="ab-cat" value=${f.cat} onChange=${on('cat')} options=${K.CAT_ORDER.map((c) => [c, K.CATS[c].name])} /></${Field}>`}
      <${Field} label="Paid with"><${Select} id="ab-pay" value=${f.pay} onChange=${on('pay')} options=${K.whereOptions(data)} placeholder="Not set" /></${Field}>
      <${K.MonthInput} label="Ends in" value=${f.end || ''} onChange=${on('end')} optional=${true} placeholder="No end" fromYear=${K.today().getFullYear()} hint="For a contract or plan with a last payment. After that month it stops counting." /></${Form}>`;
  };

  const AddIncomeSource = ({ onClose, item }) => {
    const { data, commit, toast, fmt, ctx } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { amt: String(item.amt) }) : { name: 'Salary', amt: '', cur: data.base, freq: 'Bi-weekly', next: K.iso(K.addDays(K.today(), 7)), to: (K.whereOptions(data, { cashOnly: true, noCards: true })[0] || [])[0] || '' });
    const save = () => { const next = K.upsert(data, 'income', Object.assign({}, item || {}, { name: f.name || 'Income', amt: numv(f.amt), cur: f.cur, freq: f.freq, next: f.next, to: f.to, shared: !!f.shared })); commit(next); const p = K.derive(next, ctx).plan; toast('Income saved · Safe to Spend ' + fmt(p.safe)); onClose(); };
    return html`<${Form} title=${item ? 'Edit income' : 'Add income source'} sub="Regular pay Kipu expects. It isn’t recorded until you add the actual payment." onClose=${onClose} cta="Save" onSave=${save} disabled=${!numv(f.amt)} onDelete=${item && (() => { commit(K.remove(data, 'income', item.id)); toast('Deleted'); onClose(); })}>
      <${In} id="is-name" label="Name" value=${f.name} onInput=${on('name')} />
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="is-amt" label="Amount after tax" value=${f.amt} onInput=${on('amt')} mode="decimal" /><${Field} label="Currency"><${Select} id="is-cur" value=${f.cur} onChange=${on('cur')} options=${curOptions(data).map((c) => [c, c])} /></${Field}></div>
      <${Chips} options=${['Weekly', 'Bi-weekly', 'Twice monthly', 'Monthly']} value=${f.freq} onChange=${on('freq')} />
      <${K.DateInput} label="Next payday" value=${f.next} onChange=${on('next')} />
      ${K.whereOptions(data, { cashOnly: true, noCards: true }).length > 0 && html`<${Field} label="Paid into"><${Select} id="is-to" value=${f.to} onChange=${on('to')} options=${K.whereOptions(data, { cashOnly: true, noCards: true })} /></${Field}>`}</${Form}>`;
  };

  const AddTrip = ({ onClose, item }) => {
    const { data, commit, toast } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { budget: String(item.budget || '') }) : { name: '', place: '', start: K.iso(K.addDays(K.today(), 14)), end: K.iso(K.addDays(K.today(), 21)), cur: data.base, budget: '' });
    const save = () => { commit(K.upsert(K.useCurrency(data, f.cur), 'trips', Object.assign({}, item || {}, { name: f.name || f.place || 'Trip', place: f.place, start: f.start, end: f.end < f.start ? f.start : f.end, cur: f.cur, budget: numv(f.budget), look: f.look || null }))); toast(item ? 'Trip updated' : 'Trip added'); onClose(); };
    return html`<${Form} title=${item ? 'Edit trip' : 'Plan a trip'} onClose=${onClose} cta=${item ? 'Save' : 'Add trip'} onSave=${save}>
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="at-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Lima 2026" /><${In} id="at-place" label="Destination" value=${f.place} onInput=${on('place')} /></div>
      <${K.DateInput} label="Start" value=${f.start} onChange=${on('start')} /><${K.DateInput} label="End" value=${f.end} onChange=${on('end')} min=${f.start} />
      <${K.CurrencySelect} label="Local currency" value=${f.cur} onChange=${on('cur')} /><${In} id="at-budget" label=${'Budget (' + data.base + ')'} value=${f.budget} onInput=${on('budget')} mode="decimal" />
      <${K.LookPicker} label="Trip card" value=${f.look} onChange=${on('look')} fallback="var(--grad2)" />
      <span class="tiny muted">Expenses in the trip currency during these dates are tagged to it automatically.</span></${Form}>`;
  };

  const CreateHousehold = ({ onClose }) => {
    const { data, commit, toast } = useApp();
    const [name, setName] = useState(data.household.name || '');
    return html`<${Form} title="Household" sub="Mark accounts, bills and goals as shared, then switch the scope to see only shared money on this device. Sign in to set up a joint space for two accounts." onClose=${onClose} cta="Turn on Household" onSave=${() => { commit(Object.assign({}, data, { household: { enabled: true, name: name || 'Home' } })); toast('Household on · use the scope switch to view shared items'); onClose(); }}>
      <${In} id="hh-name" label="Name" value=${name} onInput=${(e) => setName(e.target.value)} ph="e.g. Home" /></${Form}>`;
  };

  K.SHEETS = { reviewCats: ReviewCats, settleImports: SettleImports, quickAdd: QuickAdd, context: ContextSheet, expense: ExpenseSheet, income: IncomeSheet, transfer: TransferSheet, debt: DebtSheet, receipt: ReceiptSheet, statement: StatementSheet, addAccount: AddAccount, adjust: AdjustSheet, addCard: AddCard, addLoan: AddLoan, payLoan: PayLoan, addGoal: AddGoal, addBill: AddBill, addIncomeSource: AddIncomeSource, addTrip: AddTrip, createHousehold: CreateHousehold };
})();
