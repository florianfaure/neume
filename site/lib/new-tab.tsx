/**
 * L'affordance « nouvel onglet », écrite UNE fois : les deux attributs du lien et la mention que
 * seul le lecteur d'écran entend.
 *
 * Elle était recopiée dans `Button`, `TextLink`, `StandaloneLink` et `BrandLink`, qui posaient
 * chacun `target="_blank"`, `rel="noopener"` et le même `<span className="sr-only">`. Le
 * 2026-10-22, lot H (spec `2026-10-22-lot-h-hygiene-ds-design` § 6, DS-11), elle est devenue ces
 * deux fonctions. Les quatre composants restent `stable` : `npm run check:refactor` prouve que leur
 * HTML n'a pas bougé. Une règle de `npm run check` (`newTabRule`) refuse tout `target="_blank"`
 * écrit ailleurs que dans ce fichier : la phrase et les attributs n'ont plus de second foyer.
 *
 * `newTabAttributes(newTab)` rend `{ target: "_blank", rel: "noopener" }` quand `newTab` est vrai,
 * et `{ target: undefined, rel: undefined }` sinon — les deux clés restent PRÉSENTES, comme les
 * deux props `target={newTab ? … : undefined}` d'avant. Un objet vide donnerait le même DOM, mais
 * pas le même HTML : le flux RSC de `design-system.html` sérialise chaque prop d'un `<a>` passé à un
 * composant client, `"target":"$undefined"` compris, et `npm run check:refactor` compare ce flux
 * octet pour octet. Il se répand sur la balise `<a>` à la place où `target` et `rel` étaient écrits :
 * `{...newTabAttributes(newTab)}`.
 *
 * `rel="noopener"` ET NON `noreferrer`. Les deux ferment la faille du contexte d'ouverture, mais
 * `noreferrer` supprime en plus l'en-tête `Referer` — or envoyer du trafic référencé vers un site
 * qu'on a livré, ou un dépôt qu'on a écrit, est précisément l'intérêt du lien.
 *
 * `newTabNotice(newTab)` rend le `<span className="sr-only">` quand `newTab` est vrai, `null`
 * sinon. Un nouvel onglet non annoncé désoriente qui navigue au lecteur d'écran : c'est le seul
 * reproche sérieux qu'on puisse faire à `target="_blank"`. L'ESPACE DE TÊTE EST DANS L'EXPRESSION
 * et non dans le JSX, où la compilation le retirerait. La phrase n'est pas un libellé du système :
 * elle est déplacée ici telle qu'elle était, au mot et à l'espace près.
 *
 * `BrandLink`, qui ouvre toujours un nouvel onglet et n'a pas de prop `newTab`, les appelle avec
 * `true`.
 *
 * Ce sont des fonctions de `lib/`, pas des composants : elles ne reçoivent aucune `className` et ne
 * se posent pas dans la vitrine (loi 11).
 */
export function newTabAttributes(newTab: boolean | undefined) {
  return newTab
    ? ({ target: "_blank", rel: "noopener" } as const)
    : ({ target: undefined, rel: undefined } as const);
}

export function newTabNotice(newTab: boolean | undefined) {
  return newTab ? <span className="sr-only">{" (opens in a new tab)"}</span> : null;
}
