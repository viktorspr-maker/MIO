#!/usr/bin/env python3
"""Generate the QR codes for qr-sheet.html.

    python3 tools/make-qr.py https://<user>.github.io/mioty-qr-test

Writes qr/gateway.svg, qr/kit.svg, qr/csv.svg and qr/device-01…25.svg. Every
code is a URL into the app, so the phone's own camera app can read it too:
  gateway → app/index.html            (the code on the gateway's screen)
  kit     → app/kit.html?code=…       (the code on the kit box)
  device  → app/scan.html?d=MIOTY-0001 (one sticker per device)
  csv     → mioty-devices.csv         (the prepared device list)
Needs `segno` (pure Python): pip3 install --user segno
"""
import sys, pathlib
try:
    import segno
except ImportError:
    sys.exit('segno missing — pip3 install --user segno')

base = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8790').rstrip('/')
out = pathlib.Path(__file__).resolve().parent.parent / 'qr'
out.mkdir(exist_ok=True)
KIT = 'xw45-34df-343s-1234'

def make(name, text):
    segno.make(text, error='m').save(out / f'{name}.svg', scale=6, border=1, dark='#09090b', light=None)
    print(f'{name:10} → {text}')

make('gateway', f'{base}/app/index.html')
make('kit', f'{base}/app/kit.html?code={KIT}')
make('csv', f'{base}/mioty-devices.csv')
for i in range(1, 26):
    make(f'device-{i:02d}', f'{base}/app/scan.html?d=MIOTY-{i:04d}')
