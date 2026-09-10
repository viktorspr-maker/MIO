/**
 * Shared icon registry — use in HTML with:
 *   <i data-icon="name"></i>
 *   <i data-icon="name" width="20" height="20"></i>
 *
 * Add new icons here as SVG strings.
 */
window.ICONS = {
  /* ── Auth & form ── */
  'shield':   `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"/></svg>`,
  'login':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`,
  'log-out':  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  'eye':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  'eye-off':  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  'spinner':  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,

  /* ── Navigation (outline) ── */
  'home':            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  'package':         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  'user':            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  'panel-left':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>`,

  /* ── Navigation (filled — active state) ── */
  'home-filled':     `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.47 2.34a.75.75 0 0 1 1.06 0L21 10.09V21a1 1 0 0 1-1 1h-5v-6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v6H4a1 1 0 0 1-1-1V10.09z"/></svg>`,
  'package-filled':  `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.04 2.5 7.28A1 1 0 0 0 2 8.14V16a1 1 0 0 0 .53.88L11 21.46V11.62L2.97 7.28 12 4.2l9.03 3.08L13 11.62v9.84l8.47-4.58A1 1 0 0 0 22 16V8.14a1 1 0 0 0-.5-.86L12 2.04z"/><path d="M8.5 6.05 17 10.28v-1L12 6.5l-3.5-.45z" opacity=".4"/></svg>`,
};

// Auto-inline: replaces <i data-icon="..."> with the SVG
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('i[data-icon]').forEach(el => {
    const name = el.dataset.icon;
    if (window.ICONS[name]) {
      const tmp = document.createElement('div');
      tmp.innerHTML = window.ICONS[name];
      const svg = tmp.firstElementChild;
      Array.from(el.attributes).forEach(attr => {
        if (attr.name !== 'data-icon') svg.setAttribute(attr.name, attr.value);
      });
      el.replaceWith(svg);
    }
  });
});

// Helper for dynamic icon injection
window.icon = (name, attrs = {}) => {
  if (!window.ICONS[name]) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = window.ICONS[name];
  const svg = tmp.firstElementChild;
  Object.entries(attrs).forEach(([k, v]) => svg.setAttribute(k, v));
  return svg.outerHTML;
};
