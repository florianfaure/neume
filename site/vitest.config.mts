import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Les tests du Worker (`worker/test/`), dans le runtime Workers, sur la configuration réelle.
// Les secrets sont des valeurs de test : le secret Turnstile est la clé de test qui accepte toujours.
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          GITHUB_TOKEN: "test-token",
          TURNSTILE_SECRET: "1x0000000000000000000000000000000AA",
          IP_SALT: "test-salt",
        },
      },
    }),
  ],
  test: { include: ["worker/test/**/*.test.ts"] },
});
