"use client";
// Records audio as 16kHz mono WAV directly in the browser using Web Audio API
// No ffmpeg, no conversion — Bhashini gets exactly what it needs

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  language: string;       // display name e.g. "Hindi"
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}

type State = "idle" | "recording" | "processing" | "error";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const LANG_CODE: Record<string, string> = {
  English: "en", Hindi: "hi", Bengali: "bn", Telugu: "te",
  Marathi: "mr", Tamil: "ta", Gujarati: "gu", Kannada: "kn",
  Malayalam: "ml", Punjabi: "pa", Odia: "or",
};

// ── WAV encoder ───────────────────────────────────────────────────────────────
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2; // 16-bit = 2 bytes per sample
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeStr(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);          // PCM chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  // Convert Float32 PCM → Int16
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

// ── Downsample to target rate ─────────────────────────────────────────────────
function downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buffer;
  const ratio = fromRate / toRate;
  const result = new Float32Array(Math.floor(buffer.length / ratio));
  for (let i = 0; i < result.length; i++) {
    result[i] = buffer[Math.floor(i * ratio)];
  }
  return result;
}

export default function VoiceButton({ language, onTranscribed, disabled }: Props) {
  const [state, setState]     = useState<State>("idle");
  const [seconds, setSeconds] = useState(0);
  const [errMsg, setErrMsg]   = useState("");

  const audioCtxRef     = useRef<AudioContext | null>(null);
  const processorRef    = useRef<ScriptProcessorNode | null>(null);
  const sourceRef       = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const samplesRef      = useRef<Float32Array[]>([]);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
  }

  async function startRecording() {
    setErrMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      samplesRef.current = [];

      // Use 16kHz directly if browser supports it, else we downsample
      const TARGET_RATE = 16000;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const nativeRate = ctx.sampleRate;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // bufferSize 4096 gives ~256ms chunks at 16kHz
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        const downsampled = downsample(new Float32Array(channelData), nativeRate, TARGET_RATE);
        samplesRef.current.push(downsampled);
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s >= 29) { stopRecording(); return 0; }
          return s + 1;
        });
      }, 1000);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Microphone error";
      setState("error");
      setErrMsg(msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("permission")
        ? "Mic access denied — click the 🔒 in your browser address bar to allow it"
        : msg);
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(0);

    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});

    const allSamples = samplesRef.current;
    if (!allSamples.length) {
      setState("error");
      setErrMsg("No audio captured. Please try again.");
      return;
    }

    // Merge all chunks
    const totalLen = allSamples.reduce((n, a) => n + a.length, 0);
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const chunk of allSamples) { merged.set(chunk, offset); offset += chunk.length; }

    const wavBlob = encodeWav(merged, 16000);
    setState("processing");
    transcribe(wavBlob);
  }

  async function transcribe(wavBlob: Blob) {
    try {
      const langCode = LANG_CODE[language] || "hi";
      const form = new FormData();
      form.append("file", wavBlob, "recording.wav");
      form.append("language", langCode);

      const res = await fetch(`${API}/api/voice/asr`, { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
      if (data.text) {
        onTranscribed(data.text);
        setState("idle");
      } else {
        throw new Error("Empty transcription");
      }
    } catch (err: unknown) {
      setState("error");
      setErrMsg(err instanceof Error ? err.message : "Transcription failed");
    }
  }

  function handleClick() {
    if (disabled) return;
    if (state === "recording") stopRecording();
    else if (state === "idle" || state === "error") {
      setState("idle"); setErrMsg("");
      startRecording();
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={handleClick}
        disabled={disabled || state === "processing"}
        title={state === "recording" ? `Stop (${seconds}s)` : state === "processing" ? "Processing…" : `Speak in ${language}`}
        className={clsx(
          "relative p-1.5 rounded-lg transition-all disabled:cursor-not-allowed",
          state === "recording"
            ? "text-red-400 bg-red-500/20 hover:bg-red-500/30"
            : state === "processing"
            ? "text-yellow-400 bg-yellow-500/10"
            : state === "error"
            ? "text-orange-400 hover:bg-orange-500/20"
            : "text-gray-500 hover:text-[var(--gold-light)] hover:bg-white/10"
        )}
      >
        {state === "processing" ? (
          <Loader2 size={15} className="animate-spin" />
        ) : state === "recording" ? (
          <>
            <MicOff size={15} />
            <span className="absolute inset-0 rounded-lg ring-2 ring-red-500/60 animate-ping" />
          </>
        ) : (
          <Mic size={15} />
        )}
      </button>

      {/* Timer badge */}
      {state === "recording" && (
        <span className="absolute -top-2 -right-2 text-[0.6rem] bg-red-500 text-white
          rounded-full w-4 h-4 flex items-center justify-center font-mono font-bold">
          {seconds}
        </span>
      )}

      {/* Error tooltip */}
      {state === "error" && errMsg && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 z-50
          bg-gray-900 border border-red-700/40 rounded-lg px-3 py-2
          text-[0.7rem] text-red-300 shadow-xl text-center whitespace-normal">
          {errMsg}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4
            border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
