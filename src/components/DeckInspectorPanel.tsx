/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BaseSector,
  BaseSectorId,
  PlayerResources,
  InventoryItem,
  AutonomousModule,
  UniverseInfo,
  CircuitNode,
} from '../types/game';
import {
  Shield,
  Zap,
  Wrench,
  Hammer,
  AlertTriangle,
  CheckCircle,
  Lock,
  Cpu,
  Layers,
  Box,
  Radio,
  Flame,
  Maximize2,
  TrendingUp,
  RotateCw,
  Plus,
  Crosshair,
  Compass,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface DeckInspectorPanelProps {
  deckId: BaseSectorId;
  sector: BaseSector;
  resources: PlayerResources;
  onInstallSector: (id: BaseSectorId) => boolean;
  onUpgradeSector: (id: BaseSectorId) => boolean;
  onRepairSector?: () => void;
  // Circuit Matrix integration
  onOpenCircuitMatrix?: () => void;
  circuitNodesCount: { total: number; unlocked: number };
  activeUniverse: UniverseInfo;
  // Equipment integration
  autonomousModules: AutonomousModule[];
  onCraftModule: (id: string) => boolean;
  onEquipModule: (id: string, slotIndex: number) => boolean;
  onUnequipModule: (id: string) => void;
  // Inventory integration
  inventoryItems: InventoryItem[];
  onRefineItem: (id: string) => boolean;
  onRecycleAll: () => void;
  storageUsed: number;
  storageCapacity: number;
  // Reactor & Command actions
  isOverclocked: boolean;
  onOverclock: () => void;
  onStartExpedition: () => void;
  coreHp: number;
  maxCoreHp: number;
  onRepairCore: () => void;
}

export const DeckInspectorPanel: React.FC<DeckInspectorPanelProps> = ({
  deckId,
  sector,
  resources,
  onInstallSector,
  onUpgradeSector,
  onRepairSector,
  onOpenCircuitMatrix,
  circuitNodesCount,
  activeUniverse,
  autonomousModules,
  onCraftModule,
  onEquipModule,
  onUnequipModule,
  inventoryItems,
  onRefineItem,
  onRecycleAll,
  storageUsed,
  storageCapacity,
  isOverclocked,
  onOverclock,
  onStartExpedition,
  coreHp,
  maxCoreHp,
  onRepairCore,
}) => {
  const isInstalled = sector ? sector.installed : false;
  const hp = sector ? sector.hp : 0;
  const maxHp = sector ? sector.maxHp : 100;
  const level = sector ? sector.level : 0;
  const maxLevel = sector ? sector.maxLevel : 5;

  const canAffordInstall =
    sector &&
    resources.commonMatter >= sector.costMatter &&
    resources.techComponents >= sector.costTech &&
    resources.dimensionalMaterials >= sector.costDimMat;

  const nextUpgradeCostMatter = (level + 1) * 75;
  const nextUpgradeCostTech = (level + 1) * 5;
  const canAffordUpgrade =
    isInstalled &&
    level < maxLevel &&
    resources.commonMatter >= nextUpgradeCostMatter &&
    resources.techComponents >= nextUpgradeCostTech;

  const canAffordCoreRepair = resources.commonMatter >= 50 && coreHp < maxCoreHp;

  return (
    <div className="flex flex-col bg-[#070b14] border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-slate-200">
      {/* 1. Topo Tático do Console de Engenharia */}
      <div className="px-5 py-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded border border-cyan-500/50 bg-slate-950 flex items-center justify-center text-cyan-400 shadow-inner">
            {deckId === 'command' && <Radio className="w-5 h-5 text-cyan-400" />}
            {deckId === 'reactor' && <Zap className="w-5 h-5 text-amber-400" />}
            {deckId === 'shields' && <Shield className="w-5 h-5 text-cyan-400" />}
            {deckId === 'research' && <Crosshair className="w-5 h-5 text-rose-400" />}
            {deckId === 'refinery' && <Layers className="w-5 h-5 text-emerald-400" />}
            {deckId === 'inventory' && <Box className="w-5 h-5 text-purple-400" />}
            {deckId === 'circuits' && <Cpu className="w-5 h-5 text-cyan-400" />}
            {deckId === 'equipment' && <Wrench className="w-5 h-5 text-pink-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                DECK CONSOLE // {deckId.toUpperCase()}
              </span>
              <span className="text-slate-600">·</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  isInstalled
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-950/60 text-amber-400 border border-amber-500/40'
                }`}
              >
                {isInstalled ? `Nível ${level} · Operacional` : 'Não Instalado'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-0.5">
              {sector?.name || 'Módulo da Torre'}
            </h3>
          </div>
        </div>

        {/* Nível do Deck */}
        {isInstalled && (
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-[11px] text-slate-400">Capacidade:</span>
            <span className="text-cyan-300 font-bold">
              LVL {level} / {maxLevel}
            </span>
          </div>
        )}
      </div>

      {/* 2. Corpo do Console com Telemetria e Controles */}
      <div className="p-4 sm:p-5 flex flex-col gap-5 overflow-y-auto max-h-[640px]">
        {/* Descrição Funcional da Sala */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed">
          <p>{sector?.description}</p>
          <div className="mt-2 text-cyan-300 flex items-center gap-1.5 text-[11px] font-semibold border-t border-slate-800/80 pt-2">
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Impacto na Base: {sector?.unlockedFeature}</span>
          </div>
        </div>

        {/* Telemetria de Casco e Energia do Módulo */}
        {isInstalled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Casco do Compartimento */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Blindagem do Deck:
                </span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {hp} / {maxHp} HP
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${Math.round((hp / maxHp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Eficiência Operacional */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Eficiência Energética:
              </span>
              <span className="text-emerald-400 font-bold text-sm mt-1">
                {100 + level * 20}% de Rendimento
              </span>
            </div>
          </div>
        )}

        {/* 3. Ações de Engenharia: Construção ou Evolução do Deck */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              Operações de Engenharia
            </span>
            <span className="text-[11px] text-slate-500">
              {isInstalled ? `Próximo Nível: ${level + 1}` : 'Instalação Requerida'}
            </span>
          </div>

          {!isInstalled ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-400">
                Este deck está vazio no esqueleto da torre. Construa a estrutura para ativar seus sistemas permanentes.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400">Custo de Construção:</span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    resources.commonMatter >= sector.costMatter
                      ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-600'
                  }`}
                >
                  {sector.costMatter} Matéria
                </span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    resources.techComponents >= sector.costTech
                      ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-600'
                  }`}
                >
                  {sector.costTech} Componentes
                </span>
                {sector.costDimMat > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      resources.dimensionalMaterials >= sector.costDimMat
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                        : 'border-slate-800 bg-slate-900 text-slate-600'
                    }`}
                  >
                    {sector.costDimMat} Mat. Dimensional
                  </span>
                )}
              </div>
              <button
                onClick={() => onInstallSector(deckId)}
                disabled={!canAffordInstall}
                className="w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-cyan-500/50 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 text-cyan-200 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Hammer className="w-4 h-4 text-cyan-400" />
                <span>ENGATAR CONSTRUÇÃO DO DECK</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {level < maxLevel ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400">Custo de Evolução:</span>
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        resources.commonMatter >= nextUpgradeCostMatter
                          ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-600'
                      }`}
                    >
                      {nextUpgradeCostMatter} Matéria
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        resources.techComponents >= nextUpgradeCostTech
                          ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-600'
                      }`}
                    >
                      {nextUpgradeCostTech} Componentes
                    </span>
                  </div>
                  <button
                    onClick={() => onUpgradeSector(deckId)}
                    disabled={!canAffordUpgrade}
                    className="px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-emerald-500/50 bg-gradient-to-r from-emerald-950 to-slate-900 hover:from-emerald-900 hover:to-slate-800 text-emerald-200 shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>EVOLUIR PARA NÍVEL {level + 1}</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-cyan-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span>Estrutura no Nível Máximo de Eficiência.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. SEÇÃO OPERACIONAL DEDICADA DE ACORDO COM O DECK */}

        {/* (A) Seção de Circuitos Multiversais */}
        {deckId === 'circuits' && (
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Matriz de Circuitos & Barramentos
              </span>
              <span className="text-[11px] text-cyan-400">
                {circuitNodesCount.unlocked} / {circuitNodesCount.total} Nós Ativos
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Acesse a placa de microchips e traços diagonais para sintonizar bônus de dano, cadência, escudos e canhões adicionais.
            </p>
            {isInstalled ? (
              <button
                onClick={onOpenCircuitMatrix}
                className="w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 shadow-lg cursor-pointer transition-all"
              >
                <Maximize2 className="w-4 h-4 text-cyan-300" />
                <span>ABRIR MATRIZ DE CIRCUITOS COMPLETA</span>
              </button>
            ) : (
              <div className="text-xs text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Construa este setor para liberar a Árvore de Circuitos.</span>
              </div>
            )}
          </div>
        )}

        {/* (B) Seção de Oficina de Equipamentos Autônomos */}
        {deckId === 'equipment' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5 uppercase">
                <Wrench className="w-4 h-4 text-pink-400" />
                Armamento Autônomo da Torre
              </span>
              <span className="text-[11px] text-slate-400">
                {autonomousModules.filter((m) => m.equipped).length} / 3 Armas Equipadas
              </span>
            </div>

            {isInstalled ? (
              <div className="grid grid-cols-1 gap-2.5">
                {autonomousModules.map((mod) => {
                  const canCraft =
                    resources.commonMatter >= mod.costMatter &&
                    resources.techComponents >= mod.costTech &&
                    resources.combatData >= mod.costCombatData;

                  return (
                    <div
                      key={mod.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-100">{mod.name}</h4>
                          <span className="text-[10px] text-slate-400">({mod.role})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{mod.description}</p>
                      </div>

                      <div className="shrink-0">
                        {mod.unlocked ? (
                          mod.equipped ? (
                            <button
                              onClick={() => onUnequipModule(mod.id)}
                              className="px-3 py-1.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-900 cursor-pointer"
                            >
                              Equipado
                            </button>
                          ) : (
                            <button
                              onClick={() => onEquipModule(mod.id, 0)}
                              className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                            >
                              Equipar
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => onCraftModule(mod.id)}
                            disabled={!canCraft}
                            className="px-3 py-1.5 rounded bg-pink-950/60 border border-pink-500/40 text-pink-200 text-xs font-bold hover:bg-pink-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Forjar ({mod.costMatter}M)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Construa a Oficina para liberar a montagem de disparadores automáticos de EMP, Flak e lasers orbitais.
              </p>
            )}
          </div>
        )}

        {/* (C) Seção de Hangar de Estoque & Silos */}
        {deckId === 'inventory' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase">
                <Box className="w-4 h-4 text-purple-400" />
                Silos de Minério & Refino
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  Carga: {storageUsed} / {storageCapacity} kg
                </span>
                <button
                  onClick={onRecycleAll}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-bold cursor-pointer"
                >
                  Refinar Todos
                </button>
              </div>
            </div>

            {isInstalled ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {inventoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{item.icon}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{item.name}</h4>
                        <span className="text-[10px] text-slate-400">
                          Qtd: <strong className="text-slate-100">{item.quantity}</strong> ({item.unitWeight * item.quantity}kg)
                        </span>
                      </div>
                    </div>

                    {item.refineYield && item.quantity > 0 && (
                      <button
                        onClick={() => onRefineItem(item.id)}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        Refinar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Construa o Hangar de Estoque para inspecionar e refinar minérios brutos em matéria pura e componentes.
              </p>
            )}
          </div>
        )}

        {/* (D) Seção do Reator e Ponte de Comando */}
        {(deckId === 'command' || deckId === 'reactor') && (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
              <Zap className="w-4 h-4 text-amber-400" />
              Sistemas Primários de Força da Torre
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Reparo de Casco Central */}
              <button
                onClick={onRepairCore}
                disabled={!canAffordCoreRepair}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Reparar Casco Central</span>
                <span className="text-[10px] text-slate-400">50 Matéria (+250 HP)</span>
              </button>

              {/* Ativador de Sobrecarga */}
              <button
                onClick={onOverclock}
                disabled={isOverclocked || resources.dimensionalEnergy < 15}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all ${
                  isOverclocked
                    ? 'border-amber-500/60 bg-amber-950/60 text-amber-300 animate-pulse'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Flame className={`w-4 h-4 ${isOverclocked ? 'text-amber-400 animate-spin' : 'text-amber-400'}`} />
                <span className="text-xs font-bold">
                  {isOverclocked ? 'Sobrecarga Ativa (2x)' : 'Ativar Sobrecarga (2x)'}
                </span>
                <span className="text-[10px] text-slate-400">15 DE Energia</span>
              </button>

              {/* Iniciar Expedição */}
              <button
                onClick={onStartExpedition}
                disabled={resources.dimensionalEnergy < 35}
                className="p-3 rounded-lg bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-500/50 hover:border-cyan-400 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Compass className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span className="text-xs font-bold text-cyan-100">Iniciar Expedição</span>
                <span className="text-[10px] text-cyan-300/80">35 DE Salto Dimensional</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
