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

    // Black & White Core with Gemini Quad Color Flow (Blue, Red, Yellow, Green)
    // 85% pure brilliant white/chrome particles + 15% Gemini star accents
    const geminiColors = {
      blue: 0x4285f4,   // Google Blue
      red: 0xea4335,    // Google Red
      yellow: 0xfbbc05, // Google Yellow
      green: 0x34a853,  // Google Green
      white: 0xffffff,  // Pure Brilliant White
      chrome: 0xd4d4d8, // Platinum Chrome
    };

    // Scene Lighting: Clean white key light + subtle Gemini blue & red rim lights
    const whitePointLight = new THREE.PointLight(0xffffff, 3.5, 25);
    whitePointLight.position.set(0, 4, 4);
    scene.add(whitePointLight);

    const blueRimLight = new THREE.PointLight(geminiColors.blue, 1.8, 20);
    blueRimLight.position.set(-4, -2, 2);
    scene.add(blueRimLight);

    const redRimLight = new THREE.PointLight(geminiColors.red, 1.6, 20);
    redRimLight.position.set(4, -2, -2);
    scene.add(redRimLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 1. Particle Cloud Sphere: Crisp monochrome white with Gemini color sparkles
    const particleCount = 1400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const whiteColor = new THREE.Color(0xffffff);
    const chromeColor = new THREE.Color(0xd4d4d8);
    const gBlue = new THREE.Color(geminiColors.blue);
    const gRed = new THREE.Color(geminiColors.red);
    const gYellow = new THREE.Color(geminiColors.yellow);
    const gGreen = new THREE.Color(geminiColors.green);

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

      // Color variation: 80% Black/White/Chrome, with 20% delicate Gemini Blue, Red, Yellow, Green
      const rnd = Math.random();
      let mixed: THREE.Color;

      if (rnd < 0.06) {
        mixed = gBlue;
      } else if (rnd < 0.12) {
        mixed = gRed;
      } else if (rnd < 0.18) {
        mixed = gYellow;
      } else if (rnd < 0.24) {
        mixed = gGreen;
      } else if (rnd < 0.85) {
        mixed = whiteColor;
      } else {
        mixed = chromeColor;
      }

      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    const particleSphere = new THREE.Points(geometry, particleMaterial);
    scene.add(particleSphere);

    // 2. Inner Glowing Core Geometry (Icosahedron wireframe in shining white)
    const coreGeo = new THREE.IcosahedronGeometry(0.78, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const innerCore = new THREE.Mesh(coreGeo, coreMat);
    scene.add(innerCore);

    // Inner core center glow sphere - brilliant white
    const innerGlowGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    scene.add(innerGlow);

    // 3. Orbital Habit Rings in Gemini 4-Color Flow (Blue, Red, Yellow, Green, White)
    const ringsGroup = new THREE.Group();
    const ringCount = Math.max(1, Math.min(totalHabits, 5));
    const ringColors = [
      geminiColors.blue,   // Habit 1: Blue
      geminiColors.red,    // Habit 2: Red
      geminiColors.yellow, // Habit 3: Yellow
      geminiColors.green,  // Habit 4: Green
      geminiColors.white,  // Habit 5: Diamond White
    ];

    for (let r = 0; r < ringCount; r++) {
      const ringRadius = 1.6 + r * 0.25;
      const ringGeo = new THREE.TorusGeometry(ringRadius, 0.015, 16, 100);
      const isCompleted = r < habitsCompleted;

      const ringMat = new THREE.MeshBasicMaterial({
        color: isCompleted ? ringColors[r % ringColors.length] : 0x3f3f46,
        transparent: true,
        opacity: isCompleted ? 0.95 : 0.25,
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
          ? "bg-radial from-zinc-900/95 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(0,0,0,0.8)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-linear-to-r before:from-[#4285F4] before:via-[#EA4335] before:via-[#FBBC05] before:to-[#34A853]"
          : "bg-white/90 border-slate-200 text-slate-800 shadow-lg shadow-slate-200/50"
      } backdrop-blur-md ${isExpanded ? "h-96" : "h-72"}`}
    >
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Overlay Badges - Black & White with Gemini 4-Color Flow */}
      <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${
            isDarkMode
              ? "bg-black/80 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md"
              : "bg-slate-100 text-slate-900 border-slate-300"
          }`}
        >
          {/* Gemini 4-color mini flow dots */}
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] shadow-[0_0_6px_rgba(66,133,244,0.9)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335] shadow-[0_0_6px_rgba(234,67,53,0.9)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05] shadow-[0_0_6px_rgba(251,188,5,0.9)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] shadow-[0_0_6px_rgba(52,168,83,0.9)]" />
          </div>
          <span>Momentum Core</span>
        </div>
      </div>

      {/* Metric Overlay Bottom Left - Crisp White with Gemini Accents */}
      <div className="absolute bottom-3 left-4 pointer-events-none">
        <div className="text-3xl font-black tracking-tight font-mono flex items-baseline gap-1">
          <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">{score}</span>
          <span className="text-xs font-semibold text-zinc-400">/100</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
          <p className="text-[11px] text-zinc-300 font-medium">
            {habitsCompleted} of {totalHabits} habits active today
          </p>
        </div>
      </div>

      {/* Control buttons top right */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <button
          onClick={() => setCameraDistance((d) => (d === 4.5 ? 3.5 : 4.5))}
          title="Reset / Toggle Zoom"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isDarkMode
              ? "bg-black/70 border-white/15 text-zinc-300 hover:text-white hover:border-white/40 hover:bg-white/10"
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
              ? "bg-black/70 border-white/15 text-zinc-300 hover:text-white hover:border-white/40 hover:bg-white/10"
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
