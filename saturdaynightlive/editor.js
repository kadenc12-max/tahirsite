// Site editor: log in, edit content.json through a form, watch a live
// preview, and save (which commits to GitHub and redeploys the site).
import { render, validate, youtubeId, FONTS, ICONS, BOARD_CELLS } from '/lib/render.js';

// ---------- what can be edited ----------
const ACCENTS = ['#f5c451', '#58a6ff', '#ff7a59', '#b18cff', '#3ddc97', '#ff5d8f'];
const fontOptions = Object.entries(FONTS).map(([v, f]) => [v, f.label]);
const iconOptions = Object.entries(ICONS).map(([v, i]) => [v, i.label]);

const SECTIONS = [
  { title: 'Look', open: true, fields: [
    { path: 'theme.accent', label: 'Accent color', type: 'color' },
    { path: 'theme.headingFont', label: 'Heading font', type: 'select', options: fontOptions },
  ] },
  { title: 'Basics', fields: [
    { path: 'name', label: 'Name', max: 80 },
    { path: 'headshot', label: 'Headshot photo', type: 'photo' },
    { path: 'meta.title', label: 'Browser tab title', max: 160 },
    { path: 'meta.description', label: 'Search description', type: 'textarea', max: 400, hint: 'Shown under the site in Google results.' },
  ] },
  { title: 'Hero', fields: [
    { path: 'hero.eyebrow', label: 'Title above the name', max: 160 },
    { path: 'hero.lede', label: 'Intro line', type: 'textarea', max: 400 },
    { path: 'hero.primaryButton', label: 'Gold button (jumps to Experience)', max: 40 },
    { path: 'hero.secondaryButton', label: 'Outline button (opens email)', max: 40 },
  ] },
  { title: 'Stats ticker', fields: [
    { path: 'stats.label', label: 'Gold tag', max: 40 },
    { path: 'stats.items', label: 'Stats', type: 'list', max: 10, add: 'Add stat',
      title: (s, i) => s.value ? `${s.value} ${s.label}` : `Stat ${i + 1}`,
      blank: () => ({ icon: 'star', value: '', label: '' }),
      fields: [
        { key: 'icon', label: 'Icon', type: 'select', options: iconOptions, half: true },
        { key: 'value', label: 'Number', max: 20, half: true },
        { key: 'label', label: 'Label', max: 80 },
      ] },
  ] },
  { title: 'Experience', fields: [
    { path: 'experience.eyebrow', label: 'Small label (also the nav link)', max: 40 },
    { path: 'experience.heading', label: 'Heading', max: 80 },
    { path: 'experience.jobs', label: 'Jobs', type: 'list', max: 12, add: 'Add job',
      title: (j, i) => j.company || `Job ${i + 1}`,
      blank: () => ({ track: '', company: '', description: '', show: '', clips: [] }),
      fields: [
        { key: 'track', label: 'Category', max: 40, half: true },
        { key: 'company', label: 'Company', max: 80, half: true },
        { key: 'description', label: 'Description', type: 'textarea', max: 400 },
        { key: 'show', label: 'Show name (for clips)', max: 80, hint: 'Needed only if this job has clips.' },
        { key: 'clips', label: 'YouTube clips', type: 'list', max: 9, add: 'Add clip',
          title: (c, i) => c.title || `Clip ${i + 1}`,
          blank: () => ({ title: '', youtube: '' }),
          fields: [
            { key: 'title', label: 'Clip title', max: 60, half: true },
            { key: 'youtube', label: 'YouTube link or ID', type: 'youtube', half: true },
          ] },
      ] },
  ] },
  { title: 'Skills board', fields: [
    { path: 'skills.heading', label: 'Board title', max: 40 },
    { path: 'skills.pairs', label: 'Skill pairs', type: 'list', max: 40, add: 'Add pair',
      hint: `Each pair shows together. Skills fit ${BOARD_CELLS} characters, including spaces.`,
      title: (p, i) => p.theme || `Pair ${i + 1}`,
      blank: () => ({ theme: '', first: '', second: '' }),
      fields: [
        { key: 'theme', label: 'Theme (top corner)', max: 24 },
        { key: 'first', label: 'Top row', max: BOARD_CELLS, half: true, upper: true },
        { key: 'second', label: 'Bottom row', max: BOARD_CELLS, half: true, upper: true },
      ] },
  ] },
  { title: 'About', fields: [
    { path: 'about.eyebrow', label: 'Small label (also the nav link)', max: 40 },
    { path: 'about.heading', label: 'Heading', max: 80 },
    { path: 'about.paragraphs', label: 'Paragraphs', type: 'textlist', max: 8, itemMax: 800, add: 'Add paragraph' },
  ] },
  { title: 'Contact', fields: [
    { path: 'contact.heading', label: 'Heading', max: 80 },
    { path: 'contact.lede', label: 'Line under the heading', type: 'textarea', max: 400 },
    { path: 'contact.email', label: 'Email address', type: 'email' },
  ] },
];

// ---------- state ----------
let content = null;      // what's being edited
let sha = null;          // version of content.json it was loaded from
let photo = null;        // { base64, dataUrl } for an unsaved new headshot
let dirty = false;
let saving = false;
let previewScroll = 0;
let previewTimer = 0;
const openSections = new Set(SECTIONS.filter(s => s.open).map(s => s.title));

const $ = sel => document.querySelector(sel);
const form = $('#form');
const frame = $('#preview');

// ---------- small helpers ----------
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k in n && typeof v !== 'string') n[k] = v;
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) n.append(kid);
  return n;
}
const parts = p => (Array.isArray(p) ? p : String(p).split('.')).map(x => (/^\d+$/.test(x) ? Number(x) : x));
const getAt = (obj, p) => parts(p).reduce((o, k) => (o == null ? o : o[k]), obj);
function setAt(obj, p, value) {
  const ks = parts(p);
  const last = ks.pop();
  getAt(obj, ks)[last] = value;
}
const pathKey = p => parts(p).join('.');

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api/' + path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const e = new Error(data.error || `Request failed (${res.status})`);
    e.status = res.status;
    e.errors = data.errors;
    throw e;
  }
  return data;
}

// ---------- views ----------
function showLogin(message) {
  $('#editor').hidden = true;
  $('#login').hidden = false;
  const err = $('#login-error');
  err.hidden = !message;
  err.textContent = message || '';
  $('#password').focus();
}

async function showEditor() {
  $('#login').hidden = true;
  $('#editor').hidden = false;
  setStatus('Loading…');
  try {
    const data = await api('content');
    content = data.content;
    sha = data.sha;
    photo = null;
    dirty = false;
    buildForm();
    refresh();
    setStatus('All changes saved');
  } catch (e) {
    if (e.status === 401) return showLogin();
    setStatus('Could not load the site content', 'error');
    notice('error', e.message);
  }
}

function setStatus(text, kind = '') {
  const s = $('#status');
  s.textContent = text;
  s.className = 'status' + (kind ? ' ' + kind : '');
}

function notice(kind, message, list) {
  const n = $('#notice');
  if (!kind) { n.hidden = true; return; }
  n.hidden = false;
  n.className = 'notice ' + kind;
  n.replaceChildren(el('div', {}, message));
  if (list?.length) n.append(el('ul', {}, list.map(t => el('li', {}, t))));
}

// ---------- form building ----------
function buildForm() {
  const scroll = form.parentElement.scrollTop;
  form.replaceChildren(...SECTIONS.map(section => {
    const det = el('details', { class: 'section', open: openSections.has(section.title) },
      el('summary', {}, el('span', {}, section.title, el('span', { class: 'badge', hidden: true }))),
      el('div', { class: 'section-body' }, section.fields.map(f => field(f, parts(f.path)))));
    det.addEventListener('toggle', () => { det.open ? openSections.add(section.title) : openSections.delete(section.title); });
    det.dataset.section = section.title;
    return det;
  }));
  form.parentElement.scrollTop = scroll;
}

function changed(path, value, { rebuild = false } = {}) {
  if (path) setAt(content, path, value);
  dirty = true;
  notice(null);
  if (rebuild) buildForm();
  refresh();
}

function counter(input, max) {
  const c = el('span', { class: 'count' });
  const update = () => {
    c.textContent = `${input.value.length}/${max}`;
    c.classList.toggle('over', input.value.length > max);
  };
  input.addEventListener('input', update);
  update();
  return c;
}

function wrap(f, path, control, extra) {
  return el('div', { class: 'field', 'data-path': pathKey(path) },
    el('div', { class: 'field-row' },
      el('label', { class: 'field-label', for: 'f-' + pathKey(path) }, f.label),
      extra || null),
    control,
    f.hint ? el('span', { class: 'field-hint' }, f.hint) : null,
    el('span', { class: 'field-error', hidden: true }));
}

function field(f, path) {
  const id = 'f-' + pathKey(path);
  const value = getAt(content, path);
  switch (f.type) {
    case 'list': return listField(f, path);
    case 'textlist': return textList(f, path);
    case 'photo': return photoField(f, path);
    case 'color': return colorField(f, path, value, id);
    case 'select': {
      const s = el('select', { id, onchange: e => changed(path, e.target.value, { rebuild: !!f.rebuild }) },
        f.options.map(([v, label]) => el('option', { value: v, selected: v === value }, label)));
      return wrap(f, path, s);
    }
    case 'textarea': {
      const t = el('textarea', { id, rows: 3, maxlength: f.max ? f.max + 50 : null, oninput: e => changed(path, e.target.value) });
      t.value = value ?? '';
      return wrap(f, path, t, f.max ? counter(t, f.max) : null);
    }
    case 'youtube': {
      const i = el('input', { id, type: 'text', spellcheck: false, placeholder: 'https://youtu.be/…', oninput: e => changed(path, e.target.value.trim()) });
      i.value = value ?? '';
      i.addEventListener('change', () => { const yt = youtubeId(i.value); if (yt) { i.value = yt; changed(path, yt); } });
      return wrap(f, path, i);
    }
    case 'email': {
      const i = el('input', { id, type: 'email', oninput: e => changed(path, e.target.value.trim()) });
      i.value = value ?? '';
      return wrap(f, path, i);
    }
    default: {
      const i = el('input', { id, type: 'text', maxlength: f.max ? f.max + 20 : null, oninput: e => changed(path, e.target.value) });
      i.value = value ?? '';
      if (f.upper) i.style.textTransform = 'uppercase';
      return wrap(f, path, i, f.max ? counter(i, f.max) : null);
    }
  }
}

function colorField(f, path, value, id) {
  const picker = el('input', { type: 'color', value, 'aria-label': 'Pick a color' });
  const hex = el('input', { id, type: 'text', value, spellcheck: false, maxlength: 7 });
  const swatches = el('div', { class: 'swatches' }, ACCENTS.map(c =>
    el('button', { type: 'button', class: 'swatch' + (c.toLowerCase() === value.toLowerCase() ? ' is-on' : ''), style: `background:${c}`, 'aria-label': `Use ${c}`, title: c,
      onclick: () => set(c) })));
  function set(v) {
    picker.value = /^#[0-9a-f]{6}$/i.test(v) ? v : picker.value;
    hex.value = v;
    swatches.querySelectorAll('.swatch').forEach(s => s.classList.toggle('is-on', s.title.toLowerCase() === v.toLowerCase()));
    changed(path, v);
  }
  picker.addEventListener('input', () => set(picker.value));
  hex.addEventListener('input', () => { let v = hex.value.trim(); if (!v.startsWith('#')) v = '#' + v; set(v); });
  return wrap(f, path, el('div', { class: 'color-row' }, picker, hex, swatches));
}

function photoField(f, path) {
  const img = el('img', { alt: 'Current headshot', src: photo?.dataUrl || '/' + getAt(content, path) });
  const input = el('input', { type: 'file', accept: 'image/*', id: 'f-photo', hidden: true });
  const pick = el('button', { type: 'button', class: 'btn btn-small', onclick: () => input.click() }, 'Choose new photo');
  const undo = el('button', { type: 'button', class: 'btn btn-small', hidden: !photo, onclick: () => { photo = null; changed(null, null, { rebuild: true }); } }, 'Keep current photo');
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      photo = await squarePhoto(file);
      changed(null, null, { rebuild: true });
    } catch {
      notice('error', 'That file could not be read as a photo. Try a JPEG or PNG.');
    }
  });
  return el('div', { class: 'field', 'data-path': pathKey(path) },
    el('span', { class: 'field-label' }, f.label),
    el('div', { class: 'photo-row' }, img, pick, undo, input),
    el('span', { class: 'field-hint' }, 'Cropped to a square around the face and shrunk automatically.'),
    el('span', { class: 'field-error', hidden: true }));
}

// Crops to a square (biased toward the top, where faces usually are) and
// shrinks to 480×480 JPEG, matching the circular frame on the site.
async function squarePhoto(file) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const sx = (bmp.width - s) / 2;
  const sy = bmp.height > bmp.width ? (bmp.height - s) * 0.2 : 0;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 480;
  canvas.getContext('2d').drawImage(bmp, sx, sy, s, s, 0, 0, 480, 480);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
  return { dataUrl, base64: dataUrl.split(',')[1] };
}

function itemControls(arr, i, onChange, label) {
  const move = (to) => { const [x] = arr.splice(i, 1); arr.splice(to, 0, x); onChange(); };
  return [
    el('button', { type: 'button', class: 'icon-btn', disabled: i === 0, 'aria-label': `Move ${label} up`, title: 'Move up', onclick: () => move(i - 1) }, '↑'),
    el('button', { type: 'button', class: 'icon-btn', disabled: i === arr.length - 1, 'aria-label': `Move ${label} down`, title: 'Move down', onclick: () => move(i + 1) }, '↓'),
    el('button', { type: 'button', class: 'icon-btn danger', 'aria-label': `Remove ${label}`, title: 'Remove',
      onclick: () => { if (confirm(`Remove ${label}?`)) { arr.splice(i, 1); onChange(); } } }, '×'),
  ];
}

function listField(f, path) {
  const arr = getAt(content, path) ?? [];
  if (!getAt(content, path)) setAt(content, path, arr);
  const rebuild = () => changed(null, null, { rebuild: true });
  const items = arr.map((item, i) => {
    const label = f.title(item, i);
    const titleEl = el('span', { class: 'item-title' }, label);
    const body = el('div', { class: 'item-body' });
    let row = null;
    f.fields.forEach(sub => {
      const node = field(sub, [...parts(path), i, sub.key]);
      if (sub.half) {
        if (!row) { row = el('div', { class: 'item-grid' }); body.append(row); }
        row.append(node);
        if (row.children.length === 2) row = null;
      } else { row = null; body.append(node); }
    });
    // keep the item's title in step with what's typed
    body.addEventListener('input', () => { titleEl.textContent = f.title(item, i); });
    return el('div', { class: 'item' },
      el('div', { class: 'item-head' }, titleEl, itemControls(arr, i, rebuild, label)),
      body);
  });
  const add = el('button', { type: 'button', class: 'btn btn-small', disabled: arr.length >= f.max,
    onclick: () => { arr.push(f.blank()); rebuild(); } }, '+ ' + f.add);
  return el('div', { class: 'field list', 'data-path': pathKey(path) },
    el('div', { class: 'list-head' }, el('span', { class: 'field-label' }, f.label), el('span', { class: 'count' }, `${arr.length}/${f.max}`)),
    f.hint ? el('span', { class: 'field-hint' }, f.hint) : null,
    el('span', { class: 'field-error', hidden: true }),
    items, add);
}

function textList(f, path) {
  const arr = getAt(content, path);
  const rebuild = () => changed(null, null, { rebuild: true });
  const items = arr.map((text, i) => {
    const t = el('textarea', { rows: 4, 'aria-label': `${f.label} ${i + 1}`, id: 'f-' + pathKey([...parts(path), i]), oninput: e => changed([...parts(path), i], e.target.value) });
    t.value = text;
    return el('div', { class: 'item' },
      el('div', { class: 'item-head' }, el('span', { class: 'item-title' }, `Paragraph ${i + 1}`), itemControls(arr, i, rebuild, `paragraph ${i + 1}`)),
      el('div', { class: 'item-body field', 'data-path': pathKey([...parts(path), i]) }, t, el('span', { class: 'field-error', hidden: true })));
  });
  const add = el('button', { type: 'button', class: 'btn btn-small', disabled: arr.length >= f.max, onclick: () => { arr.push(''); rebuild(); } }, '+ ' + f.add);
  return el('div', { class: 'field list', 'data-path': pathKey(path) },
    el('div', { class: 'list-head' }, el('span', { class: 'field-label' }, f.label), el('span', { class: 'count' }, `${arr.length}/${f.max}`)),
    el('span', { class: 'field-error', hidden: true }), items, add);
}

// ---------- validation display ----------
function friendly(path) {
  const ps = parts(path);
  for (const s of SECTIONS) for (const f of s.fields) {
    const fp = parts(f.path);
    if (fp.every((k, i) => ps[i] === k)) {
      let label = `${s.title} › ${f.label}`;
      if (ps.length > fp.length && typeof ps[fp.length] === 'number') {
        label += ` #${ps[fp.length] + 1}`;
        const sub = f.fields?.find(x => x.key === ps[fp.length + 1]);
        if (sub) {
          label += ` › ${sub.label}`;
          if (typeof ps[fp.length + 2] === 'number') {
            label += ` #${ps[fp.length + 2] + 1}`;
            const sub2 = sub.fields?.find(x => x.key === ps[fp.length + 3]);
            if (sub2) label += ` › ${sub2.label}`;
          }
        }
      }
      return label;
    }
  }
  return path;
}

function showErrors(errors) {
  form.querySelectorAll('.field').forEach(f => {
    f.classList.remove('has-error');
    const e = f.querySelector(':scope > .field-error');
    if (e) e.hidden = true;
  });
  form.querySelectorAll('.badge').forEach(b => { b.hidden = true; });
  const perSection = new Map();
  for (const er of errors) {
    const box = form.querySelector(`.field[data-path="${CSS.escape(er.path)}"]`);
    if (box) {
      box.classList.add('has-error');
      const msg = box.querySelector(':scope > .field-error');
      if (msg) { msg.hidden = false; msg.textContent = er.message[0].toUpperCase() + er.message.slice(1); }
      const sec = box.closest('.section');
      if (sec) perSection.set(sec, (perSection.get(sec) || 0) + 1);
    }
  }
  for (const [sec, n] of perSection) {
    const b = sec.querySelector('.badge');
    b.hidden = false;
    b.textContent = n === 1 ? '1 to fix' : `${n} to fix`;
  }
}

// ---------- refresh: errors, buttons, preview ----------
function refresh() {
  const errors = validate(content);
  showErrors(errors);
  $('#save').disabled = saving || !dirty || errors.length > 0;
  if (dirty) setStatus(errors.length ? `${errors.length} field${errors.length === 1 ? '' : 's'} to fix before saving` : 'Unsaved changes', errors.length ? 'error' : 'dirty');
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => updatePreview(errors), 200);
}

const PREVIEW_SCRIPT = `<script>
(function () {
  var y = __Y__;
  addEventListener('DOMContentLoaded', function () { scrollTo(0, y); });
  addEventListener('load', function () { scrollTo(0, y); });
  addEventListener('scroll', function () { parent.postMessage({ snlScroll: scrollY }, '*'); }, { passive: true });
  // In-page links (#about…) would otherwise navigate away because of <base>.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    var t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  });
})();
<\/script>`;

function updatePreview(errors) {
  if (errors.length) return; // keep the last good preview until fields are fixed
  try {
    frame.srcdoc = render(content, {
      base: location.origin + '/',
      preview: true,
      headshot: photo?.dataUrl,
      inject: PREVIEW_SCRIPT.replace('__Y__', String(Math.round(previewScroll))),
    });
  } catch (e) {
    console.error(e);
  }
}

addEventListener('message', e => {
  if (e.source === frame.contentWindow && typeof e.data?.snlScroll === 'number') previewScroll = e.data.snlScroll;
});

// ---------- save ----------
async function save() {
  const errors = validate(content);
  if (errors.length) return refresh();
  saving = true;
  $('#save').disabled = true;
  setStatus('Saving…');
  try {
    const res = await api('save', { method: 'POST', body: { content, sha, headshot: photo?.base64 } });
    content = res.content;
    sha = res.sha;
    photo = null;
    dirty = false;
    buildForm();
    refresh();
    setStatus('Saved');
    const link = res.url ? el('a', { href: res.url, target: '_blank', rel: 'noopener' }, 'See this change on GitHub') : null;
    const n = $('#notice');
    n.hidden = false;
    n.className = 'notice ok';
    n.replaceChildren(el('div', {}, 'Saved. The live site updates in about a minute. '), link || '');
  } catch (e) {
    if (e.status === 401) { showLogin('Your login expired. Log in again — your edits are still here.'); return; }
    setStatus('Not saved', 'error');
    notice('error', e.message, e.errors?.map(x => `${friendly(x.path)} ${x.message}`));
  } finally {
    saving = false;
    refresh();
  }
}

// ---------- wiring ----------
$('#login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.submitter || $('#login-form button');
  btn.disabled = true;
  try {
    await api('login', { method: 'POST', body: { password: $('#password').value } });
    $('#password').value = '';
    if (content && dirty) { // came back after an expired session: keep edits
      $('#login').hidden = true;
      $('#editor').hidden = false;
      refresh();
    } else {
      await showEditor();
    }
  } catch (err) {
    showLogin(err.status === 401 ? 'That password isn’t right.' : err.message);
  } finally {
    btn.disabled = false;
  }
});

$('#save').addEventListener('click', save);
$('#logout').addEventListener('click', async () => {
  if (dirty && !confirm('You have unsaved changes. Log out anyway?')) return;
  try { await api('logout', { method: 'POST', body: {} }); } catch {}
  content = null; dirty = false;
  showLogin();
});

document.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('is-on', x === b));
  $('.preview-frame').dataset.device = b.dataset.device;
}));

const editorEl = $('#editor');
editorEl.dataset.view = 'form';
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  editorEl.dataset.view = t.dataset.view;
  document.querySelectorAll('.tab').forEach(x => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-selected', String(x === t)); });
}));

addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !$('#editor').hidden) {
    e.preventDefault();
    if (!$('#save').disabled) save();
  }
});

addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

// ---------- start ----------
(async () => {
  try {
    const { loggedIn } = await api('session');
    loggedIn ? showEditor() : showLogin();
  } catch (e) {
    showLogin(e.message);
  }
})();
