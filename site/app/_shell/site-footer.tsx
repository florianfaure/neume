import { BrandLockup, BrandMark } from "@/components/brand";
import { Footer } from "@/components/ui/footer";
import { Icon } from "@/components/ui/icon";
import { NPM_URL, REPO_URL } from "./links";

/** Le pied de neume.dev, le même sur toutes les pages. « Icons » vise `/#icons`, valable partout. */
export function SiteFooter() {
  return (
    <Footer
      variant="columns"
      brand={<BrandLockup />}
      lead="A pixel icon set drawn square by square, for React and plain SVG."
      groups={[
        {
          title: "Neume",
          links: [
            { label: "Icons", href: "/#icons" },
            { label: "Docs", href: "/docs" },
            { label: "Changelog", href: "/changelog" },
          ],
        },
        {
          title: "Elsewhere",
          links: [
            { label: "npm", href: NPM_URL, newTab: true },
            { label: "GitHub", href: REPO_URL, newTab: true },
          ],
        },
      ]}
      social={[{ label: "GitHub", href: REPO_URL, icon: "github" }]}
      start="MIT licence"
      end={
        <span className="inline-flex items-center gap-2">
          <Icon name="edit" size={16} />
          Drawn by Florian Faure
        </span>
      }
      display={<BrandMark className="size-[var(--site-footer-mark-size)] text-list-highlight" />}
    />
  );
}
