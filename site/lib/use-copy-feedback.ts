import { useEffect, useRef, useState } from "react";

/**
 * Le délai avant que le retour de copie s'efface (le check redevient une enveloppe, « Copied! »
 * redevient « Copy link »). Décision de Florian.
 *
 * CE N'EST PAS UN TOKEN, et la raison est celle que `CopyEmailButton` et `ShareButton` écrivaient
 * chacun pour leur copie de la constante : la couche de tokens alimente CSS et rien en CSS ne lit ce
 * délai ; l'audit ascendant de la loi 10 déclarerait MORT un token que seul `getComputedStyle`
 * récupérerait ; et une durée d'ATTENTE n'est pas une durée de TRANSITION — les `--duration-*` du
 * système décrivent des mouvements. Le prix est nommé : cette valeur n'apparaît pas sur
 * `/design-system/tokens`. Le jour où un composant a besoin d'un autre délai de retour, c'est le
 * moment d'en faire un token (loi 10).
 */
const COPIED_RESET_MS = 2000;

/**
 * useCopyFeedback — la séquence « copier, le dire, l'oublier », écrite UNE fois.
 *
 * Elle vivait en double dans `CopyEmailButton` et `ShareButton` : `navigator.clipboard.writeText`, le
 * drapeau `copied` à vrai, la minuterie précédente annulée, le retour à faux deux secondes plus
 * tard, la minuterie annulée au démontage. Le 2026-10-22, lot H (spec
 * `2026-10-22-lot-h-hygiene-ds-design` § 6, DS-11), elle est devenue ce hook. Les deux composants
 * restent `stable` : `npm run check:refactor` prouve que leur HTML n'a pas bougé.
 *
 * `copy(text)` ÉCRIT DANS LE PRESSE-PAPIERS, et l'ÉCHEC NE BASCULE RIEN : `navigator.clipboard`
 * exige un contexte sécurisé et peut être refusé par l'utilisateur, `copied` reste alors à faux et le
 * bouton reste une enveloppe, ce qui est la vérité. Aucune erreur n'est levée ni renvoyée —
 * l'appelant n'a rien à faire d'un échec dont la seule suite possible est « ne rien dire ».
 *
 * LA MINUTERIE EST DANS UNE REF ET ANNULÉE AU DÉMONTAGE. Sans l'annulation, un `setState` partirait
 * vers un composant démonté ; sans la ref, deux copies rapprochées laisseraient deux minuteries
 * courir, et la première effacerait le retour alors que la seconde vient de copier.
 *
 * `reset()` ÉTEINT LE RETOUR SUR-LE-CHAMP — minuterie annulée, `copied` à faux. `ShareButton` l'appelle à
 * la réouverture de sa popin : pas de « Copied! » qui survit à une fermeture.
 *
 * C'est un hook CLIENT (état, effet, API navigateur), rangé dans `lib/` et non dans `components/ui/` :
 * il ne rend rien, ne reçoit aucune `className` et n'est donc pas un composant au sens de la loi 11.
 */
export function useCopyFeedback() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => {
    if (timer.current !== null) clearTimeout(timer.current);
  };

  useEffect(() => cancel, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }

    setCopied(true);
    cancel();
    timer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  };

  const reset = () => {
    cancel();
    setCopied(false);
  };

  return { copied, copy, reset };
}
