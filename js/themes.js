/* Kipu · themes as complete palettes. Each theme has a light and a dark palette; Appearance (Light, Dark, System) picks which one. */
(function () {
  const K = window.K;
  const { html } = K;

  // Roles: bg, surface, surface2 (sunken and inputs), elev (raised), line, acc (primary, text safe), acc2 (secondary), acc3 (accent),
  // accbg (selected state), tint (tinted surface), solid (solid color card, white text), grad (hero), grad2 (featured), chart (5), heroInk
  const P = (o) => o;
  K.THEMES = {
    Kipu: {
      desc: 'Purple, indigo and blue. Modern and confident.',
      light: P({ bg: '#F7F6FB', surface: '#FFFFFF', surface2: '#F1EFF8', elev: '#FFFFFF', line: '#E7E4F0', acc: '#5B3FD6', acc2: '#3F46C9', acc3: '#2F6BFF', accbg: '#EFEBFD', tint: '#F4F1FE', solid: '#4B32C3', grad: ['#5B3FD6', '#4B45D8', '#3D63E6'], grad2: ['#3F46C9', '#2F6BFF'], chart: ['#5B3FD6', '#2F6BFF', '#9C8CF0', '#62A8F5', '#C9C1F4'] }),
      dark: P({ bg: '#0E0F17', surface: '#171824', surface2: '#1F2130', elev: '#212334', line: '#2A2C3D', acc: '#A393FF', acc2: '#7C83FF', acc3: '#5B9BFF', accbg: '#252049', tint: '#1C1A33', solid: '#5A3FE0', grad: ['#6A4BFF', '#5552F2', '#3F7BFF'], grad2: ['#4B45D8', '#3F7BFF'], chart: ['#8B74FF', '#4F8BFF', '#B7A8FF', '#7DB7FF', '#4A4670'] }),
    },
    Ocean: {
      desc: 'Deep navy, blue and cyan. Cool and clear.',
      light: P({ bg: '#F5F8FB', surface: '#FFFFFF', surface2: '#EDF3F8', elev: '#FFFFFF', line: '#E0E9F2', acc: '#1D5FD1', acc2: '#123E8C', acc3: '#0E97B8', accbg: '#E7F0FC', tint: '#EEF5FC', solid: '#1A56C0', grad: ['#123E8C', '#1D5FD1', '#1BA3C6'], grad2: ['#1D5FD1', '#1BA3C6'], chart: ['#1D5FD1', '#1BA3C6', '#7FA8E8', '#7ED3E3', '#BCCDE6'] }),
      dark: P({ bg: '#07111F', surface: '#0F1B2D', surface2: '#16243A', elev: '#182841', line: '#213150', acc: '#6FB2FF', acc2: '#3B82F6', acc3: '#3CD3F0', accbg: '#12294A', tint: '#0F2440', solid: '#1E5BC6', grad: ['#1F4FB8', '#1F74D6', '#18B5D8'], grad2: ['#1F74D6', '#18B5D8'], chart: ['#5AA2FF', '#3CD3F0', '#2D5E9E', '#8FE6F5', '#34466A'] }),
    },
    Forest: {
      desc: 'Deep forest, emerald, sage and leaf. Grounded and fresh.',
      light: P({ bg: '#F5F8F3', surface: '#FFFFFF', surface2: '#EDF3EA', elev: '#FFFFFF', line: '#DFE8DA', acc: '#1E7A55', acc2: '#0F3D2E', acc3: '#5E8C3A', accbg: '#E3F1E7', tint: '#EEF5EC', solid: '#14553F', grad: ['#0F3D2E', '#1E7A55', '#5FA868'], grad2: ['#1E7A55', '#7FB77E'], chart: ['#1E7A55', '#7FB77E', '#0F3D2E', '#B7D9A8', '#4E8F6B'] }),
      dark: P({ bg: '#0A120E', surface: '#111C16', surface2: '#17251D', elev: '#1A2A21', line: '#22362A', acc: '#6FD9A0', acc2: '#2FB57A', acc3: '#A7D46F', accbg: '#15301F', tint: '#122419', solid: '#1B6B4A', grad: ['#0F4A35', '#1E8A5C', '#6BBF6E'], grad2: ['#1E8A5C', '#8CC46A'], chart: ['#5FD39A', '#A7D46F', '#2E7D5B', '#CDEBB0', '#34503F'] }),
    },
    Ember: {
      desc: 'Terracotta, orange and rose. Warm and lively.',
      light: P({ bg: '#FCF7F3', surface: '#FFFFFF', surface2: '#F7EEE8', elev: '#FFFFFF', line: '#EFE2D9', acc: '#B8482A', acc2: '#D06A2A', acc3: '#C93F66', accbg: '#FBEDE6', tint: '#FCF0EA', solid: '#B0442A', grad: ['#B8482A', '#DC6A3A', '#D0466C'], grad2: ['#DC6A3A', '#D0466C'], chart: ['#C2502E', '#E68A3E', '#D9486F', '#EDB38F', '#EAD2C6'] }),
      dark: P({ bg: '#16100E', surface: '#201816', surface2: '#2A201D', elev: '#2D221F', line: '#372B27', acc: '#FF9A73', acc2: '#F2A25A', acc3: '#FF7A9E', accbg: '#3A231C', tint: '#2C1C18', solid: '#B24A2C', grad: ['#B8482A', '#D8683A', '#C8466C'], grad2: ['#D8683A', '#C8466C'], chart: ['#FF8A5C', '#F2B25A', '#FF7A9E', '#8C5A48', '#4A3833'] }),
    },
    Sand: {
      desc: 'Cream, taupe, warm brown and muted gold. Quiet and elegant.',
      light: P({ bg: '#FAF7F2', surface: '#FFFFFF', surface2: '#F3EEE6', elev: '#FFFFFF', line: '#E8E1D6', acc: '#7A5A3A', acc2: '#8C7760', acc3: '#9C7A2E', accbg: '#F3ECE2', tint: '#F6F0E7', solid: '#6E5236', grad: ['#6E5236', '#8C6B48', '#B08A3C'], grad2: ['#8C6B48', '#B08A3C'], chart: ['#7A5A3A', '#B8913D', '#A08A70', '#D4BE92', '#E5DBCB'] }),
      dark: P({ bg: '#14110E', surface: '#1D1915', surface2: '#26211C', elev: '#29231E', line: '#332C25', acc: '#D9B77E', acc2: '#B59C80', acc3: '#E0BE6A', accbg: '#2E271E', tint: '#231E18', solid: '#6A5036', grad: ['#5E4630', '#7E6040', '#A8843A'], grad2: ['#7E6040', '#A8843A'], chart: ['#D9B77E', '#B59C80', '#E0BE6A', '#7A6650', '#453B31'] }),
    },
    Mono: {
      desc: 'Black, graphite, gray and silver. As minimal as it gets.',
      light: P({ bg: '#F7F7F7', surface: '#FFFFFF', surface2: '#F0F0F0', elev: '#FFFFFF', line: '#E5E5E5', acc: '#111111', acc2: '#4A4A4A', acc3: '#8A8A8A', accbg: '#ECECEC', tint: '#F2F2F2', solid: '#1A1A1A', grad: ['#111111', '#2B2B2B', '#474747'], grad2: ['#2B2B2B', '#555555'], chart: ['#111111', '#6B6B6B', '#A3A3A3', '#C8C8C8', '#E2E2E2'] }),
      dark: P({ bg: '#0A0A0A', surface: '#141414', surface2: '#1C1C1C', elev: '#1F1F1F', line: '#272727', acc: '#E8E8E8', acc2: '#B5B5B5', acc3: '#8C8C8C', accbg: '#262626', tint: '#181818', solid: '#2B2B2B', grad: ['#2A2A2A', '#383838', '#4F4F4F'], grad2: ['#333333', '#555555'], chart: ['#E8E8E8', '#9A9A9A', '#6A6A6A', '#C4C4C4', '#3A3A3A'], accInk: '#0A0A0A' }),
    },
  };
  // Earlier theme names keep working
  K.THEME_ALIAS = { 'Kipu Purple': 'Kipu', Aurora: 'Ocean', Sunset: 'Ember', 'Warm Sand': 'Sand', Indigo: 'Kipu', Midnight: 'Kipu' };
  K.themeName = (n) => (K.THEMES[n] ? n : K.THEME_ALIAS[n] || 'Kipu');

  const SEM = {
    light: { ink: '#121117', ink2: '#3A3945', muted: '#6C6A78', pos: '#1A6B46', pos2: '#2E9B69', posbg: '#E6F4EC', warn: '#8F5608', warn2: '#E0A33B', warnbg: '#FDF1DC', crit: '#A3325A', crit2: '#D0537D', critbg: '#FCEBF1', info: '#2D5DB0', info2: '#7FA0D8', infobg: '#EAF1FC', neutral: '#DCDAE3' },
    dark: { ink: '#F2F2F7', ink2: '#D2D3DE', muted: '#9A9CB0', pos: '#5FD39A', pos2: '#3DBE80', posbg: 'rgba(61, 190, 128, 0.14)', warn: '#F2B654', warn2: '#E8A23A', warnbg: 'rgba(232, 162, 58, 0.14)', crit: '#FF8FA5', crit2: '#E0607F', critbg: 'rgba(224, 96, 127, 0.16)', info: '#8DB4FF', info2: '#5E86D6', infobg: 'rgba(94, 134, 214, 0.18)', neutral: 'rgba(255, 255, 255, 0.12)' },
  };
  const gradCss = (stops, deg) => 'linear-gradient(' + (deg || 135) + 'deg, ' + stops.map((c, i) => c + ' ' + Math.round((i / (stops.length - 1)) * 100) + '%').join(', ') + ')';
  K.gradCss = gradCss;
  K.palette = (name, dark) => { const T = K.THEMES[K.themeName(name)]; return dark ? T.dark : T.light; };
  K.themeVars = function (name, dark) {
    const v = K.palette(name, dark);
    const s = dark ? SEM.dark : SEM.light;
    const mono = K.themeName(name) === 'Mono';
    return {
      '--bg': v.bg, '--surface': v.surface, '--surface2': v.surface2, '--elev': v.elev, '--line': v.line,
      '--acc': v.acc, '--acc2': v.acc2, '--acc3': v.acc3, '--accbg': v.accbg, '--acc-ink': v.accInk || '#FFFFFF', '--tint': v.tint, '--solid': v.solid,
      '--grad': gradCss(v.grad), '--grad2': gradCss(v.grad2, 150), '--hero-ink': '#FFFFFF',
      '--c1': v.chart[0], '--c2': v.chart[1], '--c3': v.chart[2], '--c4': v.chart[3], '--c5': v.chart[4], '--chart2': v.chart[1],
      '--page-glow': dark && !mono ? 'radial-gradient(120% 420px at 50% -120px, ' + v.grad[0] + '2E, transparent 70%)' : dark ? 'none' : 'radial-gradient(120% 380px at 50% -140px, ' + v.grad[0] + '14, transparent 70%)',
      '--glow': dark ? '0 16px 40px ' + v.grad[0] + '40' : '0 14px 32px ' + v.grad[0] + '2E',
      '--shadow': dark ? '0 1px 0 rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.35)' : '0 1px 2px rgba(20, 16, 50, 0.04), 0 8px 24px rgba(20, 16, 50, 0.06)',
      '--card-shadow': dark ? 'inset 0 1px 0 rgba(255, 255, 255, 0.03)' : '0 1px 2px rgba(20, 16, 50, 0.03), 0 6px 18px rgba(20, 16, 50, 0.04)',
      '--ink': s.ink, '--ink2': s.ink2, '--muted': s.muted, '--pos': s.pos, '--pos2': s.pos2, '--posbg': s.posbg, '--warn': s.warn, '--warn2': s.warn2, '--warnbg': s.warnbg, '--crit': s.crit, '--crit2': s.crit2, '--critbg': s.critbg, '--info': s.info, '--info2': s.info2, '--infobg': s.infobg, '--neutral': s.neutral,
      'color-scheme': dark ? 'dark' : 'light',
    };
  };

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
  const ThemePreview = ({ name, dark, w }) => {
    const vars = K.themeVars(name, dark);
    const v = K.palette(name, dark);
    const width = w || 190, k = width / 190;
    const st = Object.assign({}, vars, { width: width + 'px', borderRadius: 22 * k + 'px', padding: 12 * k + 'px ' + 10 * k + 'px ' + 8 * k + 'px', background: 'var(--page-glow), var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 7 * k + 'px', boxShadow: dark ? '0 14px 40px rgba(0,0,0,0.45)' : '0 12px 30px rgba(20,16,50,0.10)', fontFamily: 'var(--body)', flexShrink: 0 });
    const fz = (n) => n * k + 'px';
    return html`<div style=${st} aria-label=${K.themeName(name) + (dark ? ' dark' : ' light') + ' preview'}>
      <div class="between" style=${{ fontSize: fz(8), color: 'var(--muted)' }}><span>Good morning</span><span style=${{ width: fz(14), height: fz(14), borderRadius: '999px', background: 'var(--grad)' }}></span></div>
      <div style=${{ padding: fz(9), borderRadius: fz(13), background: 'var(--grad)', color: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: fz(3), boxShadow: 'var(--glow)' }}><span style=${{ fontSize: fz(7), opacity: 0.8 }}>Safe to Spend</span><b style=${{ fontSize: fz(17), fontFamily: 'var(--display)' }}>CA$1,250</b><span style=${{ display: 'flex', gap: fz(1.5) }}>${Array.from({ length: 12 }, (_, i) => html`<i key=${i} style=${{ flex: 1, height: fz(3), borderRadius: '2px', background: i < 7 ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }}></i>`)}</span></div>
      <div style=${{ display: 'flex', gap: fz(5) }}>
        <div style=${{ width: fz(74), height: fz(48), borderRadius: fz(9), padding: fz(6), background: 'var(--grad2)', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: fz(6), transform: 'rotate(-3deg)' }}><span style=${{ width: fz(12), height: fz(8), borderRadius: '2px', background: 'rgba(255,255,255,0.6)' }}></span><span>•••• 1187</span></div>
        <div style=${{ flex: 1, padding: fz(5), borderRadius: fz(9), background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'flex-end', gap: fz(3) }}>${[50, 80, 45, 100, 70].map((hh, i) => html`<span key=${i} style=${{ flex: 1, height: hh * 0.34 * k + 'px', borderRadius: '2px', background: v.chart[i % 5] }}></span>`)}</div></div>
      <div style=${{ display: 'flex', gap: fz(4) }}><span style=${{ flex: 1, fontSize: fz(7), padding: fz(4) + ' ' + fz(6), borderRadius: fz(6), background: 'var(--solid)', color: '#FFFFFF', fontWeight: 700 }}>Spent CA$840</span><span style=${{ flex: 1, fontSize: fz(7), padding: fz(4) + ' ' + fz(6), borderRadius: fz(6), background: 'var(--tint)', color: 'var(--acc)', fontWeight: 700, border: '1px solid var(--line)' }}>Saved 24%</span></div>
      <div style=${{ height: fz(24), borderRadius: fz(9), background: 'var(--grad)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fz(8), fontWeight: 700 }}>Add expense</div>
      <div style=${{ height: fz(26), borderRadius: fz(10), background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}><span style=${{ width: fz(12), height: fz(3), borderRadius: '3px', background: 'var(--acc)' }}></span><span style=${{ width: fz(10), height: fz(3), borderRadius: '3px', background: 'var(--neutral)' }}></span><span style=${{ width: fz(15), height: fz(15), borderRadius: '999px', background: 'var(--grad)' }}></span><span style=${{ width: fz(10), height: fz(3), borderRadius: '3px', background: 'var(--neutral)' }}></span><span style=${{ width: fz(10), height: fz(3), borderRadius: '3px', background: 'var(--neutral)' }}></span></div>
    </div>`;
  };
  K.ThemePreview = ThemePreview;
})();
