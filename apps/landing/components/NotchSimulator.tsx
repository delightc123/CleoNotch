"use client";

import React, { useEffect, useRef } from "react";
import "@/notch/style.css";
import { Sound } from "@/notch/core/sound";
import { State } from "@/notch/core/state";
import { Island } from "@/notch/island/island";
import { registerHookHandlers } from "@/notch/island/hooks";
import { registerIntegrationHandlers } from "@/notch/island/integrations";
import { registerShortcutHandlers } from "@/notch/island/shortcuts";
import { registerSpotifyHandlers } from "@/notch/island/spotify";
import { onLanguageChange, resolveLanguage, setLanguage, systemLanguages } from "@/notch/i18n/i18n";

function applyLanguage() {
  setLanguage(resolveLanguage(State.settings.language, systemLanguages()));
}

export function NotchSimulator({ visible = true }: { visible?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || bootedRef.current) return;
    bootedRef.current = true;

    root.replaceChildren();
    void Sound.preloadGreeting();
    void Sound.preload();

    const island = new Island(root);

    onLanguageChange(() => State.notify());
    applyLanguage();
    island.applySettings();
    State.loadIntegrationTasks();

    // Seed the main Claude Code pill with an active working session matching
    // design/captures/02_compact.png and design/captures/03_overview.png
    const mainTask = State.tasks.find((t) => t.id === State.mainPillId);
    if (mainTask) {
      mainTask.name = "Cleo · Claude Code";
      mainTask.state = "working";
      mainTask.steps = [
        "Inspecting workspace architecture",
        "Reading schema & IPC pipe definitions",
        "Running 365 unit tests across dual engines",
      ];
      mainTask.stepIndex = 1;
      mainTask.stepSeq = 2;
      State.notify();
    }

    void island.desktop.init();
    registerHookHandlers(island);
    registerIntegrationHandlers(island);
    registerShortcutHandlers(island, () => {
      State.paused = false;
    });
    registerSpotifyHandlers(island);

    island.launch();

    const handleFirstClick = () => Sound.resume();
    document.addEventListener("click", handleFirstClick, { once: true });

    return () => {
      document.removeEventListener("click", handleFirstClick);
    };
  }, []);

  return (
    <div
      id="root"
      ref={rootRef}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-40px)",
        transition: "opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    />
  );
}
