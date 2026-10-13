"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AppleIcon, WindowsNewIcon } from "@animateicons/react/huge";
import { Sound } from "@/notch/core/sound";

const GITHUB_REPO = "delightc123/CleoNotch";
const DEFAULT_MAC_URL = `https://github.com/${GITHUB_REPO}/releases/download/v0.3.0/HeyCleo.dmg`;
const DEFAULT_WINDOWS_URL = `https://github.com/${GITHUB_REPO}/releases/download/windows-latest/HeyCleo.exe`;

const FULL_TITLE = "Hey Cleo!";

const TAGLINES = [
  "A tiny desktop companion that lives in your notch.",
  "Your Desktop Has an AI Companion. Not Another Window.",
  "The Operating System for Autonomous Coding Agents.",
  "Sub-Second Voice Dictation Directly into Any Window.",
];

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  draft: boolean;
  prerelease: boolean;
  assets?: GitHubAsset[];
}

interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface HeroProps {
  isReady?: boolean;
  onEntranceComplete?: () => void;
}

export function Hero({ isReady = true, onEntranceComplete }: HeroProps) {
  // Title typewriter state
  const [titleText, setTitleText] = useState("");
  const [titleComplete, setTitleComplete] = useState(false);

  // Subtitle typewriter state
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState(TAGLINES[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [macUrl, setMacUrl] = useState(DEFAULT_MAC_URL);
  const [windowsUrl, setWindowsUrl] = useState(DEFAULT_WINDOWS_URL);

  const macIconRef = useRef<AnimatedIconHandle>(null);
  const winIconRef = useRef<AnimatedIconHandle>(null);

  // Entrance Title Typewriter: Types "Hey Cleo!" with mechanical sound
  useEffect(() => {
    if (isReady) {
      setTitleText(FULL_TITLE);
      setTitleComplete(true);
      return;
    }

    let charIndex = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let settleTimerId: ReturnType<typeof setTimeout> | null = null;

    // Initial delay for the focused gradient spotlight to bloom
    const timer = setTimeout(() => {
      intervalId = setInterval(() => {
        charIndex++;
        setTitleText(FULL_TITLE.slice(0, charIndex));
        Sound.playTypewriterClick();

        if (charIndex >= FULL_TITLE.length) {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          Sound.playCompletionChime();
          setTitleComplete(true);
          // Hold beat in spotlight before settling into full page HUD
          settleTimerId = setTimeout(() => {
            onEntranceComplete?.();
          }, 550);
        }
      }, 68);
    }, 220);

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
      if (settleTimerId) clearTimeout(settleTimerId);
    };
  }, [isReady, onEntranceComplete]);

  // Subtitle typewriter effect: starts after isReady is true
  useEffect(() => {
    if (!isReady) return;
    let timeout: NodeJS.Timeout;
    const currentFullText = TAGLINES[taglineIndex];

    if (!isDeleting) {
      if (displayedText.length < currentFullText.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
        }, 38);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2600);
      }
    } else {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 20);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(false);
          setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
        }, 350);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, taglineIndex, isReady]);

  // Automatically resolve latest releases from GitHub
  useEffect(() => {
    let cancelled = false;
    async function resolveLatestReleases() {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=15`, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) return;
        const releases = (await res.json()) as GitHubRelease[];
        if (cancelled || !Array.isArray(releases)) return;

        let foundMac: string | null = null;
        let foundWin: string | null = null;

        for (const rel of releases) {
          if (rel.draft) continue;
          for (const asset of rel.assets ?? []) {
            const lower = asset.name.toLowerCase();
            if (!foundMac && (lower.endsWith(".dmg") || lower.endsWith(".pkg") || lower.includes("mac"))) {
              foundMac = asset.browser_download_url;
            }
            if (!foundWin && (lower.endsWith(".msi") || lower.endsWith("-setup.exe") || lower.endsWith(".exe"))) {
              foundWin = asset.browser_download_url;
            }
          }
          if (foundMac && foundWin) break;
        }

        if (!cancelled) {
          if (foundMac) setMacUrl(foundMac);
          if (foundWin) setWindowsUrl(foundWin);
        }
      } catch {
        // Fallback smoothly
      }
    }
    void resolveLatestReleases();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative px-4 flex flex-col items-center justify-center text-center max-w-4xl mx-auto select-none z-10">
      {/* Arc Ambient Glowing Orb (Blooms as focused spotlight during entrance, softens as page settles) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={
          isReady
            ? { opacity: 0.35, scale: 1.15 }
            : { opacity: 0.95, scale: 1.0 }
        }
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute -inset-x-16 -inset-y-12 -z-10 rounded-full bg-gradient-to-r from-[#2E28D4]/60 via-[#8B5CF6]/50 to-[#EC4899]/60 blur-[90px]"
      />

      {/* Main Header — Types out "Hey Cleo!" with mechanical sound and liquid glass refraction */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: isReady ? 1 : 1.05, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-[1.125rem] text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#f5f6f8] min-h-[1.2em] flex items-center justify-center"
      >
        {/* Render "Hey " portion */}
        {titleText.length <= 4 ? (
          <span>{titleText}</span>
        ) : (
          <span>{titleText.slice(0, 4)}</span>
        )}

        {/* Render "Cleo!" with liquid glass transparency and Arc pink-blue refraction */}
        {titleText.length > 4 && (
          <span className="relative inline-block bg-gradient-to-b from-white/95 via-white/50 to-white/20 bg-clip-text text-transparent drop-shadow-[0_2px_18px_rgba(236,72,153,0.45)] drop-shadow-[0_4px_28px_rgba(59,130,246,0.35)]">
            {titleText.slice(4)}
          </span>
        )}

        {/* Blinking cursor while typing */}
        {!titleComplete && (
          <span
            className="inline-block w-[3px] h-[0.8em] bg-[#f5f6f8]/90 ml-1.5 align-middle animate-pulse"
            aria-hidden="true"
          />
        )}
      </motion.h1>

      {/* Subtitle with typewriter write-up and unwrite animation */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mb-9 min-h-[36px] flex items-center justify-center px-4"
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-medium tracking-tight text-[#9398a1] max-w-2xl inline-flex items-center justify-center">
          <span>{displayedText}</span>
          <span
            className="inline-block w-[2px] h-[0.9em] bg-[#f5f6f8]/80 ml-1.5 align-middle animate-pulse"
            aria-hidden="true"
          />
        </h2>
      </motion.div>

      {/* Download CTA Buttons — Sleeker Liquid Glassmorphic Pill Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4"
      >
        {/* Mac: Light Frosted Liquid Glass Button with Arc Pink Glow */}
        <a
          href={macUrl}
          onMouseEnter={() => macIconRef.current?.startAnimation()}
          onMouseLeave={() => macIconRef.current?.stopAnimation()}
          className="group relative inline-flex items-center justify-center gap-2 h-[40px] px-6 rounded-full bg-white/70 hover:bg-white/85 text-[#0e0f12] outline-none overflow-hidden backdrop-blur-xl backdrop-saturate-150 border border-white/80 border-t-white shadow-[inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.08),0_8px_20px_rgba(0,0,0,0.25)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_12px_28px_rgba(236,72,153,0.3)] active:scale-95 transition-all duration-200 cursor-pointer select-none"
        >
          {/* Top specular reflection curve */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] rounded-t-full bg-gradient-to-b from-white/40 to-transparent" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-full bg-gradient-to-r from-transparent via-white to-transparent"
          />

          <span className="relative z-10 flex items-center justify-center gap-2 whitespace-nowrap text-[13.5px] font-semibold tracking-tight text-[#0e0f12]">
            <AppleIcon ref={macIconRef} size={15} color="#0e0f12" />
            <span className="leading-none">Download for Mac</span>
          </span>
        </a>

        {/* Windows: Dark Frosted Liquid Glass Button with Arc Blue Glow */}
        <a
          href={windowsUrl}
          onMouseEnter={() => winIconRef.current?.startAnimation()}
          onMouseLeave={() => winIconRef.current?.stopAnimation()}
          className="group relative inline-flex items-center justify-center gap-2 h-[40px] px-6 rounded-full bg-black/40 hover:bg-black/55 text-[#f5f6f8] outline-none overflow-hidden backdrop-blur-xl backdrop-saturate-150 border border-white/20 hover:border-white/35 border-t-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.5),0_8px_20px_rgba(0,0,0,0.55)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_12px_28px_rgba(59,130,246,0.3)] active:scale-95 transition-all duration-200 cursor-pointer select-none"
        >
          {/* Top specular reflection curve */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] rounded-t-full bg-gradient-to-b from-white/15 to-transparent" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
          />

          <span className="relative z-10 flex items-center justify-center gap-2 whitespace-nowrap text-[13.5px] font-semibold tracking-tight text-[#f5f6f8]">
            <WindowsNewIcon ref={winIconRef} size={15} color="#f5f6f8" />
            <span className="leading-none">Download for Windows</span>
          </span>
        </a>
      </motion.div>
    </section>
  );
}
