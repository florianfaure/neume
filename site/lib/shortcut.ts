import { useSyncExternalStore } from "react";

/**
 * Le vocabulaire des raccourcis du système, écrit UNE fois pour `Kbd` (qui les affiche et les écoute) et
 * `SearchField` (qui les annonce en `aria-keyshortcuts`). Le 2026-11-11, anonymisation pour Consort
 * (décision de Florian, spec `docs/specs/2026-11-11-anonymisation-design.md` § 2) : `Kbd` accepte tout
 * raccourci, et ce fichier est ce qui les lit.
 *
 * UN RACCOURCI S'ÉCRIT EN COMBINAISON : de zéro à trois modificateurs — `mod`, `ctrl`, `alt`, `shift` —
 * puis UNE touche, liés par `+` : `"/"`, `"mod+k"`, `"shift+?"`, `"escape"`, `"mod+shift+p"`. `mod` est
 * le modificateur de commande de la plateforme : ⌘ sur Mac, Ctrl ailleurs. `ctrl` est toujours Ctrl.
 *
 * LE TYPE EST UN GABARIT LITTÉRAL, PAS UNE UNION FERMÉE, ET C'EST UNE EXCEPTION ASSUMÉE À LA LOI 11 :
 * ses membres sont les combinaisons possibles, des milliers, qu'aucun `options` de manifeste ne peut
 * énumérer « en entier ». Elle reste fermée au sens qui compte : TypeScript refuse `"cmd+k"` ou `"k+mod"`
 * à la compilation, et `parseShortcut` refuse le reste à l'exécution. Le champ `type` du manifeste
 * écrit le gabarit en clair, sans `options`.
 */
export type ShortcutModifier = "mod" | "ctrl" | "alt" | "shift";

type Letter =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Symbol =
  | "/"
  | "?"
  | "."
  | ","
  | ";"
  | ":"
  | "'"
  | '"'
  | "["
  | "]"
  | "{"
  | "}"
  | "("
  | ")"
  | "-"
  | "_"
  | "="
  | "+"
  | "!"
  | "@"
  | "#"
  | "$"
  | "%"
  | "&"
  | "*"
  | "<"
  | ">"
  | "|"
  | "~";
type NamedKey =
  | "escape"
  | "enter"
  | "tab"
  | "space"
  | "backspace"
  | "delete"
  | "up"
  | "down"
  | "left"
  | "right"
  | "home"
  | "end"
  | "pageup"
  | "pagedown";
type FunctionKey = `f${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`;
type ShortcutKey = Letter | Digit | Symbol | NamedKey | FunctionKey;

type Mod = ShortcutModifier;
export type ShortcutKeys =
  | ShortcutKey
  | `${Mod}+${ShortcutKey}`
  | `${Mod}+${Mod}+${ShortcutKey}`
  | `${Mod}+${Mod}+${Mod}+${ShortcutKey}`;

/** Un raccourci lu : ses modificateurs, et sa touche telle que `event.key` la dit, en minuscules. */
export interface ParsedShortcut {
  mod: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
}

/** Le nom écrit → la valeur de `event.key` en minuscules. `+` est une touche comme une autre, en dernier. */
const EVENT_KEY: Record<NamedKey, string> = {
  escape: "escape",
  enter: "enter",
  tab: "tab",
  space: " ",
  backspace: "backspace",
  delete: "delete",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  home: "home",
  end: "end",
  pageup: "pageup",
  pagedown: "pagedown",
};

const MODIFIERS: ShortcutModifier[] = ["mod", "ctrl", "alt", "shift"];

export function parseShortcut(keys: string): ParsedShortcut {
  /* La touche est le dernier élément ; `"mod++"` est la touche `+`. */
  const last = keys.endsWith("+") ? keys.length - 1 : keys.lastIndexOf("+") + 1;
  const written = keys.slice(0, last).split("+").filter(Boolean);
  const name = keys.slice(last);
  const parsed: ParsedShortcut = { mod: false, ctrl: false, alt: false, shift: false, key: "" };
  for (const part of written) {
    if (!(MODIFIERS as string[]).includes(part))
      throw new Error(`Raccourci illisible : « ${keys} »`);
    parsed[part as ShortcutModifier] = true;
  }
  parsed.key = EVENT_KEY[name as NamedKey] ?? name.toLowerCase();
  return parsed;
}

export const isMacPlatform = () => {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform || navigator.userAgent);
};

const subscribeNever = () => () => {};
const readIsMac = () => isMacPlatform();
const readNotMac = () => false;

/**
 * Vrai sur Mac. Lu côté client SEULEMENT : le serveur et le premier rendu d'hydratation disent « pas Mac »,
 * puis le client se corrige — la même mécanique que `canShare` de `ShareButton`. Une touche `mod` s'écrit
 * donc « Ctrl » dans le HTML statique et « ⌘ » une fois la page vivante, sur Mac.
 */
export function useIsMac() {
  return useSyncExternalStore(subscribeNever, readIsMac, readNotMac);
}

const isSymbol = (key: string) => key.length === 1 && !/[a-z0-9]/.test(key);

/**
 * La frappe est-elle ce raccourci ? Les modificateurs sont EXACTS : Cmd, Ctrl et Alt tenus ou non comme
 * le raccourci l'écrit — `"k"` ne répond pas à Cmd + K. Une exception, sur Maj : pour une touche de
 * ponctuation, Maj n'est pas lu, parce que c'est elle qui la produit sur certains claviers (`/` se tape
 * Maj + `:` sur un AZERTY de Mac) ; `"shift+?"` répond donc à `?` quel que soit le geste qui le tape.
 * Pour une lettre, un chiffre ou une touche nommée, Maj est exact. Sous Alt, Mac écrit un autre
 * caractère (Option + K donne « ˚ ») : la lettre est alors lue par sa position, `event.code`.
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: ParsedShortcut, isMac: boolean) {
  const wantMeta = shortcut.mod && isMac;
  const wantCtrl = shortcut.ctrl || (shortcut.mod && !isMac);
  if (event.metaKey !== wantMeta || event.ctrlKey !== wantCtrl || event.altKey !== shortcut.alt) {
    return false;
  }
  if (!isSymbol(shortcut.key) && event.shiftKey !== shortcut.shift) return false;
  if (event.key.toLowerCase() === shortcut.key) return true;
  if (event.altKey && /^[a-z]$/.test(shortcut.key))
    return event.code === `Key${shortcut.key.toUpperCase()}`;
  if (event.altKey && /^[0-9]$/.test(shortcut.key)) return event.code === `Digit${shortcut.key}`;
  return false;
}

/** Le raccourci s'écrit-il avec Cmd ou Ctrl ? Alors il vaut aussi depuis un champ éditable (voir `Kbd`). */
export function usesCommandKey(shortcut: ParsedShortcut) {
  return shortcut.mod || shortcut.ctrl;
}

const KEY_CAP: Record<string, string> = {
  escape: "Esc",
  enter: "↵",
  tab: "Tab",
  " ": "Space",
  backspace: "⌫",
  delete: "Del",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  home: "Home",
  end: "End",
  pageup: "PgUp",
  pagedown: "PgDn",
};

/**
 * Les touches à dessiner, une par élément, dans l'ordre où le raccourci est écrit. Sur Mac, les symboles
 * de la plateforme — ⌘ ⇧ ⌥ — ; ailleurs, les mots que le clavier porte — Ctrl, Shift, Alt. Les lettres
 * sont en capitales, comme gravées ; les touches nommées prennent leur symbole (↵ ← → ↑ ↓) ou leur
 * abréviation (Esc).
 */
export function keyCaps(keys: string, isMac: boolean): string[] {
  const shortcut = parseShortcut(keys);
  const caps: string[] = [];
  const written = keys.slice(0, keys.endsWith("+") ? keys.length - 1 : keys.lastIndexOf("+") + 1);
  for (const part of written.split("+").filter(Boolean)) {
    if (part === "mod") caps.push(isMac ? "⌘" : "Ctrl");
    else if (part === "ctrl") caps.push("Ctrl");
    else if (part === "alt") caps.push(isMac ? "⌥" : "Alt");
    else caps.push(isMac ? "⇧" : "Shift");
  }
  caps.push(KEY_CAP[shortcut.key] ?? shortcut.key.toUpperCase());
  return caps;
}

const ARIA_KEY: Record<string, string> = {
  " ": "Space",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  pageup: "PageUp",
  pagedown: "PageDown",
};

/**
 * Le raccourci dans la syntaxe d'`aria-keyshortcuts` : « Meta+K » sur Mac pour `mod+k`, « Control+K »
 * ailleurs, « Shift+? », « Escape ». `/` donne `/`, comme `SearchField` le posait avant.
 */
export function ariaKeyShortcuts(keys: string, isMac: boolean) {
  const shortcut = parseShortcut(keys);
  const parts: string[] = [];
  if (shortcut.mod || shortcut.ctrl) {
    if (shortcut.mod && isMac) parts.push("Meta");
    if (shortcut.ctrl || (shortcut.mod && !isMac)) parts.push("Control");
  }
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  const key =
    ARIA_KEY[shortcut.key] ??
    (shortcut.key.length > 1
      ? shortcut.key[0].toUpperCase() + shortcut.key.slice(1)
      : shortcut.key);
  parts.push(key);
  return parts.join("+");
}
