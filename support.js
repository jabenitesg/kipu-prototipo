/*
 * Kipu standalone runtime.
 * Renders the .dc.html screens outside the design canvas: {{holes}}, <sc-for>, <sc-if>,
 * event handlers from renderVals(), and a DCLogic base class with setState.
 */
(function () {
  'use strict';
  var hide = document.createElement('style');
  hide.textContent = 'x-dc{display:none}script[type="text/x-dc"]{display:none}';
  document.head.appendChild(hide);

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    if (this.__render) this.__render();
  };
  DCLogic.prototype.forceUpdate = function () { if (this.__render) this.__render(); };
  window.DCLogic = DCLogic;

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function lookup(path, scope) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return parseFloat(path);
    var m = /^'(.*)'$|^"(.*)"$/.exec(path);
    if (m) return m[1] != null ? m[1] : m[2];
    var parts = path.split('.');
    var cur = scope;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(p, scope); return v == null ? '' : String(v); });
  }
  function evName(attr, el) {
    var n = attr.slice(2).toLowerCase();
    if (n === 'change' && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return 'input';
    if (n === 'doubleclick') return 'dblclick';
    return n;
  }

  function renderNode(tpl, scope, path, out) {
    if (tpl.nodeType === 3) { out.push(document.createTextNode(interp(tpl.nodeValue, scope))); return; }
    if (tpl.nodeType !== 1) return;
    var tag = tpl.tagName.toLowerCase();
    if (tag === 'helmet' || tag === 'script') return;
    if (tag === 'sc-for') {
      var list = lookup((WHOLE.exec(tpl.getAttribute('list') || '') || [])[1] || '', scope) || [];
      var as = tpl.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var s = Object.create(scope); s[as] = list[i]; s.$index = i;
        renderChildren(tpl, s, path + '.' + i, out);
      }
      return;
    }
    if (tag === 'sc-if') {
      var v = lookup((WHOLE.exec(tpl.getAttribute('value') || '') || [])[1] || '', scope);
      if (v) renderChildren(tpl, scope, path, out);
      return;
    }
    var el = tpl.namespaceURI === SVG_NS ? document.createElementNS(SVG_NS, tpl.localName) : document.createElement(tpl.localName);
    for (var a = 0; a < tpl.attributes.length; a++) {
      var at = tpl.attributes[a], name = at.name, val = at.value;
      if (name.indexOf('hint-') === 0) continue;
      var whole = WHOLE.exec(val);
      if (name.indexOf('on') === 0 && name.length > 2) {
        var fn = whole ? lookup(whole[1], scope) : null;
        if (typeof fn === 'function') el.addEventListener(evName(name, el), fn);
        continue; // never set inline handler attributes
      }
      var out2;
      if (whole) {
        var raw = lookup(whole[1], scope);
        if (raw === false || raw == null) { if (name === 'value') el.value = ''; continue; }
        out2 = raw === true ? '' : String(raw);
      } else {
        out2 = val.indexOf('{{') >= 0 ? interp(val, scope) : val;
      }
      if (name === 'value' && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) { el.value = out2; el.setAttribute('value', out2); }
      else el.setAttribute(name, out2);
    }
    el.setAttribute('data-dc-path', path);
    var kids = [];
    renderChildren(tpl, scope, path, kids);
    for (var k = 0; k < kids.length; k++) el.appendChild(kids[k]);
    out.push(el);
  }
  function renderChildren(tpl, scope, path, out) {
    var n = 0;
    for (var c = tpl.firstChild; c; c = c.nextSibling) { renderNode(c, scope, path + '/' + n, out); n++; }
  }

  function boot() {
    var tplEl = document.querySelector('template#x-dc');
    var xdc = tplEl ? tplEl.content : document.querySelector('x-dc');
    var code = document.querySelector('script[type="text/x-dc"]');
    if (!xdc) return;
    var helmet = xdc.querySelector('helmet');
    if (helmet) Array.prototype.slice.call(helmet.children).forEach(function (n) { document.head.appendChild(n.cloneNode(true)); });

    var props = {};
    if (code) {
      try {
        var decl = JSON.parse(code.getAttribute('data-props') || '{}');
        Object.keys(decl).forEach(function (k) { if (k.charAt(0) !== '$' && decl[k] && 'default' in decl[k]) props[k] = decl[k]['default']; });
      } catch (e) { console.warn('data-props', e); }
    }
    var Component = code ? new Function('DCLogic', code.textContent + '\n;return Component;')(DCLogic) : DCLogic;
    var inst = new Component(props);

    var mount = document.createElement('div');
    mount.className = 'kipu-stage';
    document.body.appendChild(mount);

    inst.__render = function () {
      var active = document.activeElement, activePath = active && active.getAttribute && active.getAttribute('data-dc-path');
      var selStart = active && 'selectionStart' in active ? active.selectionStart : null;
      var scrolls = {};
      mount.querySelectorAll('[data-dc-path]').forEach(function (n) { if (n.scrollTop || n.scrollLeft) scrolls[n.getAttribute('data-dc-path')] = [n.scrollTop, n.scrollLeft]; });
      var vals = inst.renderVals ? inst.renderVals() : {};
      var nodes = [];
      renderChildren(xdc, vals, 'r', nodes);
      mount.textContent = '';
      nodes.forEach(function (n) { mount.appendChild(n); });
      Object.keys(scrolls).forEach(function (p) { var n = mount.querySelector('[data-dc-path="' + p + '"]'); if (n) { n.scrollTop = scrolls[p][0]; n.scrollLeft = scrolls[p][1]; } });
      if (activePath) {
        var f = mount.querySelector('[data-dc-path="' + activePath + '"]');
        if (f) { f.focus(); try { if (selStart != null) f.setSelectionRange(selStart, selStart); } catch (e) {} }
      }
      fit();
    };

    function fit() {
      var root = mount.firstElementChild;
      while (root && root.nodeType === 1 && !root.style.width) root = root.nextElementSibling;
      if (!root) return;
      var w = parseFloat(root.style.width) || 393;
      var avail = window.innerWidth;
      var z = Math.min(1, (avail - (avail > 520 ? 48 : 0)) / w);
      mount.style.zoom = z < 1 ? String(z) : '';
      document.body.classList.toggle('kipu-phone', avail <= 520);
    }
    window.addEventListener('resize', fit);

    inst.__render();
    if (typeof inst.componentDidMount === 'function') inst.componentDidMount();
  }

  var frame = document.createElement('style');
  frame.textContent =
    'html,body{min-height:100%}body{margin:0;background:#E9E7EF;display:flex;justify-content:center;align-items:flex-start}' +
    '.kipu-stage{margin:24px auto;border-radius:44px;overflow:hidden;box-shadow:0 0 0 10px #16151C,0 30px 80px rgba(10,8,30,.35);background:#FAFAF8}' +
    'body.kipu-phone{background:#FAFAF8}body.kipu-phone .kipu-stage{margin:0;border-radius:0;box-shadow:none}';
  document.head.appendChild(frame);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
