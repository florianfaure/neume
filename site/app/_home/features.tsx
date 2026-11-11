import type { ReactNode } from "react";

import { FeatureCard } from "@/components/ui/feature-card";
import { BoardScene } from "./scenes/board";
import { DenseScene } from "./scenes/dense";
import { FeedbackScene } from "./scenes/feedback";
import { NavigationScene } from "./scenes/navigation";
import { PlayerScene } from "./scenes/player";
import { SizesScene } from "./scenes/sizes";
import { TogglesScene } from "./scenes/toggles";

/** L'enveloppe de grille d'une carte : la grille décide de l'étendue, la carte la remplit (loi 11, cas dur 1). */
function Slot({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col [&>*]:flex-1 ${className ?? ""}`}>{children}</div>;
}

/** « Made for interfaces » : sept cartes, sept scènes qui composent les vrais composants. */
export function Features() {
  return (
    <section aria-labelledby="features-title" className="flex flex-col gap-8 pt-24">
      <header className="flex max-w-[var(--site-lede-width)] flex-col gap-2">
        <h2 id="features-title" className="font-pixel text-h2 font-normal text-text-primary">
          Made for interfaces
        </h2>
        <p className="font-body text-body text-text-secondary">
          Square pixels that hold up in real products, from a 12 px badge to a 64 px empty state.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Slot className="lg:row-span-2">
          <FeatureCard
            scene={<BoardScene />}
            title="Drawn square by square"
            description="Every icon is placed by hand on a 12 × 12 grid. Click to draw the next one."
          />
        </Slot>
        <Slot>
          <FeatureCard
            scene={<SizesScene />}
            title="Crisp at every size"
            description="12 to 64, in steps of 4. Always whole pixels."
          />
        </Slot>
        <Slot>
          <FeatureCard
            scene={<TogglesScene />}
            title="Two states"
            description="Pairs drawn together, so a toggle never jumps."
          />
        </Slot>
        <Slot>
          <FeatureCard
            scene={<PlayerScene />}
            title="Media"
            description="Controls that read at a glance."
          />
        </Slot>
        <Slot>
          <FeatureCard
            scene={<FeedbackScene />}
            title="Feedback"
            description="Status at 24 px, next to the words it supports."
          />
        </Slot>
        <Slot>
          <FeatureCard
            scene={<NavigationScene />}
            title="Navigation"
            description="Calm at rest, clear when active."
          />
        </Slot>
        <Slot className="md:col-span-2">
          <FeatureCard
            scene={<DenseScene />}
            title="Dense lists"
            description="The 8 × 8 minis take over at 16 and 20 px, where detail would turn to mush."
          />
        </Slot>
      </div>
    </section>
  );
}
