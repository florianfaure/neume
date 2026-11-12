"use client";

import { useMemo, useState } from "react";

import { BrandLockup, BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { CommandPalette } from "@/components/ui/command-palette";
import type { CommandPaletteGroup } from "@/components/ui/command-palette";
import { Footer } from "@/components/ui/footer";
import { IconSheet } from "@/components/ui/icon-sheet";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";
import { NavBar } from "@/components/ui/nav-bar";
import { NavItem } from "@/components/ui/nav-item";
import { ThemeSelector } from "@/components/ui/theme-selector";
import { KEYWORDS, THEMES } from "@/data/themes";
import { drawingOf, importOf, jsxOf, miniOf, svgOf } from "@/lib/neume";
import { toast } from "@/lib/toast";
import { Browse, REPO_URL } from "./browse";
import { Features } from "./features";
import { Hero, INSTALL_COMMAND } from "./hero";

const NPM_URL = "https://www.npmjs.com/package/@neume-icons/react";
const TOTAL = THEMES.reduce((sum, t) => sum + t.icons.length, 0);
const THEME_OF = new Map(THEMES.flatMap((t) => t.icons.map((name) => [name, t.label] as const)));

type Offset = readonly [0 | 1, 0 | 1];

/** La recherche du catalogue : le nom ou un mot de plus de `KEYWORDS`, sans casse. */
function filterThemes(query: string) {
  const q = query.trim().toLowerCase();
  const match = (name: string) => !q || name.includes(q) || (KEYWORDS[name] ?? "").includes(q);
  return THEMES.map((theme) => ({ ...theme, icons: theme.icons.filter(match) }));
}

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
 * L'accueil de neume.dev : la barre, le hero, les cartes, le catalogue, le pied — et les deux couches
 * globales, la palette (⌘K) et la fiche d'icône, qui se parlent par l'état de la page.
 */
export function Home() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [size, setSize] = useState(24);

  const themes = useMemo(() => filterThemes(query), [query]);
  const order = useMemo(() => themes.flatMap((t) => t.icons), [themes]);

  const openSheet = (name: string) => {
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
  const mini = current ? miniOf(current) : undefined;
  const big = current ? drawingOf(current) : undefined;

  return (
    <>
      <NavBar
        behavior="auto-hide"
        align="content"
        brand={<BrandMark className="size-8 text-text-primary" />}
        brandLabel="Neume"
        label="Main"
        actions={
          <>
            {/* Le nombre d'étoiles : le dépôt est privé, le compte relevé au build viendra au lancement.
                Il se posera ici, dans le libellé ou à côté du bouton. */}
            <Button
              variant="ghost"
              content="icon-label"
              icon="github"
              label="GitHub"
              href={REPO_URL}
              newTab
            />
            <Button
              variant="ghost"
              content="icon-label"
              icon="search"
              label="Search"
              onClick={() => setPaletteOpen(true)}
            />
            <ThemeSelector />
          </>
        }
      >
        <NavItem label="Docs" href="/docs" />
        <NavItem label="Changelog" href="/changelog" />
      </NavBar>

      <main>
        <Hero total={TOTAL} />
        <div className="mx-auto flex w-full max-w-[var(--site-max-width)] flex-col px-[var(--layout-gutter)]">
          <Features />
          <Browse
            themes={themes}
            totalIcons={TOTAL}
            query={query}
            onQueryChange={setQuery}
            size={size}
            onSizeChange={setSize}
            onOpen={openSheet}
          />
          <section
            aria-labelledby="closing-title"
            className="mt-32 flex flex-col items-center gap-6 text-center"
          >
            <h2
              id="closing-title"
              className="max-w-[var(--site-hero-copy-width)] text-balance font-pixel text-h1 font-normal text-text-primary"
            >
              Drop it into your next interface
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <CodeBlock code={INSTALL_COMMAND} label="Copy command" />
              <Button
                variant="secondary"
                content="icon-label"
                icon="github"
                size="large"
                label="Star on GitHub"
                href={REPO_URL}
                newTab
              />
            </div>
          </section>
          <div className="mt-32">
            <Footer
              variant="columns"
              brand={<BrandLockup />}
              lead="A pixel icon set drawn square by square, for React and plain SVG."
              groups={[
                {
                  title: "Neume",
                  links: [
                    { label: "Icons", href: "#icons" },
                    { label: "Docs", href: "/docs" },
                    { label: "Changelog", href: "/changelog" },
                  ],
                },
                {
                  title: "Elsewhere",
                  links: [
                    { label: "npm", href: NPM_URL, newTab: true },
                    { label: "GitHub", href: REPO_URL, newTab: true },
                  ],
                },
              ]}
              social={[{ label: "GitHub", href: REPO_URL, icon: "github" }]}
              start="MIT licence"
              end={
                <span className="inline-flex items-center gap-2">
                  <Icon name="edit" size={16} />
                  Drawn by Florian Faure
                </span>
              }
              display={
                <BrandMark className="size-[var(--site-footer-mark-size)] text-list-highlight" />
              }
            />
          </div>
        </div>
      </main>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={groups}
        placeholder="Search icons, pages and actions…"
      />

      {current && big ? (
        <IconSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          name={current}
          tag={THEME_OF.get(current)}
          rows={big.rows}
          offset={big.offset as Offset}
          petit={mini ? { rows: mini.rows, offset: mini.offset as Offset } : undefined}
          importLine={importOf(current)}
          svg={svgOf(current, size)}
          jsx={jsxOf(current, size)}
          onPrevious={index >= 0 && order.length > 1 ? () => step(-1) : undefined}
          onNext={index >= 0 && order.length > 1 ? () => step(1) : undefined}
        />
      ) : null}
    </>
  );
}
