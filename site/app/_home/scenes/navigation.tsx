"use client";

import { useState } from "react";

import type { IconName } from "@/components/ui/icon";
import { List } from "@/components/ui/list";
import { ListRow } from "@/components/ui/list-row";

const ROWS: { label: string; icon: IconName; badge?: string }[] = [
  { label: "Messages", icon: "mail", badge: "3" },
  { label: "Documents", icon: "file-text" },
  { label: "Search", icon: "search" },
  { label: "Shared", icon: "share" },
  { label: "About", icon: "info" },
];

/** « Navigation » : une liste dont le fond suit le pointeur et le clavier, la page courante au bout. */
export function NavigationScene() {
  const [current, setCurrent] = useState("Messages");

  return (
    <div className="w-full max-w-[var(--site-scene-width)]">
      <List label="Sections" autoplay>
        {ROWS.map((row) => (
          <ListRow
            key={row.label}
            label={row.label}
            icon={row.icon}
            meta={current === row.label ? "Here" : row.badge}
            onClick={() => setCurrent(row.label)}
          />
        ))}
      </List>
    </div>
  );
}
