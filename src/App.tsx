import { useEffect, useState } from "react";
import { CharacterForm, type Character } from "./components/CharacterForm";
import { Results } from "./components/Results";
import { usePersistentState } from "./lib/storage";
import { calculate, getSeason, seasons, toXpPerHour } from "./lib/xp";

const DEFAULT_CHARACTER: Character = {
  name: "",
  season: String(seasons.at(-1)!.season),
  level: "",
  progressMode: "xp",
  currentXp: "",
  percent: "",
  rate: "",
  rateUnit: "hour",
  goalLevel: "",
};

/** Parses a user-typed number, allowing thousands separators like "1,234,567". */
function num(value: string): number {
  return value.trim() === "" ? NaN : Number(value.replace(/[,\s_]/g, ""));
}

export default function App() {
  const [character, setCharacter] = usePersistentState<Character>("sxs.character", DEFAULT_CHARACTER);
  const [now, setNow] = useState(() => new Date());

  // Keep ETAs current while the page is left open.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const table = getSeason(Number(character.season));
  const level = num(character.level);
  const required = table && table.expToNext[level - table.minLevel];

  const currentXp =
    character.progressMode === "percent"
      ? required !== undefined
        ? (required * (num(character.percent) || 0)) / 100
        : NaN
      : num(character.currentXp) || 0;

  const goal = num(character.goalLevel);
  const ready = table && character.level !== "" && character.rate !== "";
  const outcome = ready
    ? calculate({
        table,
        level,
        currentXp,
        xpPerHour: toXpPerHour(num(character.rate), character.rateUnit),
        goalLevel: Number.isInteger(goal) ? goal : undefined,
      })
    : undefined;

  return (
    <div className="shell">
      <header className="masthead">
        <p className="eyebrow">Sword x Staff</p>
        <h1>Level Timer</h1>
        <p className="lede">Enter your character and XP rate to see when you'll reach your next level.</p>
      </header>

      <main className="layout">
        <CharacterForm
          character={character}
          onChange={setCharacter}
          onReset={() => setCharacter({ ...DEFAULT_CHARACTER, season: character.season })}
          table={table}
        />
        <Results character={character} outcome={outcome} now={now} />
      </main>

      <footer className="footer">
        Unofficial fan tool. XP tables come from the community{" "}
        <a href="https://qenu.github.io/ethna-timeline/" target="_blank" rel="noreferrer">
          Ethna Timeline
        </a>{" "}
        dataset. Your character is saved only in this browser.
      </footer>
    </div>
  );
}
