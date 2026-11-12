"use client";

import { useEffect, useState } from "react";

import type { IconName } from "@/components/ui/icon";
import { List } from "@/components/ui/list";
import { ListRow } from "@/components/ui/list-row";
import { SearchField } from "@/components/ui/search-field";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const WORD = "open";
const ROWS: { label: string; icon: IconName; meta: string }[] = [
  { label: "Open file", icon: "file-text", meta: "⌘O" },
  { label: "Open link", icon: "external-link", meta: "⌘L" },
  { label: "Open message", icon: "mail", meta: "⌘M" },
  { label: "Open search", icon: "search", meta: "⌘F" },
];

/** « Dense lists » : un champ qui tape « open », et une liste de lignes de 36 px dont le fond avance seul. */
export function DenseScene() {
  const reduced = useReducedMotion();
  const [touched, setTouched] = useState(false);
  const [typed, setTyped] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    if (reduced || touched) return;
    const tick = setInterval(() => setTyped((n) => (n < WORD.length ? n + 1 : n)), 600);
    return () => clearInterval(tick);
  }, [reduced, touched]);

  const value = touched ? text : reduced ? WORD : WORD.slice(0, typed);

  return (
    <div className="flex w-full max-w-[var(--site-search-width)] flex-col gap-2">
      <SearchField
        label="Run a command"
        placeholder="Run a command"
        value={value}
        onValueChange={(next) => {
          setTouched(true);
          setText(next);
        }}
      />
      <List label="Commands" autoplay>
        {ROWS.map((row) => (
          <ListRow key={row.label} label={row.label} icon={row.icon} meta={row.meta} onClick={() => {}} />
        ))}
      </List>
    </div>
  );
}
