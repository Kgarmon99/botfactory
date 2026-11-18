#!/usr/bin/env python3
"""Build BotFactory.
  index.html         -> references vendor/three/*.js and moneybot-assets.js (for Vercel / GitHub Pages)
  dist/artifact.html -> one self-contained page with every script and style inlined
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
JS_ORDER = ['data.js', 'world.js', 'sim.js', 'game.js']
VENDOR = ['vendor/three/three.min.js', 'vendor/three/GLTFLoader.js', 'vendor/three/SkeletonUtils.js', 'moneybot-assets.js']

def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()

def safe(js):
    # a literal </script> inside inlined code would end the tag early
    return js.replace('</script', '<\\/script')

def main():
    tpl = read('src/index.tpl.html')
    css = read('src/style.css')
    js = '\n'.join('/* ---- %s ---- */\n%s' % (f, read('src/' + f)) for f in JS_ORDER)

    page = tpl.replace('/*CSS*/', css).replace('/*JS*/', safe(js))
    with open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page)

    inline = page
    for v in VENDOR:
        tag = '<script src="%s"></script>' % v
        assert tag in inline, tag
        inline = inline.replace(tag, lambda_tag(read(v)))
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    with open(os.path.join(ROOT, 'dist', 'artifact.html'), 'w', encoding='utf-8') as f:
        f.write(inline)
    print('index.html          %8.1f KB' % (len(page.encode()) / 1024))
    print('dist/artifact.html  %8.1f KB' % (len(inline.encode()) / 1024))

def lambda_tag(code):
    return '<script>' + safe(code) + '</script>'

if __name__ == '__main__':
    main()
