"use client";

import { Exhibit } from "@/components/ui/exhibit";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { TextLink } from "@/components/ui/text-link";
import { NeumeIcon, drawingOf } from "@/lib/neume";
import { names } from "@neume-icons/svg";
import { path } from "@neume-icons/svg/render";
import { REPO_URL } from "../_shell/links";
import { SiteFooter } from "../_shell/site-footer";
import { SiteNav } from "../_shell/site-nav";
import { useSiteLayers } from "../_shell/use-site-layers";
import { P, Ul } from "../docs/prose";
import { RELEASES } from "./releases";
import type { Release } from "./releases";

const SAMPLE = names.slice(0, 24);

/** Les versions groupées par numéro majeur, dans l'ordre de `RELEASES` (la plus récente d'abord). */
const SERIES = RELEASES.reduce<[string, Release[]][]>((groups, release) => {
  const major = release.version.split(".")[0];
  const last = groups[groups.length - 1];
  if (last && last[0] === major) last[1].push(release);
  else groups.push([major, [release]]);
  return groups;
}, []);
const BEFORE_AFTER = { name: "sparkles", size: 28, zoom: 4 } as const;

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/**
 * La même icône à 28 px, rendue par la règle de chaque version et agrandie au pixel : en 0.1.0 le plus
 * grand dessin net qui tenait (×2, soit 24 px centrés dans la boîte), en 0.2.0 le dessin à 28 / 12.
 * Le cadre est `Exhibit` à contenu libre : c'est la page qui dispose les deux panneaux.
 */
function BeforeAfter() {
  const { name, size, zoom } = BEFORE_AFTER;
  const icon = drawingOf(name);
  const panels = [
    { label: "0.1.0", k: 2, rendering: "crispEdges" },
    { label: "0.2.0", k: size / 12, rendering: "geometricPrecision" },
  ] as const;
  return (
    <Exhibit
      caption={`${name} asked for at ${size} px, shown ${zoom} times larger. 0.1.0 drew it at 24 px inside the box; 0.2.0 fills it.`}
    >
      <div className="grid grid-cols-2 gap-2">
        {panels.map((p) => (
          <div key={p.label} className="flex flex-col items-center gap-3">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              width={size * zoom}
              height={size * zoom}
              fill="currentColor"
              shapeRendering={p.rendering}
              aria-hidden="true"
              className="site-dots text-text-primary"
            >
              <path d={path(icon, p.k, size)} />
            </svg>
            <span className="font-pixel text-body-sm text-text-tertiary">{p.label}</span>
          </div>
        ))}
      </div>
    </Exhibit>
  );
}

function Sample() {
  return (
    <Exhibit
      caption={`The first ${SAMPLE.length} icons, in design order, and ${names.length - SAMPLE.length} more in the catalogue.`}
    >
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
        {SAMPLE.map((n) => (
          <span key={n} className="flex aspect-square items-center justify-center text-text-primary">
            <NeumeIcon name={n} size={24} />
          </span>
        ))}
      </div>
    </Exhibit>
  );
}

/** Une version majeure (1.0.0, 2.0.0…) : celle qui peut casser une interface, et qui marque une étape. */
const isMajor = (version: string) => /^[1-9]\d*\.0\.0$/.test(version);

function Entry({ release, latest }: { release: Release; latest: boolean }) {
  const major = isMajor(release.version);
  return (
    <li className="group relative pb-24 pl-10 last:pb-0">
      {/* Le fil de la frise et sa case : un carré plein, à l'échelle d'une case de Neume. Une majeure a une
          case de 32 px, centrée sur le fil et sur la ligne du numéro. */}
      <span
        aria-hidden="true"
        className="absolute top-3 bottom-0 left-[5px] w-[2px] bg-code-block-border group-last:hidden"
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute bg-text-primary",
          major ? "top-5 -left-[10px] size-8" : "top-2 left-0 size-3",
        )}
      />
      <article className="flex flex-col gap-6" aria-labelledby={`v${release.version}`}>
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2
              id={`v${release.version}`}
              className={cn(
                "font-pixel font-normal text-text-primary",
                major ? "text-display" : "text-h2",
              )}
            >
              {release.version}
            </h2>
            {major ? <Tag>Major</Tag> : null}
            {latest ? <Tag>Latest</Tag> : null}
          </div>
          <time dateTime={release.date} className="text-body-sm text-text-tertiary">
            {formatDate(release.date)}
          </time>
        </header>
        <h3
          className={cn(
            "font-pixel font-normal text-text-primary",
            major ? "text-h3" : "text-body-lg",
          )}
        >
          {release.title}
        </h3>
        {major ? (
          <div className="rounded-2xl bg-code-block-surface p-6">
            <P>{release.summary}</P>
          </div>
        ) : (
          <P>{release.summary}</P>
        )}
        <Ul>
          {release.changes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </Ul>
        {release.figure === "before-after" ? <BeforeAfter /> : null}
        {release.figure === "sample" ? <Sample /> : null}
      </article>
    </li>
  );
}

/** La page Changelog de neume.dev : une frise des versions, la plus récente en haut. */
export function Changelog() {
  const { openPalette, layers } = useSiteLayers(names, 24);

  return (
    <>
      <SiteNav onSearch={openPalette} />

      <main className="mx-auto flex w-full max-w-[var(--site-docs-copy-width)] flex-col gap-24 px-[var(--layout-gutter)] pt-32 pb-16">
        <header className="flex flex-col gap-6">
          <h1 className="font-pixel text-h1 font-normal text-text-primary">Changelog</h1>
          <P>
            Every release of Neume. The React package and the core always ship together, at the same
            version: a new icon is a minor version, a corrected drawing a patch. Each release is also
            on{" "}
            <TextLink href={`${REPO_URL}/releases`} newTab>
              GitHub
            </TextLink>
            .
          </P>
        </header>

        {/* Une frise par série majeure (1.x, 0.x…), séparées par un vide : le fil s'arrête à la dernière
            version d'une série et reprend à la première de la suivante. */}
        <div className="flex flex-col gap-32">
          {SERIES.map(([major, releases]) => (
            <ol key={major} aria-label={`Versions ${major}.x`} className="flex flex-col">
              {releases.map((r) => (
                <Entry key={r.version} release={r} latest={r === RELEASES[0]} />
              ))}
            </ol>
          ))}
        </div>
      </main>

      <div className="mx-auto w-full max-w-[var(--site-max-width)] px-[var(--layout-gutter)] pt-16">
        <SiteFooter />
      </div>

      {layers}
    </>
  );
}
