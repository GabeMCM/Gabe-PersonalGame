/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { RoguelikeUpgrade } from '../types/game';
import { Sparkles, Zap, Shield, Target, Clock, CheckCircle2, Layers } from 'lucide-react';

export const RoguelikeChoiceModal: React.FC = () => {
  const {
    expeditionPhase,
    offeredRoguelikeChoices,
    chooseRoguelikeUpgrade,
  } = useGame();

  if (expeditionPhase !== 'UPGRADE_SELECTION') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      {/* Subtle radial backdrop accent */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle at center, rgba(6,182,212,0.15) 0%, transparent 70%)',
        }}
      />

      {/* 3 Floating Hexagonal Cards with ZERO background panel behind them */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 max-w-5xl w-full relative z-10">
        {offeredRoguelikeChoices.map((card: RoguelikeUpgrade, idx: number) => {
          const isLegendary = card.rarity === 'legendary';
          const isEpic = card.rarity === 'epic';
          const isRare = card.rarity === 'rare';

          // Color themes based on category and rarity
          let primaryColor = '#06b6d4'; // Cyan default
          let strokeColor = 'rgba(6, 182, 212, 0.6)';
          let glowColor = 'rgba(6, 182, 212, 0.3)';
          let badgeBg = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';

          if (card.category === 'material') {
            primaryColor = '#38bdf8';
            strokeColor = 'rgba(56, 189, 248, 0.7)';
            glowColor = 'rgba(56, 189, 248, 0.35)';
            badgeBg = 'bg-sky-950/80 text-sky-300 border-sky-500/50';
          } else if (card.category === 'position') {
            primaryColor = '#10b981';
            strokeColor = 'rgba(16, 185, 129, 0.7)';
            glowColor = 'rgba(16, 185, 129, 0.35)';
            badgeBg = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
          } else if (card.category === 'timing') {
            primaryColor = '#f59e0b';
            strokeColor = 'rgba(245, 158, 11, 0.7)';
            glowColor = 'rgba(245, 158, 11, 0.35)';
            badgeBg = 'bg-amber-950/80 text-amber-300 border-amber-500/50';
          } else {
            primaryColor = '#c084fc';
            strokeColor = 'rgba(192, 132, 252, 0.7)';
            glowColor = 'rgba(192, 132, 252, 0.35)';
            badgeBg = 'bg-purple-950/80 text-purple-300 border-purple-500/50';
          }

          if (isLegendary) {
            primaryColor = '#fbbf24';
            strokeColor = 'rgba(251, 191, 36, 0.85)';
            glowColor = 'rgba(251, 191, 36, 0.45)';
            badgeBg = 'bg-amber-950 text-amber-300 border-amber-400 font-bold';
          } else if (isEpic) {
            primaryColor = '#e879f9';
            strokeColor = 'rgba(232, 121, 249, 0.85)';
            glowColor = 'rgba(232, 121, 249, 0.4)';
            badgeBg = 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-400 font-bold';
          }

          const CategoryIcon =
            card.category === 'material'
              ? Layers
              : card.category === 'position'
              ? Target
              : card.category === 'timing'
              ? Clock
              : Sparkles;

          const categoryLabel =
            card.category === 'material'
              ? 'MATERIAIS'
              : card.category === 'position'
              ? 'POSIÇÃO'
              : card.category === 'timing'
              ? 'TEMPO'
              : 'GERAL';

          return (
            <button
              key={card.id || idx}
              onClick={() => chooseRoguelikeUpgrade(card)}
              className="group relative w-[290px] sm:w-[310px] h-[360px] sm:h-[370px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:scale-105 focus:outline-none"
              style={{
                filter: `drop-shadow(0 0 16px ${glowColor})`,
              }}
            >
              {/* SVG Hexagonal Frame with Glowing Border */}
              <svg
                viewBox="0 0 300 360"
                className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300 group-hover:drop-shadow-[0_0_22px_currentColor]"
                style={{ color: primaryColor }}
              >
                <defs>
                  <linearGradient id={`hexGrad_${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#090d16" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#0f172a" stopOpacity="0.92" />
                    <stop offset="100%" stopColor="#040711" stopOpacity="0.96" />
                  </linearGradient>
                </defs>

                {/* Hexagon Body */}
                <polygon
                  points="150,6 294,88 294,272 150,354 6,272 6,88"
                  fill={`url(#hexGrad_${idx})`}
                  stroke={strokeColor}
                  strokeWidth="2.2"
                  className="transition-all duration-300 group-hover:stroke-white"
                />

                {/* Inner Hexagon Decorative Contour */}
                <polygon
                  points="150,18 282,94 282,266 150,342 18,266 18,94"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                  opacity="0.45"
                />

                {/* Cyber Corner Markers */}
                <circle cx="150" cy="6" r="3" fill={primaryColor} />
                <circle cx="294" cy="88" r="3" fill={primaryColor} />
                <circle cx="294" cy="272" r="3" fill={primaryColor} />
                <circle cx="150" cy="354" r="3" fill={primaryColor} />
                <circle cx="6" cy="272" r="3" fill={primaryColor} />
                <circle cx="6" cy="88" r="3" fill={primaryColor} />
              </svg>

              {/* Hexagon Content Area (Centered Safe Zone) */}
              <div className="relative z-10 px-8 py-6 w-full flex flex-col items-center justify-between h-[300px] text-center">
                {/* Category & Rarity Badge */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono tracking-wider uppercase font-semibold ${badgeBg}`}
                  >
                    <CategoryIcon className="w-3 h-3" />
                    <span>
                      {categoryLabel} · {card.rarity}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug group-hover:text-cyan-300 transition-colors mt-2">
                  {card.name}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-[13px] text-slate-200 font-medium leading-relaxed max-w-[230px]">
                  {card.description}
                </p>

                {/* Flavor Quote */}
                <p className="text-[10px] text-slate-400 italic line-clamp-2 max-w-[210px] font-serif">
                  &ldquo;{card.flavor}&rdquo;
                </p>

                {/* Integrated Action Button */}
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono font-bold text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black group-hover:border-cyan-400 transition-all shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>INTEGRAR PROTOCOLO</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
