"use client";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/src/lib/utils";

interface CanvasTextProps {
  text: string;
  className?: string;
  backgroundClassName?: string;
  colors?: string[];
  animationDuration?: number;
  lineGap?: number;
}

export const CanvasText = ({
  text,
  className,
  backgroundClassName,
  colors = ["#3b82f6", "#60a5fa", "#93c5fd"],
  animationDuration = 20,
  lineGap = 4,
}: CanvasTextProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    window.addEventListener("resize", resize);
    resize();

    const render = () => {
      // Use animationDuration to control speed (higher duration = slower)
      const speed = 1 / (animationDuration * 5);
      time += speed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { width, height } = canvas.getBoundingClientRect();
      const rows = Math.ceil(height / lineGap);
      const cols = Math.ceil(width / lineGap);

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const x = j * lineGap;
          const y = i * lineGap;

          const dist = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
          const offset = dist / 100;
          
          const opacity = isHovered 
            ? Math.sin(time * 2 + offset) * 0.5 + 0.5
            : Math.sin(time + offset) * 0.2 + 0.2;

          const colorIndex = Math.floor((Math.sin(time + offset) * 0.5 + 0.5) * colors.length);
          ctx.fillStyle = colors[colorIndex % colors.length];
          ctx.globalAlpha = opacity;
          
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [colors, lineGap, isHovered]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block px-1", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 -z-10 h-full w-full rounded-md",
          backgroundClassName
        )}
      />
      <span className="relative z-10">{text}</span>
    </div>
  );
};
