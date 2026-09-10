# Mioty onboarding test

A phone-first wireframe of the three ways to get a Mioty Gateway and its devices into Aranet
Cloud, walkable on a real phone with printed QR codes. Static HTML — no build, no backend.

- `index.html` — start page: the three scenarios, each with a Start button. Every run ends on
  "Successfully connected" with a button back here.
- `qr-sheet.html` — printable A4: gateway QR, kit QR, 25 device QRs, .csv QR.
  Generate the codes for your site URL first:
  `pip3 install --user segno && python3 tools/make-qr.py https://<user>.github.io/mioty-qr-test`
- `app/` — the screens (source of truth is `shadcn/projects/App/prototypes/mioty/` in the design
  system repo; this is a self-contained copy with flat paths).
- `vendor/jsqr.js` — in-app QR reader (jsQR, MIT). Without it the scanner falls back to the phone
  camera app (device QRs are URLs) or a tap-to-fake scan.

Hosting: GitHub Pages from `main`. The camera needs HTTPS, which Pages provides.
