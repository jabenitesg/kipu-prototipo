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
  K.parseDateText = (s, preferDMY) => {
    let m;
    if ((m = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s))) return new Date(+m[1], +m[2] - 1, +m[3]);
    if ((m = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(s))) {
      let a = +m[1], b = +m[2], y = +m[3]; if (y < 100) y += 2000;
      let day = a, mon = b; if (!preferDMY && b <= 12 && a <= 12) { mon = a; day = b; } if (a > 12) { day = a; mon = b; } if (b > 12) { day = b; mon = a; }
      return new Date(y, mon - 1, day);
    }
    if ((m = /(\d{1,2})\s*(?:de\s+)?([a-záé]{3})[a-z]*\.?\s*(?:de\s+)?(\d{4})?/i.exec(s)) && MONTHS[m[2].toLowerCase().slice(0, 3)] != null) return new Date(m[3] ? +m[3] : new Date().getFullYear(), MONTHS[m[2].toLowerCase().slice(0, 3)], +m[1]);
    if ((m = /([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s*(\d{4})?/i.exec(s)) && MONTHS[m[1].toLowerCase().slice(0, 3)] != null) return new Date(m[3] ? +m[3] : new Date().getFullYear(), MONTHS[m[1].toLowerCase().slice(0, 3)], +m[2]);
    return null;
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
  const splitCSV = (line, sep) => { const out = []; let cur = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === sep && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((s) => s.trim()); };
  K.parseCSV = (text) => {
    const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
    if (!lines.length) return [];
    const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : lines[0].includes('\t') ? '\t' : ',';
    let rows = lines.map((l) => splitCSV(l, sep));
    const head = rows[0].map((h) => h.toLowerCase());
    const hasHeader = head.some((h) => /date|fecha|description|descrip|amount|monto|importe|debit|credit|cargo|abono|payee|merchant|detalle|withdraw|deposit|retiro/.test(h));
    let iDate = -1, iDesc = -1, iAmt = -1, iDebit = -1, iCredit = -1, iType = -1;
    if (hasHeader) {
      head.forEach((h, i) => {
        if (iType < 0 && /^(transaction )?(type|tipo)$|^(dr|cr)\s*\/\s*(cr|dr)$|^(debit|credit)\s*\/\s*(credit|debit)$/.test(h)) iType = i;
        else if (iDate < 0 && /date|fecha/.test(h)) iDate = i;
        else if (iDesc < 0 && /desc|payee|merchant|detalle|concepto|name|memo/.test(h)) iDesc = i;
        else if (/debit|cargo|withdraw|retiro/.test(h)) iDebit = i;
        else if (/credit|abono|deposit/.test(h)) iCredit = i;
        else if (iAmt < 0 && /amount|monto|importe|value|valor/.test(h)) iAmt = i;
      });
      rows = rows.slice(1);
    }
    if (iDate < 0 || (iAmt < 0 && iDebit < 0)) {
      const sample = rows.slice(0, 8);
      const cols = sample[0] ? sample[0].length : 0;
      for (let i = 0; i < cols; i++) {
        const vals = sample.map((r) => r[i] || '');
        if (iDate < 0 && vals.every((v) => K.parseDateText(v))) iDate = i;
        else if (iAmt < 0 && iDebit < 0 && vals.every((v) => v === '' || !isNaN(num(v)))) iAmt = i;
        else if (iDesc < 0 && vals.some((v) => /[a-z]{3}/i.test(v))) iDesc = i;
      }
    }
    return rows.map((r) => {
      const d = K.parseDateText(r[iDate] || '');
      let amt = iAmt >= 0 ? num(r[iAmt]) : NaN;
      let dir = null;
      // Separate Withdrawal and Deposit columns: money out and money in
      if (iDebit >= 0 || iCredit >= 0) { const db = iDebit >= 0 ? num(r[iDebit]) : NaN, cr = iCredit >= 0 ? num(r[iCredit]) : NaN; if (!isNaN(db) && db) { amt = -Math.abs(db); dir = 'out'; } else if (!isNaN(cr) && cr) { amt = Math.abs(cr); dir = 'in'; } }
      // A Type column saying Withdrawal / Deposit, Debit / Credit
      if (iType >= 0 && !isNaN(amt)) { const t = K.moneyDir(r[iType]); if (t) { dir = t; amt = t === 'out' ? -Math.abs(amt) : Math.abs(amt); } }
      return { date: d && !isNaN(d) ? K.iso(d) : null, desc: (r[iDesc] || '').replace(/\s+/g, ' ').trim(), amt, dir };
    }).filter((x) => x.date && !isNaN(x.amt) && x.amt !== 0 && x.desc);
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
      const rows = {};
      c.items.forEach((it) => { if (!it.str.trim()) return; const y = Math.round(it.transform[5] / 2) * 2; (rows[y] = rows[y] || []).push({ x: it.transform[4], w: it.width || 0, s: it.str.trim() }); });
      Object.keys(rows).sort((a, b) => b - a).forEach((y) => out.push(rows[y].sort((a, b) => a.x - b.x)));
    }
    return out;
  };
  // A chequing PDF: Date | Description | Withdrawals | Deposits | Balance. Each amount goes to the column it sits under.
  const ONEAMT = /^(?:S\/\.?|US\$|CA\$|\$|€|£)?\s*-?\(?\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2}\)?(?:\s*(?:CR|DR|-))?$/;
  K.parseStatementRows = (rows) => {
    let cols = null;
    const out = [];
    let lastBal = null;
    rows.forEach((items) => {
      const line = items.map((i) => i.s).join(' ');
      const low = line.toLowerCase();
      // Header row: remember where each money column sits
      if (/withdraw|debit|retiro|cargo|paid out|money out/.test(low) && /deposit|credit|abono|paid in|money in/.test(low)) {
        cols = {};
        items.forEach((i) => { const t = i.s.toLowerCase(), c = i.x + i.w / 2; if (/withdraw|debit|retiro|cargo|paid out|money out/.test(t)) cols.out = c; else if (/deposit|credit|abono|paid in|money in/.test(t)) cols.in = c; else if (/balance|saldo/.test(t)) cols.bal = c; });
        return;
      }
      const d = K.parseDateText(line.slice(0, 16));
      if (!d || isNaN(d)) return;
      const amts = items.filter((i) => ONEAMT.test(i.s));
      if (!amts.length) return;
      const desc = items.filter((i) => !ONEAMT.test(i.s)).map((i) => i.s).join(' ').replace(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|^[A-Za-z]{3}\.?\s+\d{1,2}(,?\s+\d{4})?|^\d{1,2}\s+[A-Za-z]{3}\.?(\s+\d{4})?)/, '').replace(/\s+/g, ' ').trim();
      if (desc.length < 2) return;
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
      if (amt) out.push({ date: K.iso(d), desc: desc.slice(0, 60), amt, dir });
    });
    return out;
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
  K.parseStatementLines = (lines) => {
    const out = [];
    lines.forEach((l) => {
      const d = K.parseDateText(l.slice(0, 16));
      if (!d || isNaN(d)) return;
      const amts = l.match(AMT); if (!amts) return;
      const raw = amts[amts.length > 1 && /balance|saldo/i.test(l) ? amts.length - 2 : amts.length - 1];
      let amt = num(raw); if (/-\s*$|CR\b/.test(l.slice(l.indexOf(raw) + raw.length, l.indexOf(raw) + raw.length + 4))) amt = -amt;
      const dm = l.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|[A-Za-z]{3}\.?\s+\d{1,2}(,?\s+\d{4})?|\d{1,2}\s+[A-Za-z]{3}\.?(\s+\d{4})?)/);
      const desc = (dm ? l.replace(dm[0], '') : l).replace(AMT, '').replace(/\bCR\b\s*$/, '').replace(/\s+/g, ' ').trim();
      if (desc.length >= 2) out.push({ date: K.iso(d), desc: desc.slice(0, 60), amt });
    });
    return out;
  };
  K.readStatement = async (file) => {
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.pdf') || file.type === 'application/pdf') { const rows = K.parseStatementRows(await K.readPDFRows(file)); return rows.length ? rows : K.parseStatementLines(await K.readPDFText(file)); }
    return K.parseCSV(await file.text());
  };
  // Existing transactions that look like the same purchase (same amount within 3 days)
  K.findDuplicate = (data, row, where) => data.txns.find((t) => Math.abs(Math.abs(t.amt) - Math.abs(row.amt)) < 0.01 && Math.abs(K.days(K.parse(t.date), K.parse(row.date))) <= 3 && (!where || t.from === where));

  // ---------------------------------------------------------------- downloads
  K.download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  K.toCSV = (data) => {
    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['date', 'type', 'merchant', 'category', 'amount', 'currency', 'amount_' + data.base, 'account', 'note'];
    const src = (w) => { if (!w) return ''; const [k, id] = w.split(':'); const x = (k === 'card' ? data.cards : data.accounts).find((a) => a.id === id); return x ? x.name : ''; };
    return [head.join(',')].concat(data.txns.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).map((t) => [t.date, t.type, t.merchant, (K.CATS[t.cat] || {}).name || t.cat, t.amt, t.cur, t.base, src(t.from), t.note].map(esc).join(','))).join('\n');
  };
})();
