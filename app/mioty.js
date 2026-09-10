/* Mioty — per-app demo logic for the Cloud onboarding flow (see
   ../contexts/MIOTY.md). Markup lives in the pages; this holds the demo state
   and the small behaviours each screen needs. No styling here.

   State survives page hops in localStorage under `mioty:*` (the shell's
   logout/reset clears that prefix). The numbers mirror the FigJam board: a kit
   of 22 devices going into „Workspace #1". */
(function () {
  const KEY = 'mioty:state';
  const DEFAULT = { workspace: 'Workspace #1', devices: 0, method: null, loggedIn: false, email: '' };
  const WORKSPACES = ['Workspace #1', 'Vēja iela 23', 'Greenhouse North'];
  const KIT = { code: 'xw45-34df-343s-1234', devices: 22 };
  const CSV = { name: 'Mioty_super-list.csv', devices: 22 };

  const load = () => { try { return Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) { return Object.assign({}, DEFAULT); } };
  const save = (patch) => { const s = Object.assign(load(), patch); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} return s; };
  const $ = (id) => document.getElementById(id);
  const go = (href) => { window.location.href = href; };

  /* Enable the CTA once every field has a value. `fill` = demo autofill on
     first focus, standing in for the phone's password manager. */
  function formGate(formId, btnId, next, fill, signIn) {
    const form = $(formId), btn = $(btnId);
    const inputs = Array.from(form.querySelectorAll('input'));
    const sync = () => { btn.disabled = !inputs.every((i) => i.value.trim()); };
    /* Signing in is remembered: the next run still starts on Hello Mioty, but
       „Start" skips „Who are you?" and the login form and lands on Choose
       workspace (user, 2026-09-10: „vienreiz ielogojoties vairs otroreizi
       logoties neprasa"). Sign out lives on the workspace screen. */
    const pass = () => {
      if (signIn) { const e = inputs.find((i) => i.name === 'email'); save({ loggedIn: true, email: (e && e.value.trim()) || '' }); }
      go(next);
    };
    inputs.forEach((i) => {
      i.addEventListener('input', sync);
      if (fill) {
        /* First touch of any field fills them all — the phone's password
           manager, stood in for. pointerdown as well as focus: a focus event
           does not fire while the document itself is unfocused. */
        const autofill = () => {
          if (inputs.some((x) => x.value)) return;
          inputs.forEach((x) => { if (fill[x.name] != null) x.value = fill[x.name]; });
          sync();
        };
        i.addEventListener('focus', autofill, { once: true });
        i.addEventListener('pointerdown', autofill, { once: true });
      }
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); if (!btn.disabled) pass(); });
    btn.addEventListener('click', pass);
    sync();
  }

  /* Where „Start" leads: straight to the workspace once signed in. */
  function startHref() { return load().loggedIn ? 'workspace.html' : 'who.html'; }
  /* On the sign-in screens: already signed in → nothing to ask, go on. */
  function gate() { if (load().loggedIn) { window.location.replace('workspace.html'); return true; } return false; }
  function signOut() { save({ loggedIn: false, email: '' }); go('who.html'); }

  /* Choose workspace — the card opens an inline list; the link does the same
     (Figma shows both as ways to change). Trigger reports aria-expanded. */
  function workspacePicker() {
    const s = load(); const name = $('wsName'), btn = $('wsBtn'), list = $('wsList'), link = $('wsChange');
    name.textContent = s.workspace;
    /* Who is signed in, and the way out of it — the only place to sign out. */
    const who = $('signedIn');
    if (who) {
      who.innerHTML = `Signed in as <strong>${(s.email || window.Mioty.user.email).replace(/</g, '&lt;')}</strong> · <a href="#" id="signOut">Not you? Sign out</a>`;
      who.querySelector('#signOut').addEventListener('click', (e) => { e.preventDefault(); signOut(); });
    }
    const render = () => {
      list.innerHTML = WORKSPACES.map((w) => `<button class="opt" type="button" role="option" aria-checked="${w === load().workspace}" data-ws="${w}"><span class="opt__text"><span class="opt__value">${w}</span></span></button>`).join('');
    };
    const toggle = (open) => { list.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open) render(); };
    btn.addEventListener('click', () => toggle(list.hidden));
    link.addEventListener('click', (e) => { e.preventDefault(); toggle(list.hidden); });
    list.addEventListener('click', (e) => {
      const o = e.target.closest('[data-ws]'); if (!o) return;
      save({ workspace: o.dataset.ws }); name.textContent = o.dataset.ws; toggle(false);
    });
  }

  /* I have a KIT — the code resolves to a device count; the summary shows what
     „Add" will do before it does it. The paste button drops the demo code in. */
  function kitCode() {
    const input = $('code'), btn = $('go'), sum = $('summary');
    /* Kit QR on the sheet opens kit.html?code=… — the code arrives filled in. */
    try { const q = new URLSearchParams(location.search).get('code'); if (q) input.value = q; } catch (_) {}
    const sync = () => {
      const ok = input.value.replace(/\s/g, '').length >= 12;
      btn.disabled = !ok; sum.hidden = !ok;
      if (ok) sum.textContent = `You will add ${KIT.devices} Mioty devices to workspace: ${load().workspace}`;
    };
    /* Ghost: the expected code sits grey behind the caret; typed characters
       cover it one by one (user, 2026-09-10: „lai viņam rādās jau simboli
       ghosted"). Dashes are inserted for the user at positions 4, 9, 14. */
    const ghost = $('ghost');
    const paintGhost = () => {
      if (!ghost) return;
      const typed = input.value;
      ghost.innerHTML = `<i>${typed.replace(/</g, '&lt;')}</i>${KIT.code.slice(typed.length)}`;
    };
    input.addEventListener('input', () => {
      let v = input.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
      input.value = v.replace(/(.{4})(?=.)/g, '$1-');
      paintGhost(); sync();
    });
    $('paste').addEventListener('click', () => { input.value = KIT.code; paintGhost(); sync(); input.focus(); });
    paintGhost();
    btn.addEventListener('click', () => { save({ devices: KIT.devices, method: 'kit' }); go('connecting.html'); });
    sync();
  }

  /* Scan QR — three ways to read a device, same result:
       1. the phone camera INSIDE the app (getUserMedia + jsQR, needs HTTPS);
       2. the phone's own camera app → a device QR on the sheet is a URL
          scan.html?d=MIOTY-0007, so it lands here with the code in the query;
       3. a tap on the frame fakes one (desktop, or no camera).
     Codes are kept in localStorage so way 2, which reloads the page per scan,
     still counts up. The CTA counts like Figma: „Add (22) Mioty devices". */
  /* The scanned list survives page loads ONLY for the phone-camera route, where
     every sticker opens scan.html?d=… afresh. Opened plainly from the app it
     starts empty, ✕ clears it, Add clears it, and it expires after 10 minutes —
     otherwise codes from an abandoned attempt showed up „by default"
     (user, 2026-09-10: „kāpēc jau noklusējumā ir mioty-0010 un 0009?"). */
  const SCAN_KEY = 'mioty:scanned', SCAN_TTL = 10 * 60 * 1000;
  const readScanned = () => {
    try {
      const v = JSON.parse(localStorage.getItem(SCAN_KEY) || 'null');
      if (!v || !Array.isArray(v.codes) || Date.now() - (v.at || 0) > SCAN_TTL) return [];
      return v.codes;
    } catch (_) { return []; }
  };
  const writeScanned = (arr) => { try { localStorage.setItem(SCAN_KEY, JSON.stringify({ codes: arr, at: Date.now() })); } catch (_) {} };
  /* What a scanned QR (or a typed string) means. Accepts every form a device
     code has ever been printed in — bare `MIOTY-0007`, the long
     `…/app/scan.html?d=MIOTY-0007`, the short `…/s/?7` — so stickers from an
     older sheet keep working. */
  const codeFrom = (text) => {
    if (!text) return null;
    const bare = String(text).match(/MIOTY-(\d{1,4})\b/i);
    if (bare) return 'MIOTY-' + bare[1].padStart(4, '0');
    try {
      const u = new URL(String(text).trim(), location.href);
      const d = u.searchParams.get('d'); if (d && /^MIOTY-\d{1,4}$/i.test(d)) return d.toUpperCase();
      const n = /\/s\/?$/.test(u.pathname) ? parseInt(u.search.replace(/^\?/, ''), 10) : NaN;
      if (n >= 1 && n <= 9999) return 'MIOTY-' + String(n).padStart(4, '0');
    } catch (_) {}
    return null;
  };
  /* Plain-language reason when a QR is real but not a device sticker. */
  const whatIsIt = (text) => {
    const t = String(text || '');
    if (/\/kit\.html\?code=/i.test(t)) return 'That is the kit code — use “I have a KIT” instead.';
    if (/\.csv(\?|$)/i.test(t)) return 'That is the .csv link — use “Upload .csv file” instead.';
    if (/^https?:\/\/[^/]+\/[^?#]*\/?$/i.test(t) && !/\/app\//i.test(t)) return 'That is the start-page code — scan a device sticker (page 2 of the sheet).';
    return 'Not a device code: ' + (t.length > 40 ? t.slice(0, 40) + '…' : t);
  };
  function scanner() {
    /* Arrived with a code (phone-camera route) → continue the list; opened
       plainly (from „Add Mioty device/-s") → a clean start. */
    const arrivedWithCode = /[?&]d=/.test(location.search);
    let found = arrivedWithCode ? readScanned() : []; let fake = 0;
    writeScanned(found);
    const btn = $('go'), undo = $('undo'), status = $('status'), frame = $('frame'), video = $('video');
    const cam = document.querySelector('.cam');
    let chips = document.querySelector('.cam__found');
    if (!chips) { chips = document.createElement('div'); chips.className = 'cam__found'; status.before(chips); }
    const SHOW = 8;
    const sync = () => {
      const n = found.length;
      btn.disabled = n === 0; undo.disabled = n === 0;
      btn.textContent = n ? `Add (${n}) Mioty device${n === 1 ? '' : 's'}` : 'Add';
      chips.innerHTML = (n > SHOW ? `<span class="cam__chip cam__chip--more">+${n - SHOW}</span>` : '')
        + found.slice(-SHOW).map((c) => `<span class="cam__chip" data-code="${c}">${c}</span>`).join('');
      writeScanned(found);
    };
    /* Already scanned: say so, and make THAT chip blink (user, 2026-09-10:
       „varētu iemirgoties jau noskenētais kods"). If the chip has scrolled out
       of the last eight, a temporary one blinks in its place. */
    const flashChip = (code) => {
      let chip = chips.querySelector(`[data-code="${code}"]`);
      let temp = false;
      if (!chip) { chip = document.createElement('span'); chip.className = 'cam__chip'; chip.textContent = code; chips.appendChild(chip); temp = true; }
      chip.classList.remove('cam__chip--flash'); void chip.offsetWidth;   /* restart the animation */
      chip.classList.add('cam__chip--flash');
      setTimeout(() => { chip.classList.remove('cam__chip--flash'); if (temp) chip.remove(); }, 1800);
    };
    /* Big, unmistakable feedback in the frame itself — colour, flash, pill,
       haptics — so the user never has to read the status line to know what
       just happened. */
    const ICONS = {
      ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
      dup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
      bad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    };
    const toast = $('toast');
    let feedbackTimer = null;
    const feedback = (kind, text) => {
      frame.dataset.state = kind;
      if (toast) {
        toast.className = 'cam__toast cam__toast--' + kind; toast.innerHTML = ICONS[kind] + '<span></span>';
        toast.lastChild.textContent = text; toast.hidden = false;
      }
      if (navigator.vibrate) navigator.vibrate(kind === 'ok' ? 60 : kind === 'dup' ? [40, 80, 40] : [120]);
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(() => { delete frame.dataset.state; if (toast) toast.hidden = true; }, kind === 'ok' ? 1000 : 1500);
    };
    const bump = () => { btn.classList.remove('btn--bump'); void btn.offsetWidth; btn.classList.add('btn--bump'); };
    const add = (code) => {
      if (found.includes(code)) {
        status.textContent = `${code} already scanned.`; flashChip(code);
        feedback('dup', `Already scanned · ${code}`);
        return;
      }
      found.push(code); status.textContent = `${code} read.`; sync(); bump();
      feedback('ok', code);
    };
    /* way 2 — arrived here from the phone's camera app */
    try { const d = codeFrom(location.search.replace(/^\?/, 'scan.html?')); if (d) { add(d); history.replaceState(null, '', 'scan.html'); } } catch (_) {}
    /* way 3 — fake */
    frame.addEventListener('click', () => { fake += 1; add(`MIOTY-${String(9000 + fake).padStart(4, '0')}`); });
    undo.addEventListener('click', () => { found.pop(); sync(); status.textContent = 'Last one removed.'; });
    const close = document.querySelector('.cam__close');
    if (close) close.addEventListener('click', () => writeScanned([]));    /* leaving without Add forgets the list */
    $('enter').addEventListener('click', () => { const t = prompt('Device code (MIOTY-0001 … 0025, or just the number)') || ''; const c = codeFrom(/^\d{1,4}$/.test(t.trim()) ? 'MIOTY-' + t.trim() : t); if (c) add(c); else if (t) status.textContent = whatIsIt(t); });
    btn.addEventListener('click', () => { save({ devices: found.length, method: 'scan' }); writeScanned([]); go('connecting.html'); });
    sync();
    /* way 1 — the phone camera inside the app. Only where it can work:
       HTTPS (or localhost) and getUserMedia present. Frames are decoded by jsQR
       from a downscaled canvas (≤480px) every other frame — full-size 1080p
       frames stall mid-range phones. iOS quirks covered: playsinline+muted+
       autoplay on the <video>, play() called after the stream attaches, and a
       „Turn on camera" button as a user-gesture fallback if autoplay or the
       permission prompt fails. */
    let stream = null;
    const camBtn = document.createElement('button');
    camBtn.type = 'button'; camBtn.className = 'btn btn--outline btn--block'; camBtn.textContent = 'Turn on camera'; camBtn.hidden = true;
    status.before(camBtn);
    const canScan = window.jsQR && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && video
      && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname));
    function startCamera() {
      camBtn.hidden = true; status.textContent = 'Starting camera…';
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
        .then((s) => {
          stream = s; video.srcObject = s; video.hidden = false; cam.classList.add('cam--live');
          setupTrack(s.getVideoTracks()[0]);
          return video.play();
        })
        .then(() => { status.textContent = detector ? 'Camera on. Hold a device QR in the frame.' : 'Camera on. Hold a device QR in the frame, close enough to fill it.'; requestAnimationFrame(tick); })
        .catch((err) => {
          cam.classList.remove('cam--live'); video.hidden = true;
          const denied = err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError');
          if (denied) {
            /* „Don't allow" → a scanner is pointless; back to the method choice
               with a note (user, 2026-09-10: „ja dont allow … jāmet uz
               izvēlieties QR ko?"). */
            status.textContent = 'Camera not allowed — going back to the other ways to add devices.';
            feedback('bad', 'Camera not allowed');
            setTimeout(() => go('add.html?camera=denied'), 1300);
            return;
          }
          camBtn.hidden = false;
          status.textContent = 'Could not start the camera — tap “Turn on camera” to retry, or tap the frame to fake a scan.';
        });
    }
    /* Reading the frames. Two engines:
         · BarcodeDetector — the platform's own reader (Android Chrome). Fast and
           tolerant; it gets the whole video element.
         · jsQR — everywhere else (iOS Safari has no BarcodeDetector). It gets
           the CENTRE SQUARE of the frame at native resolution — roughly what the
           on-screen frame shows. Downscaling the whole 1280px frame to 480px
           (the first version) left a 28mm sticker at ~2px per module, which
           jsQR cannot read. The crop keeps ~5px per module and is cheaper too. */
    let detector = null;
    try { if ('BarcodeDetector' in window) detector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (_) { detector = null; }
    /* Camera track extras — only where the browser reports them (Android
       Chrome, iOS 17+): continuous autofocus, and optical/digital zoom via a
       1×/2×/3× button and a two-finger pinch on the frame. */
    let zoomBtn = null;
    function setupTrack(track) {
      if (!track || !track.getCapabilities) return;
      let caps = {}; try { caps = track.getCapabilities() || {}; } catch (_) {}
      if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
      if (!caps.zoom || !(caps.zoom.max > caps.zoom.min)) return;
      const zmin = Math.max(1, caps.zoom.min), zmax = Math.min(caps.zoom.max, 5);
      let z = zmin;
      const apply = (v) => { z = Math.min(zmax, Math.max(zmin, v)); track.applyConstraints({ advanced: [{ zoom: z }] }).catch(() => {}); if (zoomBtn) zoomBtn.textContent = (Math.round(z * 10) / 10) + '×'; };
      zoomBtn = document.createElement('button'); zoomBtn.type = 'button'; zoomBtn.className = 'cam__zoom'; zoomBtn.setAttribute('aria-label', 'Camera zoom'); zoomBtn.dataset.tooltip = 'Camera zoom';
      cam.appendChild(zoomBtn); apply(zmin);
      zoomBtn.addEventListener('click', () => apply(z + 1 > zmax ? zmin : Math.floor(z) + 1));
      let pinch = null;
      frame.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), z }; }, { passive: true });
      frame.addEventListener('touchmove', (e) => { if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); apply(pinch.z * d / pinch.d); } }, { passive: true });
      frame.addEventListener('touchend', () => { pinch = null; }, { passive: true });
    }
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
    let last = '', lastAt = 0, lastKind = '', busy = false, frameNo = 0;
    /* The region of the video that the on-screen frame shows. The <video> is
       object-fit: cover, so first work out which part of the native frame is
       visible, then take the frame's share of it. Decoding only that region at
       native resolution gives the most pixels per module for the least work. */
    /* The part of the native video frame that the on-screen frame shows (the
       <video> is object-fit: cover), plus a little slack. Used both to crop
       what jsQR sees and to reject codes that are merely nearby. */
    function region(pad) {
      const vw = video.videoWidth, vh = video.videoHeight;
      const ew = video.clientWidth || 1, eh = video.clientHeight || 1;
      const scale = Math.max(ew / vw, eh / vh);                 /* css px per native px */
      const visW = ew / scale, visH = eh / scale;
      const fr = frame.getBoundingClientRect(), er = video.getBoundingClientRect();
      const fx = (fr.left - er.left) / scale + (vw - visW) / 2, fy = (fr.top - er.top) / scale + (vh - visH) / 2;
      const fw = fr.width / scale, fh = fr.height / scale, p = fw * (pad || 0);
      const sx = Math.max(0, fx - p), sy = Math.max(0, fy - p);
      return { sx, sy, sw: Math.min(vw - sx, fw + 2 * p), sh: Math.min(vh - sy, fh + 2 * p) };
    }
    function grabFrame() {
      const r = region(0.35);                                            /* slack: a code held a bit too close still fits */
      const out = Math.min(Math.round(Math.max(r.sw, r.sh)), 640);
      canvas.width = Math.round(out * r.sw / Math.max(r.sw, r.sh)); canvas.height = Math.round(out * r.sh / Math.max(r.sw, r.sh));
      ctx.drawImage(video, r.sx, r.sy, r.sw, r.sh, 0, 0, canvas.width, canvas.height);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    /* Fallback on alternate frames: the whole visible picture, downscaled —
       finds a code that is smaller or a little off-centre (user, 2026-09-10:
       „jūtīgāku pret zoom"). A hit still has to sit near the frame. */
    function grabVisible() {
      const vw = video.videoWidth, vh = video.videoHeight, ew = video.clientWidth || 1, eh = video.clientHeight || 1;
      const scale = Math.max(ew / vw, eh / vh), visW = ew / scale, visH = eh / scale;
      const sx = (vw - visW) / 2, sy = (vh - visH) / 2;
      const out = 640 / Math.max(visW, visH);
      canvas.width = Math.round(visW * out); canvas.height = Math.round(visH * out);
      ctx.drawImage(video, sx, sy, visW, visH, 0, 0, canvas.width, canvas.height);
      return { img: ctx.getImageData(0, 0, canvas.width, canvas.height), toNative: (x, y) => ({ x: sx + x / out, y: sy + y / out }) };
    }
    function nearFrame(loc, toNative) {
      if (!loc) return true;
      const pts = [loc.topLeftCorner, loc.topRightCorner, loc.bottomLeftCorner, loc.bottomRightCorner].map((q) => toNative(q.x, q.y));
      const cx = pts.reduce((a, q) => a + q.x, 0) / 4, cy = pts.reduce((a, q) => a + q.y, 0) / 4;
      const r = region(0.4);
      return cx > r.sx && cx < r.sx + r.sw && cy > r.sy && cy < r.sy + r.sh;
    }
    /* Only the code the user is aiming at: its centre in the middle 70% of the
       crop and its size at least 30% of it. Neighbouring stickers at the edge of
       the picture are ignored instead of being „read by accident". */
    function aimed(loc, w, h) {
      if (!loc) return true;
      const pts = [loc.topLeftCorner, loc.topRightCorner, loc.bottomLeftCorner, loc.bottomRightCorner];
      const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      return cx > w * 0.15 && cx < w * 0.85 && cy > h * 0.15 && cy < h * 0.85 && size >= Math.min(w, h) * 0.18;
    }
    function aimedBox(box) {
      const r = region(0), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
      return cx > r.sx + r.sw * 0.1 && cx < r.sx + r.sw * 0.9 && cy > r.sy + r.sh * 0.1 && cy < r.sy + r.sh * 0.9
        && Math.max(box.width, box.height) >= Math.min(r.sw, r.sh) * 0.3;
    }
    function tick() {
      if (!stream) return;
      if (!busy && video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
        if (detector) {
          busy = true;
          detector.detect(video).then((codes) => { codes.forEach((c) => { if (!c.boundingBox || aimedBox(c.boundingBox)) decode(c.rawValue); }); })
            .catch(() => { detector = null; })          /* engine broke — fall back to jsQR */
            .finally(() => { busy = false; });
        } else {
          frameNo += 1;
          const img = grabFrame();
          const hit = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (hit && hit.data && aimed(hit.location, img.width, img.height)) decode(hit.data);
          else if (frameNo % 2 === 0) {                                   /* every other frame: the whole view */
            const g = grabVisible();
            const h2 = window.jsQR(g.img.data, g.img.width, g.img.height, { inversionAttempts: 'dontInvert' });
            if (h2 && h2.data && nearFrame(h2.location, g.toNative)) decode(h2.data);
          }
        }
      }
      if (detector) setTimeout(() => requestAnimationFrame(tick), 100); else requestAnimationFrame(tick);
    }
    /* One entry point for whatever the camera read — also what the tests feed. */
    function decode(text) {
      const code = codeFrom(text), now = Date.now();
      if (!code) { status.textContent = whatIsIt(text); feedback('bad', 'Not a device code'); return false; }
      /* Quiet window for the SAME sticker: as long as the green ✓ is showing
         (1 s) after a read; 2.5 s between repeats of „already scanned" while it
         is held. The window is not refreshed by seeing the code again, so the
         duplicate note follows the read as soon as the ✓ fades, and a code you
         come back to after another one is flagged at once
         (user, 2026-09-10: „lai parādās ātrāk"). */
      const quiet = lastKind === 'dup' ? 2500 : 1000;
      if (code === last && now - lastAt < quiet) return false;
      last = code; lastAt = now; lastKind = found.includes(code) ? 'dup' : 'ok';
      add(code);
      return true;
    }
    window.Mioty.decode = decode;
    /* The frame is as big as the screen allows — but never so big that the Add
       button falls below the fold (short phones with the browser bars showing,
       the desktop preview frame). Footer height changes (chips appear, the
       „Turn on camera" button comes and goes) re-fit it. */
    const foot = document.querySelector('.cam__foot');
    const fit = () => {
      const room = cam.clientHeight - (foot ? foot.offsetHeight : 0) - 64;   /* 64 = the view's vertical padding */
      frame.style.width = Math.max(160, Math.min(288, room)) + 'px';
    };
    fit();
    window.addEventListener('resize', fit);
    if (window.ResizeObserver && foot) new ResizeObserver(fit).observe(foot);
    camBtn.addEventListener('click', startCamera);
    window.addEventListener('pagehide', () => { if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; });
    if (canScan && !/[?&]nocam/.test(location.search)) startCamera();   /* ?nocam=1: desktop checks without the camera */
    else if (video) status.textContent = (location.protocol === 'https:' || location.hostname === 'localhost')
      ? 'No in-app scanner here — tap the frame to fake a scan.'
      : 'Camera needs HTTPS — open the GitHub Pages link on the phone.';
  }

  /* Upload .csv — a stand-in for the OS picker: one list, one right answer. */
  function filePicker() {
    const list = $('files'), btn = $('go');
    const rows = [
      { name: '1440x2560_riga_3_temp…da_v01.zip', meta: '22/05/24 · 1,5 MB', kind: 'zip' },
      { name: '1440x2560_riga_3_temp…da_v01.zip', meta: '22/05/24 · 1,5 MB', kind: 'zip' },
      { name: CSV.name, meta: '22/05/24 · 3 KB', kind: 'csv' },
      { name: '1440x2560_riga_3_temp…da_v02.zip', meta: '23/05/24 · 1,5 MB', kind: 'zip' },
      { name: 'scan_299403_02.pdf', meta: '21/05/24 · 0,4 MB', kind: 'pdf' },
    ];
    const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    list.innerHTML = rows.map((r, i) => `<button class="file" type="button" role="option" aria-checked="false" data-i="${i}" data-kind="${r.kind}">
      <span class="file__ico file__ico--${r.kind}">${r.kind}</span>
      <span class="file__text"><span class="file__name">${r.name}</span><span class="file__meta">${r.meta}</span></span>
      <span class="file__check">${check}</span></button>`).join('');
    list.addEventListener('click', (e) => {
      const f = e.target.closest('.file'); if (!f) return;
      const on = f.getAttribute('aria-checked') !== 'true';
      list.querySelectorAll('.file').forEach((x) => x.setAttribute('aria-checked', 'false'));
      f.setAttribute('aria-checked', String(on));
      btn.disabled = !(on && f.dataset.kind === 'csv');
    });
    let devices = CSV.devices;
    btn.addEventListener('click', () => { save({ devices, method: 'csv' }); go('connecting.html'); });
    /* A real file from the phone — the QR sheet links to mioty-devices.csv, the
       phone saves it, the user picks it here. Rows (minus header) = devices. */
    const pick = $('pick'), file = $('file'), picked = $('picked');
    if (pick && file) {
      pick.addEventListener('click', () => file.click());
      file.addEventListener('change', () => {
        const f = file.files && file.files[0]; if (!f) return;
        f.text().then((txt) => {
          const rows = txt.split(/\r?\n/).filter((l) => l.trim());
          devices = Math.max(0, rows.length - 1);
          list.querySelectorAll('.file').forEach((x) => x.setAttribute('aria-checked', 'false'));
          picked.hidden = false; picked.textContent = `${f.name}: ${devices} devices`;
          btn.disabled = devices === 0;
        });
      });
    }
  }

  function connecting(next) {
    const s = load(); $('n').textContent = s.devices || KIT.devices; $('ws').textContent = s.workspace;
    setTimeout(() => go(next), 2600);
  }
  function done() {
    const s = load(); $('n').textContent = s.devices || KIT.devices; $('ws').textContent = s.workspace;
  }

  window.Mioty = { state: load(), user: { email: 'edgars.sparnins@saftehnika.com' }, formGate, workspacePicker, kitCode, scanner, filePicker, connecting, done, startHref, gate, signOut };
})();
