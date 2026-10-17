import { effectiveDay1, type ServerChoice } from "../pages/calendar/server";
import { ServerSearch } from "./ServerSearch";

interface Props {
  choice: ServerChoice;
  onServerChange: (c: ServerChoice) => void;
  onlyObtainable: boolean;
  onToggle: (v: boolean) => void;
  hiddenCount: number;
  /** What the filter hides, e.g. "Hides unreleased Fantomons and ...". */
  description: string;
  label?: string;
  hideLimited: boolean;
  onToggleLimited: (v: boolean) => void;
  limitedCount: number;
}

/** Server picker plus the "only what my server can get" filter for Fantomons and companions. */
export function AvailabilityBar({ choice, onServerChange, onlyObtainable, onToggle, hiddenCount, description, label = "Only what my server can get", hideLimited, onToggleLimited, limitedCount }: Props) {
  const day1 = effectiveDay1(choice);
  return (
    <div className="availability-bar">
      <div className="availability-server">
        {day1 ? (
          <p className="server-now">
            <span className="eyebrow">Your server</span>
            <b>{choice.name || "Custom server"}</b>
            <small>Day 1: {day1.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</small>
          </p>
        ) : (
          <p className="hint">Pick your server to check event and release dates against it.</p>
        )}
        <ServerSearch choice={choice} onChange={onServerChange} />
      </div>
      <label className="toggle">
        <input type="checkbox" checked={onlyObtainable} onChange={(e) => onToggle(e.target.checked)} />
        <span className="toggle-track" aria-hidden />
        <span>
          <b>{label}</b>
          <small>
            {description}
            {onlyObtainable && hiddenCount ? ` · ${hiddenCount} hidden` : ""}.
          </small>
        </span>
      </label>
      <label className="toggle">
        <input type="checkbox" checked={hideLimited} onChange={(e) => onToggleLimited(e.target.checked)} />
        <span className="toggle-track" aria-hidden />
        <span>
          <b>Hide limited</b>
          <small>
            Hides event and collaboration entries whose dates aren't known
            {hideLimited && limitedCount ? ` · ${limitedCount} hidden` : ""}.
          </small>
        </span>
      </label>
    </div>
  );
}
