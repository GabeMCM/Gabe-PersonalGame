/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import {
  Shield,
  Zap,
  Box,
  Layers,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface StatusBarFooterProps {
  onNavigateToCommand?: () => void;
}

export const StatusBarFooter: React.FC<StatusBarFooterProps> = ({ onNavigateToCommand }) => {
  const {
    tower,
    resources,
    collectors,
    storageUsed,
    storageCapacity,
    gasStorageUsed,
    gasStorageCapacity,
    volumeUsed,
    volumeCapacity,
    isStorageFull,
    isOverclocked,
  } = useGame();

  const hullPct = Math.round((tower.coreHp / tower.maxCoreHp) * 100);
  const anyCollectorFull = collectors.some((c) => c.status === 'FULL' || c.currentAmount >= c.capacity);
  const ocMult = isOverclocked ? 2.0 : 1.0;
  const energyGainRate = Math.round(1.5 * ocMult);

  return (
    <footer className="h-6 bg-slate-950 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between px-3 select-none z-30 shrink-0 w-full overflow-hidden">
      {/* Esquerda: Telemetria da Torre (Casco, Escudos, Reator) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onNavigateToCommand}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          title="Ver detalhes de status no Comando"
        >
          <Shield className={`w-3 h-3 ${hullPct > 50 ? 'text-emerald-400' : hullPct > 25 ? 'text-amber-400' : 'text-rose-400'}`} />
          <span className="hidden sm:inline">Casco:</span>
          <span className={`font-semibold tabular-nums ${hullPct > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {tower.coreHp}/{tower.maxCoreHp} ({hullPct}%)
          </span>
        </button>

        <span className="text-slate-700 hidden sm:inline" aria-hidden="true">|</span>

        <div className="flex items-center gap-1.5" title="Energia Dimensional e Taxa de Recarga">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="hidden md:inline">Reator:</span>
          <span className="text-slate-200 font-semibold tabular-nums">
            {resources.dimensionalEnergy}/{resources.maxDimensionalEnergy} DE
          </span>
          <span className="text-cyan-400/90 text-[10px] hidden lg:inline tabular-nums">
            (+{energyGainRate}/s)
          </span>
        </div>
      </div>

      {/* Centro: Notificações & Alertas em Tempo Real */}
      <div className="hidden md:flex items-center gap-2 truncate px-2 text-center text-[10px] sm:text-[11px]">
        {anyCollectorFull ? (
          <span className="text-rose-400 flex items-center gap-1 font-semibold animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Alerta: Reservatório de Coletor Cheio! Drene no Separador ou Comando
          </span>
        ) : isStorageFull ? (
          <span className="text-amber-400 flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Alerta: Capacidade de Estoque Esgotada! Construa novos Silos
          </span>
        ) : (
          <span className="text-slate-400 flex items-center gap-1 truncate">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            Telemetria: Sistemas operacionais · Órbita sincronizada
          </span>
        )}
      </div>

      {/* Direita: Ocupação do Estoque Triplo (kg / L / m³) & Versão */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onNavigateToCommand}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          title="Ver estoque completo no Comando"
        >
          <Box className="w-3 h-3 text-violet-400" />
          <span className="hidden sm:inline">Estoque:</span>
          <span className={`tabular-nums ${storageUsed >= storageCapacity ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
            {storageUsed}/{storageCapacity}kg
          </span>
          <span className="text-slate-600 hidden lg:inline">·</span>
          <span className={`tabular-nums hidden lg:inline ${gasStorageUsed >= gasStorageCapacity ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
            {gasStorageUsed}/{gasStorageCapacity}L
          </span>
          <span className="text-slate-600 hidden xl:inline">·</span>
          <span className={`tabular-nums hidden xl:inline ${volumeUsed >= volumeCapacity ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
            {volumeUsed}/{volumeCapacity}m³
          </span>
        </button>

        <span className="text-slate-700 hidden sm:inline" aria-hidden="true">|</span>

        <span className="text-[10px] font-mono text-cyan-400/80 px-1 py-0.2 rounded bg-cyan-950/40 border border-cyan-800/40 hidden sm:inline">
          MODO BAIXO
        </span>
      </div>
    </footer>
  );
};
