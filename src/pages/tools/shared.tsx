import { useEffect, useMemo, useState, type ReactNode } from "react";
import glossary from "../../data/skill_glossary.json";
import { createExplorer, type Explorer } from "../../lib/explorer";
import { loadGameData } from "../../lib/gamedata";

/** Loads the shared game data and builds the skill explorer. */
export function useExplorer(): { explorer: Explorer | null; error: string } {
  const [explorer, setExplorer] = useState<Explorer | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    loadGameData()
      .then((d) => setExplorer(createExplorer(d)))
      .catch((e: Error) => setError(e.message));
  }, []);
  return { explorer, error };
}

export function Loading({ error }: { error: string }) {
  return (
    <section className="card results empty">
      {error ? <p className="error">{error}. Refresh to try again.</p> : <p>Loading game data (about 1 MB)…</p>}
    </section>
  );
}

const GLOSSARY = glossary as Record<string, string>;
const NAMES = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
const LOOKUP = Object.fromEntries(NAMES.map((n) => [n.toLowerCase(), n]));
const PATTERN = new RegExp(`(^|[^A-Za-z0-9])(${NAMES.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=$|[^A-Za-z0-9])`, "gi");

/** Skill text with status terms (Stun, Airborne, ...) you can tap to read their definition. */
export function GlossaryText({ text }: { text: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const parts = useMemo(() => {
    const out: ReactNode[] = [];
    let last = 0;
    for (const m of text.matchAll(PATTERN)) {
      const prefix = m[1] || "";
      const term = m[2];
      const start = (m.index ?? 0) + prefix.length;
      const name = LOOKUP[term.toLowerCase()];
      out.push(text.slice(last, start));
      out.push(
        <button key={start} type="button" className="term" aria-expanded={open === name} onClick={() => setOpen(open === name ? null : name)} title={GLOSSARY[name]}>
          {term}
        </button>,
      );
      last = start + term.length;
    }
    out.push(text.slice(last));
    return out;
  }, [text, open]);
  return (
    <>
      <p className="hint skill-text">{parts}</p>
      {open && (
        <p className="note term-def">
          <b>{open}:</b> {GLOSSARY[open]}
        </p>
      )}
    </>
  );
}
