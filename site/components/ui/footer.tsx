import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { IconName } from "@/components/ui/icon";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { newTabAttributes, newTabNotice } from "@/lib/new-tab";

interface FooterProps {
  /**
   * `line` (défaut) : un filet, `start` à gauche et `end` à droite — le pied actuel du portfolio.
   * `columns` : `brand` et `lead`, puis les `groups` de liens, puis cette même ligne.
   */
  variant?: "line" | "columns";
  /** Le contenu libre à gauche de la ligne : l'heure d'une ville, un copyright. Requis. */
  start: ReactNode;
  /** Le contenu libre à droite de la ligne. Requis. Il passe sous `start` quand la place manque. */
  end: ReactNode;
  /** `columns` seulement : le contenu libre en tête, un logo posé par l'appelant. Ignoré en `line`. */
  brand?: ReactNode;
  /** `columns` seulement : une phrase sous `brand`. Ignorée en `line`. */
  lead?: string;
  /** `columns` seulement : les groupes de liens, un titre et ses liens chacun. Ignorés en `line`. */
  groups?: { title: string; links: { label: string; href: string; newTab?: boolean }[] }[];
  /**
   * `columns` seulement : une place sous la phrase, pour un formulaire d'inscription fourni par
   * l'appelant. Le composant n'en pose que la place. Ignorée en `line`.
   */
  newsletter?: ReactNode;
  /**
   * `columns` seulement : les réseaux, une rangée de `Button` ghost en icône seule sous la phrase (et
   * sous `newsletter`) — `label` est leur nom accessible et le texte de leur bulle, chacun s'ouvre dans
   * un nouvel onglet. Ignorés en `line`.
   */
  social?: { label: string; href: string; icon: IconName }[];
  /**
   * `columns` seulement : la pièce de fin, sous la ligne du bas — un grand signe, un mot. Le composant
   * la centre, la coupe à 160 px de haut et la fait monter quand on arrive en bas de la page ; sa
   * taille est celle de son contenu. Ignorée en `line`.
   */
  display?: ReactNode;
  /**
   * Un emplacement libre pour une action, un `Button` posé par l'appelant (« View on GitHub »). Facultatif, dans
   * les deux formes. En `line`, à droite de `end`, sur la même ligne ; en `columns`, en dernier de la colonne de
   * gauche, sous les réseaux. Le composant n'en pose que la place.
   */
  action?: ReactNode;
}

/**
 * Footer — le pied de page, en deux formes. Créé le 2026-11-11 (lot 2 du site de Neume, spec
 * `docs/specs/2026-11-11-lot-2-navigation-design.md` § 2.3), `create`, sans benchmark Mobbin (en pause) ;
 * le prototype validé est `protos/lot2`, section « Footer ». Un `<footer>`, serveur, aucune directive.
 *
 * `line` EST LE PIED DU PORTFOLIO, À L'IDENTIQUE — `app/_footer-line.tsx`, que ce composant NE REMPLACE
 * PAS dans ce lot : décision de Florian, « le pied du portfolio ne change pas : mêmes contenus, mêmes
 * typos ». Le portfolio changera à sa propre étape. La ligne a les mêmes classes que `FooterLine` — un
 * filet `--border-thin` en `--color-border-subtle`, 24 px de padding dessous, `start` et `end` alignés
 * sur leur ligne de BASE, 24 px entre eux et 8 px de rang à rang quand la place manque —, et la même
 * typographie, posée sur la ligne et héritée : `font-body`, `text-caption`, tertiaire. Chaque contenu est
 * enveloppé dans un `<div>`, et c'est ce qui permet de passer une simple chaîne : deux chaînes voisines
 * dans un conteneur flex n'en feraient qu'un seul élément anonyme.
 *
 * `columns` : `brand` et `lead` à gauche (la phrase en `text-pretty`, tertiaire), les groupes à droite,
 * puis la même ligne dessous, à 32 px. Un groupe : son titre en `font-body` MOYEN, primaire — le seul
 * rappel de hiérarchie du pied —, puis ses liens en tertiaire, PRIMAIRES AU SURVOL, comme les `NavItem`
 * et le prototype. Le titre est un `<h2>` : un pied à colonnes est un plan de site, et ses groupes se
 * lisent au rotor comme des sections ; les liens sont une liste. Un lien en `newTab` suit la même
 * affordance que partout (`lib/new-tab.tsx`, et le glyphe `external-link` de 16 px après le mot (12 jusqu'au 2026-11-12, trop petit contre le texte)).
 *
 * LES LIENS ONT 24 PX DE HAUT (`py-1` autour d'une ligne de 16), pas 44 : ce sont des liens de texte dans
 * une liste dense, au-dessus du seuil de 24 px de WCAG 2.2 SC 2.5.8, et la loi 5 réserve les 44 px aux
 * contrôles à icône seule. Aucune largeur imposée : le bloc `brand` prend 40 % de la rangée sous `md`
 * et les groupes se replient (`flex-wrap`) quand ils ne tiennent pas ; sous `md` tout s'empile.
 *
 * `brand`, `lead` et `groups` n'ont de sens qu'en `columns`, et `columns` sans eux rend une ligne de
 * colonnes vide : la forme est un seul type plat, parce qu'une union discriminée n'aurait pas été
 * confrontée au manifeste par `npm run check` (loi 11).
 *
 * `newsletter`, `social` et `display` (2026-11-11, spec § 4, après la première validation ; `extend`) sont
 * trois ajouts facultatifs de `columns`. `newsletter` est une place sous la phrase : le composant n'en
 * rend que le conteneur, le champ vient de l'appelant (aucun champ brut ici, loi 9). `social` est une
 * rangée de `Button` ghost en icône seule, la bulle de `Tooltip` portant le `label`, nouvel onglet ;
 * les cibles de 44 px débordent de 4 px, `gap-2` les empêche de se recouvrir (loi 5). La ligne du bas
 * garde `start` et `end` libres.
 *
 * `action` (2026-11-12, `extend`, retour de Florian sur neume.dev : le « View on GitHub » du site détournait la
 * place `newsletter`) est un emplacement libre pour une action — un `Button` de l'appelant, aucun bouton brut ici
 * (loi 9). OÙ IL SE POSE, DANS LES DEUX FORMES : en `line`, à droite de `end`, dans la même rangée — `end` puis
 * l'action, 24 px entre eux, centrés l'un sur l'autre, et le groupe passe sous `start` quand la place manque ; en
 * `columns`, dernier élément de la colonne de gauche, sous la phrase, `newsletter` et les réseaux. Absent, rien
 * ne change dans l'une ni dans l'autre. Il n'est pas ignoré en `line`, à l'inverse de `newsletter`.
 *
 * LA PIÈCE DE FIN, `display`, EST POSÉE ET COUPÉE, JAMAIS DIMENSIONNÉE. Sa taille vient de son contenu —
 * l'appelant sait quel signe il pose, et à quelle taille. Le composant ne fait que trois choses :
 * il la centre, il la COUPE À 160 PX DE HAUT (`h-40`, le pas `space-40` ; la zone coupée, c'est ça) et
 * il la fait monter. Le contenu est aligné sur le HAUT de la zone et déborde vers le bas, où
 * `overflow-hidden` le rogne : un signe de 380 px de haut montre ses 160 premiers pixels. Pour la
 * poser contre le bas de la page, l'appelant ne met aucun padding sous le pied.
 *
 * COMMENT ELLE MONTE : EN CSS PUR, SANS JAVASCRIPT, donc le composant reste serveur. La zone porte une
 * `view-timeline` nommée (`footer-display-zone`) ; la pièce, enveloppée dans un bloc de la hauteur de la
 * zone, lit cette ligne de temps (`footer-display-rise`) et passe de « toute entière sous la zone »
 * (`translate: 0 100%`) à sa place, tant que la zone entre dans la fenêtre par le bas — de `entry 0%`
 * à `entry 100%`. C'est l'état de la page qui la pose, pas une durée : on remonte, elle redescend.
 * Les deux `@utility` sont dans `globals.css`, avec leur `@keyframes`, et n'emploient aucun token : une
 * interpolation linéaire liée au défilement n'a ni durée ni courbe. REPLI : l'animation n'est posée que
 * sous `@supports (animation-timeline: view())` et `prefers-reduced-motion: no-preference` ; ailleurs
 * — navigateur sans `view()`, mouvement réduit — rien n'est animé et la pièce est posée à sa place, sans
 * mouvement. (Les durées du système ramenées à 1 ms par le mouvement réduit ne concernent pas une
 * ligne de temps de défilement : d'où la garde explicite.)
 *
 * Histoire : `docs/history/footer.md`.
 */
export function Footer({
  variant = "line",
  start,
  end,
  brand,
  lead,
  groups = [],
  newsletter,
  social,
  display,
  action,
}: FooterProps) {
  const line = (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-6",
        "border-t-[length:var(--border-thin)] border-border-subtle",
        "font-body text-caption text-text-tertiary",
      )}
    >
      <div>{start}</div>
      {action ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>{end}</div>
          <div>{action}</div>
        </div>
      ) : (
        <div>{end}</div>
      )}
    </div>
  );

  if (variant === "line") return <footer>{line}</footer>;

  return (
    <footer className="flex flex-col gap-12">
      <div className="flex flex-col gap-12 md:flex-row md:justify-between">
        <div className="flex flex-col gap-8 md:w-2/5">
          <div className="flex flex-col gap-4">
            <div>{brand}</div>
            <p className="text-pretty font-body text-body text-text-secondary">{lead}</p>
          </div>
          {newsletter ? <div>{newsletter}</div> : null}
          {social && social.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {social.map((item, index) => (
                <li key={`${index}-${item.href}`}>
                  <Button
                    variant="ghost"
                    content="icon"
                    label={item.label}
                    icon={item.icon}
                    href={item.href}
                    newTab
                  />
                </li>
              ))}
            </ul>
          ) : null}
          {action ? <div>{action}</div> : null}
        </div>
        <div className="flex flex-wrap gap-x-16 gap-y-8 md:flex-1 md:justify-end">
          {groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h2 className="font-body text-body-sm font-medium text-text-primary">
                {group.title}
              </h2>
              <ul className="flex flex-col">
                {group.links.map((link, index) => (
                  // Deux liens d'un groupe peuvent viser la même adresse : la clé ne s'appuie pas sur elle seule.
                  <li key={`${index}-${link.href}`}>
                    <a
                      href={link.href}
                      {...newTabAttributes(link.newTab)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm py-1",
                        "font-body text-body-sm text-text-tertiary",
                        "transition-[color] duration-[var(--duration-fast)] ease-out",
                        "hover:text-text-primary active:text-text-primary",
                        "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
                      )}
                    >
                      <span>{link.label}</span>
                      {newTabNotice(link.newTab)}
                      {link.newTab ? <Icon name="external-link" size={16} /> : null}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {line}
      {display ? (
        <div className="footer-display-zone h-40 overflow-hidden">
          <div className="footer-display-rise flex h-full justify-center">{display}</div>
        </div>
      ) : null}
    </footer>
  );
}
