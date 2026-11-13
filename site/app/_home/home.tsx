"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { THEMES, KEYWORDS } from "@/data/themes";
import { SiteFooter } from "../_shell/site-footer";
import { SiteNav } from "../_shell/site-nav";
import { REPO_URL } from "../_shell/links";
import { useSiteLayers } from "../_shell/use-site-layers";
import { AskAi } from "./ask-ai";
import { Browse } from "./browse";
import { Features } from "./features";
import { Hero, INSTALL_COMMAND } from "./hero";

const TOTAL = THEMES.reduce((sum, t) => sum + t.icons.length, 0);

/** La recherche du catalogue : le nom ou un mot de plus de `KEYWORDS`, sans casse. */
function filterThemes(query: string) {
  const q = query.trim().toLowerCase();
  const match = (name: string) => !q || name.includes(q) || (KEYWORDS[name] ?? "").includes(q);
  return THEMES.map((theme) => ({ ...theme, icons: theme.icons.filter(match) }));
}

/**
 * L'accueil de neume.dev : la barre, le hero, les cartes, le catalogue, le pied — et les deux couches
 * globales de `useSiteLayers`, la palette (⌘K) et la fiche d'icône, qui suit l'ordre du catalogue filtré
 * et copie à la taille de son curseur.
 */
export function Home() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState(24);

  const themes = useMemo(() => filterThemes(query), [query]);
  const order = useMemo(() => themes.flatMap((t) => t.icons), [themes]);
  const { openPalette, openIcon, openRequest, layers } = useSiteLayers(order, size);

  return (
    <>
      <SiteNav onSearch={openPalette} onRequest={() => openRequest()} />

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
            onOpen={openIcon}
            onRequest={openRequest}
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
            <AskAi />
          </section>
          <div className="mt-32">
            <SiteFooter />
          </div>
        </div>
      </main>

      {layers}
    </>
  );
}
