/* Kipu · reading receipts (OCR in the browser) and bank or card statements (CSV and PDF). Nothing leaves the device. */
(function () {
  const K = window.K;
  const loadScript = (src) => new Promise((res, rej) => { if (document.querySelector('script[src="' + src + '"]')) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); });

  // ---------------------------------------------------------------- amounts and dates in free text
  const MONTHS = { jan: 0, ene: 0, feb: 1, mar: 2, apr: 3, abr: 3, may: 4, jun: 5, jul: 6, aug: 7, ago: 7, sep: 8, set: 8, oct: 9, nov: 10, dec: 11, dic: 11 };
  const num = (s) => {
    s = String(s).replace(/[^\d.,-]/g, '');
    if (!s) return NaN;
    const lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.'); // 1.234,56
    else s = s.replace(/,/g, '');
    return parseFloat(s);
  };
  K.parseAmount = num;
  const AMT = /(?:S\/\.?|US\$|CA\$|\$|€|£)?\s*-?\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2}(?!\d)/g;
  // Month names count only as whole words, so "14 MARKET" or "3 DECATHLON" are never read as March or December
  const MONTH_WORD = { jan: 0, january: 0, ene: 0, enero: 0, feb: 1, february: 1, febrero: 1, mar: 2, march: 2, marzo: 2, apr: 3, april: 3, abr: 3, abril: 3, may: 4, mayo: 4, jun: 5, june: 5, junio: 5, jul: 6, july: 6, julio: 6, aug: 7, august: 7, ago: 7, agosto: 7, sep: 8, sept: 8, september: 8, set: 8, setiembre: 8, septiembre: 8, oct: 9, october: 9, octubre: 9, nov: 10, november: 10, noviembre: 10, dec: 11, december: 11, dic: 11, diciembre: 11 };
  const monthOf = (w) => { const k = String(w || '').toLowerCase().replace(/\.$/, ''); return Object.prototype.hasOwnProperty.call(MONTH_WORD, k) ? MONTH_WORD[k] : null; };
  const valid = (y, m, d) => { const x = new Date(y, m, d); return x.getFullYear() === y && x.getMonth() === m && x.getDate() === d ? x : null; };
  // Without a year the current one is used and the date is flagged, so the statement can fix it later
  const withYear = (mo, day, ytok) => { if (/^\d{4}$/.test(ytok || '')) return valid(+ytok, mo, day); const d = valid(new Date().getFullYear(), mo, day); if (d) d.noYear = true; return d; };
  K.parseDateText = (s, preferDMY) => {
    s = String(s || '').trim();
    let m;
    if ((m = /(?:^|[^\d])(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/.exec(s))) return valid(+m[1], +m[2] - 1, +m[3]);
    if ((m = /^(20\d{2})(\d{2})(\d{2})$/.exec(s))) return valid(+m[1], +m[2] - 1, +m[3]); // 20260814
    if ((m = /(?:^|[^\d])(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?!\d)/.exec(s))) {
      const a = +m[1], b = +m[2]; let y = +m[3]; if (y < 100) y += 2000;
      let day = a, mon = b;
      if (!preferDMY && b <= 12 && a <= 12) { mon = a; day = b; }
      if (a > 12) { day = a; mon = b; }
      if (b > 12) { day = b; mon = a; }
      return valid(y, mon - 1, day);
    }
    const tok = s.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    for (let i = 0; i < tok.length; i++) {
      const a = tok[i];
      let mo = monthOf(a), mm;
      if (mo != null && /^\d{1,2}$/.test(tok[i + 1] || '')) return withYear(mo, +tok[i + 1], tok[i + 2]);
      if (/^\d{1,2}$/.test(a)) {
        let k = i + 1; if (/^de$/i.test(tok[k] || '')) k++;
        mo = monthOf(tok[k]);
        if (mo != null) { k++; if (/^(de|del)$/i.test(tok[k] || '')) k++; return withYear(mo, +a, tok[k]); }
      }
      if ((mm = /^(\d{1,2})([a-z]{3,9})\.?(\d{4})?$/i.exec(a)) && monthOf(mm[2]) != null) return withYear(monthOf(mm[2]), +mm[1], mm[3]); // 14AUG
      if ((mm = /^([a-z]{3,9})\.?(\d{1,2})$/i.exec(a)) && monthOf(mm[1]) != null) return withYear(monthOf(mm[1]), +mm[2], tok[i + 1]); // AUG14
    }
    return null;
  };
  // 05/08/2026: day/month or month/day, decided once for the whole file. A day over 12 settles it;
  // otherwise the reading that keeps the statement in order and nothing in the future wins, then the country's habit.
  K.dateOrder = (values, preferDMY) => {
    const pairs = values.map((v) => /(?:^|[^\d])(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?!\d)/.exec(String(v || ''))).filter(Boolean);
    if (!pairs.length) return !!preferDMY;
    if (pairs.some((p) => +p[1] > 12)) return true;
    if (pairs.some((p) => +p[2] > 12)) return false;
    const soon = K.addDays(K.today(), 3);
    const score = (dmy) => {
      const ds = values.map((v) => K.parseDateText(v, dmy)).filter(Boolean);
      let up = 0, down = 0;
      ds.slice(1).forEach((d, i) => { if (d < ds[i]) down++; else if (d > ds[i]) up++; });
      return Math.min(up, down) + ds.filter((d) => d > soon).length * 5;
    };
    const a = score(true), b = score(false);
    return a === b ? !!preferDMY : a < b;
  };
  // Dates printed without a year take the statement's year; a December line on a January statement is last year
  K.settleYears = (rows, end) => {
    if (!rows.some((r) => r.noYear)) return rows;
    end = end || K.today();
    const lim = K.addDays(end, 3);
    return rows.map((r) => {
      if (!r.noYear) return r;
      const p = K.parse(r.date);
      let d = new Date(end.getFullYear(), p.getMonth(), p.getDate());
      if (d > lim) d = new Date(end.getFullYear() - 1, p.getMonth(), p.getDate());
      const o = Object.assign({}, r, { date: K.iso(d) }); delete o.noYear; return o;
    });
  };
  // The latest full date printed anywhere (statement period, statement date): where the statement ends
  const statementEnd = (lines) => {
    const max = K.addDays(K.today(), 31);
    let end = null;
    lines.slice(0, 400).forEach((l) => {
      // "Statement period: July 15 to August 14, 2026" has two dates; only the one with a year counts
      const tok = String(l).replace(/,/g, ' ').split(/\s+/).filter(Boolean).slice(0, 40);
      tok.forEach((_, i) => { const d = K.parseDateText(tok.slice(i, i + 3).join(' ')); if (d && !d.noYear && d <= max && d.getFullYear() > 2000 && (!end || d > end)) end = d; });
    });
    return end;
  };
  const firstTokens = (l, n) => String(l || '').split(/\s+/).slice(0, n || 4).join(' ');
  // Card statements print two dates (transaction and posting) before the description: drop both
  const stripDates = (text) => {
    let t = String(text || '').replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    for (let n = 0; n < 2 && t.length; n++) {
      if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$|^\d{1,2}[-/.]\d{1,2}([-/.]\d{2,4})?$|^20\d{6}$/.test(t[0])) t = t.slice(1);
      else if (monthOf(t[0]) != null && /^\d{1,2}$/.test(t[1] || '')) t = t.slice(/^\d{4}$/.test(t[2] || '') ? 3 : 2);
      else if (/^\d{1,2}$/.test(t[0]) && monthOf(t[1]) != null) t = t.slice(/^\d{4}$/.test(t[2] || '') ? 3 : 2);
      else if ((/^(\d{1,2})([a-z]{3,9})\.?(\d{4})?$/i.test(t[0]) && monthOf(t[0].replace(/[\d.]/g, '')) != null) || (/^([a-z]{3,9})\.?(\d{1,2})$/i.test(t[0]) && monthOf(t[0].replace(/[\d.]/g, '')) != null)) t = t.slice(1);
      else break;
    }
    return t.join(' ');
  };
  const detectCur = (text, fallback) => (/S\/|soles|PEN\b/i.test(text) ? 'PEN' : /US\$|USD\b/i.test(text) ? 'USD' : /€|EUR\b/i.test(text) ? 'EUR' : /£|GBP\b/i.test(text) ? 'GBP' : /MX\$|MXN\b/i.test(text) ? 'MXN' : /CA\$|CAD\b/i.test(text) ? 'CAD' : fallback);

  // ---------------------------------------------------------------- receipts
  K.readReceipt = async (file, onProgress) => {
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
    const res = await window.Tesseract.recognize(file, 'eng+spa', { logger: (m) => { if (onProgress && m.status === 'recognizing text') onProgress(Math.round(m.progress * 100)); else if (onProgress && m.status) onProgress(null, m.status); } });
    return res.data.text || '';
  };
  K.parseReceipt = (text, base) => {
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const merchant = (lines.find((l) => /[a-záéíóúñ]{3,}/i.test(l) && !/receipt|recibo|boleta|factura|ruc|tel|www|http|date|fecha/i.test(l)) || '').replace(/[^\w\s&'.-áéíóúñÁÉÍÓÚÑ]/g, '').trim().slice(0, 40);
    let total = null;
    const totalLine = lines.slice().reverse().find((l) => /\b(total|importe total|amount due|total a pagar|balance due|grand total)\b/i.test(l) && !/sub\s*-?total|subtotal/i.test(l));
    if (totalLine) { const am = totalLine.match(AMT); if (am) total = num(am[am.length - 1]); }
    if (total == null) { const all = (text.match(AMT) || []).map(num).filter((n) => !isNaN(n) && n < 100000); if (all.length) total = Math.max(...all); }
    let date = null;
    for (const l of lines) { const d = K.parseDateText(l, true); if (d && !isNaN(d) && d.getFullYear() > 2000) { date = d; break; } }
    return { merchant, total, date: date ? K.iso(date) : K.iso(K.today()), cur: detectCur(text, base), lines: lines.length };
  };

  // ---------------------------------------------------------------- statements
  // Splits the whole file, so a quoted description with a line break stays in its row
  const csvRows = (text, sep) => {
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') { if (q && text[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (ch === sep && !q) { row.push(cur.trim()); cur = ''; }
      else if ((ch === '\n' || ch === '\r') && !q) { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur.trim()); if (row.some((c) => c)) rows.push(row); row = []; cur = ''; }
      else cur += q && (ch === '\n' || ch === '\r') ? ' ' : ch;
    }
    row.push(cur.trim()); if (row.some((c) => c)) rows.push(row);
    return rows;
  };
  const HEAD = { type: /^(transaction )?(type|tipo)$|^(dr|cr)\s*\/\s*(cr|dr)$|^(debit|credit)\s*\/\s*(credit|debit)$/, date: /date|fecha/, desc: /desc|payee|merchant|detalle|concepto|name|memo|narrative|details|transaction$/, debit: /debit|cargo|withdraw|retiro|paid out|money out/, credit: /credit|abono|deposit|paid in|money in/, amount: /amount|monto|importe|value|valor|^(cad|usd|pen|eur|mxn|gbp)\s*\$?$|^\$$|\$\s*$/, balance: /balance|saldo/ };
  const isNumCell = (v) => v === '' || /^[-+(]?\s*(?:S\/\.?|US\$|CA\$|\$|€|£)?\s*[-+]?\d[\d.,\s]*\)?\s*(?:CR|DR)?$/i.test(v);
  K.parseCSV = (text, opts) => {
    text = String(text || '').replace(/^﻿/, '');
    const first = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 5).join('\n');
    const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? '\t' : ',';
    let rows = csvRows(text, sep);
    if (!rows.length) return [];
    // The header can sit below a few lines of account details
    const isHead = (r) => { const h = r.map((c) => c.toLowerCase()); return h.some((c) => HEAD.date.test(c)) && h.some((c) => HEAD.desc.test(c) || HEAD.amount.test(c) || HEAD.debit.test(c) || HEAD.credit.test(c)); };
    const hi = rows.slice(0, 15).findIndex(isHead);
    let iDate = -1, iType = -1, iDebit = -1, iCredit = -1;
    let iDescs = [], iAmts = [];
    if (hi >= 0) {
      rows[hi].map((c) => c.toLowerCase()).forEach((h, i) => {
        if (iType < 0 && HEAD.type.test(h)) iType = i;
        else if (iDate < 0 && HEAD.date.test(h)) iDate = i;
        else if (HEAD.balance.test(h)) return;
        else if (HEAD.debit.test(h) && iDebit < 0) iDebit = i;
        else if (HEAD.credit.test(h) && iCredit < 0) iCredit = i;
        else if (HEAD.amount.test(h)) iAmts.push(i);
        else if (HEAD.desc.test(h)) iDescs.push(i);
      });
      rows = rows.slice(hi + 1);
    }
    // No header (TD, Scotiabank…): work the columns out from the rows themselves
    if (iDate < 0 || (!iAmts.length && iDebit < 0 && iCredit < 0) || !iDescs.length) {
      const sample = rows.filter((r) => r.some((c) => K.parseDateText(c))).slice(0, 40);
      const cols = Math.max(0, ...sample.map((r) => r.length));
      const frac = (i, f) => sample.filter((r) => f(r[i] || '')).length / (sample.length || 1);
      if (iDate < 0) { let best = 0; for (let i = 0; i < cols; i++) { const f = frac(i, (v) => !!K.parseDateText(v)); if (f > best && f >= 0.8) { best = f; iDate = i; } } }
      const nums = []; for (let i = 0; i < cols; i++) if (i !== iDate && frac(i, isNumCell) >= 0.95 && frac(i, (v) => v !== '') > 0) nums.push(i);
      if (!iAmts.length && iDebit < 0 && iCredit < 0) {
        // Two neighbouring money columns where each row fills exactly one: withdrawals and deposits
        const pair = nums.find((i) => nums.includes(i + 1) && frac(i, () => true) && sample.filter((r) => ((r[i] || '') !== '') !== ((r[i + 1] || '') !== '')).length >= sample.length * 0.8);
        if (pair != null) { iDebit = pair; iCredit = pair + 1; }
        else { const full = nums.filter((i) => frac(i, (v) => v !== '') >= 0.9); if (full.length) iAmts = [full[0]]; } // a second full column is the running balance
      }
      // Description can be split over several columns ("POS PURCHASE", "METRO"): keep every text column
      if (!iDescs.length) { let best = -1, bi = -1; for (let i = 0; i < cols; i++) { if (i === iDate || nums.includes(i)) continue; const f = frac(i, (v) => /[a-z]{2}/i.test(v)); if (f >= 0.5) iDescs.push(i); if (f > best) { best = f; bi = i; } } if (!iDescs.length && bi >= 0) iDescs = [bi]; }
    }
    if (iDate < 0) return [];
    const dmy = K.dateOrder(rows.map((r) => r[iDate] || ''), opts && opts.dmy);
    return K.settleYears(rows.map((r) => {
      const d = K.parseDateText(r[iDate] || '', dmy);
      let amt = NaN, dir = null;
      for (const i of iAmts) { const v = num(r[i] || ''); if (!isNaN(v) && v !== 0) { amt = /\(|CR\s*$/i.test(r[i]) && v > 0 ? -v : v; break; } }
      // Separate Withdrawal and Deposit columns: money out and money in
      if (iDebit >= 0 || iCredit >= 0) { const db = iDebit >= 0 ? num(r[iDebit]) : NaN, cr = iCredit >= 0 ? num(r[iCredit]) : NaN; if (!isNaN(db) && db) { amt = -Math.abs(db); dir = 'out'; } else if (!isNaN(cr) && cr) { amt = Math.abs(cr); dir = 'in'; } }
      // A Type column saying Withdrawal / Deposit, Debit / Credit
      if (iType >= 0 && !isNaN(amt)) { const t = K.moneyDir(r[iType]); if (t) { dir = t; amt = t === 'out' ? -Math.abs(amt) : Math.abs(amt); } }
      const desc = iDescs.map((i) => r[i] || '').filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      return { date: d && !isNaN(d) ? K.iso(d) : null, noYear: !!(d && d.noYear), desc, amt, dir };
    }).filter((x) => x.date && !isNaN(x.amt) && x.amt !== 0 && x.desc && !K.isBalanceLine(x.desc)), statementEnd(rows.map((r) => r.join(' '))));
  };
  // Summary lines of a statement, not movements: "Opening balance", "Balance forward", "Saldo anterior", "Total deposits"…
  K.isBalanceLine = (text) => {
    const m = String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
    return /\b(opening|closing|previous|prior|beginning|starting|ending|statement|final|carried) balance\b|\bbalance (forward|brought forward|carried forward|b f|c f)\b|\b(brought|carried) forward\b|\bsaldo (anterior|inicial|final|actual|disponible|al corte|del periodo|previo)\b|^(sub ?total|total)$|^(sub ?total|total) (deposits|withdrawals|debits|credits|payments|purchases|fees|interest|abonos|cargos|depositos|retiros|pagos|compras|a pagar|del mes|del periodo)\b|\btotal (deposits|withdrawals|debits|credits|abonos|cargos|depositos|retiros)\b|^balance$|^saldo$/.test(m);
  };
  // Words that say which way money went: withdrawal, purchase, fee → out; deposit, payroll, credit → in
  K.moneyDir = (text) => {
    const m = String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/\b(deposit|deposito|payroll|nomina|sueldo|credit|credito|abono|refund|reembolso|interest|interes|transfer from|received|recibido)\b|^cr$/.test(m)) return 'in';
    if (/\b(withdrawal|withdraw|retiro|debit|debito|purchase|compra|payment|pago|fee|cargo|comision|atm|transfer to|bill pay|e-transfer sent|sent|cheque|check)\b|^dr$/.test(m)) return 'out';
    return null;
  };
  K.readPDFRows = async (file) => {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    const out = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const c = await (await pdf.getPage(p)).getTextContent();
      // Items a few points apart vertically are the same printed line (amounts often sit slightly higher than text)
      const items = c.items.filter((it) => it.str.trim()).map((it) => ({ x: it.transform[4], y: it.transform[5], w: it.width || 0, h: Math.abs(it.transform[3]) || 8, s: it.str.trim() })).sort((a, b) => b.y - a.y);
      const lines = [];
      items.forEach((it) => { const l = lines.find((x) => Math.abs(x.y - it.y) <= Math.max(2.5, Math.min(it.h, x.h) * 0.45)); if (l) l.items.push(it); else lines.push({ y: it.y, h: it.h, items: [it] }); });
      lines.sort((a, b) => b.y - a.y).forEach((l) => out.push(l.items.sort((a, b) => a.x - b.x)));
    }
    return out;
  };
  // A chequing PDF: Date | Description | Withdrawals | Deposits | Balance. Each amount goes to the column it sits under.
  const ONEAMT = /^(?:S\/\.?|US\$|CA\$|\$|€|£)?\s*-?\(?\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2}\)?(?:\s*(?:CR|DR|-))?$/;
  const NOT_TX = /\b(credit limit|l[ií]mite|minimum|m[ií]nimo|payment due|due date|fecha de pago|available|disponible|points|puntos|rewards|annual interest|interest rate|tasa|apr|account number|n[uú]mero de cuenta|page|p[aá]gina|statement date|fecha de corte)\b/i;
  K.parseStatementRows = (rows, opts) => {
    let cols = null;
    const out = [];
    let lastBal = null, lastDate = null, pending = null, justPushed = false;
    const lines = rows.map((items) => items.map((i) => i.s).join(' '));
    const dmy = K.dateOrder(lines.map((l) => firstTokens(l, 2)), opts && opts.dmy);
    rows.forEach((items) => {
      const line = items.map((i) => i.s).join(' ');
      const low = line.toLowerCase();
      // Header row: remember where each money column sits
      if (/withdraw|debit|retiro|cargo|paid out|money out/.test(low) && /deposit|credit|abono|paid in|money in/.test(low)) {
        cols = {};
        items.forEach((i) => { const t = i.s.toLowerCase(), c = i.x + i.w / 2; if (/withdraw|debit|retiro|cargo|paid out|money out/.test(t)) cols.out = c; else if (/deposit|credit|abono|paid in|money in/.test(t)) cols.in = c; else if (/balance|saldo/.test(t)) cols.bal = c; });
        return;
      }
      const amts = items.filter((i) => ONEAMT.test(i.s));
      // "Opening balance 1,000.00": where the statement starts; it tells the direction of the first movement
      if (K.isBalanceLine(items.filter((i) => !ONEAMT.test(i.s) && !K.parseDateText(i.s)).map((i) => i.s).join(' '))) { if (amts.length) lastBal = num(amts[amts.length - 1].s); return; }
      let d = K.parseDateText(firstTokens(line, 3), dmy);
      const text = stripDates(items.filter((i) => !ONEAMT.test(i.s)).map((i) => i.s).join(' ')).replace(/\s+/g, ' ').trim();
      if (!amts.length) {
        // A dated line without an amount: its amount comes on the next line. An undated one right after a movement continues its description.
        if (d && !isNaN(d)) pending = { d, text };
        else if (pending) pending.text = (pending.text + ' ' + text).trim();
        else if (justPushed && text.length >= 2 && text.length <= 60 && !/page|pagina|continued|continua/i.test(text)) out[out.length - 1].desc = (out[out.length - 1].desc + ' ' + text).slice(0, 80);
        justPushed = false;
        return;
      }
      let desc = text;
      if (!d || isNaN(d)) {
        // Banks print the date once per day: later lines of that day have none. Summary figures (limit, minimum payment, points) are not movements.
        if (NOT_TX.test(text)) { pending = null; return; }
        if (pending) { d = pending.d; desc = (pending.text + ' ' + text).trim(); }
        else if (lastDate && text.length >= 2) d = lastDate;
        else return;
      } else if (pending && !text) desc = pending.text;
      pending = null;
      if (desc.length < 2 || (desc !== text && NOT_TX.test(desc))) return;
      let amt = null, dir = null, bal = null;
      if (cols && (cols.out != null || cols.in != null)) {
        amts.forEach((a) => {
          const c = a.x + a.w / 2, v = Math.abs(num(a.s));
          const near = ['out', 'in', 'bal'].filter((k) => cols[k] != null).sort((p, q) => Math.abs(cols[p] - c) - Math.abs(cols[q] - c))[0];
          if (near === 'bal') bal = num(a.s); else if (amt == null) { amt = near === 'out' ? -v : v; dir = near; }
        });
      }
      if (amt == null) {
        // No usable header: with a running balance, the change in balance tells the direction
        const vals = amts.map((a) => num(a.s));
        const v = Math.abs(vals.length > 1 ? vals[vals.length - 2] : vals[0]);
        bal = vals.length > 1 ? vals[vals.length - 1] : null;
        if (bal != null && lastBal != null && Math.abs(Math.abs(bal - lastBal) - v) < 0.02) { dir = bal < lastBal ? 'out' : 'in'; amt = dir === 'out' ? -v : v; }
        else { const raw = amts[vals.length > 1 ? vals.length - 2 : 0].s; amt = /(CR|\))\s*$|^\(/.test(raw) || /-\s*$/.test(raw) ? -v : vals.length > 1 ? v : vals[0]; }
      }
      if (bal != null) lastBal = bal;
      justPushed = false;
      if (amt) { out.push({ date: K.iso(d), noYear: !!d.noYear, desc: desc.slice(0, 80), amt, dir }); lastDate = d; justPushed = true; }
    });
    return K.settleYears(out, statementEnd(lines));
  };
  K.readPDFText = async (file) => {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    const out = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const c = await (await pdf.getPage(p)).getTextContent();
      const rows = {};
      c.items.forEach((it) => { const y = Math.round(it.transform[5]); (rows[y] = rows[y] || []).push([it.transform[4], it.str]); });
      Object.keys(rows).sort((a, b) => b - a).forEach((y) => out.push(rows[y].sort((a, b) => a[0] - b[0]).map((x) => x[1]).join(' ').replace(/\s+/g, ' ').trim()));
    }
    return out;
  };
  K.parseStatementLines = (lines, opts) => {
    const out = [];
    const dmy = K.dateOrder(lines.map((l) => firstTokens(l, 2)), opts && opts.dmy);
    lines.forEach((l) => {
      const d = K.parseDateText(firstTokens(l, 3), dmy);
      if (!d || isNaN(d)) return;
      const amts = l.match(AMT); if (!amts) return;
      const raw = amts[amts.length > 1 && /balance|saldo/i.test(l) ? amts.length - 2 : amts.length - 1];
      let amt = num(raw); if (/-\s*$|CR\b/.test(l.slice(l.indexOf(raw) + raw.length, l.indexOf(raw) + raw.length + 4))) amt = -amt;
      const desc = stripDates(l.replace(AMT, '')).replace(/\bCR\b\s*$/, '').replace(/\s+/g, ' ').trim();
      if (desc.length >= 2 && !K.isBalanceLine(desc)) out.push({ date: K.iso(d), noYear: !!d.noYear, desc: desc.slice(0, 60), amt });
    });
    return K.settleYears(out, statementEnd(lines));
  };
  // opts.dmy: day before month when a date could be read both ways (most countries; Canada and the US write month first)
  K.readStatement = async (file, opts) => {
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.pdf') || file.type === 'application/pdf') { const rows = K.parseStatementRows(await K.readPDFRows(file), opts); return rows.length ? rows : K.parseStatementLines(await K.readPDFText(file), opts); }
    return K.parseCSV(await file.text(), opts);
  };
  // Existing transactions that look like the same purchase (same amount within 3 days)
  // Same account or card, same amount, within 3 days and the same shop (one typed by hand counts the same day)
  // `used`: movements already matched to another line of the same file, so two coffees on two days aren't both taken for one
  K.findDuplicate = (data, row, where, used) => {
    const w1 = (x) => (K.merchantKey(x) || String(x || '').toLowerCase()).split(' ')[0];
    const key = w1(row.desc);
    const gapOf = (t) => Math.abs(K.days(K.parse(t.date), K.parse(row.date)));
    return data.txns.filter((t) => {
      if (used && used.has(t.id)) return false;
      if (Math.abs(Math.abs(t.amt) - Math.abs(row.amt)) >= 0.01) return false;
      if (where && t.from !== where && t.to !== where) return false;
      const gap = gapOf(t);
      if (gap > 3) return false;
      return (key && w1(t.merchant) === key) || (t.source !== 'statement' && gap <= 1);
    }).sort((a, b) => gapOf(a) - gapOf(b))[0];
  };
  // Every line of a file against what's already in Kipu, one match each; exact dates are matched first
  K.markDuplicates = (data, rows, where) => {
    const used = new Set(), out = {};
    rows.map((r, i) => ({ r, i })).sort((a, b) => (a.r.date < b.r.date ? -1 : a.r.date > b.r.date ? 1 : 0)).forEach(({ r, i }) => {
      const t = K.findDuplicate(data, { date: r.date, amt: Math.abs(r.amt), desc: r.desc }, where, used);
      if (t) { used.add(t.id); out[i] = t; }
    });
    return out;
  };

  // ---------------------------------------------------------------- downloads
  K.download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  K.toCSV = (data) => {
    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['date', 'type', 'merchant', 'category', 'amount', 'currency', 'amount_' + data.base, 'account', 'note'];
    const src = (w) => { if (!w) return ''; const [k, id] = w.split(':'); const x = (k === 'card' ? data.cards : data.accounts).find((a) => a.id === id); return x ? x.name : ''; };
    return [head.join(',')].concat(data.txns.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).map((t) => [t.date, t.type, t.merchant, (K.CATS[t.cat] || {}).name || t.cat, t.amt, t.cur, t.base, src(t.from), t.note].map(esc).join(','))).join('\n');
  };
})();
