/* Kipu · app lock: a 6-digit PIN and optional Face ID or fingerprint, all on this device.
   The PIN is never stored, only a salted PBKDF2 hash of it. This locks the app; it doesn't encrypt the data. */
(function () {
  const K = window.K;
  const { useState, useEffect, useRef, useCallback } = React;
  const { html, useApp, Icon } = K;

  const LKEY = 'kipu-lock-v1';
  const PIN_LEN = 6;
  K.PIN_LEN = PIN_LEN;
  K.lockCfg = () => { try { return Object.assign({ enabled: false, auto: 60, fails: 0, until: 0 }, JSON.parse(localStorage.getItem(LKEY) || '{}')); } catch (e) { return { enabled: false, auto: 60, fails: 0, until: 0 }; } };
  K.saveLock = (cfg) => { try { localStorage.setItem(LKEY, JSON.stringify(cfg)); } catch (e) {} return cfg; };
  K.clearLock = () => { try { localStorage.removeItem(LKEY); } catch (e) {} };

  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
  const hashPin = async (pin, saltB64, iter) => {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: iter }, key, 256);
    return b64(bits);
  };
  K.setPin = async (pin) => { const salt = b64(rand(16)), iter = 150000; const hash = await hashPin(pin, salt, iter); return K.saveLock(Object.assign(K.lockCfg(), { enabled: true, salt, iter, hash, fails: 0, until: 0 })); };
  // Wrong tries slow down: after 5, wait 30s, then 1 min, 2 min…
  K.checkPin = async (pin) => {
    const cfg = K.lockCfg();
    if (cfg.until && Date.now() < cfg.until) return { ok: false, wait: Math.ceil((cfg.until - Date.now()) / 1000) };
    const ok = (await hashPin(pin, cfg.salt, cfg.iter || 150000)) === cfg.hash;
    if (ok) { K.saveLock(Object.assign(cfg, { fails: 0, until: 0 })); return { ok: true }; }
    const fails = (cfg.fails || 0) + 1;
    const until = fails >= 5 ? Date.now() + 30000 * Math.pow(2, fails - 5) : 0;
    K.saveLock(Object.assign(cfg, { fails, until }));
    return { ok: false, left: Math.max(0, 5 - fails), wait: until ? Math.ceil((until - Date.now()) / 1000) : 0 };
  };

  // ---------------------------------------------------------------- Face ID, Touch ID, Windows Hello, Android fingerprint (passkeys)
  K.bioAvailable = async () => { try { return !!(window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())); } catch (e) { return false; } };
  K.bioLabel = () => { const ua = navigator.userAgent; return /iPhone|iPad/.test(ua) ? 'Face ID or Touch ID' : /Mac/.test(ua) ? 'Touch ID' : /Android/.test(ua) ? 'fingerprint or face unlock' : /Windows/.test(ua) ? 'Windows Hello' : 'your device unlock'; };
  K.enrollBio = async (name) => {
    const cred = await navigator.credentials.create({ publicKey: { challenge: rand(32), rp: { name: 'Kipu' }, user: { id: rand(16), name: name || 'Kipu', displayName: name || 'Kipu' }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }], authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' }, timeout: 60000, attestation: 'none' } });
    return K.saveLock(Object.assign(K.lockCfg(), { bio: b64(cred.rawId) }));
  };
  K.bioUnlock = async () => {
    const cfg = K.lockCfg();
    if (!cfg.bio) return false;
    const a = await navigator.credentials.get({ publicKey: { challenge: rand(32), allowCredentials: [{ type: 'public-key', id: unb64(cfg.bio), transports: ['internal'] }], userVerification: 'required', timeout: 60000 } });
    return !!a;
  };

  // ---------------------------------------------------------------- PIN pad (tap on phones, type on computers)
  K.PinPad = function PinPad({ onDone, title, sub, bio, onBio, busy, error, shake, compact }) {
    const [pin, setPin] = useState('');
    const add = useCallback((d) => setPin((p) => (p.length < PIN_LEN ? p + d : p)), []);
    const del = useCallback(() => setPin((p) => p.slice(0, -1)), []);
    useEffect(() => { if (pin.length === PIN_LEN) { const v = pin; setTimeout(() => { setPin(''); onDone(v); }, 120); } }, [pin]);
    useEffect(() => { const on = (e) => { if (busy) return; if (/^[0-9]$/.test(e.key)) add(e.key); else if (e.key === 'Backspace') del(); }; window.addEventListener('keydown', on); return () => window.removeEventListener('keydown', on); }, [busy]);
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', bio ? 'bio' : '', '0', 'del'];
    return html`<div class=${'pinpad' + (compact ? ' compact' : '')}>
      ${title && html`<div class="stack-s" style=${{ gap: '4px', alignItems: 'center', textAlign: 'center' }}><span style=${{ fontWeight: 700, fontSize: '17px' }}>${title}</span>${sub && html`<span class="small muted">${sub}</span>`}</div>`}
      <div class=${'pin-dots' + (shake ? ' shake' : '')} role="status" aria-label=${pin.length + ' of ' + PIN_LEN + ' digits entered'}>${Array.from({ length: PIN_LEN }, (_, i) => html`<i key=${i} class=${i < pin.length ? 'on' : ''}></i>`)}</div>
      <span class="small" style=${{ minHeight: '18px', color: 'var(--crit)', fontWeight: 600, textAlign: 'center' }} aria-live="polite">${error || ''}</span>
      <div class="pin-keys">${keys.map((k, i) => (k === '' ? html`<span key=${i}></span>` : k === 'del' ? html`<button key=${i} type="button" class="pin-key ghost" aria-label="Delete" onClick=${del} disabled=${busy}><${Icon} n="back" s=${22} w=${2} /></button>` : k === 'bio' ? html`<button key=${i} type="button" class="pin-key ghost" aria-label=${'Unlock with ' + K.bioLabel()} onClick=${onBio} disabled=${busy}><${Icon} n="scan" s=${24} w=${1.9} /></button>` : html`<button key=${i} type="button" class="pin-key" onClick=${() => add(k)} disabled=${busy}>${k}</button>`))}</div>
    </div>`;
  };

  // ---------------------------------------------------------------- lock screen: phone, tablet and desktop
  K.LockScreen = function LockScreen({ onUnlock, wide, vw }) {
    const { data, settings } = useApp();
    const cfg = K.lockCfg();
    const [err, setErr] = useState('');
    const [shake, setShake] = useState(false);
    const [busy, setBusy] = useState(false);
    const [forgot, setForgot] = useState(false);
    const [wait, setWait] = useState(cfg.until && cfg.until > Date.now() ? Math.ceil((cfg.until - Date.now()) / 1000) : 0);
    const tried = useRef(false);
    useEffect(() => { if (!wait) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
    const tryBio = async () => { if (!cfg.bio) return; setErr(''); try { if (await K.bioUnlock()) onUnlock(); } catch (e) { setErr(''); } };
    // Offer Face ID / fingerprint right away when it's set up
    useEffect(() => { if (cfg.bio && !tried.current) { tried.current = true; tryBio(); } }, []);
    const done = async (pin) => {
      if (wait) return;
      setBusy(true);
      const r = await K.checkPin(pin);
      setBusy(false);
      if (r.ok) { onUnlock(); return; }
      setShake(true); setTimeout(() => setShake(false), 450);
      if (r.wait) { setWait(r.wait); setErr(''); } else setErr('Wrong PIN' + (r.left <= 2 ? ' · ' + r.left + ' ' + (r.left === 1 ? 'try' : 'tries') + ' before a short wait' : ''));
    };
    const first = (data.profile.name || '').split(' ')[0];
    const hour = new Date().getHours();
    const hello = (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening') + (first ? ', ' + first : '');
    const sub = wait ? 'Too many tries. Wait ' + (wait >= 60 ? Math.ceil(wait / 60) + ' min' : wait + 's') + '.' : 'Enter your PIN' + (cfg.bio ? ' or use ' + K.bioLabel() : '');
    const pad = html`<${K.PinPad} onDone=${done} bio=${!!cfg.bio} onBio=${tryBio} busy=${busy || !!wait} error=${err} shake=${shake} />`;
    const forgotBox = forgot ? html`<div class="card stack-s" style=${{ gap: '10px', borderColor: 'var(--crit2)', maxWidth: '360px', width: '100%' }}><span style=${{ fontWeight: 700 }}>Forgot your PIN?</span><span class="small muted" style=${{ lineHeight: 1.5 }}>For your privacy there’s no way around the PIN. You can erase Kipu on this device and start again, then restore a backup if you have one.</span><div class="grid g2" style=${{ gap: '8px' }}><button class="btn sec sm" onClick=${() => setForgot(false)}>Keep trying</button><button class="btn dan sm" onClick=${() => { K.wipe(); K.clearLock(); location.reload(); }}>Erase and restart</button></div></div>` : html`<button class="link" style=${{ color: 'var(--muted)' }} onClick=${() => setForgot(true)}>Forgot PIN?</button>`;
    const who = html`<div class="stack-s" style=${{ alignItems: 'center', gap: '10px', textAlign: 'center' }}><${K.Face} s=${64} /><span class="disp" style=${{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em' }}>${hello}</span><span class="small muted">${sub}</span></div>`;
    const desktop = wide && vw >= 1024;
    if (desktop) return html`<div class="lock lock-split">
      <section class="lock-brand"><div class="row" style=${{ gap: '12px' }}><span class="lock-mark"></span><span class="disp" style=${{ fontSize: '24px', fontWeight: 800 }}>Kipu</span></div>
        <div class="stack-s" style=${{ gap: '14px' }}><h1 class="lock-h">Money,<br />calmly.</h1><p style=${{ fontSize: '16px', lineHeight: 1.5, opacity: 0.85, maxWidth: '34ch' }}>Your accounts, bills, goals and trips in one place. Everything stays on this device.</p></div>
        <div class="row" style=${{ gap: '8px', opacity: 0.85 }}><${Icon} n="lock" s=${16} /><span class="small">Locked with your PIN${cfg.bio ? ' and ' + K.bioLabel() : ''}</span></div></section>
      <section class="lock-panel"><div class="lock-card">${who}${pad}${forgotBox}</div></section></div>`;
    return html`<div class=${'lock ' + (wide ? 'lock-tablet' : 'lock-phone')}>
      <div class="lock-top"><div class="row" style=${{ gap: '10px' }}><span class="lock-mark"></span><span class="disp" style=${{ fontSize: '20px', fontWeight: 800 }}>Kipu</span></div></div>
      <div class="lock-card">${who}${pad}${forgotBox}</div></div>`;
  };
})();
