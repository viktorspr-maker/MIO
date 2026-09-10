#!/usr/bin/env python3
"""Offline alternative to the browser-drawn QR sheet: writes the same codes to qr/*.svg.

    pip3 install --user segno
    python3 tools/make-qr.py https://<user>.github.io/mioty-qr-test

  gateway → app/index.html             kit    → app/kit.html?code=…
  device  → app/scan.html?d=MIOTY-0001  csv    → mioty-devices.csv
"""
import sys, pathlib
try:
    import segno
except ImportError:
    sys.exit('segno missing — pip3 install --user segno')
base = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8790').rstrip('/')
out = pathlib.Path(__file__).resolve().parent.parent / 'qr'; out.mkdir(exist_ok=True)
KIT = 'xw45-34df-343s-1234'
def make(name, text):
    segno.make(text, error='m').save(out / f'{name}.svg', scale=6, border=1, dark='#09090b', light=None)
    print(f'{name:10} -> {text}')
make('gateway', f'{base}/app/index.html')
make('kit', f'{base}/app/kit.html?code={KIT}')
make('csv', f'{base}/mioty-devices.csv')
for i in range(1, 26):
    make(f'device-{i:02d}', f'{base}/app/scan.html?d=MIOTY-{i:04d}')
