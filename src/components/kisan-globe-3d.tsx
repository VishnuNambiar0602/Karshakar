'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface GlobePlot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  cropType: string;
  severity?: 'low' | 'medium' | 'high' | 'none';
}

interface KisanGlobe3DProps {
  plots?: GlobePlot[];
  selectedPlotId?: string | null;
  onSelectPlot?: (plot: GlobePlot) => void;
}

export function KisanGlobe3D({ plots = [], selectedPlotId, onSelectPlot }: KisanGlobe3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverText, setHoverText] = useState('Kisan Sat-1: Online');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let rotationX = 0;
    let rotationY = 0;
    let isHovered = false;

    const radius = Math.min(width, height) * 0.32;
    const dots: { x: number; y: number; z: number }[] = [];
    const numDots = 280;

    // Generate sphere points
    for (let i = 0; i < numDots; i++) {
      const theta = Math.acos(-1 + (2 * i) / numDots);
      const phi = Math.sqrt(numDots * Math.PI) * theta;
      dots.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
      });
    }

    // Satellites orbiting the globe
    const satellites = [
      { angle: 0, speed: 0.015, dist: radius * 1.35, color: '#3b82f6', name: 'Landsat-9' },
      { angle: Math.PI / 2, speed: 0.01, dist: radius * 1.5, color: '#10b981', name: 'Sentinel-2' },
      { angle: Math.PI, speed: 0.007, dist: radius * 1.25, color: '#eab308', name: 'KisanSat-1' },
    ];

    const resize = () => {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;
      mouseX = x;
      mouseY = y;
      
      // Rotate globe based on mouse position relative to center
      targetRotationY = (x / (width / 2)) * Math.PI * 0.5;
      targetRotationX = -(y / (height / 2)) * Math.PI * 0.5;
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
    };

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      // Check if clicked on a plot
      for (const plot of plots) {
        const latRad = (plot.latitude * Math.PI) / 180;
        const lngRad = (plot.longitude * Math.PI) / 180;
        const theta = Math.PI / 2 - latRad;
        const phi = lngRad;

        const plotX = radius * Math.sin(theta) * Math.cos(phi);
        const plotY = radius * Math.sin(theta) * Math.sin(phi);
        const plotZ = radius * Math.cos(theta);

        // Rotate Y
        const rx = plotX * cosY - plotZ * sinY;
        const rz = plotX * sinY + plotZ * cosY;
        
        // Rotate X
        const ry = plotY * cosX - rz * sinX;
        const rzFinal = plotY * sinX + rz * cosX;

        const fov = 400;
        const scale = fov / (fov + rzFinal);
        const px = rx * scale + width / 2;
        const py = ry * scale + height / 2;

        const isFront = rzFinal < 0;

        if (isFront) {
          const dx = clickX - px;
          const dy = clickY - py;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 15 && onSelectPlot) {
            onSelectPlot(plot);
            break;
          }
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleCanvasClick);

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth rotation interpolation
      if (isHovered) {
        rotationX += (targetRotationX - rotationX) * 0.08;
        rotationY += (targetRotationY - rotationY) * 0.08;
      } else {
        // Continuous gentle spinning when idle
        rotationY += 0.003;
        rotationX += 0.0005;
      }

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      // Draw atmospheric glow
      const glowGrad = ctx.createRadialGradient(
        width / 2, height / 2, radius * 0.8,
        width / 2, height / 2, radius * 1.2
      );
      glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.03)');
      glowGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.05)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, radius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // 3D projections for sphere dots
      const projectedDots = dots.map(dot => {
        // Rotate Y
        const x1 = dot.x * cosY - dot.z * sinY;
        const z1 = dot.x * sinY + dot.z * cosY;
        
        // Rotate X
        const y2 = dot.y * cosX - z1 * sinX;
        const z2 = dot.y * sinX + z1 * cosX;

        // Perspective scale factor
        const fov = 400;
        const scale = fov / (fov + z2);
        const px = x1 * scale + width / 2;
        const py = y2 * scale + height / 2;

        return { px, py, z2, scale };
      });

      // Draw connection lines for grid effect
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.06)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedDots.length; i += 12) {
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          const idx = (i + j) % projectedDots.length;
          if (projectedDots[idx].z2 < 0) { // Only draw visible side connections
            if (j === 0) ctx.moveTo(projectedDots[idx].px, projectedDots[idx].py);
            else ctx.lineTo(projectedDots[idx].px, projectedDots[idx].py);
          }
        }
        ctx.stroke();
      }

      // Draw dots
      projectedDots.forEach(dot => {
        // Skip dots on back face of the sphere for 3D realism
        if (dot.z2 > 10) return;

        const size = Math.max(1, dot.scale * 1.5);
        const opacity = Math.min(1, Math.max(0.1, 1 - dot.z2 / radius));
        ctx.fillStyle = `rgba(16, 185, 129, ${opacity * 0.7})`;
        
        ctx.beginPath();
        ctx.arc(dot.px, dot.py, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Plot Markers
      plots.forEach(plot => {
        const latRad = (plot.latitude * Math.PI) / 180;
        const lngRad = (plot.longitude * Math.PI) / 180;
        const theta = Math.PI / 2 - latRad;
        const phi = lngRad;

        const plotX = radius * Math.sin(theta) * Math.cos(phi);
        const plotY = radius * Math.sin(theta) * Math.sin(phi);
        const plotZ = radius * Math.cos(theta);

        // Rotate Y
        const rx = plotX * cosY - plotZ * sinY;
        const rz = plotX * sinY + plotZ * cosY;
        
        // Rotate X
        const ry = plotY * cosX - rz * sinX;
        const rzFinal = plotY * sinX + rz * cosX;

        const fov = 400;
        const scale = fov / (fov + rzFinal);
        const px = rx * scale + width / 2;
        const py = ry * scale + height / 2;

        const isFront = rzFinal < 0;

        if (isFront) {
          let markerColor = '#10b981'; // Green
          if (plot.severity === 'high') markerColor = '#ef4444'; // Red
          else if (plot.severity === 'medium') markerColor = '#f59e0b'; // Amber
          else if (plot.severity === 'low') markerColor = '#3b82f6'; // Blue

          const isSelected = plot.id === selectedPlotId;
          const markerSize = isSelected ? 7 : 4.5;

          // Draw outer ring first
          ctx.beginPath();
          ctx.arc(px, py, markerSize + (isSelected ? 5 : 2.5) + Math.sin(Date.now() * 0.007) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = markerColor;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          // Draw main point
          ctx.beginPath();
          ctx.arc(px, py, markerSize, 0, Math.PI * 2);
          ctx.fillStyle = markerColor;
          ctx.fill();

          // Label
          ctx.font = isSelected ? 'bold 11px monospace' : '10px monospace';
          ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(240, 240, 240, 0.8)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 3;
          ctx.fillText(plot.name, px + markerSize + 5, py + 3);
          ctx.shadowBlur = 0; // Reset

          // Mouse hover check
          const dx = mouseX - (px - width / 2);
          const dy = mouseY - (py - height / 2);
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          if (distToMouse < 15) {
            const plotInfo = `Plot: ${plot.name} [${plot.cropType}] - Lat: ${plot.latitude.toFixed(4)}°, Lng: ${plot.longitude.toFixed(4)}°`;
            if (hoverText !== plotInfo) {
              setHoverText(plotInfo);
            }
          }
        }
      });

      // Orbit and Draw Satellites
      satellites.forEach(sat => {
        sat.angle += sat.speed;
        
        // Orbit projection
        const satX = sat.dist * Math.cos(sat.angle);
        const satZ = sat.dist * Math.sin(sat.angle);
        const satY = Math.sin(sat.angle * 0.5) * radius * 0.4; // Tilted orbit

        // Rotate Y
        const rx = satX * cosY - satZ * sinY;
        const rz = satX * sinY + satZ * cosY;
        
        // Rotate X
        const ry = satY * cosX - rz * sinX;
        const rzFinal = satY * sinX + rz * cosX;

        const fov = 400;
        const scale = fov / (fov + rzFinal);
        const px = rx * scale + width / 2;
        const py = ry * scale + height / 2;

        const isFront = rzFinal < 0;
        
        // Draw orbit pathway line
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, sat.dist, sat.dist * 0.25, rotationX, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.03)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw glowing Satellite point
        const pulse = 2 + Math.sin(Date.now() * 0.005) * 1;
        ctx.shadowBlur = pulse * 2;
        ctx.shadowColor = sat.color;
        ctx.fillStyle = sat.color;
        ctx.globalAlpha = isFront ? 1.0 : 0.25;

        ctx.beginPath();
        ctx.arc(px, py, isFront ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
        ctx.globalAlpha = 1.0;

        // Label on hover/proximity
        const dx = mouseX - (px - width / 2);
        const dy = mouseY - (py - height / 2);
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        
        if (distToMouse < 25 && isFront) {
          ctx.font = '10px monospace';
          ctx.fillStyle = sat.color;
          ctx.fillText(`${sat.name} (Active)`, px + 8, py - 4);
          
          // Connect satellite to ground via light ray
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(width / 2, height / 2);
          ctx.strokeStyle = `rgba(59, 130, 246, 0.15)`;
          ctx.stroke();
          
          // Dynamic coordinates
          const simulatedLat = (Math.sin(sat.angle) * 90).toFixed(2);
          const simulatedLng = (Math.cos(sat.angle * 1.5) * 180).toFixed(2);
          const text = `${sat.name}: Lat ${simulatedLat}°, Lng ${simulatedLng}°`;
          if (hoverText !== text) setHoverText(text);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [plots, selectedPlotId, hoverText, onSelectPlot]);

  return (
    <div className="relative w-full h-[320px] md:h-[400px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950/20 to-blue-950/25 border border-primary/10 rounded-2xl backdrop-blur-md shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-primary bg-black/40 px-3 py-1.5 rounded-lg border border-primary/20 backdrop-blur-sm z-10">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          3D SATELLITE PLOT TRACKER
        </span>
        <span className="truncate max-w-[200px] md:max-w-none text-blue-400">{hoverText}</span>
      </div>
    </div>
  );
}
