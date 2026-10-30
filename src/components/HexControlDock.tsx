/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame, DEFAULT_MODULE_DEFS } from '../context/GameContext';
import { ModuleType, PlacedModule } from '../types/game';
import { getModuleSpriteDataUrl } from '../game/PixelSprites';
import { sound } from '../utils/audio';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  TrendingUp,
  X,
  Crosshair,
  Shield,
  Coins,
  CheckCircle2,
  Wrench,
  Activity,
  Target,
  MousePointerClick,
  Layers,
} from 'lucide-react';

interface ModuleDetailSpec {
  id: ModuleType;
  category: 'assault' | 'heavy' | 'support';
  roleBadge: string;
  tacticalAdds: string;
  dps: number;
  rangeHex: string;
  fireCadence: string;
  specialTrait: string;
}

const MODULE_SPECS: Record<ModuleType, ModuleDetailSpec> = {
  pulse_cannon: {
    id: 'pulse_cannon',
    category: 'assault',
    roleBadge: 'Patrulha · Cinético',
    tacticalAdds: 'Dispara rajadas balísticas em linha reta de alta velocidade. Excelente contra enxames ágeis.',
    dps: 32,
    rangeHex: '3 Hex',
    fireCadence: '1.4 t/s',
    specialTrait: 'Tiro balístico linear anti-enxame com alta cadência.',
  },
  beam_cruiser: {
    id: 'beam_cruiser',
    category: 'assault',
    roleBadge: 'Feixe · Térmico',
    tacticalAdds: 'Laser contínuo sem tempo de voo, fundindo blindagens leves instantaneamente.',
    dps: 48,
    rangeHex: '4 Hex',
    fireCadence: 'Contínuo',
    specialTrait: 'Dano instantâneo térmico sem chance de esquiva.',
  },
  plasma_battery: {
    id: 'plasma_battery',
    category: 'heavy',
    roleBadge: 'Artilharia · Plasma AoE',
    tacticalAdds: 'Lança esferas balísticas de plasma com detonação em área. Sobrecarga ao ser destruída!',
    dps: 70,
    rangeHex: '5 Hex',
    fireCadence: '0.65 t/s',
    specialTrait: 'Explosão em área (2 hexágonos) e sobrecarga destrutiva ao cair.',
  },
  flux_harvester: {
    id: 'flux_harvester',
    category: 'support',
    roleBadge: 'Vórtice · Suporte',
    tacticalAdds: 'Gera vórtice que desacelera invasores em 30% num raio de 2 hexágonos e magnetiza matéria.',
    dps: 15,
    rangeHex: '4 Hex',
    fireCadence: '2.5s pulso',
    specialTrait: 'Lentidão em área (30%) e extração contínua de recursos.',
  },
  missile_launcher: {
    id: 'missile_launcher',
    category: 'heavy',
    roleBadge: 'Mísseis · Teleguiado',
    tacticalAdds: 'Dispara micro-mísseis balísticos em trajetória curva com rastro de ignição e impacto em área.',
    dps: 65,
    rangeHex: '5 Hex',
    fireCadence: '0.8 t/s',
    specialTrait: 'Salvas guiadas de longo alcance com explosão concentrada.',
  },
  tesla_coil: {
    id: 'tesla_coil',
    category: 'heavy',
    roleBadge: 'Tesla · Choque em Cadeia',
    tacticalAdds: 'Descargas elétricas ionizadas que saltam em cadeia entre até 3 inimigos e congelam.',
    dps: 55,
    rangeHex: '4 Hex',
    fireCadence: '1.2 t/s',
    specialTrait: 'Relâmpagos em arco que congelam e desaceleram alvos.',
  },
  railgun_bastion: {
    id: 'railgun_bastion',
    category: 'assault',
    roleBadge: 'Railgun · Hiper-Penetração',
    tacticalAdds: 'Projétil hiper-sônico retilíneo que atravessa todos os inimigos alinhados no eixo de tiro.',
    dps: 90,
    rangeHex: '6 Hex',
    fireCadence: '0.45 t/s',
    specialTrait: 'Perfuração linear completa de múltiplos alvos alinhados.',
  },
  nanobot_drone: {
    id: 'nanobot_drone',
    category: 'support',
    roleBadge: 'Drone · Reparo & Cúpula',
    tacticalAdds: 'Enxames de micro-drones que curam aliados num raio de 2 hexágonos e regeneram a Cidadela.',
    dps: 20,
    rangeHex: '3 Hex',
    fireCadence: '3.0s pulso',
    specialTrait: 'Cura aliados próximos (+25 HP) e regenera o Núcleo da Torre.',
  },
};

export const HexControlDock: React.FC = () => {
  const {
    selectedHex,
    setSelectedHex,
    setSelectedDeployType,
    placedModules,
    combatResources,
    upgradePlacedModule,
    repairPlacedModule,
    batchUpgradeModules,
    batchRepairModules,
    recyclePlacedModule,
    defenseModuleDefs = DEFAULT_MODULE_DEFS,
  } = useGame();

  const [collapsed, setCollapsed] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'assault' | 'heavy' | 'support'>('all');

  const selKey = selectedHex ? `${selectedHex.q},${selectedHex.r}` : null;
  const currentModule = selKey ? placedModules[selKey] : null;

  // Fleet health computation
  const placedList = Object.values(placedModules);
  const totalMaxHp = placedList.reduce((acc, m) => acc + (m.maxHp || 150), 0);
  const totalCurHp = placedList.reduce((acc, m) => acc + (m.currentHp ?? m.maxHp ?? 150), 0);
  const fleetHpPct = totalMaxHp > 0 ? Math.round((totalCurHp / totalMaxHp) * 100) : 100;
  const damagedCount = placedList.filter(
    (m) => (m.currentHp ?? m.maxHp ?? 150) < (m.maxHp || 150)
  ).length;
  const operationalCount = placedList.length - damagedCount;

  // Filter deployed fleet by category
  const filteredPlaced = placedList.filter((m) => {
    if (filterCategory === 'all') return true;
    return MODULE_SPECS[m.type]?.category === filterCategory;
  });

  // Batch actions calculation
  const upgradeableFiltered = filteredPlaced.filter((m) => m.level < 5);
  const totalUpgradeCost = upgradeableFiltered.reduce((sum, m) => {
    const def = defenseModuleDefs[m.type] || DEFAULT_MODULE_DEFS[m.type];
    return sum + Math.round(def.baseCost * 0.75 * m.level);
  }, 0);

  const damagedFiltered = filteredPlaced.filter((m) => (m.currentHp ?? m.maxHp) < m.maxHp);
  const totalRepairCost = damagedFiltered.reduce((sum, m) => {
    const def = defenseModuleDefs[m.type] || DEFAULT_MODULE_DEFS[m.type];
    return sum + Math.max(10, Math.round(def.baseCost * 0.25));
  }, 0);

  const handleBatchUpgrade = () => {
    if (upgradeableFiltered.length === 0 || combatResources < totalUpgradeCost) return;
    batchUpgradeModules(upgradeableFiltered.map((m) => m.hexKey));
  };

  const handleBatchRepair = () => {
    if (damagedFiltered.length === 0 || combatResources < totalRepairCost) return;
    batchRepairModules(damagedFiltered.map((m) => m.hexKey));
  };

  // Minimized Floating Pill
  if (collapsed) {
    return (
      <div className="fixed left-3 bottom-3 z-30 pointer-events-auto select-none">
        <button
          onClick={() => {
            sound.playClick();
            setCollapsed(false);
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/95 border border-slate-800 text-slate-100 hover:border-cyan-500/60 shadow-2xl transition-all cursor-pointer group"
          title="Abrir Hangar e Gestão da Frota"
        >
          <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:text-cyan-300">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-mono text-xs font-bold tracking-wide">Frota</span>
            <span className="text-[10px] font-mono text-slate-400">
              {placedList.length} em órbita ({fleetHpPct}%)
            </span>
          </div>

          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-mono">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>{combatResources}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <aside className="fixed left-3 top-[120px] sm:top-[128px] bottom-3 w-80 sm:w-88 max-h-[calc(100vh-140px)] z-30 pointer-events-auto flex flex-col select-none font-sans">
      <div className="w-full h-full flex flex-col rounded-2xl border border-slate-800/90 bg-slate-950/95 backdrop-blur-md shadow-2xl overflow-hidden">
        {/* 1. Header do Hangar com Retrair */}
        <div className="px-3 py-2.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-xs">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Gestão da Frota
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {placedList.length} naves em combate
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Recursos de Combate sem símbolo de raio para não confundir com matéria */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-700 bg-slate-900 text-slate-200 font-mono text-xs font-semibold">
              <Coins className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{combatResources}</span>
            </div>

            {/* Botão de Retrair */}
            <button
              onClick={() => {
                sound.playClick();
                setCollapsed(true);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px] font-mono"
              title="Retrair painel lateral"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ocultar</span>
            </button>
          </div>
        </div>

        {/* 2. Visualizador Rápido de Saúde da Frota */}
        <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">Integridade da Frota:</span>
            </div>
            <span
              className={`font-bold ${
                fleetHpPct >= 80
                  ? 'text-emerald-400'
                  : fleetHpPct >= 40
                  ? 'text-amber-400'
                  : 'text-rose-400 animate-pulse'
              }`}
            >
              {totalCurHp} / {totalMaxHp} HP ({fleetHpPct}%)
            </span>
          </div>

          {/* Barra de Vida Geral */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                fleetHpPct >= 80
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : fleetHpPct >= 40
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
              }`}
              style={{ width: `${fleetHpPct}%` }}
            />
          </div>

          {/* Status Badges */}
          <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {operationalCount} íntegras
            </span>

            {damagedCount > 0 ? (
              <span className="flex items-center gap-1 text-rose-400 font-semibold animate-pulse">
                <Wrench className="w-3 h-3 text-rose-400" />
                {damagedCount} avariadas
              </span>
            ) : (
              <span className="text-slate-500 font-mono">0 avarias</span>
            )}
          </div>
        </div>

        {/* 3. Filtros & Atalhos Rápidos em Lote */}
        <div className="px-3 py-2 bg-slate-950 border-b border-slate-800/80 shrink-0 flex flex-col gap-1.5">
          {/* Tabs de Filtro */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'assault', label: 'Assalto' },
              { id: 'heavy', label: 'Pesadas' },
              { id: 'support', label: 'Suporte' },
            ].map((tab) => {
              const count = placedList.filter((m) => {
                if (tab.id === 'all') return true;
                return MODULE_SPECS[m.type]?.category === tab.id;
              }).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playClick();
                    setFilterCategory(tab.id as any);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                    filterCategory === tab.id
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Atalhos de Ação Rápida em Lote */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleBatchUpgrade}
              disabled={upgradeableFiltered.length === 0 || combatResources < totalUpgradeCost}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                upgradeableFiltered.length === 0
                  ? 'bg-slate-900/60 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  : combatResources >= totalUpgradeCost
                  ? 'bg-cyan-950/90 border border-cyan-500/70 hover:bg-cyan-900 text-cyan-200 hover:border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
              title={
                upgradeableFiltered.length === 0
                  ? 'Todas as embarcações do filtro já estão no nível máximo'
                  : `Evoluir ${upgradeableFiltered.length} naves por ${totalUpgradeCost} NM`
              }
            >
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-cyan-400" />
                <span>Evoluir Todas ({upgradeableFiltered.length})</span>
              </div>
              <span className="text-[9px] text-amber-300 font-normal">
                {upgradeableFiltered.length > 0 ? `-${totalUpgradeCost} NM` : 'Nenhum elegível'}
              </span>
            </button>

            <button
              onClick={handleBatchRepair}
              disabled={damagedFiltered.length === 0 || combatResources < totalRepairCost}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                damagedFiltered.length === 0
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 opacity-80 cursor-default'
                  : combatResources >= totalRepairCost
                  ? 'bg-emerald-950/90 border border-emerald-500/70 hover:bg-emerald-900 text-emerald-200 hover:border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)] animate-pulse'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
              title={
                damagedFiltered.length === 0
                  ? 'Toda a frota deste filtro está com o casco 100% íntegro'
                  : `Reparar ${damagedFiltered.length} naves por ${totalRepairCost} NM`
              }
            >
              <div className="flex items-center gap-1">
                <Wrench className="w-3 h-3 text-emerald-400" />
                <span>
                  {damagedFiltered.length === 0
                    ? 'Frota 100% Pronta'
                    : `Reparar Todas (${damagedFiltered.length})`}
                </span>
              </div>
              <span className="text-[9px] text-amber-300 font-normal">
                {damagedFiltered.length > 0 ? `-${totalRepairCost} NM` : '0 avarias'}
              </span>
            </button>
          </div>
        </div>

        {/* 4. Painel de Inspeção do Setor Selecionado (se houver) */}
        {selectedHex && (
          <div className="p-2.5 bg-cyan-950/30 border-b border-cyan-800/50 shrink-0">
            <div className="flex items-center justify-between pb-1 border-b border-cyan-900/40">
              <div className="flex items-center gap-1.5 font-mono text-xs text-cyan-200">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Inspeção:</span>
                <strong className="text-white px-1.5 py-0.5 bg-cyan-900/60 rounded text-[11px]">
                  {currentModule ? (defenseModuleDefs[currentModule.type]?.name || 'Nave Ativa') : 'Espaço Aberto'}
                </strong>
              </div>

              <button
                onClick={() => {
                  setSelectedHex(null);
                  setSelectedDeployType(null);
                  sound.playClick();
                }}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                title="Fechar inspeção de setor"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {currentModule ? (
              /* Setor Ocupado com Nave */
              <div className="mt-2 flex flex-col gap-1.5">
                {(() => {
                  const modDef = defenseModuleDefs[currentModule.type] || DEFAULT_MODULE_DEFS[currentModule.type];
                  const upgradeCost = Math.round(modDef.baseCost * 0.75 * currentModule.level);
                  const curHp = currentModule.currentHp ?? currentModule.maxHp;
                  const maxHp = currentModule.maxHp;
                  const hpRatio = Math.max(0, Math.min(1, curHp / maxHp));
                  const isDamaged = curHp < maxHp;
                  const repairCost = Math.max(10, Math.round(modDef.baseCost * 0.25));

                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                          <img
                            src={getModuleSpriteDataUrl(currentModule.type)}
                            alt={modDef.name}
                            className="w-6 h-6 object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white truncate">
                              {modDef.name}
                            </h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              NV. {currentModule.level}
                            </span>
                          </div>

                          {/* Barra de Casco (HP) */}
                          <div className="mt-1">
                            <div className="flex items-center justify-between text-[10px] font-mono leading-none mb-0.5">
                              <span className="text-slate-400">Casco:</span>
                              <span
                                className={`font-bold ${
                                  hpRatio > 0.5
                                    ? 'text-emerald-400'
                                    : hpRatio > 0.25
                                    ? 'text-amber-400'
                                    : 'text-rose-400 animate-pulse'
                                }`}
                              >
                                {curHp} / {maxHp} HP
                              </span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  hpRatio > 0.5
                                    ? 'bg-emerald-500'
                                    : hpRatio > 0.25
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.round(hpRatio * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="text-[10px] font-mono text-slate-300 flex items-center gap-1 mt-1">
                            <span>
                              Dano: <strong className="text-cyan-300">{currentModule.damage}</strong>
                            </span>
                            <span>·</span>
                            <span>
                              Alcance: <strong className="text-slate-200">{currentModule.range}h</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Função Tática */}
                      <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800/80 text-[10px] font-mono text-slate-300 leading-snug">
                        <span className="text-cyan-400 font-semibold">Função: </span>
                        <span>{modDef.tacticalSpecialty}</span>
                      </div>

                      {/* Ações de Reparo, Upgrade e Reciclagem */}
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        {isDamaged && (
                          <button
                            onClick={() => {
                              const ok = repairPlacedModule(selKey!);
                              if (ok) sound.playUpgrade();
                            }}
                            disabled={combatResources < repairCost}
                            className={`col-span-2 py-1 px-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                              combatResources >= repairCost
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <Shield className="w-3 h-3 text-emerald-300" />
                            <span>Reparar Casco ({repairCost} NM)</span>
                          </button>
                        )}

                        {currentModule.level < 5 ? (
                          <button
                            onClick={() => {
                              const ok = upgradePlacedModule(selKey!);
                              if (ok) sound.playUpgrade();
                            }}
                            disabled={combatResources < upgradeCost}
                            className={`py-1 px-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                              combatResources >= upgradeCost
                                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span>Evoluir ({upgradeCost} NM)</span>
                          </button>
                        ) : (
                          <div className="py-1 px-2 rounded-lg text-xs font-mono font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Nível Máx</span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            recyclePlacedModule(selKey!);
                            sound.playClick();
                          }}
                          className="py-1 px-2 rounded-lg text-xs font-mono font-semibold bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Desmontar embarcação e reembolsar recursos"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Reciclar</span>
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              /* Setor Livre */
              <div className="mt-1.5 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Setor livre! Clique na grade espacial para alocar uma nave do Esquadrão.</span>
              </div>
            )}
          </div>
        )}

        {/* 5. Lista de Naves Ativas em Órbita */}
        <div className="px-3 py-1.5 bg-slate-900/80 border-b border-slate-800/90 flex items-center justify-between text-[11px] font-mono text-slate-300 shrink-0">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider text-white">Naves Alocadas na Grade</span>
          </div>
          <span className="text-slate-400">{filteredPlaced.length} ativas</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {filteredPlaced.length === 0 ? (
            <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs">
              <Crosshair className="w-8 h-8 opacity-40 text-slate-600" />
              <span>Nenhuma nave em combate neste filtro.</span>
              <p className="text-[10px] text-slate-600 leading-relaxed max-w-[220px]">
                Clique diretamente em qualquer hexágono vazio na grade para abrir as opções hexagonais e posicionar suas naves.
              </p>
            </div>
          ) : (
            filteredPlaced.map((mod) => {
              const def = defenseModuleDefs[mod.type] || DEFAULT_MODULE_DEFS[mod.type];
              const curHp = mod.currentHp ?? mod.maxHp;
              const maxHp = mod.maxHp;
              const hpPct = Math.round((curHp / maxHp) * 100);
              const isSelected = selectedHex?.q === mod.q && selectedHex?.r === mod.r;

              return (
                <div
                  key={mod.hexKey}
                  onClick={() => {
                    sound.playClick();
                    setSelectedHex({ q: mod.q, r: mod.r });
                  }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/40'
                      : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img
                      src={getModuleSpriteDataUrl(mod.type)}
                      alt={def.name}
                      className="w-7 h-7 object-contain image-rendering-pixelated bg-slate-950 p-0.5 rounded border border-slate-800 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white truncate">
                          {def.name}
                        </span>
                        <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 shrink-0 ml-1">
                          NV.{mod.level}
                        </span>
                      </div>

                      {/* Mini HP bar */}
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px]">
                        <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full ${
                              hpPct > 50 ? 'bg-emerald-500' : hpPct > 25 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                        <span className="text-slate-400">
                          {curHp}/{maxHp}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coordenadas e Seleção */}
                  <div className="text-right shrink-0 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 block">
                      ({mod.q}, {mod.r})
                    </span>
                    <span className="text-[9px] text-slate-500 mt-0.5 block">
                      {mod.damage} DMG
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
