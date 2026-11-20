#!/usr/bin/env python3
"""Assemble BotFactory into one self-contained index.html (works on school networks that block CDNs).
   python3 build.py   ->  index.html (served by GitHub Pages)"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = lambda n: open(os.path.join(HERE, 'src', n), encoding='utf8').read()
ORDER = ['data.js', 'icons.js', 'sim.js', 'crew.js', 'engine.js', 'sponsors.js', 'world.js', 'cine.js', 'outside.js', 'audio.js', 'games.js', 'twin.js', 'mill.js', 'flow.js', 'menu.js', 'crewui.js', 'pitch.js', 'shell.js', 'main.js']
assets = json.load(open(os.path.join(HERE, 'vendor', 'fyp_assets.json')))
assets = {k: assets[k] for k in ('hero', 'crowd', 'logo', 'clips', 'joints', 'coinGold') if k in assets}
game = ''.join('/* ---- %s ---- */\n%s\n' % (n, src(n)) for n in ORDER)
libs = open(os.path.join(HERE, 'vendor', 'three.bundle.js'), encoding='utf8').read().replace('</script>', '<\\/script>')
html = (src('template.html')
        .replace('/*FONT*/', open(os.path.join(HERE, 'vendor', 'fredoka.css')).read().split('</style>')[0] + '\n' + open(os.path.join(HERE, 'vendor', 'barlow.css')).read())
        .replace('/*LIBS*/', libs)
        .replace('/*ASSETS*/', 'window.MB_ASSETS=' + json.dumps(assets, separators=(',', ':')))
        .replace('/*GAME*/', game.replace('</script>', '<\\/script>')))
open(os.path.join(HERE, 'index.html'), 'w', encoding='utf8').write(html)
print('built index.html', round(len(html) / 1e6, 2), 'MB')
