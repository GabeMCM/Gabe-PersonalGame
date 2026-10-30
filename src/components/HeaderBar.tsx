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
    resources,
    startExpedition,
    towerPassives,
    setShowCodex,
    baseSectors,
    setExpeditionPhase,
    storageCapacity,
    storageUsed,
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
    <header className="h-14 border-b border-slate-800/80 bg-slate-950/95 text-slate-200 px-4 flex items-center justify-between gap-3 z-20 shrink-0 select-none">
      {/* Zone 1: Marca da Estação / Torre Dimensional */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg border border-cyan-500/40 bg-slate-900 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs shadow-sm">
          TD
        </div>
        <div>
          <h1 className="font-semibold text-xs sm:text-sm tracking-wide text-slate-100 uppercase font-mono">
            Torre Dimensional
          </h1>
          <div className="text-[10px] text-slate-400 font-mono">
            {mode === 'OPERATION'
              ? 'BASE · OPERAÇÃO'
              : 'EXPEDIÇÃO · TÁTICO'}
          </div>
        </div>
      </div>

      {/* Zone 2: Telemetria Macro em Tempo Real (Sem Emojis, Badges Sci-Fi) */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto py-1 text-xs font-mono">
        {/* Dimensional Energy */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-cyan-800/50 bg-cyan-950/40 text-cyan-200" title="Energia Dimensional: recarrega a cada segundo">
          <span className="text-[10px] font-bold text-cyan-400">DE</span>
          <span className="font-semibold">{Math.floor(resources.dimensionalEnergy)}/{resources.maxDimensionalEnergy}</span>
          <span className="text-[10px] text-cyan-400/70">+1.5/s</span>
        </div>

        {/* Common Matter */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-800 bg-slate-900/60 text-slate-300" title="Matéria Comum">
          <span className="text-[10px] font-bold text-slate-400">MAT</span>
          <span className="font-semibold">{Math.floor(resources.commonMatter)}</span>
        </div>

        {/* Tech Components */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-blue-900/40 bg-blue-950/30 text-blue-200" title="Componentes Técnicos">
          <span className="text-[10px] font-bold text-blue-400">TECH</span>
          <span className="font-semibold">{Math.floor(resources.techComponents)}</span>
        </div>

        {/* Combat Data */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-purple-900/40 bg-purple-950/30 text-purple-200" title="Dados Táticos de Combate">
          <span className="text-[10px] font-bold text-purple-400">DAT</span>
          <span className="font-semibold">{Math.floor(resources.combatData)}</span>
        </div>

        {/* Dimensional Materials */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-amber-900/40 bg-amber-950/30 text-amber-200" title="Materiais Dimensionais">
          <span className="text-[10px] font-bold text-amber-400">MD</span>
          <span className="font-semibold">{Math.floor(resources.dimensionalMaterials)}</span>
        </div>

        {/* Storage Capacity */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] ${
          storageUsed >= storageCapacity
            ? 'border-rose-800/80 bg-rose-950/50 text-rose-300'
            : 'border-slate-800 bg-slate-900/60 text-slate-300'
        }`} title="Capacidade de Armazenamento de Carga">
          <span className="text-[10px] font-bold text-slate-400">EST</span>
          <span className="font-semibold">{storageUsed}/{storageCapacity} kg</span>
        </div>
      </div>

      {/* Zone 3: Controles e Ações Permitidas (Codex, Áudio, Expedição) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Livro de Receitas & Materiais (Codex) */}
        <button
          onClick={() => {
            sound.playClick();
            setShowCodex(true);
          }}
          className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-mono font-medium cursor-pointer"
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
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all flex items-center gap-2 shadow-sm whitespace-nowrap font-mono ${
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
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-amber-800/60 bg-amber-950/40 text-amber-300 flex items-center gap-1.5"
              title="Construa o primeiro Silo de Estoque em Comando para desbloquear a Expedição"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Requer Silo de Estoque</span>
              <span className="sm:hidden">Bloqueado</span>
            </div>
          )
        ) : (
          <button
            onClick={() => {
              sound.playClick();
              setExpeditionPhase('EXTRACTION_CHECKPOINT');
            }}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border border-cyan-700/70 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 transition-colors flex items-center gap-2 cursor-pointer font-mono"
            title="Extrair Carga e Retornar à Base com Segurança"
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Extrair / Base</span>
          </button>
        )}
      </div>
    </header>
  );
};
