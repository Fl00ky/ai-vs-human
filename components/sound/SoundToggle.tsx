"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "./SoundProvider";

export function SoundToggle() {
  const { muted, toggleMuted } = useSound();
  return (
    <button
      onClick={toggleMuted}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      className="text-fg/40 hover:text-side transition-colors p-1.5"
      title={muted ? "Sound off — click to enable" : "Sound on"}
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
}
