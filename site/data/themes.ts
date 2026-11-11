// Les données du catalogue de neume.dev : propres au site, les paquets n'en ont pas besoin.
// Un thème par icône (les 251 sont couvertes ; `npm run check` du dépôt n'a pas à le vérifier, le
// site filtre sur les icônes qui existent) et quelques mots de plus pour la recherche.

import { grand } from "@neume-icons/svg/data";

const RAW_THEMES: readonly (readonly [string, string])[] = [
  ["Navigation", "arrow-up arrow-down arrow-left arrow-right arrow-up-right arrow-up-left arrow-down-left arrow-down-right chevron-up chevron-down chevron-left chevron-right chevrons-up-down chevrons-left chevrons-right corner-down-left undo redo refresh external-link sort"],
  ["Actions", "plus minus close check edit trash copy clipboard download upload share link unlink search filter settings more-horizontal more-vertical menu grip maximize minimize zoom-in zoom-out save print log-in log-out"],
  ["Status", "info alert-triangle alert-circle check-circle x-circle help-circle badge-check loader dot bell bell-off lock unlock shield eye eye-off star star-filled heart bookmark flag thumbs-up thumbs-down"],
  ["Communication", "mail message send phone at-sign inbox reply mic mic-off video"],
  ["Files", "file file-text file-plus folder folder-open image film music code terminal book newspaper archive paperclip"],
  ["Text", "type bold italic underline align-left align-center align-right list-ordered quote"],
  ["People", "user users user-plus user-circle id-card glasses"],
  ["Time", "calendar clock alarm-clock timer hourglass history"],
  ["Places", "home building pin map globe compass navigation car plane"],
  ["Work", "briefcase chart-bar chart-line chart-pie trending-up trending-down activity target trophy lightbulb rocket key wrench"],
  ["Commerce", "credit-card shopping-bag shopping-cart wallet receipt tag percent gift package truck store"],
  ["Media", "play pause stop skip-back skip-forward rewind fast-forward shuffle repeat volume volume-off headphones camera"],
  ["Interface", "layout grid list columns sidebar table layers sliders toggle window square check-square circle hash contrast"],
  ["Creative", "palette brush pen-tool wand crop scissors droplet"],
  ["Devices", "monitor smartphone laptop watch keyboard command wifi bluetooth battery battery-charging power qr-code scan"],
  ["Weather & nature", "sun sun-filled moon moon-filled cloud-rain snowflake umbrella flame leaf mountain"],
  ["Dev & AI", "sparkles bot git-branch bug cloud database server hard-drive cpu puzzle zap"],
  ["Games", "gamepad ghost sword crown gem coin dice potion skull"],
  ["Cursors", "cursor-default cursor-pointer cursor-coin cursor-text cursor-grab cursor-grabbing cursor-not-allowed cursor-crosshair cursor-wait"],
  ["Brands", "linkedin figma github x bluesky claude chatgpt dribbble behance instagram youtube threads discord notion"],
];

export interface Theme {
  label: string;
  id: string;
  icons: string[];
}

export const THEMES: Theme[] = RAW_THEMES.map(([label, list]) => ({
  label,
  id: label.toLowerCase().replace(/[^a-z]+/g, "-"),
  icons: list.split(" ").filter((name) => name in grand),
}));

/** Des mots de plus pour la recherche, qui ne s'affichent pas. */
export const KEYWORDS: Record<string, string> = {
  trash: "delete remove bin",
  close: "x cancel dismiss",
  edit: "pencil write",
  settings: "gear cog preferences",
  home: "house",
  search: "find magnifier",
  heart: "like love favorite",
  star: "favorite rate",
  mail: "email envelope",
  user: "person account profile",
  users: "team group people",
  "log-out": "sign out exit",
  "log-in": "sign in enter",
  loader: "spinner loading",
  "more-horizontal": "ellipsis dots",
  menu: "hamburger",
  pin: "location map marker",
  calendar: "date event",
  clock: "time",
  lock: "secure password",
  eye: "show visible",
  "eye-off": "hide hidden",
  sun: "light theme",
  moon: "dark theme night",
  bell: "notification alert",
  message: "chat comment",
  sparkles: "ai magic",
  bot: "ai robot",
  zap: "lightning flash fast",
  refresh: "reload sync",
  share: "export send",
};
