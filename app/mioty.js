/* Mioty — per-app demo logic for the Cloud onboarding flow (see
   ../contexts/MIOTY.md). Markup lives in the pages; this holds the demo state
   and the small behaviours each screen needs. No styling here.

   State survives page hops in localStorage under `mioty:*` (the shell's
   logout/reset clears that prefix). The numbers mirror the FigJam board: a kit
   of 22 devices going into „Workspace #1". */
(function () {
  const KEY = 'mioty:state';
  const DEFAULT = { workspace: 'Workspace #1', devices: 0, method: null };
  const WORKSPACES = ['Workspace #1', 'Vēja iela 23', 'Greenhouse North'];
  const KIT = { code: 'xw45-34df-343s-1234', devices: 22 };
  const CSV = { name: 'Mioty_super-list.csv', devices: 22 };

  const load = () => { try { return Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) { return Object.assign({}, DEFAULT); } };
  const save = (patch) => { const s = Object.assign(load(), patch); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} return s; };
  const $ = (id) => document.getElementById(id);
  const go = (href) => { window.location.href = href; };

  /* Enable the CTA once every field has a value. `fill` = demo autofill on
     first focus, standing in for the phone's password manager. */
  function formGate(formId, btnId, next, fill) {
    const form = $(formId), btn = $(btnId);
    const inputs = Array.from(form.querySelectorAll('input'));
    const sync = () => { btn.disabled = !inputs.every((i) => i.value.trim()); };
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
    form.addEventListener('submit', (e) => { e.preventDefault(); if (!btn.disabled) go(next); });
    btn.addEventListener('click', () => go(next));
    sync();
  }

  /* Choose workspace — the card opens an inline list; the link does the same
     (Figma shows both as ways to change). Trigger reports aria-expanded. */
  function workspacePicker() {
    const s = load(); const name = $('wsName'), btn = $('wsBtn'), list = $('wsList'), link = $('wsChange');
    name.textContent = s.workspace;
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
    input.addEventListener('input', sync);
    $('paste').addEventListener('click', () => { input.value = KIT.code; sync(); input.focus(); });
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
  const SCAN_KEY = 'mioty:scanned';
  const readScanned = () => { try { return JSON.parse(localStorage.getItem(SCAN_KEY) || '[]'); } catch (_) { return []; } };
  const writeScanned = (arr) => { try { localStorage.setItem(SCAN_KEY, JSON.stringify(arr)); } catch (_) {} };
  const codeFrom = (text) => {
    if (!text) return null;
    const direct = text.trim().match(/^MIOTY-\d{4}$/i); if (direct) return direct[0].toUpperCase();
    try { const d = new URL(text, location.href).searchParams.get('d'); if (d && /^MIOTY-\d{4}$/i.test(d)) return d.toUpperCase(); } catch (_) {}
    return null;
  };
  function scanner() {
    let found = readScanned(); let fake = 0;
    const btn = $('go'), undo = $('undo'), status = $('status'), frame = $('frame'), video = $('video');
    const cam = document.querySelector('.cam');
    let chips = document.querySelector('.cam__found');
    if (!chips) { chips = document.createElement('div'); chips.className = 'cam__found'; status.before(chips); }
    const sync = () => {
      const n = found.length;
      btn.disabled = n === 0; undo.disabled = n === 0;
      btn.textContent = n ? `Add (${n}) Mioty device${n === 1 ? '' : 's'}` : 'Add';
      chips.innerHTML = found.slice(-6).map((c) => `<span class="cam__chip">${c}</span>`).join('') + (n > 6 ? `<span class="cam__chip">+${n - 6}</span>` : '');
      writeScanned(found);
    };
    const add = (code) => {
      if (found.includes(code)) { status.textContent = `${code} already scanned.`; return; }
      found.push(code); status.textContent = `${code} read.`; sync();
    };
    /* way 2 — arrived here from the phone's camera app */
    try { const d = codeFrom(location.search.replace(/^\?/, 'scan.html?')); if (d) { add(d); history.replaceState(null, '', 'scan.html'); } } catch (_) {}
    /* way 3 — fake */
    frame.addEventListener('click', () => { fake += 1; add(`MIOTY-${String(9000 + fake).padStart(4, '0')}`); });
    undo.addEventListener('click', () => { found.pop(); sync(); status.textContent = 'Last one removed.'; });
    $('enter').addEventListener('click', () => { const c = codeFrom(prompt('Device code (MIOTY-0001 … 0025)') || ''); if (c) add(c); else status.textContent = 'Not a Mioty code.'; });
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
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
        .then((s) => {
          stream = s; video.srcObject = s; video.hidden = false; cam.classList.add('cam--live');
          return video.play();
        })
        .then(() => { status.textContent = 'Camera on. Hold a device QR in the frame.'; requestAnimationFrame(tick); })
        .catch((err) => {
          cam.classList.remove('cam--live'); video.hidden = true; camBtn.hidden = false;
          status.textContent = (err && err.name === 'NotAllowedError')
            ? 'Camera permission denied — allow it in the browser settings, or tap the frame to fake a scan.'
            : 'Could not start the camera — tap “Turn on camera” to retry, or tap the frame to fake a scan.';
        });
    }
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
    let last = '', lastAt = 0, frameNo = 0;
    function tick() {
      if (!stream) return;
      frameNo += 1;
      if (frameNo % 2 === 0 && video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
        const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hit = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (hit && hit.data) decode(hit.data);
      }
      requestAnimationFrame(tick);
    }
    /* One entry point for whatever the camera read — also what the tests feed. */
    function decode(text) {
      const code = codeFrom(text), now = Date.now();
      if (!code) { status.textContent = 'That QR is not a Mioty device.'; return false; }
      if (code === last && now - lastAt < 1500) return false;     /* same sticker still in view */
      last = code; lastAt = now; add(code);
      if (navigator.vibrate) navigator.vibrate(40);
      return true;
    }
    window.Mioty.decode = decode;
    camBtn.addEventListener('click', startCamera);
    window.addEventListener('pagehide', () => { if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; });
    if (canScan) startCamera();
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

  window.Mioty = { state: load(), user: { email: 'edgars.sparnins@saftehnika.com' }, formGate, workspacePicker, kitCode, scanner, filePicker, connecting, done };
})();
