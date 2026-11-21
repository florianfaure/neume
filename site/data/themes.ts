// Les données du catalogue de neume.dev : propres au site, les paquets n'en ont pas besoin.
// Un thème par icône (les 513 sont couvertes ; `npm run check` du dépôt n'a pas à le vérifier, le
// site filtre sur les icônes qui existent) et quelques mots de plus pour la recherche.

import { grand } from "@neume-icons/svg/data";

const RAW_THEMES: readonly (readonly [string, string])[] = [
  ["Navigation", "arrow-up arrow-down arrow-left arrow-right arrow-up-right arrow-up-left arrow-down-left arrow-down-right chevron-up chevron-down chevron-left chevron-right chevrons-up-down chevrons-left chevrons-right corner-down-left undo redo refresh external-link sort chevrons-up chevrons-down arrow-up-down arrow-left-right corner-up-left corner-up-right corner-down-right move expand shrink rotate-cw rotate-ccw swap caret-up caret-down caret-left caret-right arrow-up-circle arrow-down-circle arrow-left-circle arrow-right-circle"],
  ["Actions", "plus minus close check clipboard-list trash copy clipboard download upload share link unlink search filter settings more-horizontal more-vertical menu grip maximize minimize zoom-in zoom-out save print log-in log-out plus-circle minus-circle plus-square minus-square x-square check-check ban import export cloud-download cloud-upload fullscreen fullscreen-exit clipboard-check"],
  ["Status", "info alert-triangle alert-circle check-circle x-circle help-circle badge-check loader dot bell bell-off lock unlock shield eye eye-off star heart bookmark flag thumbs-up thumbs-down bell-ring bell-plus alert-octagon shield-check shield-alert fingerprint star-half heart-broken bookmark-plus bookmark-check"],
  ["Communication", "mail message send phone at-sign inbox reply mic mic-off video mail-open message-circle message-square messages phone-call phone-off video-off megaphone rss podcast forward reply-all smile frown meh laugh"],
  ["Files", "file file-text file-plus folder folder-open image film music code terminal book newspaper archive paperclip file-check file-x file-code file-image file-zip folder-plus folders notebook sticky-note book-open library"],
  ["Text", "type bold italic underline align-left align-center align-right list-ordered quote strikethrough heading heading-1 heading-2 heading-3 align-justify list-checks indent outdent text-cursor highlighter paragraph translate"],
  ["People", "user users user-plus user-circle id-card glasses user-minus user-check user-x contact accessibility hand hand-wave footprints"],
  ["Time", "calendar clock alarm-clock timer hourglass history calendar-plus calendar-check calendar-x stopwatch"],
  ["Places", "home building pin map globe compass navigation car plane map-pin route signpost bus train bike ship fuel anchor tent bed door factory school hospital bank"],
  ["Work", "briefcase chart-bar chart-line chart-pie trending-up trending-down activity target trophy lightbulb rocket key wrench chart-area gauge funnel calculator scale"],
  ["Commerce", "credit-card shopping-bag shopping-cart wallet receipt tag percent gift package truck store basket cart-plus box dollar euro bitcoin banknote piggy-bank barcode ticket"],
  ["Media", "play pause stop skip-back skip-forward rewind fast-forward shuffle repeat volume volume-off headphones camera play-circle pause-circle record eject volume-low volume-high tv speaker disc clapperboard image-plus aperture"],
  ["Interface", "layout grid list columns sidebar table layers sliders toggle window square check-square circle hash contrast sidebar-right panel-bottom panel-top rows kanban tabs toggle-off radio progress circle-dot circle-dashed slash equal divide asterisk infinity"],
  ["Creative", "palette brush pen-tool wand crop scissors droplet pencil eraser pipette paint-bucket ruler shapes triangle hexagon diamond frame"],
  ["Devices", "monitor smartphone laptop watch keyboard command wifi bluetooth battery battery-charging power qr-code scan tablet mouse usb router webcam plug cable battery-low battery-full power-off signal cast"],
  ["Weather & nature", "sun moon cloud-rain snowflake umbrella flame leaf mountain sunrise sunset cloud-sun cloud-moon cloud-snow cloud-lightning wind thermometer rainbow tree flower sprout paw fish bird cat dog bone"],
  ["Dev & AI", "sparkles bot git-branch bug cloud database server hard-drive cpu puzzle zap braces brackets git-commit git-merge git-pull-request git-fork webhook container variable function workflow flask"],
  ["Games", "gamepad ghost sword crown gem coin dice potion skull joystick bow wand-sparkles bomb chest scroll alien ufo invader medal castle"],
  ["Food & drink", "coffee pizza burger apple carrot egg cake cookie ice-cream beer wine utensils"],
  ["Objects", "lamp flashlight candle bucket broom backpack luggage shirt hat bandage pill syringe stethoscope dumbbell ball whistle"],
  ["Tools", "hammer pickaxe axe screwdriver saw drill pliers shovel trowel paint-roller stamp anvil gavel spool nut toolbox magnet ladder"],
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
  pencil: "edit write",
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
