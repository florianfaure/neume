import type { IconName } from "@/components/ui/icon";
import { ToggleButton } from "@/components/ui/toggle-button";

// Les paires que Neume livre, dessinées ensemble : aucun glyphe n'apparaît deux fois, quel que soit le thème.
const PAIRS: { label: string; icon: IconName; pressedIcon: IconName }[] = [
  { label: "Favorite", icon: "star", pressedIcon: "star-filled" },
  { label: "Hide", icon: "eye", pressedIcon: "eye-off" },
  { label: "Mute microphone", icon: "mic", pressedIcon: "mic-off" },
  { label: "Mute notifications", icon: "bell", pressedIcon: "bell-off" },
  { label: "Lock", icon: "lock", pressedIcon: "unlock" },
  { label: "Dark mode", icon: "sun", pressedIcon: "moon" },
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
