import { useState } from "react";

const base = import.meta.env.BASE_URL;
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Official Sword x Staff art from public/art/, with an initials badge if the file is missing. */
export function GameArt({ path, name, className = "", alt }: { path: string; name: string; className?: string; alt?: string }) {
  // Track which path failed so switching to another image retries.
  const [failedPath, setFailedPath] = useState<string | null>(null);
  if (failedPath === path) {
    return (
      <span className={`art art-fallback ${className}`} aria-hidden={alt === "" ? true : undefined}>
        {initials(name)}
      </span>
    );
  }
  return (
    <img
      className={`art ${className}`}
      src={`${base}art/${path}`}
      alt={alt ?? name}
      loading="lazy"
      decoding="async"
      onError={() => setFailedPath(path)}
    />
  );
}
