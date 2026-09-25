/* Kipu · add, edit and import flows. Every save goes through the store, so all screens update. */
(function () {
  const K = window.K;
  const { useState, useEffect, useRef } = React;
  const { html, useApp, Icon, Sheet, Field, Seg, Chips, ToggleRow, Tile, Row, Metric, Bar, EmptyState } = K;

  const Amount = ({ value, onChange, cur, id }) => html`<div class="stack-s" style=${{ alignItems: 'center', gap: '2px' }}><span class="small muted">${K.sym(cur)} · ${cur}</span><input id=${id || 'amount'} class="amount-in num" inputmode="decimal" placeholder="0.00" value=${value} onInput=${(e) => onChange(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))} aria-label="Amount" autofocus /></div>`;
  const Select = ({ value, onChange, options, id, placeholder }) => html`<select id=${id} class="input" value=${value || ''} onChange=${(e) => onChange(e.target.value)}>${placeholder && html`<option value="">${placeholder}</option>`}${options.map(([v, l]) => html`<option key=${v} value=${v}>${l}</option>`)}</select>`;
  const In = ({ id, label, value, onInput, ph, mode, hint, type }) => html`<${Field} label=${label} hint=${hint}><input id=${id} class="input" type=${type || 'text'} value=${value == null ? '' : value} onInput=${onInput} placeholder=${ph || ''} inputmode=${mode || 'text'} /></${Field}>`;
  const useForm = (init) => { const [s, set] = useState(init); return [s, (k) => (e) => set((p) => Object.assign({}, p, { [k]: e && e.target ? e.target.value : e })), set]; };
  const numv = (v) => { const n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? 0 : n; };
  const curOptions = (data) => data.active.filter((c, i, a) => a.indexOf(c) === i);
  const NoPlace = ({ onClose }) => { const { openSheet } = useApp(); return html`<div class="card flat stack-s"><span class="small">You need an account or card to record this.</span><button class="btn sec sm" onClick=${() => openSheet({ k: 'addAccount' })}>Add an account</button></div>`; };

  // ---------------------------------------------------------------- quick add
  const QuickAdd = ({ onClose }) => {
    const { openSheet } = useApp();
    const items = [['expense', 'expense', 'r', 'Add expense', 'Card, cash or account, in any currency'], ['income', 'income', 'g', 'Add income', 'Salary, freelance or a refund'], ['receipt', 'scan', 'p', 'Scan receipt', 'Take a photo; Kipu reads it and you confirm'], ['statement', 'upload', 'b', 'Upload statement', 'Import a CSV or PDF from your bank or card'], ['transfer', 'transfer', 'n', 'Transfer', 'Between accounts, to a goal, or pay a card']];
    return html`<${Sheet} title="Add" sub="Accounts, cards and loans are added in Money. Bills, goals and trips in Plan." onClose=${onClose}>
      <div class="card tight list">${items.map(([k, ic, tone, t, s]) => html`<button key=${k} class="lrow" onClick=${() => openSheet({ k })}><${Tile} icon=${ic} tone=${tone} /><span class="grow stack-s" style=${{ gap: '2px', textAlign: 'left' }}><span class="t1">${t}</span><span class="t2">${s}</span></span><${Icon} n="next" s=${15} c="var(--muted)" /></button>`)}</div></${Sheet}>`;
  };

  const ContextSheet = ({ show, onClose }) => {
    const { ctx, setCtx, data, D } = useApp();
    const curs = ['Combined'].concat(curOptions(data));
    return html`<${Sheet} title="View" sub="Scope, currency and period apply across Kipu." onClose=${onClose}>
      ${data.household.enabled && show.includes('scope') && html`<div class="stack-s"><span class="eyebrow">Scope</span><${Seg} options=${['personal', 'household']} labels=${['Personal', 'Household']} value=${ctx.scope} onChange=${(v) => setCtx({ scope: v })} /><span class="tiny muted">${ctx.scope === 'household' ? 'Only items marked as shared.' : 'Everything that belongs to you.'}</span></div>`}
      ${show.includes('currency') && curs.length > 2 && html`<div class="stack-s"><span class="eyebrow">Currency</span><${Chips} options=${curs} value=${ctx.currency} onChange=${(v) => setCtx({ currency: v })} labels=${curs.map((c) => (c === 'Combined' ? 'All · ' + K.sym(data.base) : c + ' only'))} /></div>`}
      ${show.includes('period') && html`<div class="stack-s"><span class="eyebrow">Period</span><${Chips} options=${[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 'ytd']} value=${ctx.period == null ? 11 : ctx.period} onChange=${(v) => setCtx({ period: v })} labels=${[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((i) => D.series[i].m + ' ' + String(D.series[i].y).slice(2)).concat(['12 months'])} /></div>`}
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
    const [date, setDate] = useState(src.date || K.iso(K.today()));
    const [from, setFrom] = useState(src.from || (places[0] || [])[0] || '');
    const [note, setNote] = useState(src.note || '');
    const [trip, setTrip] = useState(src.trip || (K.activeTrip(data, K.parse(date)) || {}).id || '');
    const [shared, setShared] = useState(src.shared != null ? src.shared : ctx.scope === 'household');
    const guessed = !cat && merchant ? K.guessCat(data, merchant) : null;
    const category = cat || guessed || 'other';
    const v = numv(amt);
    const curs = curOptions(data).concat(src.cur && !data.active.includes(src.cur) ? [src.cur] : []);
    const save = () => {
      const t = { type: 'expense', merchant: merchant.trim() || 'Expense', cat: category, amt: v, cur, from, date, note, trip: trip || null, autoTrip: false, shared, source: preset.source || (item && item.source) || 'manual' };
      let next = item ? K.editTxn(data, item.id, t) : K.addTxn(data, t);
      if (item && (item.merchant !== t.merchant || item.cat !== t.cat || item.date !== t.date || item.note !== t.note || item.trip !== t.trip)) next = K.editTxn(next, item.id, { merchant: t.merchant, cat: t.cat, date: t.date, note: t.note, trip: t.trip, shared: t.shared });
      commit(next);
      const safe = K.derive(next, ctx).plan;
      toast(item ? 'Expense updated' : 'Expense added' + (safe.hasIncome ? ' · Safe to Spend ' + fmt(safe.safe) : ''));
      onClose();
    };
    return html`<${Sheet} title=${item ? 'Edit expense' : preset.source === 'receipt' ? 'Check the receipt' : 'Add expense'} sub=${preset.source === 'receipt' ? 'Kipu read these from the photo. Fix anything that looks wrong.' : null} onClose=${onClose}>
      ${preset.image && html`<img src=${preset.image} alt="Receipt" style=${{ maxHeight: '160px', objectFit: 'contain', borderRadius: '14px', background: 'var(--surface2)' }} />`}
      <${Amount} value=${amt} onChange=${setAmt} cur=${cur} />
      ${curs.length > 1 && html`<${Seg} options=${curs} value=${cur} onChange=${setCur} />`}
      ${cur !== data.base && v > 0 && html`<div class="card flat" style=${{ padding: '12px 14px' }}><div class="between small"><span class="muted">In ${data.base} at today’s rate</span><b class="num">${fmt(K.toBase(data, v, cur), { dec: 2 })}</b></div><span class="tiny muted">The rate is locked when you save.</span></div>`}
      <${In} id="e-merchant" label="Merchant" value=${merchant} onInput=${(e) => setMerchant(e.target.value)} ph="Where did you spend?" />
      <div class="stack-s"><span class="small muted" style=${{ fontWeight: 600 }}>Category${guessed && !cat ? ' · suggested' : ''}</span><div class="chips">${K.CAT_ORDER.map((c) => html`<button key=${c} class=${'chip' + (c === category ? ' on' : '')} onClick=${() => setCat(c)}>${K.CATS[c].name}</button>`)}</div></div>
      ${places.length ? html`<${Field} label="Paid with"><${Select} id="e-from" value=${from} onChange=${setFrom} options=${places} /></${Field}>` : html`<${NoPlace} />`}
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="e-date" label="Date" type="date" value=${date} onInput=${(e) => setDate(e.target.value)} /><${In} id="e-note" label="Note" value=${note} onInput=${(e) => setNote(e.target.value)} ph="Optional" /></div>
      ${(D.trips.length > 0 || data.household.enabled) && html`<div class="card tight list">${D.trips.length > 0 && html`<div class="lrow"><${Tile} icon="plane" tone="b" /><span class="grow t1">Trip</span><select id="e-trip" class="input" style=${{ width: '55%' }} value=${trip} onChange=${(e) => setTrip(e.target.value)}><option value="">None</option>${D.trips.map((t) => html`<option key=${t.id} value=${t.id}>${t.name}</option>`)}</select></div>`}${data.household.enabled && html`<${ToggleRow} title="Share with Household" on=${shared} onChange=${setShared} icon="people" tone="p" />`}</div>`}
      <button class="btn pri block" disabled=${!v || !from} onClick=${save}>${item ? 'Save changes' : 'Add ' + (v ? (cur === data.base ? fmt(v, { dec: 2 }) : fmt.native(v, cur, { dec: 2 })) : 'expense')}</button></${Sheet}>`;
  };

  const IncomeSheet = ({ onClose, item }) => {
    const { data, commit, fmt, toast } = useApp();
    const places = K.whereOptions(data, { cashOnly: true, noCards: true });
    const [f, on] = useForm({ amt: item ? String(item.amt) : '', cur: item ? item.cur : data.base, merchant: item ? item.merchant : '', from: item ? item.from : (places[0] || [])[0] || '', date: item ? item.date : K.iso(K.today()) });
    const v = numv(f.amt);
    const save = () => { const t = { type: 'income', cat: 'income', merchant: f.merchant || 'Income', amt: v, cur: f.cur, from: f.from, date: f.date }; commit(item ? K.editTxn(K.editTxn(data, item.id, t), item.id, { merchant: t.merchant, date: t.date }) : K.addTxn(data, t)); toast(item ? 'Income updated' : 'Income added'); onClose(); };
    return html`<${Sheet} title=${item ? 'Edit income' : 'Add income'} sub="For a one-off payment. Regular pay goes in Plan › income sources." onClose=${onClose}>
      <${Amount} value=${f.amt} onChange=${on('amt')} cur=${f.cur} />${curOptions(data).length > 1 && html`<${Seg} options=${curOptions(data)} value=${f.cur} onChange=${on('cur')} />`}
      <${In} id="i-src" label="From" value=${f.merchant} onInput=${on('merchant')} ph="Employer, client or refund" />
      ${places.length ? html`<${Field} label="Into"><${Select} id="i-to" value=${f.from} onChange=${on('from')} options=${places} /></${Field}>` : html`<${NoPlace} />`}
      <${In} id="i-date" label="Date" type="date" value=${f.date} onInput=${on('date')} />
      <button class="btn pri block" disabled=${!v || !f.from} onClick=${save}>${item ? 'Save changes' : 'Add income'}</button></${Sheet}>`;
  };

  const TransferSheet = ({ onClose, preset }) => {
    const { data, commit, fmt, toast } = useApp();
    preset = preset || {};
    const accts = K.whereOptions(data, { cashOnly: true, noCards: true });
    const goalOpts = data.goals.map((g) => ['goal:' + g.id, 'Goal · ' + g.name]);
    const toOpts = data.cards.map((c) => ['card:' + c.id, 'Pay ' + c.name]).concat(goalOpts, accts);
    const [amt, setAmt] = useState(preset.amount ? String(preset.amount) : '');
    const [from, setFrom] = useState(preset.from || (accts[0] || [])[0] || '');
    const [to, setTo] = useState(preset.toWhere || (preset.goal ? 'goal:' + preset.goal : (toOpts.find((o) => o[0] !== from) || [])[0] || ''));
    const v = numv(amt);
    const save = () => {
      let t = { amt: v, cur: data.base, from };
      if (to.startsWith('goal:')) { const g = data.goals.find((x) => 'goal:' + x.id === to); t = Object.assign(t, { type: 'saving', cat: 'saving', goal: g.id, to: g.linked ? 'acct:' + g.linked : null, merchant: g.name, shared: !!g.shared }); }
      else t = Object.assign(t, { type: 'transfer', cat: 'transfer', to, merchant: (to.startsWith('card:') ? 'Payment to ' : 'Transfer to ') + K.whereName(data, to) });
      commit(K.addTxn(data, t)); toast(to.startsWith('goal:') ? 'Saved to goal' : 'Transfer recorded · not counted as spending'); onClose();
    };
    if (!accts.length) return html`<${Sheet} title="Transfer" onClose=${onClose}><${NoPlace} /></${Sheet}>`;
    return html`<${Sheet} title="Transfer" sub="Transfers and card payments are never counted as spending." onClose=${onClose}>
      <${Amount} value=${amt} onChange=${setAmt} cur=${data.base} />
      <${Field} label="From"><${Select} id="t-from" value=${from} onChange=${setFrom} options=${accts} /></${Field}>
      <${Field} label="To"><${Select} id="t-to" value=${to} onChange=${setTo} options=${toOpts.filter((o) => o[0] !== from)} placeholder="Choose where it goes" /></${Field}>
      <button class="btn pri block" disabled=${!v || !to} onClick=${save}>Move ${v ? fmt(v, { dec: 2 }) : 'money'}</button></${Sheet}>`;
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
    const { data, commit, fmt, toast } = useApp();
    const places = K.whereOptions(data);
    const [where, setWhere] = useState((places[0] || [])[0] || '');
    const [st, setSt] = useState({ step: 'pick' });
    const [sign, setSign] = useState('auto');
    const [cur, setCur] = useState(data.base);
    const isCard = where.startsWith('card:');
    const run = async (file) => {
      if (!file) return;
      setSt({ step: 'reading', name: file.name });
      try {
        const rows = await K.readStatement(file);
        if (!rows.length) { setSt({ step: 'fail', name: file.name }); return; }
        setSt({ step: 'review', name: file.name, rows: rows.map((r, i) => Object.assign({ i, keep: true }, r)) });
      } catch (e) { setSt({ step: 'fail', name: file.name, err: String(e.message || e) }); }
    };
    // Which sign is spending: cards list charges as positive; banks as negative
    const negIsSpend = sign === 'auto' ? !isCard : sign === 'neg';
    const classify = (r) => { const spend = negIsSpend ? r.amt < 0 : r.amt > 0; return { type: spend ? 'expense' : isCard ? 'transfer' : 'income', amt: Math.abs(r.amt) }; };
    const rows = (st.rows || []).map((r) => Object.assign({}, r, classify(r), { dup: !!K.findDuplicate(data, { date: r.date, amt: Math.abs(r.amt) }, where), cat: K.guessCat(data, r.desc) }));
    const chosen = rows.filter((r) => r.keep && !r.dup);
    const doImport = () => {
      let d = data;
      chosen.forEach((r) => { d = K.addTxn(d, { type: r.type, cat: r.type === 'expense' ? r.cat : r.type === 'income' ? 'income' : 'transfer', merchant: r.desc, amt: r.amt, cur, from: r.type === 'transfer' ? null : where, to: r.type === 'transfer' ? where : null, date: r.date, source: 'statement' }); });
      d = Object.assign({}, d, { imports: [{ id: K.uid('i'), name: st.name, when: K.iso(K.today()), count: chosen.length, where }].concat(d.imports) });
      commit(d); toast(chosen.length + ' transactions imported'); onClose();
    };
    const toggle = (i) => setSt(Object.assign({}, st, { rows: st.rows.map((r) => (r.i === i ? Object.assign({}, r, { keep: !r.keep }) : r)) }));
    if (!places.length) return html`<${Sheet} title="Upload statement" onClose=${onClose}><${NoPlace} /></${Sheet}>`;
    return html`<${Sheet} title="Upload statement" sub="CSV from any bank works best. PDFs are read line by line; check the result before importing." onClose=${onClose}>
      ${st.step === 'pick' && html`<${Field} label="Statement for"><${Select} id="s-where" value=${where} onChange=${setWhere} options=${places} /></${Field}>
        <label class="card flat" style=${{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '24px', cursor: 'pointer' }}><${Tile} icon="doc" tone="b" /><span style=${{ fontWeight: 600 }}>Choose a CSV or PDF</span><input id="s-file" type="file" accept=".csv,.pdf,text/csv,application/pdf" style=${{ display: 'none' }} onChange=${(e) => run(e.target.files[0])} /></label>`}
      ${st.step === 'reading' && html`<div class="card flat stack-s" style=${{ alignItems: 'center', padding: '28px' }}><${Tile} icon="doc" tone="b" /><span style=${{ fontWeight: 600 }}>Reading ${st.name}…</span><div style=${{ width: '100%' }}><${Bar} pct=${60} color="var(--info)" /></div></div>`}
      ${st.step === 'fail' && html`<div class="card flat stack-s"><span style=${{ fontWeight: 600 }}>No transactions found in ${st.name}</span><span class="small muted">${st.err ? 'The file couldn’t be read.' : 'Kipu looks for a date, a description and an amount on each line. Try the CSV export from your bank.'}</span><button class="btn sec" onClick=${() => setSt({ step: 'pick' })}>Choose another file</button></div>`}
      ${st.step === 'review' && html`
        <div class="grid g3" style=${{ gap: '8px' }}><div class="card flat" style=${{ padding: '12px' }}><${Metric} label="Found" value=${String(rows.length)} /></div><div class="card flat" style=${{ padding: '12px' }}><${Metric} label="Already in Kipu" value=${String(rows.filter((r) => r.dup).length)} /></div><div class="card flat" style=${{ padding: '12px' }}><${Metric} label="To import" value=${String(chosen.length)} tone="pos" /></div></div>
        <div class="grid g2" style=${{ gap: '8px' }}><${Field} label="Spending shows as"><${Select} id="s-sign" value=${sign} onChange=${setSign} options=${[['auto', isCard ? 'Positive (card)' : 'Negative (bank)'], ['pos', 'Positive amounts'], ['neg', 'Negative amounts']]} /></${Field}><${Field} label="Currency"><${Select} id="s-cur" value=${cur} onChange=${setCur} options=${curOptions(data).map((c) => [c, c])} /></${Field}></div>
        <div class="card tight list" style=${{ maxHeight: '320px', overflowY: 'auto' }}>${rows.map((r) => html`<button key=${r.i} class="lrow" style=${{ opacity: r.dup || !r.keep ? 0.45 : 1 }} onClick=${() => !r.dup && toggle(r.i)}><span class=${'ic ' + (r.dup ? 'n' : r.keep ? 'p' : 'n')} style=${{ width: '26px', height: '26px', borderRadius: '8px' }}><${Icon} n=${r.dup ? 'copy' : r.keep ? 'check' : 'x'} s=${13} w=${2.4} /></span><span class="grow stack-s" style=${{ gap: '1px', textAlign: 'left', minWidth: 0 }}><span class="t1" style=${{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${r.desc}</span><span class="t2">${K.fmtDate(r.date, true)} · ${r.dup ? 'Already in Kipu' : r.type === 'expense' ? K.CATS[r.cat].name : r.type === 'income' ? 'Income' : 'Payment'}</span></span><span class="amt" style=${{ color: r.type === 'income' ? 'var(--pos)' : null }}>${fmt.native(r.amt, cur, { dec: 2 })}</span></button>`)}</div>
        <button class="btn pri block" disabled=${!chosen.length} onClick=${doImport}>Import ${chosen.length} transactions</button>`}</${Sheet}>`;
  };

  // ---------------------------------------------------------------- create and edit
  const Form = ({ title, sub, onClose, children, onSave, cta, disabled, onDelete }) => html`<${Sheet} title=${title} sub=${sub} onClose=${onClose}>${children}<button class="btn pri block" disabled=${disabled} onClick=${onSave}>${cta}</button>${onDelete && html`<button class="btn sec block" style=${{ color: 'var(--crit)' }} onClick=${onDelete}>Delete</button>`}</${Sheet}>`;

  const AddAccount = ({ onClose, item }) => {
    const { data, commit, toast } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { bal: String(item.bal) }) : { name: '', kind: 'Everyday', cur: data.base, bal: '', inst: '', shared: false });
    const save = () => { const a = Object.assign({}, item || {}, { name: f.name || f.kind + ' account', inst: f.inst, kind: f.kind, cur: f.cur, bal: numv(f.bal), shared: !!f.shared }); commit(K.upsert(data, 'accounts', a)); toast(item ? 'Account updated' : 'Account added'); onClose(); };
    return html`<${Form} title=${item ? 'Edit account' : 'Add account'} onClose=${onClose} cta=${item ? 'Save' : 'Add account'} onSave=${save}>
      <${Chips} options=${['Everyday', 'Savings', 'Cash', 'Investments', 'Property']} value=${f.kind} onChange=${on('kind')} />
      <${In} id="aa-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Everyday Chequing" />
      <${In} id="aa-inst" label="Institution" value=${f.inst} onInput=${on('inst')} ph="Optional" />
      <${Field} label="Currency"><${Select} id="aa-cur" value=${f.cur} onChange=${on('cur')} options=${Object.keys(K.CURRENCIES).map((c) => [c, c + ' · ' + K.CURRENCIES[c][1]])} /></${Field}>
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
    const [f, on] = useForm(item ? Object.assign({}, item, { limit: String(item.limit || ''), bal: String(item.bal || ''), stmtBal: String(item.stmtBal || ''), dueDay: String(item.dueDay || ''), minPay: String(item.minPay || '') }) : { name: '', network: 'Visa', last4: '', limit: '', bal: '', stmtBal: '', dueDay: '', minPay: '' });
    const save = () => { commit(K.upsert(data, 'cards', Object.assign({}, item || { style: data.cards.length }, { name: f.name || f.network + ' card', network: f.network, last4: String(f.last4 || '').replace(/\D/g, '').slice(-4), limit: numv(f.limit), bal: numv(f.bal), stmtBal: numv(f.stmtBal), dueDay: parseInt(f.dueDay) || null, minPay: numv(f.minPay), shared: !!f.shared }))); toast(item ? 'Card updated' : 'Card added'); onClose(); };
    return html`<${Form} title=${item ? 'Edit card' : 'Add credit card'} sub="Only the last four digits are stored." onClose=${onClose} cta=${item ? 'Save' : 'Add card'} onSave=${save}>
      <${Chips} options=${['Visa', 'Mastercard', 'Amex', 'Other']} value=${f.network} onChange=${on('network')} />
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="ac-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Travel Visa" /><${In} id="ac-last4" label="Last four" value=${f.last4} onInput=${(e) => on('last4')(e.target.value.replace(/\D/g, '').slice(0, 4))} mode="numeric" /></div>
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="ac-limit" label="Credit limit" value=${f.limit} onInput=${on('limit')} mode="decimal" /><${In} id="ac-bal" label="Current balance" value=${f.bal} onInput=${on('bal')} mode="decimal" /></div>
      <div class="grid g3" style=${{ gap: '10px' }}><${In} id="ac-stmt" label="Statement" value=${f.stmtBal} onInput=${on('stmtBal')} mode="decimal" /><${In} id="ac-min" label="Minimum" value=${f.minPay} onInput=${on('minPay')} mode="decimal" /><${In} id="ac-due" label="Due day" value=${f.dueDay} onInput=${on('dueDay')} mode="numeric" /></div>
      ${data.household.enabled && html`<div class="card tight"><${ToggleRow} title="Share with Household" on=${!!f.shared} onChange=${on('shared')} /></div>`}</${Form}>`;
  };

  const AddLoan = ({ onClose, item }) => {
    const { data, commit, toast, fmt } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { orig: String(item.orig || ''), bal: String(item.bal), rate: String(item.rate || ''), pay: String(item.pay || '') }) : { name: '', kind: 'Vehicle', lender: '', orig: '', bal: '', rate: '', pay: '', freq: 'Monthly', next: K.iso(K.addDays(K.today(), 7)) });
    const loan = { bal: numv(f.bal), rate: numv(f.rate), pay: numv(f.pay), freq: f.freq, next: f.next };
    const p = loan.bal && loan.pay ? K.payoffDate(loan) : null;
    const save = () => { commit(K.upsert(data, 'loans', Object.assign({}, item || {}, { name: f.name || f.kind + ' loan', kind: f.kind, lender: f.lender, orig: numv(f.orig) || numv(f.bal), bal: numv(f.bal), rate: numv(f.rate), pay: numv(f.pay), freq: f.freq, next: f.next, shared: !!f.shared }))); toast(item ? 'Loan updated' : 'Loan added'); onClose(); };
    return html`<${Form} title=${item ? 'Edit loan' : 'Add loan'} sub="Track what you owe and when it’s paid off." onClose=${onClose} cta=${item ? 'Save' : 'Add loan'} onSave=${save} disabled=${!numv(f.bal)}>
      <${Chips} options=${['Vehicle', 'Personal', 'Student', 'Mortgage', 'Line of credit', 'Other']} value=${f.kind} onChange=${on('kind')} />
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="al-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Car loan" /><${In} id="al-lender" label="Lender" value=${f.lender} onInput=${on('lender')} ph="Optional" /></div>
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="al-orig" label="Original amount" value=${f.orig} onInput=${on('orig')} mode="decimal" /><${In} id="al-bal" label="Balance today" value=${f.bal} onInput=${on('bal')} mode="decimal" /></div>
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="al-rate" label="Interest rate %" value=${f.rate} onInput=${on('rate')} mode="decimal" /><${In} id="al-pay" label="Payment" value=${f.pay} onInput=${on('pay')} mode="decimal" /></div>
      <${Chips} options=${['Weekly', 'Bi-weekly', 'Twice monthly', 'Monthly', 'Quarterly']} value=${f.freq} onChange=${on('freq')} />
      <${In} id="al-next" label="Next payment" type="date" value=${f.next} onInput=${on('next')} />
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
    return html`<${Form} title=${'Pay ' + l.name} sub=${'Scheduled payment ' + fmt(l.pay, { dec: 2 }) + ': about ' + fmt(s.principal, { dec: 2 }) + ' principal and ' + fmt(s.interest, { dec: 2 }) + ' interest.'} onClose=${onClose} cta="Record payment" disabled=${!from} onSave=${() => { commit(K.payLoan(data, l.id, from, numv(extra))); toast('Payment recorded · balance updated'); onClose(); }}>
      ${places.length ? html`<${Field} label="Paid from"><${Select} id="pl-from" value=${from} onChange=${setFrom} options=${places} /></${Field}>` : html`<${NoPlace} />`}
      <${In} id="pl-extra" label="Extra toward principal" value=${extra} onInput=${(e) => setExtra(e.target.value)} mode="decimal" ph="Optional" /></${Form}>`;
  };

  const AddGoal = ({ onClose, item }) => {
    const { data, commit, toast, fmt } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { target: String(item.target), monthly: String(item.monthly || ''), saved: String(item.saved || ''), targetDate: item.targetDate || '', linked: item.linked || '' }) : { name: '', target: '', monthly: '', saved: '', targetDate: '', linked: '' });
    const left = numv(f.target) - numv(f.saved), m = numv(f.monthly);
    const eta = m > 0 && left > 0 ? K.addMonths(K.today(), Math.ceil(left / m)) : null;
    const save = () => { commit(K.upsert(data, 'goals', Object.assign({}, item || {}, { name: f.name || 'Goal', target: numv(f.target), monthly: m, saved: numv(f.saved), targetDate: f.targetDate || null, linked: f.linked || null, shared: !!f.shared }))); toast(item ? 'Goal updated' : 'Goal added · its monthly amount counts in Safe to Spend'); onClose(); };
    return html`<${Form} title=${item ? 'Edit goal' : 'Add goal'} onClose=${onClose} cta=${item ? 'Save' : 'Add goal'} onSave=${save} disabled=${!numv(f.target)}>
      <${In} id="ag-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Emergency fund" />
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="ag-target" label="Target" value=${f.target} onInput=${on('target')} mode="decimal" /><${In} id="ag-monthly" label="Monthly amount" value=${f.monthly} onInput=${on('monthly')} mode="decimal" /></div>
      <${Field} label="Linked savings account" hint="If linked, its balance is the goal’s progress."><${Select} id="ag-linked" value=${f.linked} onChange=${on('linked')} options=${data.accounts.filter((a) => a.kind === 'Savings' || a.kind === 'Investments').map((a) => [a.id, a.name])} placeholder="Not linked" /></${Field}>
      ${!f.linked && html`<${In} id="ag-saved" label="Already saved" value=${f.saved} onInput=${on('saved')} mode="decimal" ph="0" />`}
      <${In} id="ag-date" label="Target month" type="month" value=${f.targetDate} onInput=${on('targetDate')} />
      ${eta && html`<div class="card flat between small"><span class="muted">At ${fmt(m)} a month</span><b>Done by ${K.fmtMonth(eta)}</b></div>`}</${Form}>`;
  };

  const AddBill = ({ onClose, item }) => {
    const { data, commit, toast, fmt, ctx } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { amt: String(item.amt), day: String(item.day || 1), month: String(item.month || 1) }) : { name: '', kind: 'Bill', amt: '', cur: data.base, day: '1', month: String(K.today().getMonth() + 1), cat: 'bills', pay: (K.whereOptions(data)[0] || [])[0] || '' });
    const save = () => { const next = K.upsert(data, 'bills', Object.assign({ since: K.iso(K.today()) }, item || {}, { name: f.name || 'Bill', kind: f.kind, amt: numv(f.amt), cur: f.cur || data.base, day: Math.min(28, Math.max(1, parseInt(f.day) || 1)), month: f.kind === 'Annual' ? parseInt(f.month) || 1 : undefined, cat: f.kind === 'Subscription' ? 'subs' : f.cat, pay: f.pay, shared: !!f.shared })); commit(next); const p = K.derive(next, ctx).plan; toast((item ? 'Updated' : 'Added') + (p.hasIncome ? ' · Safe to Spend ' + fmt(p.safe) : '')); onClose(); };
    return html`<${Form} title=${item ? 'Edit ' + item.name : 'Add bill or subscription'} sub="It counts in Safe to Spend and shows up before it’s due." onClose=${onClose} cta=${item ? 'Save' : 'Add'} onSave=${save} disabled=${!numv(f.amt)} onDelete=${item && (() => { commit(K.remove(data, 'bills', item.id)); toast('Deleted'); onClose(); })}>
      <${Seg} options=${['Bill', 'Subscription', 'Annual']} value=${f.kind} onChange=${on('kind')} />
      <${In} id="ab-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Rent, Netflix" />
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="ab-amt" label="Amount" value=${f.amt} onInput=${on('amt')} mode="decimal" /><${In} id="ab-day" label="Day of month" value=${f.day} onInput=${on('day')} mode="numeric" /></div>
      ${f.kind === 'Annual' && html`<${Field} label="Month"><${Select} id="ab-month" value=${f.month} onChange=${on('month')} options=${K.MONTH_LONG.map((m, i) => [String(i + 1), m])} /></${Field}>`}
      ${f.kind !== 'Subscription' && html`<${Field} label="Category"><${Select} id="ab-cat" value=${f.cat} onChange=${on('cat')} options=${K.CAT_ORDER.map((c) => [c, K.CATS[c].name])} /></${Field}>`}
      <${Field} label="Paid with"><${Select} id="ab-pay" value=${f.pay} onChange=${on('pay')} options=${K.whereOptions(data)} placeholder="Not set" /></${Field}></${Form}>`;
  };

  const AddIncomeSource = ({ onClose, item }) => {
    const { data, commit, toast, fmt, ctx } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { amt: String(item.amt) }) : { name: 'Salary', amt: '', cur: data.base, freq: 'Bi-weekly', next: K.iso(K.addDays(K.today(), 7)), to: (K.whereOptions(data, { cashOnly: true, noCards: true })[0] || [])[0] || '' });
    const save = () => { const next = K.upsert(data, 'income', Object.assign({}, item || {}, { name: f.name || 'Income', amt: numv(f.amt), cur: f.cur, freq: f.freq, next: f.next, to: f.to, shared: !!f.shared })); commit(next); const p = K.derive(next, ctx).plan; toast('Income saved · Safe to Spend ' + fmt(p.safe)); onClose(); };
    return html`<${Form} title=${item ? 'Edit income' : 'Add income source'} sub="Regular pay Kipu expects. It isn’t recorded until you add the actual payment." onClose=${onClose} cta="Save" onSave=${save} disabled=${!numv(f.amt)} onDelete=${item && (() => { commit(K.remove(data, 'income', item.id)); toast('Deleted'); onClose(); })}>
      <${In} id="is-name" label="Name" value=${f.name} onInput=${on('name')} />
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="is-amt" label="Amount after tax" value=${f.amt} onInput=${on('amt')} mode="decimal" /><${Field} label="Currency"><${Select} id="is-cur" value=${f.cur} onChange=${on('cur')} options=${curOptions(data).map((c) => [c, c])} /></${Field}></div>
      <${Chips} options=${['Weekly', 'Bi-weekly', 'Twice monthly', 'Monthly']} value=${f.freq} onChange=${on('freq')} />
      <${In} id="is-next" label="Next payday" type="date" value=${f.next} onInput=${on('next')} />
      ${K.whereOptions(data, { cashOnly: true, noCards: true }).length > 0 && html`<${Field} label="Paid into"><${Select} id="is-to" value=${f.to} onChange=${on('to')} options=${K.whereOptions(data, { cashOnly: true, noCards: true })} /></${Field}>`}</${Form}>`;
  };

  const AddTrip = ({ onClose, item }) => {
    const { data, commit, toast } = useApp();
    const [f, on] = useForm(item ? Object.assign({}, item, { budget: String(item.budget || '') }) : { name: '', place: '', start: K.iso(K.addDays(K.today(), 14)), end: K.iso(K.addDays(K.today(), 21)), cur: data.base, budget: '' });
    const save = () => { commit(K.upsert(data, 'trips', Object.assign({}, item || {}, { name: f.name || f.place || 'Trip', place: f.place, start: f.start, end: f.end < f.start ? f.start : f.end, cur: f.cur, budget: numv(f.budget) }))); toast(item ? 'Trip updated' : 'Trip added'); onClose(); };
    return html`<${Form} title=${item ? 'Edit trip' : 'Plan a trip'} onClose=${onClose} cta=${item ? 'Save' : 'Add trip'} onSave=${save}>
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="at-name" label="Name" value=${f.name} onInput=${on('name')} ph="e.g. Lima 2026" /><${In} id="at-place" label="Destination" value=${f.place} onInput=${on('place')} /></div>
      <div class="grid g2" style=${{ gap: '10px' }}><${In} id="at-start" label="Start" type="date" value=${f.start} onInput=${on('start')} /><${In} id="at-end" label="End" type="date" value=${f.end} onInput=${on('end')} /></div>
      <div class="grid g2" style=${{ gap: '10px' }}><${Field} label="Local currency"><${Select} id="at-cur" value=${f.cur} onChange=${on('cur')} options=${Object.keys(K.CURRENCIES).map((c) => [c, c])} /></${Field}><${In} id="at-budget" label=${'Budget (' + data.base + ')'} value=${f.budget} onInput=${on('budget')} mode="decimal" /></div>
      <span class="tiny muted">Expenses in the trip currency during these dates are tagged to it automatically.</span></${Form}>`;
  };

  const CreateHousehold = ({ onClose }) => {
    const { data, commit, toast } = useApp();
    const [name, setName] = useState(data.household.name || '');
    return html`<${Form} title="Household" sub="Mark accounts, bills and goals as shared, then switch the scope to see only shared money. Inviting other people needs cloud sync, which comes later." onClose=${onClose} cta="Turn on Household" onSave=${() => { commit(Object.assign({}, data, { household: { enabled: true, name: name || 'Home' } })); toast('Household on · use the scope switch to view shared items'); onClose(); }}>
      <${In} id="hh-name" label="Name" value=${name} onInput=${(e) => setName(e.target.value)} ph="e.g. Home" /></${Form}>`;
  };

  K.SHEETS = { quickAdd: QuickAdd, context: ContextSheet, expense: ExpenseSheet, income: IncomeSheet, transfer: TransferSheet, receipt: ReceiptSheet, statement: StatementSheet, addAccount: AddAccount, adjust: AdjustSheet, addCard: AddCard, addLoan: AddLoan, payLoan: PayLoan, addGoal: AddGoal, addBill: AddBill, addIncomeSource: AddIncomeSource, addTrip: AddTrip, createHousehold: CreateHousehold };
})();
