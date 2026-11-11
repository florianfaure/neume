import { ToggleButton } from "@/components/ui/toggle-button";
import type { IconName } from "@/components/ui/icon";

// Les glyphes que `ToggleButton` accepte sont ceux du composant `Icon` des copies (voir le rapport) :
// les paires ci-dessous sont celles qui existent dans les deux états.
const PAIRS: { label: string; icon: IconName; pressedIcon: IconName }[] = [
  { label: "Dark mode", icon: "sun", pressedIcon: "moon" },
  { label: "Night", icon: "moon", pressedIcon: "moon-filled" },
  { label: "Day", icon: "sun", pressedIcon: "sun-filled" },
  { label: "Copy", icon: "copy", pressedIcon: "check" },
  { label: "Menu", icon: "menu", pressedIcon: "close" },
  { label: "Link", icon: "link", pressedIcon: "check" },
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
