import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Maximize2, Minimize2, RotateCcw } from "lucide-react";

interface Visualizer3DProps {
  score: number; // 0 - 100
  habitsCompleted: number;
  totalHabits: number;
  isDarkMode: boolean;
}

export const Visualizer3D: React.FC<Visualizer3DProps> = ({
  score,
  habitsCompleted,
  totalHabits,
  isDarkMode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [cameraDistance, setCameraDistance] = useState(4.5);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth;
    const height = container.clientHeight || 280;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = cameraDistance;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Shining Golden Momentum Core Color Palette
    // 24k Gold, warm luminous amber, champagne gold, and radiant white-gold sparkles
    let coreColor = 0xffd700; // radiant 24k gold
    let ringColor = 0xf59e0b; // warm glowing amber gold
    if (score >= 80) {
      coreColor = 0xffe082; // Bright sunlit gold
      ringColor = 0xffd700; // Brilliant gold
    } else if (score >= 60) {
      coreColor = 0xfbbf24; // Amber gold
      ringColor = 0xd97706; // Deep gold
    } else {
      coreColor = 0xf59e0b; // Warm amber gold
      ringColor = 0xb45309; // Bronze gold
    }

    // Add Scene Lighting for specular golden reflections
    const goldPointLight = new THREE.PointLight(0xffd700, 3, 20);
    goldPointLight.position.set(2, 3, 4);
    scene.add(goldPointLight);

    const amberPointLight = new THREE.PointLight(0xf59e0b, 2.5, 20);
    amberPointLight.position.set(-2, -3, 2);
    scene.add(amberPointLight);

    const ambientLight = new THREE.AmbientLight(0xfffae6, 0.6);
    scene.add(ambientLight);

    // 1. Particle Cloud Sphere (Momentum Orb) in Shining Gold
    const particleCount = 1400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const goldBase = new THREE.Color(coreColor);
    const goldAccent = new THREE.Color(ringColor);
    const goldSparkle = new THREE.Color(0xfff8db); // pure diamond champagne sparkle

    for (let i = 0; i < particleCount; i++) {
      // Fibonacci sphere distribution
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = 1.3 + Math.sin(i * 0.2) * 0.12;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color variation - shimmering gold, warm amber, and glistening highlights
      const mixRatio = Math.random();
      let mixed: THREE.Color;
      if (mixRatio > 0.85) {
        mixed = goldSparkle.clone();
      } else {
        mixed = goldBase.clone().lerp(goldAccent, mixRatio / 0.85);
      }

      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.052,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    const particleSphere = new THREE.Points(geometry, particleMaterial);
    scene.add(particleSphere);

    // 2. Inner Glowing Core Geometry (Icosahedron wireframe in shining 24k gold)
    const coreGeo = new THREE.IcosahedronGeometry(0.78, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const innerCore = new THREE.Mesh(coreGeo, coreMat);
    scene.add(innerCore);

    // Inner core center glow sphere
    const innerGlowGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffe57f,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    scene.add(innerGlow);

    // 3. Orbital Habit Rings in shining polished gold
    const ringsGroup = new THREE.Group();
    const ringCount = Math.max(1, Math.min(totalHabits, 5));

    for (let r = 0; r < ringCount; r++) {
      const ringRadius = 1.6 + r * 0.25;
      const ringGeo = new THREE.TorusGeometry(ringRadius, 0.016, 16, 100);
      const isCompleted = r < habitsCompleted;

      const ringMat = new THREE.MeshBasicMaterial({
        color: isCompleted ? 0xffd700 : 0x78350f,
        transparent: true,
        opacity: isCompleted ? 0.95 : 0.3,
        blending: isCompleted ? THREE.AdditiveBlending : THREE.NormalBlending,
      });

      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / (2 + r * 0.4);
      ringMesh.rotation.y = (r * Math.PI) / 4;
      ringsGroup.add(ringMesh);
    }
    scene.add(ringsGroup);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        mouseX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = ((touch.clientY - rect.top) / rect.height - 0.5) * 2;
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Rotation speed modulates with score
      const speedFactor = 0.5 + (score / 100) * 0.8;

      particleSphere.rotation.y = elapsedTime * 0.15 * speedFactor + targetX * 0.5;
      particleSphere.rotation.x = targetY * 0.3;

      innerCore.rotation.y = -elapsedTime * 0.2 * speedFactor;
      innerCore.rotation.z = elapsedTime * 0.1;

      ringsGroup.rotation.y = elapsedTime * 0.1 * speedFactor + targetX * 0.2;
      ringsGroup.rotation.x = elapsedTime * 0.05;

      // Pulse particle positions subtly
      const posArray = geometry.attributes.position.array as Float32Array;
      const pulseSpeed = 1.5 + (score / 100) * 2.0;
      for (let i = 0; i < particleCount; i++) {
        const origX = positions[i * 3];
        const origY = positions[i * 3 + 1];
        const origZ = positions[i * 3 + 2];
        const wave = Math.sin(elapsedTime * pulseSpeed + i) * 0.02;

        posArray[i * 3] = origX * (1 + wave);
        posArray[i * 3 + 1] = origY * (1 + wave);
        posArray[i * 3 + 2] = origZ * (1 + wave);
      }
      geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 280;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("touchmove", handleTouchMove);

      geometry.dispose();
      particleMaterial.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [score, habitsCompleted, totalHabits, isDarkMode, cameraDistance]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isDarkMode
          ? "bg-radial from-zinc-900/95 via-black to-zinc-950 border-amber-500/30 text-white shadow-[0_0_45px_rgba(245,158,11,0.15)] before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-linear-to-r before:from-transparent before:via-amber-400/90 before:to-transparent"
          : "bg-white/90 border-slate-200 text-slate-800 shadow-lg shadow-slate-200/50"
      } backdrop-blur-md ${isExpanded ? "h-96" : "h-72"}`}
    >
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Overlay Badges - Shining Golden Aura */}
      <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase border ${
            isDarkMode
              ? "bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] backdrop-blur-md"
              : "bg-amber-100 text-amber-900 border-amber-300"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          <span className="drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">Productivity Momentum Core</span>
        </div>
      </div>

      {/* Metric Overlay Bottom Left - Shining Gold Radiance */}
      <div className="absolute bottom-3 left-4 pointer-events-none">
        <div className="text-3xl font-black tracking-tight font-mono flex items-baseline gap-1">
          <span className="text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.85)]">{score}</span>
          <span className="text-xs font-semibold text-amber-200/70">/100</span>
        </div>
        <p className="text-[11px] text-amber-100/80 font-medium">
          {habitsCompleted} of {totalHabits} habits active today
        </p>
      </div>

      {/* Control buttons top right */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <button
          onClick={() => setCameraDistance((d) => (d === 4.5 ? 3.5 : 4.5))}
          title="Reset / Toggle Zoom"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isDarkMode
              ? "bg-zinc-950/80 border-amber-500/25 text-amber-300 hover:bg-amber-400 hover:text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.6)] hover:border-amber-300"
              : "bg-slate-100/80 border-slate-300 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          title={isExpanded ? "Collapse View" : "Expand 3D View"}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isDarkMode
              ? "bg-zinc-950/80 border-amber-500/25 text-amber-300 hover:bg-amber-400 hover:text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.6)] hover:border-amber-300"
              : "bg-slate-100/80 border-slate-300 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {isExpanded ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
