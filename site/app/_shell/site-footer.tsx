import { Footer } from "@/components/ui/footer";
import { Icon } from "@/components/ui/icon";

/**
 * Le pied de neume.dev, le même sur toutes les pages : la ligne seule (filet, licence, signature). Les
 * colonnes de liens et le grand signe sont retirés le 2026-11-13, décision de Florian : sur l'accueil, la
 * dernière section (« Drop it into your next interface ») fait office de pied.
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
    />
  );
}
