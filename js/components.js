/* App — shared mobile app shell.
   ONE source for the chrome every app in this project wears (Mioty, Aranet
   Home, Cloud app, JR Crop): top app bar, the scrolling screen, the bottom tab
   bar, and — on a desktop browser — the device frame those sit in.
   Styling lives in css/style.css; this file renders the markup from a
   per-screen config and wires the behaviour.

   THIS PROJECT IS MOBILE FIRST (user, 2026-09-10). A screen is authored at
   phone size and asks the APP how wide it is (container queries / the
   data-device attribute), never the browser window — on a laptop the window is
   the desk the phone lies on, not the phone.

   Usage in a prototype:
     <body>
       <div class="stage">
         <div class="device-viewport" id="device">
           <div class="device-inner">
             <div class="device-pane">
               <main class="screen" id="screen"> …screen content… </main>
             </div>
           </div>
         </div>
       </div>
       <script src="../../../../lib/icons.js"></script>
       <script src="../../icons/icons.js"></script>
       <script src="../../js/i18n.js"></script>
       <script src="../../js/components.js"></script>
       <script>
         AppShell.mount({
           app: 'mioty',
           title: 'Devices',
           back: '../index.html',              // omit on a root screen
           action: '<button class="app-bar__btn" …>',
           active: 'devices',
           tabs: [ { id:'devices', label:'Devices', href:'devices.html', icon:'<svg…>' }, … ],
         });
       </script>
     </body>

   The app bar and tab bar are INSERTED around the .screen already in the page,
   so a screen's markup stays exactly what the app shows. */
(function () {
  const DEVICE_KEY = 'appDevice';   /* which frame the desktop preview shows */
  const MODE_KEY = 'appMode';       /* wireframe | design — see css/style.css palette */
  const MODES = [
    { id: 'wireframe', label: 'Wireframe' },
    { id: 'design',    label: 'Design' },
  ];
  const DEVICES = [
    { id: 'phone',  label: 'Phone',  size: '390 × 844' },
    { id: 'tablet', label: 'Tablet', size: '768 × 1024' },
  ];
  const T = (k, v) => (window.I18n ? window.I18n.t(k, v) : k);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>',
    tablet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="20" x="3" y="2" rx="2"/><path d="M12 18h.01"/></svg>',
  };

  /* Palettes here are light only, so the `theme` key the other prototypes on
     this origin write must never flip this project dark. */
  document.documentElement.classList.remove('dark');

  /* Mode is stamped on <html> before anything renders: the palette is a CSS
     attribute switch (html[data-mode]), so a late stamp would flash. Default is
     wireframe — the only palette every app has today (user, 2026-09-10). */
  function readMode() {
    try { const q = new URLSearchParams(location.search).get('mode'); if (MODES.some((m) => m.id === q)) return q; } catch (_) {}
    try { const v = localStorage.getItem(MODE_KEY); if (MODES.some((m) => m.id === v)) return v; } catch (_) {}
    return 'wireframe';
  }
  function setMode(id) {
    document.documentElement.dataset.mode = id;
    try { localStorage.setItem(MODE_KEY, id); } catch (_) {}
    document.querySelectorAll('.device-toolbar__btn[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === id)));
  }
  document.documentElement.dataset.mode = readMode();

  function tabMarkup(tabs, active) {
    return tabs.map((t) => {
      const on = t.id === active;
      return `<a class="tab" href="${esc(t.href)}"${on ? ' aria-current="page"' : ''}>
        ${t.icon || ''}<span class="tab__label">${esc(t.label)}</span>
      </a>`;
    }).join('');
  }

  function barMarkup(cfg) {
    const left = cfg.back
      ? `<a class="app-bar__btn" href="${esc(cfg.back)}" aria-label="${esc(cfg.backLabel || 'Back')}">${ICON.back}</a>`
      : '<span class="app-bar__spacer" aria-hidden="true"></span>';
    const right = cfg.action || '<span class="app-bar__spacer" aria-hidden="true"></span>';
    return `<header class="app-bar" data-back="${cfg.back ? 'true' : 'false'}">
      ${left}<h1 class="app-bar__title">${esc(cfg.title || '')}</h1>${right}
    </header>`;
  }

  /* The desktop-only device switcher. On a real phone or a narrow window the
     frame does not exist, so neither does this — CSS hides it and nothing here
     depends on it. */
  function toolbarMarkup(current, mode) {
    return `<div class="device-toolbar" role="group" aria-label="Preview">
      ${DEVICES.map((d) => `<button type="button" class="device-toolbar__btn" data-device="${d.id}"
        aria-pressed="${d.id === current}">${ICON[d.id]}${d.label}</button>`).join('')}
      <span class="device-toolbar__size">${DEVICES.find((d) => d.id === current).size}</span>
      <span class="device-toolbar__sep" aria-hidden="true"></span>
      ${MODES.map((m) => `<button type="button" class="device-toolbar__btn" data-mode="${m.id}"
        aria-pressed="${m.id === mode}">${m.label}</button>`).join('')}
    </div>`;
  }

  function mount(cfg) {
    const c = Object.assign({ tabs: [], active: null, device: null }, cfg || {});
    const device = document.getElementById('device');
    const screen = document.getElementById('screen');
    if (!device || !screen) return;

    /* Remember which screen of this app was last open, so the hub can reopen
       the app where the user left it instead of always its first view. */
    try {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const file = parts[parts.length - 1];
      const app = c.app || parts[parts.length - 2];
      if (app && file) localStorage.setItem('lastView:' + app, file);
    } catch (_) {}

    const pane = screen.closest('.device-pane') || screen.parentElement;
    /* No back, no title, no action = no bar. A progress or success screen has
       nothing to put there, and an empty strip only reads as a mistake. */
    if (c.back || c.title || c.action) pane.insertAdjacentHTML('afterbegin', barMarkup(c));
    /* The tab bar is a sibling of the pane inside .device-inner — that is the
       box whose direction flips between phone (column, bar at the bottom) and
       tablet (row-reverse, bar as a side rail). */
    const inner = pane.closest('.device-inner') || device;
    if (c.tabs.length) inner.insertAdjacentHTML('beforeend', `<nav class="tab-bar">${tabMarkup(c.tabs, c.active)}</nav>`);

    /* Which device the frame shows: this screen's wish, else what the viewer
       last picked, else phone — a phone app's home size. */
    let current = c.device;
    if (!current) { try { current = localStorage.getItem(DEVICE_KEY); } catch (_) {} }
    if (!DEVICES.some((d) => d.id === current)) current = 'phone';
    setDevice(current);

    /* Which app this is — lets a design-mode palette scope itself per app. */
    if (c.app) document.documentElement.dataset.app = c.app;

    const stage = device.closest('.stage') || device.parentElement;
    stage.insertAdjacentHTML('afterbegin', toolbarMarkup(current, document.documentElement.dataset.mode));
    stage.querySelector('.device-toolbar').addEventListener('click', (e) => {
      const btn = e.target.closest('.device-toolbar__btn');
      if (!btn) return;
      if (btn.dataset.device) setDevice(btn.dataset.device);
      if (btn.dataset.mode) setMode(btn.dataset.mode);
    });

    function setDevice(id) {
      device.dataset.device = id;
      try { localStorage.setItem(DEVICE_KEY, id); } catch (_) {}
      const bar = document.querySelector('.device-toolbar');
      if (!bar) return;
      bar.querySelectorAll('.device-toolbar__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.device === id)));
      bar.querySelector('.device-toolbar__size').textContent = DEVICES.find((d) => d.id === id).size;
    }
  }

  window.AppShell = { mount, setMode, DEVICES, MODES };
})();
