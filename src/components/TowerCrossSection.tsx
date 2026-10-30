/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BaseSector, BaseSectorId } from '../types/game';
import {
  Shield,
  Zap,
  Crosshair,
  Layers,
  Cpu,
  Wrench,
  Box,
  Radio,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Activity,
  Flame,
  Sparkles,
  Gauge,
  Compass,
  Radar,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface TowerDeckConfig {
  id: BaseSectorId;
  code: string;
  deckLabel: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  position: 'top' | 'upper' | 'core' | 'lower' | 'subdeck';
  schematicTag: string;
}

const TOWER_DECKS_ORDER: TowerDeckConfig[] = [
  {
    id: 'research',
    code: 'DECK-04',
    deckLabel: 'Bastilha Bélica & Baterias de Artilharia',
    role: 'Canhões de Táquions e Projéteis de Alta Energia',
    icon: Crosshair,
    accentColor: '#f43f5e',
    position: 'top',
    schematicTag: 'ARTILHARIA ORBITAL',
  },
  {
    id: 'shields',
    code: 'DECK-03',
    deckLabel: 'Matriz de Escudo Hexagonal em Favo',
    role: 'Emissores de Barreira Cinética e Deflexão Gravitacional',
    icon: Shield,
    accentColor: '#38bdf8',
    position: 'upper',
    schematicTag: 'CAMPO CINÉTICO',
  },
  {
    id: 'reactor',
    code: 'DECK-02',
    deckLabel: 'Câmara da Singularidade Quântica',
    role: 'Célula de Energia de Vácuo Primordial e Sobrecarga',
    icon: Zap,
    accentColor: '#f59e0b',
    position: 'core',
    schematicTag: 'NÚCLEO DE FUSÃO',
  },
  {
    id: 'command',
    code: 'DECK-01',
    deckLabel: 'Ponte de Comando & Telemetria Multiversal',
    role: 'Navegação Espacial, Integridade Estrutural e Portais',
    icon: Radio,
    accentColor: '#06b6d4',
    position: 'core',
    schematicTag: 'CENTRAL DE DADOS',
  },
  {
    id: 'refinery',
    code: 'DECK-B1',
    deckLabel: 'Refinaria Criogênica & Sifão de Vácuo',
    role: 'Condensação de Gases e Purificação Química de Minérios',
    icon: Layers,
    accentColor: '#10b981',
    position: 'lower',
    schematicTag: 'SISTEMA DE FLUIDOS',
  },
  {
    id: 'inventory',
    code: 'DECK-B2',
    deckLabel: 'Silos de Carga & Blindagem Isotópica',
    role: 'Armazenamento de Matérias Brutas e Lingotes Fundidos',
    icon: Box,
    accentColor: '#a855f7',
    position: 'lower',
    schematicTag: 'SILOS DE ARMAZENAMENTO',
  },
  {
    id: 'circuits',
    code: 'SUB-01',
    deckLabel: 'Laboratório Quântico de Microchips',
    role: 'Matriz de Barramentos e Condutores Multiversais',
    icon: Cpu,
    accentColor: '#06b6d4',
    position: 'subdeck',
    schematicTag: 'CIRCUITOS INTEGRADOS',
  },
  {
    id: 'equipment',
    code: 'SUB-02',
    deckLabel: 'Oficina de Sistemas Autônomos',
    role: 'Montagem de Drones e Armamento Autônomo',
    icon: Wrench,
    accentColor: '#ec4899',
    position: 'subdeck',
    schematicTag: 'HANGAR DE AUTÔNOMOS',
  },
];

interface TowerCrossSectionProps {
  baseSectors: Record<BaseSectorId, BaseSector>;
  selectedDeckId: BaseSectorId;
  onSelectDeck: (id: BaseSectorId) => void;
  isOverclocked: boolean;
  coreHp: number;
  maxCoreHp: number;
}

export const TowerCrossSection: React.FC<TowerCrossSectionProps> = ({
  baseSectors,
  selectedDeckId,
  onSelectDeck,
  isOverclocked,
  coreHp,
  maxCoreHp,
}) => {
  return (
    <div className="flex flex-col bg-[#050813] border border-cyan-900/60 rounded-xl overflow-hidden shadow-2xl relative select-none">
      {/* 1. Header do Blueprint Técnico Holográfico */}
      <div className="px-4 py-3 bg-slate-950/90 border-b border-cyan-900/60 flex items-center justify-between font-mono text-xs z-10">
        <div className="flex items-center gap-2.5 text-slate-200">
          <div className="w-2.5 h-2.5 bg-cyan-400 rounded-sm animate-pulse shadow-[0_0_8px_#38bdf8]" />
          <span className="font-bold tracking-wider uppercase text-cyan-300">
            Corte Estrutural · Cidadela Dimensional
          </span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Engenharia de Decks em Altura
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Casco:</span>
            <span className="text-cyan-300 font-bold tabular-nums">
              {coreHp}/{maxCoreHp} HP
            </span>
          </div>

          {isOverclocked && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold animate-pulse text-[10px]">
              SOBRECARGA ATIVA
            </span>
          )}
        </div>
      </div>

      {/* 2. Painel de Telemetria Holográfica Rápida */}
      <div className="grid grid-cols-3 border-b border-slate-800/80 bg-slate-950/60 p-2.5 text-center font-mono text-[10px] text-slate-400">
        <div className="flex flex-col items-center border-r border-slate-800/80">
          <span className="text-slate-500">FLUXO DE TÁQUIONS</span>
          <strong className="text-cyan-400 font-bold mt-0.5">142.8 THz</strong>
        </div>
        <div className="flex flex-col items-center border-r border-slate-800/80">
          <span className="text-slate-500">PRESSÃO DE VÁCUO</span>
          <strong className="text-emerald-400 font-bold mt-0.5">ESTÁVEL (0.02 Pa)</strong>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-500">INTEGRIDADE DE CASCO</span>
          <strong className="text-amber-400 font-bold mt-0.5">
            {Math.round((coreHp / maxCoreHp) * 100)}% NOMINAL
          </strong>
        </div>
      </div>

      {/* 3. Área Esquemática da Torre com Eixo Central de Energia e Decks */}
      <div className="relative p-3 sm:p-4 flex flex-col gap-2.5 bg-[#03060f] overflow-y-auto max-h-[660px]">
        {/* Linhas Técnicas de Blueprint de Fundo */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(6, 182, 212, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(6, 182, 212, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Eixo Vertical Central de Condução de Energia do Núcleo */}
        <div className="absolute left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 bg-gradient-to-b from-cyan-500/20 via-cyan-400/60 to-purple-500/20 pointer-events-none z-0">
          {isOverclocked && (
            <div className="w-full h-full bg-amber-400 animate-pulse opacity-90 shadow-[0_0_15px_rgba(251,191,36,0.9)]" />
          )}
        </div>

        {/* Decks da Cidadela Empilhados */}
        {TOWER_DECKS_ORDER.map((deck) => {
          const sector = baseSectors[deck.id];
          const isInstalled = sector ? sector.installed : false;
          const isSelected = selectedDeckId === deck.id;
          const level = sector ? sector.level : 0;
          const hp = sector ? sector.hp : 0;
          const maxHp = sector ? sector.maxHp : 100;
          const hpPct = Math.round((hp / maxHp) * 100);
          const Icon = deck.icon;

          return (
            <div
              key={deck.id}
              onClick={() => {
                onSelectDeck(deck.id);
                sound.playClick();
              }}
              className={`group relative rounded-xl border p-3 transition-all cursor-pointer z-10 font-mono ${
                isSelected
                  ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/60 scale-[1.01]'
                  : isInstalled
                  ? 'bg-slate-950/80 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 hover:bg-slate-900/40 border-dashed border-slate-800/80 text-slate-500'
              }`}
            >
              {/* Parafusos e Rebites Metálicos */}
              <span className="absolute top-1.5 left-1.5 w-1 h-1 bg-slate-600 rounded-full" />
              <span className="absolute top-1.5 right-1.5 w-1 h-1 bg-slate-600 rounded-full" />
              <span className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-slate-600 rounded-full" />
              <span className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-slate-600 rounded-full" />

              {/* Chanfro de Seleção Lateral */}
              {isSelected && (
                <div
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-cyan-400 rotate-45 border border-slate-950 shadow-md"
                  title="Deck Ativo"
                />
              )}

              <div className="flex items-center justify-between gap-2.5">
                {/* Lado Esquerdo: Código do Deck, Ícone e Identificação */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isInstalled
                        ? isSelected
                          ? 'border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-inner'
                          : 'border-slate-700 bg-slate-900 text-slate-300'
                        : 'border-dashed border-slate-800 bg-slate-950 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded">
                        {deck.code}
                      </span>
                      <span className="text-[9px] font-bold text-cyan-400/80 px-1.5 py-0.2 bg-cyan-950/50 border border-cyan-800/40 rounded uppercase">
                        {deck.schematicTag}
                      </span>
                    </div>

                    <h4
                      className={`text-xs font-bold truncate mt-1 ${
                        isSelected
                          ? 'text-cyan-200'
                          : isInstalled
                          ? 'text-slate-100'
                          : 'text-slate-500'
                      }`}
                    >
                      {deck.deckLabel}
                    </h4>

                    <span className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">
                      {deck.role}
                    </span>
                  </div>
                </div>

                {/* Lado Direito: Nível e Barra de Integridade */}
                <div className="flex flex-col items-end shrink-0 pl-2">
                  {isInstalled ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          NÍVEL {level}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                      </div>

                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {hpPct}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-900 rounded border border-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              hpPct > 50
                                ? 'bg-cyan-400'
                                : hpPct > 25
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400/90 bg-amber-950/20 border border-dashed border-amber-500/40 px-2 py-1 rounded">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Montar no Construtor</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Destaque de Sobrecarga para o Reator */}
              {isOverclocked && deck.id === 'reactor' && (
                <div className="mt-2 text-[10px] text-amber-300 flex items-center gap-1.5 bg-amber-950/50 border border-amber-500/40 px-2.5 py-1 rounded animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>SINGULARIDADE EM SOBRECARGA: PRODUÇÃO DUPLICADA</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Rodapé do Blueprint */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 z-10">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Selecione um Deck para gerenciar melhorias e calibragem</span>
        </span>
        <span className="text-cyan-400 font-bold hidden md:inline">
          {Object.values(baseSectors).filter((s) => s.installed).length} /{' '}
          {TOWER_DECKS_ORDER.length} Módulos Instalados
        </span>
      </div>
    </div>
  );
};
