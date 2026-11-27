// Renders the homepage (index.html) from content.json.
// Shared by the editor's live preview (in the browser), the save API
// (on Vercel) and scripts/build.mjs (on your computer), so all three
// always produce the same page. Edit page layout here, words in content.json.

export const FONTS = {
  anton:     { label: 'Anton (bold all-caps)',   family: "'Anton', 'DM Sans', sans-serif",                google: 'Anton',                                         weight: 400, track: '.01em',  upper: true },
  fraunces:  { label: 'Fraunces (soft serif)',   family: "'Fraunces', Georgia, serif",                    google: 'Fraunces:opsz,wght@9..144,700;9..144,800',      weight: 800, track: '-.02em', upper: false },
  georgia:   { label: 'Georgia (classic serif)', family: "Georgia, 'Times New Roman', serif",             google: null,                                            weight: 700, track: '-.01em', upper: false },
  bricolage: { label: 'Bricolage Grotesque',     family: "'Bricolage Grotesque', 'DM Sans', sans-serif",  google: 'Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800', weight: 800, track: '-.03em', upper: false },
  syne:      { label: 'Syne (wide, artsy)',      family: "'Syne', 'DM Sans', sans-serif",                 google: 'Syne:wght@700;800',                             weight: 800, track: '-.03em', upper: false },
  playfair:  { label: 'Playfair Display (glam)', family: "'Playfair Display', Georgia, serif",            google: 'Playfair+Display:wght@700;800',                 weight: 800, track: '-.01em', upper: false },
  space:     { label: 'Space Grotesk (techy)',   family: "'Space Grotesk', 'DM Sans', sans-serif",        google: 'Space+Grotesk:wght@500;700',                    weight: 700, track: '-.03em', upper: false },
};

export const ICONS = {
  dollar: { label: 'Dollar',      svg: '<circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path>' },
  trend:  { label: 'Growth',      svg: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline>' },
  target: { label: 'Target',      svg: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>' },
  tv:     { label: 'TV',          svg: '<rect x="2" y="7" width="20" height="15" rx="2"></rect><polyline points="17 2 12 7 7 2"></polyline>' },
  cap:    { label: 'Graduation',  svg: '<path d="M22 10 12 5 2 10l10 5 10-5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path><path d="M22 10v6"></path>' },
  users:  { label: 'Audience',    svg: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
  mic:    { label: 'Microphone',  svg: '<rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M19 10v1a7 7 0 0 1-14 0v-1"></path><line x1="12" y1="18" x2="12" y2="22"></line>' },
  film:   { label: 'Film',        svg: '<rect x="2" y="2" width="20" height="20" rx="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line>' },
  award:  { label: 'Award',       svg: '<circle cx="12" cy="8" r="6"></circle><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"></path>' },
  chart:  { label: 'Bar chart',   svg: '<line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line>' },
  star:   { label: 'Star',        svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>' },
};

export const BOARD_CELLS = 20;

const LIMITS = { short: 80, medium: 160, long: 400 };

// ---------- helpers ----------
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Like esc, but leaves apostrophes alone for readable body text.
function txt(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function youtubeId(input) {
  const s = String(input ?? '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function luminance([r, g, b]) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Accent-derived colours: text on accent buttons, and a darker accent that
// stays readable on the light theme's pale background.
export function accentColors(accent) {
  const rgb = hexToRgb(accent);
  const onAccent = contrast(rgb, [6, 16, 31]) >= contrast(rgb, [255, 255, 255]) ? '#06101f' : '#ffffff';
  const lightBg = [245, 247, 251];
  let f = 1, dark = rgb;
  while (contrast(dark, lightBg) < 4.6 && f > 0.05) { f -= 0.05; dark = rgb.map(c => c * f); }
  return { rgb: rgb.join(', '), onAccent, lightText: rgbToHex(dark) };
}

// ---------- validation ----------
// Returns a list of { path, message }. Empty list = valid.
export function validate(c) {
  const errors = [];
  const err = (path, message) => errors.push({ path, message });
  const str = (path, v, { max = LIMITS.short, required = true } = {}) => {
    if (typeof v !== 'string') return err(path, 'must be text');
    if (required && !v.trim()) err(path, 'cannot be empty');
    if (v.length > max) err(path, `is too long (max ${max} characters)`);
  };
  const list = (path, v, max) => {
    if (!Array.isArray(v)) { err(path, 'must be a list'); return false; }
    if (v.length > max) err(path, `has too many items (max ${max})`);
    return true;
  };
  if (!c || typeof c !== 'object') return [{ path: '', message: 'content is missing' }];

  if (!/^#[0-9a-fA-F]{6}$/.test(c.theme?.accent ?? '')) err('theme.accent', 'must be a colour like #f5c451');
  if (!FONTS[c.theme?.headingFont]) err('theme.headingFont', 'is not one of the available fonts');
  str('meta.title', c.meta?.title, { max: LIMITS.medium });
  str('meta.description', c.meta?.description, { max: LIMITS.long });
  str('name', c.name);
  if (typeof c.headshot !== 'string' || !/^headshot\.jpg(\?v=\d+)?$/.test(c.headshot)) err('headshot', 'is not a valid headshot file');

  str('hero.eyebrow', c.hero?.eyebrow, { max: LIMITS.medium });
  str('hero.lede', c.hero?.lede, { max: LIMITS.long });
  str('hero.primaryButton', c.hero?.primaryButton, { max: 40 });
  str('hero.secondaryButton', c.hero?.secondaryButton, { max: 40 });

  str('stats.label', c.stats?.label, { max: 40 });
  if (list('stats.items', c.stats?.items, 10)) c.stats.items.forEach((s, i) => {
    if (!ICONS[s?.icon]) err(`stats.items.${i}.icon`, 'is not one of the available icons');
    str(`stats.items.${i}.value`, s?.value, { max: 20 });
    str(`stats.items.${i}.label`, s?.label, { max: LIMITS.short });
  });

  str('experience.eyebrow', c.experience?.eyebrow, { max: 40 });
  str('experience.heading', c.experience?.heading, { max: LIMITS.short });
  if (list('experience.jobs', c.experience?.jobs, 12)) c.experience.jobs.forEach((j, i) => {
    str(`experience.jobs.${i}.track`, j?.track, { max: 40 });
    str(`experience.jobs.${i}.company`, j?.company);
    str(`experience.jobs.${i}.description`, j?.description, { max: LIMITS.long });
    str(`experience.jobs.${i}.show`, j?.show ?? '', { required: false });
    if (list(`experience.jobs.${i}.clips`, j?.clips ?? [], 9)) (j.clips ?? []).forEach((cl, k) => {
      str(`experience.jobs.${i}.clips.${k}.title`, cl?.title, { max: 60 });
      if (!youtubeId(cl?.youtube)) err(`experience.jobs.${i}.clips.${k}.youtube`, 'is not a YouTube link or video ID');
    });
    if ((j?.clips ?? []).length && !(j?.show ?? '').trim()) err(`experience.jobs.${i}.show`, 'needs a show name when the job has clips');
  });

  str('skills.heading', c.skills?.heading, { max: 40 });
  if (list('skills.pairs', c.skills?.pairs, 40)) {
    if (!c.skills.pairs.length) err('skills.pairs', 'needs at least one pair');
    c.skills.pairs.forEach((p, i) => {
      str(`skills.pairs.${i}.theme`, p?.theme, { max: 24 });
      str(`skills.pairs.${i}.first`, p?.first, { max: BOARD_CELLS });
      str(`skills.pairs.${i}.second`, p?.second, { max: BOARD_CELLS });
    });
  }

  str('about.eyebrow', c.about?.eyebrow, { max: 40 });
  str('about.heading', c.about?.heading, { max: LIMITS.short });
  if (list('about.paragraphs', c.about?.paragraphs, 8)) c.about.paragraphs.forEach((p, i) => str(`about.paragraphs.${i}`, p, { max: 800 }));

  str('contact.heading', c.contact?.heading, { max: LIMITS.short });
  str('contact.lede', c.contact?.lede, { max: LIMITS.long });
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(c.contact?.email ?? '')) err('contact.email', 'must be an email address');

  return errors;
}

// ---------- page sections ----------
function icon(name) {
  return `<span class="stat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name].svg}</svg></span>`;
}

function statsSection(stats) {
  const items = stats.items;
  const sr = items.map(s => `<li>${txt(s.value)} ${txt(s.label)}</li>`).join('');
  const group = items.map(s =>
    `<span class="tk-item">${icon(s.icon)}<span class="tk-num">${txt(s.value)}</span><span class="tk-label">${txt(s.label)}</span></span><span class="tk-sep"></span>`
  ).join('');
  const dur = Math.max(16, Math.round(items.length * 6.4));
  return `  <!-- STATS -->
  <section id="stats" class="ticker" aria-label="${esc(stats.label)}">
    <span class="tk-badge" aria-hidden="true">${txt(stats.label)}</span>
    <div class="marquee">
      <ul class="sr-only">${sr}</ul>
      <div class="track" aria-hidden="true" style="--dur: ${dur}s">
        <div class="group">${group}</div>
        <div class="group">${group}</div>
      </div>
    </div>
  </section>`;
}

function clip(show, c) {
  const id = youtubeId(c.youtube);
  return `          <div class="clip spot-card">
            <button class="clip-thumb" type="button" data-yt="${id}" data-title="${esc(show)} – ${esc(c.title)}" aria-label="Play ${esc(show)} ${esc(c.title)}">
              <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">
              <span class="play"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"></path></svg></span>
            </button>
            <div class="clip-meta"><span class="clip-title">${txt(c.title)}</span><a class="box pill" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">YouTube<span class="sr-only"> (opens ${txt(show)} ${txt(c.title)} in a new tab)</span></a></div>
          </div>`;
}

function job(j) {
  const clips = j.clips ?? [];
  const reel = clips.length ? `
        <div class="reel-head">
          <span class="reel-show">${txt(j.show)}</span>
          <span class="reel-hint">Scroll for more →</span>
        </div>
        <div class="reel" role="region" aria-label="${esc(j.show)} clips" tabindex="0">
${clips.map(c => clip(j.show, c)).join('\n')}
        </div>` : '';
  return `      <article class="spot-card job">
        <span class="job-track">${txt(j.track)}</span>
        <h3 class="job-company">${txt(j.company)}</h3>
        <p class="box job-desc">${txt(j.description)}</p>${reel}
      </article>`;
}

function boardRow(text) {
  const t = String(text).toUpperCase().padEnd(BOARD_CELLS, ' ').slice(0, BOARD_CELLS);
  return '<div class="board-row">' + [...t].map(ch => `<span class="cell">${ch === ' ' ? '&nbsp;' : txt(ch)}</span>`).join('') + '</div>';
}

function skillsBoard(skills) {
  const pairs = skills.pairs;
  const data = esc(JSON.stringify(pairs.map(p => [p.theme, p.first, p.second])));
  const sr = pairs.map(p => `<li>${txt(p.theme)}: ${txt(p.first)}, ${txt(p.second)}</li>`).join('');
  const p0 = pairs[0];
  return `    <div class="skills">
      <div class="board" data-pairs="${data}">
        <h3 class="board-head"><span>${txt(skills.heading)}</span><span class="board-cat" aria-hidden="true">${txt(p0.theme)}</span></h3>
        <ul class="sr-only">${sr}</ul>
        <div class="board-rows" aria-hidden="true">${boardRow(p0.first)}${boardRow(p0.second)}</div>
      </div>
    </div>`;
}

function themeStyle(theme) {
  const f = FONTS[theme.headingFont];
  const a = accentColors(theme.accent);
  return `  <style id="site-theme">
    :root { --accent: ${theme.accent}; --accent-rgb: ${a.rgb}; --on-accent: ${a.onAccent}; --head-font: ${f.family}; --head-weight: ${f.weight}; --head-track: ${f.track}; --head-case: ${f.upper ? 'uppercase' : 'none'}; }
    :root[data-theme="light"] { --accent-text: ${a.lightText}; }
  </style>`;
}

function fontLink(theme) {
  const f = FONTS[theme.headingFont];
  const families = ['DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700'];
  if (f.google) families.push(f.google);
  families.push('JetBrains+Mono:wght@700');
  return `https://fonts.googleapis.com/css2?${families.map(x => 'family=' + x).join('&amp;')}&amp;display=swap`;
}

// ---------- the page ----------
// opts.base: add a <base href> (the editor preview uses '/').
// opts.headshot: override the headshot src (the editor previews an unsaved upload).
// opts.preview: skip the load-in animations so live edits don't replay them.
// opts.inject: extra HTML placed before </body> (editor preview only).
export function render(c, opts = {}) {
  const name = c.name;
  const headshot = opts.headshot || c.headshot;
  const year = new Date().getFullYear();
  const mail = `mailto:${esc(c.contact.email)}`;
  const previewCss = opts.preview ? `
  <style>.rise,.spot-head{animation:none!important;opacity:1!important}.spot-cone{animation:none!important;opacity:.3}.spot-halo{animation:none!important;opacity:.35}</style>` : '';
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">${opts.base ? `\n  <base href="${esc(opts.base)}">` : ''}
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${txt(c.meta.title)}</title>
  <meta name="description" content="${esc(c.meta.description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontLink(c.theme)}" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
${themeStyle(c.theme)}${previewCss}
  <script>
    // Apply the saved theme before first paint to avoid a flash.
    try { var t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch (e) {}
  </script>
  <script src="script.js" defer></script>
</head>
<body>
<div class="page">

  <!-- NAV -->
  <nav class="nav">
    <div class="nav-inner">
      <a class="brand" href="#top">${txt(name.toUpperCase())}</a>
      <div class="navlinks">
        <a class="navlink" href="#experience">${txt(c.experience.eyebrow)}</a>
        <a class="navlink" href="#about">${txt(c.about.eyebrow)}</a>
        <a class="navlink" href="#contact">Contact</a>
      </div>
      <button class="theme-toggle" type="button" aria-label="Toggle light and dark theme">Light mode</button>
    </div>
  </nav>

  <!-- HERO STAGE -->
  <header id="top" class="hero">
    <div class="beam beam-l" aria-hidden="true"></div>
    <div class="beam beam-r" aria-hidden="true"></div>
    <div class="beam beam-c" aria-hidden="true"></div>
    <div class="pool pool-hero" aria-hidden="true"></div>

    <div class="hero-inner">
      <div class="spot-wrap">
        <span class="spot-cone" aria-hidden="true"></span>
        <span class="spot-halo" aria-hidden="true"></span>
        <img class="headshot spot-head" src="${esc(headshot)}" alt="${esc(name)}" width="138" height="138">
      </div>
      <p class="rise eyebrow hero-eyebrow" style="animation-delay:.75s">${txt(c.hero.eyebrow)}</p>
      <h1 class="rise hero-title" style="animation-delay:.9s">${txt(name)}</h1>
      <p class="rise box hero-lede" style="animation-delay:1.05s">${txt(c.hero.lede)}</p>
      <div class="rise hero-ctas" style="animation-delay:1.2s">
        <a class="btn btn-primary" href="#experience">${txt(c.hero.primaryButton)}</a>
        <a class="btn btn-ghost" href="${mail}">${txt(c.hero.secondaryButton)}</a>
      </div>
    </div>
  </header>

${statsSection(c.stats)}

  <!-- EXPERIENCE -->
  <section id="experience" class="sec">
    <p class="eyebrow">${txt(c.experience.eyebrow)}</p>
    <h2 class="h2 exp-title">${txt(c.experience.heading)}</h2>

    <div class="jobs">
${c.experience.jobs.map(job).join('\n\n')}
    </div>

${skillsBoard(c.skills)}
  </section>

  <!-- ABOUT -->
  <section id="about" class="sec about">
    <div class="about-head">
      <p class="eyebrow">${txt(c.about.eyebrow)}</p>
      <h2 class="h2">${txt(c.about.heading)}</h2>
    </div>
    <div class="box about-body">
${c.about.paragraphs.map(p => `      <p>${txt(p)}</p>`).join('\n')}
    </div>
  </section>

  <!-- CONTACT -->
  <footer id="contact" class="sec contact">
    <div class="pool pool-foot" aria-hidden="true"></div>
    <div class="contact-inner">
      <h2 class="h2 contact-title">${txt(c.contact.heading)}</h2>
      <p class="box contact-lede">${txt(c.contact.lede)}</p>
      <a class="btn btn-primary btn-email" href="${mail}">${txt(c.contact.email)}</a>
      <p class="box copyright">© <span class="year">${year}</span> ${txt(name)}</p>
    </div>
  </footer>
</div>${opts.inject ? '\n' + opts.inject : ''}
</body>
</html>
`;
}
