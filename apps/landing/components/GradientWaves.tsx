"use client";

import React, { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import "./GradientWaves.css";

interface GradientWavesProps {
  horizonColor?: string;
  waveColor?: string;
  crestColor?: string;
  speed?: number;
  amplitude?: number;
  waveScale?: number;
  waveRatio?: number;
  swell?: number;
  turbulence?: number;
  tilt?: number;
  zoom?: number;
  height?: number;
  fogDepth?: number;
  detail?: "low" | "medium" | "high";
  brightness?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  parallaxStrength?: number;
  grain?: boolean;
  grainIntensity?: number;
  className?: string;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const detailToSteps = (detail: string) => {
  if (detail === "low") return 36.0;
  if (detail === "high") return 80.0;
  return 50.0;
};

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform bool uEnableMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x;
  mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
  float my = r.y - tc.z;
  my += uTurbulence * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
  }
  return dist;
}

void main() {
  float T = iTime * uSpeed;
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot); s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  c = nuv.x; s = nuv.y;
  dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt); s = sin(uTilt);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

  if (uEnableMouse) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float dist = raymarch(cam, dir, freq, tc);
  vec3 pos = cam + dist * dir;

  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`;

interface WaveContext {
  renderer: Renderer;
  program: Program;
  mesh: Mesh;
  tryStart: () => void;
}

type WaveConfig = Required<Omit<GradientWavesProps, "className">>;

const ctxMap = new WeakMap<HTMLDivElement, WaveContext>();

const createWaveUniforms = (cfg: WaveConfig) => ({
  iTime: { value: cfg.speed === 0 ? 16.0 : 0 },
  iResolution: { value: new Float32Array([1, 1]) },
  uSpeed: { value: cfg.speed },
  uAmplitude: { value: cfg.amplitude },
  uWaveScale: { value: cfg.waveScale },
  uWaveRatio: { value: cfg.waveRatio },
  uSwell: { value: cfg.swell },
  uTurbulence: { value: cfg.turbulence },
  uTilt: { value: cfg.tilt },
  uZoom: { value: cfg.zoom },
  uHeight: { value: cfg.height },
  uFogDepth: { value: cfg.fogDepth },
  uSteps: { value: detailToSteps(cfg.detail) },
  uBrightness: { value: cfg.brightness },
  uOpacity: { value: cfg.opacity },
  uGrain: { value: cfg.grain ? 1.0 : 0.0 },
  uGrainIntensity: { value: cfg.grainIntensity },
  uMouse: { value: new Float32Array([0.5, 0.5]) },
  uParallax: { value: cfg.parallaxStrength },
  uEnableMouse: { value: cfg.mouseInteraction },
  uHorizonColor: { value: new Float32Array(hexToRgb(cfg.horizonColor)) },
  uWaveColor: { value: new Float32Array(hexToRgb(cfg.waveColor)) },
  uCrestColor: { value: new Float32Array(hexToRgb(cfg.crestColor)) }
});

const applyUniformValues = (u: Record<string, { value: unknown }>, cfg: WaveConfig) => {
  u.uSpeed.value = cfg.speed;
  u.uAmplitude.value = cfg.amplitude;
  u.uWaveScale.value = cfg.waveScale;
  u.uWaveRatio.value = cfg.waveRatio;
  u.uSwell.value = cfg.swell;
  u.uTurbulence.value = cfg.turbulence;
  u.uTilt.value = cfg.tilt;
  u.uZoom.value = cfg.zoom;
  u.uHeight.value = cfg.height;
  u.uFogDepth.value = cfg.fogDepth;
  u.uSteps.value = detailToSteps(cfg.detail);
  u.uBrightness.value = cfg.brightness;
  u.uOpacity.value = cfg.opacity;
  u.uGrain.value = Number(cfg.grain);
  u.uGrainIntensity.value = cfg.grainIntensity;
  u.uParallax.value = cfg.parallaxStrength;
  u.uEnableMouse.value = cfg.mouseInteraction;
  (u.uHorizonColor.value as Float32Array).set(hexToRgb(cfg.horizonColor));
  (u.uWaveColor.value as Float32Array).set(hexToRgb(cfg.waveColor));
  (u.uCrestColor.value as Float32Array).set(hexToRgb(cfg.crestColor));
};

const renderStaticWaveFrame = (ctx: WaveContext) => {
  ctx.program.uniforms.iTime.value = 16.0;
  if (!ctx.renderer.gl.isContextLost()) {
    ctx.renderer.render({ scene: ctx.mesh });
  }
};

const syncWaveUniforms = (ctx: WaveContext, cfg: WaveConfig) => {
  applyUniformValues(ctx.program.uniforms, cfg);
  if (cfg.speed === 0 && !cfg.mouseInteraction) {
    renderStaticWaveFrame(ctx);
  } else {
    ctx.tryStart();
  }
};

const stepMouse = (
  current: [number, number],
  target: [number, number],
  active: boolean,
  out: Float32Array
) => {
  const tx = active ? target[0] : 0.5;
  const ty = active ? target[1] : 0.5;
  current[0] += 0.05 * (tx - current[0]);
  current[1] += 0.05 * (ty - current[1]);
  out[0] = current[0];
  out[1] = current[1];
};

const isGlReady = (renderer: Renderer, lost: boolean) =>
  !lost && !renderer.gl.isContextLost();

const isLoopIdleAndVisible = (visible: boolean, pageVisible: boolean, raf: number) =>
  visible && pageVisible && raf === 0;

const hasActiveMotion = (speed: number, mouseEnabled: boolean) =>
  speed !== 0 || mouseEnabled;

const createWaveRenderer = (container: HTMLDivElement) => {
  const renderer = new Renderer({
    webgl: 2,
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    dpr: Math.min(window.devicePixelRatio || 1, 1.25)
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas as HTMLCanvasElement;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.transform = "translateZ(0)";
  canvas.style.contain = "strict";
  container.appendChild(canvas);
  return { renderer, gl, canvas };
};

const bindPointerTracking = (canvas: HTMLCanvasElement, targetMouse: [number, number]) => {
  const onPointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    targetMouse[0] = (e.clientX - rect.left) / rect.width;
    targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
  };
  const onPointerLeave = () => {
    targetMouse[0] = 0.5;
    targetMouse[1] = 0.5;
  };
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  return () => {
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);
  };
};

const resizeWaveScene = (
  container: HTMLDivElement,
  renderer: Renderer,
  mesh: Mesh,
  isContextLost: boolean
) => {
  if (!isGlReady(renderer, isContextLost)) return;
  const rect = container.getBoundingClientRect();
  renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
  const res = mesh.program.uniforms.iResolution.value as Float32Array;
  res[0] = renderer.gl.drawingBufferWidth;
  res[1] = renderer.gl.drawingBufferHeight;
  renderer.render({ scene: mesh });
};

const bindVisibilityObservers = (
  container: HTMLDivElement,
  onIntersection: (visible: boolean) => void,
  onVisibility: () => void
) => {
  const io = new IntersectionObserver(([entry]) => onIntersection(entry.isIntersecting), {
    threshold: 0
  });
  io.observe(container);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    io.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
  };
};

const stepWaveFrame = (
  renderer: Renderer,
  mesh: Mesh,
  elapsedSec: number,
  mouse: { current: [number, number]; target: [number, number]; enabled: boolean }
) => {
  if (!hasActiveMotion(mesh.program.uniforms.uSpeed.value as number, mouse.enabled)) {
    mesh.program.uniforms.iTime.value = 16.0;
    renderer.render({ scene: mesh });
    return false;
  }
  mesh.program.uniforms.iTime.value = elapsedSec;
  stepMouse(mouse.current, mouse.target, mouse.enabled, mesh.program.uniforms.uMouse.value as Float32Array);
  renderer.render({ scene: mesh });
  return true;
};

const bindContextLifecycle = (
  canvas: HTMLCanvasElement,
  onLost: () => void,
  onRestored: () => void
) => {
  const handleLost = (e: Event) => {
    e.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", handleLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  return () => {
    canvas.removeEventListener("webglcontextlost", handleLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
  };
};

const mountWaveRenderer = (
  container: HTMLDivElement,
  initialUniforms: ReturnType<typeof createWaveUniforms>,
  enableMouseRef: React.MutableRefObject<boolean>
) => {
  const { renderer, gl, canvas } = createWaveRenderer(container);
  let mesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, { vertex, fragment, uniforms: initialUniforms })
  });
  let isContextLost = false, raf = 0, isVisible = true, isPageVisible = !document.hidden;
  const setSize = () => resizeWaveScene(container, renderer, mesh, isContextLost);
  const ro = new ResizeObserver(setSize);
  ro.observe(container);
  setSize();

  const currentMouse: [number, number] = [0.5, 0.5], targetMouse: [number, number] = [0.5, 0.5];
  const unbindPointer = bindPointerTracking(canvas, targetMouse);
  const t0 = performance.now();

  const loop = (t: number) => {
    if (!isGlReady(renderer, isContextLost)) { raf = 0; return; }
    const keepRunning = stepWaveFrame(renderer, mesh, (t - t0) * 0.001, {
      current: currentMouse,
      target: targetMouse,
      enabled: enableMouseRef.current
    });
    raf = keepRunning ? requestAnimationFrame(loop) : 0;
  };
  const tryStart = () => {
    const canRun = isGlReady(renderer, isContextLost) && isLoopIdleAndVisible(isVisible, isPageVisible, raf);
    if (canRun && hasActiveMotion(mesh.program.uniforms.uSpeed.value as number, enableMouseRef.current)) {
      raf = requestAnimationFrame(loop);
    }
  };
  const tryStop = () => { if (raf !== 0) { cancelAnimationFrame(raf); raf = 0; } };
  const syncLoopState = () => { if (isVisible && isPageVisible) tryStart(); else tryStop(); };
  ctxMap.set(container, { renderer, program: mesh.program, mesh, tryStart });

  const unbindContext = bindContextLifecycle(canvas, () => { isContextLost = true; tryStop(); }, () => {
    isContextLost = false; gl.clearColor(0, 0, 0, 0);
    const program = new Program(gl, { vertex, fragment, uniforms: mesh.program.uniforms });
    mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    ctxMap.set(container, { renderer, program, mesh, tryStart });
    setSize(); tryStart();
  });
  const unbindVisibility = bindVisibilityObservers(
    container, (v) => { isVisible = v; syncLoopState(); }, () => { isPageVisible = !document.hidden; syncLoopState(); }
  );
  tryStart();

  return () => {
    tryStop(); ro.disconnect(); unbindVisibility(); unbindPointer(); unbindContext();
    ctxMap.delete(container);
    try { container.removeChild(canvas); } catch (err) { void err; }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
};

const DEFAULT_WAVE_CONFIG: WaveConfig = {
  horizonColor: "#2E28D4",
  waveColor: "#EC4899",
  crestColor: "#FB7185",
  speed: 0.12,
  amplitude: 1.8,
  waveScale: 0.55,
  waveRatio: 0.85,
  swell: 22,
  turbulence: 12,
  tilt: 1.11,
  zoom: 1.0,
  height: 5.8,
  fogDepth: 16,
  detail: "medium",
  brightness: 0.95,
  opacity: 0.9,
  mouseInteraction: true,
  parallaxStrength: 0.25,
  grain: true,
  grainIntensity: 0.025
};

const GradientWaves: React.FC<GradientWavesProps> = (props) => {
  const config: WaveConfig = { ...DEFAULT_WAVE_CONFIG, ...props };
  const className = props.className ?? "";
  const containerRef = useRef<HTMLDivElement>(null);
  const enableMouseRef = useRef(config.mouseInteraction);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    return mountWaveRenderer(container, createWaveUniforms(config), enableMouseRef);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const ctx = ctxMap.get(container);
    if (!ctx) return;
    enableMouseRef.current = config.mouseInteraction;
    syncWaveUniforms(ctx, config);
  }, [
    config.horizonColor,
    config.waveColor,
    config.crestColor,
    config.speed,
    config.amplitude,
    config.waveScale,
    config.waveRatio,
    config.swell,
    config.turbulence,
    config.tilt,
    config.zoom,
    config.height,
    config.fogDepth,
    config.detail,
    config.brightness,
    config.opacity,
    config.mouseInteraction,
    config.parallaxStrength,
    config.grain,
    config.grainIntensity
  ]);

  return <div ref={containerRef} className={`gradient-waves-container ${className}`.trim()} />;
};

export default GradientWaves;
