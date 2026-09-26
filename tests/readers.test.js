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
