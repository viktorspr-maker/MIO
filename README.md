# Mioty onboarding test

A phone-first wireframe of the three ways to get a Mioty Gateway and its devices into Aranet
Cloud, walkable on a real phone with printed QR codes. Static HTML — no build, no backend.

- `index.html` — start page: the three scenarios (Latvian), each with a Start button. Every run
  ends on "Successfully connected" with a button back here.
- `qr-sheet.html` — printable A4: ONE entry QR (the start page, https://viktorspr-maker.github.io/MIO/)
  and 25 device QRs for scenario 2. Codes are drawn in the browser; the site URL field at the top
  overrides the address they point at.
- `app/` — the screens (source of truth: `shadcn/projects/App/prototypes/mioty/` in the design
  system repo; this is a self-contained copy with flat paths).
- `vendor/jsqr.js` — in-app QR reader (jsQR 1.4.0, MIT); `vendor/qrcode.js` — QR encoder for the
  sheet (qrcode-generator 1.4.4, MIT). Device QRs are also plain URLs, so the phone's own camera app
  reads them too; on a laptop the scanner is faked by tapping the frame.
- `manifest.webmanifest` + icons — "Add to Home Screen" opens it full-screen, no browser bar.

Hosting: GitHub Pages from `main`. The in-app camera needs HTTPS, which Pages provides.
