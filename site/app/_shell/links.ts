/** Les adresses du site, écrites une fois : la barre, le pied, la palette, l'accueil et la doc les lisent. */
export const REPO_URL = "https://github.com/florianfaure/neume";
/** Le formulaire « Icon request » (`.github/ISSUE_TEMPLATE/icon-request.yml`). */
export const ISSUES_URL = `${REPO_URL}/issues/new?template=icon-request.yml`;
/** Les demandes déjà faites : les issues étiquetées `icon-request`. */
export const REQUESTS_URL = `${REPO_URL}/issues?q=label%3Aicon-request`;
/**
 * La clé de SITE du widget Turnstile « neume.dev » (publique, ce n'est pas un secret ; la clé secrète est
 * `TURNSTILE_SECRET` sur le Worker). En local, `turnstile.tsx` prend la clé de test de Cloudflare.
 */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAF_2l0UBeVl1xXPr";
