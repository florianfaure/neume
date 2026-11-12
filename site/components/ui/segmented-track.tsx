"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";

interface SegmentedTrackProps {
  /**
   * Les options de la rangée, rendues telles quelles par-dessus la pastille. Chacune doit être
   * un ENFANT DIRECT de la piste et porter elle-même le marqueur de sa sélection —
   * `aria-selected="true"` ou un champ `:checked` en descendant —, puisque c'est là que le
   * composant la lit (voir « IL LIT LA SÉLECTION » plus bas).
   */
  children: ReactNode;
  /**
   * Relayé sur la piste. Union fermée, élargie le 2026-11-11 (anonymisation pour Consort, spec
   * `docs/specs/2026-11-11-anonymisation-design.md` § 2) : `"tablist"` pour `Tab`, qui pose le sien ;
   * `"radiogroup"` et `"group"` pour qui range des radios ou des boutons sur la même piste. Une piste
   * qui porte un rôle porte aussi son nom (`aria-label`). `ThemeSelector` n'en pose aucun — son
   * `<fieldset>` et sa `<legend>` restent autour.
   */
  role?: "tablist" | "radiogroup" | "group";
  /** Relayé sur la piste : le nom accessible de la rangée quand elle porte un rôle. */
  "aria-label"?: string;
  /**
   * La surface de la rangée. `"track"` (défaut, l'existant) : la piste grise, sa marge de 4 px et une
   * pastille BLANCHE. `"none"` : ni fond ni marge, et la pastille est GRISE — elle n'a plus de piste
   * sur laquelle se détacher en blanc. Ajoutée le 2026-11-11 (lot 1 du site de Neume, spec
   * `2026-11-11-lot-1-petits-controles-design.md` § 2.4) pour `ChipGroup`, dont les chips se
   * posent sur la page ; le glissement reste le sien.
   */
  surface?: "track" | "none";
  /**
   * Vers la piste. `ThemeSelector` en a besoin : son recalage à l'hydratation cherche ses radios
   * par elle ; `Tab` aussi, pour y poser `data-gesture` (voir « LE GESTE PEUT VENIR DE
   * L'APPELANT »). Une prop ordinaire en React 19, comme la loi 11 le veut.
   */
  ref?: Ref<HTMLDivElement>;
}

/**
 * L'option choisie : l'ENFANT DIRECT de la piste qui porte `aria-selected="true"` (le `<button
 * role="tab">` de `Tab`) ou qui contient un champ coché (le `<label>` de `ThemeSelector`). La
 * pastille est elle aussi un enfant direct, mais elle ne porte ni l'un ni l'autre.
 */
const SELECTED = ':scope > [aria-selected="true"], :scope > :has(:checked)';

/**
 * SegmentedTrack — la piste d'une rangée d'options et la pastille unique qui glisse sous l'option
 * choisie. Cadré avec Florian : « background des tabs se déplace entre les choix de
 * tab avec une animation smooth ». Spec : `docs/specs/2026-10-07-pastille-glissante-design.md`.
 *
 * IL EST NÉ D'UN DOUBLON. La classe de la piste était écrite deux fois, dans `Tab` et dans
 * `ThemeSelector`, et chacun peignait le fond de SON option choisie. Une pastille qui GLISSE ne peut
 * plus être peinte par l'option : elle doit exister une seule fois, au-dessus de toutes. La mettre
 * dans chacun des deux aurait écrit la mécanique deux fois ; l'ancrage CSS (`anchor-name`) aurait
 * supprimé la mesure, mais la transition d'une position d'ancre n'est pas fiable partout et son
 * repli aurait été à maintenir en double. D'où ce composant, qui MESURE (spec § 2.3). Florian
 * prévoit d'autres rangées d'onglets : elles le composeront aussi, de deux options ou de dix.
 *
 * TROIS PRÉCÉDENTS (spec § 9) :
 *   1. PREMIER COMPOSANT COMPOSÉ PAR DEUX COMPOSANTS EXISTANTS — `Tab` et `ThemeSelector`. `Reveal`
 *      l'était par un seul.
 *   2. PREMIER COMPOSANT QUI LIT LA SÉLECTION DANS LE DOM au lieu de la recevoir en prop. C'est ce
 *      qui lui permet de servir un composant CONTRÔLÉ PAR REACT (`Tab`, qui tient l'onglet ouvert
 *      dans un état et dans le hash) et un composant NON CONTRÔLÉ (`ThemeSelector`, dont l'état vit
 *      dans ses radios natives, sans `useState`) sans que l'un des deux change de nature. Une prop
 *      `value` aurait obligé `ThemeSelector` à tenir son état dans React, ce que sa docstring
 *      refuse au long. Les deux marqueurs lus sont ceux que l'assistance lit déjà : le composant
 *      n'introduit AUCUN attribut de sélection propre.
 *   3. PREMIER COMPOSANT QUI MESURE LE LAYOUT D'UN AUTRE pour se positionner.
 *
 * LA PASTILLE ACCOMPAGNE LA SÉLECTION, ELLE NE LA PORTE PAS. Elle vaut 1.10:1 sur la piste en light, 1.47:1
 * en dark (`neutral-800`, décision de Florian du 2026-11-06, voir `semantic.css`) ; ce
 * qui porte la sélection reste la graisse du libellé pour `Tab`, l'écart et le remplissage des
 * glyphes pour `ThemeSelector` — `Tab` n'a aucune exception de la loi 7, celle de `ThemeSelector`
 * est inchangée, et les deux signaux survivent à `prefers-reduced-motion` comme avant. Sans
 * JavaScript il n'y a pas de pastille du tout, et la sélection reste lisible pour la même
 * raison : elle n'a jamais tenu à elle.
 *
 * LA MESURE LIT `offsetLeft`, `offsetTop`, `offsetWidth` ET `offsetHeight` de l'option choisie,
 * relativement à la piste — qui est `relative`, donc son `offsetParent`. Ces quatre valeurs
 * ignorent les `transform` et les `translate` des ancêtres, donc l'entrée par `Reveal` : la mesure
 * prise pendant que la rangée monte de 16 px est celle du repos. La pastille prend la HAUTEUR de
 * l'option comme le reste — 32 px dans `Tab`, 24 dans `ThemeSelector` — sans qu'aucune des deux
 * dimensions soit écrite ici. Les quatre valeurs sont écrites en propriétés personnalisées sur la
 * pastille (`--segmented-x`, `-y`, `-width`, `-height`), et ce sont ses classes qui les
 * consomment : des POSITIONS mesurées, pas des valeurs de design — même exception que les
 * coordonnées du pointeur de `CursorPill` et l'angle de `PhotoStrip`.
 *
 * QUAND LA MESURE EST REFAITE (spec § 5.2), et tout passe par UNE image : chaque déclencheur
 * planifie un `requestAnimationFrame`, et il n'y en a jamais deux en attente.
 *   - à un `click` ou un `change` dans la piste — le geste ;
 *   - à l'apparition de `data-gesture` sur la piste, par un `MutationObserver` — le geste venu de
 *     l'appelant, voir plus bas ;
 *   - à un changement d'`aria-selected` sur un enfant direct, par un `MutationObserver` — le hash
 *     édité à la main, et tout changement venu de React ;
 *   - à un changement de taille de la piste OU D'UNE OPTION, par un `ResizeObserver` : la police
 *     chargée après coup, la graisse qui change sous le doigt dans `Tab`, la fenêtre redimensionnée,
 *     une piste montée sous un `display: none`. Observer les options et pas seulement la piste est
 *     nécessaire : une option qui s'élargit déplace ses voisines SANS les redimensionner.
 *
 * LE `requestAnimationFrame` N'EST PAS UNE COMMODITÉ, IL EST L'ORDRE. Le `click` sur un `<label>`
 * de `ThemeSelector` arrive AVANT le `change` de sa radio, et le `click` sur un onglet de `Tab`
 * arrive ici AVANT que React l'ait traité — l'écouteur de la piste est plus bas que celui de la
 * racine React. Mesurer dans l'écouteur mesurerait l'ANCIENNE sélection. À l'image suivante, la
 * radio est cochée et React a validé son rendu. Et au montage, il laisse passer l'effet du PARENT :
 * React exécute les effets de l'enfant d'abord, donc le recalage de `ThemeSelector` (qui coche la
 * radio du thème sombre) tourne APRÈS celui-ci — mesurer tout de suite placerait la pastille sous
 * « Light » sans que rien la rappelle, `checked` n'étant pas un attribut qu'un observateur voit.
 *
 * PAS DE GLISSEMENT AU PREMIER PLACEMENT (spec § 5.3), ET SEUL UN GESTE FAIT GLISSER. Une mesure
 * glisse si et seulement si l'option choisie a CHANGÉ depuis la précédente ET qu'un geste a eu lieu
 * depuis la dernière mesure — un `click` ou un `change` dans la piste, ou le `data-gesture` de
 * l'appelant. Tout le reste est posé sans transition :
 *   - le premier placement, qui apparaît directement sous l'option choisie ;
 *   - les deux recalages qui suivent l'hydratation — le hash `#about` de `Tab`, le thème sombre de
 *     `ThemeSelector`. Ceux-là n'arrivent pas forcément avant la première mesure : `Tab` change
 *     d'onglet dans un effet, et React peut rendre ce changement une image plus tard. Sans la
 *     condition du geste, la pastille traverserait la rangée à chaque chargement de `/#about`.
 *     C'est la raison pour laquelle le critère est le geste et non une durée écoulée depuis le
 *     montage, qui aurait été une course ;
 *   - un recalage dû à un redimensionnement.
 * CE QUE LA CONDITION COÛTE, ET C'EST ASSUMÉ : un hash édité à la main dans la barre d'adresse
 * déplace la pastille sans la faire glisser. Ce n'est pas un geste sur la rangée, et le composant
 * ne connaît pas le hash — il appartient à `Tab`.
 *
 * LE GESTE PEUT VENIR DE L'APPELANT, ET IL EST NOMMÉ : `data-gesture` (spec
 * `2026-10-20-lot-d-home-design` § 3.2). Un geste n'a pas toujours lieu dans la piste : sur la home,
 * le portrait est un lien `#about`, que `Tab` intercepte pour choisir l'onglet comme un clic le
 * ferait — la pastille doit glisser, et le clic n'a pas touché la piste. L'appelant pose alors
 * l'attribut `data-gesture` sur la piste, qu'il atteint par `ref` ; un `MutationObserver` le voit,
 * le RETIRE aussitôt et compte un geste, exactement comme un `click` : il vaut pour la mesure
 * suivante, et pour elle seule. Un attribut et non une prop, parce qu'un geste est un ÉVÉNEMENT et
 * non un état : une prop resterait vraie après coup, ou demanderait un compteur. Et ce n'est PAS une
 * lecture du hash : le composant ne connaît toujours pas l'adresse, et le hash édité à la main, que
 * personne ne signale, reste un saut. Comme `data-state`, l'attribut n'est pas écrit dans le JSX.
 *
 * UN REDIMENSIONNEMENT PENDANT UN GLISSEMENT LE RECIBLE, IL NE L'INTERROMPT PAS. Dans `Tab`, le
 * clic fait passer l'onglet d'arrivée en graisse medium et celui de départ en normale : les deux
 * changent de largeur, et le `ResizeObserver` se déclenche pendant le glissement qu'il a provoqué.
 * Le reposer sans transition couperait le mouvement net. L'état reste donc `sliding` jusqu'au
 * `transitionend` de la pastille, et toute mesure faite d'ici là garde la transition.
 *
 * TROIS ÉTATS, portés par `data-state` sur la pastille et déclarés au manifeste (spec § 11) :
 * absent = `unmeasured`, pastille invisible — avant la première mesure, sans option choisie, sans
 * JavaScript ; `placed`, posée sans transition ; `sliding`, en mouvement sur `--duration-base` et
 * `--ease-in-out`, la courbe que `semantic.css` réserve au « déplacement, morphing ». La transition
 * n'existe QUE sous `sliding` : c'est ce qui rend « poser sans glisser » possible sans manipuler le
 * style de transition à la main. Passer de `placed` à `sliding` et écrire les nouvelles positions
 * dans la même image suffit — une transition se règle sur le style d'APRÈS le changement.
 * `data-state` n'est PAS écrit dans le JSX : React le réécrirait à chaque rendu de `Tab`. Il est
 * tenu par le DOM seul, comme `data-revealed` de `Reveal`.
 *
 * LA PASTILLE GLISSE ET S'ÉTIRE, SANS EFFET ÉLASTIQUE : `transform` et `width` sur la même durée et
 * la même courbe. Bord avant puis bord arrière a été écarté au cadrage (spec § 13).
 * `prefers-reduced-motion` : `globals.css` ramène déjà `--duration-base` à 1 ms, la pastille saute
 * au lieu de glisser — le composant n'a pas la requête média à connaître.
 *
 * LE GLISSEMENT PART AU CLIC, JAMAIS À L'APPUI (spec § 2.2) : les options ont perdu leur fond
 * `active:`, et presser ne peint plus de fond. L'aperçu à l'appui est porté par l'option elle-même
 * — la graisse dans `Tab`, le glyphe plein dans `ThemeSelector`.
 *
 * LES OPTIONS PASSENT PAR-DESSUS SANS `z-index`. La pastille est le PREMIER enfant, en `absolute` ;
 * les options sont déjà `relative` dans les deux composants, et un frère positionné qui suit dans
 * le DOM se peint après. L'anneau de focus reste peint sur l'option, jamais sur la pastille. La
 * pastille est `aria-hidden` et sans contenu : un `tablist` ne possède ainsi que ses onglets.
 *
 * LA PISTE HUG SES OPTIONS : `inline-flex`, comme avant l'extraction (loi 8). Le composant ne pose
 * aucune largeur, l'appelant non plus. `relative` est la seule classe ajoutée à celle qui était
 * écrite deux fois : elle fait de la piste le bloc conteneur de la pastille.
 *
 * COMPOSANT CLIENT (`runtime: "client"`), et la directive est justifiée au sens strict de la loi
 * 11 : refs, effet, API navigateur (`ResizeObserver`, `MutationObserver`) et mesure de layout. Il
 * ne reçoit ni `value` ni `onValueChange` — la sélection est lue — ni réglage de durée : le
 * mouvement est arrêté. Une rangée qui voudrait glisser autrement rouvre la spec.
 *
 * ANONYMISÉ POUR CONSORT, le 2026-11-11 (décision de Florian, spec
 * `docs/specs/2026-11-11-anonymisation-design.md` § 2) : `role` accepte `"radiogroup"` et `"group"`
 * en plus de `"tablist"`, pour qui range des radios ou des boutons sur la même piste ; aucun pixel ne
 * bouge.
 *
 * `surface` EST DU 2026-11-11 (lot 1 du site de Neume, `extend`) : décision de Florian, « une pastille
 * qui glisse, grise sans piste, blanche sur une piste grise ». `"none"` retire le fond et la marge
 * de la piste et prend `--color-segmented-surface-selected-bare` ; la mesure de la pastille sur
 * l'option, elle, ne change pas.
 *
 * Histoire : `docs/history/segmented-track.md`.
 */
export function SegmentedTrack({
  children,
  role,
  "aria-label": ariaLabel,
  surface = "track",
  ref,
}: SegmentedTrackProps) {
  const track = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);

  /* La ref de l'appelant reçoit la piste. `useImperativeHandle` plutôt qu'une ref fusionnée à la
   * main : écrire dans le `current` d'une ref reçue en prop, c'est muter une prop. Le nœud est
   * posé dans la phase de layout, donc avant les effets du parent — le recalage de
   * `ThemeSelector` le trouve. */
  useImperativeHandle(ref, () => track.current as HTMLDivElement, []);

  useEffect(() => {
    const root = track.current;
    const mark = pill.current;
    if (!root || !mark) return;

    /* L'option sous laquelle la pastille est posée, `null` tant qu'elle n'a pas été mesurée. */
    let current: HTMLElement | null = null;
    /* Vrai si un geste a eu lieu depuis la dernière mesure : `click` ou `change` dans la piste, ou
     * `data-gesture` posé par l'appelant. */
    let gesture = false;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const option = root.querySelector<HTMLElement>(SELECTED);
      const slide = gesture;
      gesture = false;

      if (!option) {
        current = null;
        delete mark.dataset.state;
        return;
      }

      /* Une option sans boîte est sous un `display: none` : rien à mesurer. La pastille garde son
       * état, et le `ResizeObserver` la rappellera quand la piste réapparaîtra. */
      if (option.offsetWidth === 0) return;

      const x = `${option.offsetLeft}px`;
      const y = `${option.offsetTop}px`;
      const width = `${option.offsetWidth}px`;
      const height = `${option.offsetHeight}px`;
      const moves =
        mark.style.getPropertyValue("--segmented-x") !== x ||
        mark.style.getPropertyValue("--segmented-width") !== width;

      if (current !== null && option !== current && slide && moves) {
        mark.dataset.state = "sliding";
      } else if (mark.dataset.state !== "sliding") {
        mark.dataset.state = "placed";
      }

      mark.style.setProperty("--segmented-x", x);
      mark.style.setProperty("--segmented-y", y);
      mark.style.setProperty("--segmented-width", width);
      mark.style.setProperty("--segmented-height", height);
      current = option;
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    const onGesture = () => {
      gesture = true;
      schedule();
    };

    /* Fin du glissement : la pastille redevient `placed`, et les redimensionnements suivants la
     * reposent sans transition. `transform` et `width` finissent ensemble, le premier suffit. */
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === mark && mark.dataset.state === "sliding") {
        mark.dataset.state = "placed";
      }
    };

    const resize = new ResizeObserver(schedule);
    const selection = new MutationObserver(schedule);

    /* Le geste nommé de l'appelant (docstring) : retiré dès qu'il est vu. Son retrait repasse par
     * cet observateur, d'où la garde. */
    const signal = new MutationObserver(() => {
      if (!root.hasAttribute("data-gesture")) return;
      root.removeAttribute("data-gesture");
      onGesture();
    });

    /* Les options observées une à une : les enfants directs, pastille exceptée. Rappelé quand la
     * liste des enfants change, pour qu'une option ajoutée soit observée elle aussi. */
    const observeOptions = () => {
      resize.disconnect();
      selection.disconnect();
      resize.observe(root);
      for (const child of root.children) {
        if (child === mark) continue;
        resize.observe(child);
        selection.observe(child, { attributes: true, attributeFilter: ["aria-selected"] });
      }
    };

    const roster = new MutationObserver(() => {
      observeOptions();
      schedule();
    });

    observeOptions();
    roster.observe(root, { childList: true });
    signal.observe(root, { attributes: true, attributeFilter: ["data-gesture"] });
    root.addEventListener("click", onGesture);
    root.addEventListener("change", onGesture);
    mark.addEventListener("transitionend", onTransitionEnd);
    schedule();

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      resize.disconnect();
      selection.disconnect();
      roster.disconnect();
      signal.disconnect();
      root.removeEventListener("click", onGesture);
      root.removeEventListener("change", onGesture);
      mark.removeEventListener("transitionend", onTransitionEnd);
    };
  }, []);

  return (
    <div
      ref={track}
      role={role}
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex gap-1 rounded-full",
        surface === "track" && "bg-segmented-track p-1",
      )}
    >
      <span
        ref={pill}
        aria-hidden
        className={cn(
          "invisible absolute left-0 rounded-full",
          surface === "track"
            ? "bg-segmented-surface-selected"
            : "bg-segmented-surface-selected-bare",
          "top-[var(--segmented-y)] h-[var(--segmented-height)] w-[var(--segmented-width)]",
          "[transform:translateX(var(--segmented-x))]",
          "data-[state]:visible",
          "data-[state=sliding]:transition-[transform,width]",
          "data-[state=sliding]:duration-[var(--duration-base)] data-[state=sliding]:ease-in-out",
        )}
      />
      {children}
    </div>
  );
}
