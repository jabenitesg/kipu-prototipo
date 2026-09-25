/* Kipu · color themes, each with a designed light and dark variant */
(function () {
  const K = window.K;
  const { useState } = React;
  const { html, useApp, Icon, Metric, SectionHeader, Card, Row, Tile, Bar, Seg, Chips, Switch, ToggleRow, Field, EmptyState, Facts, Sharing } = K;

  // ---------------------------------------------------------------- themes: each has an intentional light and dark variant
  const L = (bg, surface2, line, accbg, acc, chart2, heroInk) => ({ bg, surface: '#FFFFFF', surface2, line, accbg, acc, chart2, heroInk: heroInk || '#FFFFFF' });
  const Dk = (bg, surface, surface2, line, accbg, acc, chart2) => ({ bg, surface, surface2, line, accbg, acc, chart2, heroInk: '#FFFFFF' });
  K.THEMES = {
    'Kipu Purple': { desc: 'Deep violet to electric blue', g: ['#4B2FC4', '#3D5BE0'], gd: ['#6A4BFF', '#3F7BFF'], light: L('#FAFAF8', '#F5F4F8', '#ECEAF2', '#F2EFFD', '#5134C9', '#7FA0D8'), dark: Dk('#0E1020', '#171A2B', '#1F2336', '#262A40', '#241F4A', '#A99BFF', '#6F95F0') },
    Aurora: { desc: 'Purple to cyan to soft blue', g: ['#6B4EE6', '#22B8CF', '#8FB8FF'], gd: ['#8A6BFF', '#25C9E0', '#7FA8FF'], light: L('#F6F8FC', '#EFF3F9', '#E5EAF3', '#EAF4FB', '#5A3FD6', '#22B8CF'), dark: Dk('#0B1224', '#141C33', '#1B2540', '#243052', '#16283F', '#7FDDEB', '#8A6BFF') },
    Ocean: { desc: 'Deep blue to bright azure', g: ['#1E4FD8', '#2FA8F5'], gd: ['#2F6BFF', '#3CC4FF'], light: L('#F7FAFD', '#EEF4FA', '#E3ECF6', '#E8F1FC', '#1E4FD8', '#2FA8F5'), dark: Dk('#081326', '#10203A', '#162A4A', '#1E3558', '#132B4D', '#6FB6FF', '#3CC4FF') },
    Forest: { desc: 'Emerald to teal', g: ['#0F8A5F', '#139C9C'], gd: ['#1FB57D', '#19B8B0'], light: L('#F6FAF7', '#EDF4EF', '#E1ECE4', '#E4F3EC', '#0F7A55', '#139C9C'), dark: Dk('#0C1714', '#14221E', '#1A2C27', '#223831', '#17302A', '#4FD3A6', '#19B8B0') },
    Sunset: { desc: 'Coral to pink to violet', g: ['#F0706A', '#E3558F', '#8B55D9'], gd: ['#FF7F6E', '#F0609A', '#9A66F0'], light: L('#FFF8F5', '#FBF0EC', '#F3E4DF', '#F6EAF8', '#8E3FB0', '#E3558F'), dark: Dk('#1A0F1D', '#251729', '#301D35', '#3B2440', '#341D35', '#FFA08F', '#9A66F0') },
    'Warm Sand': { desc: 'Beige to terracotta to soft peach', g: ['#E8CFA8', '#D98A63', '#F4C4A6'], gd: ['#C9A274', '#C8673F', '#E8A27F'], light: L('#FBF7F1', '#F4EDE3', '#EBE1D3', '#F6EBDD', '#A4522F', '#D98A63', '#2A1A10'), dark: Dk('#17120F', '#221B16', '#2C231C', '#382D24', '#2E231C', '#E3A37F', '#C9A274') },
    Midnight: { desc: 'Indigo to deep purple', g: ['#3B3FB5', '#5B2A9E'], gd: ['#5B5FFF', '#9340FF'], light: L('#F6F6FA', '#EFEFF6', '#E4E4EE', '#ECECF8', '#3B3FB5', '#7B5BC9'), dark: Dk('#07091A', '#11142A', '#181B38', '#212548', '#1B1D3F', '#A49BFF', '#9340FF') },
  };
  const SEM = {
    light: { ink: '#121117', ink2: '#3A3945', muted: '#6C6A78', pos: '#1A6B46', pos2: '#2E9B69', posbg: '#E6F4EC', warn: '#8F5608', warn2: '#E0A33B', warnbg: '#FDF1DC', crit: '#A3325A', crit2: '#D0537D', critbg: '#FCEBF1', info: '#2D5DB0', info2: '#7FA0D8', infobg: '#EAF1FC', neutral: '#D9D7E1' },
    dark: { ink: '#F2F2F7', ink2: '#D2D3DE', muted: '#9A9CB0', pos: '#5FD39A', pos2: '#3DBE80', posbg: 'rgba(61, 190, 128, 0.14)', warn: '#F2B654', warn2: '#E8A23A', warnbg: 'rgba(232, 162, 58, 0.14)', crit: '#FF8FA5', crit2: '#E0607F', critbg: 'rgba(224, 96, 127, 0.16)', info: '#8DB4FF', info2: '#5E86D6', infobg: 'rgba(94, 134, 214, 0.18)', neutral: '#3A3E55' },
  };
  K.themeVars = function (name, dark) {
    const T = K.THEMES[name] || K.THEMES['Kipu Purple'];
    const v = dark ? T.dark : T.light;
    const s = dark ? SEM.dark : SEM.light;
    const stops = dark ? T.gd : T.g;
    const grad = 'linear-gradient(135deg, ' + stops.map((c, i) => c + ' ' + Math.round((i / (stops.length - 1)) * 100) + '%').join(', ') + ')';
    return {
      '--bg': v.bg, '--surface': v.surface, '--surface2': v.surface2, '--line': v.line, '--accbg': v.accbg, '--acc': v.acc, '--chart2': v.chart2, '--hero-ink': v.heroInk, '--grad': grad,
      '--glow': dark ? '0 0 0 1px ' + stops[0] + '40, 0 16px 44px ' + stops[0] + '55' : '0 14px 34px ' + stops[0] + '33',
      '--shadow': dark ? '0 1px 0 rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.35)' : '0 1px 2px rgba(20, 16, 50, 0.04), 0 8px 24px rgba(20, 16, 50, 0.06)',
      '--ink': s.ink, '--ink2': s.ink2, '--muted': s.muted, '--pos': s.pos, '--pos2': s.pos2, '--posbg': s.posbg, '--warn': s.warn, '--warn2': s.warn2, '--warnbg': s.warnbg, '--crit': s.crit, '--crit2': s.crit2, '--critbg': s.critbg, '--info': s.info, '--info2': s.info2, '--infobg': s.infobg, '--neutral': s.neutral,
      'color-scheme': dark ? 'dark' : 'light',
    };
  };

  // Miniature app used for theme previews. Tokens are scoped to the preview element.
  const ThemePreview = ({ name, dark, w }) => {
    const vars = K.themeVars(name, dark);
    const st = Object.assign({}, vars, { width: (w || 190) + 'px', borderRadius: '24px', padding: '12px 10px 8px', background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '7px', boxShadow: dark ? '0 14px 40px rgba(0,0,0,0.5)' : '0 12px 30px rgba(20,16,50,0.12)', fontFamily: 'var(--body)' });
    return html`<div style=${st} aria-label=${name + (dark ? ' dark' : ' light') + ' preview'}>
      <div class="between" style=${{ fontSize: '8px', color: 'var(--muted)' }}><span>Good morning</span><span style=${{ width: '14px', height: '14px', borderRadius: '999px', background: 'var(--grad)' }}></span></div>
      <div style=${{ padding: '9px', borderRadius: '13px', background: 'var(--grad)', color: 'var(--hero-ink)', display: 'flex', flexDirection: 'column', gap: '3px', boxShadow: 'var(--glow)' }}><span style=${{ fontSize: '7px', opacity: 0.8 }}>Safe to Spend</span><b class="disp" style=${{ fontSize: '17px' }}>CA$1,250</b><span style=${{ height: '3px', borderRadius: '3px', background: 'rgba(255,255,255,0.35)' }}><span style=${{ display: 'block', width: '57%', height: '100%', background: 'currentColor', borderRadius: '3px' }}></span></span></div>
      <div style=${{ display: 'flex', gap: '5px' }}>
        <div style=${{ width: '74px', height: '48px', borderRadius: '9px', padding: '6px', background: 'var(--grad)', color: 'var(--hero-ink)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '6px', transform: 'rotate(-3deg)' }}><span style=${{ width: '12px', height: '8px', borderRadius: '2px', background: 'rgba(255,255,255,0.6)' }}></span><span>•••• 1187</span></div>
        <div style=${{ flex: 1, padding: '5px', borderRadius: '9px', background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'flex-end', gap: '3px' }}>${[50, 80, 45, 100, 70].map((hh, i) => html`<span key=${i} style=${{ flex: 1, height: hh * 0.34 + 'px', borderRadius: '2px', background: i === 3 ? 'var(--acc)' : i === 4 ? 'var(--chart2)' : 'var(--neutral)' }}></span>`)}</div></div>
      <div style=${{ display: 'flex', gap: '4px' }}><span style=${{ flex: 1, fontSize: '7px', padding: '4px 6px', borderRadius: '6px', background: 'var(--posbg)', color: 'var(--pos)', fontWeight: 700 }}>✓ On track</span><span style=${{ flex: 1, fontSize: '7px', padding: '4px 6px', borderRadius: '6px', background: 'var(--warnbg)', color: 'var(--warn)', fontWeight: 700 }}>! Dining</span></div>
      <div style=${{ height: '24px', borderRadius: '9px', background: 'var(--grad)', color: 'var(--hero-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700 }}>Add expense</div>
      <div style=${{ height: '26px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}><span style=${{ width: '12px', height: '3px', borderRadius: '3px', background: 'var(--grad)' }}></span><span style=${{ width: '10px', height: '3px', borderRadius: '3px', background: 'var(--neutral)' }}></span><span style=${{ width: '15px', height: '15px', borderRadius: '999px', background: 'var(--grad)' }}></span><span style=${{ width: '10px', height: '3px', borderRadius: '3px', background: 'var(--neutral)' }}></span><span style=${{ width: '10px', height: '3px', borderRadius: '3px', background: 'var(--neutral)' }}></span></div>
    </div>`;
  };
  K.ThemePreview = ThemePreview;
})();
