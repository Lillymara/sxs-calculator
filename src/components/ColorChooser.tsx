import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ACCENTS,
  BACKGROUNDS,
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND,
  SYSTEM_BACKGROUND,
  accentColors,
  applyAccent,
  applyBackground,
  resetOrSecret,
  resolveBackground,
  savedAccent,
  savedBackground,
} from "../lib/theme";

interface Option {
  id: string;
  name: string;
  swatch: ReactNode;
}

/** A swatch button that opens a grid of options. */
function Picker({ label, title, options, value, defaultId, onPick, footer }: {
  label: string;
  title: string;
  options: Option[];
  value: string;
  defaultId: string;
  onPick: (id: string) => void;
  /** Extra control under the grid; gets a function that closes the menu. */
  footer?: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value) ?? options[0];

  // Close when clicking elsewhere or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="color-chooser" ref={ref}>
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)} title={`${title}: ${current.name}`}>
        {current.swatch}
        {label}
      </button>
      {open && (
        <div className="color-menu" role="radiogroup" aria-label={title}>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={o.id === value}
              onClick={() => {
                onPick(o.id);
                setOpen(false);
              }}
            >
              {o.swatch}
              {o.name}
              {o.id === defaultId && <small>default</small>}
            </button>
          ))}
          {footer?.(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const split = (a: string, b: string) => <span className="swatch" style={{ background: `linear-gradient(135deg, ${a} 50%, ${b} 50%)` }} />;

/** Accent color and background pickers shown in the top bar. */
export function ColorChooser() {
  const [accent, setAccent] = useState(savedAccent);
  const [background, setBackground] = useState(savedBackground);
  const tone = resolveBackground(background).tone;

  const accentOptions: Option[] = ACCENTS.map((a) => {
    if (a.swatch) return { id: a.id, name: a.name, swatch: split(...a.swatch) };
    const [c1, c2] = accentColors(a, tone);
    return { id: a.id, name: a.name, swatch: <span className="swatch" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} /> };
  });
  const backgroundOptions: Option[] = [
    ...BACKGROUNDS.map((b) => ({ id: b.id, name: b.name, swatch: split(b.bg, b.surface2) })),
    { id: SYSTEM_BACKGROUND, name: "Device", swatch: split(resolveBackground("midnight").bg, resolveBackground("daylight").bg) },
  ];

  return (
    <div className="theme-pickers">
      <Picker
        label="Color"
        title="Accent color"
        options={accentOptions}
        value={accent}
        defaultId={DEFAULT_ACCENT}
        onPick={(id) => {
          setAccent(id);
          applyAccent(id);
        }}
        footer={(close) => (
          // Looks like a plain reset, but it's the way into the secret theme.
          <button
            type="button"
            className="color-reset"
            onClick={() => {
              const next = resetOrSecret();
              setAccent(next.accent);
              setBackground(next.background);
              close();
            }}
          >
            Reset to default
          </button>
        )}
      />
      <Picker
        label="Background"
        title="Background"
        options={backgroundOptions}
        value={background}
        defaultId={DEFAULT_BACKGROUND}
        onPick={(id) => {
          setBackground(id);
          applyBackground(id);
        }}
      />
    </div>
  );
}
