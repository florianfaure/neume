import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { newTabAttributes, newTabNotice } from "@/lib/new-tab";

interface NavItemProps {
  /** Le mot du lien, qui est aussi son nom accessible. Requis. */
  label: string;
  /** Où mène le lien. Requis : un lien de navigation navigue, et HTML n'a pas de lien désactivé. */
  href: string;
  /**
   * La page courante : pose `aria-current="page"` et RIEN D'AUTRE. Aucun changement visuel — le lien
   * courant est gris comme les autres. Décision de Florian du 2026-11-11 ; voir la docstring.
   */
  current?: boolean;
  /** Ouvre le lien dans un nouvel onglet, avec la mention `sr-only` de `lib/new-tab.tsx` et le glyphe `external-link-xs` après le mot. */
  newTab?: boolean;
}

/**
 * NavItem — un lien de navigation, un mot en `font-pixel`. Créé le 2026-11-11 (lot 2 du site de
 * Neume, spec `docs/specs/2026-11-11-lot-2-navigation-design.md` § 2.1), `create`, sans benchmark
 * Mobbin (en pause). COPIÉ SUR LES ONGLETS DE `Tab` pour le geste, sur `TextLink` pour la balise :
 * `<a href>`, serveur, aucune directive.
 *
 * LE GESTE EST CELUI DE `Tab` : tertiaire au repos, PRIMAIRE AU SURVOL, en transition de couleur
 * (`--duration-fast`, `--ease-out`), et `--scale-press` au clic comme `Tab` et `Button`. Le survol suit
 * donc le focus clavier — l'anneau du système — comme les onglets, sans condition particulière : un
 * lien n'a pas d'état désactivé, donc rien à retirer au survol (lot 1, § 4 : « pas de survol sur un
 * contrôle désactivé »).
 *
 * LA PAGE COURANTE N'EST PAS MISE EN AVANT — décision de Florian du 2026-11-11, après avoir vu deux
 * versions au prototype : le premier jet portait la graisse et le noir de l'onglet ouvert de `Tab`, et
 * une variante à pastille grise ; il a retiré les deux, « grise comme les autres ». `current` pose
 * `aria-current="page"` pour l'assistance seulement. C'est une entorse assumée à la loi 7 — « aucune
 * information portée par le seul niveau de gris » — qui n'en est pas une : l'information n'est plus
 * portée VISUELLEMENT du tout, elle l'est par l'attribut. Ne pas rouvrir ce choix en ajoutant une
 * graisse ou un fond sous `current` : Florian l'a vu et l'a refusé.
 *
 * LA CIBLE FAIT 44 PX DE HAUT (`--size-touch-target`, loi 5), le mot centré, 12 px de padding de
 * chaque côté : un lien de navigation est un contrôle de barre, pas un lien de prose, et sa zone de
 * clic ne dépend pas de la hauteur du mot. Pas de calque de pointage : la hauteur est la vraie.
 *
 * `newTab` : `target="_blank"`, `rel="noopener"` et la mention en `sr-only` viennent de
 * `lib/new-tab.tsx`, avec `external-link-xs` (12 px, loi 5) après le mot, à 4 px. Aucun `cursor-pointer` :
 * le curseur est une décision de site (`@layer base` de `globals.css`).
 *
 * Sous `prefers-reduced-motion`, `globals.css` ramène les durées à 1 ms et `--scale-press` à 1.
 *
 * Histoire : `docs/history/nav-item.md`.
 */
export function NavItem({ label, href, current, newTab }: NavItemProps) {
  return (
    <a
      href={href}
      aria-current={current ? "page" : undefined}
      {...newTabAttributes(newTab)}
      className={cn(
        "inline-flex h-[var(--size-touch-target)] items-center gap-1 rounded-full px-3",
        "font-pixel text-body-sm font-normal text-text-tertiary",
        "transition-[color,scale] duration-[var(--duration-fast)] ease-out",
        "hover:text-text-primary",
        "active:scale-[var(--scale-press)]",
        "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
      )}
    >
      <span>{label}</span>
      {newTabNotice(newTab)}
      {newTab ? <Icon name="external-link-xs" /> : null}
    </a>
  );
}
