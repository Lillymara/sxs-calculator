# SxS Level Timer

An unofficial web app for **Sword x Staff** that estimates how long a character needs to reach the next level, plus an optional goal level.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests for the XP math
npm run build    # production build into dist/
```

## Data

The XP-per-level tables in `src/data/exp_required.json` come from the community
[Ethna Timeline](https://qenu.github.io/ethna-timeline/) dataset. Run `npm run update-data` to refresh them.

## Deploying

Every push to `main` runs tests, builds the app, and publishes it to GitHub Pages (`.github/workflows/deploy.yml`).
