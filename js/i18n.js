/* Kipu · language. Screens are written in English; in Spanish, the text on screen is swapped for its
   translation as it appears (js/i18n-es.js). The English original is kept, so switching back is instant.
   Names the person typed (accounts, merchants, notes) aren't in the dictionary, so they stay as written. */
(function () {
  const K = window.K;
  const LKEY = 'kipu-lang';
  const LANGS = ['en', 'es'];
  const guess = () => (/^es\b/i.test(navigator.language || '') ? 'es' : 'en');
  let lang = (() => { try { const v = localStorage.getItem(LKEY); return LANGS.includes(v) ? v : guess(); } catch (e) { return guess(); } })();
  K.LANGS = [['en', 'English'], ['es', 'Español']];
  K.lang = () => lang;
  // Dates written by the browser (weekday and month names) follow the language too
  K.loc = () => (lang === 'es' ? 'es-PE' : 'en-US');

  const dict = () => (K.I18N && K.I18N[lang]) || null;
  const missing = new Set();
  K.i18nMissing = missing;
  const hasWords = /[A-Za-z]{2}/;

  const tr = (s) => {
    const D = dict();
    if (!D || !s || !hasWords.test(s)) return s;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    const out = core(m[2], D);
    return out == null ? s : m[1] + out + m[3];
  };
  const core = (c, D) => {
    if (Object.prototype.hasOwnProperty.call(D.words, c)) return D.words[c];
    // "Cash CA$20 · due CA$5" → translate each part
    for (const sep of [' · ', ': ', ' — ']) {
      if (c.includes(sep)) { const parts = c.split(sep); const t = parts.map((p) => { const r = p && core(p, D); return r == null ? p : r; }); if (t.some((x, i) => x !== parts[i])) return t.join(sep); }
    }
    for (const [re, to] of D.patterns) { const m = re.exec(c); if (m) return typeof to === 'function' ? to(m, (x) => { const r = core(x, D); return r == null ? x : r; }) : c.replace(re, to); }
    // A trailing period, colon, question mark or ellipsis
    const end = /^(.+?)([.:?!…]+)$/.exec(c);
    if (end && Object.prototype.hasOwnProperty.call(D.words, end[1])) return D.words[end[1]] + end[2];
    missing.add(c);
    return null;
  };
  K.t = tr;

  // ---------------------------------------------------------------- swap text as React writes it
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  const seen = new WeakMap(); // text node → { src, out }
  const seenAttr = new WeakMap(); // element → { attr: { src, out } }
  const skip = (el) => !el || el.closest('[data-raw],script,style,textarea');
  const doText = (n) => {
    if (skip(n.parentElement)) return;
    const v = n.nodeValue, rec = seen.get(n);
    const src = rec && v === rec.out ? rec.src : v;
    const out = tr(src);
    seen.set(n, { src, out });
    if (out !== v) n.nodeValue = out;
  };
  const doAttr = (el, a) => {
    const v = el.getAttribute(a);
    if (v == null || skip(el)) return;
    let r = seenAttr.get(el); if (!r) seenAttr.set(el, (r = {}));
    const rec = r[a], src = rec && v === rec.out ? rec.src : v;
    const out = tr(src);
    r[a] = { src, out };
    if (out !== v) el.setAttribute(a, out);
  };
  const walk = (root) => {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    ATTRS.forEach((a) => root.hasAttribute(a) && doAttr(root, a));
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = it.nextNode())) { if (n.nodeType === 3) doText(n); else ATTRS.forEach((a) => n.hasAttribute(a) && doAttr(n, a)); }
  };
  let obs = null;
  const start = () => {
    if (obs || !document.body) return;
    walk(document.body);
    obs = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttr(m.target, m.attributeName);
        else m.addedNodes.forEach(walk);
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };
  K.setLang = (l) => {
    if (!LANGS.includes(l) || l === lang) return;
    lang = l;
    try { localStorage.setItem(LKEY, l); } catch (e) {}
    document.documentElement.lang = l;
    if (document.body) walk(document.body);
    start();
  };
  document.documentElement.lang = lang;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
