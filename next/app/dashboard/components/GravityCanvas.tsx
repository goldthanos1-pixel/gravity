"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

interface GravityCanvasProps {
  onEarnPoints: (amount: number, type: string) => void;
}

export default function GravityCanvas({ onEarnPoints }: GravityCanvasProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  const [coinCount, setCoinCount] = useState(0);
  const [gravityY, setGravityY] = useState(1); // 1 = standard down gravity

  useEffect(() => {
    if (!sceneRef.current || !canvasRef.current) return;

    // 1. Setup Matter Engine
    const engine = Matter.Engine.create({
      gravity: { y: gravityY, x: 0, scale: 0.001 }
    });
    engineRef.current = engine;

    // 2. Setup Matter Renderer
    const width = sceneRef.current.clientWidth || 400;
    const height = 280;

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        background: "transparent",
        wireframes: false,
        showVelocity: false,
      }
    });
    renderRef.current = render;
    Matter.Render.run(render);

    // 3. Setup Runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // 4. Create Boundaries (floor, walls)
    const wallOptions = { isStatic: true, render: { fillStyle: "transparent" } };
    const ground = Matter.Bodies.rectangle(width / 2, height + 30, width * 2, 60, wallOptions);
    const leftWall = Matter.Bodies.rectangle(-30, height / 2, 60, height * 2, wallOptions);
    const rightWall = Matter.Bodies.rectangle(width + 30, height / 2, 60, height * 2, wallOptions);

    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    // Initial Spawn of some ambient coins after a short delay to ensure engineRef is populated
    const timeoutId = setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        spawnCoin(width / 2 + (Math.random() * 100 - 50), 30, false);
      }
    }, 100);

    // Window resize handler
    const handleResize = () => {
      if (!sceneRef.current || !renderRef.current) return;
      const newWidth = sceneRef.current.clientWidth;
      renderRef.current.options.width = newWidth;
      Matter.Body.setPosition(ground, { x: newWidth / 2, y: height + 30 });
      Matter.Body.setPosition(rightWall, { x: newWidth + 30, y: height / 2 });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (renderRef.current) Matter.Render.stop(renderRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, []);

  // Update engine gravity dynamically when gravityY state changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.gravity.y = gravityY;
    }
  }, [gravityY]);

  // Spawns a physical coin or treasure chest in the world
  const spawnCoin = (x: number, y: number, isChest = false) => {
    const engine = engineRef.current;
    if (!engine) return;

    const radius = isChest ? 22 : 14;
    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.6, // elasticity
      friction: 0.1,
      render: {
        fillStyle: isChest ? "#ff007f" : "#00f0ff",
        strokeStyle: "#ffffff",
        lineWidth: 2,
        sprite: undefined
      }
    });

    // Add custom tag metadata to identify body on click
    (body as any).isCoin = true;
    (body as any).isChest = isChest;
    (body as any).value = isChest ? 50 : 5;

    Matter.Composite.add(engine.world, body);
    setCoinCount((prev) => prev + 1);
  };

  // Click handler on canvas to destroy elements or spawn on empty space
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !engineRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if user clicked an existing coin
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    let clickedAny = false;

    for (let body of bodies) {
      if ((body as any).isCoin) {
        const dist = Math.hypot(body.position.x - mouseX, body.position.y - mouseY);
        const radius = (body as any).isChest ? 22 : 14;

        if (dist <= radius) {
          // Destory item on tap
          Matter.Composite.remove(engineRef.current.world, body);
          setCoinCount((prev) => Math.max(0, prev - 1));

          // Trigger particle blast or reward points
          const reward = (body as any).value;
          const type = (body as any).isChest ? "AD_REWARD" : "TAP";
          onEarnPoints(reward, type);
          clickedAny = true;
          break;
        }
      }
    }

    // Spawn new elements on blank space click
    if (!clickedAny) {
      const spawnChest = Math.random() > 0.85; // 15% chance to spawn chest
      spawnCoin(mouseX, mouseY, spawnChest);
    }
  };

  const handleGravityInvert = () => {
    setGravityY((prev) => (prev > 0 ? -1 : 1));
  };

  return (
    <div ref={sceneRef} className="relative w-full rounded-2xl border border-cyan-neon/30 bg-slate-950/80 overflow-hidden">
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-white/5">
          Physics Items: {coinCount}
        </span>
        <button
          onClick={handleGravityInvert}
          className="pointer-events-auto px-3 py-1 bg-cyan-950/80 hover:bg-cyan-neon hover:text-slate-950 border border-cyan-500/30 text-cyan-neon font-black text-[9px] uppercase tracking-widest rounded transition-all"
        >
          Gravity: {gravityY > 0 ? "Normal" : "Inverted 🔄"}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full block cursor-pointer transition-all duration-300"
        style={{ height: "280px" }}
      />
    </div>
  );
}
