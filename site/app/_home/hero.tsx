"use client";

import { useRef } from "react";

import { Announcement } from "@/components/ui/announcement";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { Reveal } from "@/components/ui/reveal";
import { version } from "@neume-icons/svg/package.json";
import { Wall } from "./wall";

export const INSTALL_COMMAND = "npm i @neume-icons/react";

/** Le hero : le mur d'icônes derrière, l'annonce, le titre, la phrase, la commande et l'appel à parcourir. */
export function Hero({ total }: { total: number }) {
  const section = useRef<HTMLElement>(null);

  return (
    <section
      ref={section}
      aria-labelledby="hero-title"
      className="relative flex min-h-[var(--site-hero-height)] items-center justify-center overflow-hidden text-center"
    >
      <Wall host={section} />
      <div className="relative flex w-full max-w-[var(--site-hero-copy-width)] flex-col items-center gap-6 px-[var(--layout-gutter)] py-16">
        <Reveal timing="load">
          <div className="flex justify-center">
            <Announcement
              tag={`v${version.split(".").slice(0, 2).join(".")}`}
              label={`${total} icons, free and open source`}
              href="/changelog"
            />
          </div>
        </Reveal>
        <Reveal timing="load">
          <h1
            id="hero-title"
            className="text-balance font-pixel text-display font-normal text-text-primary"
          >
            Pixel icons for real interfaces
          </h1>
        </Reveal>
        <Reveal timing="load">
          <p className="mx-auto max-w-[var(--site-lede-width)] text-pretty font-body text-body-lg text-text-secondary">
            Neume is a pixel icon set drawn square by square, for React or as plain SVG.
          </p>
        </Reveal>
        <Reveal timing="load">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <CodeBlock code={INSTALL_COMMAND} label="Copy command" />
            <Button size="large" label="Browse icons" href="#icons" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
