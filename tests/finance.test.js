const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const storage = new Map();
const context = { window: {}, localStorage: { getItem: (k) => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: (k) => storage.delete(k) }, console };
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../js/store.js'), 'utf8'), context);
const K = context.window.K;
const ctx = { scope: 'personal', currency: 'Combined' };
const account = (id, cur, bal = 0) => ({ id, name: id, kind: 'Everyday', cur, bal });
const card = (id, cur, bal = 0, limit = 1000) => ({ id, name: id, cur, bal, limit, stmtBal: 0 });
const balances = (d) => Object.fromEntries(d.accounts.map((a) => [a.id, a.bal]).concat(d.cards.map((c) => [c.id, c.bal])));

test('fresh storage and clean onboarding have no financial data; demo requires an explicit call', () => {
  storage.clear();
  const fresh = K.load();
  for (const key of ['accounts', 'cards', 'loans', 'txns', 'bills', 'income', 'goals']) assert.equal(fresh[key].length, 0);
  assert.equal(K.derive(fresh, ctx).netWorth, 0);
  const clean = K.snapshot({ ...fresh, onboarded: true });
  assert.equal(clean.txns.length, 0);
  assert.ok(K.sampleData().txns.length > 0);
  assert.equal(K.sampleData().demo, true);
  assert.equal(fresh.demo, false);
  assert.equal(K.load().txns.length, 0);
});

test('expense, income, transfer, and card payment reverse exactly after FX changes', () => {
  let d = K.factory();
  d.accounts = [account('cad', 'CAD', 1000), account('usd', 'USD', 100), account('pen', 'PEN', 1000)];
  d.cards = [card('visa', 'USD', 50)];
  const initial = balances(d);
  d = K.addTxn(d, { type: 'expense', amt: 20, cur: 'USD', from: 'acct:usd' });
  d = K.addTxn(d, { type: 'income', amt: 100, cur: 'CAD', from: 'acct:cad' });
  d = K.addTxn(d, { type: 'transfer', amt: 50, cur: 'CAD', from: 'acct:cad', to: 'acct:pen' });
  d = K.addTxn(d, { type: 'transfer', amt: 20, cur: 'USD', from: 'acct:cad', to: 'card:visa' });
  const txns = d.txns.map((t) => t.id);
  d.fx.usd.USD = 1.8;
  d.fx.usd.PEN = 4.2;
  for (const id of txns) d = K.removeTxn(d, id);
  assert.deepEqual(balances(d), initial);
});

test('editing amount, currency, source, destination and type leaves no stale posting', () => {
  let d = K.factory();
  d.accounts = [account('a', 'CAD', 1000), account('b', 'USD', 100), account('c', 'PEN', 300)];
  const initial = balances(d);
  d = K.addTxn(d, { type: 'expense', amt: 25, cur: 'CAD', from: 'acct:a' });
  const id = d.txns[0].id;
  d = K.editTxn(d, id, { amt: 30, cur: 'USD', from: 'acct:b' });
  assert.equal(d.accounts[0].bal, 1000);
  assert.equal(d.accounts[1].bal, 70);
  d = K.editTxn(d, id, { type: 'transfer', from: 'acct:a', to: 'acct:c' });
  assert.equal(d.accounts[1].bal, 100);
  assert.equal(d.accounts[0].bal, 1000 - K.toBase(d, 30, 'USD'));
  assert.ok(d.accounts[2].bal > 300);
  d = K.removeTxn(d, id);
  assert.deepEqual(balances(d), initial);
});

test('card debt, credit limit and net worth convert each native currency once', () => {
  let d = K.factory();
  d.accounts = [account('cad', 'CAD', 1000)];
  d.cards = [card('usd', 'USD', 100, 1000), card('pen', 'PEN', 372, 3720)];
  const b = K.balances(d);
  assert.equal(b.cardBal, K.toBase(d, 100, 'USD') + K.toBase(d, 372, 'PEN'));
  assert.equal(b.netWorth, 1000 - b.cardBal);
  const before = d.cards.map((c) => c.bal);
  d = K.changeBase(d, 'PEN');
  assert.deepEqual(d.cards.map((c) => c.bal), before);
  assert.equal(d.cards[0].cur, 'USD');
  assert.equal(d.cards[1].cur, 'PEN');
});

test('loan payment and deletion restore principal, cash and next payment date', () => {
  let d = K.factory();
  d.accounts = [account('a', 'CAD', 1000)];
  d.loans = [{ id: 'loan', name: 'Loan', bal: 500, pay: 110, rate: 12, freq: 'Monthly', next: K.iso(K.today()) }];
  const next = d.loans[0].next;
  d = K.payLoan(d, 'loan', 'acct:a', 10);
  assert.equal(d.accounts[0].bal, 880);
  assert.equal(d.loans[0].bal, 385);
  assert.notEqual(d.loans[0].next, next);
  d = K.removeTxn(d, d.txns[0].id);
  assert.equal(d.accounts[0].bal, 1000);
  assert.equal(d.loans[0].bal, 500);
  assert.equal(d.loans[0].next, next);
});

test('editing a loan payment changes cash and principal once', () => {
  let d = K.factory();
  d.accounts = [account('a', 'CAD', 1000), account('b', 'USD', 100)];
  d.loans = [{ id: 'loan', name: 'Loan', bal: 500, pay: 110, rate: 12, freq: 'Monthly', next: K.iso(K.today()) }];
  d = K.payLoan(d, 'loan', 'acct:a');
  const id = d.txns[0].id;
  d = K.editTxn(d, id, { amt: 120, cur: 'USD', from: 'acct:b', principal: 100, interest: K.toBase(d, 120, 'USD') - 100 });
  assert.equal(d.accounts[0].bal, 1000);
  assert.equal(d.accounts[1].bal, -20);
  assert.equal(d.loans[0].bal, 400);
  d = K.removeTxn(d, id);
  assert.equal(d.accounts[1].bal, 100);
  assert.equal(d.loans[0].bal, 500);
});

test('goal contribution reverses when destination or type changes', () => {
  let d = K.factory();
  d.accounts = [account('a', 'CAD', 200), account('b', 'CAD', 0)];
  d.goals = [{ id: 'g', name: 'Goal', saved: 0 }];
  d = K.addTxn(d, { type: 'saving', amt: 50, cur: 'CAD', from: 'acct:a', goal: 'g' });
  const id = d.txns[0].id;
  assert.equal(d.goals[0].saved, 50);
  d = K.editTxn(d, id, { type: 'transfer', to: 'acct:b' });
  assert.equal(d.goals[0].saved, 0);
  assert.equal(d.accounts[1].bal, 50);
  d = K.removeTxn(d, id);
  assert.equal(d.accounts[0].bal, 200);
  assert.equal(d.accounts[1].bal, 0);
});

test('changing an account currency rebases saved postings for later deletion', () => {
  let d = K.factory();
  d.accounts = [account('a', 'CAD', 100)];
  d = K.addTxn(d, { type: 'expense', amt: 10, cur: 'CAD', from: 'acct:a' });
  const id = d.txns[0].id;
  const old = d.accounts[0];
  d = K.upsert(d, 'accounts', { ...old, cur: 'USD', bal: K.r2(old.bal * K.rate(d, 'CAD', 'USD')) });
  const posted = d.txns[0].postings[0].amount;
  const afterEdit = d.accounts[0].bal;
  d = K.removeTxn(d, id);
  assert.equal(d.accounts[0].bal, K.r2(afterEdit - posted));
});

test('Safe to Spend excludes recorded bill, card and loan payments', () => {
  let d = K.factory();
  const date = K.iso(K.today());
  const day = K.today().getDate();
  d.accounts = [account('a', 'CAD', 1000)];
  d.cards = [{ ...card('visa', 'CAD', 200), dueDay: day, stmtBal: 200 }];
  d.loans = [{ id: 'loan', name: 'Loan', bal: 300, pay: 100, rate: 0, freq: 'Monthly', next: date }];
  d.bills = [{ id: 'bill', name: 'Bill', amt: 50, cur: 'CAD', day, kind: 'Bill', pay: 'acct:a' }];
  assert.equal(K.derive(d, ctx).plan.safe, 650);
  d = K.payBill(d, 'bill', 'acct:a');
  d = K.addTxn(d, { type: 'transfer', amt: 200, cur: 'CAD', from: 'acct:a', to: 'card:visa', date });
  d = K.payLoan(d, 'loan', 'acct:a');
  assert.equal(K.derive(d, ctx).plan.safe, 650);
  assert.equal(K.derive(d, ctx).plan.hasIncome, false);
});
