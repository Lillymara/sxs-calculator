/** Accent colors and background schemes. Indigo on Midnight is the default. */
export interface AccentTheme {
  id: string;
  name: string;
  /** Accent pair on light backgrounds (dark enough for white text). */
  light: [string, string];
  /** Accent pair on dark backgrounds. */
  dark: [string, string];
  /** Picker swatch, when it shouldn't follow the background. */
  swatch?: [string, string];
}

export const ACCENTS: AccentTheme[] = [
  { id: "indigo", name: "Indigo", light: ["#5046e5", "#0ea5b7"], dark: ["#8b85ff", "#3dd4e4"] },
  { id: "cobalt", name: "Cobalt", light: ["#1d4ed8", "#3b82f6"], dark: ["#6b9bff", "#93c5fd"] },
  { id: "ocean", name: "Ocean", light: ["#0369a1", "#06b6d4"], dark: ["#38bdf8", "#22d3ee"] },
  { id: "seafoam", name: "Seafoam", light: ["#0d7f73", "#2bb39a"], dark: ["#7ae8cc", "#a5f3e0"] },
  { id: "emerald", name: "Emerald", light: ["#047857", "#65a30d"], dark: ["#34d399", "#a3e635"] },
  { id: "lime", name: "Lime", light: ["#4d7c0f", "#ca8a04"], dark: ["#a3e635", "#facc15"] },
  { id: "gold", name: "Gold", light: ["#a16207", "#d97706"], dark: ["#facc15", "#fcd34d"] },
  { id: "amber", name: "Amber", light: ["#b45309", "#e11d48"], dark: ["#fbbf24", "#fb7185"] },
  { id: "coral", name: "Coral", light: ["#c2410c", "#f43f5e"], dark: ["#ff8a65", "#fda4af"] },
  { id: "crimson", name: "Crimson", light: ["#b91c1c", "#ea580c"], dark: ["#f87171", "#fb923c"] },
  { id: "rose", name: "Rose", light: ["#be185d", "#f97316"], dark: ["#f472b6", "#fb923c"] },
  { id: "fuchsia", name: "Fuchsia", light: ["#a21caf", "#7c3aed"], dark: ["#e879f9", "#c4b5fd"] },
  { id: "violet", name: "Violet", light: ["#7c3aed", "#db2777"], dark: ["#a78bfa", "#f472b6"] },
  { id: "lavender", name: "Lavender", light: ["#6d5bd0", "#a78bfa"], dark: ["#c4b5fd", "#e9d5ff"] },
  { id: "copper", name: "Copper", light: ["#9a4a24", "#c2703d"], dark: ["#e6a072", "#f2c29b"] },
  // Pure black on light backgrounds; on dark ones just off-black, so it still shows.
  { id: "onyx", name: "Onyx", light: ["#000000", "#3f3f46"], dark: ["#404040", "#5a5a5a"], swatch: ["#000000", "#3f3f46"] },
  { id: "slate", name: "Slate", light: ["#475569", "#64748b"], dark: ["#cbd5e1", "#94a3b8"] },
];

export type Tone = "light" | "dark";

export interface BackgroundTheme {
  id: string;
  name: string;
  tone: Tone;
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  line: string;
}

export const BACKGROUNDS: BackgroundTheme[] = [
  { id: "midnight", name: "Midnight", tone: "dark", bg: "#0c0f1c", surface: "#141829", surface2: "#1b2036", text: "#e9ebf5", muted: "#9399b5", line: "#262c45" },
  { id: "charcoal", name: "Charcoal", tone: "dark", bg: "#111214", surface: "#1a1b1f", surface2: "#222328", text: "#ececef", muted: "#9b9ca4", line: "#2c2d33" },
  { id: "black", name: "Pure Black", tone: "dark", bg: "#000000", surface: "#000000", surface2: "#0d0d0d", text: "#ededed", muted: "#8f8f8f", line: "#2a2a2a" },
  { id: "abyss", name: "Abyss", tone: "dark", bg: "#071618", surface: "#0e2226", surface2: "#142b30", text: "#e3f1f1", muted: "#8fb0b2", line: "#1f3a3f" },
  { id: "forest", name: "Forest", tone: "dark", bg: "#0b140f", surface: "#132019", surface2: "#1a2a21", text: "#e6f0e9", muted: "#94ab9b", line: "#24382c" },
  { id: "plum", name: "Plum", tone: "dark", bg: "#150d1c", surface: "#1f1529", surface2: "#281c35", text: "#efe7f5", muted: "#a898b6", line: "#352847" },
  { id: "espresso", name: "Espresso", tone: "dark", bg: "#17110d", surface: "#211915", surface2: "#2b211c", text: "#f2ebe5", muted: "#ad9f94", line: "#3a2e27" },
  { id: "daylight", name: "Daylight", tone: "light", bg: "#f5f6fb", surface: "#ffffff", surface2: "#f0f2f9", text: "#171a2c", muted: "#646b85", line: "#e3e6f0" },
  { id: "mist", name: "Mist", tone: "light", bg: "#eaeff4", surface: "#fbfcfe", surface2: "#e4eaf0", text: "#16202b", muted: "#5d6b7a", line: "#d5dde6" },
  { id: "paper", name: "Paper", tone: "light", bg: "#f4f0e8", surface: "#fffdf8", surface2: "#efe9de", text: "#231f1a", muted: "#6f675c", line: "#e4dccd" },
];

/** "system" follows the device: Daylight when it's in light mode, Midnight in dark mode. */
export const SYSTEM_BACKGROUND = "system";
export const DEFAULT_ACCENT = "indigo";
export const DEFAULT_BACKGROUND = "midnight";

const ACCENT_KEY = "sxs.accent";
const BACKGROUND_KEY = "sxs.background";

function read(key: string, valid: (v: string) => boolean, fallback: string): string {
  try {
    const v = localStorage.getItem(key);
    return v && valid(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the choice lasts for this visit */
  }
}

/**
 * The secret theme. It isn't listed in either picker; the color menu's "Reset to default"
 * button turns it on, and pressing that again (or picking anything else) turns it off.
 */
export const SECRET = "plastique";
const SECRET_ACCENT: AccentTheme = { id: SECRET, name: "Plastique", light: ["#d6249f", "#8b5cf6"], dark: ["#ff6ac1", "#b794ff"] };
const SECRET_BACKGROUND: BackgroundTheme = {
  id: SECRET, name: "Plastique", tone: "light",
  bg: "#fff0fa", surface: "#fffafd", surface2: "#fde9f7", text: "#3b1650", muted: "#8a5a9e", line: "#f6c8ea",
};
const ALL_ACCENTS = [...ACCENTS, SECRET_ACCENT];
const ALL_BACKGROUNDS = [...BACKGROUNDS, SECRET_BACKGROUND];

export const savedAccent = () => read(ACCENT_KEY, (v) => ALL_ACCENTS.some((a) => a.id === v), DEFAULT_ACCENT);
export const savedBackground = () =>
  read(BACKGROUND_KEY, (v) => v === SYSTEM_BACKGROUND || ALL_BACKGROUNDS.some((b) => b.id === v), DEFAULT_BACKGROUND);

const systemDark = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;

export function resolveBackground(id: string): BackgroundTheme {
  if (id === SYSTEM_BACKGROUND) id = systemDark() ? "midnight" : "daylight";
  return ALL_BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

/** Accent pair as it shows on a given background tone. */
export const accentColors = (a: AccentTheme, tone: Tone) => (tone === "dark" ? a.dark : a.light);

/** Writes the current accent and background to the page's CSS variables. */
function paint() {
  const bg = resolveBackground(savedBackground());
  const accent = ALL_ACCENTS.find((a) => a.id === savedAccent()) ?? ACCENTS[0];
  const [a1, a2] = accentColors(accent, bg.tone);
  const root = document.documentElement;
  const dark = bg.tone === "dark";
  const vars: Record<string, string> = {
    "--bg": bg.bg,
    "--surface": bg.surface,
    "--surface-2": bg.surface2,
    "--text": bg.text,
    "--muted": bg.muted,
    "--line": bg.line,
    "--accent": a1,
    "--accent-2": a2,
    "--accent-soft": `color-mix(in srgb, ${a1} ${dark ? 20 : 11}%, ${bg.surface})`,
    "--on-accent": dark && accent.id !== "onyx" ? bg.bg : "#ffffff",
    "--error": dark ? "#ff7d93" : "#c4314b",
    "--shadow": dark
      ? "0 1px 2px rgb(0 0 0 / 0.3), 0 12px 32px -16px rgb(0 0 0 / 0.6)"
      : "0 1px 2px rgb(23 26 44 / 0.04), 0 8px 24px -12px rgb(23 26 44 / 0.12)",
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.style.colorScheme = bg.tone;
  root.dataset.tone = bg.tone;
  root.dataset.accent = accent.id;
  root.dataset.background = bg.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg.bg);
}

export function applyAccent(id: string) {
  write(ACCENT_KEY, id);
  paint();
}

export function applyBackground(id: string) {
  write(BACKGROUND_KEY, id);
  paint();
}

/** "Reset to default": switches the secret theme on, or resets everything if it's already on. */
export function resetOrSecret(): { accent: string; background: string } {
  const next = savedAccent() === SECRET && savedBackground() === SECRET
    ? { accent: DEFAULT_ACCENT, background: DEFAULT_BACKGROUND }
    : { accent: SECRET, background: SECRET };
  write(ACCENT_KEY, next.accent);
  write(BACKGROUND_KEY, next.background);
  paint();
  return next;
}

/** Paints the saved theme and keeps "system" in step with the device. */
export function initTheme() {
  paint();
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if (savedBackground() === SYSTEM_BACKGROUND) paint();
  });
}
