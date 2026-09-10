/* App — shared translation layer (EN / LV).
   Loaded BEFORE components.js on every prototype page.
   Ported from tools.saftehnika.com's i18n — same API, own dictionary.

   Two ways to translate, on purpose:

   1. `I18n.t('key')` — for chrome shared across screens (nav, buttons, menus).
      Strings live in the DICT below.
   2. `I18n.pick({ en: '…', lv: '…' })` — for screen-specific copy that is better
      kept next to the thing it describes. Plain strings pass straight through,
      so a value that needs no translation can stay a string.

   Switching language reloads the page: every screen renders its text from JS at
   mount time, so a reload is both simpler and more reliable than teaching each
   screen to re-render in place.

   The DICT starts with the shell + hub keys only — the ones components.js and
   index.html actually ask for. Each app adds its own keys under an `<app>.`
   prefix as its screens are built. */
(function () {
  const KEY = 'uiLang';
  const LANGS = [{ code: 'en', label: 'English' }, { code: 'lv', label: 'Latviešu' }];

  const DICT = {
    /* ── hub (prototypes/index.html) ── */
    'hub.nav.home':        { en: 'Home',  lv: 'Sākums' },
    'hub.nav.group':       { en: 'Apps',  lv: 'Aplikācijas' },

    /* ── shell: user menu, theme, rail (js/components.js) ── */
    'user.preferences':    { en: 'User preferences',     lv: 'Lietotāja iestatījumi' },
    'user.language':       { en: 'Language',             lv: 'Valoda' },
    'user.zoom':           { en: 'Zoom',                 lv: 'Mērogs' },
    'user.logout':         { en: 'Log out',              lv: 'Iziet' },
    'user.profileTip':     { en: 'User',                 lv: 'Lietotājs' },
    'theme.toDark':        { en: 'Switch to dark mode',  lv: 'Pārslēgt uz tumšo režīmu' },
    'theme.toLight':       { en: 'Switch to light mode', lv: 'Pārslēgt uz gaišo režīmu' },
    'rail.expand':         { en: 'Expand menu',          lv: 'Izvērst izvēlni' },
    'rail.collapse':       { en: 'Collapse menu',        lv: 'Sakļaut izvēlni' },

    /* ── unsaved-changes counter (I18n.count) ── */
    'save.none':           { en: 'No unsaved changes',   lv: 'Nav nesaglabātu izmaiņu' },
    'save.one':            { en: '1 unsaved change',     lv: '1 nesaglabāta izmaiņa' },
    'save.many':           { en: '{n} unsaved changes',  lv: '{n} nesaglabātas izmaiņas' },
  };

  const lang = (() => {
    try { const v = localStorage.getItem(KEY); return LANGS.some((l) => l.code === v) ? v : 'en'; }
    catch (_) { return 'en'; }
  })();

  /* Resolve a bilingual value. Plain strings pass through untouched. */
  function pick(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return v[lang] != null ? v[lang] : (v.en != null ? v.en : '');
  }

  /* Look up a shared key; `vars` fills {placeholders}. Unknown keys return the
     key itself, which makes a missing translation obvious rather than silent. */
  function t(key, vars) {
    const entry = DICT[key];
    let out = entry ? pick(entry) : key;
    if (vars) Object.keys(vars).forEach((k) => { out = out.split('{' + k + '}').join(vars[k]); });
    return out;
  }

  /* Plural helper for the unsaved-changes counter. */
  function count(n) {
    if (n === 0) return t('save.none');
    if (n === 1) return t('save.one');
    return t('save.many', { n });
  }

  function set(code) {
    if (!LANGS.some((l) => l.code === code) || code === lang) return;
    try { localStorage.setItem(KEY, code); } catch (_) {}
    window.location.reload();
  }

  window.I18n = { lang, langs: LANGS, t, pick, count, set };
  document.documentElement.setAttribute('lang', lang);
})();
