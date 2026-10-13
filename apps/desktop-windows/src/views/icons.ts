// SVG paths standing in for the SF Symbols used by the macOS island.
// Drawn on a 24×24 grid so they read at the same optical size.

export interface IconPart {
  tag?: "path" | "circle" | "line" | "polyline" | "rect" | "g";
  d?: string;
  class?: string;
  fill?: string | boolean;
  stroke?: number;
  evenOdd?: boolean;
  attrs?: Record<string, string | number>;
}

export interface IconDef {
  name: string;
  viewBox?: string;
  parts: IconPart[];
}

export type IconValue = string | IconDef;

export const ICONS: Record<string, IconDef> = {
  // house.fill (Home01Icon - animateicons.in)
  house: {
    name: "house",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M3 9.5l9-7 9 7", class: "icon-house-roof", stroke: 2 },
      { d: "M19 9.5V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9.5", class: "icon-house-body", stroke: 2 },
      { d: "M9 22V12h6v10", class: "icon-house-door", stroke: 2 },
    ],
  },
  // bubble.left.fill (Chat01Icon - animateicons.in)
  bubble: {
    name: "bubble",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z", class: "icon-bubble-outline", stroke: 2 },
      { tag: "circle", class: "icon-bubble-dot", attrs: { cx: 8, cy: 12, r: 1 }, fill: "currentColor" },
      { tag: "circle", class: "icon-bubble-dot", attrs: { cx: 12, cy: 12, r: 1 }, fill: "currentColor" },
      { tag: "circle", class: "icon-bubble-dot", attrs: { cx: 16, cy: 12, r: 1 }, fill: "currentColor" },
    ],
  },
  // plus (Add01Icon - animateicons.in)
  plus: {
    name: "plus",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M12 5v14M5 12h14", class: "icon-plus-cross", stroke: 2.2 },
    ],
  },
  // gear (Settings01Icon - animateicons.in)
  gear: {
    name: "gear",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", stroke: 2 },
      {
        d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
        class: "icon-gear-teeth",
        stroke: 2,
      },
    ],
  },
  // gearFill
  gearFill: {
    name: "gearFill",
    viewBox: "0 0 24 24",
    parts: [
      {
        d: "M10.9 2h2.2l.35 2.1c.6.17 1.16.4 1.67.71l1.9-1 1.55 1.55-1 1.9c.3.5.54 1.07.7 1.67l2.13.35v2.2l-2.12.35c-.17.6-.4 1.16-.71 1.67l1 1.9-1.55 1.55-1.9-1c-.5.3-1.07.54-1.67.7L13.1 22h-2.2l-.35-2.12c-.6-.17-1.16-.4-1.67-.71l-1.9 1L5.43 18.6l1-1.9c-.3-.5-.54-1.07-.7-1.67L3.6 14.7v-2.2l2.12-.35c.17-.6.4-1.16.71-1.67l-1-1.9 1.55-1.55 1.9 1c.5-.3 1.07-.54 1.67-.7L10.9 2zM12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z",
        class: "icon-gear-teeth",
        fill: "currentColor",
      },
    ],
  },
  // speaker.wave.2 (VolumeHighIcon - animateicons.in)
  speakerOn: {
    name: "speakerOn",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M11 4.5 6.5 8.2H3.4v7.6h3.1L11 19.5v-15z", class: "icon-vol-body", fill: "currentColor" },
      { d: "M14.2 7.5a5.3 5.3 0 0 1 0 9M16.8 4.4a8.9 8.9 0 0 1 0 15.2", class: "icon-vol-waves", stroke: 2 },
    ],
  },
  // speaker.slash (VolumeOffIcon - animateicons.in)
  speakerOff: {
    name: "speakerOff",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M11 4.5 6.5 8.2H3.4v7.6h3.1L11 19.5v-15z", class: "icon-vol-body", fill: "currentColor" },
      { d: "M15 9l6 6M21 9l-6 6", class: "icon-vol-x", stroke: 2 },
    ],
  },
  // arrow.up.right (ArrowUpRight01Icon - animateicons.in)
  arrowUpRight: {
    name: "arrowUpRight",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M7 17L17 7", class: "icon-arrow-shaft", stroke: 2.2 },
      { d: "M7 7h10v10", class: "icon-arrow-head", stroke: 2.2 },
    ],
  },
  // arrow.clockwise (Refresh01Icon - animateicons.in)
  arrowClockwise: {
    name: "arrowClockwise",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", class: "icon-refresh-arc", stroke: 2.2 },
      { d: "M3 3v5h5", class: "icon-refresh-arrow", stroke: 2.2 },
      { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16", class: "icon-refresh-arc", stroke: 2.2 },
      { d: "M16 16h5v5", class: "icon-refresh-arrow", stroke: 2.2 },
    ],
  },
  // chevron.right
  chevronRight: {
    name: "chevronRight",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M9 5.5 15.5 12 9 18.5", class: "icon-chevron-path", stroke: 2 },
    ],
  },
  // chevron.left
  chevronLeft: {
    name: "chevronLeft",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M15 5.5 8.5 12 15 18.5", class: "icon-chevron-path", stroke: 2 },
    ],
  },
  // chevron.up
  chevronUp: {
    name: "chevronUp",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M5.5 15 12 8.5 18.5 15", class: "icon-chevron-path", stroke: 2 },
    ],
  },
  // checkmark (CheckIcon - animateicons.in)
  check: {
    name: "check",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M20 6L9 17l-5-5", class: "icon-check-stroke", stroke: 2.2 },
    ],
  },
  // arrow.up (SendIcon - animateicons.in)
  arrowUp: {
    name: "arrowUp",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M12 19V5", class: "icon-send-shaft", stroke: 2.2 },
      { d: "M5 12l7-7 7 7", class: "icon-send-head", stroke: 2.2 },
    ],
  },
  // exclamationmark
  bang: {
    name: "bang",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M11 4h2v10h-2V4z", class: "icon-bang-stem", fill: true },
      { d: "M11 16.2h2v2.2h-2v-2.2z", class: "icon-bang-dot", fill: true },
    ],
  },
  // xmark
  xmark: {
    name: "xmark",
    viewBox: "0 0 24 24",
    parts: [
      {
        d: "M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5z",
        class: "icon-xmark-body",
        fill: true,
      },
    ],
  },
  // timer (Timer01Icon - animateicons.in)
  timer: {
    name: "timer",
    viewBox: "0 0 24 24",
    parts: [
      { tag: "circle", class: "icon-timer-dial", attrs: { cx: 12, cy: 14, r: 8 }, stroke: 2 },
      { d: "M12 14V10", class: "icon-timer-hand", stroke: 2 },
      { d: "M10 2h4", class: "icon-timer-top", stroke: 2 },
    ],
  },
  // ellipsis (MoreHorizontalIcon - animateicons.in)
  ellipsis: {
    name: "ellipsis",
    viewBox: "0 0 24 24",
    parts: [
      { tag: "circle", class: "icon-more-dot", attrs: { cx: 6, cy: 12, r: 1.6 }, fill: "currentColor" },
      { tag: "circle", class: "icon-more-dot", attrs: { cx: 12, cy: 12, r: 1.6 }, fill: "currentColor" },
      { tag: "circle", class: "icon-more-dot", attrs: { cx: 18, cy: 12, r: 1.6 }, fill: "currentColor" },
    ],
  },
  // star.fill (StarIcon - animateicons.in)
  star: {
    name: "star",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", class: "icon-star-body", fill: "currentColor" },
    ],
  },
  // square.stack.fill
  stack: {
    name: "stack",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M5 8h14v11.5H5V8z", class: "icon-stack-front", fill: true },
      { d: "M6.8 5h10.4v1.6H6.8V5z", class: "icon-stack-mid", fill: true },
      { d: "M8.4 2.4h7.2V4H8.4V2.4z", class: "icon-stack-back", fill: true },
    ],
  },
  // doc.on.doc (CopyIcon - animateicons.in)
  copy: {
    name: "copy",
    viewBox: "0 0 24 24",
    parts: [
      { tag: "rect", class: "icon-copy-back", attrs: { x: 8, y: 8, width: 13, height: 13, rx: 2, ry: 2 }, stroke: 2 },
      { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", class: "icon-copy-front", stroke: 2 },
    ],
  },
  // chevron.up.chevron.down
  chevronUpDown: {
    name: "chevronUpDown",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M8 9.5 12 5.5l4 4", class: "icon-chevron-up", stroke: 2 },
      { d: "M8 14.5l4 4 4-4", class: "icon-chevron-down", stroke: 2 },
    ],
  },
  // arrow.triangle.pull (GitPullRequestIcon - animateicons.in)
  pull: {
    name: "pull",
    viewBox: "0 0 24 24",
    parts: [
      { tag: "circle", class: "icon-git-dot", attrs: { cx: 6, cy: 6, r: 3 }, stroke: 2.2 },
      { tag: "circle", class: "icon-git-dot", attrs: { cx: 6, cy: 18, r: 3 }, stroke: 2.2 },
      { d: "M6 9v6", class: "icon-git-line", stroke: 2.2 },
      { tag: "circle", class: "icon-git-dot", attrs: { cx: 18, cy: 9, r: 3 }, stroke: 2.2 },
      { d: "M6 9a9 9 0 0 1 9 9", class: "icon-git-curve", stroke: 2.2 },
    ],
  },
  // eye (EyeIcon - animateicons.in)
  eye: {
    name: "eye",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z", class: "icon-eye-lid", stroke: 2.2 },
      { tag: "circle", class: "icon-eye-pupil", attrs: { cx: 12, cy: 12, r: 3 }, stroke: 2.2 },
    ],
  },
  // eye.slash (EyeOffIcon - animateicons.in)
  eyeOff: {
    name: "eyeOff",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.4 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6.4 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24", class: "icon-eye-lid", stroke: 2 },
      { d: "M2 2l20 20", class: "icon-eye-slash", stroke: 2 },
    ],
  },
  // terminal (TerminalIcon - animateicons.in)
  terminal: {
    name: "terminal",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M4 17l6-6-6-6", class: "icon-terminal-prompt", stroke: 2.2 },
      { d: "M12 19h8", class: "icon-terminal-cursor", stroke: 2.2 },
    ],
  },
  // cursorarrow.rays (Cursor01Icon - animateicons.in)
  cursor: {
    name: "cursor",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M4 4l7.07 17 2.51-7.39L21 11.07 4 4z", class: "icon-cursor-body", stroke: 2 },
      { d: "M13.5 13.5L19 19", class: "icon-cursor-tail", stroke: 2 },
    ],
  },
  // arrow.up.forward.app (ExternalLinkIcon - animateicons.in)
  external: {
    name: "external",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", class: "icon-external-box", stroke: 2 },
      { d: "M15 3h6v6", class: "icon-external-head", stroke: 2 },
      { d: "M10 14L21 3", class: "icon-external-shaft", stroke: 2 },
    ],
  },
  // checkmark.seal.fill (BadgeCheckIcon - animateicons.in)
  seal: {
    name: "seal",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M12 1.8 14.23 3.69 17.1 3.17 18.08 5.92 20.83 6.9 20.31 9.77 22.2 12 20.31 14.23 20.83 17.1 18.08 18.08 17.1 20.83 14.23 20.31 12 22.2 9.77 20.31 6.9 20.83 5.92 18.08 3.17 17.1 3.69 14.23 1.8 12 3.69 9.77 3.17 6.9 5.92 5.92 6.9 3.17 9.77 3.69zM7.4 12.3 8.8 10.9 10.7 12.8 15.2 8.3 16.6 9.7 10.7 15.6z", class: "icon-seal-badge", fill: true, evenOdd: true },
    ],
  },
  // xmark.octagon.fill (CancelCircleIcon - animateicons.in)
  octagonX: {
    name: "octagonX",
    viewBox: "0 0 24 24",
    parts: [
      {
        d: "M21.61 15.98 15.98 21.61 8.02 21.61 2.39 15.98 2.39 8.02 8.02 2.39 15.98 2.39 21.61 8.02zM8.53 7.66 12 11.13 15.47 7.66 16.34 8.53 12.87 12 16.34 15.47 15.47 16.34 12 12.87 8.53 16.34 7.66 15.47 11.13 12 7.66 8.53z",
        class: "icon-octagon-body",
        fill: true,
        evenOdd: true,
      },
    ],
  },
  // doc.text (File01Icon - animateicons.in)
  doc: {
    name: "doc",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", class: "icon-doc-sheet", stroke: 2 },
      { d: "M14 2v6h6", class: "icon-doc-fold", stroke: 2 },
      { d: "M16 13H8M16 17H8M10 9H8", class: "icon-doc-lines", stroke: 2 },
    ],
  },
  // ── Now playing (the Spotify pill and card) ──
  // play.fill (PlayIcon - animateicons.in)
  play: {
    name: "play",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M7 4.6c0-.8.9-1.3 1.6-.9l11 6.9c.6.4.6 1.4 0 1.8l-11 6.9c-.7.4-1.6-.1-1.6-.9V4.6z", class: "icon-play-shape", fill: "currentColor" },
    ],
  },
  // pause.fill (PauseIcon - animateicons.in)
  pause: {
    name: "pause",
    viewBox: "0 0 24 24",
    parts: [
      { tag: "rect", class: "icon-pause-bar", attrs: { x: 6, y: 4.5, width: 4, height: 15, rx: 1 }, fill: "currentColor" },
      { tag: "rect", class: "icon-pause-bar", attrs: { x: 14, y: 4.5, width: 4, height: 15, rx: 1 }, fill: "currentColor" },
    ],
  },
  // forward.fill (Forward01Icon - animateicons.in)
  forward: {
    name: "forward",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M4 5.5l8 6.5-8 6.5V5.5z", class: "icon-skip-first", fill: "currentColor" },
      { d: "M12 5.5l8 6.5-8 6.5V5.5z", class: "icon-skip-second", fill: "currentColor" },
    ],
  },
  // backward.fill (Backward01Icon - animateicons.in)
  backward: {
    name: "backward",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M20 18.5l-8-6.5 8-6.5v13z", class: "icon-skip-first", fill: "currentColor" },
      { d: "M12 18.5l-8-6.5 8-6.5v13z", class: "icon-skip-second", fill: "currentColor" },
    ],
  },
  // shuffle (ShuffleIcon - animateicons.in)
  shuffle: {
    name: "shuffle",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M3 7h3.2c1.9 0 3.1.9 4.1 2.5l3.4 5c1 1.6 2.2 2.5 4.1 2.5H21M18.6 4.6 21 7l-2.4 2.4", class: "icon-shuffle-line", stroke: 2.2 },
      { d: "M3 17h3.2c1.6 0 2.7-.6 3.6-1.8M14.2 8.8C15.1 7.6 16.2 7 17.8 7H21M18.6 14.6 21 17l-2.4 2.4", class: "icon-shuffle-line", stroke: 2.2 },
    ],
  },
  // repeat (RepeatIcon - animateicons.in)
  repeat: {
    name: "repeat",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M4 11.5V10a3 3 0 0 1 3-3h13.5M17.6 4.1 20.5 7l-2.9 2.9", class: "icon-repeat-top", stroke: 2.2 },
      { d: "M20 12.5V14a3 3 0 0 1-3 3H3.5M6.4 19.9 3.5 17l2.9-2.9", class: "icon-repeat-bot", stroke: 2.2 },
    ],
  },
  // music.note (MusicNote01Icon - animateicons.in)
  musicNote: {
    name: "musicNote",
    viewBox: "0 0 24 24",
    parts: [
      { tag: "circle", class: "icon-music-head", attrs: { cx: 8, cy: 18, r: 3 }, stroke: 2 },
      { d: "M11 18V6a2 2 0 0 1 2-2h4v4h-4v10", class: "icon-music-stem", stroke: 2 },
    ],
  },
  // speaker.slash.fill / speaker.wave.1-3.fill (Volume levels)
  volume0: {
    name: "volume0",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M3.5 9.5h3L11 5.8v12.4l-4.5-3.7h-3z", class: "icon-speaker-body", fill: true },
      { d: "M15 9.5l5 5M20 9.5l-5 5", class: "icon-vol-x", stroke: 2 },
    ],
  },
  volume1: {
    name: "volume1",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M3.5 9.5h3L11 5.8v12.4l-4.5-3.7h-3z", class: "icon-speaker-body", fill: true },
      { d: "M14.5 9.6a3.4 3.4 0 0 1 0 4.8", class: "icon-speaker-wave-1", stroke: 2 },
    ],
  },
  volume2: {
    name: "volume2",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M3.5 9.5h3L11 5.8v12.4l-4.5-3.7h-3z", class: "icon-speaker-body", fill: true },
      { d: "M14.5 9.6a3.4 3.4 0 0 1 0 4.8", class: "icon-speaker-wave-1", stroke: 2 },
      { d: "M17 7.2a6.8 6.8 0 0 1 0 9.6", class: "icon-speaker-wave-2", stroke: 2 },
    ],
  },
  volume3: {
    name: "volume3",
    viewBox: "0 0 24 24",
    parts: [
      { d: "M3.5 9.5h3L11 5.8v12.4l-4.5-3.7h-3z", class: "icon-speaker-body", fill: true },
      { d: "M14.5 9.6a3.4 3.4 0 0 1 0 4.8", class: "icon-speaker-wave-1", stroke: 2 },
      { d: "M17 7.2a6.8 6.8 0 0 1 0 9.6", class: "icon-speaker-wave-2", stroke: 2 },
      { d: "M19.4 4.8a10.2 10.2 0 0 1 0 14.4", class: "icon-speaker-wave-3", stroke: 2 },
    ],
  },
};
