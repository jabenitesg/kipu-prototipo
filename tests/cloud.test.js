const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');

const source = fs.readFileSync(require('node:path').join(__dirname, '../js/cloud.js'), 'utf8');
const store = new Map();
const client = { from(name) {
  assert.equal(name, 'user_vaults');
  return {
    select() { return { eq(_column, id) { return { async maybeSingle() { return { data: store.get(id) || null, error: null }; } }; } }; },
    insert(value) { return { select() { return { async single() { if (store.has(value.user_id)) return { error: new Error('duplicate') }; const row = { payload: value.payload, revision: 1 }; store.set(value.user_id, row); return { data: row, error: null }; } }; } }; },
    update(value) { let id, revision; return { eq(column, val) { if (column === 'user_id') id = val; if (column === 'revision') revision = val; return this; }, select() { return { async maybeSingle() { const old = store.get(id); if (!old || old.revision !== revision) return { data: null, error: null }; const row = { payload: value.payload, revision: value.revision }; store.set(id, row); return { data: row, error: null }; } }; } }; },
  };
} };
const K = { factory: () => ({ v: 1, txns: [], accounts: [], cards: [], loans: [], onboarded: false }) };
const local = new Map();
const localStorage = { getItem: (k) => local.get(k) || null, setItem: (k, v) => local.set(k, v), removeItem: (k) => local.delete(k) };
const context = vm.createContext({ window: { K }, crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, btoa, atob, localStorage });
vm.runInContext(source, context);

async function settled(vault) { for (let i = 0; i < 100 && vault.busy; i++) await new Promise((resolve) => setTimeout(resolve, 10)); assert.equal(vault.busy, false); }

test('a new user starts without a vault; encrypted data round trips across devices', async () => {
  const first = new K.CloudVault(client);
  assert.equal(await first.open('alice', 'a long private passphrase'), null);
  const data = { ...K.factory(), onboarded: true, txns: [{ id: 't1', merchant: 'Private merchant', amt: 42 }] };
  await first.create(data);
  const stored = JSON.stringify(store.get('alice').payload);
  assert.ok(!stored.includes('Private merchant'));
  const second = new K.CloudVault(client);
  assert.equal((await second.open('alice', 'a long private passphrase')).txns[0].amt, 42);
  await assert.rejects(() => new K.CloudVault(client).open('alice', 'different passphrase'));
});

test('older devices cannot overwrite newer data; large vaults encrypt', async () => {
  const first = new K.CloudVault(client), second = new K.CloudVault(client);
  await first.open('bob', 'another long private passphrase');
  await first.create(K.factory());
  await second.open('bob', 'another long private passphrase');
  const large = { ...K.factory(), txns: [{ id: 'big', merchant: 'x'.repeat(100000) }] };
  first.enqueue(large);
  await settled(first);
  assert.equal(first.error, null);
  second.enqueue({ ...K.factory(), txns: [{ id: 'stale' }] });
  await settled(second);
  assert.match(second.error.message, /Another device/);
  assert.equal(store.get('bob').revision, 2);
  assert.ok(local.get('kipu-cloud-pending:bob'));
  local.delete('kipu-cloud-pending:bob'); // inspect the remote copy as on a different device
  assert.equal((await new K.CloudVault(client).open('bob', 'another long private passphrase')).txns[0].id, 'big');
});

test('an unsynced encrypted draft survives reopening and can be retried', async () => {
  const first = new K.CloudVault(client);
  await first.open('carol', 'a third private passphrase');
  await first.create(K.factory());
  const failing = { from: () => ({ update() { return { eq() { return this; }, select() { return { async maybeSingle() { return { data: null, error: new Error('offline') }; } }; } }; } }) };
  first.client = failing;
  first.enqueue({ ...K.factory(), txns: [{ id: 'saved-locally' }] });
  await settled(first);
  assert.ok(local.get('kipu-cloud-pending:carol'));
  const reopened = new K.CloudVault(client);
  assert.equal((await reopened.open('carol', 'a third private passphrase')).txns[0].id, 'saved-locally');
  reopened.retry();
  await settled(reopened);
  assert.equal(local.has('kipu-cloud-pending:carol'), false);
  assert.equal(store.get('carol').revision, 2);
});

test('a joint household uses its own encrypted vault and pending queue', async () => {
  const rows = new Map();
  const sharedClient = { from(table) {
    assert.equal(table, 'household_vaults');
    return {
      select() { return { eq(column, id) { assert.equal(column, 'household_id'); return { async maybeSingle() { return { data: rows.get(id) || null, error: null }; } }; } }; },
      insert(value) { return { select() { return { async single() { assert.ok(value.household_id); const row = { payload: value.payload, revision: 1 }; rows.set(value.household_id, row); return { data: row, error: null }; } }; } }; },
      update(value) { let id, revision; return { eq(column, val) { if (column === 'household_id') id = val; if (column === 'revision') revision = val; return this; }, select() { return { async maybeSingle() { const old = rows.get(id); if (!old || old.revision !== revision) return { data: null, error: null }; const row = { payload: value.payload, revision: value.revision }; rows.set(id, row); return { data: row, error: null }; } }; } }; },
    };
  } };
  const first = new K.CloudVault(sharedClient, null, 'household_vaults', 'household_id');
  const second = new K.CloudVault(sharedClient, null, 'household_vaults', 'household_id');
  assert.equal(await first.open('family-1', 'a separate family passphrase'), null);
  await first.create({ ...K.factory(), onboarded: true, txns: [] });
  await second.open('family-1', 'a separate family passphrase');
  first.enqueue({ ...K.factory(), txns: [{ id: 'joint', merchant: 'Joint purchase' }] });
  await settled(first);
  assert.equal((await second.refresh()).txns[0].id, 'joint');
  assert.ok(!JSON.stringify(rows.get('family-1')).includes('Joint purchase'));
  assert.equal(local.has('kipu-cloud-pending:family-1'), false);
});

test('joint data starts empty and includes every item in the shared view', () => {
  const empty = K.jointData(K.factory(), 'Kari & Juan');
  for (const collection of ['accounts', 'cards', 'loans', 'txns']) assert.equal(empty[collection].length, 0);
  const source = { ...K.factory(), accounts: [{ id: 'a1', name: 'Joint cash', shared: false }], txns: [{ id: 't1', amt: 5, shared: false }] };
  const joint = K.jointData(source, 'Kari & Juan');
  assert.equal(joint.household.joint, true);
  assert.equal(joint.accounts[0].shared, true);
  assert.equal(joint.txns[0].shared, true);
  assert.equal(source.accounts[0].shared, false);
});

test('two devices saving at the same time are merged instead of stopping', async () => {
  const storeSrc = fs.readFileSync(require('node:path').join(__dirname, '../js/store.js'), 'utf8');
  const sctx = { window: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, console };
  vm.runInNewContext(storeSrc, sctx);
  K.mergeData = sctx.window.K.mergeData;
  const merged = [];
  K.onVaultMerged = (vault, data) => merged.push(data);
  const phone = new K.CloudVault(client), laptop = new K.CloudVault(client);
  await phone.open('dana', 'dana private passphrase');
  const start = { ...K.factory(), onboarded: true, accounts: [{ id: 'a', bal: 100 }], txns: [] };
  await phone.create(start);
  await laptop.open('dana', 'dana private passphrase');
  phone.enqueue({ ...start, accounts: [{ id: 'a', bal: 90 }], txns: [{ id: 'p1', amt: 10 }] });
  await settled(phone);
  laptop.enqueue({ ...start, accounts: [{ id: 'a', bal: 75 }], txns: [{ id: 'l1', amt: 25 }] });
  await settled(laptop);
  assert.equal(laptop.error, null);
  const final = await new K.CloudVault(client).open('dana', 'dana private passphrase');
  assert.deepEqual(final.txns.map((t) => t.id).sort(), ['l1', 'p1']);
  assert.equal(final.accounts[0].bal, 65);
  assert.ok(merged.length > 0);
  delete K.mergeData; delete K.onVaultMerged;
});
