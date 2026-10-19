// Interactive world map drawn from client map data.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePersistentState } from "../../lib/storage";

type Rect = [number, number, number, number, string, number?];
interface Wheel {
  id: number;
  world: [number, number];
  rewards: [number, number][];
  fixed: number | null;
  title: string;
  area: string;
}
interface MapData {
  id: number;
  title: string;
  rects: Rect[];
  labels: { name: string; x: number; y: number; major: boolean }[];
  unlocks: Record<string, { use: string; points: [number, number][] }>;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  wheels: Record<string, Wheel>;
}
interface Area {
  id: string;
  areaId: number;
  name: string;
  world: [number, number];
  unlockItem: number;
  unlockUse: string;
  items: [string, number][];
}
interface WorldData {
  maps: Record<string, MapData>;
  items: Record<string, { name: string; fallback?: string; icon?: string }>;
  /** Lucky Wheel map marker image. */
  markerIcon?: string;
  areaLoot: Record<string, Area[]>;
}

let dataPromise: Promise<WorldData> | null = null;
const loadWorld = () =>
  (dataPromise ??= fetch(`${import.meta.env.BASE_URL}data/worldmap.json?v=${__BUILD_ID__}`).then((r) => {
    if (!r.ok) throw new Error(`Map data failed to load (${r.status})`);
    return r.json();
  }));

const lootName = (n: string) => (n === "料理锅" ? "Cooking Pot" : n === "Rolla" ? "Rola" : n);
const lootGlyph = (n: string) =>
  /chest/i.test(n) ? "🧰" : /ore|iron|stone|sand|gem|amber/i.test(n) ? "⛏️" : /wood|vine|spore|fruit|pear|chestnut|grain/i.test(n) ? "🌿" : /treat|riceball|food|cooking/i.test(n) ? "🍱" : /badge|trinket/i.test(n) ? "✨" : "📦";

interface MapFilter {
  wheels: boolean;
  places: boolean;
  /** Unlock item ids whose blockades are hidden. */
  hidden: number[];
}

type Selection = { type: "wheel"; id: number } | { type: "area"; id: string } | null;

/** A map marker: an unlockable area at its blockade (where the unlock item is used). */
interface Spot {
  /** The area behind the blockade; null for a blockade with no recorded area. */
  area: Area | null;
  itemId: number;
  /** Index into the item's unlock points, or -1 for an area whose blockade isn't mapped. */
  index: number;
  at: [number, number];
}

/** Pairs each area with the nearest blockade of its own unlock item, closest pairs first. */
function pairBlockades(map: MapData, areas: Area[]): Spot[] {
  const pairs: { area: Area; itemId: number; index: number; d: number }[] = [];
  for (const area of areas) {
    map.unlocks[area.unlockItem]?.points.forEach((pt, index) =>
      pairs.push({ area, itemId: area.unlockItem, index, d: Math.hypot(pt[0] - area.world[0], pt[1] - area.world[1]) }),
    );
  }
  pairs.sort((a, b) => a.d - b.d);
  const usedArea = new Set<string>(), usedPoint = new Set<string>();
  const spots: Spot[] = [];
  for (const p of pairs) {
    const key = `${p.itemId}:${p.index}`;
    if (usedArea.has(p.area.id) || usedPoint.has(key)) continue;
    usedArea.add(p.area.id);
    usedPoint.add(key);
    spots.push({ area: p.area, itemId: p.itemId, index: p.index, at: map.unlocks[p.itemId].points[p.index] });
  }
  for (const area of areas) if (!usedArea.has(area.id)) spots.push({ area, itemId: area.unlockItem, index: -1, at: area.world });
  for (const [id, u] of Object.entries(map.unlocks)) {
    u.points.forEach((at, index) => !usedPoint.has(`${id}:${index}`) && spots.push({ area: null, itemId: +id, index, at }));
  }
  return spots;
}

export function WorldMapPage() {
  const [data, setData] = useState<WorldData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    loadWorld().then(setData).catch((e: Error) => {
      dataPromise = null;
      setError(e.message);
    });
  }, []);
  if (!data) {
    return <section className="card results empty">{error ? <p className="error">{error}</p> : <p>Loading map data…</p>}</section>;
  }
  return <WorldMap data={data} />;
}

function WorldMap({ data }: { data: WorldData }) {
  const [mapId, setMapId] = useState("11");
  const map = data.maps[mapId];
  const areas = useMemo(() => data.areaLoot[mapId] || [], [data, mapId]);
  const spots = useMemo(() => pairBlockades(map, areas), [map, areas]);
  const wheels = Object.values(map.wheels || {});
  const [selection, setSelection] = useState<Selection>(wheels[0] ? { type: "wheel", id: wheels[0].id } : null);
  // What to draw. Kept per visitor and across regions: blockade types are hidden by unlock item id.
  const [filter, setFilter] = usePersistentState<MapFilter>("sxs.mapFilter", { wheels: true, places: true, hidden: [] });
  const unlocks = useMemo(
    () => new Set(Object.keys(map.unlocks).map(Number).filter((id) => !filter.hidden.includes(id))),
    [map, filter.hidden],
  );
  const [hover, setHover] = useState<{ area: Area; x: number; y: number } | null>(null);
  const [toast, setToast] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const view = useRef({ scale: 1, fitScale: 1, ox: 0, oy: 0, dpr: 1 });
  const pointer = useRef<{ id: number; x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  const images = useRef(new Map<string, HTMLImageElement>());
  const [imagesReady, setImagesReady] = useState(0);
  const iconUrl = (file?: string) => (file ? `${import.meta.env.BASE_URL}art/items/${file}` : undefined);
  /** Loaded image for canvas drawing, or null until it arrives (then the map redraws). */
  const imageFor = (file?: string) => {
    if (!file) return null;
    let img = images.current.get(file);
    if (!img) {
      img = new Image();
      img.onload = () => setImagesReady((n) => n + 1);
      img.src = iconUrl(file)!;
      images.current.set(file, img);
    }
    return img.complete && img.naturalWidth ? img : null;
  };

  const toScreen = (x: number, y: number) => ({ x: view.current.ox + x * view.current.scale, y: view.current.oy - y * view.current.scale });
  const toWorld = (x: number, y: number) => ({ x: (x - view.current.ox) / view.current.scale, y: (view.current.oy - y) / view.current.scale });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const v = view.current;
    const w = canvas.width / v.dpr, h = canvas.height / v.dpr;
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const overlap = Math.max(0.25, v.scale * 0.08);
    for (const [x, y, rw, rh, color] of map.rects) {
      const p = { x: v.ox + x * v.scale, y: v.oy - (y + rh) * v.scale };
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(p.x - overlap), Math.floor(p.y - overlap), Math.ceil(rw * v.scale + overlap * 2), Math.ceil(rh * v.scale + overlap * 2));
    }
    // Labels
    const zoom = v.scale / v.fitScale;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    for (const label of filter.places ? [...map.labels].sort((a, b) => Number(a.major) - Number(b.major)) : []) {
      if (!label.major && zoom < 0.84) continue;
      const p = { x: v.ox + label.x * v.scale, y: v.oy - label.y * v.scale };
      const size = label.major ? Math.max(10, Math.min(14, v.scale * 2.2)) : Math.max(8, Math.min(11, v.scale * 1.62));
      ctx.font = `${label.major ? 900 : 700} ${size}px system-ui`;
      ctx.lineWidth = Math.max(2, size * 0.26);
      ctx.strokeStyle = "rgba(7,18,14,.9)";
      ctx.strokeText(label.name, p.x, p.y);
      ctx.fillStyle = label.major ? "#fbfff8" : "rgba(232,242,224,.88)";
      ctx.fillText(label.name, p.x, p.y);
    }
    ctx.restore();
    // Unlockable areas, each drawn at its blockade with the unlock item's icon
    for (const spot of spots) {
      if (spot.index >= 0 && !unlocks.has(spot.itemId)) continue;
      const p = { x: v.ox + spot.at[0] * v.scale, y: v.oy - spot.at[1] * v.scale };
      const active = !!spot.area && selection?.type === "area" && selection.id === spot.area.id;
      const item = data.items[spot.itemId];
      const size = Math.max(23, Math.min(34, v.scale * 5.7));
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = active ? "#342e0c" : "rgba(7,17,28,.93)";
      if (active) {
        ctx.shadowColor = "rgba(255,216,76,.9)";
        ctx.shadowBlur = 14;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = active ? "#ffd84c" : "#ff6079";
      ctx.lineWidth = active ? 3 : 2.4;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "900 11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const icon = imageFor(item?.icon);
      if (icon) ctx.drawImage(icon, p.x - size * 0.34, p.y - size * 0.34, size * 0.68, size * 0.68);
      else ctx.fillText(item?.fallback || item?.name?.slice(0, 1) || "?", p.x, p.y);
      ctx.restore();
    }
    // Lucky wheels
    for (const wheel of filter.wheels ? Object.values(map.wheels || {}) : []) {
      const p = { x: v.ox + wheel.world[0] * v.scale, y: v.oy - wheel.world[1] * v.scale };
      const active = selection?.type === "wheel" && selection.id === wheel.id;
      const size = Math.max(42, Math.min(60, v.scale * 9.5));
      ctx.save();
      // A solid light disc so the grey "?" pillar marker stands out on any terrain.
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = active ? "#fff4c2" : "rgba(240,250,252,.95)";
      ctx.shadowColor = active ? "rgba(255,216,76,.9)" : "rgba(0,0,0,.45)";
      ctx.shadowBlur = active ? 16 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = active ? "#ffd84c" : "#7ef3f8";
      ctx.lineWidth = active ? 3 : 2;
      ctx.stroke();
      ctx.font = `900 ${Math.round(size * 0.42)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = active ? "#ffe26a" : "#d7f7fb";
      const marker = imageFor(data.markerIcon);
      if (marker) ctx.drawImage(marker, p.x - size * 0.21, p.y - size * 0.42, size * 0.42, size * 0.84);
      else ctx.fillText("✺", p.x, p.y);
      const label = `LUCKY WHEEL ${wheel.id}`;
      ctx.font = "900 11px system-ui";
      const tw = ctx.measureText(label).width + 20;
      const ly = p.y + size * 0.55;
      ctx.beginPath();
      ctx.roundRect(p.x - tw / 2, ly, tw, 24, 9);
      ctx.fillStyle = active ? "rgba(42,36,8,.94)" : "rgba(5,20,27,.9)";
      ctx.fill();
      ctx.strokeStyle = active ? "#ffd84c" : "#35677a";
      ctx.stroke();
      ctx.fillStyle = active ? "#ffe26a" : "#d7f7fb";
      ctx.fillText(label, p.x, ly + 12);
      ctx.restore();
    }
  }, [map, spots, unlocks, filter.wheels, filter.places, selection, data.items, imagesReady]);

  const fit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const v = view.current;
    const b = map.bounds;
    const w = canvas.width / v.dpr, h = canvas.height / v.dpr;
    v.fitScale = Math.max(0.1, Math.min((w - 40) / (b.maxX - b.minX), (h - 40) / (b.maxY - b.minY)));
    v.scale = v.fitScale;
    v.ox = w / 2 - ((b.minX + b.maxX) / 2) * v.scale;
    v.oy = h / 2 + ((b.minY + b.maxY) / 2) * v.scale;
    draw();
  }, [map, draw]);

  // Size the canvas to its container.
  useEffect(() => {
    const vp = viewportRef.current, canvas = canvasRef.current;
    if (!vp || !canvas) return;
    const resize = () => {
      const r = vp.getBoundingClientRect();
      view.current.dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(r.width * view.current.dpr));
      canvas.height = Math.max(1, Math.round(r.height * view.current.dpr));
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      fit();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [fit]);

  useEffect(draw, [draw]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const changeMap = (id: string) => {
    setMapId(id);
    const m = data.maps[id];
    const ws = Object.values(m.wheels || {});
    setSelection(ws[0] ? { type: "wheel", id: ws[0].id } : null);
    setHover(null);
  };

  const zoomAt = (factor: number, cx: number, cy: number) => {
    const v = view.current;
    const before = toWorld(cx, cy);
    v.scale = Math.max(v.fitScale * 0.68, Math.min(v.fitScale * 6, v.scale * factor));
    v.ox = cx - before.x * v.scale;
    v.oy = cy + before.y * v.scale;
    draw();
  };

  const point = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** The visible marker nearest the pointer, within `max` pixels. */
  const spotAt = (p: { x: number; y: number }, max = 28) => {
    let hit: Spot | null = null, best = max;
    for (const spot of spots) {
      if (spot.index >= 0 && !unlocks.has(spot.itemId)) continue;
      const m = toScreen(spot.at[0], spot.at[1]);
      const d = Math.hypot(p.x - m.x, p.y - m.y);
      if (d < best) { hit = spot; best = d; }
    }
    return hit && { spot: hit, d: best };
  };
  const center = (wx: number, wy: number) => {
    const canvas = canvasRef.current!;
    const p = toScreen(wx, wy);
    view.current.ox += canvas.clientWidth * 0.5 - p.x;
    view.current.oy += canvas.clientHeight * 0.48 - p.y;
  };

  // Wheel zoom must be non-passive to stop the page scrolling.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = point(e);
      zoomAt(e.deltaY < 0 ? 1.12 : 0.89, p.x, p.y);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  });

  const wheel = selection?.type === "wheel" ? map.wheels[selection.id] : null;
  const area = selection?.type === "area" ? areas.find((a) => a.id === selection.id) : null;

  return (
    <div className="tool world-map">
      <section className="card map-card">
        <div className="map-toolbar">
          <label className="field inline">
            <span>Region</span>
            <select value={mapId} onChange={(e) => changeMap(e.target.value)}>
              {Object.values(data.maps).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </label>
          <div className="button-row">
            <button type="button" className="secondary" aria-label="Zoom in" onClick={() => zoomAt(1.22, canvasRef.current!.clientWidth / 2, canvasRef.current!.clientHeight / 2)}>+</button>
            <button type="button" className="secondary" aria-label="Zoom out" onClick={() => zoomAt(0.82, canvasRef.current!.clientWidth / 2, canvasRef.current!.clientHeight / 2)}>−</button>
            <button type="button" className="secondary" onClick={fit}>Fit</button>
          </div>
        </div>
        <div className="map-viewport" ref={viewportRef}>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${map.title} map. Drag to move, scroll to zoom.`}
            onPointerDown={(e) => {
              canvasRef.current!.setPointerCapture(e.pointerId);
              const p = point(e);
              pointer.current = { id: e.pointerId, x: p.x, y: p.y, ox: view.current.ox, oy: view.current.oy, moved: false };
              setHover(null);
            }}
            onPointerMove={(e) => {
              const p = point(e);
              const ptr = pointer.current;
              if (ptr && e.pointerId === ptr.id) {
                const dx = p.x - ptr.x, dy = p.y - ptr.y;
                if (Math.hypot(dx, dy) > 4) ptr.moved = true;
                view.current.ox = ptr.ox + dx;
                view.current.oy = ptr.oy + dy;
                draw();
                return;
              }
              const a = spotAt(p)?.spot.area;
              setHover(a ? { area: a, x: p.x, y: p.y } : null);
            }}
            onPointerLeave={() => !pointer.current && setHover(null)}
            onPointerUp={(e) => {
              const ptr = pointer.current;
              pointer.current = null;
              if (!ptr || ptr.moved) return;
              const p = point(e);
              let best = Infinity;
              let hit: Selection = null;
              for (const w of filter.wheels ? Object.values(map.wheels || {}) : []) {
                const m = toScreen(w.world[0], w.world[1]);
                const d = Math.hypot(p.x - m.x, p.y - m.y);
                if (d < 58 && d < best) { hit = { type: "wheel", id: w.id }; best = d; }
              }
              const near = spotAt(p);
              if (near && (!hit || near.d < 20)) {
                const { spot } = near;
                if (spot.area) hit = { type: "area", id: spot.area.id };
                else {
                  hit = null;
                  const u = map.unlocks[spot.itemId];
                  setToast(`${data.items[spot.itemId]?.name} ${spot.index + 1} of ${u.points.length} · ${u.use}`);
                }
              }
              if (hit) setSelection(hit);
            }}
          />
          {hover && (
            <div className="map-tooltip" style={{ left: Math.min(hover.x + 16, (canvasRef.current?.clientWidth ?? 300) - 280), top: hover.y + 16 }}>
              <b>{hover.area.name}</b>
              <span>{data.items[hover.area.unlockItem]?.name} · {hover.area.items.length} pickup types</span>
            </div>
          )}
          {toast && <div className="map-toast" role="status">{toast}</div>}
        </div>

        <div className="unlock-bar" role="group" aria-label="Show on map">
          <span className="event-tag">Show on map</span>
          <button type="button" aria-pressed={filter.wheels} onClick={() => setFilter((f) => ({ ...f, wheels: !f.wheels }))}>
            <span className="unlock-name">
              {data.markerIcon && <img src={iconUrl(data.markerIcon)} alt="" />}
              Lucky Wheels ×{wheels.length}
            </span>
            <small>Spin for rewards</small>
          </button>
          {Object.entries(map.unlocks).map(([id, u]) => (
            <button
              key={id}
              type="button"
              aria-pressed={unlocks.has(+id)}
              onClick={() =>
                setFilter((f) => ({ ...f, hidden: f.hidden.includes(+id) ? f.hidden.filter((x) => x !== +id) : [...f.hidden, +id] }))
              }
            >
              <span className="unlock-name">
                {data.items[id]?.icon && <img src={iconUrl(data.items[id].icon)} alt="" />}
                {data.items[id]?.name} ×{u.points.length}
              </span>
              <small>{u.use}</small>
            </button>
          ))}
          <button type="button" aria-pressed={filter.places} onClick={() => setFilter((f) => ({ ...f, places: !f.places }))}>
            <span className="unlock-name">Place names ×{map.labels.length}</span>
            <small>Towns, camps and areas</small>
          </button>
          <button type="button" className="link-button" onClick={() => setFilter({ wheels: true, places: true, hidden: [] })}>Show all</button>
          <button
            type="button"
            className="link-button"
            onClick={() =>
              setFilter({ wheels: false, places: false, hidden: [...new Set(Object.values(data.maps).flatMap((m) => Object.keys(m.unlocks).map(Number)))] })
            }
          >
            Clear all
          </button>
        </div>
      </section>

      <section className="card map-panel">
        {wheels.length > 0 && (
          <div className="filter-row wheel-tabs" role="group" aria-label="Lucky wheels">
            {wheels.map((w) => (
              <button
                key={w.id}
                type="button"
                aria-pressed={wheel?.id === w.id}
                onClick={() => {
                  setSelection({ type: "wheel", id: w.id });
                  center(w.world[0], w.world[1]);
                }}
              >
                Wheel {w.id} · {w.area}
              </button>
            ))}
          </div>
        )}
        {wheel ? (
          <>
            <p className="eyebrow">Lucky Wheel</p>
            <h2>{wheel.title}</h2>
            <LuckyWheel
              key={`${mapId}-${wheel.id}`}
              storageKey={`${mapId}-${wheel.id}`}
              wheel={wheel}
              items={data.items}
              iconUrl={iconUrl}
              markerIcon={iconUrl(data.markerIcon)}
            />
          </>
        ) : area ? (
          <>
            <p className="eyebrow">Unlockable area</p>
            <h2>{area.name}</h2>
            <p className="unlock-with">
              {data.items[area.unlockItem]?.icon && <img src={iconUrl(data.items[area.unlockItem].icon)} alt="" />}
              <span>
                <span>Unlock with a <b>{data.items[area.unlockItem]?.name}</b></span>
                <small>{area.unlockUse} · {map.title}, area {area.areaId}</small>
              </span>
            </p>
            <ul className="ready-list">
              {area.items.map(([name, count]) => (
                <li key={name}>
                  <span><span aria-hidden>{lootGlyph(name)}</span> {lootName(name)}</span>
                  <span>{count} {count === 1 ? "location" : "locations"}</span>
                </li>
              ))}
            </ul>
            <p className="hint">Static spawn spots recorded in the client. Respawns and chest contents are handled separately by the game.</p>
          </>
        ) : (
          <p className="hint">{wheels.length ? "Pick a wheel or area." : "No Lucky Wheels in this region. Tap a blockade marker to see the area behind it."}</p>
        )}
      </section>
    </div>
  );
}

const pct = (x: number) => `${(x * 100).toFixed(x * 100 >= 10 ? 1 : 2)}%`;

/**
 * The Lucky Wheel: a ring of its slots that spins to simulate a reward. Players can mark
 * slots they've already won (saved per wheel), and odds are shown for what's left.
 */
function LuckyWheel({
  wheel,
  storageKey,
  items,
  iconUrl,
  markerIcon,
}: {
  wheel: Wheel;
  storageKey: string;
  items: WorldData["items"];
  iconUrl: (file?: string) => string | undefined;
  markerIcon?: string;
}) {
  const n = wheel.rewards.length;
  const seg = 360 / n;
  const [saved, setSaved] = usePersistentState<Record<string, number[]>>("sxs.wheels", {});
  const [settings, setSettings] = usePersistentState<{ autoRemove: boolean }>("sxs.wheelSettings", { autoRemove: true });
  const taken = new Set(saved[storageKey] ?? []);
  const remaining = wheel.rewards.map((_, i) => i).filter((i) => !taken.has(i));
  const setTaken = (next: Set<number>) => setSaved({ ...saved, [storageKey]: [...next].sort((a, b) => a - b) });
  const toggle = (i: number) => {
    const next = new Set(taken);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setTaken(next);
  };

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const pending = useRef<number | null>(null);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // The client's fixed first result only applies to a fresh wheel.
  const fixedApplies = wheel.fixed !== null && taken.size === 0 && history.length === 0;

  const spin = () => {
    if (spinning || !remaining.length) return;
    const slot = fixedApplies ? wheel.fixed! : remaining[Math.floor(Math.random() * remaining.length)];
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    // Bring the slot's centre under the top pointer after a few full turns.
    const target = -((slot + 0.5) * seg) + jitter;
    const base = rotation - (((rotation % 360) + 360) % 360);
    const next = base + 360 * (reduceMotion ? 1 : 6) + (((target % 360) + 360) % 360);
    pending.current = slot;
    setResult(null);
    setSpinning(true);
    setRotation(next);
    // transitionend can be skipped (background tabs, interrupted animations), so also finish on a timer.
    window.setTimeout(finish, (reduceMotion ? 600 : 4600) + 200);
  };

  const finish = () => {
    if (pending.current === null) return;
    const slot = pending.current;
    pending.current = null;
    setSpinning(false);
    setResult(slot);
    setHistory((h) => [...h, slot]);
    if (settings.autoRemove) {
      setSaved((prev) => ({ ...prev, [storageKey]: [...new Set([...(prev[storageKey] ?? []), slot])].sort((a, b) => a - b) }));
    }
  };

  // Odds of each item among the slots that are left.
  const byItem = new Map<number, { slots: number; qtys: number[] }>();
  for (const i of remaining) {
    const [itemId, qty] = wheel.rewards[i];
    const e = byItem.get(itemId) ?? { slots: 0, qtys: [] };
    e.slots++;
    e.qtys.push(qty);
    byItem.set(itemId, e);
  }
  const itemOdds = [...byItem.entries()].sort((a, b) => b[1].slots - a[1].slots || (items[a[0]]?.name ?? "").localeCompare(items[b[0]]?.name ?? ""));
  const each = remaining.length ? 1 / remaining.length : 0;

  const won = result !== null ? wheel.rewards[result] : null;
  const totals = new Map<number, number>();
  for (const slot of history) {
    const [itemId, qty] = wheel.rewards[slot];
    totals.set(itemId, (totals.get(itemId) ?? 0) + qty);
  }
  const name = (id: number) => items[id]?.name ?? `Item ${id}`;

  return (
    <div className="lucky-wheel">
      <p className="hint">
        {wheel.area} · <b>{remaining.length}</b> of {n} slots left
        {remaining.length ? `, ${pct(each)} each` : ""}.{" "}
        {wheel.fixed === null
          ? "No fixed first result."
          : fixedApplies
            ? `Slot ${wheel.fixed + 1} is flagged as a fresh wheel's fixed first result.`
            : ""}
      </p>

      <div className="wheel" role="group" aria-label={`${wheel.title}: ${remaining.length} of ${n} slots left. Tap a slot to mark it won.`}>
        <span className="wheel-pointer" aria-hidden />
        <div
          className={`wheel-rotor ${spinning ? "spinning" : ""}`}
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: reduceMotion ? "0.6s" : "4.6s" }}
          onTransitionEnd={(e) => e.propertyName === "transform" && e.target === e.currentTarget && finish()}
        >
          <div className="wheel-face" style={{ "--slots": n } as React.CSSProperties} />
          {wheel.rewards.map(([itemId, qty], i) => {
            const angle = ((i + 0.5) / n) * 2 * Math.PI - Math.PI / 2;
            const item = items[itemId];
            return (
              <button
                key={i}
                type="button"
                className={`wheel-slot ${i === wheel.fixed && fixedApplies ? "fixed" : ""} ${i === result && !spinning ? "won" : ""} ${taken.has(i) ? "taken" : ""}`}
                style={{ left: `${50 + 41 * Math.cos(angle)}%`, top: `${50 + 41 * Math.sin(angle)}%` }}
                title={`Slot ${i + 1}: ${item?.name ?? itemId} ×${qty}${taken.has(i) ? " (won · tap to put back)" : " · tap if you've won this"}`}
                aria-label={`Slot ${i + 1}: ${item?.name ?? itemId} ×${qty}`}
                aria-pressed={taken.has(i)}
                onClick={() => toggle(i)}
                disabled={spinning}
              >
                {item?.icon ? <img src={iconUrl(item.icon)} alt="" /> : <span>{i + 1}</span>}
              </button>
            );
          })}
        </div>
        <button type="button" className="wheel-hub" onClick={spin} disabled={spinning || !remaining.length} aria-label="Spin the wheel">
          {markerIcon && <img src={markerIcon} alt="" />}
        </button>
      </div>

      <div className="wheel-controls">
        <button type="button" className="spin-button" onClick={spin} disabled={spinning || !remaining.length}>
          {!remaining.length ? "Wheel cleared" : spinning ? "Spinning…" : history.length ? "Spin again" : "Spin"}
        </button>
        <p className="wheel-result" role="status" aria-live="polite">
          {won ? (
            <>
              {items[won[0]]?.icon && <img src={iconUrl(items[won[0]].icon)} alt="" />}
              <span>
                You won <b>{name(won[0])} ×{won[1]}</b>
                <small>
                  Slot {result! + 1}
                  {history.length === 1 && wheel.fixed === result ? " · fixed first result" : ""}
                </small>
              </span>
            </>
          ) : spinning ? (
            "Good luck…"
          ) : remaining.length ? (
            "Spin to simulate a reward. Each spin uses a Lucky Ticket."
          ) : (
            "Every slot is marked as won. Restore slots below to spin again."
          )}
        </p>
        <label className="check small-check">
          <input type="checkbox" checked={settings.autoRemove} onChange={(e) => setSettings({ autoRemove: e.target.checked })} />
          <span>Remove each simulated win from the wheel</span>
        </label>
      </div>

      {history.length > 0 && (
        <div className="wheel-tally">
          <div className="card-head">
            <h3 className="subhead">
              {history.length} simulated {history.length === 1 ? "spin" : "spins"} · {history.length} Lucky{" "}
              {history.length === 1 ? "Ticket" : "Tickets"}
            </h3>
            <button type="button" className="link-button" disabled={spinning} onClick={() => { setHistory([]); setResult(null); }}>
              Clear
            </button>
          </div>
          <ul className="chips">
            {[...totals.entries()]
              .sort((a, b) => name(a[0]).localeCompare(name(b[0])))
              .map(([itemId, qty]) => (
                <li key={itemId} className="reward with-icon">
                  {items[itemId]?.icon && <img className="skill-icon small" src={iconUrl(items[itemId].icon)} alt="" />}
                  {name(itemId)} <b>×{qty.toLocaleString()}</b>
                </li>
              ))}
          </ul>
        </div>
      )}

      {remaining.length > 0 && (
        <>
          <h3 className="subhead">Odds of what's left</h3>
          <ul className="item-odds">
            {itemOdds.map(([itemId, o]) => (
              <li key={itemId}>
                {items[itemId]?.icon ? <img src={iconUrl(items[itemId].icon)} alt="" /> : <span className="no-icon" />}
                <span>
                  <b>{name(itemId)}</b>
                  <small>
                    {o.slots} {o.slots === 1 ? "slot" : "slots"} · ×{o.qtys.sort((a, b) => a - b).join(", ×")}
                  </small>
                </span>
                <span className="odds">{pct(o.slots * each)}</span>
                <span className="odds-bar" aria-hidden style={{ width: `${o.slots * each * 100}%` }} />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="card-head slots-head">
        <h3 className="subhead">Slots</h3>
        {taken.size > 0 && (
          <button type="button" className="link-button" disabled={spinning} onClick={() => setTaken(new Set())}>
            Restore all
          </button>
        )}
      </div>
      <p className="hint">Tap the slots you've already won in game, here or on the wheel, to take them off it.</p>
      <ol className="wheel-rewards">
        {wheel.rewards.map(([itemId, qty], i) => (
          <li key={i} className={`${i === wheel.fixed && fixedApplies ? "fixed" : ""} ${taken.has(i) ? "taken" : ""}`}>
            <button type="button" aria-pressed={taken.has(i)} onClick={() => toggle(i)} disabled={spinning} title={taken.has(i) ? "Won · tap to put back" : "Tap if you've won this"}>
              <span className="slot">{taken.has(i) ? "✓" : i + 1}</span>
              {items[itemId]?.icon ? <img src={iconUrl(items[itemId].icon)} alt="" /> : <span className="no-icon" />}
              <span>
                {name(itemId)} <b>×{qty}</b>
                <small>{taken.has(i) ? "Won" : pct(each)}</small>
              </span>
              {i === wheel.fixed && fixedApplies && <em>First</em>}
            </button>
          </li>
        ))}
      </ol>
      <p className="hint">Simulated spins use equal odds per remaining slot; real results come from the game.</p>
    </div>
  );
}
