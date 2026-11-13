"use client";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/ui/nav-bar";
import { NavItem } from "@/components/ui/nav-item";
import { ThemeSelector } from "@/components/ui/theme-selector";
import { REPO_URL } from "./links";

/** La barre de neume.dev, la même sur toutes les pages. `onSearch` ouvre la palette (⌘K), `onRequest` la demande d'icône. */
export function SiteNav({ onSearch, onRequest }: { onSearch: () => void; onRequest: () => void }) {
  return (
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
            icon="lightbulb"
            label="Request an icon"
            onClick={onRequest}
          />
          <Button
            variant="ghost"
            content="icon-label"
            icon="search"
            label="Search"
            onClick={onSearch}
          />
          <ThemeSelector />
        </>
      }
    >
      <NavItem label="Docs" href="/docs" />
      <NavItem label="Changelog" href="/changelog" />
    </NavBar>
  );
}
