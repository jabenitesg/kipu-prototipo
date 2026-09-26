const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const context = { window: {}, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }, console };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/readers.js'), 'utf8'), context);
const K = context.window.K;

test('a chequing CSV with Withdrawal and Deposit columns: money out and money in', () => {
  const rows = K.parseCSV('Date,Description,Withdrawals,Deposits,Balance\n2026-08-14,PAYROLL ACME,,2689.00,3689.00\n2026-08-15,ATM WITHDRAWAL,100.00,,3589.00\n2026-08-16,LOBLAWS,54.20,,3534.80');
  assert.deepEqual(rows.map((r) => [r.desc, r.amt, r.dir]), [['PAYROLL ACME', 2689, 'in'], ['ATM WITHDRAWAL', -100, 'out'], ['LOBLAWS', -54.2, 'out']]);
});

test('a CSV with a Type column saying Withdrawal or Deposit', () => {
  const rows = K.parseCSV('Date,Description,Type,Amount\n2026-08-14,PAYROLL ACME,Deposit,2689.00\n2026-08-15,SHELL,Withdrawal,40.00');
  assert.deepEqual(rows.map((r) => [r.amt, r.dir]), [[2689, 'in'], [-40, 'out']]);
});

test('words on the line say which way money went', () => {
  assert.equal(K.moneyDir('ATM WITHDRAWAL'), 'out');
  assert.equal(K.moneyDir('MOBILE DEPOSIT'), 'in');
  assert.equal(K.moneyDir('PAYROLL ACME'), 'in');
  assert.equal(K.moneyDir('POS PURCHASE METRO'), 'out');
  assert.equal(K.moneyDir('METRO'), null);
});

test('a chequing PDF: each amount belongs to the column it sits under', () => {
  const row = (...cells) => cells.map(([x, s]) => ({ x, w: 40, s }));
  const rows = [
    row([40, 'Date'], [120, 'Description'], [380, 'Withdrawals'], [470, 'Deposits'], [560, 'Balance']),
    row([40, 'Aug 14'], [120, 'PAYROLL ACME'], [470, '2,689.00'], [560, '3,689.00']),
    row([40, 'Aug 15'], [120, 'ATM WITHDRAWAL'], [385, '100.00'], [560, '3,589.00']),
  ];
  const out = K.parseStatementRows(rows);
  assert.deepEqual(out.map((r) => [r.desc, r.amt, r.dir]), [['PAYROLL ACME', 2689, 'in'], ['ATM WITHDRAWAL', -100, 'out']]);
});

test('without column titles, the running balance tells the direction', () => {
  const row = (...cells) => cells.map(([x, s]) => ({ x, w: 40, s }));
  const out = K.parseStatementRows([
    row([40, 'Aug 13'], [120, 'OPENING'], [470, '10.00'], [560, '1,000.00']),
    row([40, 'Aug 14'], [120, 'PAYROLL ACME'], [470, '2,689.00'], [560, '3,689.00']),
    row([40, 'Aug 15'], [120, 'METRO'], [470, '100.00'], [560, '3,589.00']),
  ]);
  assert.deepEqual(out.slice(1).map((r) => [r.amt, r.dir]), [[2689, 'in'], [-100, 'out']]);
});

test('opening balance and balance forward are how the statement starts, not money coming in', () => {
  assert.equal(K.isBalanceLine('Opening balance'), true);
  assert.equal(K.isBalanceLine('BALANCE FORWARD'), true);
  assert.equal(K.isBalanceLine('Saldo anterior'), true);
  assert.equal(K.isBalanceLine('Total deposits'), true);
  assert.equal(K.isBalanceLine('NEW BALANCE ATHLETICS'), false); // a shoe store
  assert.equal(K.isBalanceLine('PAYROLL ACME'), false);
  const csv = K.parseCSV('Date,Description,Withdrawals,Deposits,Balance\n2026-08-01,OPENING BALANCE,,1000.00,1000.00\n2026-08-14,PAYROLL ACME,,2689.00,3689.00\n2026-08-31,CLOSING BALANCE,,,3689.00');
  assert.deepEqual(csv.map((r) => r.desc), ['PAYROLL ACME']);
  // In a PDF without column titles, the opening balance tells the direction of the first line
  const row = (...cells) => cells.map(([x, s]) => ({ x, w: 40, s }));
  const out = K.parseStatementRows([
    row([120, 'Balance forward'], [560, '1,000.00']),
    row([40, 'Aug 14'], [120, 'METRO'], [470, '100.00'], [560, '900.00']),
    row([40, 'Aug 15'], [120, 'PAYROLL ACME'], [470, '2,689.00'], [560, '3,589.00']),
  ]);
  assert.deepEqual(out.map((r) => [r.desc, r.amt, r.dir]), [['METRO', -100, 'out'], ['PAYROLL ACME', 2689, 'in']]);
});

test('dates: month names are whole words, one day/month order per file, and the statement decides the year', () => {
  const iso = (s, dmy) => { const d = K.parseDateText(s, dmy); return d ? K.iso(d) : null; };
  // "14 MARKET" is not March 14; "3 DECATHLON" is not December 3
  assert.equal(iso('Aug 14 MARKET STREET 2026').slice(5), '08-14');
  assert.equal(iso('Sep 3 DECATHLON').slice(5), '09-03');
  assert.equal(K.parseDateText('14 MARKET ST'), null);
  assert.equal(iso('14 ago 2026'), '2026-08-14');
  assert.equal(iso('14 de agosto de 2026'), '2026-08-14');
  assert.equal(iso('20260814'), '2026-08-14');
  assert.equal(iso('14AUG'), K.iso(K.today()).slice(0, 4) + '-08-14');
  // A whole file is read one way: a 13th anywhere means day first
  assert.equal(K.dateOrder(['05/08/2026', '13/08/2026', '20/08/2026'], false), true);
  assert.equal(K.dateOrder(['08/05/2026', '08/13/2026', '08/20/2026'], true), false);
  const csv = K.parseCSV('Date,Description,Amount\n05/08/2026,A,-1.00\n13/08/2026,B,-2.00\n02/09/2026,C,-3.00', { dmy: false });
  assert.deepEqual(csv.map((r) => r.date), ['2026-08-05', '2026-08-13', '2026-09-02']);
  // No year printed: December lines on a January statement belong to the year before
  const rows = K.settleYears([{ date: '2026-12-28', noYear: true }, { date: '2026-01-04', noYear: true }], new Date(2027, 0, 10));
  assert.deepEqual(rows.map((r) => r.date), ['2026-12-28', '2027-01-04']);
  // A card PDF with two dates per line and the period printed at the top
  const row = (...cells) => cells.map(([x, s]) => ({ x, w: 40, s }));
  const out = K.parseStatementRows([
    row([40, 'Statement period: July 15 to August 14, 2025']),
    row([40, 'Jul 18'], [80, 'Jul 19'], [120, 'MARKET FRESH'], [470, '45.00']),
    row([40, 'Aug 02'], [80, 'Aug 03'], [120, 'DECATHLON'], [470, '80.00']),
  ]);
  assert.deepEqual(out.map((r) => [r.date, r.desc]), [['2025-07-18', 'MARKET FRESH'], ['2025-08-02', 'DECATHLON']]);
});

test('no line is lost: bank CSVs without headers, with preambles, currency columns and quoted line breaks', () => {
  // TD-style: no header; withdrawal and deposit columns, then the balance
  const td = K.parseCSV('08/14/2026,PAYROLL ACME,,2689.00,3689.00\n08/15/2026,METRO,54.20,,3634.80\n08/15/2026,TIM HORTONS,4.50,,3630.30\n08/16/2026,TIM HORTONS,4.50,,3625.80', { dmy: false });
  assert.deepEqual(td.map((r) => [r.desc, r.amt]), [['PAYROLL ACME', 2689], ['METRO', -54.2], ['TIM HORTONS', -4.5], ['TIM HORTONS', -4.5]]);
  // RBC-style: amount column called CAD$, two description columns
  const rbc = K.parseCSV('"Account Type","Account Number","Transaction Date","Cheque Number","Description 1","Description 2","CAD$","USD$"\nChequing,01234-5678901,8/14/2026,,"PAYROLL","ACME INC",2689.00,\nChequing,01234-5678901,8/15/2026,,"POS PURCHASE","METRO #123",-54.20,', { dmy: false });
  assert.deepEqual(rbc.map((r) => [r.desc, r.amt]), [['PAYROLL ACME INC', 2689], ['POS PURCHASE METRO #123', -54.2]]);
  // Account details before the header, and a description with a line break inside quotes
  const pre = K.parseCSV('Account: 1234\nPeriod: Aug 2026\n\nDate,Description,Amount\n2026-08-14,"E-TRANSFER\nFROM ANA",150.00\n2026-08-15,TOTAL ENERGIES,-60.00');
  assert.deepEqual(pre.map((r) => [r.desc, r.amt]), [['E-TRANSFER FROM ANA', 150], ['TOTAL ENERGIES', -60]]);
  // Scotiabank-style: date, amount, blank, two description columns
  const sco = K.parseCSV('8/14/2026,-54.20,-,POS PURCHASE,METRO\n8/15/2026,2689.00,-,DEPOSIT,PAYROLL ACME', { dmy: false });
  assert.deepEqual(sco.map((r) => [r.desc, r.amt]), [['POS PURCHASE METRO', -54.2], ['DEPOSIT PAYROLL ACME', 2689]]);
});

test('no line is lost in PDFs: one date per day, amounts a little off the line, descriptions over two lines', () => {
  const row = (...cells) => cells.map(([x, s]) => ({ x, w: 40, s }));
  const out = K.parseStatementRows([
    row([40, 'Date'], [120, 'Description'], [380, 'Withdrawals'], [470, 'Deposits'], [560, 'Balance']),
    row([40, 'Aug 14'], [120, 'PAYROLL ACME'], [470, '2,689.00'], [560, '3,689.00']),
    row([120, 'METRO #123'], [385, '54.20'], [560, '3,634.80']), // same day, no date printed
    row([40, 'Aug 15'], [120, 'E-TRANSFER SENT']),
    row([120, 'TO JOHN SMITH'], [385, '100.00'], [560, '3,534.80']), // amount on the next line
    row([40, 'Aug 16'], [120, 'AMAZON.CA'], [385, '25.00'], [560, '3,509.80']),
    row([120, 'ORDER 111-222']), // description continues
    row([120, 'Your credit limit'], [560, '5,000.00']), // not a movement
  ]);
  assert.deepEqual(out.map((r) => [r.date.slice(5), r.desc, r.amt]), [['08-14', 'PAYROLL ACME', 2689], ['08-14', 'METRO #123', -54.2], ['08-15', 'E-TRANSFER SENT TO JOHN SMITH', -100], ['08-16', 'AMAZON.CA ORDER 111-222', -25]]);
});

test('duplicates need the same shop: two coffees or different shops with the same amount are both kept', () => {
  const data = { txns: [{ amt: 10, date: '2026-08-14', merchant: 'UBER TRIP', from: 'acct:chq', source: 'statement' }, { amt: 4.5, date: '2026-08-15', merchant: 'Coffee', from: 'acct:chq', source: 'manual' }] };
  assert.equal(!!K.findDuplicate(data, { date: '2026-08-15', amt: 10, desc: 'STARBUCKS 123' }, 'acct:chq'), false);
  assert.equal(!!K.findDuplicate(data, { date: '2026-08-15', amt: 10, desc: 'UBER TRIP HELP.UBER.COM' }, 'acct:chq'), true);
  assert.equal(!!K.findDuplicate(data, { date: '2026-08-15', amt: 4.5, desc: 'TIM HORTONS' }, 'acct:chq'), true); // typed by hand the same day
  assert.equal(!!K.findDuplicate(data, { date: '2026-08-18', amt: 4.5, desc: 'TIM HORTONS' }, 'acct:chq'), false);
});

test('each movement already in Kipu covers only one line of a new file', () => {
  const data = { txns: [{ id: 't1', amt: 4.5, date: '2026-09-15', merchant: 'TIM HORTONS', from: 'acct:chq', source: 'statement' }] };
  const rows = [{ date: '2026-09-15', amt: -4.5, desc: 'TIM HORTONS' }, { date: '2026-09-16', amt: -4.5, desc: 'TIM HORTONS' }];
  const d = K.markDuplicates(data, rows, 'acct:chq');
  assert.deepEqual(Object.keys(d), ['0']);
});
