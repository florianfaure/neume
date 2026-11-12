import { useEffect, useRef, useState } from "react";

/**
 * La MODALITÉ DU FOCUS d'un champ de saisie texte : arrivé au clavier, ou arrivé à un pointeur. C'est le
 * mécanisme de `SearchField` (exception du 2026-11-06 de la loi 4, `.claude/rules/loi-04-etats.md`),
 * écrit ici une seconde fois pour `TextField` et `SubscribeForm` — `SearchField`, stable, n'est pas
 * touché pour l'occasion, et garde sa copie.
 *
 * La dernière interaction avec la page est relevée en phase de capture sur le document : un `pointerdown`
 * dit « pointeur », un `keydown` dit « clavier ». À l'arrivée du focus, le champ la lit : `keyboardFocus`
 * est vrai si elle était clavier, faux sinon, et retombe à faux au départ du focus. Le composant en fait un
 * `data-keyboard-focus` sur sa pastille, qui porte le contour. Tab, Maj+Tab et un raccourci de `Kbd` l'allument ;
 * un clic dans le champ, non.
 *
 * Lot 3 du site de Neume, 2026-11-11 (spec `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2.1).
 */
export function useKeyboardFocus() {
  const byPointer = useRef(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);

  useEffect(() => {
    const onPointer = () => {
      byPointer.current = true;
    };
    const onKey = () => {
      byPointer.current = false;
    };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  return {
    keyboardFocus,
    onFocus: () => setKeyboardFocus(!byPointer.current),
    onBlur: () => setKeyboardFocus(false),
  };
}
