import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType } from "react";
import { CharacterForm, type Character } from "./components/CharacterForm";
import { Results } from "./components/Results";
import { planSeason } from "./lib/planner/plan";
import { usePersistentState } from "./lib/storage";
import { calculate, getSeason, parseAmount as num } from "./lib/xp";
import { seasonStatus } from "./lib/calendar";
import { RESET_UTC_HOUR } from "./data/calendar";
import { DEFAULT_SERVER, effectiveDay1, localResetTime, type ServerChoice } from "./pages/calendar/server";
import { DEFAULT_PLANNER, toPlannerInput, type PlannerForm, type TimeDefaults } from "./pages/planner/form";
import { PlannerPage } from "./pages/planner/PlannerPage";
import { ColorChooser } from "./components/ColorChooser";
import type { ToolProps } from "./pages/tools/props";

// The calendar carries the 720-server roster, so it loads only when opened.
const CalendarPage = lazy(() => import("./pages/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const ConversionPage = lazy(() => import("./pages/tools/ConversionPage").then((m) => ({ default: m.ConversionPage })));
const FantomonsPage = lazy(() => import("./pages/tools/FantomonsPage").then((m) => ({ default: m.FantomonsPage })));
const CompanionsPage = lazy(() => import("./pages/tools/CompanionsPage").then((m) => ({ default: m.CompanionsPage })));
const SpendingPage = lazy(() => import("./pages/tools/SpendingPage").then((m) => ({ default: m.SpendingPage })));
const DawniumPage = lazy(() => import("./pages/tools/DawniumPage").then((m) => ({ default: m.DawniumPage })));
const WorldMapPage = lazy(() => import("./pages/tools/WorldMapPage").then((m) => ({ default: m.WorldMapPage })));

/** Self-contained reference tools, each loaded only when opened. */
const SIMPLE_PAGES = {
  conversion: ConversionPage,
  fantomons: FantomonsPage,
  companions: CompanionsPage,
  map: WorldMapPage,
  spending: SpendingPage,
  dawnium: DawniumPage,
};

const DEFAULT_CHARACTER: Character = {
  name: "",
  season: "1",
  level: "",
  progressMode: "xp",
  currentXp: "",
  percent: "",
  rate: "",
  goalLevel: "",
};

type Page = "timer" | "planner" | "calendar" | keyof typeof SIMPLE_PAGES;
type Group = "Plan" | "Info";
const PAGES: { id: Page; group: Group; label: string; title: string; lede: string; wide?: boolean }[] = [
  { id: "timer", group: "Plan", label: "Level Timer", title: "Level Timer", lede: "Enter your character and XP rate to see when you'll reach your next level." },
  { id: "planner", group: "Plan", label: "Season Planner", title: "Season Planner", lede: "Plan your season's Primostars, upgrades and materials, from now until the season ends.", wide: true },
  { id: "calendar", group: "Plan", label: "Server Calendar", title: "Server Calendar", lede: "Your server's day, season dates, dungeon releases, weekly events and their rewards." },
  { id: "conversion", group: "Plan", label: "Class Change", title: "Skills Conversion", lede: "See what each of your skills can turn into when you change class.", wide: true },
  { id: "fantomons", group: "Info", label: "Fantomons", title: "Fantomons", lede: "Every Fantomon's stats, baby and adult forms, and abilities at any grade and level.", wide: true },
  { id: "companions", group: "Info", label: "Companions", title: "Companions", lede: "Companion stat bonuses by friendship level, favorite gifts, unlocks and the classes they suit.", wide: true },
  { id: "map", group: "Info", label: "World Map", title: "World Map", lede: "Lucky Wheels, unlockable areas and their loot, region by region.", wide: true },
  { id: "spending", group: "Info", label: "Spending Guide", title: "Spending Guide", lede: "If you do spend: which deals give you the most, and which to skip.", wide: true },
  { id: "dawnium", group: "Info", label: "Dawnium Guide", title: "Dawnium Guide", lede: "Where your Dawnium (and Rola) does the most good, and what to skip.", wide: true },
];

const pageFromHash = (): Page => {
  const id = window.location.hash.replace(/^#\//, "").replace(/\?.*$/, "");
  return PAGES.some((p) => p.id === id) ? (id as Page) : "timer";
};

export default function App() {
  const [character, setCharacter] = usePersistentState<Character>("sxs.character", DEFAULT_CHARACTER);
  const [planner, setPlanner] = usePersistentState<PlannerForm>("sxs.planner", DEFAULT_PLANNER);
  const [serverChoice, setServerChoice] = usePersistentState<ServerChoice>("sxs.server", DEFAULT_SERVER);
  const [page, setPage] = useState<Page>(pageFromHash);
  const [now, setNow] = useState(() => new Date());

  // Keep ETAs current while the page is left open.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const table = getSeason(Number(character.season));
  const level = num(character.level);
  const required = table && table.expToNext[level - table.minLevel];

  // A blank progress field means "just levelled"; anything else must parse.
  const orZero = (value: string) => (value.trim() === "" ? 0 : num(value));
  const currentXp =
    character.progressMode === "percent"
      ? required !== undefined
        ? (required * orZero(character.percent)) / 100
        : NaN
      : orZero(character.currentXp);

  // Boosts: the daily bed boost and Temporal Crystals are each 2 hours of EXP.
  const crystals = Math.max(0, Math.floor(num(character.crystals ?? "") || 0));
  const bedHours = character.bedBoost ? 2 : 0;
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), RESET_UTC_HOUR));
  if (nextReset <= now) nextReset.setUTCDate(nextReset.getUTCDate() + 1);
  const boosts =
    bedHours || crystals
      ? { nowHours: bedHours + crystals * 2, dailyHours: bedHours, hoursUntilReset: (nextReset.getTime() - now.getTime()) / 3_600_000 }
      : undefined;

  const goal = num(character.goalLevel);
  const ready = table && character.level !== "" && character.rate !== "";
  const outcome = ready
    ? calculate({
        table,
        level,
        currentXp,
        xpPerHour: num(character.rate),
        boosts,
        goalLevel: Number.isInteger(goal) ? goal : undefined,
      })
    : undefined;

  const day1 = effectiveDay1(serverChoice);
  const server = day1 ? { ...seasonStatus(day1, now), name: serverChoice.name } : null;
  const seasonEndTime = server?.seasonEnds?.getTime();
  const timeDefaults: TimeDefaults = useMemo(
    () => ({ seasonEnd: seasonEndTime !== undefined ? new Date(seasonEndTime) : null, resetTime: localResetTime() }),
    [seasonEndTime],
  );

  const plan = useMemo(() => {
    if (page !== "planner" || !Number.isFinite(currentXp)) return null;
    const input = toPlannerInput(character, currentXp, planner, timeDefaults, now);
    return input ? planSeason(input) : null;
  }, [page, character, currentXp, planner, timeDefaults, now]);

  const current = PAGES.find((p) => p.id === page)!;

  useEffect(() => {
    document.title = `${current.title} · Sword x Staff`;
    // On narrow screens the nav scrolls sideways; keep the current tab visible.
    const nav = document.querySelector(".tabs");
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && active && nav.scrollWidth > nav.clientWidth) {
      const offset = active.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
      nav.scrollTo({ left: offset - nav.clientWidth / 2 + active.offsetWidth / 2, behavior: "smooth" });
    }
  }, [current.title]);

  return (
    <div className={`shell ${current.wide ? "wide" : ""}`}>
      <div className="topbar">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden>⚔</span>
          <span>
            SxS Tools
            <small>Sword x Staff companion</small>
          </span>
        </a>
        <nav className="tabs" aria-label="Tools">
          {(["Plan", "Info"] as Group[]).map((g) => (
            <div key={g} className="tab-group">
              <span className="tab-group-label">{g}</span>
              {PAGES.filter((p) => p.group === g).map((p) => (
                <a key={p.id} href={p.id === "timer" ? "#/" : `#/${p.id}`} aria-current={p.id === page ? "page" : undefined}>
                  {p.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="top-actions">
          <ColorChooser />
        </div>
      </div>

      <header className="masthead">
        <p className="eyebrow">{current.group}</p>
        <h1>{current.title}</h1>
        <p className="lede">{current.lede}</p>
      </header>

      {page in SIMPLE_PAGES ? (
        <main>
          <Suspense fallback={<p className="hint">Loading…</p>}>
            {(() => {
              const Tool = SIMPLE_PAGES[page as keyof typeof SIMPLE_PAGES] as ComponentType<ToolProps>;
              return <Tool choice={serverChoice} onServerChange={setServerChoice} now={now} />;
            })()}
          </Suspense>
        </main>
      ) : page === "calendar" ? (
        <main>
          <Suspense fallback={<p className="hint">Loading calendar…</p>}>
            <CalendarPage choice={serverChoice} onChange={setServerChoice} now={now} />
          </Suspense>
        </main>
      ) : page === "timer" ? (
        <main className="layout">
          <CharacterForm
            character={character}
            onChange={setCharacter}
            onReset={() => setCharacter({ ...DEFAULT_CHARACTER, season: character.season })}
            table={table}
          />
          <Results character={character} outcome={outcome} now={now} />
        </main>
      ) : (
        <main>
          <PlannerPage
            character={character}
            onCharacterChange={setCharacter}
            form={planner}
            onChange={setPlanner}
            result={plan}
            now={now}
            defaults={timeDefaults}
            server={server && { name: server.name, season: server.season.number, seasonEnds: server.seasonEnds }}
          />
          <p className="reset-row">
            <button type="button" className="link-button" onClick={() => setPlanner(DEFAULT_PLANNER)}>
              Clear planner
            </button>
          </p>
        </main>
      )}

      <footer className="footer">
        <p>
          Unofficial fan tool, not affiliated with Boltray. Your inputs are
          saved only in this browser.
        </p>
      </footer>
    </div>
  );
}
