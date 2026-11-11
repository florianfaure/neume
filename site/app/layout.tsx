import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "@/styles/globals.css";

// Les quatre faces ci-dessous, et les deux scripts de tête, sont recopiés du `app/layout.tsx` du
// portfolio (commit dans COPIES.md) : le pourquoi de chaque réglage y est écrit. Ce fichier-ci est
// du site, pas une copie : il peut changer.

const geistLatin = localFont({
  src: "../public/fonts/geist-latin.woff2",
  // L'étendue RÉELLE de l'axe `wght` de Geist, relevée dans le `fvar` du fichier : hors de cette
  // plage, le navigateur synthétiserait la graisse au lieu d'interpoler la variable. Les quatre
  // crans nommés de la loi 3 (400, 500, 600, 700) sont tous dedans.
  weight: "100 900",
  style: "normal",
  display: "swap",
  // Geist porte TOUT le texte du site : elle est nécessaire au premier rendu de n'importe
  // quelle page.
  preload: true,
  adjustFontFallback: false,
  variable: "--font-geist-latin",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

const geistLatinExt = localFont({
  src: "../public/fonts/geist-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  // Jamais préchargé : le contenu est en anglais, cette face ne sera pas demandée.
  preload: false,
  // Arial avec `size-adjust` / `ascent-override` calculés depuis les métriques de Geist :
  // c'est le repli de la fenêtre de `swap`, il limite le décalage de mise en page.
  adjustFontFallback: "Arial",
  variable: "--font-geist-latin-ext",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

// Pixelify Sans — variable sur `wght` 400 → 700 uniquement, l'étendue réelle de l'axe amont.
// Un seul fichier, un seul appel : son sous-ensemble couvre `latin` + `latin-ext` d'un coup,
// et le découper en deux faces n'économiserait rien puisque le contenu est en anglais.
const pixelifySans = localFont({
  src: "../public/fonts/pixelify-sans.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  // PRÉCHARGÉE depuis la tâche 3.1. Elle était `preload: false` avec une justification
  // explicite — « ni preloadée ni consommée par un composant » (tâche 1.6). La condition est
  // tombée : la ligne méta de `ProjectCard` la consomme, donc la home page la demande au
  // premier rendu, et la laisser en `swap` non préchargée ferait clignoter la signature de
  // chaque projet.
  preload: true,
  // Le repli intégré de Next (`adjustFontFallback`) n'ajuste que vers Arial ou Times New
  // Roman : ni la proportion ni la chasse d'une fonte au dessin pixelisé ne s'en rapprochent.
  // Un repli sans-serif générique limite le décalage sans prétendre égaler des métriques
  // qu'aucune fonte système ne partage avec Pixelify Sans.
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  variable: "--font-pixelify-sans",
});

// Geist Mono — le code, et rien d'autre (loi 3, depuis le 2026-10-16). La face `latin` SEULE,
// restaurée telle quelle depuis le commit `c671687` : un sous-ensemble produit avec pyftsubset
// depuis le .ttf variable amont. Le code cité est en ASCII ; la face `latin-ext` du même commit
// (13 432 octets) reviendra le jour où un nom de code sort de `latin`. Pas d'`unicode-range` : un
// seul fichier, rien à départager.
const geistMonoLatin = localFont({
  src: "../public/fonts/geist-mono-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  // JAMAIS PRÉCHARGÉE : le code n'apparaît que sur la page Minos — et sur la vitrine —, aucune
  // autre page ne doit payer ses 20 Ko. Sans préchargement, le navigateur ne télécharge la face
  // que si un élément de la page la demande.
  preload: false,
  // Le repli intégré de Next n'ajuste que vers Arial ou Times New Roman, deux proportionnelles :
  // l'ajustement vertical serait juste, l'avance horizontale fausse de 20 %. Une pile mono
  // générique est métriquement plus proche — SF Mono, Menlo et Consolas ont la même avance de
  // 0,6 em que Geist Mono, donc aucun décalage horizontal pendant le `swap`. C'était le réglage de
  // la face `latin-ext` au commit `c671687`, raisonnement compris.
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
  variable: "--font-geist-mono-latin",
});

const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}`;

const REVEAL_SCRIPT = `!function(){var d=document.documentElement,n=0;if(!("IntersectionObserver"in window))return;d.dataset.reveal="";setTimeout(function(){if(d.dataset.revealReady===undefined)delete d.dataset.reveal},3000);requestAnimationFrame(function r(){var b=document.querySelectorAll("[data-reveal-timing=load]:not([style])");for(var i=0;i<b.length;i++)b[i].style.setProperty("--reveal-index",n++);if(document.readyState==="loading")requestAnimationFrame(r)})}()`;

export const metadata: Metadata = {
  metadataBase: new URL("https://neume.dev"),
  title: "Neume",
  description: "A pixel icon set, drawn on two grids and shipped as SVG and React.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // `suppressHydrationWarning` : le script de thème pose `data-theme` sur <html> avant l'hydratation.
    <html
      lang="en"
      className={[
        geistLatin.variable,
        geistLatinExt.variable,
        pixelifySans.variable,
        geistMonoLatin.variable,
      ].join(" ")}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `${THEME_SCRIPT};${REVEAL_SCRIPT}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
