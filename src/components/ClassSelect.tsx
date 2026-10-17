import { useEffect, useId, useRef, useState } from "react";
import { byLine, lineOf } from "../lib/classLines";
import type { Profession } from "../lib/gamedata";
import { GameArt } from "./GameArt";

interface Props {
  label: string;
  value: string;
  classes: Profession[];
  onChange: (code: string) => void;
}

/** A class dropdown that shows each class badge (native selects can't show images). */
export function ClassSelect({ label, value, classes: unordered, onChange }: Props) {
  const classes = byLine(unordered);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Only keyboard moves scroll the list; opening and hovering never do. */
  const scrollToActive = useRef(false);
  const id = useId();
  const selected = classes.find((c) => c.code === value) ?? classes[0];

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, classes.findIndex((c) => c.code === value)));
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, classes, value]);

  useEffect(() => {
    if (!open || !scrollToActive.current) return;
    scrollToActive.current = false;
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !el) return;
    // Scroll only the list (not the page) so the active option is visible.
    const top = el.offsetTop; // the absolutely positioned list is the offset parent
    if (top < list.scrollTop + 28) list.scrollTop = Math.max(0, top - 28);
    else if (top + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + el.offsetHeight - list.clientHeight;
  }, [open, active]);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    scrollToActive.current = true;
    if (e.key === "ArrowDown") setActive((a) => Math.min(classes.length - 1, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(classes.length - 1);
    else if (e.key === "Enter" || e.key === " ") choose(classes[active].code);
    else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      return;
    } else return;
    e.preventDefault();
  };

  /** Badge on a disc colored by the class's line. */
  const badge = (c: Profession, cls = "") => {
    const [a, b] = lineOf(c).colors;
    return (
      <span className={`class-badge-wrap ${cls}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
        <GameArt path={`classes/${c.badge}.webp`} name={c.name} alt="" className="class-badge" />
      </span>
    );
  };

  return (
    <div className="field class-select" ref={ref}>
      <span id={`${id}-label`}>{label}</span>
      <button
        type="button"
        className="class-select-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={onKey}
      >
        {badge(selected)}
        <span id={`${id}-value`}>
          <b>{selected.name}</b>
          <small>
            {lineOf(selected).name} · Rank {selected.rank}
          </small>
        </span>
        <span className="chevron" aria-hidden>▾</span>
      </button>
      {open && (
        <ul className="class-options" role="listbox" aria-labelledby={`${id}-label`} ref={listRef}>
          {classes.map((c, i) => [
            i === 0 || lineOf(c).id !== lineOf(classes[i - 1]).id ? (
              <li key={`h-${lineOf(c).id}`} role="presentation" className="class-line-head">
                <span className="line-dot" style={{ background: lineOf(c).colors[0] }} />
                {lineOf(c).name}
              </li>
            ) : null,
            <li
              key={c.code}
              id={`${id}-opt-${i}`}
              data-index={i}
              role="option"
              aria-selected={c.code === value}
              className={i === active ? "active" : undefined}
              onPointerMove={() => active !== i && setActive(i)}
              onClick={() => choose(c.code)}
            >
              {badge(c, "small")}
              <b>{c.name}</b>
              <small>Rank {c.rank}</small>
            </li>,
          ])}
        </ul>
      )}
    </div>
  );
}
