"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Hero } from "@/components/Hero";
import { NotchSimulator } from "@/components/NotchSimulator";
import GradientWaves from "@/components/GradientWaves";
import { motion } from "framer-motion";

export default function HomePage() {
  const [isReady, setIsReady] = useState(false);

  const handleEntranceComplete = useCallback(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    // If user clicks anywhere or presses a key, advance immediately
    const handleQuickAdvance = () => setIsReady(true);
    window.addEventListener("click", handleQuickAdvance, { once: true });
    window.addEventListener("keydown", handleQuickAdvance, { once: true });

    return () => {
      window.removeEventListener("click", handleQuickAdvance);
      window.removeEventListener("keydown", handleQuickAdvance);
    };
  }, []);

  return (
    <main className="min-h-dvh w-full bg-[#0e0f12] text-[#f5f6f8] relative overflow-x-hidden overflow-y-auto pt-24 pb-16 flex flex-col items-center justify-center sm:h-dvh sm:overflow-hidden sm:pt-0 sm:pb-0 [@media(max-height:520px)]:h-auto [@media(max-height:520px)]:min-h-dvh [@media(max-height:520px)]:overflow-y-auto [@media(max-height:520px)]:pt-24 [@media(max-height:520px)]:pb-16 [@media(max-height:520px)]:justify-start">
      {/* Dimmed Background Overlay during Entrance Spotlight (fades out as page settles) */}
      <motion.div
        initial={{ opacity: 0.7 }}
        animate={isReady ? { opacity: 0 } : { opacity: 0.7 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute inset-0 z-[1] bg-black/65"
      />

      {/* Arc Ambient Mesh Glow Orbs (Behind Waves) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Cool Cobalt/Indigo Glow (Top-Left) */}
        <div className="absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-[#2E28D4]/40 blur-[130px]" />
        {/* Hot Magenta/Pink Glow (Bottom-Right) */}
        <div className="absolute -bottom-[15%] -right-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-[#EC4899]/35 blur-[130px]" />
        {/* Luminous Violet Midtone Bridge (Center) */}
        <div className="absolute top-[35%] left-[25%] w-[45vw] h-[45vw] max-w-[650px] max-h-[650px] rounded-full bg-[#8B5CF6]/25 blur-[150px]" />
      </div>

      {/* Background: WebGL2 GradientWaves tuned to Arc Brand Palette */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <GradientWaves
          horizonColor="#2E28D4"
          waveColor="#EC4899"
          crestColor="#FB7185"
          speed={0}
          amplitude={2.2}
          waveScale={0.6}
          waveRatio={0.9}
          swell={32}
          turbulence={22}
          tilt={1.11}
          zoom={1.0}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1.0}
          opacity={1.0}
          mouseInteraction={false}
          parallaxStrength={0}
          grain={false}
          grainIntensity={0}
        />
      </div>

      {/* Real Windows/Coucou Notch Engine mounted at top-center with entrance slide-down */}
      <NotchSimulator visible={isReady} />

      {/* Centered Single-Screen Hero (Hey Cleo! Typewriter + Subtitle + Mac/Windows CTAs) */}
      <Hero isReady={isReady} onEntranceComplete={handleEntranceComplete} />

      {/* Bottom Footer Text with Author Website, GitHub, and Doc Links */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={isReady ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.25 }}
        className="relative mt-8 sm:mt-0 sm:absolute sm:bottom-4 left-0 right-0 text-center select-none z-10 px-4 text-xs text-[#9398a1] [@media(max-height:520px)]:relative [@media(max-height:520px)]:bottom-auto [@media(max-height:520px)]:mt-8"
      >
        <span>
          © 2026{" "}
          <a
            href="https://delightchukwubuihem.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f5f6f8] hover:underline font-medium"
          >
            Delight Chukwubuihem
          </a>
          {" · "}
          Cleo&apos;s code is open source (MIT)
          {" · "}
          <a
            href="https://github.com/delightc123"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9398a1] hover:text-[#f5f6f8] hover:underline"
          >
            GitHub
          </a>
          {" · "}
          <a
            href="https://github.com/delightc123/CleoNotch/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9398a1] hover:text-[#f5f6f8] hover:underline"
          >
            Privacy
          </a>
          {" · "}
          <a
            href="https://github.com/delightc123/CleoNotch/blob/main/LICENSE-ASSETS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9398a1] hover:text-[#f5f6f8] hover:underline"
          >
            Terms
          </a>
          {" · "}
          <a
            href="https://github.com/delightc123/CleoNotch#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9398a1] hover:text-[#f5f6f8] hover:underline"
          >
            Legal notice
          </a>
        </span>
      </motion.footer>
    </main>
  );
}
