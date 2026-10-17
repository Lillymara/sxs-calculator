# Sword x Staff Tools

An unofficial web app for **Sword x Staff**: https://lillymara.github.io/sxs-calculator/

- **Level Timer**: time to your next level (and a rough goal-level plan) from your current EXP and the XP/hr shown on your bed.
- **Season Planner**: season-end level projection with daily reset boosts and the bed EXP save, Primostar score and goal,
  gear/skill/Fantomon/relic upgrade costs, and a material plan covering cart, shop, overworld stamina, dungeon Ore and Material Realms.
- **Server Calendar**: find your server (720-server roster) to see its current day and season, when the season ends,
  Nexus merges, dungeon releases, unlocks, weekly events and global events. The planner uses your server's season end.
- **Class Change / Fantomons**: see what your skills can reroll into when you change class; browse every Fantomon's
  stats and abilities.
- **Companions / World Map**: companion bonuses by friendship level, and an interactive map of Lucky Wheels,
  unlockable areas and their loot.

## Credits

- Overworld stamina, big-node, Dawnium and treat figures come from
  [Avalon's Loong Haven calculator](https://primostar2.vercel.app/) (Blessed Divider).
- Early-level EXP (below each season's scoring floor) comes from the [Ethna Timeline](https://qenu.github.io/ethna-timeline/) dataset.

Fantomon, companion and skill art in `public/art/` is © Sword x Staff, used under the game's free-use terms.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests for the EXP and planner math
npm run build    # production build into dist/
```

Game data lives in `src/data/`. The planner math lives in `src/lib/planner/` and is pure TypeScript with tests.

## Deploying

Every push to `main` runs tests, builds the app, and publishes it to GitHub Pages (`.github/workflows/deploy.yml`).
