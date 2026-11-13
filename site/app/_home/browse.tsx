"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip-group";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/search-field";
import { Slider } from "@/components/ui/slider";
import { Tile } from "@/components/ui/tile";
import type { Theme } from "@/data/themes";
import { cn } from "@/lib/cn";
import { NeumeIcon } from "@/lib/neume";
import { SIZES } from "@neume-icons/svg/render";
import { ISSUES_URL } from "../_shell/links";


interface BrowseProps {
  /** Les thèmes avec les seules icônes qui correspondent à la recherche. */
  themes: Theme[];
  totalIcons: number;
  query: string;
  onQueryChange: (query: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  onOpen: (name: string) => void;
}

/**
 * « Browse the icons » : la barre d'outils (recherche, taille, thèmes) qui se compacte et se colle en
 * descendant, et reprend sa forme en remontant ; puis la grille par thème. Un clic sur une tuile remonte
 * à la page, qui ouvre la fiche.
 */
export function Browse({ themes, totalIcons, query, onQueryChange, size, onSizeChange, onOpen }: BrowseProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [compact, setCompact] = useState(false);
  const [active, setActive] = useState("all");

  const visible = themes.filter((t) => t.icons.length > 0);
  const shown = visible.reduce((sum, t) => sum + t.icons.length, 0);

  // Le défilement : la barre colle quand la sentinelle est passée ; elle se compacte en descendant et se
  // déplie en remontant, avec une hystérésis de 24 px (une inertie qui tremble ne la fait pas clignoter) ;
  // le thème sous la barre est celui que la rangée de puces allume. Sous `md` la barre ne se compacte pas :
  // ses deux rangées s'empilent dans le flux, et en changer la hauteur ferait sauter la page.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    let base = window.scrollY;
    let folded = false;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const isStuck = (sentinel.current?.getBoundingClientRect().top ?? 1) < 0;
      setStuck(isStuck);
      if (!isStuck || !wide.matches) {
        folded = false;
        base = y;
      } else if (!folded) {
        base = Math.min(base, y);
        if (y - base > 24) {
          folded = true;
          base = y;
        }
      } else {
        base = Math.max(base, y);
        if (base - y > 24) {
          folded = false;
          base = y;
        }
      }
      setCompact(folded);

      const bar = sentinel.current?.nextElementSibling;
      const line = (bar?.getBoundingClientRect().bottom ?? 0) + 16;
      let current = "all";
      if (isStuck) {
        for (const section of document.querySelectorAll<HTMLElement>("[data-theme-section]")) {
          if (section.getBoundingClientRect().top <= line) current = section.dataset.themeSection ?? current;
        }
      }
      setActive(current);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [themes]);

  // La puce du thème courant reste visible dans la rangée : on fait défiler le défileur de `ChipGroup`
  // lui-même, jamais la page (`scrollIntoView` aurait tiré la fenêtre vers la barre).
  useEffect(() => {
    const label = chips.current?.querySelector<HTMLInputElement>(`input[value="${active}"]`)?.closest("label");
    let scroller = label?.parentElement ?? null;
    while (scroller && scroller.scrollWidth <= scroller.clientWidth) scroller = scroller.parentElement;
    if (!label || !scroller || scroller === document.body) return;
    const left = label.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
    scroller.scrollTo({ left: left - scroller.clientWidth / 4, behavior: "smooth" });
  }, [active]);

  const goTo = (value: string) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target =
      value === "all" ? sentinel.current : document.querySelector<HTMLElement>(`[data-theme-section="${value}"]`);
    if (!target) return;
    setActive(value);
    const offset = value === "all" ? 0 : 96;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const label = active === "all" ? "All icons" : (themes.find((t) => t.id === active)?.label ?? "All icons");

  return (
    <section id="icons" aria-labelledby="browse-title" className="flex scroll-mt-0 flex-col pt-24">
      <header className="flex max-w-[var(--site-lede-width)] flex-col gap-2 pb-2">
        <h2 id="browse-title" className="font-pixel text-h2 font-normal text-text-primary">
          Browse the icons
        </h2>
        <p className="font-body text-body text-text-secondary">
          {totalIcons} icons in {themes.length} themes. Pick one for its SVG, its JSX and its import.
        </p>
      </header>

      <div ref={sentinel} aria-hidden="true" className="h-px" />
      <div
        data-stuck={stuck ? "" : undefined}
        data-compact={compact ? "" : undefined}
        className="pointer-events-none sticky top-[var(--nav-bar-offset)] z-[var(--z-raised)] -mx-[var(--layout-gutter)] transition-[top] duration-[var(--duration-base)] ease-out md:pb-12"
      >
        {/* La hauteur dans le flux ne change jamais : la rangée du haut a la sienne, la rangée des thèmes
            est posée dans la place qu'on lui réserve dessous (`pb-12`) et se retire sans la libérer. */}
        <div className="pointer-events-auto relative border-b-[length:var(--border-thin)] border-transparent bg-surface px-[var(--layout-gutter)] transition-[border-color] duration-[var(--duration-base)] ease-out in-data-[stuck]:border-border-subtle">
          <div className="flex flex-wrap items-center gap-2 py-3 md:h-16 md:flex-nowrap">
            <span aria-hidden="true" className="site-where font-pixel text-body text-text-primary">
              {label}
            </span>
            <div className="min-w-0 flex-1 basis-full md:basis-0 md:max-w-[var(--site-search-width)]">
              <SearchField
                label="Search icons"
                placeholder="Search icons"
                shortcut="/"
                value={query}
                onValueChange={onQueryChange}
              />
            </div>
            <div className="w-full md:ml-auto md:w-[var(--site-slider-width)]">
              <Slider
                label="Icon size"
                steps={SIZES}
                value={size}
                onValueChange={onSizeChange}
                formatValueText={(value) => `${value} pixels`}
              />
            </div>
          </div>
          <div
            inert={compact}
            className={cn(
              "bg-surface px-[var(--layout-gutter)] max-md:-mx-[var(--layout-gutter)]",
              "md:absolute md:inset-x-0 md:top-full md:h-12",
              "border-b-[length:var(--border-thin)] border-transparent in-data-[stuck]:border-border-subtle",
              "transition-[opacity,translate,border-color] duration-[var(--duration-base)] ease-out",
              compact && "pointer-events-none -translate-y-2 opacity-0",
            )}
          >
            <div ref={chips} className="py-1">
              <ChipGroup
                label="Themes"
                items={[
                  { value: "all", label: "All", count: shown },
                  ...themes.map((t) => ({
                    value: t.id,
                    label: t.label,
                    count: t.icons.length,
                    disabled: t.icons.length === 0,
                  })),
                ]}
                value={visible.some((t) => t.id === active) ? active : "all"}
                onValueChange={goTo}
              />
            </div>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {shown} {shown === 1 ? "icon" : "icons"}
      </p>

      {shown === 0 ? (
        <EmptyState
          icon="search"
          title={`No icon matches “${query.trim()}”`}
          description="Try another word, or tell us which icon is missing."
          actions={
            <>
              <Button variant="secondary" label="Clear search" onClick={() => onQueryChange("")} />
              <Button
                variant="ghost"
                label="Suggest an icon"
                href={ISSUES_URL}
                newTab
              />
            </>
          }
        />
      ) : (
        visible.map((theme) => (
          <section
            key={theme.id}
            id={`t-${theme.id}`}
            data-theme-section={theme.id}
            aria-labelledby={`h-${theme.id}`}
            className="scroll-mt-24 pt-8"
          >
            <h3
              id={`h-${theme.id}`}
              className="mb-3 flex items-baseline gap-2 font-pixel text-body-lg font-normal text-text-primary"
            >
              {theme.label}
              <span className="font-body text-body-sm text-text-tertiary">{theme.icons.length}</span>
            </h3>
            <div className="site-tile-grid gap-2">
              {theme.icons.map((name) => (
                <Tile key={name} label={name} onClick={() => onOpen(name)}>
                  <NeumeIcon name={name} size={size} />
                </Tile>
              ))}
            </div>
          </section>
        ))
      )}
    </section>
  );
}
