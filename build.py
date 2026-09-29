#!/usr/bin/env python3
"""Build the single self-contained HTML: inline scripts and embed subset EB Garamond as base64 WOFF2."""
import base64, io, pathlib, re, hashlib
from fontTools import subset
from fontTools.ttLib import TTFont

P = pathlib.Path(__file__).resolve().parent
SRC, DIST = P / 'src', P / 'dist'
FONT_DIR = pathlib.Path('/usr/share/fonts/truetype/ebgaramond')  # Debian fonts-ebgaramond; change to wherever EB Garamond 12 TTFs live
TEXT = ''.join(chr(c) for c in range(32, 127)) + '×−–—‘’“”…é·¼'
FACES = [('EBGaramond12-Regular.ttf', 'normal', 400), ('EBGaramond12-Italic.ttf', 'italic', 400), ('EBGaramond12-Bold.ttf', 'normal', 600)]


def woff2(path):
    f = TTFont(str(path))
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['kern', 'liga', 'lnum']; opts.name_IDs = ['*']
    s = subset.Subsetter(opts); s.populate(text=TEXT); s.subset(f)
    buf = io.BytesIO(); f.flavor = 'woff2'; f.save(buf); return buf.getvalue()


def build():
    html = (SRC / 'index.html').read_text()
    faces = []
    for name, style, weight in FACES:
        b64 = base64.b64encode(woff2(FONT_DIR / name)).decode()
        faces.append(f'@font-face{{font-family:"EB Garamond";font-style:{style};font-weight:{weight};font-display:block;src:url(data:font/woff2;base64,{b64}) format("woff2")}}')
    html = html.replace('/*FONTFACE*/', '\n'.join(faces))
    def inline(m):
        js = (SRC / m.group(1)).read_text()
        assert '</script' not in js
        return '<script>\n' + js + '\n</script>'
    html = re.sub(r'<script src="([a-z]+\.js)"></script>', inline, html)
    assert 'src="' not in html.split('<body>')[1], 'external reference left'
    DIST.mkdir(exist_ok=True)
    out = DIST / 'The-Last-Ten-Minutes.html'
    out.write_text(html)
    print(out, len(html.encode()), hashlib.sha256(html.encode()).hexdigest())


if __name__ == '__main__':
    build()
