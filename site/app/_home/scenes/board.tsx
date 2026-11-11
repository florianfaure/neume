"use client";

import { useEffect, useMemo, useState } from "react";

import { PixelPreview } from "@/components/ui/pixel-preview";
import { drawingOf, pascal } from "@/lib/neume";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const NAMES = ["heart", "sparkles", "bot", "music", "rocket", "star", "bell", "zap", "puzzle", "gift", "home", "bug"];

/** Le dessin tel qu'il est après `count` cases posées, dans l'ordre de lecture. */
function partial(rows: readonly string[], count: number) {
  let left = count;
  return rows.map((row) =>
    [...row]
      .map((cell) => {
        if (cell !== "#") return ".";
        if (left === 0) return ".";
        left -= 1;
        return "#";
      })
      .join(""),
  );
}

/** « Drawn square by square » : le grand dessin se pose case par case, un clic passe au suivant. */
export function BoardScene() {
  const reduced = useReducedMotion();
  const [state, setState] = useState({ index: 0, count: 0 });
  const name = NAMES[state.index];
  const drawing = useMemo(() => drawingOf(name), [name]);
  const total = useMemo(() => drawing.rows.join("").replaceAll(".", "").length, [drawing]);

  useEffect(() => {
    if (reduced) return;
    let hold: ReturnType<typeof setTimeout> | undefined;
    let count = 0;
    const tick = setInterval(() => {
      if (count < total) {
        count += 1;
        setState((s) => ({ ...s, count }));
        return;
      }
      clearInterval(tick);
      hold = setTimeout(
        () => setState((s) => ({ index: (s.index + 1) % NAMES.length, count: 0 })),
        1800,
      );
    }, 28);
    return () => {
      clearInterval(tick);
      clearTimeout(hold);
    };
  }, [state.index, total, reduced]);

  const shown = reduced ? total : state.count;

  return (
    <button
      type="button"
      onClick={() => setState((s) => ({ index: (s.index + 1) % NAMES.length, count: 0 }))}
      className="flex flex-col items-center gap-4 rounded-2xl focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring"
    >
      <span className="sr-only">Draw the next icon</span>
      <PixelPreview
        rows={partial(drawing.rows, shown)}
        offset={drawing.offset as readonly [0 | 1, 0 | 1]}
        label={`${name}, 12 × 12 cells`}
      />
      <span aria-hidden="true" className="font-code text-caption text-text-tertiary">
        {`<${pascal(name)} />`}
      </span>
    </button>
  );
}
