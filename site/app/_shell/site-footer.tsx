import { BrandMark } from "@/components/brand";
import { Footer } from "@/components/ui/footer";
import { Icon } from "@/components/ui/icon";

/**
 * Le pied de neume.dev, le même sur toutes les pages : la ligne (filet, licence, signature), puis le grand
 * signe qui monte au bas de la page. Les colonnes de liens sont retirées le 2026-11-13, décision de
 * Florian : sur l'accueil, la dernière section (« Drop it into your next interface ») fait office de pied.
 */
export function SiteFooter() {
  return (
    <Footer
      variant="line"
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
