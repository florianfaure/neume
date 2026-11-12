import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Les neuf crans de l'échelle typographique (loi 3), déclarés à `tailwind-merge`.
 *
 * SANS CETTE DÉCLARATION, `cn()` JETTE SILENCIEUSEMENT LES TOKENS DE TAILLE. `tailwind-merge`
 * ne connaît que le thème par défaut de Tailwind : `text-body-sm` et `text-text-primary` lui
 * ressemblent tous les deux à `text-<valeur>`, il les croit donc en conflit et ne garde que le
 * dernier écrit. `Tag` rendait son texte à 16 px au lieu de 14 depuis la tâche 2.1 — la classe
 * `text-body-sm` était supprimée par la fusion, sans erreur ni avertissement, et le nœud
 * retombait sur la métrique de base du document.
 *
 * Trouvé en tâche 3.4 en mesurant la pill de `CursorPill` dans un navigateur : 16 px là où le
 * composant écrit `text-body-sm`. Le défaut ne se voit pas à la lecture du code, ne casse aucune
 * règle de `npm run check` — la classe EST dans le source, c'est la fusion qui la retire — et ne
 * se manifeste que sur les composants qui passent par `cn()`. `ProjectCard` y échappait parce
 * qu'il écrit ses classes en chaînes littérales.
 *
 * Seul le groupe `font-size` est déclaré, et c'est suffisant : l'échelle est une liste FERMÉE
 * de neuf noms posée par la loi 3, alors que les noms de couleur sont ouverts et grandissent
 * avec les composants (loi 10). En sortant les neuf crans du groupe ambigu, un `text-<couleur>`
 * n'a plus rien à quoi entrer en conflit. Un token de couleur ajouté demain n'a donc rien à
 * inscrire ici — ce qui est la seule forme de liste qu'on peut maintenir.
 *
 * Si un cran est ajouté à l'échelle, il s'ajoute ici dans le même geste. Une échelle et une
 * liste de fusion qui divergent produisent exactement ce défaut, en silence.
 */
const TEXT_SCALE = [
  "caption",
  "body-sm",
  "body",
  "body-lg",
  "h4",
  "h3",
  "h2",
  "h1",
  "display",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...TEXT_SCALE] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
