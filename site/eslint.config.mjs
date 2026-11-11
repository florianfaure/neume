import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next already registers the jsx-a11y plugin instance;
  // re-declaring it via jsxA11y.flatConfigs.recommended would conflict
  // ("Cannot redefine plugin"), so only the rules are merged in here.
  {
    name: "jsx-a11y/recommended",
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worktrees and settings of Claude Code sessions: other checkouts, not this repo's code.
    ".claude/**",
    // Agent skills installed from outside (skills-lock.json): their templates, not this repo's code.
    ".agents/**",
  ]),
]);

export default eslintConfig;
