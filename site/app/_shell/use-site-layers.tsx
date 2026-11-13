"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { CommandPalette } from "@/components/ui/command-palette";
import { RequestDialog } from "./request-dialog";
import type { CommandPaletteGroup } from "@/components/ui/command-palette";
import { IconSheet } from "@/components/ui/icon-sheet";
import type { IconName } from "@/components/ui/icon";
import { KEYWORDS, THEMES } from "@/data/themes";
import { drawingOf, importOf, jsxOf, svgOf } from "@/lib/neume";
import { toast } from "@/lib/toast";
import { INSTALL_COMMAND } from "../_home/hero";
import { REPO_URL } from "./links";

type Offset = readonly [0 | 1, 0 | 1];

const THEME_OF = new Map(THEMES.flatMap((t) => t.icons.map((name) => [name, t.label] as const)));

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(INSTALL_COMMAND);
    toast({ title: "Command copied", description: INSTALL_COMMAND, tone: "positive" });
  } catch {
    toast({
      title: "Could not copy",
      description: "Select the command and copy it by hand.",
      tone: "negative",
    });
  }
}

/**
 * Les deux couches globales de neume.dev, la palette (⌘K) et la fiche d'icône, qui se parlent par l'état
 * de la page. `order` est l'ordre que suivent suivant / précédent dans la fiche (sur l'accueil, celui du
 * catalogue filtré) ; `size` est la taille du SVG et du JSX que la fiche copie.
 */
export function useSiteLayers(
  order: readonly string[],
  size: number,
): {
  openPalette: () => void;
  openIcon: (name: string) => void;
  openRequest: (name?: string) => void;
  layers: ReactNode;
} {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  const openIcon = (name: string) => {
    setCurrent(name);
    setSheetOpen(true);
  };

  const groups = useMemo<CommandPaletteGroup[]>(
    () => [
      {
        label: "Pages",
        items: [
          { label: "Docs", icon: "file-text" as const, href: "/docs" },
          { label: "Changelog", icon: "history" as const, href: "/changelog" },
        ],
      },
      {
        label: "Actions",
        items: [
          { label: "Copy the install command", icon: "copy" as const, onSelect: copyCommand },
          {
            label: "Switch theme",
            icon: "moon" as const,
            keywords: ["dark", "light", "mode"],
            onSelect: () =>
              document.querySelector<HTMLInputElement>('input[name="theme"]:not(:checked)')?.click(),
          },
          { label: "Open GitHub", icon: "external-link" as const, href: REPO_URL, newTab: true },
        ],
      },
      {
        label: "Icons",
        items: THEMES.flatMap((t) =>
          t.icons.map((name) => ({
            label: name,
            icon: name as IconName,
            meta: t.label,
            keywords: (KEYWORDS[name] ?? "").split(" ").filter(Boolean),
            onSelect: () => {
              setCurrent(name);
              setSheetOpen(true);
            },
          })),
        ),
      },
    ],
    [],
  );

  const index = current ? order.indexOf(current) : -1;
  const step = (by: number) => setCurrent(order[(index + by + order.length) % order.length]);
  const big = current ? drawingOf(current) : undefined;

  const layers = (
    <>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={groups}
        placeholder="Search icons, pages and actions…"
      />

      <RequestDialog open={requestOpen} onOpenChange={setRequestOpen} initialName={requestName} />

      {current && big ? (
        <IconSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          name={current}
          tag={THEME_OF.get(current)}
          rows={big.rows}
          offset={big.offset as Offset}
          importLine={importOf(current)}
          svg={svgOf(current, size)}
          jsx={jsxOf(current, size)}
          onPrevious={index >= 0 && order.length > 1 ? () => step(-1) : undefined}
          onNext={index >= 0 && order.length > 1 ? () => step(1) : undefined}
        />
      ) : null}
    </>
  );

  const openRequest = (name?: string) => {
    if (name) setRequestName(name);
    setRequestOpen(true);
  };

  return { openPalette: () => setPaletteOpen(true), openIcon, openRequest, layers };
}
