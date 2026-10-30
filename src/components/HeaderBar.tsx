/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  Compass,
  Radio,
  BookOpen,
  Lock,
} from 'lucide-react';

export const HeaderBar: React.FC = () => {
  const {
    mode,
    setMode,
    resources,
    startExpedition,
    towerPassives,
    setShowCodex,
    baseSectors,
  } = useGame();
  const [muted, setMuted] = useState(sound.isMuted());

  const toggleMute = () => {
    const next = !muted;
    sound.setMuted(next);
    setMuted(next);
  };

  const hasWarpDiscount = towerPassives?.find((p) => p.id === 'pass_warp_1')?.unlocked;
  const portalCost = hasWarpDiscount ? 25 : 35;
  const canAfford = resources.dimensionalEnergy >= portalCost;
  const hasInventory = baseSectors.inventory?.installed;

  return (
    <header className="h-13 border-b border-slate-800/80 bg-slate-950/95 text-slate-200 px-4 flex items-center justify-between gap-4 z-20 shrink-0 select-none">
      {/* Zone 1: Marca da Estação / Torre Dimensional */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg border border-cyan-500/40 bg-slate-900 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs shadow-sm">
          TD
        </div>
        <div>
          <h1 className="font-semibold text-xs sm:text-sm tracking-wide text-slate-100 uppercase">
            Torre Dimensional
          </h1>
          <div className="text-[10px] text-slate-400 font-mono">
            {mode === 'OPERATION'
              ? 'MODO BAIXO · OPERAÇÃO DA BASE'
              : 'MODO ALTO · EXPEDIÇÃO TÁTICA'}
          </div>
        </div>
      </div>

      {/* Zone 2: Controles e Ações Permitidas (Codex, Áudio, Expedição) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Livro de Receitas & Materiais (Codex) */}
        <button
          onClick={() => {
            sound.playClick();
            setShowCodex(true);
          }}
          className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
          title="Consultar Codex de Materiais, Máquinas e Receitas"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Codex Industrial</span>
          <span className="sm:hidden">Codex</span>
        </button>

        {/* Controle de Volume */}
        <button
          onClick={toggleMute}
          title={muted ? 'Ativar Áudio' : 'Mutar Áudio'}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Botão de EXPEDIÇÃO / Salto Dimensional */}
        {mode === 'OPERATION' ? (
          hasInventory ? (
            <button
              onClick={() => {
                if (canAfford) {
                  sound.playCheckpoint();
                  startExpedition();
                } else {
                  sound.playAlert();
                }
              }}
              disabled={!canAfford}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all flex items-center gap-2 shadow-sm whitespace-nowrap ${
                canAfford
                  ? 'bg-cyan-600 hover:bg-cyan-500 border-cyan-400/80 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
              }`}
              title={canAfford ? 'Iniciar Salto Dimensional' : `Requer ${portalCost} DE`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>EXPEDIÇÃO ({portalCost} DE)</span>
            </button>
          ) : (
            <div
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-800/60 bg-amber-950/40 text-amber-300 flex items-center gap-1.5"
              title="Construa o primeiro Silo de Estoque em Comando para desbloquear a Expedição"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Requer Silo de Estoque</span>
              <span className="sm:hidden">Bloqueado</span>
            </div>
          )
        ) : (
          <button
            onClick={() => setMode('OPERATION')}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Retornar à Base</span>
          </button>
        )}
      </div>
    </header>
  );
};
