
"use client";

import React, { useEffect, useRef } from 'react';

export function GeometricBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width: number, height: number, stars: Star[];
    const numStars = 800;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const resizeCanvas = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    class Star {
        x: number;
        y: number;
        z: number;
        x2d: number = 0;
        y2d: number = 0;
        radius: number = 0;

        constructor() {
            this.x = (Math.random() - 0.5) * width;
            this.y = (Math.random() - 0.5) * height;
            this.z = Math.random() * width;
        }

        project() {
            const scale = width / (width + this.z);
            this.x2d = this.x * scale + width / 2;
            this.y2d = this.y * scale + height / 2;
            this.radius = Math.max(0, scale * 1.5);
        }

        update() {
            this.z -= 1.5;
            if (this.z < 1) {
                this.z = width;
                this.x = (Math.random() - 0.5) * width;
                this.y = (Math.random() - 0.5) * height;
            }
        }

        draw() {
            if (!ctx) return;
            ctx.beginPath();
            ctx.arc(this.x2d, this.y2d, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.z / width})`;
            ctx.fill();
        }
    }

    function init() {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
      }
    }

    let animationFrameId: number;
    function drawFrame() {
      if (!ctx) return;
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, width, height);

      for (const star of stars) {
        if (!prefersReducedMotion) {
          star.update();
        }
        star.project();
        star.draw();
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(drawFrame);
      }
    }

    const onResize = () => {
        resizeCanvas();
        init();
        drawFrame();
    };

    window.addEventListener('resize', onResize);

    resizeCanvas();
    init();
    drawFrame();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full" />;
}

    