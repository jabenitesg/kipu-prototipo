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

test('card PDF: a header split over two lines, subtotals, extra cardholders, page footers and rewards pages', () => {
  const row = (...cells) => cells.map(([x, s]) => ({ x, w: 40, s }));
  const footer = () => [row([40, 'Sample Card']), row([40, 'Statement of Account'])];
  const out = K.parseStatementRows([
    row([40, 'Closing Date Feb 27, 2026']), row([40, 'Credit limit'], [500, '5,000.00']),
    row([40, 'Transaction'], [100, 'Posting'], [200, 'Details'], [500, 'Amount ($)']), row([40, 'Date'], [100, 'Date']),
    row([40, 'New Payments']),
    row([40, 'Feb 16'], [100, 'Feb 16'], [200, 'PAYMENT RECEIVED - THANK YOU'], [500, '-100.00']),
    row([40, 'Feb 16'], [200, 'Total of Payment Activity'], [500, '-100.00']),
    row([40, 'New Transactions for A']),
    row([40, 'Feb 3'], [100, 'Feb 4'], [200, 'APPLE.COM/BILL TORONTO'], [500, '13.43']),
    ...footer(), row([40, 'Page 3 / 5']),
    row([40, 'Transaction'], [100, 'Posting'], [200, 'Details'], [500, 'Amount ($)']),
    row([40, 'Feb 8'], [100, 'Feb 9'], [200, 'METRO'], [500, '26.57']),
    row([40, 'Feb 25'], [200, 'Total of New Transactions for A'], [500, '40.00']),
    row([40, 'New Transactions for B']),
    row([40, 'Feb 15'], [100, 'Feb 16'], [200, 'CARTERS'], [500, '51.45']),
    row([40, 'Total of New Transactions for B'], [500, '51.45']),
    ...footer(), row([40, 'Page 4 / 5']), row([40, 'Membership Rewards']),
    row([40, 'Date'], [100, 'Description'], [300, 'Qualifying Purchases'], [500, 'No. of Points']),
    row([40, 'Feb 8'], [100, 'METRO'], [300, '26.57'], [500, '133']),
    ...footer(), row([40, 'Page 5 / 5']),
    row([40, 'Effective Nov 5 2025 the monthly fee'], [500, '12.99']),
  ], { card: true });
  assert.deepEqual(out.map((r) => [r.desc, r.amt, r.dir]), [['PAYMENT RECEIVED - THANK YOU', -100, 'in'], ['APPLE.COM/BILL TORONTO', 13.43, 'out'], ['METRO', 26.57, 'out'], ['CARTERS', 51.45, 'out']]);
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

test('CIBC credit card: CSV download and PDF statement', () => {
  // CSV: date, description, charge, payment, card number (no header)
  const csv = K.parseCSV('2026-09-14,AMAZON.CA AMAZON.CA ON,45.20,,4500********1234\n2026-09-15,PAYMENT THANK YOU/PAIEMENT MERCI,,500.00,4500********1234\n2026-09-16,TIM HORTONS #1234 TORONTO ON,4.75,,4500********1234', { dmy: false, card: true });
  assert.deepEqual(csv.map((r) => [r.desc, r.amt, r.dir]), [['AMAZON.CA AMAZON.CA ON', -45.2, 'out'], ['PAYMENT THANK YOU/PAIEMENT MERCI', 500, 'in'], ['TIM HORTONS #1234 TORONTO ON', -4.75, 'out']]);
  // PDF: trans date, post date, description, spend category, amount; summary lines around it
  const row = (...cells) => cells.map(([x, s]) => ({ x, w: 40, s }));
  const out = K.parseStatementRows([
    row([40, 'Statement period August 16 to September 15, 2026']),
    row([40, 'Previous balance'], [520, '$1,234.56']),
    row([40, 'Total balance'], [520, '$866.40']),
    row([40, 'Minimum payment'], [520, '$10.00']),
    row([40, 'Trans'], [80, 'Post'], [140, 'Description'], [380, 'Spend Categories'], [520, 'Amount($)']),
    row([40, 'Aug 25'], [80, 'Aug 25'], [140, 'PAYMENT THANK YOU/PAIEMENT MERCI'], [520, '1,234.56']),
    row([40, 'Aug 16'], [80, 'Aug 18'], [140, 'AMAZON.CA MISSISSAUGA ON'], [380, 'Retail and Grocery'], [520, '45.20']),
    row([40, 'Aug 20'], [80, 'Aug 21'], [140, 'UBER* TRIP SAN FRANCISCO'], [380, 'Transportation']),
    row([140, '12.34 USD @ 1.3700'], [520, '16.91']), // foreign purchase: the amount in CAD is on the next line
    row([40, 'Sep 2'], [80, 'Sep 3'], [140, 'NETFLIX.COM'], [380, 'Hotel, Entertainment and Recreation'], [460, '16.99']),
    row([40, 'Sep 5'], [80, 'Sep 6'], [140, 'REFUND AMAZON'], [520, '-20.00']),
    row([40, 'Annual interest rate'], [300, 'Purchases 20.99%'], [520, '0.00']),
  ], { card: true });
  assert.deepEqual(out.map((r) => [r.date, r.desc, r.amt, r.bankCat || null]), [
    ['2026-08-25', 'PAYMENT THANK YOU/PAIEMENT MERCI', 1234.56, null],
    ['2026-08-16', 'AMAZON.CA MISSISSAUGA ON', 45.2, 'groceries'],
    ['2026-08-20', 'UBER* TRIP SAN FRANCISCO 12.34 USD @ 1.3700', 16.91, 'transport'],
    ['2026-09-02', 'NETFLIX.COM', 16.99, 'entertainment'],
    ['2026-09-05', 'REFUND AMAZON', -20, null],
  ]);
  // No summary line got in
  assert.ok(!out.some((r) => /balance|minimum|interest/i.test(r.desc)));
  assert.equal(out.find((r) => r.desc === 'AMAZON.CA MISSISSAUGA ON').bankCat, 'groceries');
  assert.equal(out.find((r) => r.desc.startsWith('PAYMENT')).amt, 1234.56);
  assert.equal(out.find((r) => r.desc === 'REFUND AMAZON').amt, -20);
});

test('a real card statement layout: only the transactions table is read', () => {
  const row = (...cells) => cells.map(([x, s]) => ({ x, w: 30, s }));
  const out = K.parseStatementRows([
    row([418, 'Statement Date']), row([418, 'February 14, 2026']),
    row([73, 'Your account at a glance'], [418, 'February statement period']),
    row([418, 'January 15'], [457, 'to February 14, 2026']),
    row([73, 'Previous'], [116, 'balance'], [346, '$635.01']),
    row([418, 'Contact us']), row([91, 'Payments'], [249, '$635.01']),
    row([418, 'Customer Service'], [487, '1 800 000-0000']),
    row([91, 'Other credits'], [254, '255.00'], [418, 'Lost/Stolen'], [487, '1 800 000-0000']),
    row([73, 'Total balance'], [307, '='], [346, '$255.00'], [383, 'CR'], [418, 'Regular purchases'], [501, '21.99%']),
    row([419, '0.5% Cash Back'], [532, '-'], [562, '1.28']),
    row([415, 'Total Dividend Cash Back'], [532, '-'], [556, '$'], [560, '1.28']),
    row([72, 'Tear Off here'], [192, 'Please turn over - Transactions begin on page 2'], [527, 'Page'], [549, '1'], [556, 'of 3']),
    row([37, 'Transactions'], [148, 'from January 15'], [227, 'to February 14, 2026']),
    row([37, 'Your payments']), row([37, 'Trans'], [79, 'Post']),
    row([37, 'date'], [79, 'date'], [119, 'Description'], [504, 'Amount($)']),
    row([37, 'Jan 30'], [79, 'Feb 02'], [119, 'PAYMENT THANK YOU/PAIEMENT MERCI'], [516, '635.01']),
    row([37, 'Total payments'], [511, '$635.01']),
    row([37, 'Your new charges and credits']), row([37, 'Trans'], [79, 'Post']),
    row([37, 'date'], [79, 'date'], [122, 'Description'], [325, 'Spend Categories'], [504, 'Amount($)']),
    row([37, 'Card number 4505 XXXX XXXX 0000']),
    row([37, 'Feb 10'], [79, 'Feb 11'], [123, 'IMMIGRATION CANADA ONLINEOTTAWA'], [278, 'ON'], [341, 'Professional and Financial Services'], [513, '-100.00']),
    row([37, 'Feb 10'], [79, 'Feb 11'], [123, 'IMMIGRATION CANADA ONLINEOTTAWA'], [278, 'ON'], [341, 'Professional and Financial Services'], [513, '-155.00']),
    row([37, 'Total for 4505 XXXX XXXX 0000'], [509, '-$255.00']),
    row([482, 'Page'], [503, '2'], [511, 'of 3']),
    row([14, 'Information about your card account']),
    row([14, 'days of this Statement Date. If you do not, we may regard this statement'], [398, 'applicable).']),
    row([14, 'is charged retroactively from the Transaction date. You have a minimum'], [206, 'made a payment but it has not yet been posted']),
    row([14, 'Spend Categories'], [120, 'Transactions'], [200, 'Amount($)'], [300, 'Budget ($)']),
    row([14, 'Professional and Financial Services'], [120, '2'], [200, '-255.00'], [300, '-'], [340, '-'], [400, '2'], [460, '-255.00']),
    row([14, 'Total'], [120, '2'], [200, '-255.00']),
  ], { card: true });
  assert.deepEqual(out.map((r) => [r.date, r.desc, r.amt, r.dir]), [
    ['2026-01-30', 'PAYMENT THANK YOU/PAIEMENT MERCI', 635.01, 'out'],
    ['2026-02-10', 'IMMIGRATION CANADA ONLINEOTTAWA ON', -100, 'in'],
    ['2026-02-10', 'IMMIGRATION CANADA ONLINEOTTAWA ON', -155, 'in'],
  ]);
});

test('a credit card statement is recognized, with its last four digits', () => {
  const k = K.statementKind('CIBC Dividend Visa Card Account number 4505 XXXX XXXX 4011\nCredit Limit $4,500.00\nMinimum Payment $0.00\nPAYMENT THANK YOU/PAIEMENT MERCI 635.01');
  assert.deepEqual(k, { card: true, last4: '4011' });
  assert.equal(K.statementKind('Date,Description,Withdrawals,Deposits\n2026-09-14,PAYROLL,,2689.00').card, false);
});

test('card numbers are found in Visa, Mastercard and Amex formats', () => {
  assert.equal(K.statementKind('Account number 4505 XXXX XXXX 4011 Credit Limit Minimum Payment').last4, '4011');
  assert.equal(K.statementKind('American Express Cobalt Card XXXX XXXXXX 71004 Minimum Payment Due New Balance').last4, '1004');
  assert.equal(K.statementKind('The Cobalt Card from American Express. Card ending 1-23456. Minimum amount due').last4, '3456');
  assert.equal(K.statementKind('Mastercard **** **** **** 8821 credit limit minimum payment').last4, '8821');
});
