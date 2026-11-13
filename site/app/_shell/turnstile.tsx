"use client";

import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "./links";

/** La clé de site de TEST publiée par Cloudflare : elle accepte toujours. En local seulement. */
const TEST_SITE_KEY = "1x00000000000000000000AA";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;

/** Le script de Turnstile, chargé une fois, au premier dialogue ouvert. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    script.onerror = () => {
      loading = null;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** La clé de site : celle de test en local, celle de neume.dev partout ailleurs (previews comprises). */
function siteKey(): string {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" ? TEST_SITE_KEY : TURNSTILE_SITE_KEY;
}

/**
 * Le contrôle anti-robot de Cloudflare, en `interaction-only` : invisible tant que Cloudflare ne demande pas
 * de clic. Le jeton ne sert qu'une fois : l'appelant remonte le composant (`key`) après chaque envoi.
 */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const latest = useRef(onToken);
  useEffect(() => {
    latest.current = onToken;
  });

  useEffect(() => {
    let id: string | null = null;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !box.current) return;
        id = api.render(box.current, {
          sitekey: siteKey(),
          appearance: "interaction-only",
          callback: (token: string) => latest.current(token),
          "expired-callback": () => latest.current(null),
          "error-callback": () => latest.current(null),
        });
      })
      .catch(() => latest.current(null));
    return () => {
      cancelled = true;
      if (id) window.turnstile?.remove(id);
    };
  }, []);

  return <div ref={box} />;
}
