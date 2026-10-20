// Spending guide content. Community consensus, not official: edit freely.
// Each verdict should be something you'd stand behind when a player asks "is this worth it?".

export type Tier = "best" | "good" | "situational" | "skip";

export interface Deal {
  name: string;
  tier: Tier;
  /** One-line verdict shown under the name. */
  verdict: string;
  /** Why, in a couple of short points. */
  why: string[];
  /** Who it suits, or when to buy it. */
  bestFor?: string;
  /** A page on this site to point to, shown after "Best for". */
  link?: { label: string; href: string };
}

export const TIERS: Record<Tier, { label: string; blurb: string }> = {
  best: { label: "Best value", blurb: "Buy these first if you play most days." },
  good: { label: "Good value", blurb: "Worth it once you've got the best-value ones." },
  situational: { label: "Only if you need it", blurb: "Fine when the contents fix a real bottleneck. Otherwise skip." },
  skip: { label: "Usually skip", blurb: "Poor value for progress." },
};

export const DEALS: Deal[] = [
  {
    name: "Monthly Card",
    tier: "best",
    verdict: "The best value in the shop for anyone who logs in daily.",
    why: [
      "Pays out Dawnium every day for 30 days, far more in total than a currency pack at the same price.",
      "Also boosts AFK gains and EXP while it's active.",
    ],
    bestFor: "Everyone who spends anything. Skip it only if you won't log in most days, because missed days are lost.",
  },
  {
    name: "Month Fund / Growth Fund",
    tier: "best",
    verdict: "Second priority, if you'll keep levelling.",
    why: [
      "Pays out at level milestones, with bigger rewards at higher milestones.",
      "You only get full value if you actually reach those levels.",
    ],
    bestFor: "Players planning to stick with the game for a while.",
  },
  {
    name: "Starter / New Player Pack",
    tier: "best",
    verdict: "Cheap one-time pack with excellent value. Grab it early.",
    why: ["Only offered in your first days.", "Low price for what's inside."],
    bestFor: "New characters.",
  },
  {
    name: "Unlock item packs",
    tier: "best",
    verdict: "Blockade-clearing items are a steal, especially the 99¢ packs.",
    why: [
      "Gateway Keys, Withering Potions, Magic Drills, Water Mines and the like open up new areas, each with its own chests, ore, Rola and other pickups.",
      "Every unlocked area keeps paying back, so a few cents goes a long way.",
    ],
    bestFor: "Anyone with blockades still in their way.",
    link: { label: "See where each blockade is on the World Map", href: "#/map" },
  },
  {
    name: "Weekly Card",
    tier: "good",
    verdict: "A smaller version of the Monthly Card. Good after the Monthly Card and Fund.",
    why: ["Better rate than buying currency directly.", "Lower total value than the Monthly Card."],
  },
  {
    name: "Pop-up packs (relics, skills, materials)",
    tier: "situational",
    verdict: "Only buy the smallest tier, and only when you need what's inside.",
    why: [
      "The advertised value % drops as the price goes up, so the cheapest tier is the most efficient.",
      "Timers are there to rush you. A pack you don't need isn't a deal.",
    ],
    bestFor: "Pushing past a specific wall, like finishing a relic set or hitting a Primostar milestone.",
  },
  {
    name: "Limited event bundles",
    tier: "situational",
    verdict: "Judge each one on its contents, not the 'limited' label.",
    why: ["Often priced at a premium because they're limited.", "Worth it when the event item is something you'd actually use."],
  },
  {
    name: "Currency packs (Vouchers)",
    tier: "skip",
    verdict: "The worst rate for regular spending. Buy cards and funds instead.",
    why: ["The Monthly Card gives far more for the same money.", "Only top up when you need a specific amount for something planned."],
  },
  {
    name: "Random chest / loot box packs",
    tier: "skip",
    verdict: "Poor and unpredictable value.",
    why: ["Results are random, so the expected value is usually worse than a fixed pack."],
  },
  {
    name: "Cosmetic-only packs",
    tier: "skip",
    verdict: "No effect on progress. Buy them only if you love the look.",
    why: ["Zero combat or resource value."],
  },
];

/** Questions to ask about any deal before buying. */
export const CHECKLIST = [
  "What exactly is inside, and do I need it right now?",
  "Does it get me past a real wall or milestone (a relic set, a Primostar goal, a class change)?",
  "Would the same money buy more as a Monthly Card, Fund or Weekly Card?",
  "Am I only buying it because of the timer or the 'value %' badge?",
];

/** Free-to-play and spending tips that apply whatever you buy. */
export const TIPS = [
  "Save Vouchers for the premium (pink) skill banner rather than the standard (blue) one.",
  "VIP points only come from real-money spending, not from Vouchers, so don't hoard Vouchers expecting VIP progress.",
  "Pull in 10s. Multi-pulls get you to pity faster.",
];
