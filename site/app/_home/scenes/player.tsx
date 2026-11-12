"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Icon } from "@/components/ui/icon";
import { ToggleButton } from "@/components/ui/toggle-button";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const TRACKS = [
  { title: "Square Wave", artist: "Eight Bit Choir" },
  { title: "Neume No. 1", artist: "Gregorian Grid" },
  { title: "Crisp Edges", artist: "The Antialias" },
];
const LENGTH = 192;

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/** « Media » : un lecteur qui joue seul tant qu'on n'y touche pas. */
export function PlayerScene() {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const tick = setInterval(() => setPosition((p) => (p + 1) % LENGTH), 250);
    return () => clearInterval(tick);
  }, [playing]);

  useEffect(() => {
    if (reduced) return;
    const start = setTimeout(() => setPlaying(true), 800);
    return () => clearTimeout(start);
  }, [reduced]);

  const go = (step: number) => {
    setTrack((t) => (t + step + TRACKS.length) % TRACKS.length);
    setPosition(0);
  };

  return (
    <div className="flex w-full max-w-[var(--site-scene-width)] flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-inverse text-text-inverse">
          <Icon name="music" />
        </span>
        <div className="flex min-w-0 flex-col">
          <p className="truncate font-body text-body-sm font-medium text-text-primary">
            {TRACKS[track].title}
          </p>
          <p className="truncate font-body text-caption text-text-tertiary">{TRACKS[track].artist}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <ProgressBar label={playing ? "Playing" : "Paused"} value={(position / LENGTH) * 100} />
        <p className="flex justify-between font-body text-caption tabular-nums text-text-tertiary">
          <span>{clock(position)}</span>
          <span>{clock(LENGTH)}</span>
        </p>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          content="icon"
          icon="skip-back"
          label="Previous"
          onClick={() => go(-1)}
        />
        <Button
          content="icon"
          icon={playing ? "pause" : "play"}
          label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((p) => !p)}
        />
        <Button
          variant="ghost"
          content="icon"
          icon="skip-forward"
          label="Next"
          onClick={() => go(1)}
        />
        <ToggleButton label="Mute" icon="volume" pressedIcon="volume-off" />
      </div>
    </div>
  );
}
