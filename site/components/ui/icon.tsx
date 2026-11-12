import { grand, petit } from "@neume-icons/svg/data";
import { type Compact, decode, path, pick } from "@neume-icons/svg/render";
import { cn } from "@/lib/cn";

interface IconProps {
  /**
   * Le glyphe rendu : tout nom de Neume. REQUISE et sans défaut, pour la raison de `brand` sur `Logo` :
   * ce sont deux dessins, et un défaut afficherait silencieusement le mauvais.
   *
   * L'UNION EST GÉNÉRÉE, PAS ÉCRITE : `npm run icons:names` la recopie des `names` du paquet installé,
   * avec le `type` et les `options` du manifeste. Elle reste écrite EN CLAIR parce que `optionsRule`
   * la confronte au manifeste terme pour terme, et `neumeSourceRule` au paquet : un alias de type
   * échapperait au premier contrôle (loi 11).
   */
  name:
    | "arrow-up"
    | "arrow-down"
    | "arrow-left"
    | "arrow-right"
    | "arrow-up-right"
    | "arrow-up-left"
    | "arrow-down-left"
    | "arrow-down-right"
    | "chevron-up"
    | "chevron-down"
    | "chevron-left"
    | "chevron-right"
    | "chevrons-up-down"
    | "chevrons-left"
    | "chevrons-right"
    | "corner-down-left"
    | "undo"
    | "redo"
    | "refresh"
    | "external-link"
    | "sort"
    | "plus"
    | "minus"
    | "close"
    | "check"
    | "edit"
    | "trash"
    | "copy"
    | "clipboard"
    | "download"
    | "upload"
    | "share"
    | "link"
    | "unlink"
    | "search"
    | "filter"
    | "settings"
    | "more-horizontal"
    | "more-vertical"
    | "menu"
    | "grip"
    | "maximize"
    | "minimize"
    | "zoom-in"
    | "zoom-out"
    | "save"
    | "print"
    | "log-in"
    | "log-out"
    | "info"
    | "alert-triangle"
    | "alert-circle"
    | "check-circle"
    | "x-circle"
    | "help-circle"
    | "badge-check"
    | "loader"
    | "dot"
    | "bell"
    | "bell-off"
    | "lock"
    | "unlock"
    | "shield"
    | "eye"
    | "eye-off"
    | "star"
    | "star-filled"
    | "heart"
    | "bookmark"
    | "flag"
    | "thumbs-up"
    | "thumbs-down"
    | "mail"
    | "message"
    | "send"
    | "phone"
    | "at-sign"
    | "inbox"
    | "reply"
    | "mic"
    | "mic-off"
    | "video"
    | "file"
    | "file-text"
    | "file-plus"
    | "folder"
    | "folder-open"
    | "image"
    | "film"
    | "music"
    | "code"
    | "terminal"
    | "book"
    | "newspaper"
    | "archive"
    | "paperclip"
    | "type"
    | "bold"
    | "italic"
    | "underline"
    | "align-left"
    | "align-center"
    | "align-right"
    | "list-ordered"
    | "quote"
    | "user"
    | "users"
    | "user-plus"
    | "user-circle"
    | "id-card"
    | "glasses"
    | "calendar"
    | "clock"
    | "alarm-clock"
    | "timer"
    | "hourglass"
    | "history"
    | "home"
    | "building"
    | "pin"
    | "map"
    | "globe"
    | "compass"
    | "navigation"
    | "car"
    | "plane"
    | "briefcase"
    | "chart-bar"
    | "chart-line"
    | "chart-pie"
    | "trending-up"
    | "trending-down"
    | "activity"
    | "target"
    | "trophy"
    | "lightbulb"
    | "rocket"
    | "key"
    | "wrench"
    | "credit-card"
    | "shopping-bag"
    | "shopping-cart"
    | "wallet"
    | "receipt"
    | "tag"
    | "percent"
    | "gift"
    | "package"
    | "truck"
    | "store"
    | "play"
    | "pause"
    | "stop"
    | "skip-back"
    | "skip-forward"
    | "rewind"
    | "fast-forward"
    | "shuffle"
    | "repeat"
    | "volume"
    | "volume-off"
    | "headphones"
    | "camera"
    | "layout"
    | "grid"
    | "list"
    | "columns"
    | "sidebar"
    | "table"
    | "layers"
    | "sliders"
    | "toggle"
    | "window"
    | "square"
    | "check-square"
    | "circle"
    | "hash"
    | "contrast"
    | "palette"
    | "brush"
    | "pen-tool"
    | "wand"
    | "crop"
    | "scissors"
    | "droplet"
    | "monitor"
    | "smartphone"
    | "laptop"
    | "watch"
    | "keyboard"
    | "command"
    | "wifi"
    | "bluetooth"
    | "battery"
    | "battery-charging"
    | "power"
    | "qr-code"
    | "scan"
    | "sun"
    | "sun-filled"
    | "moon"
    | "moon-filled"
    | "cloud-rain"
    | "snowflake"
    | "umbrella"
    | "flame"
    | "leaf"
    | "mountain"
    | "sparkles"
    | "bot"
    | "git-branch"
    | "bug"
    | "cloud"
    | "database"
    | "server"
    | "hard-drive"
    | "cpu"
    | "puzzle"
    | "zap"
    | "gamepad"
    | "ghost"
    | "sword"
    | "crown"
    | "gem"
    | "coin"
    | "dice"
    | "potion"
    | "skull"
    | "cursor-default"
    | "cursor-pointer"
    | "cursor-coin"
    | "cursor-text"
    | "cursor-grab"
    | "cursor-grabbing"
    | "cursor-not-allowed"
    | "cursor-crosshair"
    | "cursor-wait"
    | "linkedin"
    | "figma"
    | "github"
    | "x"
    | "bluesky"
    | "claude"
    | "chatgpt"
    | "dribbble"
    | "behance"
    | "instagram"
    | "youtube"
    | "threads"
    | "discord"
    | "notion";
  /**
   * La taille rendue, en px CSS : 12, 16, 24 ou 48 (loi 5), 24 par défaut. Le DESSIN, lui, n'est pas
   * choisi par l'appel : c'est le calage de Neume qui le prend (docstring du composant).
   */
  size?: 12 | 16 | 24 | 48;
}

/** L'union des glyphes, pour les composants qui en reçoivent un en prop. */
export type IconName = IconProps["name"];

/* Les quatre tailles, une classe chacune, par les jetons `--size-icon-*`. Un objet plutôt qu'un
 * ternaire imbriqué : à quatre crans, la chaîne `a ? x : b ? y : z` cesse de se lire. */
const SIZE_CLASS = {
  12: "size-[var(--size-icon-xs)]",
  16: "size-[var(--size-icon-sm)]",
  24: "size-[var(--size-icon)]",
  48: "size-[var(--size-icon-lg)]",
} as const;

/* Le tracé d'un nom à une taille, calculé une fois par paire et gardé : un `d` ne change pas d'un
 * rendu à l'autre, et `ThemeSelector` en rend quatre à chaque bascule. */
const TRACES = new Map<string, string>();

function trace(name: IconName, size: NonNullable<IconProps["size"]>): string {
  const key = `${name}@${size}`;
  let d = TRACES.get(key);
  if (d === undefined) {
    const small: Compact | undefined = petit[name];
    const { set, k } = pick(size, small !== undefined);
    d = path(decode(set === "petit" && small ? small : grand[name]), k, size);
    TRACES.set(key, d);
  }
  return d;
}

/**
 * Icon — un glyphe de Neume, à 12, 16, 24 ou 48 px. Seul fichier, avec `logo.tsx`, que la loi 5
 * autorise à porter un `<svg>` inline.
 *
 * NEUME EST LA SOURCE UNIQUE, depuis le 2026-11-11 (`docs/specs/2026-11-11-icon-neume-design.md`).
 * Neume (neume.dev, licence MIT) est le set d'icônes de Florian : 251 dessins sur une grille de
 * 12 × 12, dont 228 aussi sur une grille de 8 × 8 pour les petites tailles. Le paquet est une
 * dépendance à VERSION EXACTE — une mise à jour de Neume est un geste délibéré, qui change des
 * dessins sous nos pieds et repasse donc `Icon` en `draft`. Les tracés copiés de Pixelarticons, les
 * relevés de nodes et le glyphe repris du favicon sont sortis le même jour ; leur table et sa
 * docstring sont dans l'histoire, mot pour mot.
 *
 * LE CŒUR, PAS LE PAQUET REACT. `@neume-icons/svg` livre les grilles compactes (`/data`) et la règle
 * de calage (`/render` : `pick`, `decode`, `path`) ; `Icon` en tire un `d` et pose LUI-MÊME le
 * `<svg>`, avec ses classes et ses jetons. `@neume-icons/react` aurait été plus lourd pour rien : un
 * composant par icône, donc les 251 modules importés dès que le nom est une donnée ; un renvoi de ref
 * à l'ancienne et un `useId` par glyphe ; des attributs `width` / `height` et une API de classes et
 * de styles ouverte, que la loi 11 refuse ; et sa dépendance au cœur est en `^0.1.0`, qui ne fige
 * pas la version.
 *
 * LE CALAGE DE NEUME CHOISIT LE DESSIN, et c'est ce qui rend `size` légitime. Une case tombe toujours
 * sur un nombre ENTIER de pixels, et la plus grande version nette qui tient est centrée : à 12, le
 * mini de 8 × 8 à 1 px par case ; à 16, le mini à 2 px par case ; à 24, le grand de 12 × 12 à 2 px ;
 * à 48, le grand à 4 px. Une icône sans mini — les marques — prend son grand à 1 px par case à 12 et
 * à 16. Aucune taille n'est donc la réduction d'un dessin fait pour une autre, et aucune ne bave en
 * densité 1× : la loi 6 tient à toute taille, sans exception. Ce qui reste fermé est la LISTE des
 * tailles, par le type de `size`.
 *
 * DÉCORATIF, TOUJOURS. `aria-hidden` et `focusable="false"` sans condition. Le nom accessible
 * appartient au CONTRÔLE qui contient l'icône, jamais au glyphe : sans cette règle, un bouton icône
 * seule se lirait deux fois à l'assistance. C'est l'articulation de la loi 5 avec la loi 7.
 *
 * SANS COULEUR PROPRE. `fill-current` fait descendre la couleur du parent, qui la pose avec un jeton
 * sémantique : la couleur d'un glyphe change au survol et à la sélection, et la loi 11 interdit qu'un
 * état visuel soit une prop. `Icon` n'a donc aucun jeton de couleur à déclarer.
 *
 * Histoire : `docs/history/icon.md`.
 */
export function Icon({ name, size = 24 }: IconProps) {
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0 fill-current", SIZE_CLASS[size])}
    >
      <path d={trace(name, size)} />
    </svg>
  );
}
