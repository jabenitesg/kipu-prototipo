/* Kipu cloud vault. Only ciphertext and encryption metadata reach Supabase. */
(function () {
  const K = window.K;
  const URL = 'https://uvnoopscmfmisjftrutc.supabase.co';
  const KEY = 'sb_publishable_KLX21osU8UhNRIQYg2u3QQ_d2gQqka8';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const bytes = (n) => crypto.getRandomValues(new Uint8Array(n));
  const b64 = (a) => { const view = new Uint8Array(a); let s = ''; for (let i = 0; i < view.length; i += 8192) s += String.fromCharCode(...view.subarray(i, i + 8192)); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const derive = async (passphrase, salt) => {
    const material = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };
  const encrypt = async (data, key, salt) => {
    const iv = bytes(12);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
    return { v: '1', salt: b64(salt), iv: b64(iv), ciphertext: b64(ciphertext) };
  };
  const decrypt = async (payload, key) => {
    const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(payload.iv) }, key, unb64(payload.ciphertext));
    const data = JSON.parse(dec.decode(raw));
    if (!data || data.v !== 1 || !Array.isArray(data.txns)) throw new Error('Unsupported Kipu data');
    return Object.assign(K.factory(), data);
  };

  class CloudVault {
    constructor(client, notify, table = 'user_vaults', idColumn = 'user_id') { this.client = client; this.notify = notify || (() => {}); this.table = table; this.idColumn = idColumn; this.clear(); }
    clear() { this.userId = null; this.key = null; this.salt = null; this.revision = 0; this.latest = null; this.inFlight = null; this.busy = false; this.error = null; this.base = null; }
    outboxKey() { return 'kipu-' + (this.table === 'user_vaults' ? 'cloud' : 'household') + '-pending:' + this.userId; }
    async read(userId) {
      const { data, error } = await this.client.from(this.table).select('payload,revision').eq(this.idColumn, userId).maybeSingle();
      if (error) throw error;
      return data;
    }
    // `device`: a key this device kept from an earlier unlock ({ key, salt }), instead of the passphrase
    async open(userId, passphrase, device) {
      const row = await this.read(userId);
      if (device && (!row || row.payload.salt !== device.salt)) throw new Error('DEVICE_KEY_STALE');
      const salt = row ? unb64(row.payload.salt) : bytes(16);
      const key = device ? device.key : await derive(passphrase, salt);
      let data = row ? await decrypt(row.payload, key) : null;
      this.userId = userId; this.salt = salt; this.key = key; this.revision = row ? row.revision : 0; this.base = data;
      const pending = localStorage.getItem(this.outboxKey());
      if (pending && row) {
        // Changes that didn't reach the server last time: merge them with whatever the other devices saved since
        const draft = JSON.parse(pending);
        const mine = await decrypt(draft.payload, key);
        const base = draft.basePayload ? await decrypt(draft.basePayload, key) : null;
        data = base && K.mergeData ? K.mergeData(base, mine, data) : mine;
        this.latest = data;
        this.revision = row.revision;
        if (!base) this.base = null;
      }
      if (this.latest) void this.flush();
      return data;
    }
    async create(data) {
      if (!this.key || this.revision) throw new Error('Vault is already created');
      const payload = await encrypt(data, this.key, this.salt);
      const { data: saved, error } = await this.client.from(this.table).insert({ [this.idColumn]: this.userId, payload }).select('revision').single();
      if (error) throw error;
      this.revision = saved.revision;
      this.base = data;
      return data;
    }
    enqueue(data) {
      if (!this.key || !this.revision) throw new Error('Vault is locked');
      this.latest = data;
      this.notify('saving');
      if (!this.busy) void this.flush();
    }
    async flush() {
      if (this.busy || !this.latest) return;
      this.busy = true;
      try {
        while (this.latest) {
          const next = this.latest; this.latest = null; this.inFlight = next;
          let toWrite = next;
          for (let attempt = 0; ; attempt++) {
            const payload = await encrypt(toWrite, this.key, this.salt);
            const basePayload = this.base ? await encrypt(this.base, this.key, this.salt) : null;
            try { localStorage.setItem(this.outboxKey(), JSON.stringify({ baseRevision: this.revision, payload, basePayload })); } catch (e) { /* online save can still succeed */ }
            const { data: saved, error } = await this.client.from(this.table).update({ payload, revision: this.revision + 1, updated_at: new Date().toISOString() }).eq(this.idColumn, this.userId).eq('revision', this.revision).select('revision').maybeSingle();
            if (error) throw error;
            if (saved) { this.revision = saved.revision; this.base = toWrite; break; }
            // Another device saved first: combine both sets of changes and try again
            if (attempt >= 4 || !K.mergeData) throw new Error('Another device keeps changing this data. Try again in a moment.');
            const row = await this.read(this.userId);
            if (!row) throw new Error('This data was removed on another device.');
            const remote = await decrypt(row.payload, this.key);
            const merged = K.mergeData(this.base, toWrite, remote);
            // Edits made here while merging sit on top of the merged result
            if (this.latest) this.latest = K.mergeData(toWrite, this.latest, merged);
            this.revision = row.revision;
            toWrite = merged;
            if (K.onVaultMerged) K.onVaultMerged(this, this.latest || merged);
          }
          this.inFlight = null;
        }
        try { localStorage.removeItem(this.outboxKey()); } catch (e) {}
        this.error = null; this.notify('synced');
      } catch (e) {
        this.latest = this.latest || this.inFlight; // kept in memory for Retry
        this.error = e;
        this.notify('error', e.message);
      } finally { this.busy = false; }
    }
    async refresh() {
      if (!this.key || this.latest || this.busy || this.error) return null;
      const revision = this.revision;
      const row = await this.read(this.userId);
      if (this.latest || this.busy || this.error || this.revision !== revision) return null;
      if (!row || row.revision <= this.revision) return null;
      const data = await decrypt(row.payload, this.key);
      this.revision = row.revision;
      this.base = data;
      return data;
    }
    retry() { if (!this.latest) return; this.error = null; void this.flush(); }
  }
  K.CloudVault = CloudVault;
  // ---------------------------------------------------------------- trusted device
  // After the first unlock, this device keeps the vault key in IndexedDB as a non-extractable CryptoKey:
  // it can decrypt here but can't be read out or copied. The app lock (Face ID, fingerprint or PIN) guards it.
  const IDB = 'kipu-device', STORE = 'keys';
  const idb = () => new Promise((ok, bad) => { if (!window.indexedDB) return bad(new Error('no indexedDB')); const r = indexedDB.open(IDB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); });
  const tx = async (mode, fn) => { const db = await idb(); return new Promise((ok, bad) => { const t = db.transaction(STORE, mode); const out = fn(t.objectStore(STORE)); t.oncomplete = () => { db.close(); ok(out && out.result); }; t.onerror = () => { db.close(); bad(t.error); }; }); };
  K.deviceKey = {
    get: async (id) => { try { return (await tx('readonly', (s) => s.get(id))) || null; } catch (e) { return null; } },
    put: async (id, vault) => { try { if (vault && vault.key && vault.salt) await tx('readwrite', (s) => s.put({ key: vault.key, salt: b64(vault.salt), at: Date.now() }, id)); return true; } catch (e) { return false; } },
    forget: async (prefix) => { try { const db = await idb(); await new Promise((ok) => { const t = db.transaction(STORE, 'readwrite'); const st = t.objectStore(STORE); const r = st.getAllKeys(); r.onsuccess = () => { (r.result || []).filter((k) => !prefix || String(k).startsWith(prefix)).forEach((k) => st.delete(k)); }; t.oncomplete = () => { db.close(); ok(); }; t.onerror = () => { db.close(); ok(); }; }); } catch (e) {} },
  };

  K.jointData = (data, name) => {
    const next = Object.assign({}, data, { household: { enabled: false, joint: true, name } });
    ['accounts', 'cards', 'loans', 'txns', 'bills', 'income', 'goals', 'trips'].forEach((key) => {
      next[key] = (data[key] || []).map((item) => item.shared ? item : Object.assign({}, item, { shared: true }));
    });
    return next;
  };
  K.cloudHouseholds = async () => {
    const { data, error } = await K.cloudClient.from('households').select('id,name,owner_id,invite_email');
    if (error) throw error;
    return data || [];
  };
  K.cloudProviders = async () => {
    const response = await fetch(URL + '/auth/v1/settings', { headers: { apikey: KEY } });
    if (!response.ok) throw new Error('Could not check sign-in providers');
    return (await response.json()).external || {};
  };
  K.cloudClient = window.supabase ? window.supabase.createClient(URL, KEY, { auth: { flowType: 'implicit', autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }) : null;
})();
