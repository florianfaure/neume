/** Les adresses du site, écrites une fois : la barre, le pied, la palette, l'accueil et la doc les lisent. */
export const REPO_URL = "https://github.com/florianfaure/neume";
/** Le formulaire « Icon request » (`.github/ISSUE_TEMPLATE/icon-request.yml`). */
export const ISSUES_URL = `${REPO_URL}/issues/new?template=icon-request.yml`;
/** Les demandes déjà faites : les issues étiquetées `icon-request`. */
export const REQUESTS_URL = `${REPO_URL}/issues?q=label%3Aicon-request`;
/**
 * La clé de SITE Turnstile de neume.dev (publique, ce n'est pas un secret). Vide tant que Florian n'a pas
 * créé le widget : en local, `turnstile.tsx` prend la clé de test de Cloudflare.
 */
export const TURNSTILE_SITE_KEY = "";
