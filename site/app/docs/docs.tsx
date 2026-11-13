"use client";

import { AuthorLine } from "@/components/ui/author-line";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { Exhibit } from "@/components/ui/exhibit";
import { InlineCode } from "@/components/ui/inline-code";
import { PixelPreview } from "@/components/ui/pixel-preview";
import { TableOfContents } from "@/components/ui/table-of-contents";
import { Tag } from "@/components/ui/tag";
import { TextLink } from "@/components/ui/text-link";
import { drawingOf } from "@/lib/neume";
import { names } from "@neume-icons/svg";
import { version } from "@neume-icons/svg/package.json";
import { SizesScene } from "../_home/scenes/sizes";
import { ISSUES_URL, REPO_URL } from "../_shell/links";
import { SiteFooter } from "../_shell/site-footer";
import { SiteNav } from "../_shell/site-nav";
import { useSiteLayers } from "../_shell/use-site-layers";
import { H3, P, SECTIONS, Section, Ul } from "./prose";

/** Le zip de `npm run build` (racine), servi tel quel : les 251 SVG à 24 px. */
const ZIP_URL = "/neume-svg-24.zip";

const C = InlineCode;

/**
 * La page Docs de neume.dev (spec `docs/specs/2026-11-13-page-docs-design.md`). Une seule colonne, centrée
 * dans la page, d'une seule largeur pour le texte et les blocs ; le sommaire en barres dans la marge de
 * gauche à partir de `xl`, en pastille en dessous. La barre, le pied, la palette et la fiche sont ceux de
 * l'accueil (`app/_shell/`).
 */
export function Docs() {
  const arrow = drawingOf("arrow-up");
  const toc = SECTIONS.map((s) => ({ id: s.id, label: s.label }));
  const { openPalette, layers } = useSiteLayers(names, 24);

  return (
    <>
      <SiteNav onSearch={openPalette} />

      {/* Sous xl, pas de rail : la pastille du sommaire, en bas de la fenêtre. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[var(--layout-gutter)] z-[var(--z-sticky)] flex justify-center xl:hidden">
        <TableOfContents variant="pill" items={toc} />
      </div>

      {/* Le cadre est la largeur du site : le rail s'aligne sur le signe de la barre, la colonne de
          contenu est centrée dans la page, entre deux marges égales. */}
      <div className="mx-auto grid w-full max-w-[var(--site-max-width)] gap-x-12 px-[var(--layout-gutter)] pt-32 pb-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,var(--site-docs-copy-width))_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-32">
            <TableOfContents items={toc} />
          </div>
        </aside>

        <main className="mx-auto flex w-full max-w-[var(--site-docs-copy-width)] min-w-0 flex-col gap-32">
          <header className="flex max-w-[var(--site-docs-copy-width)] flex-col gap-6">
            <div className="flex">
              <Tag>{`v${version}`}</Tag>
            </div>
            <h1 className="font-pixel text-h1 font-normal text-text-primary">Docs</h1>
            <p className="max-w-[var(--site-docs-copy-width)] text-body-lg text-text-secondary">
              Everything you need to put Neume in an interface: how to install it, how to use it in
              React or as plain SVG, how its sizes work, and where it comes from.
            </p>
          </header>

          <Section id="overview">
            <P>
              Neume is a pixel icon set: {names.length} icons, each drawn cell by cell on a grid of
              12 × 12 squares. Every square is either filled or empty. There are no curves and no
              optical tweaks hidden in the file: an icon is its filled squares and, for some, a
              half-square shift that centres a stem.
            </P>
            <P>
              The same drawing serves every size from 12 to 64 px. At 12, 24, 36, 48 and 60 px a square
              of the grid falls exactly on whole pixels, so the edges stay sharp. In between, the
              icon is scaled smoothly and keeps its proportions. You never pick between a “small”
              and a “large” version of an icon: you pick a size, and Neume does the rest.
            </P>
            <P>Neume comes in three forms. Use the one that matches your project.</P>
            <Ul>
              <li>
                <C>@neume-icons/react</C>: one React component per icon. The easiest way in if your
                interface is built with React.
              </li>
              <li>
                <C>@neume-icons/svg</C>: the core, for any framework or none. It builds the SVG markup
                of any icon at any size, and ships ready-made SVG files.
              </li>
              <li>
                A zip of every icon as an SVG file at 24 px, for design tools, a CMS, slides, or a
                project without a build step.
              </li>
            </Ul>
            <P>All of it is free and open source, under the MIT licence.</P>
          </Section>

          <Section id="install">
            <P>
              The two packages are published on npm and always released together, at the same
              version number. The React package depends on the core, so installing it is enough.
            </P>
            <H3>For React</H3>
            <P>React 18 or later. The package is ESM only and ships its TypeScript types.</P>
            <CodeBlock code="npm install @neume-icons/react" label="Copy command" />
            <H3>For any other stack</H3>
            <P>
              Vue, Svelte, Astro, a server template or plain HTML: the core package has no
              dependency and runs anywhere JavaScript does.
            </P>
            <CodeBlock code="npm install @neume-icons/svg" label="Copy command" />
            <H3>Just the files</H3>
            <P>
              The whole set as SVG files, drawn at 24 px with <C>fill=&quot;currentColor&quot;</C>.
              One file per icon, named after the icon: <C>arrow-up.svg</C>, <C>search.svg</C>, and
              so on.
            </P>
            <div className="flex">
              <Button
                variant="secondary"
                content="icon-label"
                icon="download"
                label="Download all SVG (24 px)"
                href={ZIP_URL}
                download="neume-svg-24.zip"
              />
            </div>
          </Section>

          <Section id="react">
            <P>
              Every icon is a React component, exported under the PascalCase of its name:{" "}
              <C>arrow-up</C> becomes <C>ArrowUp</C>, <C>alarm-clock</C> becomes{" "}
              <C>AlarmClock</C>. You can find every name in the catalogue on the home page, and copy
              its import from the icon’s sheet.
            </P>
            <CodeBlock
              label="Copy code"
              code={`import { ArrowUp, Search } from "@neume-icons/react";

export function Toolbar() {
  return (
    <>
      <ArrowUp />                         {/* 24 px, decorative */}
      <Search size={16} title="Search" /> {/* 16 px, with an accessible name */}
    </>
  );
}`}
            />
            <P>
              Each icon lives in its own module, so your bundler keeps only the icons you actually
              import: importing three icons ships three icons, not {names.length}. If your setup does not
              tree-shake, import an icon by its path instead.
            </P>
            <CodeBlock
              code={`import { ArrowUp } from "@neume-icons/react/icons/ArrowUp";`}
              label="Copy import"
            />
            <H3>Props</H3>
            <P>
              Every component takes the same two props. Anything else you pass goes straight to the
              underlying <C>{"<svg>"}</C> element, except width, height and viewBox, which always
              come from <C>size</C>.
            </P>
            <Exhibit
              columns={["Prop", "Default", "What it does"]}
              rows={[
                ["size", "24", "The size in pixels. Any number, snapped down to a multiple of 4 between 12 and 64."],
                ["title", "None", "An accessible name. Without it, the icon is hidden from screen readers."],
                ["Others", "None", "className, style, ref and any SVG attribute are passed to the <svg>, except width, height and viewBox."],
              ]}
              caption="The props of every Neume component."
            />
          </Section>

          <Section id="svg">
            <P>
              <C>@neume-icons/svg</C> is the framework-agnostic core. Its main function,{" "}
              <C>svg</C>, takes an icon name and a size and returns the SVG markup as a string. Put
              that string anywhere HTML goes.
            </P>
            <CodeBlock
              label="Copy code"
              code={`import { svg, names, SIZES } from "@neume-icons/svg";

svg("arrow-up", 32); // '<svg … width="32" height="32" …>…</svg>'
names;               // every icon name, in design order
SIZES;               // [12, 16, 20, 24, … 64]

document.querySelector("#icon").innerHTML = svg("search", 24);`}
            />
            <P>
              <C>svg(name, size)</C> accepts the sizes in <C>SIZES</C>, 12 to 64 in steps of 4, and
              throws on anything else. Unlike the React components, it never rounds for you: the
              error tells you straight away when a size is off.
            </P>
            <H3>Ready-made files</H3>
            <P>
              The package also ships one SVG file per icon at 12, 16 and 24 px. They are handy for an{" "}
              <C>{"<img>"}</C> tag, a CSS mask or a bundler that imports SVG files. Inside an{" "}
              <C>{"<img>"}</C> or a CSS background, <C>currentColor</C> has no text colour to
              inherit, so the icon always renders black: when the colour matters, inline the SVG or
              use the file as a CSS mask.
            </P>
            <CodeBlock code="@neume-icons/svg/dist/24/arrow-up.svg" label="Copy path" />
            <H3>Building your own wrapper</H3>
            <P>
              Writing components for another framework? The sizing rule is exported on its own, under{" "}
              <C>@neume-icons/svg/render</C>, which pulls no icon data: <C>snap</C> rounds a size,{" "}
              <C>pick</C> gives the scale of a square, <C>decode</C> turns an icon’s compact data into
              rows of squares and <C>path</C> draws them. The compact icon data is under{" "}
              <C>@neume-icons/svg/data</C>. The React package is built exactly this way.
            </P>
          </Section>

          <Section id="sizes">
            <P>
              A Neume icon is a grid of 12 × 12 squares, and one drawing serves every size. To show
              an icon at a given size, Neume scales the grid by exactly size / 12: at 24 px a square
              is 2 pixels wide, at 48 px it is 4. The stroke keeps the same proportion to the icon at
              every size. Drag the slider to watch one drawing grow.
            </P>
            <div className="flex justify-center rounded-2xl border-[length:var(--border-thin)] border-code-block-border py-12">
              <SizesScene />
            </div>
            <H3>Crisp sizes and smoothed sizes</H3>
            <P>
              When the size is a multiple of 12, each square covers a whole number of pixels and every
              edge lands on the pixel grid of the screen: the icon is perfectly sharp. At the other
              sizes, a square is not a whole number of pixels (1.33 px at 16, for instance), so its
              edges fall between pixels and the browser smooths them.
            </P>
            <Exhibit
              columns={["Size", "Pixels per square", "Rendering"]}
              rows={[
                ["12, 24, 36, 48, 60", "1, 2, 3, 4, 5", { tag: "Crisp" }],
                ["16, 20, 28, 32, 40, 44, 52, 56, 64", "1.33 to 5.33", { tag: "Smoothed" }],
              ]}
              caption="At multiples of 12, every square lands on whole pixels."
            />
            <P>
              For the sharpest result, prefer 12 for dense lists and tables, 24 for most of an
              interface, and 48 for empty states and illustrations. The smoothed sizes are there when a
              layout needs them, and still read well.
            </P>
            <H3>Sizes that are not in the list</H3>
            <P>
              The React components round any other number down to the nearest valid size: 30 becomes
              28, 70 becomes 64, 5 becomes 12. In development, a warning in the console tells you
              when that happens, so a typo does not go unnoticed.
            </P>
          </Section>

          <Section id="centring">
            <P>
              Every Neume size is an even number of pixels, so the centre of the box sits between
              two pixels. On a grid of 12 squares, a stem one square wide cannot sit exactly on that
              line: drawn on the grid, it has to lean one way or the other, and the icon looks
              slightly off.
            </P>
            <P>
              Neume solves it in the drawing. Icons with a central stem, like <C>arrow-up</C> below,
              are drawn half a square off the grid, so the stem straddles the centre of the box. The
              half-square is kept when the icon scales.
            </P>
            <div className="flex justify-center py-4">
              <PixelPreview
                rows={arrow.rows}
                offset={arrow.offset as readonly [0 | 1, 0 | 1]}
                label="arrow-up, drawn half a square off the grid"
              />
            </div>
            <P>
              The stem is exactly centred at every size but three. At 12, 36 and 60 px a square is an
              odd number of whole pixels (1, 3 and 5), so half a square is not a whole pixel: Neume
              rounds it down to keep the edges sharp, and the stem lands half a pixel off centre.
            </P>
          </Section>

          <Section id="colour-and-accessibility">
            <H3>Colour</H3>
            <P>
              Icons are filled with <C>currentColor</C>: they take the text colour of their parent,
              like a letter would. Inside a link or a button, the icon follows its hover and disabled
              states without any extra work. To set a colour directly on a React component, use{" "}
              <C>className</C> or <C>style</C>. With the plain SVG markup, set the CSS{" "}
              <C>color</C> of the element that holds it.
            </P>
            <CodeBlock
              label="Copy code"
              code={`<ArrowUp className="text-neutral-500" />
<ArrowUp style={{ color: "tomato" }} />`}
            />
            <H3>Accessibility</H3>
            <P>
              Most icons sit next to a word that already says what they mean. Those are decorative,
              and the React components hide them from assistive technology by default, with{" "}
              <C>aria-hidden=&quot;true&quot;</C> and <C>focusable=&quot;false&quot;</C>.
            </P>
            <P>
              When an icon carries meaning on its own, as in a button with no label, give the
              component a <C>title</C>. The icon then gets <C>role=&quot;img&quot;</C>, a{" "}
              <C>{"<title>"}</C> element and an <C>aria-labelledby</C> that points to it, so screen
              readers announce it.
            </P>
            <P>
              The markup from <C>svg()</C> and the ready-made files is always hidden from assistive
              technology, with <C>aria-hidden=&quot;true&quot;</C>. When such an icon carries meaning
              on its own, put the name on its parent, like an <C>aria-label</C> on the button, or use
              the file in an <C>{"<img>"}</C> with an <C>alt</C>.
            </P>
          </Section>

          <Section id="versions">
            <P>
              Neume follows semantic versioning, read from the point of view of your interface.
              Updating should never break a screen without the version number telling you first.
            </P>
            <Exhibit
              columns={["Change", "Version"]}
              rows={[
                ["A new icon", { tag: "Minor" }],
                ["A drawing corrected", { tag: "Patch" }],
                ["An icon removed or renamed", { tag: "Major" }],
              ]}
              caption="What each kind of change does to the version number."
            />
            <P>
              The changes of each release are listed in the changelog. The React package and the core
              always share the same version, so you never have to match them by hand.
            </P>
          </Section>

          <Section id="requests">
            <P>
              Neume grows from the interfaces people build with it. If an icon is missing, or one
              reads badly at a given size, ask for it.
            </P>
            <P>
              <TextLink href={ISSUES_URL} newTab>
                Open an issue on GitHub
              </TextLink>{" "}
              with the name you would expect, what the icon should mean, and where you would use it.
              A screenshot of the screen it is for helps more than anything else.
            </P>
          </Section>

          <Section id="about">
            <H3>The name</H3>
            <P>
              Neumes are the signs of plainchant notation, the ancestors of the notes we read today.
              The word comes from the Greek for a nod, a sign made with the head. By the 13th century,
              neumes were written as small square notes: compact marks on a staff, each telling the
              singer what to do. Neume icons try to do the same for an interface.
            </P>
            <H3>Why it exists</H3>
            <P>
              Neume started in November 2026, when my portfolio outgrew the borrowed pixel icons it
              used. I wanted a set drawn for real interfaces: sharp at the sizes an interface actually
              uses, with strokes one square wide that still sit in the middle of their box.
            </P>
            <H3>How it is made</H3>
            <P>
              Every icon is drawn by hand in Figma, square by square. A script reads the drawings,
              checks each one at every size, and generates both packages from them.
            </P>
            <H3>What comes next</H3>
            <P>
              Neume is the icon layer of Consort, the design system I am building next. New icons
              arrive with each minor version, and the changelog tells you which.
            </P>
            <div className="mt-6 flex max-w-[var(--site-docs-copy-width)] flex-wrap items-center justify-between gap-4">
              <AuthorLine />
              <div className="flex gap-2">
                <Button variant="secondary" content="icon" icon="globe" label="florianfaure.com" href="https://florianfaure.com" newTab />
                <Button variant="secondary" content="icon" icon="linkedin" label="LinkedIn" href="https://www.linkedin.com/in/florian-fa/" newTab />
                <Button variant="secondary" content="icon" icon="x" label="X" href="https://x.com/fl0rianfa" newTab />
                <Button variant="secondary" content="icon" icon="github" label="GitHub" href="https://github.com/florianfaure" newTab />
              </div>
            </div>
            <P>
              Neume is free and open source, under the{" "}
              <TextLink href={`${REPO_URL}/blob/main/LICENSE`} newTab>
                MIT licence
              </TextLink>
              . Use it in personal and commercial work.
            </P>
          </Section>
        </main>
      </div>

      <div className="mx-auto w-full max-w-[var(--site-max-width)] px-[var(--layout-gutter)] pt-16">
        <SiteFooter />
      </div>

      {layers}
    </>
  );
}
