// Dawnium guide content: the site owner's recommendations plus the Realm refresh prices from the client. Edit freely.

export interface Use {
  title: string;
  /** Short cost line, e.g. "60–300 per refresh". */
  cost: string;
  advice: string;
  points: string[];
  /** A page on this site to point to. */
  link?: { label: string; href: string };
}

/** Where Dawnium does the most good, best first. */
export const PRIORITIES: Use[] = [
  {
    title: "Daily Dungeon refreshes",
    cost: "2 extra runs a day",
    advice: "One of the best purchases in the game. Buy 2 extra runs every day.",
    points: [
      "Unused runs bank up to 6.",
      "Don't spend them the day before a new dungeon opens. Bank them so you can run the new dungeon 6 times on day one.",
    ],
  },
  {
    title: "Material Realm refreshes",
    cost: "60 each for the first two",
    advice: "Free to play: 2 / 2 / 2 / 2. Spenders: 4 / 2 / 4 / 4. Whales will happily go much higher.",
    points: [
      "Each refresh gives 5 more entries. The first two cost 60 Dawnium, just 12 per entry.",
      "Prices climb fast after that, up to 300 for the 10th (60 per entry). Use the calculator below to see your daily cost.",
    ],
    link: { label: "See which materials you're short on in the Season Planner", href: "#/planner" },
  },
  {
    title: "Guild donations & 24-hour tool upgrade",
    cost: "70 for the 2nd and 3rd",
    advice: "Everyone should consider this one. Donate 3 times a day: the first is free, the next two cost 70 Dawnium in total.",
    points: [
      "Also keep the 150 Dawnium 24-hour tool upgrade running at your guild's gathering spots.",
      "Together they return a great haul of guild tokens for the guild shop. The discounted sheep, chickens and plants are the top buys.",
    ],
  },
  {
    title: "Shop refreshes",
    cost: "Rola, climbing to 20k by the 4th",
    advice: "Refresh 2 or 3 times a day and buy everything with limited stock, usually the top 9 items.",
    points: [
      "The 4th refresh's 20k price starts to feel steep until Season 2 or beyond.",
      "Stick to your own Rola budget (see the Rola tips below).",
    ],
  },
  {
    title: "Arena tickets",
    cost: "Buy around the weekly reset",
    advice: "Want to jump the leaderboard? Stockpile, then go all in on Monday.",
    points: [
      "Save your attempts later in the week, buy 4 before Monday's reset and 4 more after it.",
      "That gives you roughly 20–28 runs when the ladder resets, enough to jump to a decent placing right away.",
    ],
  },
];

/** Realm refresh presets for the calculator, per Realm. */
export const REALM_PRESETS: { label: string; plan: Record<"ore" | "rola" | "essence" | "sand", number> }[] = [
  { label: "Free to play", plan: { ore: 2, rola: 2, essence: 2, sand: 2 } },
  { label: "Spender", plan: { ore: 4, rola: 2, essence: 4, sand: 4 } },
  { label: "Whale", plan: { ore: 10, rola: 10, essence: 10, sand: 10 } },
];

/** Rola budgeting tips. */
export const ROLA_TIPS = [
  "Keep a surplus of 200k–500k Rola. That covers most power spikes that need Rola.",
  "Always check what your next rank will cost. Expert 2, for example, costs 110k at level 80.",
];

/** Things to avoid spending Dawnium on. */
export const AVOID = [
  "Cosmetics, at least until your build is settled.",
  "Convenience items that only save a little time.",
  "Anything you're buying just because it's there. A reserve lets you jump on a new dungeon or a good deal.",
];
