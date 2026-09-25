/* Kipu · themes as complete palettes. Each theme has a light and a dark palette; Appearance (Light, Dark, System) picks which one. */
(function () {
  const K = window.K;
  const { html } = K;

  // Roles: bg, surface, surface2 (sunken and inputs), elev (raised), line, acc (primary, text safe), acc2 (secondary), acc3 (accent),
  // accbg (selected state), tint (tinted surface), solid (solid color card, white text), grad (hero), grad2 (featured), chart (5), heroInk
  const P = (o) => o;
  K.THEMES = {
    Kipu: {
      desc: 'Amethyst and deep indigo. Calm, confident and ours.',
      light: P({ bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F3F3F6', elev: '#FFFFFF', line: '#E9E9EE', acc: '#59429E', acc2: '#21163B', acc3: '#937ACB', accbg: '#EFEAF8', tint: '#F5F2FB', solid: '#2E2152', grad: ['#6A52B4', '#59429E', '#3A2A6E'], grad2: ['#7A62B8', '#59429E'], chart: ['#59429E', '#937ACB', '#21163B', '#B8ACDE', '#D9D2EE'] }),
      dark: P({ bg: '#09090B', surface: '#141416', surface2: '#1C1C1F', elev: '#1E1E22', line: '#27272B', acc: '#B8ACDE', acc2: '#937ACB', acc3: '#59429E', accbg: '#2A2140', tint: '#1B1726', solid: '#59429E', grad: ['#7A62C4', '#59429E', '#3A2A6E'], grad2: ['#8A72CC', '#59429E'], chart: ['#B8ACDE', '#937ACB', '#6A52B4', '#D9D2EE', '#3A2A6E'], accInk: '#1F132F' }),
    },
    Ocean: {
      desc: 'Ice blue, teal and slate. Cool, calm and clear.',
      light: P({ bg: '#F4F6FB', surface: '#FFFFFF', surface2: '#EBEFF7', elev: '#FFFFFF', line: '#DEE4EF', acc: '#1F6F86', acc2: '#343844', acc3: '#5FB7C9', accbg: '#E3F4F8', tint: '#EEF6FA', solid: '#343844', grad: ['#0F1221', '#343844', '#3E8FA5'], grad2: ['#2E7F96', '#5FB7C9'], chart: ['#1F6F86', '#93D5E1', '#343844', '#5FB7C9', '#C9D3E3'] }),
      dark: P({ bg: '#0F1221', surface: '#171B2B', surface2: '#1E2334', elev: '#222839', line: '#2A3042', acc: '#93D5E1', acc2: '#6FB9CB', acc3: '#5DB6C8', accbg: '#183241', tint: '#152536', solid: '#2E6F82', grad: ['#1D3B5C', '#2E6F82', '#5DB6C8'], grad2: ['#2E6F82', '#5DB6C8'], chart: ['#93D5E1', '#5DB6C8', '#6B7080', '#C6ECF2', '#343844'], accInk: '#0F1221' }),
    },
    Forest: {
      desc: 'Deep forest, emerald, sage and leaf. Grounded and fresh.',
      light: P({ bg: '#F5F8F3', surface: '#FFFFFF', surface2: '#EDF3EA', elev: '#FFFFFF', line: '#DFE8DA', acc: '#1E7A55', acc2: '#0F3D2E', acc3: '#5E8C3A', accbg: '#E3F1E7', tint: '#EEF5EC', solid: '#14553F', grad: ['#0F3D2E', '#1E7A55', '#5FA868'], grad2: ['#1E7A55', '#7FB77E'], chart: ['#1E7A55', '#7FB77E', '#0F3D2E', '#B7D9A8', '#4E8F6B'] }),
      dark: P({ bg: '#0A120E', surface: '#111C16', surface2: '#17251D', elev: '#1A2A21', line: '#22362A', acc: '#6FD9A0', acc2: '#2FB57A', acc3: '#A7D46F', accbg: '#15301F', tint: '#122419', solid: '#1B6B4A', grad: ['#0F4A35', '#1E8A5C', '#6BBF6E'], grad2: ['#1E8A5C', '#8CC46A'], chart: ['#5FD39A', '#A7D46F', '#2E7D5B', '#CDEBB0', '#34503F'] }),
    },
    Sand: {
      desc: 'Cream, taupe, warm brown and muted gold. Quiet and elegant.',
      light: P({ bg: '#FAF7F2', surface: '#FFFFFF', surface2: '#F3EEE6', elev: '#FFFFFF', line: '#E8E1D6', acc: '#7A5A3A', acc2: '#8C7760', acc3: '#9C7A2E', accbg: '#F3ECE2', tint: '#F6F0E7', solid: '#6E5236', grad: ['#6E5236', '#8C6B48', '#B08A3C'], grad2: ['#8C6B48', '#B08A3C'], chart: ['#7A5A3A', '#B8913D', '#A08A70', '#D4BE92', '#E5DBCB'] }),
      dark: P({ bg: '#14110E', surface: '#1D1915', surface2: '#26211C', elev: '#29231E', line: '#332C25', acc: '#D9B77E', acc2: '#B59C80', acc3: '#E0BE6A', accbg: '#2E271E', tint: '#231E18', solid: '#6A5036', grad: ['#5E4630', '#7E6040', '#A8843A'], grad2: ['#7E6040', '#A8843A'], chart: ['#D9B77E', '#B59C80', '#E0BE6A', '#7A6650', '#453B31'] }),
    },
    Ember: {
      desc: 'Graphite and gray with an orange spark. Modern and warm.',
      light: P({ bg: '#F6F6F6', surface: '#FFFFFF', surface2: '#EEEEEF', elev: '#FFFFFF', line: '#E3E3E5', acc: '#C8481F', acc2: '#2C2D31', acc3: '#F76C43', accbg: '#FEEDE6', tint: '#F3F1F0', solid: '#2C2D31', grad: ['#222327', '#2C2D31', '#3A3B40'], grad2: ['#F76C43', '#D9502A'], chart: ['#F76C43', '#2C2D31', '#BFC0C4', '#F9A688', '#7A7B80'] }),
      dark: P({ bg: '#1B1C1F', surface: '#222327', surface2: '#2C2D31', elev: '#303136', line: '#36373C', acc: '#F9885F', acc2: '#BFC0C4', acc3: '#F76C43', accbg: '#3A2A24', tint: '#26272B', solid: '#3A3B40', grad: ['#F76C43', '#E4572E', '#C2431F'], grad2: ['#3A3B40', '#55565C'], chart: ['#F76C43', '#BFC0C4', '#F9A688', '#6E6F75', '#3A3B40'] }),
    },
    Coral: {
      desc: 'Deep navy with a coral accent. Serious, with character.',
      light: P({ bg: '#F6F6F5', surface: '#FFFFFF', surface2: '#EEEEEC', elev: '#FFFFFF', line: '#E2E2DF', acc: '#C73A1C', acc2: '#2C394B', acc3: '#FF4C29', accbg: '#FDEBE6', tint: '#F4F1EF', solid: '#2C394B', grad: ['#082032', '#2C394B', '#3F5A6E'], grad2: ['#FF4C29', '#B23A22'], chart: ['#FF4C29', '#334756', '#F29C85', '#8A9AAB', '#D2D2D2'] }),
      dark: P({ bg: '#082032', surface: '#0F2A3F', surface2: '#16334A', elev: '#1A3850', line: '#22405A', acc: '#FF7A5C', acc2: '#8FA3B5', acc3: '#FF4C29', accbg: '#33262F', tint: '#0F2D44', solid: '#2C394B', grad: ['#FF4C29', '#D63B22', '#7A2A22'], grad2: ['#334756', '#4F6C82'], chart: ['#FF6B4D', '#8FA3B5', '#F2A28C', '#4F6C82', '#2C394B'] }),
    },
    Dusk: {
      desc: 'Sunset orange and red with night blue.',
      light: P({ bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F3F3F6', elev: '#FFFFFF', line: '#E9E9EE', acc: '#C6361A', acc2: '#3F5BA8', acc3: '#E8893A', accbg: '#FDECE5', tint: '#F8F1EE', solid: '#3F5BA8', grad: ['#D8341A', '#E8672E'], grad2: ['#3F5BA8', '#5A7FC4'], chart: ['#E0391A', '#3F5BA8', '#E8893A', '#6FB2D6', '#C9C9CB'] }),
      dark: P({ bg: '#09090B', surface: '#141416', surface2: '#1C1C1F', elev: '#1E1E22', line: '#27272B', acc: '#FF8A5E', acc2: '#7D9BE6', acc3: '#F2A45C', accbg: '#3A231C', tint: '#1E1A1C', solid: '#3A55A0', grad: ['#D8401F', '#EE7A35'], grad2: ['#4A67B8', '#6A8FD6'], chart: ['#FF7A4D', '#7D9BE6', '#F2A45C', '#8FD0EC', '#4A4F66'] }),
    },
    Mono: {
      desc: 'Black, graphite, gray and silver. As minimal as it gets.',
      light: P({ bg: '#F7F7F7', surface: '#FFFFFF', surface2: '#F0F0F0', elev: '#FFFFFF', line: '#E5E5E5', acc: '#111111', acc2: '#4A4A4A', acc3: '#8A8A8A', accbg: '#ECECEC', tint: '#F2F2F2', solid: '#1A1A1A', grad: ['#111111', '#2B2B2B', '#474747'], grad2: ['#2B2B2B', '#555555'], chart: ['#111111', '#6B6B6B', '#A3A3A3', '#C8C8C8', '#E2E2E2'] }),
      dark: P({ bg: '#0A0A0A', surface: '#141414', surface2: '#1C1C1C', elev: '#1F1F1F', line: '#272727', acc: '#E8E8E8', acc2: '#B5B5B5', acc3: '#8C8C8C', accbg: '#262626', tint: '#181818', solid: '#2B2B2B', grad: ['#2A2A2A', '#383838', '#4F4F4F'], grad2: ['#333333', '#555555'], chart: ['#E8E8E8', '#9A9A9A', '#6A6A6A', '#C4C4C4', '#3A3A3A'], accInk: '#0A0A0A' }),
    },
  };
  // Earlier theme names keep working
  K.THEME_ALIAS = { 'Kipu Purple': 'Kipu', Aurora: 'Ocean', Sunset: 'Coral', Graphite: 'Ember', 'Warm Sand': 'Sand', Indigo: 'Kipu', Midnight: 'Kipu' };
  K.themeName = (n) => (K.THEMES[n] ? n : K.THEME_ALIAS[n] || 'Kipu');
  K.themeList = () => Object.keys(K.THEMES).filter((n) => n[0] !== '_');

  const SEM = {
    light: { ink: '#121117', ink2: '#3A3945', muted: '#6C6A78', pos: '#1A6B46', pos2: '#2E9B69', posbg: '#E6F4EC', warn: '#8F5608', warn2: '#E0A33B', warnbg: '#FDF1DC', crit: '#A3325A', crit2: '#D0537D', critbg: '#FCEBF1', info: '#2D5DB0', info2: '#7FA0D8', infobg: '#EAF1FC', neutral: '#DCDAE3' },
    dark: { ink: '#F2F2F7', ink2: '#D2D3DE', muted: '#9A9CB0', pos: '#5FD39A', pos2: '#3DBE80', posbg: 'rgba(61, 190, 128, 0.14)', warn: '#F2B654', warn2: '#E8A23A', warnbg: 'rgba(232, 162, 58, 0.14)', crit: '#FF8FA5', crit2: '#E0607F', critbg: 'rgba(224, 96, 127, 0.16)', info: '#8DB4FF', info2: '#5E86D6', infobg: 'rgba(94, 134, 214, 0.18)', neutral: 'rgba(255, 255, 255, 0.12)' },
  };
  const gradCss = (stops, deg) => 'linear-gradient(' + (deg || 135) + 'deg, ' + stops.map((c, i) => c + ' ' + Math.round((i / (stops.length - 1)) * 100) + '%').join(', ') + ')';
  K.gradCss = gradCss;
  K.palette = (name, dark) => { const T = K.THEMES[K.themeName(name)]; return dark ? T.dark : T.light; };
  // Appearance sets the background family; the theme sets the colors on top of it
  K.MODES = {
    Light: { desc: 'White and bright', base: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F3F3F6', elev: '#FFFFFF', line: '#E9E9EE' } },
    Graphite: { desc: 'Soft graphite gray', base: { bg: '#202124', surface: '#2A2B2F', surface2: '#34353A', elev: '#303136', line: '#3C3D43' } },
    Midnight: { desc: 'Night blue', base: { bg: '#0A1224', surface: '#111D36', surface2: '#182845', elev: '#1B2C4C', line: '#243758' } },
    Dark: { desc: 'Deep black', base: { bg: '#09090B', surface: '#141416', surface2: '#1C1C1F', elev: '#1E1E22', line: '#27272B' } },
  };
  K.modeName = (m) => (m === true ? 'Dark' : !m ? 'Light' : K.MODES[m] ? m : 'Dark');
  K.themeVars = function (name, mode) {
    mode = K.modeName(mode);
    const dark = mode !== 'Light';
    const v = K.palette(name, dark);
    const b = K.MODES[mode].base;
    const s = dark ? SEM.dark : SEM.light;
    const mono = K.themeName(name) === 'Mono';
    return {
      '--bg': b.bg, '--surface': b.surface, '--surface2': b.surface2, '--elev': b.elev, '--line': b.line,
      '--acc': v.acc, '--acc2': v.acc2, '--acc3': v.acc3, '--acc-ink': v.accInk || '#FFFFFF', '--solid': v.solid,
      '--accbg': dark ? 'color-mix(in srgb, ' + v.acc + ' 20%, ' + b.surface + ')' : v.accbg,
      '--tint': dark ? 'color-mix(in srgb, ' + v.acc + ' 9%, ' + b.surface + ')' : v.tint,
      '--grad': gradCss(v.grad), '--grad2': gradCss(v.grad2, 150), '--hero-ink': v.onInk || '#FFFFFF',
      '--c1': v.chart[0], '--c2': v.chart[1], '--c3': v.chart[2], '--c4': v.chart[3], '--c5': v.chart[4], '--chart2': v.chart[1],
      '--page-glow': mono ? 'none' : 'radial-gradient(120% 420px at 50% -120px, ' + v.grad[0] + (dark ? '2A' : '10') + ', transparent 70%)',
      '--glow': dark ? '0 16px 40px ' + v.grad[0] + '40' : '0 14px 32px ' + v.grad[0] + '2E',
      '--shadow': dark ? '0 1px 0 rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.35)' : '0 1px 2px rgba(20, 16, 50, 0.05), 0 10px 28px rgba(20, 16, 50, 0.08)',
      '--card-shadow': dark ? 'inset 0 1px 0 rgba(255, 255, 255, 0.03)' : '0 1px 2px rgba(20, 16, 50, 0.04), 0 6px 18px rgba(20, 16, 50, 0.05)',
      '--ink': s.ink, '--ink2': s.ink2, '--muted': s.muted, '--pos': s.pos, '--pos2': s.pos2, '--posbg': s.posbg, '--warn': s.warn, '--warn2': s.warn2, '--warnbg': s.warnbg, '--crit': s.crit, '--crit2': s.crit2, '--critbg': s.critbg, '--info': s.info, '--info2': s.info2, '--infobg': s.infobg, '--neutral': s.neutral,
      'color-scheme': dark ? 'dark' : 'light',
    };
  };

  // ---------------------------------------------------------------- Custom theme: built from one or two colors the person picks
  const hx = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const lum = (h) => { const c = hx(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const toward = (c, target, bg, ratio) => { let x = c; for (let i = 0; i < 40 && contrast(x, bg) < ratio; i++) x = mix(x, target, 0.06); return x; };
  const hueShift = (h, deg) => { let [r, g, b] = hx(h).map((v) => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let H = 0, S = 0; const L = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; S = L > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); H = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; H /= 6; } H = (H + deg / 360 + 1) % 1; const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; const q = L < 0.5 ? L * (1 + S) : L + S - L * S, p2 = 2 * L - q; return toHex([f(p2, q, H + 1 / 3), f(p2, q, H), f(p2, q, H - 1 / 3)].map((v) => v * 255)); };
  K.suggestSecond = (c) => hueShift(c, 32);
  K.contrast = contrast;
  K.CUSTOM_COLORS = [['Yellow', '#F2C200'], ['Gold', '#C9971C'], ['Lime', '#8CC63F'], ['Green', '#1E9E63'], ['Teal', '#0F9A94'], ['Cyan', '#12A4D6'], ['Blue', '#2F6BFF'], ['Indigo', '#4F46E5'], ['Violet', '#7C3AED'], ['Pink', '#E84A9A'], ['Fuchsia', '#C026D3'], ['Red', '#E03131'], ['Orange', '#F76C1B'], ['Brown', '#8B5E3C']];
  K.DEFAULT_CUSTOM = { color: '#F2C200', style: 'solid', color2: null };
  // Everything else is worked out: text-safe accents, soft tints, chart colors, and dark or light text on the color
  K.buildCustom = (cfg) => {
    cfg = Object.assign({}, K.DEFAULT_CUSTOM, cfg || {});
    const c = cfg.color, c2 = cfg.style === 'gradient' ? cfg.color2 || K.suggestSecond(c) : null;
    const avg = c2 ? mix(c, c2, 0.5) : c;
    const onInk = contrast(avg, '#FFFFFF') >= 3 ? '#FFFFFF' : '#141414';
    const grad = c2 ? [c, c2] : [mix(c, onInk === '#FFFFFF' ? '#FFFFFF' : '#000000', 0.06), c];
    const grad2 = c2 ? [c2, c] : [c, mix(c, '#000000', 0.12)];
    const accL = toward(c, '#000000', '#FFFFFF', 4.5), accD = toward(c, '#FFFFFF', '#141416', 4.5);
    const chart = [c, c2 || mix(c, '#000000', 0.35), mix(c, '#FFFFFF', 0.4), mix(c2 || c, '#FFFFFF', 0.62), mix(c, '#888888', 0.6)];
    const base = { onInk, solid: c, grad, grad2, chart, acc3: c };
    return {
      desc: 'Your own color' + (c2 ? 's' : '') + '.', custom: true, adjusted: accL !== c || onInk !== '#FFFFFF',
      light: Object.assign({ bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F3F3F6', elev: '#FFFFFF', line: '#E9E9EE', acc: accL, acc2: mix(c, '#000000', 0.3), accbg: mix(c, '#FFFFFF', 0.86), tint: mix(c, '#FFFFFF', 0.92), accInk: contrast(accL, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#141414' }, base),
      dark: Object.assign({ bg: '#09090B', surface: '#141416', surface2: '#1C1C1F', elev: '#1E1E22', line: '#27272B', acc: accD, acc2: mix(c, '#FFFFFF', 0.25), accbg: mix(c, '#141416', 0.78), tint: mix(c, '#141416', 0.9), accInk: contrast(accD, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#141414' }, base),
    };
  };
  K.setCustom = (cfg) => { K.THEMES.Custom = K.buildCustom(cfg); };
  K.setCustom(null);
  // Text color for a card look: the theme's ink for theme colors, white for the fixed dark looks
  K.inkFor = (look) => (!look || !look.kind || look.kind === 'theme' || String(look.key || '').startsWith('theme-') ? 'var(--hero-ink)' : '#FFFFFF');

  // Curated looks for cards, goals and trips: theme default, the palette's own colors, then a short fixed set
  K.LOOK_SOLIDS = [['purple', 'Purple', '#5B3FD6'], ['indigo', 'Indigo', '#3F46C9'], ['blue', 'Blue', '#1D5FD1'], ['teal', 'Teal', '#127C80'], ['green', 'Green', '#1E7A55'], ['terracotta', 'Terracotta', '#B8482A'], ['gold', 'Gold', '#8F6A22'], ['black', 'Black', '#161616']];
  K.LOOK_GRADS = [['purple-indigo', 'Purple to Indigo', ['#6A4BFF', '#3F46C9']], ['indigo-blue', 'Indigo to Blue', ['#3F46C9', '#2F6BFF']], ['blue-cyan', 'Blue to Cyan', ['#1D5FD1', '#18B5D8']], ['green-teal', 'Green to Teal', ['#1E7A55', '#2A9D8F']], ['orange-rose', 'Orange to Rose', ['#E0703A', '#D9486F']], ['graphite', 'Graphite', ['#1C1C1E', '#48484C']]];
  // look: { kind: 'theme' | 'solid' | 'gradient', key }. Returns a CSS background.
  K.lookBg = (look, fallback) => {
    if (!look || look.kind === 'theme' || !look.key) return fallback || 'var(--grad)';
    if (look.key === 'theme-solid') return 'var(--solid)';
    if (look.key === 'theme-grad') return 'var(--grad)';
    if (look.key === 'theme-grad2') return 'var(--grad2)';
    if (look.kind === 'solid') { const s = K.LOOK_SOLIDS.find((x) => x[0] === look.key); return s ? s[2] : fallback || 'var(--solid)'; }
    const g = K.LOOK_GRADS.find((x) => x[0] === look.key); return g ? gradCss(g[2], 140) : fallback || 'var(--grad)';
  };
  K.LookPicker = function LookPicker({ value, onChange, fallback, label }) {
    const v = value || { kind: 'theme' };
    const Sw = ({ look, bg, name }) => { const on = (v.kind || 'theme') === look.kind && (look.kind === 'theme' || v.key === look.key); return html`<button type="button" aria-label=${name} aria-pressed=${on} title=${name} onClick=${() => onChange(look)} style=${{ width: '38px', height: '38px', borderRadius: '12px', background: bg, boxShadow: on ? '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)' : 'inset 0 0 0 1px rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>${on && html`<${K.Icon} n="check" s=${15} w=${3} />`}</button>`; };
    return html`<div class="stack-s" style=${{ gap: '8px' }}>
      <span class="small muted" style=${{ fontWeight: 600 }}>${label || 'Appearance'}</span>
      <div class="row" style=${{ gap: '8px', flexWrap: 'wrap' }}><${Sw} look=${{ kind: 'theme' }} bg=${fallback || 'var(--grad)'} name="Theme default" /><${Sw} look=${{ kind: 'solid', key: 'theme-solid' }} bg="var(--solid)" name="Theme color" /><${Sw} look=${{ kind: 'gradient', key: 'theme-grad2' }} bg="var(--grad2)" name="Theme gradient" /></div>
      <span class="tiny muted">Solid</span><div class="row" style=${{ gap: '8px', flexWrap: 'wrap' }}>${K.LOOK_SOLIDS.map(([k, n, c]) => html`<${Sw} key=${k} look=${{ kind: 'solid', key: k }} bg=${c} name=${n} />`)}</div>
      <span class="tiny muted">Gradient</span><div class="row" style=${{ gap: '8px', flexWrap: 'wrap' }}>${K.LOOK_GRADS.map(([k, n, g]) => html`<${Sw} key=${k} look=${{ kind: 'gradient', key: k }} bg=${gradCss(g, 140)} name=${n} />`)}</div></div>`;
  };

  // Miniature app used for theme previews. Tokens are scoped to the preview element.
  const ThemePreview = ({ name, dark, mode, w }) => {
    mode = K.modeName(mode || !!dark); dark = mode !== 'Light';
    const vars = K.themeVars(name, mode);
    const v = K.palette(name, dark);
    const width = w || 190, k = width / 190;
    const st = Object.assign({}, vars, { width: width + 'px', borderRadius: 22 * k + 'px', padding: 12 * k + 'px ' + 10 * k + 'px ' + 8 * k + 'px', background: 'var(--page-glow), var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 7 * k + 'px', boxShadow: dark ? '0 14px 40px rgba(0,0,0,0.45)' : '0 12px 30px rgba(20,16,50,0.10)', fontFamily: 'var(--body)', flexShrink: 0 });
    const fz = (n) => n * k + 'px';
    return html`<div style=${st} aria-label=${K.themeName(name) + ' ' + mode + ' preview'}>
      <div class="between" style=${{ fontSize: fz(8), color: 'var(--muted)' }}><span>Good morning</span><span style=${{ width: fz(14), height: fz(14), borderRadius: '999px', background: 'var(--grad)' }}></span></div>
      <div style=${{ padding: fz(9), borderRadius: fz(13), background: 'var(--grad)', color: 'var(--hero-ink)', display: 'flex', flexDirection: 'column', gap: fz(3), boxShadow: 'var(--glow)' }}><span style=${{ fontSize: fz(7), opacity: 0.8 }}>Safe to Spend</span><b style=${{ fontSize: fz(17), fontFamily: 'var(--display)' }}>CA$1,250</b><span style=${{ display: 'flex', gap: fz(1.5) }}>${Array.from({ length: 12 }, (_, i) => html`<i key=${i} style=${{ flex: 1, height: fz(3), borderRadius: '2px', background: i < 7 ? 'var(--hero-ink)' : 'color-mix(in srgb, var(--hero-ink) 30%, transparent)' }}></i>`)}</span></div>
      <div style=${{ display: 'flex', gap: fz(5) }}>
        <div style=${{ width: fz(74), height: fz(48), borderRadius: fz(9), padding: fz(6), background: 'var(--grad2)', color: 'var(--hero-ink)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: fz(6), transform: 'rotate(-3deg)' }}><span style=${{ width: fz(12), height: fz(8), borderRadius: '2px', background: 'color-mix(in srgb, var(--hero-ink) 60%, transparent)' }}></span><span>•••• 1187</span></div>
        <div style=${{ flex: 1, padding: fz(5), borderRadius: fz(9), background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'flex-end', gap: fz(3) }}>${[50, 80, 45, 100, 70].map((hh, i) => html`<span key=${i} style=${{ flex: 1, height: hh * 0.34 * k + 'px', borderRadius: '2px', background: v.chart[i % 5] }}></span>`)}</div></div>
      <div style=${{ display: 'flex', gap: fz(4) }}><span style=${{ flex: 1, fontSize: fz(7), padding: fz(4) + ' ' + fz(6), borderRadius: fz(6), background: 'var(--solid)', color: 'var(--hero-ink)', fontWeight: 700 }}>Spent CA$840</span><span style=${{ flex: 1, fontSize: fz(7), padding: fz(4) + ' ' + fz(6), borderRadius: fz(6), background: 'var(--tint)', color: 'var(--acc)', fontWeight: 700, border: '1px solid var(--line)' }}>Saved 24%</span></div>
      <div style=${{ height: fz(24), borderRadius: fz(9), background: 'var(--grad)', color: 'var(--hero-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fz(8), fontWeight: 700 }}>Add expense</div>
      <div style=${{ height: fz(26), borderRadius: fz(10), background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}><span style=${{ width: fz(12), height: fz(3), borderRadius: '3px', background: 'var(--acc)' }}></span><span style=${{ width: fz(10), height: fz(3), borderRadius: '3px', background: 'var(--neutral)' }}></span><span style=${{ width: fz(15), height: fz(15), borderRadius: '999px', background: 'var(--grad)' }}></span><span style=${{ width: fz(10), height: fz(3), borderRadius: '3px', background: 'var(--neutral)' }}></span><span style=${{ width: fz(10), height: fz(3), borderRadius: '3px', background: 'var(--neutral)' }}></span></div>
    </div>`;
  };
  K.ThemePreview = ThemePreview;
})();
