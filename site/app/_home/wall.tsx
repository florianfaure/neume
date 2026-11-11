"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { THEMES } from "@/data/themes";
import { NeumeIcon } from "@/lib/neume";
import { useReducedMotion } from "@/lib/use-reduced-motion";

// Le mur du hero : tous les thèmes sauf les marques et les curseurs, qui ne sont pas des motifs.
const POOL = THEMES.filter((t) => t.id !== "brands" && t.id !== "cursors").flatMap((t) => t.icons);
const pickRandom = () => POOL[Math.floor(Math.random() * POOL.length)];

interface CellState {
  name: string;
  /** Change à chaque redessin : la clé qui relance l'animation. */
  turn: number;
}

const Cell = memo(function Cell({ name, turn }: CellState) {
  return (
    <span className="flex items-center justify-center text-text-tertiary opacity-[var(--site-wall-opacity)] transition-[opacity,color] duration-[var(--duration-slow)] ease-out data-[lit]:text-text-primary data-[lit]:opacity-100 data-[lit]:duration-[var(--duration-fast)]">
      <span key={turn} className={turn > 0 ? "site-cell-draw flex" : "flex"}>
        <NeumeIcon name={name} />
      </span>
    </span>
  );
});

/** La mesure d'une cellule en pixels, lue sur le token `--site-wall-cell` (une valeur en rem). */
function cellSize(host: HTMLElement) {
  const ruler = document.createElement("span");
  ruler.style.width = "var(--site-wall-cell)";
  ruler.style.position = "absolute";
  host.append(ruler);
  const size = ruler.offsetWidth;
  ruler.remove();
  return size;
}

/**
 * Le mur d'icônes derrière le hero : des cellules qui se redessinent d'elles-mêmes, et que le pointeur
 * allume. Décoratif (`aria-hidden`) ; un objet à usage unique, donc écrit ici et non dans le système.
 * Il se remplit après le montage : le hasard n'a pas à passer par le HTML du serveur.
 */
export function Wall({ host }: { host: RefObject<HTMLElement | null> }) {
  const reduced = useReducedMotion();
  const wall = useRef<HTMLDivElement>(null);
  const [cells, setCells] = useState<CellState[]>([]);

  // Combien de cellules remplissent le mur, recalculé quand sa taille change.
  useEffect(() => {
    const node = wall.current;
    if (!node) return;
    const fill = () => {
      const unit = cellSize(node) || 1;
      const count = (Math.ceil(node.clientWidth / unit) + 1) * (Math.ceil(node.clientHeight / unit) + 1);
      setCells((current) =>
        Math.abs(current.length - count) <= 8 && current.length > 0
          ? current
          : Array.from({ length: count }, () => ({ name: pickRandom(), turn: 0 })),
      );
    };
    fill();
    const observer = new ResizeObserver(fill);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Trois cellules se redessinent toutes les 700 ms.
  useEffect(() => {
    if (reduced) return;
    const tick = setInterval(() => {
      setCells((current) => {
        if (current.length === 0) return current;
        const next = [...current];
        for (let i = 0; i < 3; i += 1) {
          const index = Math.floor(Math.random() * next.length);
          next[index] = { name: pickRandom(), turn: next[index].turn + 1 };
        }
        return next;
      });
    }, 700);
    return () => clearInterval(tick);
  }, [reduced]);

  // Le pointeur allume les cellules proches : des attributs posés dans le DOM, pas un état par cellule.
  useEffect(() => {
    const section = host.current;
    const node = wall.current;
    if (!section || !node) return;
    const clear = () => node.querySelectorAll("[data-lit]").forEach((c) => c.removeAttribute("data-lit"));
    const move = (event: PointerEvent) => {
      const unit = cellSize(node);
      const reach = unit * Number.parseFloat(getComputedStyle(node).getPropertyValue("--site-wall-reach"));
      for (const cell of node.children) {
        const box = cell.getBoundingClientRect();
        const distance = Math.hypot(box.left + box.width / 2 - event.clientX, box.top + box.height / 2 - event.clientY);
        if (distance < reach) cell.setAttribute("data-lit", "");
        else cell.removeAttribute("data-lit");
      }
    };
    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", clear);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", clear);
    };
  }, [host]);

  return (
    <div ref={wall} aria-hidden="true" className="site-wall absolute inset-0">
      {cells.map((cell, index) => (
        <Cell key={index} name={cell.name} turn={cell.turn} />
      ))}
    </div>
  );
}
