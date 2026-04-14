"use client";
// frontend/src/components/TTSButton.tsx
// Plays an AI message aloud via Bhashini TTS

import { useState } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { LANG_CODE } from "./VoiceButton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  text: string;
  language: string; // display name e.g. "Hindi"
}

type State = "idle" | "loading" | "playing" | "error";

// Single shared audio instance so only one plays at a time
let currentAudio: HTMLAudioElement | null = null;

export default function TTSButton({ text, language }: Props) {
  const [state, setState] = useState<State>("idle");

  async function handleClick() {
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    if (state === "playing") {
      setState("idle");
      return;
    }

    setState("loading");
    try {
      const langCode = LANG_CODE[language] || "en";
      // Strip markdown for cleaner TTS
      const cleanText = text
        .replace(/#{1,6}\s/g, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/`/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\|.*\|/g, "") // strip tables
        .slice(0, 600);

      const res = await fetch(`${API}/api/voice/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, language: langCode }),
      });

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

      const data = await res.json();
      const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
      currentAudio = audio;

      audio.onended = () => { setState("idle"); currentAudio = null; };
      audio.onerror = () => { setState("error"); currentAudio = null; };

      await audio.play();
      setState("playing");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <button
      onClick={handleClick}
      title={state === "playing" ? "Stop" : "Listen"}
      className={`p-1 rounded transition-all
        ${state === "playing"  ? "text-[var(--gold-light)] bg-yellow-900/30" :
          state === "loading"  ? "text-yellow-500 cursor-wait" :
          state === "error"    ? "text-red-400" :
          "text-[var(--text-muted)] hover:text-[var(--gold-light)] hover:bg-white/10 opacity-0 group-hover:opacity-100"}`}
    >
      {state === "loading"  ? <Loader2 size={12} className="animate-spin" /> :
       state === "playing"  ? <VolumeX size={12} /> :
                              <Volume2 size={12} />}
    </button>
  );
}
