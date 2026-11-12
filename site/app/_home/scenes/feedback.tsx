"use client";

import { useEffect, useRef } from "react";

import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/lib/toast";
import type { ToastOptions } from "@/lib/toast";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const SCOPE = "feedback";
const noop = () => {};
const TOASTS: ToastOptions[] = [
  { title: "Changes saved", description: "Your icon set is up to date.", tone: "positive" },
  { title: "New message", description: "Florian sent you a file." },
  { title: "Low storage", description: "2 GB left on this device.", tone: "negative" },
  { title: "Branch merged", description: "site/home into main.", tone: "positive", action: { label: "View", onClick: noop } },
  { title: "Export ready", description: "neume-svg.zip, 214 KB.", action: { label: "Download", onClick: noop } },
  { title: "Copied to clipboard", tone: "positive" },
  { title: "Upload failed", description: "The connection dropped.", tone: "negative", action: { label: "Retry", onClick: noop } },
  { title: "Reminder", description: "Review the icon set at 3 pm." },
  { title: "Invite sent", description: "Ana will get an email.", tone: "positive" },
  { title: "File deleted", tone: "negative", action: { label: "Undo", onClick: noop } },
  { title: "Sync paused", description: "You are offline." },
];

/**
 * « Feedback » : les notifications jouent seules dans la carte, en boucle, par un vrai `Toaster` posé en
 * conteneur. Elles ne partent que tant que la carte est à l'écran ; sous mouvement réduit, deux notifications
 * restent posées et rien ne boucle.
 */
export function FeedbackScene() {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let index = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const fire = () => {
      toast({ ...TOASTS[index % TOASTS.length], scope: SCOPE });
      index += 1;
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const observer = new IntersectionObserver(([entry]) => {
      stop();
      if (!entry.isIntersecting) return;
      fire();
      if (reduced) {
        fire();
        return;
      }
      timer = setInterval(fire, 2600);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [reduced]);

  return (
    <div ref={host} className="relative w-full self-stretch">
      <Toaster placement="container" scope={SCOPE} label="Sample notifications" />
    </div>
  );
}
