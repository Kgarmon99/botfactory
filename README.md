# BotFactory · A MoneyBot Original

Factory tycoon: grow a garage into a Mega Plant. Built on the BotBank engine.

- **Run the line:** Laser Cutter → Welding Cell → Assembly → Paint Booth → QA Scanner → Shipping
- **Upgrade every station:** Manual → Power Tools → Robot Cell (each tier looks different in 3D)
- **Get hands-on:** laser-cut, weld, assemble, paint, inspect, repair and program robots (mini-games)
- **Expand:** Garage Shop → Workshop → Factory → Big Factory → Mega Plant
- **Learn (secretly):** bottlenecks, fixed vs variable costs, economies of scale, quality vs speed, maintenance, automation, contracts and deadlines, real manufacturing careers (Meet the Makers)

## Build
`python3 build.py` writes one self-contained `index.html` (no CDNs, works on school Chromebooks). GitHub Pages serves it.

`src/`: `data.js` tuning · `sim.js` simulation (no graphics) · `engine.js` renderer, rigs, player, camera · `world.js` the 3D plant · `games.js` mini-games · `main.js` UI + glue · `sponsors.js` partner slots + careers · `template.html` page + CSS

## Sponsors
Edit `SPONSORS` in `src/sponsors.js`. Preview links: `?slots` (show every open slot), `?sponsor=Company%20Name&color=%23C8102E`.
Quality: `?q=1` Chromebook mode, `?q=0` very low.
