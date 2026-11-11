import { AlarmClock, ArrowRight, Heart, Search, Star } from "@neume-icons/react";

import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/ui/nav-bar";
import { NavItem } from "@/components/ui/nav-item";
import { ThemeSelector } from "@/components/ui/theme-selector";

// Page d'essai du temps 1 : elle prouve que la chaîne tient (tokens, polices, copies, paquet local,
// bascule clair/sombre) et sera remplacée par l'accueil. Les icônes viennent de @neume-icons/react,
// pas du composant Icon des copies.
const SIZES = [12, 16, 24, 48] as const;

export default function Page() {
  return (
    <>
      <NavBar
        brand={<span className="font-pixel text-h4 text-text-primary">Neume</span>}
        brandLabel="Neume"
        label="Main"
        actions={<ThemeSelector />}
      >
        <NavItem label="Docs" href="/docs" />
        <NavItem label="Changelog" href="/changelog" />
      </NavBar>

      <main className="flex flex-col gap-12 px-6 py-16 md:px-16">
        <h1 className="font-pixel text-display text-text-primary">Pixel icons, drawn by hand.</h1>

        <section aria-label="Icon sizes" className="flex flex-col gap-4">
          {[Star, Heart, Search, AlarmClock, ArrowRight].map((IconComponent, i) => (
            <div key={i} className="flex items-end gap-8 text-text-primary">
              {SIZES.map((size) => (
                <IconComponent key={size} size={size} />
              ))}
            </div>
          ))}
        </section>

        <div>
          <Button label="Button" href="#" />
        </div>
      </main>
    </>
  );
}
