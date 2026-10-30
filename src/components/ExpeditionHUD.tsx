/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../utils/audio';
import {
  Shield,
  Coins,
  FastForward,
  RotateCcw,
  Sparkles,
  Zap,
  Flame,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Radio,
  Target,
  Activity,
  Cpu,
  Layers,
  Award,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { GAME_MATERIALS, GAME_ARCHETYPES } from '../config';
import { ExpeditionCargoDrawer } from './ExpeditionCargoDrawer';

export const ExpeditionHUD: React.FC = () => {
  const {
    setMode,
    currentWave,
    tower,
    setTower,
    combatResources,
    combatCurrencies,
    protectedCargo,
    volatileCargo,
    selectedHex,
    setSelectedHex,
    timeSpeed,
    setTimeSpeed,
    activeRoguelikeUpgrades,
    autonomousModules,
    activeArchetypeId,
    setActiveArchetypeId,
    wavePointsCurrent,
    wavePointsTarget,
    triggerActiveSkill,
    activeSkillEffects,
  } = useGame();

  const [mutedState, setMutedState] = useState(sound.isMuted());
  const [isCargoDrawerOpen, setIsCargoDrawerOpen] = useState(false);
  const corePercent = Math.round((tower.coreHp / tower.maxCoreHp) * 100);
  const shields = tower.sectors.shields;
  const shieldPercent = Math.round((shields.hp / shields.maxHp) * 100);

  // Pontos para novas cartas
  const syncPercent = Math.min(100, Math.round((wavePointsCurrent / (wavePointsTarget || 1)) * 100));
  const isSyncNear = syncPercent >= 80;

  // Active skill cooldown / active indicators
  const isEmpActive = (activeSkillEffects?.emp_blast || 0) > Date.now();
  const isOverdriveActive = (activeSkillEffects?.overdrive || 0) > Date.now();

  const handleTriggerEmp = () => {
    triggerActiveSkill('emp_blast');
  };

  const handleTriggerOverdrive = () => {
    triggerActiveSkill('overdrive');
  };

  const handleRechargeShield = () => {
    sound.playShieldHit();
    setTower((prev) => {
      const curShield = prev.sectors.shields;
      const restored = Math.min(curShield.maxHp, curShield.hp + Math.round(curShield.maxHp * 0.45));
      return {
        ...prev,
        sectors: {
          ...prev.sectors,
          shields: { ...curShield, hp: restored, status: 'operational' },
        },
      };
    });
  };

  return (
    <div className="absolute top-3 left-3 right-3 pointer-events-none flex flex-col gap-2 z-20 select-none font-sans">
      {/* Top Combat Bar */}
      <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-slate-800 bg-slate-950/95 backdrop-blur-md pointer-events-auto shadow-2xl">
        {/* Left: Wave & Core Status */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Wave & Dimension Badge */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-400">Onda</span>
              <span className="text-lg sm:text-xl font-mono font-bold text-cyan-400 tabular-nums">
                #{currentWave}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap hidden sm:inline">
              {currentWave <= 4
                ? 'Éter Estelar'
                : currentWave <= 8
                ? 'Fenda de Plasma'
                : 'Abismo Primordial'}
            </span>
          </div>

          <span className="text-slate-800 hidden sm:inline" aria-hidden="true">|</span>

          {/* Core Health */}
          <div className="flex items-center gap-2 min-w-[120px] sm:min-w-[140px]">
            <Flame className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="w-full">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Núcleo</span>
                <span className="text-slate-200 font-semibold tabular-nums">{tower.coreHp} HP</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-0.5 border border-slate-800">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${corePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Shields */}
          <div className="hidden md:flex items-center gap-2 min-w-[120px]">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="w-full">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Escudo</span>
                <span className="text-cyan-300 font-semibold tabular-nums">{shields.hp} SP</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-0.5 border border-slate-800">
                <div
                  className="bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${shieldPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: MEDIDOR VISUAL DE PROGRESSÃO DA HORDA E NOVAS CARTAS ROGUELIKE */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-300 flex items-center gap-1.5 font-semibold">
              <Sparkles className={`w-3.5 h-3.5 ${isSyncNear ? 'text-amber-400 animate-spin' : 'text-cyan-400'}`} />
              <span>Horda Invasora Onda #{currentWave}:</span>
            </span>
            <span className="tabular-nums font-bold text-cyan-300">
              {wavePointsCurrent} / {wavePointsTarget} Invasores ({syncPercent}%)
            </span>
          </div>

          {/* Barra de Progresso com Shimmer e Pulso */}
          <div className="relative w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 shadow-inner">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isSyncNear
                  ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-400 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
              }`}
              style={{ width: `${syncPercent}%` }}
            />
          </div>

          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between leading-none">
            <span className="truncate flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>
                {isSyncNear
                  ? 'Quase lá! Elimine os últimos invasores para o Salto Quântico!'
                  : 'Derrote todos os inimigos da onda para liberar 3 Protocolos Táticos'}
              </span>
            </span>
            <span className="text-cyan-400 font-bold shrink-0 ml-1">
              {Math.max(0, wavePointsTarget - wavePointsCurrent)} restantes
            </span>
          </div>
        </div>

        {/* Right: Recursos & Controles de Jogo */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Tactical In-Combat Construction Currencies */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/95 border border-slate-800 text-xs font-mono shadow-inner">
            <span className="flex items-center gap-1 text-amber-300 font-bold" title="Nano-Matéria (construção/evolução)">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{combatCurrencies?.nanoMatter ?? 0}</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-cyan-300 font-bold" title="Micro-Circuitos (sistemas eletrônicos)">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{combatCurrencies?.microCircuits ?? 0}</span>
            </span>
            {(combatCurrencies?.tacticalData ?? 0) > 0 && (
              <>
                <span className="text-slate-700">|</span>
                <span className="flex items-center gap-1 text-purple-300 font-bold" title="Dados Táticos (mira e alvos)">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{combatCurrencies.tacticalData}</span>
                </span>
              </>
            )}
            {(combatCurrencies?.dimensionalMatrix ?? 0) > 0 && (
              <>
                <span className="text-slate-700">|</span>
                <span className="flex items-center gap-1 text-emerald-300 font-bold" title="Matriz Dimensional (salto quântico)">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{combatCurrencies.dimensionalMatrix}</span>
                </span>
              </>
            )}
          </div>

          {/* Time Speed Toggle (1x / 2x / 3x FRENÉTICO) */}
          <button
            onClick={() => {
              const nextSpeed = timeSpeed === 1 ? 2 : timeSpeed === 2 ? 3 : 1;
              setTimeSpeed(nextSpeed);
              sound.playClick();
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              timeSpeed === 3
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : timeSpeed === 2
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Velocidade da Batalha (1x normal / 2x acelerado / 3x super frenético)"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{timeSpeed}x {timeSpeed === 3 ? 'TURBO' : ''}</span>
          </button>

          {/* Audio Mute */}
          <button
            onClick={() => {
              const next = !sound.isMuted();
              sound.setMuted(next);
              sound.playClick();
              setMutedState(next);
            }}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title={mutedState ? 'Ativar Áudio' : 'Desativar Áudio'}
          >
            {mutedState ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>

          {/* Reset Camera Focus */}
          {selectedHex && (
            <button
              onClick={() => setSelectedHex(null)}
              className="px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              title="Restaurar visualização macro do mapa espacial"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Macro</span>
            </button>
          )}

          {/* Return to Base */}
          <button
            onClick={() => {
              sound.playClick();
              setMode('OPERATION');
            }}
            className="px-3 py-1.5 rounded-lg border border-cyan-600/70 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Retornar à Base (Modo Baixo)"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Base</span>
          </button>
        </div>
      </div>

      {/* Row 2: Tactical Instant Action Skills (Torna a gameplay muito mais fluida e frenética) */}
      <div className="flex items-center justify-between gap-3 pointer-events-auto">
        {/* Habilidades de Ação Rápida */}
        <div className="flex items-center gap-2">
          {/* EMP Shockwave */}
          <button
            onClick={handleTriggerEmp}
            className={`px-3 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer ${
              isEmpActive
                ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse'
                : 'bg-slate-950/90 hover:bg-slate-900 border-cyan-500/40 text-cyan-300 hover:border-cyan-400'
            }`}
            title="Pulso de Choque EMP: Paralisa todos os inimigos por 4 segundos"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pulso EMP</span>
          </button>

          {/* Overdrive Turbo Barrage */}
          <button
            onClick={handleTriggerOverdrive}
            className={`px-3 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer ${
              isOverdriveActive
                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse'
                : 'bg-slate-950/90 hover:bg-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-400'
            }`}
            title="Sobrecarga Bélica: Dobra a cadência de disparo de toda a frota por 4 segundos"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Sobrecarga</span>
          </button>

          {/* Emergency Shield Surge */}
          <button
            onClick={handleRechargeShield}
            disabled={shields.hp >= shields.maxHp}
            className={`px-3 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer ${
              shields.hp >= shields.maxHp
                ? 'bg-slate-950/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                : 'bg-slate-950/90 hover:bg-slate-900 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
            }`}
            title="Recarga de Emergência: Restaura 45% dos escudos da torre instantaneamente"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pulso de Escudo</span>
          </button>
        </div>

        {/* Módulos Autônomos Ativos e Sinergias Roguelike */}
        <div className="hidden lg:flex items-center gap-2 overflow-x-auto py-1 px-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Protocolos Táticos ({activeRoguelikeUpgrades.length}):
          </span>
          {activeRoguelikeUpgrades.slice(0, 3).map((u) => (
            <div
              key={u.id}
              title={`${u.name}: ${u.description}`}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-300 whitespace-nowrap shrink-0"
            >
              {u.name}
            </div>
          ))}
          {activeRoguelikeUpgrades.length > 3 && (
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              +{activeRoguelikeUpgrades.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Botão Flutuante de Carga & Espólios Oposto ao de Frota (Canto Inferior Direito) */}
      <div className="fixed right-3 bottom-3 z-30 pointer-events-auto select-none">
        <button
          onClick={() => {
            sound.playClick();
            setIsCargoDrawerOpen((prev) => !prev);
          }}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/95 border text-slate-100 shadow-2xl transition-all cursor-pointer group ${
            isCargoDrawerOpen
              ? 'border-amber-500 bg-amber-950/90 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.35)]'
              : Object.keys(volatileCargo.items || {}).length > 0 || volatileCargo.matter > 0
              ? 'border-amber-500/60 bg-slate-950/95 hover:border-amber-400 text-amber-300 animate-pulse'
              : 'border-slate-800 hover:border-amber-500/60'
          }`}
          title="Abrir manifesto de carga e espólios da incursão"
        >
          <div className="flex flex-col text-right">
            <span className="font-mono text-xs font-bold tracking-wide">Carga & Espólios</span>
            <span className="text-[10px] font-mono text-slate-400">
              {Object.keys(volatileCargo.items || {}).length} tipos ({Math.round(volatileCargo.matter)} Mat)
            </span>
          </div>
          <div className="w-6 h-6 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:text-amber-300">
            <Package className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Dedicated Collapsible Expedition Cargo Drawer */}
      <ExpeditionCargoDrawer
        isOpen={isCargoDrawerOpen}
        onClose={() => setIsCargoDrawerOpen(false)}
      />
    </div>
  );
};
