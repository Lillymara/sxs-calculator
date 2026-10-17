import type { ReactNode } from "react";

interface Props {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  className?: string;
  type?: "text" | "time" | "datetime-local";
}

/** Labelled text input. Number fields stay text so players can type 4.13k or 1.52B. */
export function Field({ label, value, onChange, placeholder, hint, className = "", type = "text" }: Props) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

interface SectionProps {
  step: number;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function Section({ step, title, aside, children }: SectionProps) {
  return (
    <section className="card" aria-labelledby={`section-${step}`}>
      <div className="card-head">
        <h2 id={`section-${step}`}>
          <span className="step">{step}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
