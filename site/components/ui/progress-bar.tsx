import { useId } from "react";
import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** Ce qui avance : « Uploading icons ». Le nom accessible de la barre, à gauche de la valeur. Requis. */
  label: string;
  /**
   * L'avancement, de 0 à 100 ; une valeur hors de l'intervalle est ramenée à ses bornes. Affichée à droite
   * en pourcentage. ABSENT : la barre est indéterminée — un segment glisse en boucle, sans valeur.
   */
  value?: number;
}

/**
 * ProgressBar — une barre de progression : une piste et un remplissage arrondis, un libellé, la valeur à
 * droite. Pour le site de Neume, Consort et le portfolio. Spec :
 * `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2.5, `create`, sans benchmark Mobbin.
 *
 * L'ANATOMIE, CELLE DU PROTOTYPE. Une ligne de texte : le libellé en Geist 14 / 20, graisse moyenne, au primaire,
 * et à droite la valeur au tertiaire, en chiffres tabulaires pour que « 9 % » et « 100 % » ne fassent pas
 * trembler la ligne ; 8 px plus bas, la piste, 8 px de haut, en rayon plein, sur le gris des pistes du système
 * (`--color-progress-track`) ; dedans, le remplissage, à la couleur du texte primaire (`--color-progress-fill`).
 * LA LARGEUR EST CELLE DU PARENT (loi 8).
 *
 * LISSE : Florian a écarté la version « en blocs » du prototype — des cases qui se remplissent une à une, la
 * touche pixel — au profit de la barre lisse. Le remplissage avance en `--duration-base` sur `--ease-out`.
 *
 * INDÉTERMINÉE : `value` absent. Un segment — 30 % de la piste — la traverse de gauche à droite en boucle
 * (`progress-sweep`, `@utility` de `globals.css`, `--duration-progress-sweep`). Sous `prefers-reduced-motion`
 * il reste immobile à gauche : une barre sans valeur et sans mouvement dit encore « en cours » par son
 * libellé. Elle n'a pas de `aria-valuenow`, ce que le rôle `progressbar` définit comme indéterminé.
 *
 * LE RÔLE EST `progressbar`, comme le cadrage le demande, sur un `<div>` : `aria-valuemin`, `aria-valuemax` et
 * `aria-valuenow`, nommé par son libellé (`aria-labelledby`). `<progress>` a la même sémantique, mais il ne se
 * dessine pas avec des tokens sans pseudo-éléments propres à chaque moteur. La valeur est aussi écrite en
 * texte, donc elle ne repose jamais sur la longueur du remplissage seule (loi 7).
 *
 * COMPOSANT SERVEUR : aucune interaction, aucun état. Pas d'état `disabled` : une progression ne se désactive
 * pas.
 *
 * Histoire : `docs/history/progress-bar.md`.
 */
export function ProgressBar({ label, value }: ProgressBarProps) {
  const id = useId();
  const determinate = value !== undefined;
  const percent = determinate ? Math.round(Math.min(100, Math.max(0, value))) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4 font-body text-body-sm">
        <span id={id} className="font-medium text-text-primary">
          {label}
        </span>
        {determinate ? <span className="text-text-tertiary tabular-nums">{percent}%</span> : null}
      </div>
      <div
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={determinate ? percent : undefined}
        className="h-2 overflow-hidden rounded-full bg-progress-track"
      >
        <div
          style={determinate ? { width: `${percent}%` } : undefined}
          className={cn(
            "h-full rounded-full bg-progress-fill",
            determinate
              ? "transition-[width] duration-[var(--duration-base)] ease-out"
              : "progress-sweep",
          )}
        />
      </div>
    </div>
  );
}
