"use client";

import { useEffect, useState } from "react";

import type { IconName } from "@/components/ui/icon";
import { List } from "@/components/ui/list";
import { ListRow } from "@/components/ui/list-row";
import { SearchField } from "@/components/ui/search-field";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const WORD = "open";
const ROWS: { id: string; label: string; icon: IconName; meta: string }[] = [
  { id: "dense-file", label: "Open file", icon: "file-text-sm", meta: "⌘O" },
  { id: "dense-link", label: "Open link", icon: "external-link-sm", meta: "⌘L" },
  { id: "dense-message", label: "Open message", icon: "mail-sm", meta: "⌘M" },
  { id: "dense-search", label: "Open search", icon: "search-sm", meta: "⌘F" },
];

/** « Dense lists » : un champ qui tape « open », une liste de lignes de 36 px dont la ligne active avance. */
export function DenseScene() {
  const reduced = useReducedMotion();
  const [touched, setTouched] = useState(false);
  const [typed, setTyped] = useState(0);
  const [active, setActive] = useState(ROWS[0].id);
  const [text, setText] = useState("");

  useEffect(() => {
    if (reduced || touched) return;
    const tick = setInterval(() => {
      setTyped((n) => (n < WORD.length ? n + 1 : n));
      setActive((current) => ROWS[(ROWS.findIndex((r) => r.id === current) + 1) % ROWS.length].id);
    }, 600);
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
      <List
        mode="listbox"
        id="dense-list"
        label="Commands"
        activeId={active}
        onActiveChange={(id) => {
          setTouched(true);
          setActive(id);
        }}
      >
        {ROWS.map((row) => (
          <ListRow
            key={row.id}
            option
            id={row.id}
            label={row.label}
            icon={row.icon}
            meta={row.meta}
            selected={row.id === active}
          />
        ))}
      </List>
    </div>
  );
}
