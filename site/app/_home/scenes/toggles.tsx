import { ToggleButton } from "@/components/ui/toggle-button";
import type { IconName } from "@/components/ui/icon";

// Les glyphes que `ToggleButton` accepte sont ceux du composant `Icon` des copies (voir le rapport) :
// les six paires ci-dessous n'ont aucun glyphe en commun, dans les deux états et quel que soit le thème.
const PAIRS: { label: string; icon: IconName; pressedIcon: IconName }[] = [
  { label: "Copy", icon: "copy", pressedIcon: "check" },
  { label: "Menu", icon: "menu", pressedIcon: "close" },
  { label: "Status", icon: "alert-circle", pressedIcon: "check-circle" },
  { label: "Mail", icon: "mail", pressedIcon: "inbox" },
  { label: "Link", icon: "link", pressedIcon: "external-link" },
  { label: "Download", icon: "arrow-down", pressedIcon: "download" },
];

/** « Two states » : des boutons à deux glyphes, dessinés ensemble. */
export function TogglesScene() {
  return (
    <div role="group" aria-label="Two-state buttons" className="grid grid-cols-3 gap-2">
      {PAIRS.map((pair) => (
        <ToggleButton key={pair.label} {...pair} />
      ))}
    </div>
  );
}
