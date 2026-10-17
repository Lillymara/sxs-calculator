// Server calendar data: season starts, progression milestones, fixed global events
// and weekly reward tables extracted from the Global client.

export type EventType = "season" | "feature" | "dungeon" | "weekly" | "global";

export interface CalendarEvent {
  /** Server day, counted the way the extracted client data counts it (see publicServerDay). */
  day: number;
  type: EventType;
  title: string;
  meta?: string;
  major?: boolean;
  tag?: string;
  rewardLabel?: string;
  rewards?: string[];
  note?: string;
  tasks?: string[] | null;
  durationHours?: number;
}

export interface GlobalEvent {
  /** Start and last day (YYYY-MM-DD), both at the 13:00 UTC reset. */
  date: string;
  end: string;
  type: "global";
  title: string;
  meta?: string;
  major?: boolean;
  tag?: string;
  rewardLabel?: string;
  rewards?: string[];
}

/** Daily reset hour in UTC. */
export const RESET_UTC_HOUR = 13;

/**
 * The extracted offsets were authored against an anchor one day earlier than the
 * public opening date, which is now Calendar Day 1. Every later day moves back one.
 */
export const publicServerDay = (day: number) => (day > 1 ? day - 1 : day);

export const CALENDAR_SEASONS: { number: number; start: number; name: string }[] = [
 {number:1,start:1,name:"Witching Hours"},{number:2,start:47,name:"Crossed Paths"},
 {number:3,start:114,name:"Season 3"},{number:4,start:215,name:"Season 4"},
 {number:5,start:316,name:"Season 5"},{number:6,start:417,name:"Season 6"}
].map((season) => ({ ...season, start: publicServerDay(season.start) }));

export const MILESTONES: CalendarEvent[] = [
 {day:1,type:"season",title:"Season 1 · Witching Hours",meta:"Server journey begins"},
 {day:1,type:"feature",title:"Verdantglade",meta:"First region"},
 {day:1,type:"dungeon",title:"Auroradrasil",meta:"Normal · Hard (36K Power)"},
 {day:4,type:"feature",title:"Cinder Ridge & 2nd Job",meta:"Lv44 · Class Lv20 + 1st Job Lv18"},
 {day:4,type:"dungeon",title:"Mecha Summit",meta:"Normal · Hard (180K Power)"},
 {day:12,type:"feature",title:"Aqualis & 3rd Job",meta:"Lv82 · Class Lv48 + 2nd Job Lv16"},
 {day:12,type:"dungeon",title:"Ocean Palace Ruins",meta:"Normal · Hard (580K Power)"},
 {day:24,type:"dungeon",title:"Aquorigin Shrine",meta:"Normal (930K + Lv100) · Hard 1.45M · Nightmare 2.05M"},
 {day:26,type:"feature",title:"Whaleback",meta:"Seasonal map"},
 {day:33,type:"dungeon",title:"Hellhold",meta:"Normal 2.25M · Hard 2.75M · Nightmare 3.9M · Purgatory 6.2M"},
 {day:47,type:"season",title:"Season 2 · Crossed Paths",meta:"Loong Haven progression begins"},
 {day:47,type:"feature",title:"Loong Haven & 4th Job",meta:"Lv106 · Class Lv89 + 3rd Job Lv19"},
 {day:47,type:"feature",title:"Phantasm Manifestation & Dual Shadow Realm",meta:"Lv108 · Lv116"},
 {day:47,type:"dungeon",title:"Demonseal Gorge",meta:"Normal · Hard (2.35M Power)"},
 {day:60,type:"dungeon",title:"Warlord's Rest",meta:"Normal 3.55M + Lv130 · Hard 5M · Nightmare 6M"},
 {day:61,type:"feature",major:true,title:"Acme Nexus",meta:"Loong Haven tower opens"},
 {day:73,type:"dungeon",title:"Cloudcrest Temple",meta:"Normal 6.2M · Hard 7.7M · Nightmare 9.8M"},
 {day:78,type:"feature",major:true,title:"Yin Yang Engine",meta:"Ancient Relic · Loong Haven Phase 2"},
 {day:86,type:"dungeon",title:"Bladeshire",meta:"Normal 10M · Hard 12.5M · Nightmare 15.8M"},
 {day:92,type:"feature",major:true,title:"Pandarial",meta:"New Fantomon becomes available"},
 {day:99,type:"dungeon",title:"Celestship",meta:"Normal 16.5M · Hard 20M · Nightmare 24.5M · Purgatory 40M"},
 {day:114,type:"season",title:"Season 3",meta:"Aethyris progression begins"},
 {day:114,type:"feature",title:"Aethyris & 5th Job",meta:"Lv136 · Class Lv180 + 4th Job Lv40"},
 {day:114,type:"dungeon",title:"Crystal Spiral Tree",meta:"Normal · Hard (9M Power)"},
 {day:127,type:"dungeon",title:"Eternal Garden",meta:"Normal 12.5M + Lv160 · Hard 15M · Nightmare 18M · Purgatory 28.5M"},
 {day:128,type:"feature",title:"Starry Sea Cruise",meta:"Seasonal map"},
 {day:138,type:"feature",major:true,title:"Numinous Paradox",meta:"Skill Chroma event opens · Aethyris Day 25",rewardLabel:"Featured",rewards:["Exclusive Aethyris Skill Chromas"]},
 {day:141,type:"dungeon",title:"Riftwatch Fortress",meta:"Normal 20M · Hard 26M · Nightmare 30M · Purgatory 46M"},
 {day:144,type:"feature",title:"Celestial Covenant",meta:"Ancient Relic · Aethyris phase 2"},
 {day:155,type:"dungeon",title:"Court of Purification",meta:"Normal 32.5M · Hard 43M · Nightmare 50.5M · Purgatory 75M"},
 {day:160,type:"feature",title:"Rainbow Star Spirit",meta:"New Fantomon"},
 {day:163,type:"feature",major:true,title:"Numinous Paradox · Season Shop",meta:"Skill Chroma exchange opens · Aethyris Day 50",rewardLabel:"Exchange",rewards:["4 themed Skill Chromas"]},
 {day:169,type:"dungeon",title:"Temple of Order",meta:"Normal 55M · Hard 65M · Nightmare 82M · Purgatory 115M"},
 {day:174,type:"feature",title:"Azure Radiance Codex",meta:"Ancient Relic · Aethyris phase 3"},
 {day:183,type:"dungeon",title:"Sunspire",meta:"Normal 84.5M · Hard 100M · Nightmare 120M · Purgatory 180M"},
 {day:197,type:"dungeon",title:"Regal Lair",meta:"Normal 125M · Hard 145M · Nightmare 180M · Purgatory 250M"},
 {day:203,type:"dungeon",title:"Regal Lair · Abyss",meta:"350M Power"},
 {day:215,type:"season",title:"Season 4",meta:"Harpadia progression begins"},
 {day:215,type:"feature",title:"Harpadia & 6th Job",meta:"Lv172 · Class Lv280 + 5th Job Lv50"},
 {day:215,type:"feature",title:"Phantasm Bond & Dora",meta:"Lv180 · Lv186"},
 {day:215,type:"dungeon",title:"Clockwork Spire",meta:"Normal · Hard (27M Power)"},
 {day:228,type:"dungeon",title:"Pirate's Plunder",meta:"Normal 35M + Lv190 · Hard 48M · Nightmare 57M · Purgatory 84M"},
 {day:229,type:"feature",title:"Carnival Fantasy",meta:"Seasonal map"},
 {day:242,type:"dungeon",title:"Thalasson Abyss",meta:"Normal 62M · Hard 72M · Nightmare 87M · Purgatory 130M"},
 {day:245,type:"feature",title:"Harpadia Ancient Relic · Phase 2",meta:"Ancient Relic unlock"},
 {day:256,type:"dungeon",title:"Clockwork Fortress",meta:"Normal 91M · Hard 110M · Nightmare 135M · Purgatory 190M"},
 {day:270,type:"dungeon",title:"Observatory",meta:"Normal 145M · Hard 175M · Nightmare 210M · Purgatory 305M"},
 {day:275,type:"feature",title:"Harpadia Ancient Relic · Phase 3",meta:"Ancient Relic unlock"},
 {day:284,type:"dungeon",title:"Titan's Balloon",meta:"Normal 220M · Hard 256M · Nightmare 300M · Purgatory 460M"},
 {day:298,type:"dungeon",title:"Starfall City",meta:"Normal 315M · Hard 385M · Nightmare 435M · Purgatory 630M · Abyss 880M"},
 {day:316,type:"season",title:"Season 5",meta:"Ignis progression begins"},
 {day:316,type:"feature",title:"Ignis & 7th Job",meta:"Lv198 · Class Lv380 + 6th Job Lv55"},
 {day:316,type:"dungeon",title:"Frostprism Spire",meta:"Normal · Hard (82M Power)"},
 {day:329,type:"dungeon",title:"Blackrock Ruins",meta:"Normal 110M + Lv220 · Hard 130M · Nightmare 156M · Purgatory 230M"},
 {day:330,type:"feature",title:"Frost Flame Gate",meta:"Seasonal map"},
 {day:343,type:"dungeon",title:"Everfrost Sanctum",meta:"Normal 166M · Hard 192M · Nightmare 230M · Purgatory 350M"},
 {day:346,type:"feature",title:"Ignis Ancient Relic · Phase 2",meta:"Ancient Relic unlock"},
 {day:357,type:"dungeon",title:"Infernal Throne",meta:"Normal 240M · Hard 280M · Nightmare 340M · Purgatory 500M"},
 {day:371,type:"dungeon",title:"Lunar Palace",meta:"Normal 358M · Hard 415M · Nightmare 500M · Purgatory 750M"},
 {day:376,type:"feature",title:"Ignis Ancient Relic · Phase 3",meta:"Ancient Relic unlock"},
 {day:385,type:"dungeon",title:"Scarlet Wedge",meta:"Normal 514M · Hard 588M · Nightmare 720M · Purgatory 1.08B"},
 {day:399,type:"dungeon",title:"Gate of Genesis",meta:"Normal 680M · Hard 780M · Nightmare 950M · Purgatory 1.36B"},
 {day:417,type:"season",title:"Season 6",meta:"Lv250 Primostar baseline · later activity milestones are not yet confirmed"}
];

export const GLOBAL_EVENTS: GlobalEvent[] = [
 {date:"2026-08-18",end:"2026-08-31",type:"global",title:"Oceanic Festival",meta:"Fixed global event",rewardLabel:"Featured sets",rewards:["Summer Getaway","Summer Chill","Ocean Chase"]},
 {date:"2026-09-01",end:"2026-09-14",type:"global",title:"Starlit Soiree",meta:"Fixed global outfit pack · Debut in the Night",rewardLabel:"Also in the set",rewards:["Darkling Rose weapon"]},
 {date:"2026-09-07",end:"2026-09-23",type:"global",title:"Skill Up or Shut Up",meta:"Global collaboration event · Journey Across the Otherworld with Cabbage Dog",rewardLabel:"Event phase",rewards:["Cabbage Dog collaboration rewards"]},
 {date:"2026-09-07",end:"2026-09-23",type:"global",title:"Spicy Chicken",meta:"Global outfit pack · Cabbage Dog Series II",rewardLabel:"Featured",rewards:["Spicy Chicken outfit"]},
 {date:"2026-09-14",end:"2026-09-23",type:"global",title:"Toy Outfit Set",meta:"Datamined global event phase · starts at reset",rewardLabel:"Also opens",rewards:["Purify Lemon Whale"]},
 {date:"2026-09-25",end:"2026-10-08",type:"global",major:true,title:"Thunderous Crusade",meta:"Limited-time event · client schedule",rewardLabel:"Event features",rewards:["Divine Devotions sign-in","Thunderous Adventure","Thunderous Vault","Conquest Echoes","Arcane Wheel","Golden Age Visage set"]},
 {date:"2026-10-02",end:"2026-10-08",type:"global",major:true,title:"Apotheosis Crucible",meta:"Thunderous Crusade challenge phase",rewardLabel:"Also opens",rewards:["Thunderous Tribute event packs"]},
 {date:"2026-10-10",end:"2026-10-23",type:"global",major:true,title:"Wonder Flavors",meta:"Limited-time event · client schedule",rewardLabel:"Event features",rewards:["Sign-In Bonus","Flavor Shop","Event Quests","Wonder Recipe"]},
 {date:"2026-10-10",end:"2026-10-23",type:"global",title:"Stellar Plume",meta:"Limited-time Visage Gacha",rewardLabel:"Prize pool",rewards:["Exclusive Stellar Plume Visages"]},
 {date:"2026-11-15",end:"2026-11-28",type:"global",tag:"Outfit Pack",title:"Clockwork Vitalis",meta:"Limited-time Visage pack",rewardLabel:"Also in the set",rewards:["Chrono Gearworks weapon Visages"]},
 {date:"2026-11-23",end:"2026-12-06",type:"global",tag:"Outfit Pack",title:"Blacksail Waltz",meta:"Limited-time Visage pack · Through the Waves",rewardLabel:"Also in the set",rewards:["Oceanic Treasure weapon Visages"]},
 {date:"2026-12-01",end:"2026-12-11",type:"global",major:true,title:"That Time I Got Reincarnated as an Adventurer!",meta:"Collaboration event · client schedule",rewardLabel:"Event features",rewards:["Chancellor's Gift","Tempest Trading Post","Story stages","Arcane Wheel","Lost Memories","Rimuru","Milim","Shuna","Benimaru"]},
 {date:"2026-12-01",end:"2026-12-14",type:"global",tag:"Outfit Pack",title:"Halloween Charmer",meta:"Limited-time Visage pack",rewardLabel:"Also in the set",rewards:["Little Devil weapon Visages"]},
 {date:"2026-12-07",end:"2026-12-11",type:"global",major:true,title:"Slime Collaboration · Phase 2",meta:"Second collaboration phase",rewardLabel:"Also opens",rewards:["Special Mission","Monster Conquest","The Oni Princess's Tailor"]},
 {date:"2026-12-07",end:"2026-12-20",type:"global",tag:"Outfit Pack",title:"Chic Chores",meta:"Limited-time Visage pack · Chic Chores Service",rewardLabel:"Also in the set",rewards:["Noble Ritual weapon Visages"]},
 {date:"2026-12-12",end:"2026-12-25",type:"global",tag:"Outfit Pack",title:"Academy Fantasia",meta:"Limited-time Visage pack",rewardLabel:"Also in the set",rewards:["Magic Stationery weapon Visages"]},
 {date:"2026-12-21",end:"2027-01-03",type:"global",tag:"Outfit Pack",title:"Asuran Wraith",meta:"Limited-time Visage pack · Form of the Demi-Yokai",rewardLabel:"Also in the set",rewards:["Inari's Dance weapon Visages"]}
];

const FENNEC_REWARDS = ["Star Pact ×6", "Destiny Fruit ×18", "Dawnium ×600", "Fresh Essential Oil ×30", "Magic Wool ×30", "Farm Egg ×30"];
const SCRATCH_REWARDS = ["Destiny Fruit ≈47", "Dawnium ≈2.82K", "Commission Scroll ≈15", "Legendary Goddess Card ≈17", "Bond Rope ≈5"];

function shortNumber(value: number): string {
  return value >= 1000 ? `${Number((value / 1000).toFixed(value % 1000 ? 2 : 0))}K` : String(value);
}

function bingoRewards(n: number): string[] {
  const tier =
    n === 1 ? [1660, 1200, 670] : n === 2 ? [1930, 1390, 770] : n <= 11 ? [2950, 2120, 1180] : n <= 17 ? [11250, 8100, 4500] : [20000, 14400, 8000];
  return [
    "Destiny Fruit ×3",
    "Star Pact ×1",
    "Dawnium ×100",
    "Bond Rope ×5",
    "Legendary Goddess Card ×2",
    `Essence ×${shortNumber(tier[0])}`,
    `Rare Sand ×${shortNumber(tier[1])}`,
    `Wood ×${shortNumber(tier[2])}`,
  ];
}

/** The rotating weekly events: Grand Treasure Hunt plus Bingo / Scratch / Fennec's Riddle. */
export function weeklyEvents(maxDay = 520): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const special1 = ["Lucky Idol", "Lucky Idol / Golden Divine Tree", "Lucky Idol / Golden Divine Tree / Endless Hourglass"];
  const special2 = ["Primal Gem", "Primal Gem / Philosopher's Stone", "Primal Gem / Philosopher's Stone / Treasure Detector"];
  const tiers = [0, 0, 1, 2, 2];
  const seconds = ["Bingo Draw", "Lucky Scratch", "Fennec's Riddle"];
  for (let r = 0, day = 8; day <= maxDay; r++, day += 7) {
    const region = day >= 316 ? 4 : day >= 215 ? 3 : day >= 114 ? 2 : day >= 47 ? 1 : 0;
    const tier = tiers[region];
    const phase = r % 4;
    const reward =
      phase === 0
        ? "Miracle Relic Box (choice)"
        : phase === 1
          ? special1[tier]
          : phase === 2
            ? `${region + 3}${region === 0 ? "rd" : "th"} Job Skill Fragment (choice)`
            : special2[tier];
    out.push({ day, type: "weekly", title: `Grand Treasure Hunt #${r + 1}`, meta: "Weekly featured reward", rewardLabel: "Featured reward", rewards: [reward], durationHours: 167 });
    if (r >= 1) {
      const index = (r - 1) % 3;
      const count = Math.floor((r - 1) / 3) + 1;
      const confirmed = count <= 23;
      out.push({
        day,
        type: "weekly",
        title: `${seconds[index]} #${count}`,
        meta: "Weekly rotation",
        rewardLabel: !confirmed ? "Reward data pending" : index === 0 ? "Two-board total" : index === 1 ? "Expected from free task cards" : "18-stage total",
        rewards: !confirmed ? ["Later occurrence rewards not confirmed"] : index === 0 ? bingoRewards(count) : index === 1 ? SCRATCH_REWARDS : FENNEC_REWARDS,
        note: !confirmed
          ? "The client currently has reward tables through occurrence #23."
          : index === 1
            ? "Randomized rewards; expected values use the configured card pools and prize weights."
            : index === 0
              ? "Totals assume both boards and all grid/line rewards are completed."
              : "Guaranteed totals from all 18 puzzle stages.",
        tasks: !confirmed
          ? null
          : index === 0
            ? ["Spend 60 stamina daily", "3 Arena daily", "1 Fantomon bond daily", "20 Destiny explores ×30"]
            : index === 1
              ? ["Spend 60 stamina daily", "3 Arena daily", "2 gacha daily", "5 daily dungeons", "40 Realm explores ×10"]
              : null,
        durationHours: 167,
      });
    }
  }
  return out;
}
