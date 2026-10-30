/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CircuitNode, UniverseId, UniverseInfo } from '../types/game';
import { getCircuitVisualConnections, CircuitConnection } from '../game/CircuitMatrix';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Cpu,
  Shield,
  Zap,
  Sparkles,
  Layers,
  Box,
  Activity,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface CircuitTreeGridProps {
  nodes: CircuitNode[];
  activeUniverse: UniverseInfo;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onUnlockNode: (id: string) => boolean;
  canAffordNode: (node: CircuitNode) => boolean;
  isNodeAvailable: (node: CircuitNode) => boolean;
}

export const CircuitTreeGrid: React.FC<CircuitTreeGridProps> = ({
  nodes,
  activeUniverse,
  selectedNodeId,
  onSelectNode,
  onUnlockNode,
  canAffordNode,
  isNodeAvailable,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom States
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Grid Spacing: EXACTLY UNIFORM horizontally and vertically
  const cellStep = 76; // Equal spacing in both X and Y
  const cellWidth = cellStep;
  const cellHeight = cellStep;
  const chipSize = 46; // Identical square chip size for all nodes
  const halfChip = chipSize / 2;

  // Center coordinate of the board canvas
  const boardCenterX = 400;
  const boardCenterY = 390;

  // Connections in the circuit bus (vertical N with N, and horizontal/diagonal N with N+1)
  const connections = useMemo(() => getCircuitVisualConnections(nodes), [nodes]);

  // Center the view on initial mount
  useEffect(() => {
    centerView();
  }, [activeUniverse.id]);

  const centerView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    setZoom(1.0);
    setPan({
      x: clientWidth / 2 - boardCenterX,
      y: clientHeight / 2 - boardCenterY,
    });
  }, [boardCenterX, boardCenterY]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => {
      const nextZoom = Math.min(1.8, Math.max(0.45, prev * zoomFactor));
      return nextZoom;
    });
  };

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Crosshair':
        return <Crosshair className="w-3.5 h-3.5" />;
      case 'Zap':
        return <Zap className="w-3.5 h-3.5" />;
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'Shield':
        return <Shield className="w-3.5 h-3.5" />;
      case 'Layers':
        return <Layers className="w-3.5 h-3.5" />;
      case 'Box':
        return <Box className="w-3.5 h-3.5" />;
      case 'Activity':
        return <Activity className="w-3.5 h-3.5" />;
      default:
        return <Cpu className="w-3.5 h-3.5" />;
    }
  };

  // Thematic colors based on active universe
  const themeAccentColor = activeUniverse.color || '#06b6d4';

  return (
    <div className="relative w-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col select-none">
      {/* 1. Header Toolbar with Zoom & Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeAccentColor }} />
            <span className="font-semibold text-slate-200">{activeUniverse.name}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 pl-2 border-l border-slate-800 hidden sm:inline">
            Escolha qualquer Nível 0 inicial para iniciar sua rota de build
          </span>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Aumentar Zoom (Scroll Up)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.45, z - 0.15))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Diminuir Zoom (Scroll Down)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 py-0.5 text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded min-w-[50px] text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={centerView}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] flex items-center gap-1.5 transition-colors"
            title="Centralizar no Núcleo de Nível 0"
          >
            <Maximize2 className="w-3 h-3 text-cyan-400" />
            <span>Centralizar</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Pan & Zoom Circuit Board Area */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full h-[620px] bg-slate-950 overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Uniform Square Grid Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, #334155 1px, transparent 0),
              linear-gradient(to right, rgba(14, 165, 233, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: `${cellStep / 2}px ${cellStep / 2}px, ${cellStep}px ${cellStep}px, ${cellStep}px ${cellStep}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* Navigatable Circuit Matrix Canvas */}
        <div
          className="absolute origin-top-left transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '800px',
            height: '780px',
          }}
        >
          {/* 3. SVG Layer for Copper Traces and Energy Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="activeTraceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor={themeAccentColor} />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Render Circuit Bus Connections (Vertical N with N, and Horizontal/Diagonal N with N+1) */}
            {connections.map((conn) => {
              const p1x = boardCenterX + conn.fromX * cellWidth;
              const p1y = boardCenterY - conn.fromY * cellHeight;
              const p2x = boardCenterX + conn.toX * cellWidth;
              const p2y = boardCenterY - conn.toY * cellHeight;

              const fromNode = nodes.find((n) => n.id === conn.fromId);
              const toNode = nodes.find((n) => n.id === conn.toId);
              const isActive = fromNode?.unlocked && toNode?.unlocked;
              const isAvailable = (fromNode?.unlocked || toNode?.unlocked) && !isActive;

              return (
                <g key={`${conn.fromId}->${conn.toId}`}>
                  {/* Outer glow for active traces */}
                  {isActive && (
                    <line
                      x1={p1x}
                      y1={p1y}
                      x2={p2x}
                      y2={p2y}
                      stroke={themeAccentColor}
                      strokeWidth="5"
                      opacity="0.35"
                      filter="url(#glow)"
                    />
                  )}
                  {/* Core Trace Line */}
                  <line
                    x1={p1x}
                    y1={p1y}
                    x2={p2x}
                    y2={p2y}
                    stroke={isActive ? 'url(#activeTraceGradient)' : isAvailable ? '#38bdf8' : '#1e293b'}
                    strokeWidth={isActive ? 3.0 : isAvailable ? 1.8 : 1.2}
                    strokeDasharray={isAvailable ? '4 3' : 'none'}
                    opacity={isActive ? 1.0 : isAvailable ? 0.75 : 0.4}
                  />
                  {/* Solder Points */}
                  <circle
                    cx={p1x}
                    cy={p1y}
                    r={isActive ? 2.5 : 1.8}
                    fill={isActive ? themeAccentColor : '#334155'}
                  />
                  <circle
                    cx={p2x}
                    cy={p2y}
                    r={isActive ? 2.5 : 1.8}
                    fill={isActive ? themeAccentColor : '#334155'}
                  />
                </g>
              );
            })}
          </svg>

          {/* 4. Render Square Hardware Circuit Chips (Clean layout with uniform spacing, zero gap boxes) */}
          {nodes.map((node) => {
            const px = boardCenterX + node.gridX * cellWidth;
            const py = boardCenterY - node.gridY * cellHeight;
            const isSelected = node.id === selectedNodeId;
            const available = isNodeAvailable(node);
            const canAfford = canAffordNode(node);
            const isL0 = node.tier === 0;

            return (
              <div
                key={node.id}
                style={{
                  left: `${px - halfChip}px`,
                  top: `${py - halfChip}px`,
                  width: `${chipSize}px`,
                  height: `${chipSize}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id);
                  sound.playClick();
                }}
                className={`absolute rounded-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none font-mono z-10 ${
                  node.unlocked
                    ? 'bg-slate-900 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-500/40'
                    : available
                    ? canAfford
                      ? 'bg-slate-900 border-emerald-400 text-emerald-300 animate-pulse shadow-emerald-500/30'
                      : 'bg-slate-900 border-dashed border-amber-400 text-amber-300 shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50 hover:opacity-80'
                } ${
                  isSelected
                    ? 'ring-2 ring-amber-400 scale-110 z-20 shadow-amber-500/50'
                    : 'hover:scale-105'
                }`}
                title={`${node.name} (Nível ${node.tier}) - ${node.description}`}
              >
                {/* Microchip Corner Pins */}
                <span className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-slate-700 rounded-full" />
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-slate-700 rounded-full" />
                <span className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-slate-700 rounded-full" />
                <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-slate-700 rounded-full" />

                {/* Node Level and Icon */}
                <div className="flex items-center gap-1">
                  <span className={`font-black ${isL0 ? 'text-sm text-cyan-300' : 'text-xs'}`}>
                    {node.tier}
                  </span>
                  {getIconComponent(node.iconName)}
                </div>

                {/* Status indicator diode */}
                <div className="flex items-center gap-1 mt-0.5">
                  {node.unlocked ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                  ) : available ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Status & Navigation Tip */}
      <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Ativo ({nodes.filter((n) => n.unlocked).length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Disponível para Desbloqueio
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-700" /> Bloqueado
          </span>
        </div>

        <div className="text-slate-400">
          Scroll do mouse para <strong>Zoom</strong> · Clique e arraste para <strong>Mover</strong>
        </div>
      </div>
    </div>
  );
};
