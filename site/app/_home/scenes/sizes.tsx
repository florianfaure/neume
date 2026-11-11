"use client";

import { useEffect, useRef, useState } from "react";

import { Slider } from "@/components/ui/slider";
import { hasMini, NeumeIcon } from "@/lib/neume";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { pick, SIZES } from "@neume-icons/svg/render";

const NAME = "sparkles";

/** « Crisp at every size » : le curseur de taille, et la version du dessin qui tient à cette taille. */
export function SizesScene() {
  const reduced = useReducedMotion();
  const [size, setSize] = useState(24);
  const [touched, setTouched] = useState(false);
  const direction = useRef(1);

  useEffect(() => {
    if (reduced || touched) return;
    const tick = setInterval(() => {
      setSize((current) => {
        let index = SIZES.indexOf(current) + direction.current;
        if (index >= SIZES.length || index < 0) {
          direction.current *= -1;
          index += 2 * direction.current;
        }
        return SIZES[index];
      });
    }, 650);
    return () => clearInterval(tick);
  }, [reduced, touched]);

  const { set, k } = pick(size, hasMini(NAME));
  const grid = set === "petit" ? 8 : 12;

  return (
    <div className="flex w-full max-w-[var(--site-scene-width)] flex-col items-center gap-4">
      <div className="site-dots flex size-24 items-center justify-center rounded-2xl text-text-primary">
        <NeumeIcon name={NAME} size={size} />
      </div>
      <p className="flex gap-2 font-body text-caption tabular-nums" aria-live="off">
        <span className="text-text-primary">{size} px</span>
        <span className="text-text-tertiary">
          {grid} × {grid} cells, {k} px each
        </span>
      </p>
      <div className="w-full">
        <Slider
          label="Size"
          steps={SIZES}
          value={size}
          onValueChange={(value) => {
            setTouched(true);
            setSize(value);
          }}
          formatValueText={(value) => `${value} pixels`}
        />
      </div>
    </div>
  );
}
