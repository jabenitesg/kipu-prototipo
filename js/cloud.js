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
    constructor(client, notify) { this.client = client; this.notify = notify || (() => {}); this.clear(); }
    clear() { this.userId = null; this.key = null; this.salt = null; this.revision = 0; this.latest = null; this.inFlight = null; this.busy = false; this.error = null; }
    outboxKey() { return 'kipu-cloud-pending:' + this.userId; }
    async read(userId) {
      const { data, error } = await this.client.from('user_vaults').select('payload,revision').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data;
    }
    async open(userId, passphrase) {
      const row = await this.read(userId);
      const salt = row ? unb64(row.payload.salt) : bytes(16);
      const key = await derive(passphrase, salt);
      let data = row ? await decrypt(row.payload, key) : null;
      this.userId = userId; this.salt = salt; this.key = key; this.revision = row ? row.revision : 0;
      const pending = localStorage.getItem(this.outboxKey());
      if (pending && row) {
        const draft = JSON.parse(pending);
        data = await decrypt(draft.payload, key);
        this.latest = data;
        this.revision = draft.baseRevision;
        this.error = new Error('This device has changes waiting to sync. Retry sync before making more edits.');
      }
      return data;
    }
    async create(data) {
      if (!this.key || this.revision) throw new Error('Vault is already created');
      const payload = await encrypt(data, this.key, this.salt);
      const { data: saved, error } = await this.client.from('user_vaults').insert({ user_id: this.userId, payload }).select('revision').single();
      if (error) throw error;
      this.revision = saved.revision;
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
          const payload = await encrypt(next, this.key, this.salt);
          try { localStorage.setItem(this.outboxKey(), JSON.stringify({ baseRevision: this.revision, payload })); } catch (e) { /* online save can still succeed */ }
          const { data: saved, error } = await this.client.from('user_vaults').update({ payload, revision: this.revision + 1, updated_at: new Date().toISOString() }).eq('user_id', this.userId).eq('revision', this.revision).select('revision').maybeSingle();
          if (error) throw error;
          if (!saved) throw new Error('Another device changed this vault. Export this device’s data before reloading.');
          this.revision = saved.revision;
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
      return data;
    }
    retry() { if (!this.latest) return; this.error = null; void this.flush(); }
  }
  K.CloudVault = CloudVault;
  K.cloudProviders = async () => {
    const response = await fetch(URL + '/auth/v1/settings', { headers: { apikey: KEY } });
    if (!response.ok) throw new Error('Could not check sign-in providers');
    return (await response.json()).external || {};
  };
  K.cloudClient = window.supabase ? window.supabase.createClient(URL, KEY, { auth: { flowType: 'implicit', autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }) : null;
})();
