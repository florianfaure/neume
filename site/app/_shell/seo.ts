import type { Metadata } from "next";
import { names } from "@neume-icons/svg";
import { version } from "@neume-icons/svg/package.json";
import { REPO_URL } from "./links";

// Ce que les moteurs et les cartes de partage lisent de neume.dev, écrit une fois : les titres, les
// descriptions, l'image, et les données structurées (JSON-LD). Rien ici n'est affiché dans la page.
// Tout fait vient du dépôt : le nombre d'icônes et la version sont lus dans le paquet, au build.

export const SITE_URL = "https://neume.dev";
export const SITE_NAME = "Neume";
/** Le nombre d'icônes, hors versions solides : celui que l'accueil et la doc affichent. */
export const ICON_COUNT = names.length;

const AUTHOR = { name: "Florian Faure", url: "https://florianfaure.com" } as const;

/**
 * L'image de partage du site (`app/opengraph-image.png`, 1200 × 630) et son texte alternatif
 * (`app/opengraph-image.alt.txt`). Une page qui redéfinit `openGraph` ou `twitter` remplace ceux du
 * layout en entier, image comprise : elle est donc redite par `pageMetadata`.
 */
const SHARE_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Neume: pixel icons for real interfaces.",
};

/**
 * Les métadonnées d'une page : son titre entier (≤ 60 caractères), sa description (≤ 155), son adresse
 * canonique. Chaque page les pose elle-même : rien de tout cela ne s'hérite du layout, sans quoi une page
 * sans métadonnées (la 404) se dirait canonique de l'accueil.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: "/" | `/${string}`;
}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    // Explicite, et par page (la 404 de Next porte déjà son `noindex`) : les extraits et l'aperçu d'image
    // ne sont pas bridés dans les résultats.
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@fl0rianfa",
      title,
      description,
      images: [SHARE_IMAGE],
    },
  };
}

// --- Données structurées ---------------------------------------------------------------------------

const WEBSITE_ID = `${SITE_URL}/#website`;
const AUTHOR_ID = `${SITE_URL}/#author`;
const CODE_ID = `${SITE_URL}/#icons`;

/** Florian, tel que la page Docs le présente (« About Neume ») : les mêmes quatre liens. */
const author = {
  "@type": "Person",
  "@id": AUTHOR_ID,
  name: AUTHOR.name,
  url: AUTHOR.url,
  sameAs: [
    "https://www.linkedin.com/in/florian-fa/",
    "https://x.com/fl0rianfa",
    "https://github.com/florianfaure",
  ],
};

/** Le site : c'est d'ici que Google tire le nom affiché au-dessus des résultats. */
const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  alternateName: ["Neume icons", "neume.dev"],
  description: `A free, open source pixel icon set: ${ICON_COUNT} icons for React or as plain SVG.`,
  inLanguage: "en",
  publisher: { "@id": AUTHOR_ID },
};

/** Le set lui-même : un projet de code libre, ses deux paquets, sa licence. */
const sourceCode = {
  "@type": "SoftwareSourceCode",
  "@id": CODE_ID,
  name: SITE_NAME,
  alternateName: ["@neume-icons/react", "@neume-icons/svg"],
  description: `Neume is a pixel icon set: ${ICON_COUNT} icons, each drawn cell by cell on a 12 × 12 grid, each with a solid version. Shipped as React components and as plain SVG.`,
  url: `${SITE_URL}/`,
  codeRepository: REPO_URL,
  license: "https://opensource.org/licenses/MIT",
  programmingLanguage: ["TypeScript", "JavaScript"],
  runtimePlatform: "React",
  version,
  isAccessibleForFree: true,
  keywords: "pixel icons, pixel icon set, pixel art icons, React icons, SVG icons, open source icons",
  author: { "@id": AUTHOR_ID },
  mainEntityOfPage: { "@id": WEBSITE_ID },
};

const graph = (...nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });

/** Le fil d'Ariane d'une page de second niveau : Neume › la page. */
const breadcrumb = (name: string, path: string) => ({
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name, item: `${SITE_URL}${path}` },
  ],
});

export const homeJsonLd = () => graph(website, author, sourceCode);

export const docsJsonLd = ({ title, description }: { title: string; description: string }) =>
  graph(
    {
      "@type": "TechArticle",
      "@id": `${SITE_URL}/docs#article`,
      headline: title,
      description,
      url: `${SITE_URL}/docs`,
      inLanguage: "en",
      image: `${SITE_URL}${SHARE_IMAGE.url}`,
      author,
      about: { "@id": CODE_ID },
      isPartOf: { "@id": WEBSITE_ID },
    },
    breadcrumb("Docs", "/docs"),
  );

export const changelogJsonLd = () => graph(breadcrumb("Changelog", "/changelog"));

/**
 * Le texte d'un `<script type="application/ld+json">`. `<` est échappé : une valeur ne peut pas fermer
 * la balise.
 */
export const jsonLdText = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
