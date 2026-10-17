import { useId, useMemo, useState } from "react";
import serverRows from "../data/servers.json";
import { loadServers, searchServers, type Server } from "../lib/calendar";
import type { ServerChoice } from "../pages/calendar/server";

export const SERVERS = loadServers(serverRows as Parameters<typeof loadServers>[0]);

/** Typo-tolerant search over the community server roster; picking one sets the saved server. */
export function ServerSearch({ choice, onChange, className = "" }: { choice: ServerChoice; onChange: (c: ServerChoice) => void; className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const matches = useMemo(() => searchServers(SERVERS, query), [query]);

  const pick = (s: Server) => {
    onChange({ ...choice, serverId: s.id, name: s.name, day1: s.opened, offset: 0 });
    setQuery("");
    setOpen(false);
  };

  return (
    <div className={`field search ${className}`}>
      <span>Find your server</span>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches[0]) pick(matches[0]);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={choice.name ? choice.name : "Start typing a server name"}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-label="Find your server"
      />
      {open && query && (
        <ul className="search-results" id={listId} role="listbox">
          {matches.length ? (
            matches.map((s) => (
              <li key={s.id} role="option" aria-selected={false}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}>
                  <b>{s.name}</b>
                  <small>
                    {s.opened ? `Opened ${s.opened}` : "Opening date unknown"} · Nexus {s.nexus} #{s.number}
                  </small>
                </button>
              </li>
            ))
          ) : (
            <li className="empty">No match. Set a custom Day 1 in the Server Calendar.</li>
          )}
        </ul>
      )}
      <small>{SERVERS.length} servers in the community roster.</small>
    </div>
  );
}
