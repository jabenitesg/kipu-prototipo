const test = require('node:test');
const assert = require('./assert.js');
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

test('a currency without a rate is never converted 1:1 and joins totals once the rate arrives', () => {
  let d = K.factory();
  d.accounts = [account('cad', 'CAD', 1000), account('ars', 'ARS', 50000)];
  delete d.fx.usd.ARS;
  assert.equal(K.rate(d, 'ARS', 'CAD'), null);
  assert.equal(K.toBase(d, 100, 'ARS'), null);
  assert.deepEqual(K.missingRates(d), ['ARS']);
  assert.equal(K.derive(d, ctx).netWorth, 1000); // the ARS account is left out, not counted as 50,000 CAD
  assert.equal(K.canPost(d, { type: 'expense', amt: 10, cur: 'ARS', from: 'acct:cad' }), 'ARS');
  assert.throws(() => K.addTxn(d, { type: 'expense', amt: 10, cur: 'ARS', from: 'acct:cad' }), /NO_RATE/);
  d = K.addTxn(d, { type: 'expense', amt: 2000, cur: 'ARS', from: 'acct:ars' }); // same currency needs no rate
  assert.equal(d.accounts[1].bal, 48000);
  assert.equal(d.txns[0].base, null);
  d.fx.usd.ARS = 1000; d.fx.usd.CAD = 1.35;
  d = K.fillPendingRates(d);
  assert.equal(d.txns[0].base, 2.7);
  assert.equal(d.txns[0].rateLater, true);
  assert.deepEqual(K.missingRates(d), []);
});

test('an imported or typed rent payment pays the bill instead of being reserved again', () => {
  let d = K.factory();
  const T = K.today();
  d.accounts = [account('cad', 'CAD', 3000)];
  d.income = [{ id: 'pay', name: 'Salary', amt: 2000, cur: 'CAD', freq: 'Monthly', next: K.iso(K.addDays(T, 20)), to: 'acct:cad' }];
  d.bills = [{ id: 'rent', name: 'Rent', kind: 'Bill', amt: 1500, cur: 'CAD', day: T.getDate(), cat: 'housing', pay: 'acct:cad', since: K.iso(K.addDays(T, -40)) }];
  const before = K.derive(d, ctx).plan.safe;
  d = K.addTxn(d, { type: 'expense', merchant: 'RENT PAYMENT - MAPLE PROPERTIES', amt: 1500, cur: 'CAD', from: 'acct:cad', date: K.iso(T), source: 'statement' });
  assert.equal(d.txns[0].recurring, 'rent');
  assert.equal(K.derive(d, ctx).plan.safe, before); // cash went down 1,500 and the bill is no longer due
  const other = K.addTxn(K.factory(), { type: 'expense', merchant: 'Coffee', amt: 5, cur: 'CAD' });
  assert.equal(other.txns[0].recurring, undefined);
});

test('last month’s rent payment doesn’t cover the rent due before next payday', () => {
  let d = K.factory();
  const T = K.today(), due = new Date(T.getFullYear(), T.getMonth() + 1, 1); // rent on the 1st, payday on the 2nd
  d.accounts = [account('cad', 'CAD', 3000)];
  d.income = [{ id: 'pay', name: 'Salary', amt: 2000, cur: 'CAD', freq: 'Monthly', next: K.iso(K.addDays(due, 1)), to: 'acct:cad' }];
  d.bills = [{ id: 'rent', name: 'Rent', kind: 'Bill', amt: 1500, cur: 'CAD', day: 1, cat: 'housing', pay: 'acct:cad' }];
  d.txns = [{ id: 'old', type: 'expense', merchant: 'Rent', amt: 1500, cur: 'CAD', base: 1500, date: K.iso(K.addMonths(due, -1)), recurring: 'rent', cat: 'housing', from: 'acct:cad' }];
  let plan = K.derive(d, ctx).plan;
  assert.equal(plan.billsDue.length, 1);
  assert.equal(plan.safe, 1500);
  d.txns.push({ id: 'now', type: 'expense', merchant: 'Rent', amt: 1500, cur: 'CAD', base: 1500, date: K.iso(T), recurring: 'rent', cat: 'housing', from: 'acct:cad' });
  if (K.addDays(due, -15) < T) assert.equal(K.derive(d, ctx).plan.billsDue.length, 0); // paid a few days early
});

test('the forecast assumes the everyday spending you really do, not zero', () => {
  const d = K.factory();
  const T = K.today(), last = new Date(T.getFullYear(), T.getMonth() - 1, 1), iso = (n) => K.iso(K.addDays(last, n));
  d.accounts = [account('cad', 'CAD', 3000)];
  d.income = [{ id: 'pay', name: 'Salary', amt: 4000, cur: 'CAD', freq: 'Monthly', next: K.iso(K.addDays(T, 10)), to: 'acct:cad' }];
  d.bills = [{ id: 'rent', name: 'Rent', kind: 'Bill', amt: 1500, cur: 'CAD', day: 1, cat: 'housing', pay: 'acct:cad' }, { id: 'gym', name: 'Gym', kind: 'Subscription', amt: 50, cur: 'CAD', day: 2, cat: 'subs', pay: 'acct:cad' }];
  const tx = (id, amt, day, extra) => Object.assign({ id, type: 'expense', merchant: id, amt, cur: 'CAD', base: amt, date: iso(day), cat: 'groceries', from: 'acct:cad' }, extra);
  // Only rent was paid last month (the gym bill was added later): the gap must not eat groceries
  d.txns = [tx('rent', 1500, 0, { recurring: 'rent', cat: 'housing' }), tx('food', 400, 3), tx('food2', 200, 12)];
  const D = K.derive(d, ctx);
  assert.equal(K.forecast(d, D, { assumption: 'Recent average' }).flexible, 600);
});

test('edits made on two devices at once are merged, balances included', () => {
  let base = K.factory();
  base.accounts = [account('cad', 'CAD', 1000)];
  base.bills = [{ id: 'b1', name: 'Phone', amt: 50, cur: 'CAD', day: 5 }];
  const phone = K.addTxn(base, { type: 'expense', merchant: 'Groceries', amt: 100, cur: 'CAD', from: 'acct:cad' });
  let laptop = K.addTxn(base, { type: 'expense', merchant: 'Gas', amt: 60, cur: 'CAD', from: 'acct:cad' });
  laptop = Object.assign({}, laptop, { bills: [{ id: 'b1', name: 'Phone plan', amt: 50, cur: 'CAD', day: 5 }] });
  const merged = K.mergeData(base, phone, laptop);
  assert.equal(merged.txns.length, 2);
  assert.equal(merged.accounts[0].bal, 840); // 1000 − 100 − 60
  assert.equal(merged.bills[0].name, 'Phone plan');
  const deleted = K.removeTxn(phone, phone.txns[0].id);
  assert.equal(K.mergeData(phone, deleted, phone).txns.length, 0); // a delete on one side sticks when the other didn't touch it
});

test('each country is viewed on its own, in its own currency, with its own Safe to Spend', () => {
  let d = K.factory();
  d.fx.usd = { USD: 1, CAD: 1.35, PEN: 3.75 };
  d.accounts = [account('cad', 'CAD', 2000), account('pen', 'PEN', 3000)];
  d.bills = [{ id: 'rent', name: 'Rent', amt: 1500, cur: 'CAD', day: 28, pay: 'acct:cad' }, { id: 'luz', name: 'Luz', amt: 150, cur: 'PEN', day: 28, pay: 'acct:pen' }];
  d = K.addTxn(d, { type: 'expense', merchant: 'Tottus', amt: 180, cur: 'PEN', from: 'acct:pen' });
  d = K.addTxn(d, { type: 'expense', merchant: 'Loblaws', amt: 60, cur: 'CAD', from: 'acct:cad' });
  assert.deepEqual(K.countries(d), ['CA', 'PE']);
  const pe = K.countryView(d, 'PE');
  assert.equal(pe.base, 'PEN');
  assert.deepEqual(pe.accounts.map((a) => a.id), ['pen']);
  assert.deepEqual(pe.txns.map((t) => [t.merchant, t.base]), [['Tottus', 180]]); // exact soles, not a round trip through CAD
  assert.deepEqual(pe.bills.map((b) => b.id), ['luz']);
  const peD = K.derive(pe, ctx);
  assert.equal(peD.cash, 2820);
  const ca = K.derive(K.countryView(d, 'CA'), ctx);
  assert.equal(ca.cash, 1940);
  assert.equal(K.derive(d, ctx).cash, K.r2(1940 + 2820 * 1.35 / 3.75)); // global converts to the main currency
  d.accounts.push(account('wise', 'USD', 100));
  assert.deepEqual(K.countries(d), ['CA', 'PE']); // a US-dollar account with no country counts as home, not a new country
});

test('a two-currency card keeps soles and dollars apart and shares one limit', () => {
  let d = K.factory();
  d.fx.usd = { USD: 1, CAD: 1.35, PEN: 3.75 };
  d.accounts = [account('pen', 'PEN', 5000), account('usd', 'USD', 500)];
  d.cards = [{ id: 'bcp', name: 'BCP Visa', cur: 'PEN', cur2: 'USD', bal: 0, bal2: 0, limit: 7500, stmtBal: 0, stmtBal2: 0 }];
  d = K.addTxn(d, { type: 'expense', merchant: 'Wong', amt: 300, cur: 'PEN', from: 'card:bcp' });
  d = K.addTxn(d, { type: 'expense', merchant: 'Amazon', amt: 40, cur: 'USD', from: 'card:bcp' });
  assert.equal(d.cards[0].bal, 300);
  assert.equal(d.cards[0].bal2, 40);
  assert.equal(K.cardUsed(d, d.cards[0]), 450); // 300 soles + 40 dollars × 3.75
  d = K.addTxn(d, { type: 'transfer', amt: 40, cur: 'USD', from: 'acct:usd', to: 'card:bcp' });
  assert.equal(d.cards[0].bal2, 0);
  assert.equal(d.cards[0].bal, 300);
  assert.equal(d.accounts[1].bal, 460);
  const id = d.txns[1].id;
  d = K.removeTxn(d, id);
  assert.equal(d.cards[0].bal2, -40); // removing the Amazon charge after paying leaves a 40 credit, exactly
});

test('a loan in another currency is paid in that currency and counted converted', () => {
  let d = K.factory();
  d.fx.usd = { USD: 1, CAD: 1.35, PEN: 3.75 };
  d.accounts = [account('pen', 'PEN', 5000)];
  d.loans = [{ id: 'car', name: 'Car', cur: 'PEN', bal: 10000, orig: 12000, rate: 0, pay: 500, freq: 'Monthly', next: K.iso(K.addDays(K.today(), 3)) }];
  assert.equal(K.derive(d, ctx).loanBal, 3600); // 10,000 PEN in CAD
  d = K.payLoan(d, 'car', 'acct:pen', 0);
  assert.equal(d.loans[0].bal, 9500);
  assert.equal(d.accounts[0].bal, 4500);
  assert.equal(d.txns[0].cur, 'PEN');
});

test('an old statement marked as already paid counts in statistics but moves no balance', () => {
  let d = K.factory();
  d.cards = [{ id: 'visa', name: 'Visa', cur: 'CAD', bal: 0, limit: 5000, stmtBal: 0 }];
  d = K.addTxn(d, { type: 'expense', merchant: 'Loblaws', amt: 120, cur: 'CAD', from: 'card:visa', date: '2026-03-10', source: 'statement', settled: true });
  assert.equal(d.cards[0].bal, 0);
  assert.equal(d.txns[0].base, 120);
  // Imported before the option existed: mark them paid afterwards
  d = K.addTxn(d, { type: 'expense', merchant: 'Shell', amt: 80, cur: 'CAD', from: 'card:visa', date: '2026-03-12', source: 'statement' });
  d = K.addTxn(d, { type: 'expense', merchant: 'Uber', amt: 20, cur: 'CAD', from: 'card:visa', date: '2026-09-20', source: 'statement' });
  assert.equal(d.cards[0].bal, 100);
  d = K.settleImported(d, 'card:visa', '2026-03-31');
  assert.equal(d.cards[0].bal, 20);
  assert.equal(d.txns.length, 3);
  // Turning it off puts the charge back on the card
  const shell = d.txns.find((t) => t.merchant === 'Shell');
  d = K.editTxn(d, shell.id, { settled: undefined });
  assert.equal(d.cards[0].bal, 100);
});

test('a card payment on a bank statement is a transfer, not spending', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 3000)];
  d.cards = [{ id: 'visa', name: 'CIBC Aventura', network: 'Visa', last4: '4455', cur: 'CAD', bal: 500, limit: 5000 }, { id: 'mc', name: 'Costco', network: 'Mastercard', cur: 'CAD', bal: 0, limit: 3000 }];
  assert.equal(K.cardPaymentFor(d, 'PAGO TARJETA VISA').card.id, 'visa');
  assert.equal(K.cardPaymentFor(d, 'AVENTURA PAYMENT THANK YOU').card.id, 'visa');
  assert.equal(K.cardPaymentFor(d, 'PAYMENT CARD 4455').card.id, 'visa');
  assert.equal(K.cardPaymentFor(d, 'PAGO DE SERVICIOS LUZ DEL SUR'), null);
  assert.equal(K.cardPaymentFor(d, 'LOBLAWS 1234'), null);
  // Already imported as spending: fixing it keeps every balance as it was
  d = K.addTxn(d, { type: 'expense', merchant: 'CIBC VISA PAYMENT', amt: 400, cur: 'CAD', from: 'acct:chq', date: '2026-09-01', source: 'statement', cat: 'other' });
  assert.equal(K.misfiledCardPayments(d).length, 1);
  const before = [d.accounts[0].bal, d.cards[0].bal];
  d = K.fixCardPayments(d);
  assert.deepEqual([d.accounts[0].bal, d.cards[0].bal], before);
  assert.equal(d.txns[0].type, 'transfer');
  assert.equal(K.misfiledCardPayments(d).length, 0);
});

test('a balance remembers the day it was typed; statement lines up to then are history', () => {
  let d = K.factory();
  d = K.upsert(d, 'accounts', { id: 'chq', name: 'Chequing', kind: 'Everyday', cur: 'CAD', bal: 1000 });
  assert.equal(K.balDate(d, 'acct:chq'), K.iso(K.today()));
  d = Object.assign({}, d, { accounts: d.accounts.map((a) => Object.assign({}, a, { balDate: '2026-01-01' })) });
  d = K.upsert(d, 'accounts', Object.assign({}, d.accounts[0], { name: 'Main' }));
  assert.equal(K.balDate(d, 'acct:chq'), '2026-01-01'); // renaming doesn't move it
  d = K.upsert(d, 'accounts', Object.assign({}, d.accounts[0], { bal: 1200 }));
  assert.equal(K.balDate(d, 'acct:chq'), K.iso(K.today()));
});

test('purchases read with the wrong sign are recognized and can become expenses', () => {
  // Card exports that list purchases as negative
  assert.equal(K.spendSign([{ amt: -11.09, desc: 'APPLE.COM/BILL' }, { amt: -40, desc: 'SHELL' }, { amt: 300, desc: 'PAYMENT THANK YOU' }], true), -1);
  assert.equal(K.spendSign([{ amt: 11.09, desc: 'APPLE.COM/BILL' }, { amt: 40, desc: 'SHELL' }, { amt: -300, desc: 'PAYMENT THANK YOU' }], true), 1);
  // A debit account with more deposits than purchases still spends in negative
  assert.equal(K.spendSign([{ amt: 2310, desc: 'PAYROLL ACME' }, { amt: -80, desc: 'METRO' }, { amt: 2104, desc: 'PAYROLL ACME' }, { amt: -45, desc: 'ESSO' }, { amt: 2689, desc: 'PAYROLL ACME' }, { amt: 150, desc: 'E-TRANSFER FROM ANA' }], false), -1);
  let d = K.factory();
  d.cards = [{ id: 'visa', name: 'Visa', cur: 'CAD', bal: 0, limit: 5000 }];
  d = K.addTxn(d, { type: 'transfer', merchant: 'APPLE.COM/BILL TORONTO', amt: 11.09, cur: 'CAD', from: null, to: 'card:visa', date: '2026-08-19', source: 'statement', settled: true });
  d = K.addTxn(d, { type: 'transfer', merchant: 'PAYMENT - THANK YOU', amt: 300, cur: 'CAD', from: null, to: 'card:visa', date: '2026-08-20', source: 'statement', settled: true });
  assert.equal(K.likelyPurchases(d).length, 1);
  d = K.fixLikelyPurchases(d);
  const apple = d.txns.find((t) => t.merchant.startsWith('APPLE'));
  assert.equal(apple.type, 'expense');
  assert.equal(apple.from, 'card:visa');
  assert.equal(apple.settled, true);
  assert.equal(d.cards[0].bal, 0);
  // Back to a transfer by hand, then to income
  d = K.changeType(d, apple.id, 'income');
  assert.equal(d.txns.find((t) => t.id === apple.id).type, 'income');
});

test('payroll deposits set the salary: how often, the usual amount and the next payday', () => {
  assert.equal(K.isPayroll('PAYROLL DEPOSIT ACME INC'), true);
  assert.equal(K.isPayroll('ABONO DE NOMINA'), true);
  assert.equal(K.isPayroll('E-TRANSFER FROM ANA'), false);
  const bi = K.payrollPlan([{ date: '2026-07-03', amt: 2100 }, { date: '2026-07-17', amt: 2300 }, { date: '2026-07-31', amt: 2000 }, { date: '2026-08-14', amt: 2600 }]);
  assert.equal(bi.freq, 'Bi-weekly');
  assert.equal(bi.amt, K.r2((2300 + 2000 + 2600) / 3));
  assert.ok(bi.next > K.iso(K.today()));
  assert.equal(K.payrollPlan([{ date: '2026-06-15', amt: 1 }, { date: '2026-06-30', amt: 1 }, { date: '2026-07-15', amt: 1 }, { date: '2026-07-31', amt: 1 }]).freq, 'Twice monthly');
  assert.equal(K.payrollPlan([{ date: '2026-06-28', amt: 1 }, { date: '2026-07-28', amt: 1 }, { date: '2026-08-28', amt: 1 }]).freq, 'Monthly');
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 1000)];
  [['2026-08-14', 2500], ['2026-08-28', 2700]].forEach(([date, amt]) => { d = K.addTxn(d, { type: 'income', merchant: 'PAYROLL ACME', amt, cur: 'CAD', from: 'acct:chq', date, source: 'statement', settled: true }); });
  d = K.syncPayroll(d, 'acct:chq');
  assert.equal(d.income.length, 1);
  assert.equal(d.income[0].amt, 2600);
  assert.equal(d.income[0].freq, 'Bi-weekly');
  assert.equal(d.income[0].to, 'acct:chq');
  d = K.syncPayroll(d, 'acct:chq'); // again: updates, doesn't duplicate
  assert.equal(d.income.length, 1);
});

test('a payment that comes back every month is offered as a bill, and becomes one', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  const add = (merchant, amt, date) => { d = K.addTxn(d, { type: 'expense', merchant, amt, cur: 'CAD', from: 'acct:chq', date, source: 'statement', settled: true, cat: K.guessCat(d, merchant) }); };
  add('PREAUTHORIZED DEBIT INTACT INSURANCE 44512', 145.2, '2026-06-12');
  add('PREAUTHORIZED DEBIT INTACT INSURANCE 44513', 145.2, '2026-07-12');
  add('PREAUTHORIZED DEBIT INTACT INSURANCE 44514', 148.9, '2026-08-12');
  ['2026-07-02', '2026-07-09', '2026-07-20', '2026-08-03'].forEach((date, i) => add('METRO #' + i, 40 + i * 13, date)); // groceries: several a month, not a bill
  add('ROGERS WIRELESS', 85, '2026-08-05'); // once only
  const found = K.findRecurring(d);
  assert.equal(found.length, 1);
  assert.equal(found[0].name, 'Intact Insurance');
  assert.equal(found[0].day, 12);
  assert.equal(found[0].amt, 148.9);
  assert.equal(found[0].cat, 'bills');
  d = K.addRecurringBills(d, found);
  assert.equal(d.bills.length, 1);
  assert.equal(d.bills[0].pay, 'acct:chq');
  assert.equal(d.txns.filter((t) => t.recurring === d.bills[0].id).length, 3);
  assert.equal(K.findRecurring(d).length, 0); // not offered again
  // While importing: the new month joins the ones already in Kipu
  let e = K.factory();
  e.accounts = [account('chq', 'CAD', 5000)];
  e = K.addTxn(e, { type: 'expense', merchant: 'GOODLIFE FITNESS', amt: 54.99, cur: 'CAD', from: 'acct:chq', date: '2026-07-01', source: 'statement', settled: true });
  assert.equal(K.findRecurring(e, [{ type: 'expense', date: '2026-08-01', amt: 54.99, desc: 'GOODLIFE FITNESS', cat: 'health', where: 'acct:chq' }]).length, 1);
});

test('a repeating payment that isn’t a bill can be left out, and a wrong bill undone', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  [['2026-06-03', 60], ['2026-07-03', 60], ['2026-08-03', 62]].forEach(([date, amt]) => { d = K.addTxn(d, { type: 'expense', merchant: 'E-TRANSFER MOM', amt, cur: 'CAD', from: 'acct:chq', date, source: 'statement', settled: true }); });
  const found = K.findRecurring(d);
  assert.equal(found.length, 1);
  d = K.dismissRecurring(d, found);
  assert.equal(K.findRecurring(d).length, 0);
  // Saved as a bill by mistake, then deleted: payments unlinked and not offered again
  let e = K.factory();
  e.accounts = [account('chq', 'CAD', 5000)];
  [['2026-06-03', 60], ['2026-07-03', 60]].forEach(([date, amt]) => { e = K.addTxn(e, { type: 'expense', merchant: 'E-TRANSFER MOM', amt, cur: 'CAD', from: 'acct:chq', date, source: 'statement', settled: true }); });
  e = K.addRecurringBills(e, K.findRecurring(e));
  const id = e.bills[0].id;
  e = K.removeBill(e, id);
  assert.equal(e.bills.length, 0);
  assert.equal(e.txns.filter((t) => t.recurring === id).length, 0);
  assert.equal(K.findRecurring(e).length, 0);
});

test('the person can mark any expense as repeating, and it becomes a bill with its other payments', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  d = K.addTxn(d, { type: 'expense', merchant: 'PAD TD INSURANCE 0912', amt: 98.5, cur: 'CAD', from: 'acct:chq', date: '2026-07-21', source: 'statement', settled: true, cat: 'other' });
  d = K.addTxn(d, { type: 'expense', merchant: 'PAD TD INSURANCE 0913', amt: 98.5, cur: 'CAD', from: 'acct:chq', date: '2026-09-21', source: 'statement', settled: true, cat: 'other' });
  assert.equal(K.findRecurring(d).length, 0); // a month missing: Kipu doesn't suggest it
  d = K.billFromTxn(d, d.txns[1].id);
  assert.equal(d.bills.length, 1);
  assert.equal(d.bills[0].name, 'Td Insurance');
  assert.equal(d.bills[0].day, 21);
  assert.equal(d.bills[0].cat, 'bills');
  assert.equal(d.txns.filter((t) => t.recurring === d.bills[0].id).length, 2);
});

test('undoing a statement import removes its movements and puts balances back', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 1000)];
  d = K.addTxn(d, { imp: 'i1', type: 'expense', merchant: 'METRO', amt: 50, cur: 'CAD', from: 'acct:chq', date: '2026-09-02', source: 'statement' });
  d = K.addTxn(d, { imp: 'i1', type: 'income', merchant: 'PAYROLL', amt: 900, cur: 'CAD', from: 'acct:chq', date: '2026-09-04', source: 'statement' });
  d = K.addTxn(d, { type: 'expense', merchant: 'Coffee', amt: 5, cur: 'CAD', from: 'acct:chq', date: '2026-09-05' });
  d.imports = [{ id: 'i1', name: 'sept.csv', when: '2026-09-25', count: 2, where: 'acct:chq' }];
  assert.equal(d.accounts[0].bal, 1845);
  d = K.undoImport(d, 'i1');
  assert.equal(d.accounts[0].bal, 995);
  assert.deepEqual(d.txns.map((t) => t.merchant), ['Coffee']);
  assert.equal(d.imports.length, 0);
});

test('a loan taken by automatic debit is recognized by its name or lender and paid down', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  d.loans = [{ id: 'car', name: 'Car loan', lender: 'Toyota Financial', bal: 12000, rate: 5, pay: 420, freq: 'Monthly', next: '2026-10-05', cur: 'CAD' }, { id: 'sofa', name: 'Sofa financing', lender: 'Flexiti', bal: 600, rate: 0, pay: 50, freq: 'Monthly', next: '2026-10-12', cur: 'CAD' }];
  assert.equal(K.loanPaymentFor(d, 'PAD TOYOTA FINANCIAL SVCS', 420).id, 'car');
  assert.equal(K.loanPaymentFor(d, 'FLEXITI FINANCIAL 8837', 50).id, 'sofa');
  assert.equal(K.loanPaymentFor(d, 'LOAN PAYMENT 0045', 421).id, 'car'); // generic words, one loan fits the amount
  assert.equal(K.loanPaymentFor(d, 'TOYOTA DEALER SERVICE', 89.99), null); // same name, amount far from the payment
  assert.equal(K.loanPaymentFor(d, 'METRO', 50), null);
  // A current payment lowers the loan; one from an old statement doesn't (it's already in the typed balance)
  const l = d.loans[0];
  d = K.addTxn(d, Object.assign(K.loanPayment(d, l, 420, '2026-09-05'), { merchant: 'PAD TOYOTA FINANCIAL', amt: 420, cur: 'CAD', from: 'acct:chq', date: '2026-09-05', source: 'statement' }));
  assert.equal(d.accounts[0].bal, 4580);
  assert.ok(d.loans[0].bal < 12000 && d.loans[0].bal > 11500);
  const bal = d.loans[0].bal;
  d = K.addTxn(d, Object.assign(K.loanPayment(d, d.loans[0], 420, '2026-08-05'), { merchant: 'PAD TOYOTA FINANCIAL', amt: 420, cur: 'CAD', from: 'acct:chq', date: '2026-08-05', source: 'statement', settled: true }));
  assert.equal(d.loans[0].bal, bal);
  // Imported before as spending: fixed without moving any balance
  d = K.addTxn(d, { type: 'expense', merchant: 'FLEXITI FINANCIAL 8837', amt: 50, cur: 'CAD', from: 'acct:chq', date: '2026-09-12', source: 'statement' });
  const before = [d.accounts[0].bal, d.loans[1].bal];
  assert.equal(K.misfiledLoanPayments(d).length, 1);
  d = K.fixLoanPayments(d);
  assert.deepEqual([d.accounts[0].bal, d.loans[1].bal], before);
  assert.equal(d.txns.find((t) => t.merchant.startsWith('FLEXITI')).type, 'debt');
});

test('a bill follows its latest payment; a big jump waits; a bill with an end stops counting', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  d.bills = [{ id: 'ins', name: 'Car insurance', kind: 'Bill', amt: 148.9, cur: 'CAD', day: 12, cat: 'bills', pay: 'acct:chq' }, { id: 'net', name: 'Internet', kind: 'Bill', amt: 75, cur: 'CAD', day: 18, cat: 'bills', pay: 'acct:chq' }];
  d = K.addTxn(d, { type: 'expense', merchant: 'INTACT', amt: 135, cur: 'CAD', from: 'acct:chq', date: '2026-09-12', recurring: 'ins', source: 'statement', settled: true });
  assert.equal(d.bills[0].amt, 135);
  assert.deepEqual([d.bills[0].lastChange.from, d.bills[0].lastChange.to], [148.9, 135]);
  // An older payment doesn't bring the old price back
  d = K.addTxn(d, { type: 'expense', merchant: 'INTACT', amt: 148.9, cur: 'CAD', from: 'acct:chq', date: '2026-08-12', recurring: 'ins', source: 'statement', settled: true });
  assert.equal(d.bills[0].amt, 135);
  // Internet charged 160 once: asked, not changed
  d = K.addTxn(d, { type: 'expense', merchant: 'ROGERS', amt: 160, cur: 'CAD', from: 'acct:chq', date: '2026-09-18', recurring: 'net', source: 'statement', settled: true });
  assert.equal(d.bills[1].amt, 75);
  assert.equal(d.bills[1].pendingPrice.amt, 160);
  d = K.keepPrice(d, 'net');
  assert.equal(d.bills[1].pendingPrice, undefined);
  // Ends in: after that month the bill no longer counts
  const ctx2 = { scope: 'personal', currency: 'Combined' };
  const before = K.derive(d, ctx2).plan.commitments;
  d = K.upsert(d, 'bills', Object.assign({}, d.bills[1], { end: '2020-01' }));
  assert.equal(K.billActive(d.bills[1]), false);
  assert.ok(K.derive(d, ctx2).plan.commitments < before);
});

test('couples who split some costs: your part in your numbers, the whole in the Household, and who owes whom', () => {
  let d = K.setHouseholdMode(K.factory(), 'mixed', { partner: 'Kari', split: 50 });
  d.accounts = [account('cad', 'CAD', 1000)];
  d = K.addTxn(d, { type: 'expense', merchant: 'Groceries', cat: 'groceries', amt: 100, cur: 'CAD', from: 'acct:cad', shared: true, split: { by: 'me', mine: 50 } });
  d = K.addTxn(d, { type: 'expense', merchant: 'Dinner', cat: 'dining', amt: 80, cur: 'CAD', from: '', shared: true, split: { by: 'partner', mine: 50 } });
  d = K.addTxn(d, { type: 'expense', merchant: 'Shoes', cat: 'shopping', amt: 60, cur: 'CAD', from: 'acct:cad' });
  assert.equal(d.accounts[0].bal, 840); // Kari's dinner doesn't touch your account
  assert.equal(K.derive(d, ctx).month.spending, 150); // 50 + 40 + 60
  assert.equal(K.derive(d, { scope: 'household', currency: 'Combined' }).month.spending, 180); // the whole shared costs
  assert.equal(K.splitBalance(d).owed, 10); // Kari owes 50, you owe 40
  d = K.settleUp(d, { amt: 10, where: 'acct:cad', dir: 'in' });
  assert.equal(K.splitBalance(d).owed, 0);
  assert.equal(d.accounts[0].bal, 850);
  assert.equal(K.derive(d, ctx).month.income, 0); // settling up isn't income
});

test('couples who share everything see it all in the Household, without marking each item', () => {
  let d = K.setHouseholdMode(K.factory(), 'together', { partner: 'Kari' });
  d.profile.name = 'Jose';
  d.accounts = [account('cad', 'CAD', 500)];
  d = K.addTxn(d, { type: 'expense', merchant: 'Rent', cat: 'housing', amt: 400, cur: 'CAD', from: 'acct:cad' });
  const H = K.derive(d, { scope: 'household', currency: 'Combined' });
  assert.equal(H.month.spending, 400);
  assert.equal(H.plan.cashNow, 100);
  assert.equal(K.hhMode(d), 'together');
  assert.equal(K.hhMode(K.setHouseholdMode(d, 'solo')), 'solo');
  assert.equal(K.hhMode(Object.assign(K.factory(), { household: { enabled: true, name: 'Old' } })), 'mixed'); // households made before modes
});

test('a debt plan: extra money pays loans off sooner and with less interest, highest rate first', () => {
  const d = K.factory();
  const loans = [
    { id: 'car', name: 'Car', bal: 10000, pay: 300, rate: 9, freq: 'Monthly', cur: 'CAD' },
    { id: 'card', name: 'Card loan', bal: 3000, pay: 100, rate: 24, freq: 'Monthly', cur: 'CAD' },
  ];
  const base = K.debtPlan(d, loans, 0, 'avalanche');
  const more = K.debtPlan(d, loans, 200, 'avalanche');
  const snow = K.debtPlan(d, loans, 200, 'snowball');
  assert.ok(more.months < base.months);
  assert.ok(more.interest < base.interest);
  assert.equal(more.loans[0].id, 'card'); // 24% goes first
  assert.ok(more.interest <= snow.interest);
  assert.equal(K.debtPlan(d, [], 100), null);
});

test('one line is enough to add an expense', () => {
  const d = K.factory();
  assert.deepStrictEqual(K.parseQuick('45 Wong', d), { amt: 45, cur: null, merchant: 'Wong', date: K.iso(K.today()) });
  const q = K.parseQuick('S/ 12.50 taxi ayer', d);
  assert.equal(q.amt, 12.5); assert.equal(q.cur, 'PEN'); assert.equal(q.merchant, 'Taxi'); assert.equal(q.date, K.iso(K.addDays(K.today(), -1)));
  assert.equal(K.parseQuick('1,250 laptop', d).amt, 1250);
  assert.equal(K.parseQuick('almuerzo', d), null);
  assert.equal(K.tidyDesc('TRANSF.YAPE-MARIA LOPEZ 987654321'), 'Yape · Maria Lopez');
  assert.equal(K.guessCat(d, 'PLAZA VEA SAN ISIDRO'), 'groceries');
});

test('reminders cover what is due in the next three days and not paid yet', () => {
  let d = K.factory();
  const T = K.today(), due = K.addDays(T, 2);
  d.accounts = [account('cad', 'CAD', 3000)];
  d.bills = [{ id: 'rent', name: 'Rent', kind: 'Bill', amt: 1500, cur: 'CAD', day: due.getDate(), cat: 'housing', pay: 'acct:cad' }, { id: 'nf', name: 'Netflix', kind: 'Subscription', amt: 20, cur: 'CAD', day: due.getDate(), cat: 'subs', pay: 'card:x' }];
  assert.deepStrictEqual(K.derive(d, ctx).dueSoon.map((x) => x.name), due.getDate() <= 28 ? ['Rent'] : []);
  d = K.addTxn(d, { type: 'expense', merchant: 'Rent', amt: 1500, cur: 'CAD', from: 'acct:cad', recurring: 'rent', cat: 'housing' });
  assert.equal(K.derive(d, ctx).dueSoon.length, 0); // paid early
});

test('bought in one currency, charged in another: the card moves by what the bank charged', () => {
  let d = K.factory();
  d.base = 'CAD'; d.fx.usd = { USD: 1, CAD: 1.35, PEN: 3.75 };
  d.cards = [{ id: 'us', name: 'US card', cur: 'USD', bal: 0, limit: 5000 }, { id: 'pe', name: 'Two-currency', cur: 'PEN', cur2: 'USD', bal: 0, bal2: 0, limit: 8000, fxFee: 3 }];
  const est = K.chargeEstimate(d, 135, 'CAD', 'card:us');
  assert.equal(est.cur, 'USD'); assert.equal(est.market, 100); assert.equal(est.amt, 102.5); // 2.5% default card fee
  const est2 = K.chargeEstimate(d, 135, 'CAD', 'card:pe');
  assert.equal(est2.cur, 'USD'); assert.equal(est2.amt, 103); // foreign purchase billed in dollars, 3% fee
  assert.equal(K.chargeEstimate(d, 50, 'PEN', 'card:pe'), null); // same currency: nothing to convert
  d = K.addTxn(d, { type: 'expense', merchant: 'Groceries', cat: 'groceries', amt: 135, cur: 'CAD', from: 'card:us', charged: { amt: 103.1, cur: 'USD', market: 100, exact: true } });
  assert.equal(d.cards[0].bal, 103.1);
  assert.equal(d.txns[0].amt, 135); assert.equal(d.txns[0].cur, 'CAD'); // the purchase keeps its own currency
  assert.equal(d.txns[0].base, K.toBase(d, 103.1, 'USD')); // what it really cost you
  assert.equal(K.fxCost(d, 'card:us').pct, 3.1);
  d = K.addTxn(d, { type: 'expense', merchant: 'Shoes', cat: 'shopping', amt: 67.5, cur: 'CAD', from: 'card:pe', charged: { amt: 51.5, cur: 'USD' } });
  assert.equal(d.cards[1].bal2, 51.5); assert.equal(d.cards[1].bal, 0);
});

test('statement lines that show the original purchase and the rate', () => {
  assert.deepStrictEqual(K.parseFxInfo('AMAZON.CA CAD 45.00 T/C 0.7412', 'USD'), { cur: 'CAD', amt: 45, rate: 0.7412, desc: 'AMAZON.CA' });
  assert.equal(K.parseFxInfo('UBER USD 12,50 TC:3.745', 'PEN').amt, 12.5);
  assert.equal(K.parseFxInfo('WALMART USD 1,234.50', 'PEN').amt, 1234.5);
  assert.equal(K.parseFxInfo('WONG PEN 45.00', 'PEN'), null); // same currency as the statement
  assert.equal(K.parseFxInfo('TIM HORTONS #123', 'CAD'), null);
});

test('a card payment is never spending, whatever the bank calls it', () => {
  const d = K.factory();
  d.cards = [{ id: 'amex', name: 'Amex Cobalt', network: 'Amex', cur: 'CAD', bal: 500 }, { id: 'v', name: 'Visa Infinite', network: 'Visa', last4: '1187', cur: 'CAD', bal: 0 }];
  assert.equal(K.cardPaymentFor(d, 'AMEX BANK OF CANADA').card.id, 'amex'); // issuer only, no "payment"
  assert.equal(K.cardPaymentFor(d, 'CHASE CREDIT CRD AUTOPAY').card, null); // a card that isn't in Kipu: still not spending
  assert.equal(K.cardPaymentFor(d, 'TD VISA PREAUTH PYMT 1187').card.id, 'v');
  assert.equal(K.cardPaymentFor(d, 'APPLE PAY STARBUCKS'), null); // paying with a phone wallet is a purchase
  assert.equal(K.cardPaymentFor(d, 'BILL PAY HYDRO ONE'), null);
});

test('the same card payment on the bank and the card statement counts once', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 2000)];
  d.cards = [card('visa', 'CAD', 800)];
  // Bank line with no payment wording, imported as spending
  d = K.addTxn(d, { type: 'expense', merchant: 'ONLINE TRANSFER 00123', cat: 'other', amt: 800, cur: 'CAD', from: 'acct:chq', date: K.iso(K.addDays(K.today(), -3)), source: 'statement' });
  // The card statement shows the payment arriving
  d = K.addTxn(d, { type: 'transfer', cat: 'transfer', merchant: 'PAYMENT - THANK YOU', amt: 800, cur: 'CAD', from: null, to: 'card:visa', date: K.iso(K.addDays(K.today(), -1)), source: 'statement' });
  assert.equal(K.misfiledCardPayments(d).length, 1);
  d = K.fixCardPayments(d);
  assert.equal(K.derive(d, ctx).month.spending, 0);
  assert.equal(d.accounts[0].bal, 1200); // left the bank once
  assert.equal(d.cards[0].bal, 0); // paid once
  assert.equal(K.cardPaymentPairs(d).length, 0);
  // A transfer typed by hand and the card statement's payment line: the card isn't credited twice
  let e = K.factory();
  e.accounts = [account('chq', 'CAD', 2000)]; e.cards = [card('visa', 'CAD', 800)];
  e = K.addTxn(e, { type: 'transfer', cat: 'transfer', merchant: 'Payment to Visa', amt: 800, cur: 'CAD', from: 'acct:chq', to: 'card:visa' });
  e = K.addTxn(e, { type: 'transfer', cat: 'transfer', merchant: 'PAGO RECIBIDO', amt: 800, cur: 'CAD', from: null, to: 'card:visa', source: 'statement' });
  assert.equal(e.cards[0].bal, -800); // credited twice before merging
  e = K.mergeCardPayments(e);
  assert.equal(e.cards[0].bal, 0); assert.equal(e.accounts[0].bal, 1200);
});

test('each card’s own fee: the one you set, else what it really charged before', () => {
  let d = K.factory();
  d.base = 'CAD'; d.fx.usd = { USD: 1, CAD: 1.35 };
  d.cards = [{ id: 'us', name: 'US card', cur: 'USD', bal: 0 }, { id: 'wise', name: 'No-fee card', cur: 'USD', bal: 0, fxFee: 0 }];
  assert.equal(K.fxFeeOf(d, 'card:us'), 2.5);
  assert.equal(K.fxFeeOf(d, 'card:wise'), 0);
  [[103.4, 100], [51.7, 50]].forEach(([amt, market]) => { d = K.addTxn(d, { type: 'expense', merchant: 'Shop', cat: 'shopping', amt: market * 1.35, cur: 'CAD', from: 'card:us', charged: { amt, cur: 'USD', market, exact: true } }); });
  assert.equal(K.fxFeeOf(d, 'card:us'), 3.4); // learned from two real charges
  assert.equal(K.chargeEstimate(d, 135, 'CAD', 'card:us').amt, 103.4);
});

test('three views: only yours, only the Household, or everything', () => {
  let d = K.setHouseholdMode(K.factory(), 'mixed', { partner: 'Kari' });
  d.accounts = [Object.assign(account('mine', 'CAD', 1000), { shared: false }), Object.assign(account('joint', 'CAD', 3000), { shared: true })];
  d = K.addTxn(d, { type: 'expense', merchant: 'Shoes', cat: 'shopping', amt: 100, cur: 'CAD', from: 'acct:mine' });
  d = K.addTxn(d, { type: 'expense', merchant: 'Groceries', cat: 'groceries', amt: 300, cur: 'CAD', from: 'acct:joint', shared: true });
  const view = (scope) => K.derive(d, { scope, currency: 'Combined' });
  assert.equal(view('mine').plan.cashNow, 900); assert.equal(view('mine').month.spending, 100);
  assert.equal(view('household').plan.cashNow, 2700); assert.equal(view('household').month.spending, 300);
  assert.equal(view('personal').plan.cashNow, 3600); assert.equal(view('personal').month.spending, 400);
});

test('personal stays in your own file, shared goes to the Household file', () => {
  const p = Object.assign(K.factory(), { onboarded: true, profile: { name: 'Jose', email: '' }, hhKeys: { h1: 'secret phrase 123' } });
  p.accounts = [account('mine', 'CAD', 1000), Object.assign(account('old', 'CAD', 50), { shared: true })];
  const h = Object.assign(K.factory(), { onboarded: true });
  h.accounts = [Object.assign(account('joint', 'CAD', 3000), { shared: true })];
  let d = K.combineSpaces(p, h, { id: 'h1', name: 'Jose & Kari' });
  assert.deepStrictEqual(d.accounts.map((a) => a.id).sort(), ['joint', 'mine', 'old']);
  d = K.addTxn(d, { type: 'expense', merchant: 'Shoes', cat: 'shopping', amt: 100, cur: 'CAD', from: 'acct:mine' });
  d = K.addTxn(d, { type: 'expense', merchant: 'Groceries', cat: 'groceries', amt: 80, cur: 'CAD', from: 'acct:mine', shared: true }); // household groceries on a personal account
  const [mine, ours] = K.splitSpaces(d, h);
  assert.deepStrictEqual(mine.accounts.map((a) => a.id), ['mine']);
  assert.deepStrictEqual(ours.accounts.map((a) => a.id).sort(), ['joint', 'old']); // shared before: moves to the Household
  assert.deepStrictEqual(mine.txns.map((t) => t.merchant), ['Shoes']);
  assert.deepStrictEqual(ours.txns.map((t) => t.merchant), ['Groceries']);
  assert.equal(mine.accounts[0].bal, 820); // your balance lives with you
  assert.equal(ours.hhKeys, undefined); // never shared
  assert.equal(JSON.stringify(ours).includes('Shoes'), false);
  // Kari opens the Household: she sees the joint account and the groceries, never Jose's account or shoes
  const kari = K.combineSpaces(Object.assign(K.factory(), { onboarded: true }), ours, { id: 'h1', name: 'Jose & Kari' });
  assert.deepStrictEqual(kari.accounts.map((a) => a.id).sort(), ['joint', 'old']);
  assert.deepStrictEqual(kari.txns.map((t) => t.merchant), ['Groceries']);
});

test('movements on a shared account are shared, so both people see them', () => {
  let d = K.factory();
  d.accounts = [Object.assign(account('joint', 'CAD', 3000), { shared: true }), account('mine', 'CAD', 500)];
  d = K.addTxn(d, { type: 'expense', merchant: 'Wong', cat: 'groceries', amt: 80, cur: 'CAD', from: 'acct:joint' });
  d = K.addTxn(d, { type: 'transfer', cat: 'transfer', merchant: 'To joint', amt: 100, cur: 'CAD', from: 'acct:mine', to: 'acct:joint' });
  d = K.addTxn(d, { type: 'expense', merchant: 'Shoes', cat: 'shopping', amt: 60, cur: 'CAD', from: 'acct:mine' });
  assert.deepStrictEqual(d.txns.map((t) => t.shared), [true, true, false]);
});

test('ask Kipu: reaching month end and whether something fits', () => {
  let d = K.factory();
  const T = K.today();
  d.accounts = [account('chq', 'CAD', 1000), Object.assign(account('sav', 'CAD', 8000), { kind: 'Savings' })];
  d.income = [{ id: 'pay', name: 'Salary', amt: 2000, cur: 'CAD', freq: 'Monthly', next: K.iso(K.addDays(T, 40)), to: 'acct:chq' }];
  d.bills = [{ id: 'rent', name: 'Rent', kind: 'Bill', amt: 1500, cur: 'CAD', day: 28, cat: 'housing', pay: 'acct:chq' }];
  let D = K.derive(d, ctx);
  const m = K.askMonthEnd(d, D);
  if (T.getDate() < 28) { assert.ok(m.short > 0); assert.ok(m.perDayCut > 0); } // rent is more than the cash left
  assert.equal(K.askAfford(d, D, 50).verdict, D.plan.safe >= 50 ? 'yes' : K.askAfford(d, D, 50).verdict);
  const big = K.askAfford(d, D, 4000);
  assert.ok(['savings', 'installments', 'save', 'no'].includes(big.verdict));
  assert.equal(big.afterSavings, 4000);
  assert.deepStrictEqual(K.parseQuestion('quiero comprar un celular de 2,500 en 12 cuotas'), { kind: 'afford', amount: 2500, installments: 12 });
  assert.equal(K.parseQuestion('¿llego a fin de mes?').kind, 'month');
});

test('e-transfers and transfers are transfers either way, never spending or income', () => {
  assert.equal(K.isTransferText('E-TRANSFER SENT JOHN'), true);
  assert.equal(K.isTransferText('INTERAC E-TRANSFER FROM ANA'), true);
  assert.equal(K.isTransferText('TRANSFER TO SAVINGS 4411'), true);
  assert.equal(K.isTransferText('Transferencia interbancaria'), true);
  assert.equal(K.isTransferText('PAYROLL DEPOSIT ACME'), false);
  assert.equal(K.isTransferText('METRO'), false);
  // Imported before as spending and income: fixed, balances unchanged
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 1000)];
  d = K.addTxn(d, { type: 'expense', merchant: 'E-TRANSFER SENT JOHN', amt: 200, cur: 'CAD', from: 'acct:chq', date: '2026-09-10', source: 'statement', cat: 'other' });
  d = K.addTxn(d, { type: 'income', merchant: 'E-TRANSFER FROM ANA', amt: 50, cur: 'CAD', from: 'acct:chq', date: '2026-09-11', source: 'statement', cat: 'income' });
  assert.equal(d.accounts[0].bal, 850);
  assert.equal(K.misfiledTransfers(d).length, 2);
  d = K.fixTransfers(d);
  assert.equal(d.accounts[0].bal, 850);
  assert.deepEqual(d.txns.map((t) => [t.type, t.from, t.to]), [['transfer', 'acct:chq', null], ['transfer', null, 'acct:chq']]);
  const m = K.derive(d, { scope: 'personal', currency: 'Combined' }).month;
  assert.equal(m.income || 0, 0);
});

test('renaming a bill or loan renames its payments and keeps recognizing the bank text', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  const add = (date) => { d = K.addTxn(d, { type: 'expense', merchant: 'PREAUTHORIZED DEBIT INTACT INSURANCE 4451', amt: 145, cur: 'CAD', from: 'acct:chq', date, source: 'statement', settled: true }); };
  add('2026-07-12'); add('2026-08-12');
  d = K.addRecurringBills(d, K.findRecurring(d));
  const id = d.bills[0].id;
  d = K.upsert(d, 'bills', Object.assign({}, d.bills[0], { name: 'Car insurance' }));
  assert.deepEqual(d.txns.map((t) => K.txnName(d, t)), ['Car insurance', 'Car insurance']);
  assert.equal(d.txns[0].merchant, 'PREAUTHORIZED DEBIT INTACT INSURANCE 4451'); // the bank's text stays underneath
  add('2026-09-12'); // a new month still pays the renamed bill
  assert.equal(d.txns[2].recurring, id);
  assert.equal(K.findRecurring(d).length, 0);
});

test('a new price still pays the bill: the insurance goes down and the bill follows', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  const add = (date, amt) => { d = K.addTxn(d, { type: 'expense', merchant: 'PREAUTHORIZED DEBIT INTACT INSURANCE 4451', amt, cur: 'CAD', from: 'acct:chq', date, source: 'statement', settled: true }); };
  add('2026-06-12', 148.9); add('2026-07-12', 148.9);
  d = K.addRecurringBills(d, K.findRecurring(d));
  d = K.upsert(d, 'bills', Object.assign({}, d.bills[0], { name: 'Car insurance' }));
  const id = d.bills[0].id;
  add('2026-08-12', 135); // renewed at a lower price
  assert.equal(d.txns[2].recurring, id);
  assert.equal(d.bills[0].amt, 135);
  add('2026-09-12', 210); // a big jump: linked, but asked before changing the bill
  assert.equal(d.txns[3].recurring, id);
  assert.equal(d.bills[0].amt, 135);
  assert.equal(d.bills[0].pendingPrice.amt, 210);
  // A shop that only shares a word with a bill still needs the same amount
  d.bills.push({ id: 'gym', name: 'Gym membership', kind: 'Bill', amt: 49, cur: 'CAD', day: 2, cat: 'health', pay: 'acct:chq' });
  d = K.addTxn(d, { type: 'expense', merchant: 'GYM SHARK APPAREL', amt: 80, cur: 'CAD', from: 'acct:chq', date: '2026-09-02', source: 'statement', settled: true });
  assert.equal(d.txns[4].recurring, undefined);
});

test('the big picture covers every month and year since the first movement', () => {
  const t = (date, type, base, cat) => ({ date, type, base, cat });
  const H = K.history([t('2025-08-14', 'income', 5000), t('2025-08-20', 'expense', 1200, 'groceries'), t('2025-08-25', 'debt', 400), t('2025-08-26', 'transfer', 999), t('2026-08-14', 'income', 5400), t('2026-08-20', 'expense', 1000, 'groceries')]);
  const aug25 = H.months.find((m) => m.key === '2025-08'), aug26 = H.months.find((m) => m.key === '2026-08');
  assert.deepEqual([aug25.income, aug25.out, aug25.left], [5000, 1600, 3400]); // transfers left out, loan payments count as out
  assert.equal(aug25.rate, 68);
  assert.deepEqual([aug26.income, aug26.out, aug26.left], [5400, 1000, 4400]);
  assert.ok(H.months.find((m) => m.key === '2025-12').count === 0); // empty months are kept so gaps show
  assert.deepEqual(H.years.map((y) => [y.key, y.left]), [['2025', 3400], ['2026', 4400]]);
});

test('comparing against the period we are in uses the same stretch of the other one', () => {
  const T = K.today(), y = T.getFullYear();
  const md = K.iso(T).slice(5);
  const early = y - 1 + '-01-10', late = y - 1 + '-12-20';
  const txns = [{ date: early, type: 'income', base: 1000 }, { date: late, type: 'income', base: 5000 }, { date: (y - 1) + '-' + md, type: 'expense', base: 10, cat: undefined }];
  const same = K.sameStretch(txns, { key: String(y - 1) });
  assert.equal(same.income, md >= '12-20' ? 6000 : 1000);
  assert.equal(same.cats.other, 10); // no category counts as Other
});

test('a card with a closing day works out its statement: closes the 15th, due the 5th, paid at month end', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 3000)];
  d.cards = [{ id: 'cibc', name: 'CIBC', cur: 'CAD', bal: 0, limit: 5000, closeDay: 15, dueDay: 5, payDay: 30 }];
  const T = new Date(2026, 8, 25); // Sep 25
  const buy = (date, amt) => { d = K.addTxn(d, { type: 'expense', merchant: 'SHOP', amt, cur: 'CAD', from: 'card:cibc', date, source: 'manual' }); };
  buy('2026-08-10', 99); // previous statement
  buy('2026-08-20', 30); buy('2026-09-10', 20); // on the Sep 15 statement: 50
  buy('2026-09-18', 70); // after the close: next statement
  const c = K.cardCycle(d, d.cards[0], T);
  assert.deepEqual([c.from, c.lastClose, c.due, c.payBy, c.nextClose], ['2026-08-16', '2026-09-15', '2026-10-05', '2026-09-30', '2026-10-15']);
  assert.deepEqual([c.statement, c.owed, c.since], [50, 50, 70]);
  // Paying 50 after the close clears the statement
  d = K.addTxn(d, { type: 'transfer', merchant: 'Payment', amt: 50, cur: 'CAD', from: 'acct:chq', to: 'card:cibc', date: '2026-09-24' });
  const c2 = K.cardCycle(d, d.cards[0], T);
  assert.deepEqual([c2.paid, c2.owed], [50, 0]);
  // Missed the usual day: reserved for the due date; past that, today
  const late = K.cardCycle(Object.assign({}, d, { txns: d.txns.filter((t) => t.type !== 'transfer') }), d.cards[0], new Date(2026, 9, 2));
  assert.equal(late.reserveOn, '2026-10-05');
});

test('categories: shops are recognized without store numbers, and one choice per shop sticks', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  assert.equal(K.guessCat(d, 'POS PURCHASE FRESHCO #5521'), 'groceries');
  assert.equal(K.guessCat(d, 'PETRO-CANADA 88213'), 'transport');
  assert.equal(K.guessCat(d, 'SKIPTHEDISHES'), 'dining');
  assert.equal(K.guessCat(d, 'KOODO MOBILE PAD'), 'bills');
  assert.equal(K.guessCat(d, 'GOODLIFE CLUBS'), 'health');
  assert.equal(K.guessCat(d, 'PLAZA VEA SURCO'), 'groceries');
  assert.equal(K.guessCat(d, 'INKAFARMA'), 'health');
  assert.equal(K.guessCat(d, 'OPENAI *CHATGPT SUBSCR'), 'subs');
  // Unknown shop in Other; setting it once covers every expense there and the next ones, even with a new store number
  const add = (m) => { d = K.addTxn(d, { type: 'expense', merchant: m, amt: 12, cur: 'CAD', from: 'acct:chq', date: '2026-09-02', cat: K.guessCat(d, m) }); };
  add('ZIGGYS MARKET CORNER 0012'.replace('MARKET', 'MKT')); add('ZIGGYS MKT CORNER 0044');
  assert.equal(d.txns[0].cat, 'other');
  const g = K.categoryGroups(d).find((x) => x.key === 'ziggys mkt corner');
  assert.equal(g.count, 2);
  d = K.setShopCategory(d, g.key, 'groceries');
  assert.deepEqual(d.txns.map((t) => t.cat), ['groceries', 'groceries']);
  assert.equal(K.guessCat(d, 'ZIGGYS MKT CORNER 0099'), 'groceries');
});

test('insights use the whole history, so there is something to say before this month has data', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  const add = (date, type, amt, merchant, cat) => { d = K.addTxn(d, { type, merchant, amt, cur: 'CAD', from: 'acct:chq', date, cat, source: 'statement', settled: true }); };
  const T = K.today(), mk = (back, day) => K.iso(new Date(T.getFullYear(), T.getMonth() - back, day));
  add(mk(2, 14), 'income', 5000, 'PAYROLL', 'income'); add(mk(2, 18), 'expense', 400, 'METRO', 'groceries'); add(mk(2, 20), 'expense', 300, 'METRO', 'groceries');
  add(mk(1, 14), 'income', 5000, 'PAYROLL', 'income'); add(mk(1, 18), 'expense', 900, 'METRO', 'groceries'); add(mk(1, 20), 'expense', 400, 'METRO', 'groceries');
  const ins = K.insights(d, K.derive(d, ctx));
  const ids = ins.map((i) => i.id);
  assert.ok(ids.includes('month'));
  assert.ok(ids.includes('cat-up'));
  assert.ok(ids.includes('shop'));
});

test('a replaced card keeps its old numbers', () => {
  assert.deepEqual(K.cardNumbers({ last4: '7788', oldLast4: ['4011'] }), ['7788', '4011']);
  assert.deepEqual(K.cardNumbers({ last4: '7788' }), ['7788']);
});

test('renaming a shop renames its other movements you haven’t named, and the next statements use the name', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  const add = (m, date) => { d = K.addTxn(d, { type: 'expense', merchant: m, amt: 5, cur: 'CAD', from: 'acct:chq', date, source: 'statement', cat: 'dining' }); };
  add('TIM HORTONS #2445 LANGFORD', '2026-09-01'); add('TIM HORTONS #2445 LANGFORD', '2026-09-03'); add('TIM HORTONS #2445 LANGFORD', '2026-09-05'); add('SUBWAY 59360', '2026-09-05');
  // One already named by hand keeps its name
  d = K.editTxn(d, d.txns.find((t) => t.date === '2026-09-05' && /TIM/.test(t.merchant)).id, { merchant: 'Coffee with Ana' });
  const first = d.txns.find((t) => t.date === '2026-09-01');
  assert.equal(K.sameShopTxns(d, first).length, 1);
  d = K.renameShop(d, first, 'Tim Hortons');
  assert.deepEqual(d.txns.map((t) => t.merchant).sort(), ['Coffee with Ana', 'SUBWAY 59360', 'Tim Hortons', 'Tim Hortons']);
  assert.equal(d.txns.find((t) => t.date === '2026-09-01').raw, 'TIM HORTONS #2445 LANGFORD');
  // Next statement: same shop with another store number gets the name; a re-imported line is still seen as already in Kipu
  assert.equal(K.shopName(d, 'TIM HORTONS #0099 LANGFORD'), 'Tim Hortons');
  assert.equal(K.shopName(d, 'SUBWAY 59360'), 'SUBWAY 59360');
});

test('one line that bills several subscriptions (Apple) is renamed by amount', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  const add = (amt, date) => { d = K.addTxn(d, { type: 'expense', merchant: 'APPLE.COM/BILL TORONTO', amt, cur: 'CAD', from: 'acct:chq', date, source: 'statement', cat: 'subs' }); };
  add(13.43, '2026-08-03'); add(4.47, '2026-08-11'); add(13.43, '2026-09-03'); add(4.47, '2026-09-11');
  const disney = d.txns.find((t) => t.amt === 13.43);
  assert.equal(K.renameScope(disney), 'amt');
  assert.equal(K.sameShopTxns(d, disney, 'amt').length, 1);
  d = K.renameShop(d, disney, 'Disney+');
  d = K.renameShop(d, d.txns.find((t) => t.amt === 4.47), 'iCloud storage');
  assert.deepEqual(d.txns.map((t) => t.merchant).sort(), ['Disney+', 'Disney+', 'iCloud storage', 'iCloud storage']);
  // Next statement: each amount keeps its name; a new amount stays as the bank wrote it
  assert.equal(K.shopName(d, 'APPLE.COM/BILL TORONTO', 13.43), 'Disney+');
  assert.equal(K.shopName(d, 'APPLE.COM/BILL TORONTO', -4.47), 'iCloud storage');
  assert.equal(K.shopName(d, 'APPLE.COM/BILL TORONTO', 19.03), 'APPLE.COM/BILL TORONTO');
  // Only this one
  const d2 = K.renameShop(d, d.txns.find((t) => t.merchant === 'Disney+'), 'Disney gift', 'one');
  assert.equal(d2.txns.filter((t) => t.merchant === 'Disney+').length, 1);
});

test('a card added with nothing owed: its statements move the balance, and one stuck as history can be counted', () => {
  let d = K.factory();
  d = K.upsert(d, 'cards', card('amex', 'CAD', 0, 4800));
  const c0 = d.cards[0];
  assert.equal(c0.balDate, undefined); // nothing typed, so no "balance as of" day
  assert.equal(K.upsert(K.factory(), 'cards', card('v', 'CAD', 250)).cards[0].balDate, K.iso(K.today()));
  // What happened before: a current statement imported as already paid
  const imp = 'i1', recent = K.iso(K.addDays(K.today(), -10)), old = K.iso(K.addDays(K.today(), -70));
  d = K.addTxn(d, { imp, settled: true, source: 'statement', type: 'expense', cat: 'dining', merchant: 'A', amt: 100, cur: 'CAD', from: 'card:' + c0.id, date: recent });
  d = K.addTxn(d, { imp, settled: true, source: 'statement', type: 'transfer', cat: 'transfer', merchant: 'PAYMENT', amt: 30, cur: 'CAD', from: null, to: 'card:' + c0.id, date: recent });
  d = K.addTxn(d, { imp: 'i0', settled: true, source: 'statement', type: 'expense', cat: 'dining', merchant: 'B', amt: 55, cur: 'CAD', from: 'card:' + c0.id, date: old });
  d = Object.assign({}, d, { imports: [{ id: imp, when: K.iso(K.today()), where: 'card:' + c0.id }, { id: 'i0', when: K.iso(K.today()), where: 'card:' + c0.id }] });
  const s = K.stuckCard(d, d.cards[0]);
  assert.equal(s.owed, 70);
  assert.equal(s.txns.length, 2);
  d = K.fixStuckCard(d, d.cards[0]);
  assert.equal(d.cards[0].bal, 70);
  assert.equal(K.stuckCard(d, d.cards[0]), null);
  assert.equal(d.txns.find((t) => t.merchant === 'B').settled, true); // the old statement stays history
});

test('a bank line with only the card company name ("AMERICAN EXPRESS") is a payment to that card', () => {
  const d = Object.assign(K.factory(), { cards: [Object.assign(card('cobalt', 'CAD'), { name: 'Cobalt', network: 'Amex' }), Object.assign(card('cibc', 'CAD'), { name: 'CIBC', network: 'Visa' })] });
  assert.equal(K.cardPaymentFor(d, 'AMERICAN EXPRESS').card.id, 'cobalt');
  assert.equal(K.cardPaymentFor(d, 'AMEX BILL PYMT').card.id, 'cobalt');
  assert.equal(K.cardPaymentFor(d, 'CAPITAL ONE'), null); // no such card
  assert.equal(K.cardPaymentFor(d, 'TIM HORTONS'), null);
});

test('a card payment seen on both statements (bank and card) counts once', () => {
  let d = K.factory();
  d.accounts = [account('chq', 'CAD', 5000)];
  d.cards = [Object.assign(card('cobalt', 'CAD', 800, 4800), { name: 'Cobalt', network: 'Amex' })];
  // Card statement first: "PAYMENT RECEIVED - THANK YOU" into the card
  d = K.addTxn(d, { type: 'transfer', cat: 'transfer', merchant: 'PAYMENT RECEIVED - THANK YOU', amt: 700, cur: 'CAD', from: null, to: 'card:cobalt', date: '2026-08-06', source: 'statement' });
  assert.equal(d.cards[0].bal, 100);
  // Bank statement: "AMERICAN EXPRESS" two days earlier is the same payment
  const row = { type: 'transfer', amt: 700, from: 'acct:chq', to: 'card:cobalt', date: '2026-08-04' };
  const twin = K.findCardPaymentIn(d, row);
  assert.ok(twin);
  d = K.editTxn(d, twin.id, { from: 'acct:chq' });
  assert.equal(d.cards[0].bal, 100);
  assert.equal(d.accounts[0].bal, 4300);
  assert.equal(d.txns.length, 1);
  // Already both in Kipu: joining them undoes the second payment on the card
  let e = K.factory();
  e.accounts = [account('chq', 'CAD', 5000)];
  e.cards = [Object.assign(card('cobalt', 'CAD', 800, 4800), { name: 'Cobalt', network: 'Amex' })];
  e = K.addTxn(e, { type: 'transfer', cat: 'transfer', merchant: 'PAYMENT RECEIVED - THANK YOU', amt: 700, cur: 'CAD', from: null, to: 'card:cobalt', date: '2026-08-06', source: 'statement' });
  e = K.addTxn(e, { type: 'transfer', cat: 'transfer', merchant: 'AMERICAN EXPRESS', amt: 700, cur: 'CAD', from: 'acct:chq', to: 'card:cobalt', date: '2026-08-04', source: 'statement' });
  assert.equal(e.cards[0].bal, -600); // counted twice
  e = K.mergeCardPaymentTwin(e, e.txns.find((t) => t.merchant === 'AMERICAN EXPRESS').id);
  assert.equal(e.cards[0].bal, 100);
  assert.equal(e.accounts[0].bal, 4300);
  assert.equal(e.txns.length, 1);
});
