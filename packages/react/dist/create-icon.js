// Fabrique d'icône, partagée par tous les modules générés. Reçoit la grille compacte de l'icône
// ([ox, oy, hex], grand ; un petit éventuel est ignoré) ; le tracé se calcule au rendu, avec la règle de
// calage du cœur (@neume-icons/svg) — rien n'est précalculé par taille.

import { createElement, forwardRef, useId } from "react";
import { pick, path, decode, snap } from "@neume-icons/svg/render";

const DEFAULT_SIZE = 24;

// `process.env.NODE_ENV` est remplacé tel quel par les bundlers ; sans bundler ni `process`, on se tait.
const dev = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

const warned = new Set();
function warnSize(name, size, snapped) {
  if (!dev || warned.has(size)) return;
  warned.add(size);
  console.warn(`[neume] ${name} : size={${size}} n'est pas une taille valide (multiple de 4 entre 12 et 64), affichée à ${snapped}.`);
}

export function createIcon(name, grand, _petit) {
  const paths = new Map(); // taille → tracé, calculé une fois par taille et par icône
  const draw = (size) => {
    let d = paths.get(size);
    if (d === undefined) {
      d = path(decode(grand), pick(size).k, size);
      paths.set(size, d);
    }
    return d;
  };

  const Icon = forwardRef(function Icon({ size = DEFAULT_SIZE, title, ...rest }, ref) {
    const id = useId();
    const asked = Number(size);
    const s = Number.isFinite(asked) ? snap(asked) : DEFAULT_SIZE;
    if (s !== asked) warnSize(name, size, s);
    const labelled = typeof title === "string" && title !== "";
    return createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "currentColor",
        shapeRendering: Number.isInteger(s / 12) ? "crispEdges" : "geometricPrecision",
        ...(labelled ? { role: "img", "aria-labelledby": `${id}-title` } : { "aria-hidden": "true", focusable: "false" }),
        ...rest,
        ref,
        width: s,
        height: s,
        viewBox: `0 0 ${s} ${s}`,
      },
      labelled ? createElement("title", { id: `${id}-title` }, title) : null,
      createElement("path", { d: draw(s) }),
    );
  });
  Icon.displayName = name;
  return Icon;
}
