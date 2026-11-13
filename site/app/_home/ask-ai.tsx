import { Button } from "@/components/ui/button";

/**
 * La question envoyée à l'assistant : installer Neume dans le projet de la personne, après avoir lu la doc.
 * L'assistant lit neume.dev/docs lui-même : le texte de la page est dans le HTML exporté.
 */
const PROMPT =
  "Add Neume, the pixel icon set, to my project. Read https://neume.dev/docs first, then install the right package (@neume-icons/react for React, @neume-icons/svg for anything else) and show me how to use an icon.";

/**
 * Les assistants qui acceptent une question pré-remplie dans l'adresse, comme sur les pages projet du
 * portfolio (`app/(reading)/_render.tsx`, `ASK_AI_TARGETS`) : les mêmes adresses, relevées sur l'usage et
 * non documentées par leurs éditeurs. Codex, Gemini et Perplexity n'en ont pas, ou pas de fiable : absents.
 */
const TARGETS = [
  { label: "Ask Claude", icon: "claude", base: "https://claude.ai/new?q=" },
  { label: "Ask ChatGPT", icon: "chatgpt", base: "https://chatgpt.com/?q=" },
] as const;

/** Les boutons « Ask » de l'accueil : l'assistant de la personne installe Neume pour elle. */
export function AskAi() {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-body-sm text-text-tertiary">Or let your assistant set it up</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TARGETS.map(({ label, icon, base }) => (
          <Button
            key={label}
            variant="secondary"
            content="icon-label"
            icon={icon}
            label={label}
            href={`${base}${encodeURIComponent(PROMPT)}`}
            newTab
          />
        ))}
      </div>
    </div>
  );
}
