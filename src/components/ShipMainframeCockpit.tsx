/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useGame, DEFAULT_MODULE_DEFS } from '../context/GameContext';
import { BaseSectorId, CircuitNode, CollectorId, ModuleType } from '../types/game';
import { CircuitTreeGrid } from './CircuitTreeGrid';
import {
  Shield,
  Zap,
  Crosshair,
  Cpu,
  Layers,
  Flame,
  Box,
  Compass,
  Activity,
  Wrench,
  Hammer,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
  Wind,
  Factory,
  Volume2,
  VolumeX,
  Trash2,
  Filter,
  FlaskConical,
  Pipette,
  Check,
  RefreshCw,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Lock,
  LayoutGrid,
  List,
  Radio,
  Search,
  Thermometer,
  Gauge,
  Rocket,
  Sparkles,
  CheckCircle2,
  Target,
  X,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { FabricatorView } from './FabricatorView';
import { SeparatorView } from './SeparatorView';
import { CodexModal } from './CodexModal';
import { getMaterialDisplayName, getMaterialCode } from '../utils/materials';
import { MaterialIconBadge } from './MaterialIconBadge';
import { getModuleSpriteDataUrl } from '../game/PixelSprites';
import { HeaderBar } from './HeaderBar';
import { StatusBarFooter } from './StatusBarFooter';

type SubsystemKey =
  | 'command'
  | 'collectors'
  | 'separator'
  | 'fabricator'
  | 'refinery'
  | 'furnace'
  | 'reactor'
  | 'shields'
  | 'circuits'
  | 'weapons'
  | 'expedition';

export type PrimaryModuleKey = 'command' | 'industry' | 'fabricator' | 'circuits' | 'hangar';

export interface PrimaryModule {
  id: PrimaryModuleKey;
  label: string;
  subLabel: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PRIMARY_MODULES: PrimaryModule[] = [
  { id: 'command', label: 'Comando & Base', subLabel: 'Status, Estoque e Salto', badge: 'BASE', icon: Compass },
  { id: 'industry', label: 'Complexo Industrial', subLabel: 'Separador, Forno e Refinaria', badge: 'PROD', icon: Factory },
  { id: 'fabricator', label: 'Construtor & Montagem', subLabel: 'Peças, Máquinas e Drones', badge: 'FAB', icon: Hammer },
  { id: 'circuits', label: 'Pesquisa & Circuitos', subLabel: 'Matriz do Multiverso', badge: 'TECH', icon: Cpu },
  { id: 'hangar', label: 'Hangar & Frotas', subLabel: 'Esquadrões Bélicos e Módulos', badge: 'FROTA', icon: Shield },
];

export const getPrimaryModuleFromTab = (tab: SubsystemKey): PrimaryModuleKey => {
  switch (tab) {
    case 'command':
    case 'reactor':
    case 'shields':
    case 'expedition':
      return 'command';
    case 'collectors':
    case 'separator':
    case 'furnace':
    case 'refinery':
      return 'industry';
    case 'fabricator':
      return 'fabricator';
    case 'circuits':
      return 'circuits';
    case 'weapons':
      return 'hangar';
    default:
      return 'command';
  }
};

interface SubsystemTab {
  key: SubsystemKey;
  label: string;
  category: 'command' | 'production' | 'ship' | 'tactical';
  sectorId?: BaseSectorId;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: SubsystemTab[] = [
  { key: 'command', label: 'Comando', category: 'command', icon: Compass },
  { key: 'collectors', label: 'Coletores', category: 'production', icon: Layers },
  { key: 'separator', label: 'Separador', category: 'production', icon: Filter },
  { key: 'fabricator', label: 'Construtor', category: 'production', icon: Hammer },
  { key: 'refinery', label: 'Refinaria', category: 'production', sectorId: 'refinery', icon: FlaskConical },
  { key: 'furnace', label: 'Forno & Ligas', category: 'production', sectorId: 'refinery', icon: Factory },
  { key: 'reactor', label: 'Reator', category: 'ship', sectorId: 'reactor', icon: Zap },
  { key: 'shields', label: 'Casco & Escudos', category: 'ship', sectorId: 'shields', icon: Shield },
  { key: 'circuits', label: 'Circuitos', category: 'ship', sectorId: 'circuits', icon: Cpu },
  { key: 'weapons', label: 'Arsenal & Frota', category: 'tactical', sectorId: 'research', icon: Crosshair },
  { key: 'expedition', label: 'Expedição', category: 'tactical', sectorId: 'command', icon: Radio },
];


export const ShipMainframeCockpit: React.FC = () => {
  const {
    tower,
    resources,
    baseSectors,
    installBaseSector,
    upgradeBaseSector,
    inventoryItems = [],
    refineInventoryItem,
    recycleAllOres,
    storageCapacity,
    storageUsed,
    gasStorageCapacity,
    gasStorageUsed,
    volumeCapacity,
    volumeUsed,
    isStorageFull,
    canAcceptCargo,
    storageCompartments = [],
    buildStorageCompartment,
    discardInventoryItem,
    repairTowerHull,
    collectors,
    processCollector,
    recipes,
    craftProcessingRecipe,
    defenseModuleDefs = DEFAULT_MODULE_DEFS,
    craftDefenseModule,
    escalatedModules = [],
    toggleEscalatedModule = () => false,
    automationUpgrades,
    installAutomationUpgrade,
    universes,
    circuitNodes,
    activeUniverseId,
    setActiveUniverseId,
    unlockCircuitNode,
    towerAttackCount,
    autonomousModules,
    craftAutonomousModule,
    equipAutonomousModule,
    unequipAutonomousModule,
    isOverclocked,
    overclockIdleMining,
    startExpedition,
    repairCore,
    towerPassives,
    setResources,
    showCodex,
    setShowCodex,
    codexInitialMaterialId,
    openCodexForMaterial,
    resetGame,
  } = useGame();

  const [activeTab, setActiveTab] = useState<SubsystemKey>('command');
  const [showShipDetails, setShowShipDetails] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [cargoFilter, setCargoFilter] = useState<'all' | 'solid' | 'gas'>('all');
  const [collectorFilter, setCollectorFilter] = useState<'all' | 'unlocked' | 'full' | 'locked'>('all');
  const [collectorSort, setCollectorSort] = useState<'default' | 'fill' | 'rate' | 'name'>('default');
  const [expandedCollectorId, setExpandedCollectorId] = useState<string | null>(null);

  // Refinaria & Forno Batch multipliers & Category filters
  const [refineryBatch, setRefineryBatch] = useState<number | 'max'>(1);
  const [furnaceBatch, setFurnaceBatch] = useState<number | 'max'>(1);
  const [furnaceCategory, setFurnaceCategory] = useState<'all' | 'smelting' | 'alloys'>('all');
  const [weaponsCategory, setWeaponsCategory] = useState<'all' | 'assault' | 'heavy' | 'support'>('all');

  // Comando & Estoque states (Minicards vs Lista, Busca, Descarte e Compartimentos)
  const [inventoryViewMode, setInventoryViewMode] = useState<'grid' | 'list'>('grid');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [discardTargetItem, setDiscardTargetItem] = useState<{ id: string; name: string; quantity: number } | null>(null);
  const [discardQty, setDiscardQty] = useState<number>(1);
  const [isStorageCompartmentsExpanded, setIsStorageCompartmentsExpanded] = useState<boolean>(true);

  // Audio control state
  const [muted, setMuted] = useState(sound.isMuted());
  const toggleMute = () => {
    const next = !muted;
    sound.setMuted(next);
    setMuted(next);
    sound.playClick();
  };

  // Collector references
  const gasCol = collectors.find((c) => c.id === 'col_gases');
  const minCol = collectors.find((c) => c.id === 'col_minerals');
  const debCol = collectors.find((c) => c.id === 'col_debris');
  const anyCollectorFull = collectors.some((c) => c.status === 'FULL' || c.currentAmount >= c.capacity);

  // Portal Expedition Cost & Availability
  const hasWarpDiscount = towerPassives?.find((p) => p.id === 'pass_warp_1')?.unlocked;
  const portalCost = hasWarpDiscount ? 25 : 35;
  const canAffordPortal = resources.dimensionalEnergy >= portalCost;

  // Real-time rates
  const ocMult = isOverclocked ? 2.0 : 1.0;
  const energyGainRate = Math.round(1.5 * ocMult);

  // Emergency Core Repair using Real Physical Materials (PD-2001 Ferro Recuperado ou PD-3104 Chapas)
  const ironAvailable = (inventoryItems.find((i) => i.id === 'mat.recovered_iron')?.quantity || 0);
  const sheetAvailable = (inventoryItems.find((i) => i.id === 'mat.iron_sheet')?.quantity || 0);
  const scrapAvailable = (inventoryItems.find((i) => i.id === 'scrap.structural')?.quantity || 0);
  const canRepairHull = tower.coreHp < tower.maxCoreHp && (ironAvailable >= 4 || sheetAvailable >= 2 || scrapAvailable >= 4);

  const handleEmergencyRepair = () => {
    const ok = repairTowerHull();
    if (!ok) {
      sound.playAlert();
    }
  };

  // Circuit Matrix states
  const [selectedNodeId, setSelectedNodeId] = useState<string>('u1_x0_y0');
  const currentUniverseNodes = useMemo(
    () => circuitNodes.filter((n) => n.universeId === activeUniverseId),
    [circuitNodes, activeUniverseId]
  );
  const activeUniverse = useMemo(
    () => universes.find((u) => u.id === activeUniverseId) || universes[0],
    [universes, activeUniverseId]
  );
  const selectedNode =
    circuitNodes.find((n) => n.id === selectedNodeId) ||
    currentUniverseNodes.find((n) => n.gridX === 0 && n.gridY === 0) ||
    currentUniverseNodes[0];

  const canAffordNode = (node: CircuitNode) => {
    return (
      resources.combatData >= (node.costCombatData || 0) &&
      resources.dimensionalMaterials >= (node.costDimMat || 0)
    );
  };

  const isNodeAvailable = (node: CircuitNode) => {
    if (node.unlocked) return false;
    if (node.tier === 0) return true;
    if (node.connectedNodeIds && node.connectedNodeIds.length > 0) {
      return node.connectedNodeIds.some((id) => circuitNodes.find((c) => c.id === id)?.unlocked);
    }
    return (
      node.reqIds.length === 0 ||
      node.reqIds.some((rId) => circuitNodes.find((c) => c.id === rId)?.unlocked)
    );
  };

  const universeAggregateStats = useMemo(() => {
    const unlocked = currentUniverseNodes.filter((n) => n.unlocked);
    const damage = unlocked.filter((n) => n.effect.stat === 'towerDamage').reduce((acc, n) => acc + n.effect.value, 0);
    const fireRate = unlocked.filter((n) => n.effect.stat === 'fireRate').reduce((acc, n) => acc + n.effect.value, 0);
    const crit = unlocked.filter((n) => n.effect.stat === 'critChance').reduce((acc, n) => acc + n.effect.value, 0);
    const shots = unlocked.filter((n) => n.effect.stat === 'towerShots').reduce((acc, n) => acc + n.effect.value, 0);
    const shield = unlocked.filter((n) => n.effect.stat === 'shieldCap').reduce((acc, n) => acc + n.effect.value, 0);
    const storage = unlocked.filter((n) => n.effect.stat === 'storageBonus').reduce((acc, n) => acc + n.effect.value, 0);
    const mining = unlocked.filter((n) => n.effect.stat === 'miningSpeed').reduce((acc, n) => acc + n.effect.value, 0);
    return { damage, fireRate, crit, shots, shield, storage, mining, count: unlocked.length };
  }, [currentUniverseNodes]);

  // Current tab info
  const currentTab = TABS.find((t) => t.key === activeTab) || TABS[0];
  const sector = currentTab.sectorId ? baseSectors[currentTab.sectorId] : null;
  const isInstalled = sector ? sector.installed : true;
  const level = sector ? sector.level : 1;
  const maxLevel = sector ? sector.maxLevel : 5;

  const canAffordInstall =
    sector &&
    !sector.installed &&
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

  const hullPct = Math.round((tower.coreHp / tower.maxCoreHp) * 100);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Header Padronizado da Estação (Codex, Áudio, Expedição) */}
      <HeaderBar />

      {/* =========================================================================
          2. CORPO PRINCIPAL: NAVEGAÇÃO LIMPA E CONTEÚDO ESPAÇOSO
         ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Barra Lateral de Navegação Organizada em 5 Módulos Principais */}
        <nav className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/60 p-2 lg:p-3 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto shrink-0 select-none">
          <div className="hidden lg:block text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2.5 py-1">
            Consoles de Comando
          </div>

          {PRIMARY_MODULES.map((mod) => {
            const isSelected = getPrimaryModuleFromTab(activeTab) === mod.id;
            const Icon = mod.icon;
            const hasNotification = mod.id === 'industry' && anyCollectorFull;

            return (
              <button
                key={mod.id}
                onClick={() => {
                  sound.playClick();
                  if (mod.id === 'command') setActiveTab('command');
                  else if (mod.id === 'industry') setActiveTab('separator');
                  else if (mod.id === 'fabricator') setActiveTab('fabricator');
                  else if (mod.id === 'circuits') setActiveTab('circuits');
                  else if (mod.id === 'hangar') setActiveTab('weapons');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap text-left ${
                  isSelected
                    ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-semibold shadow-sm ring-1 ring-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold">{mod.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal hidden lg:block truncate">{mod.subLabel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {hasNotification && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Reservatório Cheio" />
                  )}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isSelected ? 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {mod.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Área Central de Conteúdo */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto bg-slate-950">
          {/* Sub-Navegação de Comando & Base */}
          {getPrimaryModuleFromTab(activeTab) === 'command' && (
            <div className="flex items-center gap-1.5 mb-4 p-1 rounded-xl bg-slate-900/90 border border-slate-800/80 overflow-x-auto shrink-0 select-none">
              <button
                onClick={() => { setActiveTab('command'); sound.playClick(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'command' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Cidadela & Estoque</span>
              </button>
              <button
                onClick={() => { setActiveTab('reactor'); sound.playClick(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'reactor' || activeTab === 'shields' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Setores da Estação</span>
              </button>
              <button
                onClick={() => { setActiveTab('expedition'); sound.playClick(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'expedition' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Salto Dimensional</span>
              </button>
            </div>
          )}

          {/* Sub-Navegação do Complexo Industrial */}
          {getPrimaryModuleFromTab(activeTab) === 'industry' && (
            <div className="flex items-center gap-1.5 mb-4 p-1 rounded-xl bg-slate-900/90 border border-slate-800/80 overflow-x-auto shrink-0 select-none">
              <button
                onClick={() => { setActiveTab('separator'); sound.playClick(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'separator' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Separador [MK-1003]</span>
              </button>
              <button
                onClick={() => { setActiveTab('furnace'); sound.playClick(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'furnace' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                <span>Forno Térmico [MK-2001]</span>
              </button>
              <button
                onClick={() => { setActiveTab('refinery'); sound.playClick(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'refinery' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Refinaria Química [MK-2203]</span>
              </button>
              <button
                onClick={() => { setActiveTab('collectors'); sound.playClick(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'collectors' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Coletores Espaciais [MK-100x]</span>
                {anyCollectorFull && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-1" />}
              </button>
            </div>
          )}
          {/* Header do Setor Ativo */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                <currentTab.icon className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">{currentTab.label}</h2>
                <span className="text-xs text-slate-400">
                  {sector && !isInstalled ? 'Módulo aguardando construção' : 'Módulo operacional'}
                </span>
              </div>
            </div>

            {/* Painel de Upgrade do Setor (Compacto e Elegante) */}
            {sector && isInstalled && level < maxLevel && (
              <button
                onClick={() => {
                  const ok = upgradeBaseSector(sector.id);
                  if (ok) sound.playUpgrade(0.2);
                }}
                disabled={!canAffordUpgrade}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Evoluir para Nv. {level + 1}</span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  ({nextUpgradeCostMatter} Mat · {nextUpgradeCostTech} Comp)
                </span>
              </button>
            )}
          </div>

          {/* Construção do Setor se ainda não estiver instalado */}
          {sector && !isInstalled ? (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col gap-3 max-w-xl">
              <div>
                <h3 className="text-sm font-semibold text-white">Construir {currentTab.label}</h3>
                <p className="text-xs text-slate-400 mt-1">{sector.description}</p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span>Custo:</span>
                <span className="font-medium text-slate-200">{sector.costMatter} Matéria</span>
                <span>·</span>
                <span className="font-medium text-slate-200">{sector.costTech} Componentes</span>
                {sector.costDimMat > 0 && (
                  <>
                    <span>·</span>
                    <span className="font-medium text-slate-200">{sector.costDimMat} Mat. Dimensional</span>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  const ok = installBaseSector(sector.id);
                  if (ok) sound.playUpgrade(0.2);
                }}
                disabled={!canAffordInstall}
                className="self-start px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Construir Módulo
              </button>
            </div>
          ) : (
            <>
              {/* =================================================================
                  SETOR 1: COLETORES ESPACIAIS (DESIGN LISTA ZERO-GAP COM FILTROS)
                 ================================================================= */}
              {activeTab === 'collectors' && (
                <div className="flex flex-col gap-4 font-sans select-none">
                  {/* Barra de Filtros e Ordenação de Coletores */}
                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-mono text-slate-400 mr-1 hidden sm:inline">Filtrar:</span>
                      {[
                        { id: 'all', label: `Todos (${collectors.length})` },
                        { id: 'unlocked', label: 'Operando' },
                        { id: 'full', label: 'Cheios' },
                        { id: 'locked', label: 'Bloqueados' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            setCollectorFilter(f.id as any);
                            sound.playClick();
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                            collectorFilter === f.id
                              ? 'bg-slate-800 text-sky-300 border border-slate-700 font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>Ordenar:</span>
                        <select
                          value={collectorSort}
                          onChange={(e) => setCollectorSort(e.target.value as any)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-200 focus:outline-hidden"
                        >
                          <option value="default">Padrão</option>
                          <option value="fill">Mais Cheio (Reservatório %)</option>
                          <option value="rate">Taxa de Coleta</option>
                          <option value="name">Nome</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          setExpandedCollectorId(expandedCollectorId ? null : collectors[0]?.id || null);
                          sound.playClick();
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs text-slate-300 hover:text-white cursor-pointer"
                        title="Alternar gavetas de detalhes"
                      >
                        {expandedCollectorId ? 'Recolher Detalhes' : 'Expandir Detalhes'}
                      </button>
                    </div>
                  </div>

                  {/* Lista Zero-Gap de Coletores */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden divide-y divide-slate-800/80 shadow-md">
                    {collectors
                      .filter((col) => {
                        if (collectorFilter === 'unlocked') return col.isUnlocked;
                        if (collectorFilter === 'full') return col.currentAmount >= col.capacity || col.status === 'FULL';
                        if (collectorFilter === 'locked') return !col.isUnlocked;
                        return true;
                      })
                      .sort((a, b) => {
                        if (collectorSort === 'fill') {
                          return b.currentAmount / b.capacity - a.currentAmount / a.capacity;
                        }
                        if (collectorSort === 'rate') {
                          return b.ratePerSecond - a.ratePerSecond;
                        }
                        if (collectorSort === 'name') {
                          return a.name.localeCompare(b.name);
                        }
                        return 0;
                      })
                      .map((col) => {
                        const isFurnaceInstalled = !!baseSectors.refinery?.installed;
                        const isRefineryInstalled = !!baseSectors.refinery?.installed;
                        const percent = Math.min(100, Math.round((col.currentAmount / col.capacity) * 100));
                        const isFull = col.currentAmount >= col.capacity || col.status === 'FULL';
                        const isExpanded = expandedCollectorId === col.id;

                        // Check cargo acceptance
                        const isGas = col.physicalState === 'gas';
                        const check = canAcceptCargo(isGas ? 0 : col.currentAmount, isGas ? col.currentAmount : 0);

                        return (
                          <div
                            key={col.id}
                            className={`p-3.5 transition-colors ${
                              !col.isUnlocked
                                ? 'bg-slate-950/40 opacity-80'
                                : isFull
                                ? 'bg-rose-950/15 hover:bg-rose-950/25'
                                : 'bg-slate-950/70 hover:bg-slate-900/50'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                              {/* Lado Esquerdo: Ícone, Nome, Status e Taxa */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                                  {col.physicalState === 'gas' ? (
                                    <Wind className="w-4 h-4 text-sky-400" />
                                  ) : col.id === 'col_minerals' ? (
                                    <Layers className="w-4 h-4 text-amber-400" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 text-violet-400" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-xs sm:text-sm text-white truncate">{col.name}</h4>
                                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                                      {col.subsystemName}
                                    </span>

                                    {/* Badges de Status */}
                                    {!col.isUnlocked ? (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                        Aguardando Montagem
                                      </span>
                                    ) : isFull ? (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
                                        Reservatório Lotado (100%)
                                      </span>
                                    ) : col.isAutomated ? (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                        Duto Ativo
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                        Coletando
                                      </span>
                                    )}
                                  </div>

                                  {/* Barra de Progresso e Capacidade */}
                                  <div className="flex items-center gap-3 mt-1.5 text-xs font-mono">
                                    <div className="w-32 sm:w-48 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shrink-0">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                          !col.isUnlocked
                                            ? 'bg-slate-700'
                                            : isFull
                                            ? 'bg-rose-500'
                                            : col.physicalState === 'gas'
                                            ? 'bg-sky-500'
                                            : col.id === 'col_minerals'
                                            ? 'bg-amber-500'
                                            : 'bg-violet-500'
                                        }`}
                                        style={{ width: `${percent}%` }}
                                      />
                                    </div>

                                    <span className="text-slate-300 font-semibold tabular-nums text-[11px]">
                                      {Math.round(col.currentAmount)} / {col.capacity} {col.unit} ({percent}%)
                                    </span>

                                    {col.isUnlocked && (
                                      <span className="text-emerald-400 font-bold hidden sm:inline text-[11px]">
                                        +{col.ratePerSecond * (isOverclocked ? 2 : 1)} {col.unit}/s
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Lado Direito: Ações Diretas */}
                              <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                                {!col.isUnlocked ? (
                                  <button
                                    onClick={() => {
                                      setActiveTab('fabricator');
                                      sound.playClick();
                                    }}
                                    className="py-1.5 px-3 rounded-xl text-xs font-mono font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                  >
                                    <Hammer className="w-3.5 h-3.5" />
                                    <span>Construir no Construtor</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        if (col.physicalState === 'gas' && !isRefineryInstalled) {
                                          setActiveTab('fabricator');
                                          sound.playClick();
                                          return;
                                        }
                                        processCollector(col.id);
                                      }}
                                      disabled={col.currentAmount <= 0 || !check.allowed}
                                      className={`py-1.5 px-3 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        !check.allowed
                                          ? 'bg-slate-900 border border-slate-800 text-rose-400 cursor-not-allowed opacity-60'
                                          : isFull
                                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                                          : col.currentAmount > 0
                                          ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                                          : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                      }`}
                                      title={!check.allowed ? check.reason : 'Descarregar buffer no estoque'}
                                    >
                                      <Filter className="w-3.5 h-3.5" />
                                      <span>
                                        {!check.allowed
                                          ? 'Silos Cheios'
                                          : col.physicalState === 'gas'
                                          ? 'Drenar Gases'
                                          : col.id === 'col_minerals'
                                          ? 'Triar Minérios'
                                          : 'Triar Sucata'}
                                      </span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        if (col.physicalState === 'gas') {
                                          setActiveTab('refinery');
                                        } else {
                                          setActiveTab('separator');
                                        }
                                        sound.playClick();
                                      }}
                                      className="py-1.5 px-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                                      title="Abrir painel de processamento dedicado"
                                    >
                                      <span>Painel</span>
                                      <ArrowRight className="w-3 h-3 text-sky-400" />
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => {
                                    setExpandedCollectorId(isExpanded ? null : col.id);
                                    sound.playClick();
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                                  title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Gaveta Expansível de Detalhes do Coletor */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2 text-xs">
                                {!col.isUnlocked ? (
                                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-300 text-[11px] leading-relaxed">
                                    {col.unlockHint || 'Requer montagem prévia na bancada do Construtor para operar no vácuo.'}
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                                      <span>Composição do Reservatório Estimada:</span>
                                      <span>Taxa Base: +{col.ratePerSecond} {col.unit}/s</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {col.bufferItems.map((buf) => (
                                        <div
                                          key={buf.id}
                                          className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between font-mono text-[11px]"
                                        >
                                          <span className="text-slate-300 truncate">{buf.name}</span>
                                          <strong className="text-sky-300">
                                            ~{Math.round(buf.amount * (col.currentAmount / (col.capacity || 1)))} {col.unit}
                                          </strong>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Automação de Dutos */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h3 className="font-semibold text-white text-xs">Dutos de Automação de Coleta</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Dutos direcionam os buffers diretamente para os estoques e processadores sem necessidade de clique manual.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {automationUpgrades
                        .filter((u) => u.type === 'ore_pipeline' || u.type === 'gas_compressor' || u.type === 'scrap_sorter')
                        .map((up) => {
                          const hasMatter = resources.commonMatter >= up.costMatter;
                          const hasTech = resources.techComponents >= up.costTech;
                          const canInstall = !up.installed && hasMatter && hasTech;

                          return (
                            <div
                              key={up.id}
                              className={`p-3 rounded-lg border flex flex-col justify-between text-xs ${
                                up.installed
                                  ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                                  : 'bg-slate-950/80 border-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between font-medium text-white pb-1">
                                  <span>{up.name}</span>
                                  {up.installed && (
                                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      Ativo
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-400 text-[11px] leading-relaxed">{up.description}</p>
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                                {!up.installed ? (
                                  <>
                                    <span className="text-slate-400 font-mono text-[11px]">
                                      {up.costMatter} Mat / {up.costTech} Comp
                                    </span>
                                    <button
                                      onClick={() => installAutomationUpgrade(up.id)}
                                      disabled={!canInstall}
                                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      Instalar
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[11px] text-slate-500">Operação contínua</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================
                  SETOR 2: SEPARADOR & TRIAGEM DE DESTROÇOS
                 ================================================================= */}
              {activeTab === 'separator' && (
                <SeparatorView
                  onOpenCodexForMaterial={(matId) => {
                    openCodexForMaterial(matId);
                  }}
                  onNavigateToFabricator={() => {
                    setActiveTab('fabricator');
                  }}
                />
              )}

              {/* =================================================================
                  SETOR NOVO: O CONSTRUTOR / FABRICADOR MOLECULAR
                 ================================================================= */}
              {activeTab === 'fabricator' && (
                <FabricatorView
                  onOpenCodexForMaterial={(matId) => {
                    openCodexForMaterial(matId);
                  }}
                />
              )}

              {/* =================================================================
                  SETOR 3: REFINARIA CRIOGÊNICA & FRACIONAMENTO GASOSO
                 ================================================================= */}
              {activeTab === 'refinery' && (
                <div className="flex flex-col gap-4 font-sans">
                  {/* Cabeçalho da Máquina Industrial & Telemetria ao Vivo */}
                  <div className="p-4 rounded-xl border border-sky-800/60 bg-gradient-to-br from-slate-950 via-slate-900/90 to-sky-950/30 flex flex-col gap-3.5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-sky-900/40 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-sky-900/60 border border-sky-700/60 text-sky-300 font-mono text-[11px] font-bold">
                            MK-2201
                          </span>
                          <h3 className="font-bold text-white text-sm sm:text-base tracking-wide font-mono">
                            REFINARIA CRIOGÊNICA & CONDENSADOR MOLECULAR
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Condensação fracionada de fluidos estelares a temperaturas ultra-baixas. Purifica misturas voláteis em reagentes químicos e combustíveis líquidos estabilizados.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 font-mono text-[11px]">
                          <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                          <span>VÁCUO CRIOGÊNICO OPERACIONAL</span>
                        </span>
                      </div>
                    </div>

                    {/* 4 Indicadores de Telemetria Industrial ao Vivo */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                            CÂMARA CRIO
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                        </div>
                        <span className="font-mono text-sm sm:text-base font-bold text-sky-300 tracking-tight">
                          -218.4 °C
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Gradiente Criogênico</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                            PRESSÃO VÁCUO
                          </span>
                        </div>
                        <span className="font-mono text-sm sm:text-base font-bold text-cyan-300 tracking-tight">
                          0.04 bar
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Ultra-baixo vácuo</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Wind className="w-3.5 h-3.5 text-teal-400" />
                            SIFÃO DE GASES
                          </span>
                        </div>
                        <span className={`font-mono text-sm sm:text-base font-bold tracking-tight ${gasCol?.isUnlocked ? 'text-teal-300' : 'text-slate-500'}`}>
                          {gasCol?.isUnlocked ? `${gasCol.ratePerSecond} L/s` : 'OFFLINE'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {gasCol?.isUnlocked ? 'Vazão de Captação' : 'Requer Coletor MK-2202'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                            PUREZA FRAC.
                          </span>
                        </div>
                        <span className="font-mono text-sm sm:text-base font-bold text-indigo-300 tracking-tight">
                          99.8%
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Grau Reator Estelar</span>
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Bloqueio se o Coletor de Gases não estiver construído OU Status do Reservatório */}
                  {!gasCol?.isUnlocked ? (
                    <div className="p-4 rounded-xl border border-amber-800/60 bg-amber-950/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-xs font-mono text-amber-300 uppercase tracking-wide">
                            Coletor de Gases Estelares [MK-2202] Não Instalado (Offline)
                          </h4>
                          <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                            A Refinaria Criogênica necessita de uma linha de influxo de gases estelares captados no vácuo orbital. Você ainda não construiu o <strong>Coletor de Gases [MK-2202]</strong>. Sem o coletor operando no vácuo, não há estoque de gás bruto para alimentar as câmaras de fracionamento.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('fabricator');
                          sound.playClick();
                        }}
                        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>Construir Coletor no Construtor</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex items-center justify-between text-xs font-mono mb-1">
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-sky-400" />
                            Reservatório do Coletor de Gases [COL-001]
                          </span>
                          <span className="text-slate-100 font-bold">
                            {Math.round(gasCol?.currentAmount || 0)} / {gasCol?.capacity || 250} L
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-sky-500 transition-all rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((gasCol?.currentAmount || 0) / (gasCol?.capacity || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Gases interestelares captados no vácuo prontos para destilação molecular.
                        </span>
                      </div>

                      <button
                        onClick={() => processCollector('col_gases')}
                        disabled={(gasCol?.currentAmount || 0) <= 0}
                        className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 font-mono shadow-sm"
                      >
                        <Pipette className="w-3.5 h-3.5" />
                        <span>Sifonar Reservatório ({Math.round(gasCol?.currentAmount || 0)} L)</span>
                      </button>
                    </div>
                  )}

                  {/* Barra de Seleção de Lote Industrial */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-slate-800/80 bg-slate-950/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
                        Lote Industrial de Condensação:
                      </span>
                      <span className="text-[11px] text-slate-500">
                        (Multiplica insumos e produtos por clique)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {([1, 5, 10, 'max'] as const).map((batchOption) => (
                        <button
                          key={String(batchOption)}
                          onClick={() => {
                            setRefineryBatch(batchOption);
                            sound.playClick();
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            refineryBatch === batchOption
                              ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {batchOption === 'max' ? 'Máx' : `${batchOption}x`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de Receitas Criogênicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {recipes
                      .filter((r) => r.category === 'cryogenic')
                      .map((recipe) => {
                        const isCollectorRequired = !!recipe.targetCollectorId;
                        const isCollectorUnlocked = isCollectorRequired ? !!gasCol?.isUnlocked : true;

                        // Calcula multiplicador efetivo para o card
                        const maxEnergy = Math.floor(resources.dimensionalEnergy / (recipe.energyCost || 1));
                        let maxCol = Infinity;
                        if (recipe.targetCollectorId) {
                          if (!isCollectorUnlocked) {
                            maxCol = 0;
                          } else {
                            const cost = recipe.inputCollectorCost || 30;
                            maxCol = Math.floor((gasCol?.currentAmount || 0) / cost);
                          }
                        }
                        let maxItems = Infinity;
                        if (recipe.inputItems && recipe.inputItems.length > 0) {
                          recipe.inputItems.forEach((req) => {
                            const inv = inventoryItems.find((i) => i.id === req.itemId);
                            maxItems = Math.min(maxItems, Math.floor((inv?.quantity || 0) / req.quantity));
                          });
                        }
                        const maxAffordable = Math.min(maxEnergy, maxCol, maxItems);
                        const maxCap = Number.isFinite(maxAffordable) && maxAffordable > 0 ? Math.min(maxAffordable, 50) : 1;
                        const effectiveMult = refineryBatch === 'max' ? maxCap : refineryBatch;

                        const totalEnergyCost = recipe.energyCost * effectiveMult;
                        const hasEnergy = resources.dimensionalEnergy >= totalEnergyCost;

                        let hasCollectorCost = true;
                        let requiredCollectorAmount = 0;
                        if (recipe.targetCollectorId) {
                          requiredCollectorAmount = (recipe.inputCollectorCost || 30) * effectiveMult;
                          hasCollectorCost = isCollectorUnlocked && ((gasCol?.currentAmount || 0) >= requiredCollectorAmount);
                        }

                        let hasAllInputs = true;
                        if (recipe.inputItems && recipe.inputItems.length > 0) {
                          hasAllInputs = recipe.inputItems.every((req) => {
                            const inv = inventoryItems.find((i) => i.id === req.itemId);
                            return inv && inv.quantity >= req.quantity * effectiveMult;
                          });
                        }

                        const canCraft = isCollectorUnlocked && hasEnergy && hasCollectorCost && hasAllInputs;

                        return (
                          <div
                            key={recipe.id}
                            className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 shadow-sm ${
                              !isCollectorUnlocked
                                ? 'border-slate-800/80 bg-slate-950/60 opacity-75'
                                : 'border-slate-800 bg-slate-900/50 hover:border-sky-800/60'
                            }`}
                          >
                            <div className="flex flex-col gap-2">
                              {/* Header do Processo */}
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70 font-mono">
                                <span className="font-bold text-white text-xs">{recipe.name}</span>
                                <span className="text-amber-400 text-[11px] font-bold flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  <span>{totalEnergyCost} DE ({effectiveMult}x)</span>
                                </span>
                              </div>

                              <p className="text-xs text-slate-400 leading-relaxed">{recipe.description}</p>

                              {/* Pipeline Visual: Entrada ➔ Máquina ➔ Saída */}
                              <div className="mt-1 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2 font-mono text-[11px]">
                                {/* ENTRADA */}
                                <div className="flex items-start gap-1.5">
                                  <span className="text-slate-500 font-semibold shrink-0 uppercase text-[10px] w-14">
                                    Entrada:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 flex-1">
                                    {recipe.targetCollectorId && (
                                      !isCollectorUnlocked ? (
                                        <span className="px-1.5 py-0.5 rounded border text-[10px] bg-rose-950/60 text-rose-300 border-rose-800 font-bold">
                                          Coletor de Gases MK-2202 Offline / Não Construído
                                        </span>
                                      ) : (
                                        <span
                                          className={`px-1.5 py-0.5 rounded border text-[10px] ${
                                            hasCollectorCost
                                              ? 'bg-slate-900 text-slate-300 border-slate-700'
                                              : 'bg-rose-950/60 text-rose-300 border-rose-800'
                                          }`}
                                        >
                                          Gases Brutos: {requiredCollectorAmount} L (Disponível: {Math.round(gasCol?.currentAmount || 0)} L)
                                        </span>
                                      )
                                    )}

                                    {recipe.inputItems?.map((req) => {
                                      const inv = inventoryItems.find((i) => i.id === req.itemId);
                                      const cur = inv?.quantity || 0;
                                      const needed = req.quantity * effectiveMult;
                                      const ok = cur >= needed;
                                      const code = getMaterialCode(req.itemId);
                                      return (
                                        <span
                                          key={req.itemId}
                                          className={`px-1.5 py-0.5 rounded border text-[10px] ${
                                            ok
                                              ? 'bg-slate-900 text-slate-300 border-slate-700'
                                              : 'bg-rose-950/60 text-rose-300 border-rose-800'
                                          }`}
                                        >
                                          [{code}] {inv?.name || getMaterialDisplayName(req.itemId)}: {cur}/{needed}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* FLUXO VISUAL INDICADOR */}
                                <div className="flex items-center gap-1.5 text-slate-600 text-[10px] pl-14">
                                  <ArrowRight className="w-3 h-3 text-sky-400 shrink-0" />
                                  <span className="text-sky-400/90 font-bold">MK-2201 (-218.4°C)</span>
                                </div>

                                {/* SAÍDA / RENDIMENTO */}
                                <div className="flex items-start gap-1.5">
                                  <span className="text-slate-500 font-semibold shrink-0 uppercase text-[10px] w-14">
                                    Produto:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 flex-1">
                                    {recipe.outputItems.map((out) => {
                                      const outItem = inventoryItems.find((i) => i.id === out.itemId);
                                      const outCode = getMaterialCode(out.itemId);
                                      const totalOut = out.quantity * effectiveMult;
                                      return (
                                        <span
                                          key={out.itemId}
                                          className="px-2 py-0.5 rounded bg-sky-950/90 border border-sky-700/80 text-sky-200 font-bold text-[11px] flex items-center gap-1"
                                        >
                                          <Sparkles className="w-3 h-3 text-sky-400" />
                                          +{totalOut}x [{outCode}] {outItem?.name || getMaterialDisplayName(out.itemId)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Botão de Condensação com Lote */}
                            <button
                              onClick={() => {
                                const ok = craftProcessingRecipe(recipe.id, effectiveMult);
                                if (ok) sound.playLaser(320, 0.12);
                              }}
                              disabled={!canCraft}
                              className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-1.5"
                            >
                              {!isCollectorUnlocked ? (
                                'Requer Coletor de Gases [MK-2202] Construído'
                              ) : !hasEnergy ? (
                                `Energia Insuficiente (${totalEnergyCost} DE)`
                              ) : !hasCollectorCost ? (
                                'Reservatório de Gases Insuficiente'
                              ) : !hasAllInputs ? (
                                'Insumos Físicos Insuficientes'
                              ) : (
                                <>
                                  <FlaskConical className="w-3.5 h-3.5" />
                                  <span>Condensar Lote ({effectiveMult}x) · -{totalEnergyCost} DE</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* =================================================================
                  SETOR 4: FORNO TÉRMICO DE INDUÇÃO & FUNDIÇÃO DE LIGAS
                 ================================================================= */}
              {activeTab === 'furnace' && (
                <div className="flex flex-col gap-4 font-sans">
                  {/* Cabeçalho da Máquina Industrial & Telemetria ao Vivo */}
                  <div className="p-4 rounded-xl border border-amber-800/60 bg-gradient-to-br from-slate-950 via-slate-900/90 to-amber-950/30 flex flex-col gap-3.5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-900/40 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700/60 text-amber-300 font-mono text-[11px] font-bold">
                            MK-2001
                          </span>
                          <h3 className="font-bold text-white text-sm sm:text-base tracking-wide font-mono">
                            FORNO TÉRMICO DE INDUÇÃO & FUNDIÇÃO DE LIGAS
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Forno de alta temperatura e prensa de forja. Funde minérios brutos (Ferro Meteorítico, Quartzo) e escórias em lingotes puros, cristais de silício e chapas de Durasteel.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-700/50 text-amber-400 font-mono text-[11px]">
                          <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                          <span>INDUÇÃO TÉRMICA ESTABILIZADA</span>
                        </span>
                      </div>
                    </div>

                    {/* 4 Indicadores de Telemetria Industrial ao Vivo */}
                    {(() => {
                      const oreTotal =
                        (inventoryItems.find((i) => i.id === 'mat.iron_ore')?.quantity || 0) +
                        (inventoryItems.find((i) => i.id === 'mat.titanium_ore')?.quantity || 0) +
                        (inventoryItems.find((i) => i.id === 'mat.copper_ore')?.quantity || 0);
                      const ingotTotal =
                        (inventoryItems.find((i) => i.id === 'mat.recovered_iron')?.quantity || 0) +
                        (inventoryItems.find((i) => i.id === 'mat.titanium_ingot')?.quantity || 0) +
                        (inventoryItems.find((i) => i.id === 'mat.copper_ingot')?.quantity || 0);

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 font-mono">
                                <Flame className="w-3.5 h-3.5 text-amber-400" />
                                MINÉRIO BRUTO
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            </div>
                            <span className="font-mono text-sm sm:text-base font-bold text-amber-300 tracking-tight">
                              {oreTotal} un
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">No Estoque da Estação</span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 font-mono">
                                <Layers className="w-3.5 h-3.5 text-orange-400" />
                                RESERVATÓRIO BROCA
                              </span>
                            </div>
                            <span className="font-mono text-sm sm:text-base font-bold text-orange-300 tracking-tight">
                              {Math.round(minCol?.currentAmount || 0)} / {minCol?.capacity || 200} kg
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">MK-1004 Minerais</span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 font-mono">
                                <Box className="w-3.5 h-3.5 text-yellow-400" />
                                LINGOTES PRONTOS
                              </span>
                            </div>
                            <span className="font-mono text-sm sm:text-base font-bold text-yellow-300 tracking-tight">
                              {ingotTotal} un
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">Ferro, Titânio & Cobre</span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 font-mono">
                                <Factory className="w-3.5 h-3.5 text-emerald-400" />
                                MULTIPLICADOR
                              </span>
                            </div>
                            <span className="font-mono text-sm sm:text-base font-bold text-emerald-300 tracking-tight">
                              {furnaceBatch === 'max' ? 'Lote MÁX' : `${furnaceBatch}x`}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">Processamento Ativo</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Alerta de Bloqueio se a Broca de Minérios não estiver construída */}
                  {!minCol?.isUnlocked ? (
                    <div className="p-4 rounded-xl border border-amber-800/60 bg-amber-950/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-xs font-mono text-amber-300 uppercase tracking-wide">
                            Broca de Mineração [MK-1004] Não Instalada (Offline)
                          </h4>
                          <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                            O Forno de indução consegue forjar sucatas já estocadas, porém processos de redução de minérios asteroidais em grande escala requerem a <strong>Broca de Mineração [MK-1004]</strong> construída no Construtor.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('fabricator');
                          sound.playClick();
                        }}
                        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>Construir Broca no Construtor</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex items-center justify-between text-xs font-mono mb-1">
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-amber-400" />
                            Reservatório da Broca de Minérios [COL-002]
                          </span>
                          <span className="text-slate-100 font-bold">
                            {Math.round(minCol?.currentAmount || 0)} / {minCol?.capacity || 300} kg
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-amber-500 transition-all rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((minCol?.currentAmount || 0) / (minCol?.capacity || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Minérios brutos perfurados no asteróide aguardando fundição ou triagem.
                        </span>
                      </div>

                      <button
                        onClick={() => processCollector('col_minerals')}
                        disabled={(minCol?.currentAmount || 0) <= 0}
                        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 font-mono shadow-sm"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Fundir reservatório bruto ({Math.round(minCol?.currentAmount || 0)} kg)</span>
                      </button>
                    </div>
                  )}

                  {/* Controles de Filtro e Lote Industrial */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-950/70">
                    {/* Filtros de Categoria */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { id: 'all', label: 'Todos os Processos' },
                        { id: 'smelting', label: 'Fundição Básica (Ferro/Cobre)' },
                        { id: 'alloys', label: 'Ligas & Forja (Durasteel)' },
                      ].map((fc) => (
                        <button
                          key={fc.id}
                          onClick={() => {
                            setFurnaceCategory(fc.id as typeof furnaceCategory);
                            sound.playClick();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                            furnaceCategory === fc.id
                              ? 'bg-amber-600/90 text-white font-bold shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          {fc.label}
                        </button>
                      ))}
                    </div>

                    {/* Multiplicador de Lote */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-xs font-mono text-slate-400 font-semibold uppercase">Lote:</span>
                      <div className="flex items-center gap-1">
                        {([1, 5, 10, 'max'] as const).map((batchOption) => (
                          <button
                            key={String(batchOption)}
                            onClick={() => {
                              setFurnaceBatch(batchOption);
                              sound.playClick();
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              furnaceBatch === batchOption
                                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {batchOption === 'max' ? 'Máx' : `${batchOption}x`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Lista de Receitas Metalúrgicas e Ligas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {recipes
                      .filter((r) => {
                        if (r.category !== 'furnace' && r.category !== 'foundry') return false;
                        if (furnaceCategory === 'smelting') {
                          return r.category === 'furnace' || r.id.includes('iron') || r.id.includes('copper');
                        }
                        if (furnaceCategory === 'alloys') {
                          return r.category === 'foundry' || r.id.includes('steel') || r.id.includes('durasteel') || r.id.includes('graphite');
                        }
                        return true;
                      })
                      .map((recipe) => {
                        const isCollectorRequired = !!recipe.targetCollectorId;
                        const isCollectorUnlocked = isCollectorRequired ? !!minCol?.isUnlocked : true;

                        // Calcula multiplicador efetivo para o card
                        const maxEnergy = Math.floor(resources.dimensionalEnergy / (recipe.energyCost || 1));
                        let maxCol = Infinity;
                        if (recipe.targetCollectorId) {
                          if (!isCollectorUnlocked) {
                            maxCol = 0;
                          } else {
                            const cost = recipe.inputCollectorCost || 30;
                            maxCol = Math.floor((minCol?.currentAmount || 0) / cost);
                          }
                        }
                        let maxItems = Infinity;
                        if (recipe.inputItems && recipe.inputItems.length > 0) {
                          recipe.inputItems.forEach((req) => {
                            const inv = inventoryItems.find((i) => i.id === req.itemId);
                            maxItems = Math.min(maxItems, Math.floor((inv?.quantity || 0) / req.quantity));
                          });
                        }
                        const maxAffordable = Math.min(maxEnergy, maxCol, maxItems);
                        const maxCap = Number.isFinite(maxAffordable) && maxAffordable > 0 ? Math.min(maxAffordable, 50) : 1;
                        const effectiveMult = furnaceBatch === 'max' ? maxCap : furnaceBatch;

                        const totalEnergyCost = recipe.energyCost * effectiveMult;
                        const hasEnergy = resources.dimensionalEnergy >= totalEnergyCost;

                        let hasCollectorCost = true;
                        let requiredCollectorAmount = 0;
                        if (recipe.targetCollectorId) {
                          requiredCollectorAmount = (recipe.inputCollectorCost || 30) * effectiveMult;
                          hasCollectorCost = isCollectorUnlocked && ((minCol?.currentAmount || 0) >= requiredCollectorAmount);
                        }

                        let hasAllInputs = true;
                        if (recipe.inputItems && recipe.inputItems.length > 0) {
                          hasAllInputs = recipe.inputItems.every((req) => {
                            const inv = inventoryItems.find((i) => i.id === req.itemId);
                            return inv && inv.quantity >= req.quantity * effectiveMult;
                          });
                        }

                        const canCraft = isCollectorUnlocked && hasEnergy && hasCollectorCost && hasAllInputs;

                        return (
                          <div
                            key={recipe.id}
                            className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 shadow-sm ${
                              !isCollectorUnlocked
                                ? 'border-slate-800/80 bg-slate-950/60 opacity-75'
                                : 'border-slate-800 bg-slate-900/50 hover:border-amber-800/60'
                            }`}
                          >
                            <div className="flex flex-col gap-2">
                              {/* Header do Processo */}
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70 font-mono">
                                <span className="font-bold text-white text-xs">{recipe.name}</span>
                                <span className="text-amber-400 text-[11px] font-bold flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  <span>{totalEnergyCost} DE ({effectiveMult}x)</span>
                                </span>
                              </div>

                              <p className="text-xs text-slate-400 leading-relaxed">{recipe.description}</p>

                              {/* Pipeline Visual: Insumos ➔ Forno 1820°C ➔ Lingotes/Ligas */}
                              <div className="mt-1 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2 font-mono text-[11px]">
                                {/* ENTRADA */}
                                <div className="flex items-start gap-1.5">
                                  <span className="text-slate-500 font-semibold shrink-0 uppercase text-[10px] w-14">
                                    Entrada:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 flex-1">
                                    {recipe.targetCollectorId && (
                                      !isCollectorUnlocked ? (
                                        <span className="px-1.5 py-0.5 rounded border text-[10px] bg-rose-950/60 text-rose-300 border-rose-800 font-bold">
                                          Broca de Minérios MK-1004 Offline / Não Construída
                                        </span>
                                      ) : (
                                        <span
                                          className={`px-1.5 py-0.5 rounded border text-[10px] ${
                                            hasCollectorCost
                                              ? 'bg-slate-900 text-slate-300 border-slate-700'
                                              : 'bg-rose-950/60 text-rose-300 border-rose-800'
                                          }`}
                                        >
                                          Minério Bruto: {requiredCollectorAmount} kg (Disponível: {Math.round(minCol?.currentAmount || 0)} kg)
                                        </span>
                                      )
                                    )}

                                    {recipe.inputItems?.map((req) => {
                                      const inv = inventoryItems.find((i) => i.id === req.itemId);
                                      const cur = inv?.quantity || 0;
                                      const needed = req.quantity * effectiveMult;
                                      const ok = cur >= needed;
                                      const code = getMaterialCode(req.itemId);
                                      return (
                                        <span
                                          key={req.itemId}
                                          className={`px-1.5 py-0.5 rounded border text-[10px] ${
                                            ok
                                              ? 'bg-slate-900 text-slate-300 border-slate-700'
                                              : 'bg-rose-950/60 text-rose-300 border-rose-800'
                                          }`}
                                        >
                                          [{code}] {inv?.name || getMaterialDisplayName(req.itemId)}: {cur}/{needed}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* FLUXO VISUAL INDICADOR */}
                                <div className="flex items-center gap-1.5 text-slate-600 text-[10px] pl-14">
                                  <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="text-amber-400/90 font-bold">Forno Térmico MK-2001</span>
                                </div>

                                {/* SAÍDA / RENDIMENTO */}
                                <div className="flex items-start gap-1.5">
                                  <span className="text-slate-500 font-semibold shrink-0 uppercase text-[10px] w-14">
                                    Produto:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 flex-1">
                                    {recipe.outputItems.map((out) => {
                                      const outItem = inventoryItems.find((i) => i.id === out.itemId);
                                      const outCode = getMaterialCode(out.itemId);
                                      const totalOut = out.quantity * effectiveMult;
                                      return (
                                        <span
                                          key={out.itemId}
                                          className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-700/80 text-amber-200 font-bold text-[11px] flex items-center gap-1"
                                        >
                                          <Sparkles className="w-3 h-3 text-amber-400" />
                                          +{totalOut}x [{outCode}] {outItem?.name || getMaterialDisplayName(out.itemId)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Botão de Fundição com Lote */}
                            <button
                              onClick={() => {
                                const ok = craftProcessingRecipe(recipe.id, effectiveMult);
                                if (ok) sound.playUpgrade(0.15);
                              }}
                              disabled={!canCraft}
                              className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-1.5"
                            >
                              {!isCollectorUnlocked ? (
                                'Requer Broca de Minérios [MK-1004] Construída'
                              ) : !hasEnergy ? (
                                `Energia Insuficiente (${totalEnergyCost} DE)`
                              ) : !hasCollectorCost ? (
                                'Reservatório de Minérios Insuficiente'
                              ) : !hasAllInputs ? (
                                'Insumos Físicos Insuficientes'
                              ) : (
                                <>
                                  <Flame className="w-3.5 h-3.5" />
                                  <span>Fundir Lote ({effectiveMult}x) · -{totalEnergyCost} DE</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* =================================================================
                  COMANDO CENTRAL: STATUS DA NAVE, ESTOQUE COMPLETO & SILOS
                 ================================================================= */}
              {activeTab === 'command' && (
                <div className="flex flex-col gap-5 font-sans select-none">
                  {/* =============================================================
                      1. STATUS DA NAVE & TELEMETRIA DE SISTEMAS
                     ============================================================= */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          Telemetria & Status Operacional da Nave
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {hullPct > 50 ? 'Fuselagem Íntegra' : 'Alerta de Danos Estruturais'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* 1. Casco & Reparo com Materiais Reais */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-2">
                        <div>
                          <div className="flex items-center justify-between text-slate-300 font-medium">
                            <span className="flex items-center gap-1.5 font-semibold text-white">
                              <Shield className="w-3.5 h-3.5 text-cyan-400" />
                              Casco da Estação
                            </span>
                            <span className={hullPct > 50 ? 'text-emerald-400 font-mono font-bold' : 'text-rose-400 font-mono font-bold'}>
                              {hullPct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-2 border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                hullPct > 50 ? 'bg-emerald-500' : hullPct > 25 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${hullPct}%` }}
                            />
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-1.5">
                            {tower.coreHp} / {tower.maxCoreHp} HP
                          </div>
                        </div>

                        <button
                          onClick={handleEmergencyRepair}
                          disabled={!canRepairHull}
                          className="w-full py-1.5 px-2 rounded-lg text-[11px] font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                          title={
                            tower.coreHp >= tower.maxCoreHp
                              ? 'Casco em 100%'
                              : canRepairHull
                              ? 'Consome 4x [PD-2001] Ferro Recuperado ou 2x [PD-3104] Chapas'
                              : 'Requer 4x [PD-2001] Ferro Recuperado no estoque'
                          }
                        >
                          <Wrench className="w-3 h-3 text-cyan-400" />
                          <span>
                            {tower.coreHp >= tower.maxCoreHp
                              ? 'Casco 100%'
                              : canRepairHull
                              ? 'Reparar (4x [PD-2001])'
                              : 'Faltam Metais'}
                          </span>
                        </button>
                      </div>

                      {/* 2. Escudos & Defesas */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5 font-semibold text-white">
                            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                            Matriz Defensiva
                          </span>
                          <span className="text-sky-400 font-mono font-bold">+{universeAggregateStats.shield} SP</span>
                        </div>
                        <div className="space-y-0.5 text-[11px] text-slate-400">
                          <div>
                            Canhões ativos: <strong className="text-slate-100 font-mono">{towerAttackCount}x disparos</strong>
                          </div>
                          <div>
                            Bônus bélico: <strong className="text-slate-100 font-mono">+{Math.round(universeAggregateStats.damage * 100)}% dano</strong>
                          </div>
                          <div>
                            Taxa de crítico: <strong className="text-slate-100 font-mono">{Math.round(universeAggregateStats.crit * 100)}%</strong>
                          </div>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          Varredura angular 360° nominal
                        </div>
                      </div>

                      {/* 3. Reator de Fusão & Energia */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5 font-semibold text-white">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            Reator Primordial
                          </span>
                          <span className="text-amber-400 font-mono font-bold">
                            {resources.dimensionalEnergy} / {resources.maxDimensionalEnergy} DE
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[11px] text-slate-400">
                          <div>
                            Recarga: <strong className="text-slate-100 font-mono">+{energyGainRate} DE/s</strong>
                          </div>
                          <div>
                            Potência: <strong className="text-slate-100 font-mono">{isOverclocked ? '2.0x (Sobrecarga)' : '1.0x (Nominal)'}</strong>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            overclockIdleMining();
                            sound.playClick();
                          }}
                          disabled={isOverclocked || resources.dimensionalEnergy < 15}
                          className="w-full py-1.5 px-2 rounded-lg text-[11px] font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                        >
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>{isOverclocked ? 'Sobrecarga Ativa' : 'Sobrecarga 2x (15 DE)'}</span>
                        </button>
                      </div>

                      {/* 4. Telemetria de Coleta & Reservatórios */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5 font-semibold text-white">
                            <Layers className="w-3.5 h-3.5 text-violet-400" />
                            Reservatórios
                          </span>
                          {anyCollectorFull ? (
                            <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-500/40">
                              Cheio
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-emerald-400">Coletando</span>
                          )}
                        </div>
                        <div className="space-y-0.5 text-[11px] font-mono text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Sucata:</span>
                            <span>{Math.round(debCol?.currentAmount || 0)}/{debCol?.capacity} kg</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Minério:</span>
                            <span>{Math.round(minCol?.currentAmount || 0)}/{minCol?.capacity} kg</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Gases:</span>
                            <span>{Math.round(gasCol?.currentAmount || 0)}/{gasCol?.capacity} L</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('separator');
                            sound.playClick();
                          }}
                          className="w-full py-1.5 px-2 rounded-lg text-[11px] font-mono font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700"
                        >
                          <span>Triar no Separador</span>
                          <ArrowRight className="w-3 h-3 text-sky-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* =============================================================
                      2. ESTOQUE COMPLETO DA ESTAÇÃO (MINICARDS OU LISTA)
                     ============================================================= */}
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col gap-4">
                    {/* Header do Estoque & Modos de Visualização */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-300">
                          <Box className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                            Estoque da Estação
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            Capacidade Inicial Limitada: {storageUsed}/{storageCapacity} kg · {gasStorageUsed}/{gasStorageCapacity} L · {volumeUsed}/{volumeCapacity} m³
                          </span>
                        </div>
                      </div>

                      {/* Alternador de Visualização: Minicards vs Lista */}
                      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
                        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                          <button
                            onClick={() => {
                              setInventoryViewMode('grid');
                              sound.playClick();
                            }}
                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                              inventoryViewMode === 'grid'
                                ? 'bg-slate-800 text-cyan-300 font-bold shadow-xs'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Exibir como Minicards"
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>Cards</span>
                          </button>
                          <button
                            onClick={() => {
                              setInventoryViewMode('list');
                              sound.playClick();
                            }}
                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                              inventoryViewMode === 'list'
                                ? 'bg-slate-800 text-cyan-300 font-bold shadow-xs'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Exibir como Lista Detalhada"
                          >
                            <List className="w-3.5 h-3.5" />
                            <span>Lista</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Alerta de Carga Esgotada */}
                    {isStorageFull && (
                      <div className="p-3 rounded-xl border border-rose-500/50 bg-rose-950/30 text-rose-300 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>
                            <strong>Capacidade de Estoque Esgotada!</strong> A estação não consegue mais estocar itens de coletores ou expedições. Construa silos adicionais abaixo ou ejete itens excedentes.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 3 Medidores de Unidades de Medida Rápidas (Peso, Litros, Volume) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* 1. PESO */}
                      <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300">1. Peso (Sólidos):</span>
                          <span className="font-mono text-slate-100 font-bold tabular-nums">
                            {storageUsed} / {storageCapacity} kg
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              storageUsed >= storageCapacity ? 'bg-rose-500' : 'bg-violet-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((storageUsed / (storageCapacity || 1)) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {Math.round((storageUsed / (storageCapacity || 1)) * 100)}% da capacidade de massa
                        </span>
                      </div>

                      {/* 2. LITROS */}
                      <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300">2. Litros (Fluidos):</span>
                          <span className="font-mono text-slate-100 font-bold tabular-nums">
                            {gasStorageUsed} / {gasStorageCapacity} L
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              gasStorageUsed >= gasStorageCapacity ? 'bg-rose-500' : 'bg-sky-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((gasStorageUsed / (gasStorageCapacity || 1)) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {Math.round((gasStorageUsed / (gasStorageCapacity || 1)) * 100)}% do volume fluido/gasoso
                        </span>
                      </div>

                      {/* 3. VOLUME */}
                      <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300">3. Volume Espacial (m³):</span>
                          <span className="font-mono text-slate-100 font-bold tabular-nums">
                            {volumeUsed} / {volumeCapacity} m³
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              volumeUsed >= volumeCapacity ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((volumeUsed / (volumeCapacity || 1)) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {Math.round((volumeUsed / (volumeCapacity || 1)) * 100)}% do espaço cúbico útil
                        </span>
                      </div>
                    </div>

                    {/* Controles de Filtro & Busca */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                      <div className="flex items-center gap-1.5 text-xs flex-wrap">
                        {[
                          { id: 'all', label: `Todos (${inventoryItems.filter((i) => i.quantity > 0).length})` },
                          { id: 'solid', label: 'Sólidos (kg)' },
                          { id: 'gas', label: 'Fluidos (L)' },
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => {
                              setCargoFilter(f.id as typeof cargoFilter);
                              sound.playClick();
                            }}
                            className={`px-3 py-1.5 rounded-xl font-medium font-mono text-xs transition-colors cursor-pointer ${
                              cargoFilter === f.id
                                ? 'bg-slate-800 text-sky-300 border border-slate-700 font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      {/* Campo de Busca Rápida */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={inventorySearch}
                          onChange={(e) => setInventorySearch(e.target.value)}
                          placeholder="Buscar código PD ou nome..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    {/* =========================================================
                        ITENS: MODO MINICARDS OU MODO LISTA
                       ========================================================= */}
                    {(() => {
                      const filteredItems = inventoryItems.filter((item) => {
                        if (item.quantity <= 0) return false;
                        if (cargoFilter === 'solid' && !(item.physicalState === 'solid' || item.unit === 'kg' || item.unit === 'un')) return false;
                        if (cargoFilter === 'gas' && !(item.physicalState === 'gas' || (item.physicalState as string) === 'liquid' || item.unit === 'L')) return false;
                        if (inventorySearch.trim()) {
                          const query = inventorySearch.toLowerCase();
                          const code = (item.code || getMaterialCode(item.id)).toLowerCase();
                          const name = item.name.toLowerCase();
                          return code.includes(query) || name.includes(query);
                        }
                        return true;
                      });

                      if (filteredItems.length === 0) {
                        return (
                          <div className="p-8 text-center text-xs text-slate-500 font-mono border border-slate-800/80 rounded-2xl bg-slate-950/40">
                            Nenhum item encontrado no estoque com os filtros selecionados.
                          </div>
                        );
                      }

                      // Visualização em MINICARDS
                      if (inventoryViewMode === 'grid') {
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filteredItems.map((item) => {
                              const code = item.code || getMaterialCode(item.id);
                              const totalWeight = Math.round(item.quantity * (item.unitWeight || 1.0) * 10) / 10;
                              const isFluid = item.physicalState === 'gas' || item.unit === 'L';
                              const totalVol = Math.round((isFluid ? item.quantity * 0.04 : totalWeight * 0.05) * 10) / 10;

                              return (
                                <div
                                  key={item.id}
                                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between gap-2.5 shadow-sm"
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-sky-300">
                                        [{code}]
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                        {item.physicalState.toUpperCase()}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2.5 mt-2">
                                      <MaterialIconBadge iconName={item.icon} color={item.color} size="md" />
                                      <div className="min-w-0">
                                        <h4 className="font-bold text-white text-xs truncate leading-tight">
                                          {item.name}
                                        </h4>
                                        <div className="text-emerald-400 font-mono font-bold text-xs mt-0.5">
                                          {item.quantity} {item.unit}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Métricas Rápidas: Peso, Volume e Fluido */}
                                    <div className="grid grid-cols-2 gap-1.5 pt-2 mt-2 border-t border-slate-800/60 font-mono text-[10px] text-slate-400">
                                      <div>
                                        Peso: <strong className="text-slate-200">{totalWeight} kg</strong>
                                      </div>
                                      <div>
                                        Volume: <strong className="text-slate-200">~{totalVol} m³</strong>
                                      </div>
                                      {isFluid && (
                                        <div className="col-span-2 text-sky-400">
                                          Líquidos: <strong className="text-sky-300">{item.quantity} L</strong>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Ações: Codex e Jogar Fora */}
                                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                                    <button
                                      onClick={() => openCodexForMaterial(item.id)}
                                      className="px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 text-[11px] font-mono cursor-pointer flex items-center gap-1"
                                      title="Ver receita e dados no Codex"
                                    >
                                      <BookOpen className="w-3 h-3 text-cyan-400" />
                                      <span>Codex</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setDiscardTargetItem({ id: item.id, name: item.name, quantity: item.quantity });
                                        setDiscardQty(1);
                                      }}
                                      className="px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-rose-950/60 hover:border-rose-900/60 text-slate-400 hover:text-rose-300 text-[11px] font-mono cursor-pointer flex items-center gap-1 transition-colors"
                                      title="Jogar item fora no vácuo espacial para liberar espaço"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-400" />
                                      <span>Ejetar</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      // Visualização em LISTA DETALHADA
                      return (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden divide-y divide-slate-800/70 shadow-sm">
                          {filteredItems.map((item) => {
                            const code = item.code || getMaterialCode(item.id);
                            const totalWeight = Math.round(item.quantity * (item.unitWeight || 1.0) * 10) / 10;
                            const isFluid = item.physicalState === 'gas' || item.unit === 'L';
                            const totalVol = Math.round((isFluid ? item.quantity * 0.04 : totalWeight * 0.05) * 10) / 10;

                            return (
                              <div
                                key={item.id}
                                className="p-3 hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <MaterialIconBadge iconName={item.icon} color={item.color} size="md" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-sky-300">
                                        [{code}]
                                      </span>
                                      <h4 className="font-bold text-white text-xs sm:text-sm truncate">{item.name}</h4>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                        {item.physicalState.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                                      <span>Estoque: <strong className="text-emerald-400 font-bold">{item.quantity} {item.unit}</strong></span>
                                      <span>·</span>
                                      <span>Peso: <strong className="text-slate-200">{totalWeight} kg</strong></span>
                                      <span>·</span>
                                      <span>Volume: <strong className="text-slate-200">~{totalVol} m³</strong></span>
                                      {isFluid && (
                                        <>
                                          <span>·</span>
                                          <span className="text-sky-300">Líquido: {item.quantity} L</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                  <button
                                    onClick={() => openCodexForMaterial(item.id)}
                                    className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-mono cursor-pointer flex items-center gap-1"
                                    title="Consultar no Codex"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Codex</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setDiscardTargetItem({ id: item.id, name: item.name, quantity: item.quantity });
                                      setDiscardQty(1);
                                    }}
                                    className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-rose-950/60 hover:border-rose-900/60 text-slate-300 hover:text-rose-300 text-xs font-mono cursor-pointer flex items-center gap-1 transition-colors"
                                    title="Ejetar ao vácuo para liberar espaço"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Jogar Fora</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* =============================================================
                      3. CONSTRUIR + : COMPARTIMENTOS & SILOS DE ESTOQUE
                     ============================================================= */}
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                              Construir + · Silos & Compartimentos de Carga
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                              EXPANSÃO
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Silos construídos ampliam permanentemente o armazenamento da torre e aparecem aqui no Comando.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsStorageCompartmentsExpanded((prev) => !prev);
                          sound.playClick();
                        }}
                        className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title={isStorageCompartmentsExpanded ? 'Recolher seção' : 'Expandir seção'}
                      >
                        {isStorageCompartmentsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isStorageCompartmentsExpanded && (
                      <div className="flex flex-col gap-4 pt-1">
                        {/* Lista dos Compartimentos Ativos Construídos */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                            Compartimentos Ativos no Comando ({storageCompartments.filter((c) => c.built).length}):
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {storageCompartments
                              .filter((c) => c.built)
                              .map((comp) => (
                                <div
                                  key={comp.id}
                                  className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col justify-between gap-1.5 text-xs shadow-xs"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                                        [{comp.code}]
                                      </span>
                                      <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Ativo
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-white text-xs mt-1.5">{comp.name}</h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{comp.description}</p>
                                  </div>

                                  <div className="text-[10px] font-mono text-cyan-300 pt-1.5 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                                    {comp.weightBonus > 0 && <span>+{comp.weightBonus}kg</span>}
                                    {comp.liquidBonus > 0 && <span>+{comp.liquidBonus}L</span>}
                                    {comp.volumeBonus > 0 && <span>+{comp.volumeBonus}m³</span>}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Compartimentos Disponíveis para Construir com Materiais Reais */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                          <span className="text-[11px] font-mono font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" />
                            Disponíveis para Construir:
                          </span>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {storageCompartments
                              .filter((c) => !c.built)
                              .map((comp) => {
                                const canBuild = comp.costItems.every((req) => {
                                  const inv = inventoryItems.find((i) => i.id === req.itemId);
                                  return inv && inv.quantity >= req.quantity;
                                });

                                return (
                                  <div
                                    key={comp.id}
                                    className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-3 text-xs shadow-sm"
                                  >
                                    <div>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700 text-amber-300">
                                          [{comp.code}]
                                        </span>
                                        <div className="text-[10px] font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                                          {comp.weightBonus > 0 && <span>+{comp.weightBonus}kg</span>}
                                          {comp.liquidBonus > 0 && <span>+{comp.liquidBonus}L</span>}
                                          {comp.volumeBonus > 0 && <span>+{comp.volumeBonus}m³</span>}
                                        </div>
                                      </div>

                                      <h4 className="font-bold text-white text-xs sm:text-sm mt-1">{comp.name}</h4>
                                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{comp.description}</p>

                                      {/* Custo em Materiais Reais */}
                                      <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                                        <span className="text-[10px] font-mono text-slate-400 block mb-1">
                                          Materiais Necessários:
                                        </span>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {comp.costItems.map((req) => {
                                            const inv = inventoryItems.find((i) => i.id === req.itemId);
                                            const cur = inv?.quantity || 0;
                                            const ok = cur >= req.quantity;
                                            const code = getMaterialCode(req.itemId);
                                            return (
                                              <span
                                                key={req.itemId}
                                                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                                  ok
                                                    ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                                                    : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                                                }`}
                                              >
                                                [{code}] {inv?.name || getMaterialDisplayName(req.itemId)} ({cur}/{req.quantity})
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => buildStorageCompartment(comp.id)}
                                      disabled={!canBuild}
                                      className={`w-full py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                                        canBuild
                                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer active:scale-98'
                                          : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                                      }`}
                                    >
                                      <Hammer className="w-3.5 h-3.5" />
                                      <span>{canBuild ? 'Construir Silo' : 'Faltam Materiais Reais'}</span>
                                    </button>
                                  </div>
                                );
                              })}

                            {storageCompartments.filter((c) => !c.built).length === 0 && (
                              <div className="col-span-2 p-6 text-center text-xs font-mono text-emerald-400 border border-emerald-500/30 rounded-xl bg-emerald-950/20">
                                Todos os silos e compartimentos de armazenamento foram construídos com sucesso!
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =================================================================
                  SETOR 6: REATOR DE FUSÃO
                 ================================================================= */}
              {activeTab === 'reactor' && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col gap-4 max-w-xl">
                  <div>
                    <h3 className="font-semibold text-white text-sm">Reator de Fusão Estelar</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Gera a energia primordial necessária para ativar escudos, propulsores de salto e manter as linhas de refino em operação.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block">Energia Atual</span>
                      <strong className="text-amber-400 font-mono text-sm">{resources.dimensionalEnergy} DE</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Taxa de Recarga</span>
                      <strong className="text-slate-200 font-mono text-sm">+{energyGainRate} DE/s</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Status de Sobrecarga</span>
                      <strong className="text-slate-200 text-sm">{isOverclocked ? 'Ativa (2x)' : 'Nominal'}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                    <button
                      onClick={() => {
                        overclockIdleMining();
                        sound.playClick();
                      }}
                      disabled={isOverclocked || resources.dimensionalEnergy < 15}
                      className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-mono"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isOverclocked ? 'Sobrecarga Ativa' : 'Ativar Sobrecarga (15 DE)'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* =================================================================
                  SETOR 7: CASCO & ESCUDOS
                 ================================================================= */}
              {activeTab === 'shields' && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col gap-4 max-w-xl">
                  <div>
                    <h3 className="font-semibold text-white text-sm">Integridade do Casco & Barreira de Escudos</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Gerencia a blindagem cinética e os reparos estruturais da estação contra invasões de hordas inimigas.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Integridade Estrutural</span>
                      <span className="font-mono text-slate-200 font-medium">
                        {tower.coreHp} / {tower.maxCoreHp} HP ({hullPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          hullPct > 50 ? 'bg-emerald-500' : hullPct > 25 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${hullPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                    <button
                      onClick={handleEmergencyRepair}
                      disabled={!canRepairHull || tower.coreHp >= tower.maxCoreHp}
                      className="self-start px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{tower.coreHp >= tower.maxCoreHp ? 'Casco 100% Operacional' : 'Reparar Blindagem (-4x [PD-2001] ou -2x [PD-3104])'}</span>
                    </button>
                    {tower.coreHp < tower.maxCoreHp && !canRepairHull && (
                      <span className="text-[11px] text-amber-400 font-mono">
                        Requer 4x [PD-2001] Ferro Recuperado ou 2x [PD-3104] Chapa de Ferro no estoque.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* =================================================================
                  SETOR 8: MATRIZ DE CIRCUITOS
                 ================================================================= */}
              {activeTab === 'circuits' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium mr-1">Frequência:</span>
                      {universes.map((uni) => (
                        <button
                          key={uni.id}
                          onClick={() => {
                            if (uni.unlocked) {
                              setActiveUniverseId(uni.id);
                              sound.playClick();
                            }
                          }}
                          disabled={!uni.unlocked}
                          className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                            activeUniverseId === uni.id
                              ? 'bg-slate-800 text-white font-semibold'
                              : uni.unlocked
                              ? 'text-slate-400 hover:text-slate-200'
                              : 'text-slate-600 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {uni.name.split(':')[0]}
                        </button>
                      ))}
                    </div>

                    <span className="text-slate-400 font-mono">
                      {universeAggregateStats.count} / {currentUniverseNodes.length} nós sintonizados
                    </span>
                  </div>

                  <div className="h-[440px] w-full rounded-xl border border-slate-800 overflow-hidden relative bg-slate-950">
                    <CircuitTreeGrid
                      nodes={currentUniverseNodes}
                      activeUniverse={activeUniverse}
                      selectedNodeId={selectedNode?.id || null}
                      onSelectNode={(id) => setSelectedNodeId(id)}
                      onUnlockNode={unlockCircuitNode}
                      canAffordNode={canAffordNode}
                      isNodeAvailable={isNodeAvailable}
                    />
                  </div>

                  {selectedNode && (
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-white block">
                          Nível {selectedNode.tier}: {selectedNode.name}
                        </span>
                        <p className="text-slate-400 mt-0.5">{selectedNode.description}</p>
                      </div>

                      {selectedNode.unlocked ? (
                        <span className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                          Sintonizado
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const ok = unlockCircuitNode(selectedNode.id);
                            if (ok) sound.playUpgrade(0.2);
                          }}
                          disabled={!isNodeAvailable(selectedNode) || !canAffordNode(selectedNode)}
                          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                          {!isNodeAvailable(selectedNode)
                            ? 'Indisponível'
                            : !canAffordNode(selectedNode)
                            ? 'Dados Insuficientes'
                            : `Sintonizar (${selectedNode.costCombatData ? `${selectedNode.costCombatData} Dados` : 'Calibrar'})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* =================================================================
                  SETOR 9: DEFESAS & ARSENAL
                 ================================================================= */}
              {activeTab === 'weapons' && (
                <div className="flex flex-col gap-5 max-w-4xl font-sans">
                  {/* Baterias Principais */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-sm font-mono flex items-center gap-2">
                        <Crosshair className="w-4 h-4 text-sky-400" />
                        CONTROLE DE TIRO & ARTILHARIA CENTRAL
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 text-[11px] font-mono">
                        SISTEMA DE MIRA BALÍSTICA ATIVO
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-slate-300 mt-1">
                      <div>
                        <span className="text-slate-500 block text-[11px] font-mono">Canhões Ativos da Torre</span>
                        <strong className="text-slate-100 font-mono text-sm">{towerAttackCount}x disparos primários</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] font-mono">Multiplicador de Dano</span>
                        <strong className="text-emerald-400 font-mono text-sm">+{Math.round(universeAggregateStats.damage * 100)}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* =============================================================
                      ARSENAL BÉLICO DA MALHA HEXAGONAL (MODO ASSALTO)
                     ============================================================= */}
                  <div className="flex flex-col gap-3">
                    <div className="p-4 rounded-xl border border-sky-800/60 bg-gradient-to-br from-slate-950 via-slate-900/80 to-sky-950/30 flex flex-col gap-2.5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-sky-900/40 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-sky-900/60 border border-sky-700/60 text-sky-300 font-mono text-[11px] font-bold">
                              ARSENAL BÉLICO
                            </span>
                            <h3 className="font-bold text-white text-sm font-mono">
                              MONTAGEM DE MÓDULOS DE COMBATE (MODO ASSALTO)
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                            Fabrique módulos defensivos acopláveis aos hexágonos durante o modo alto (assalto). Cada módulo utiliza projéteis, lasers contínuos, raios em cadeia ou drones de suporte.
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                          <span className="text-slate-500">Prontos:</span>
                          <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-bold">
                            {Object.values(defenseModuleDefs).filter((m) => m.unlocked).length} / 8 Módulos
                          </span>
                        </div>
                      </div>

                      {/* Gestão do Esquadrão Tático (6 Vértices Hexagonais) */}
                      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-mono">
                            <Target className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Esquadrão Tático de Expedição (Máximo 6 Naves)
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                            {escalatedModules.length} / 6 Vértices Preenchidos
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                          As 6 naves selecionadas aqui aparecem nas 6 pontas do menu hexagonal ao clicar em setores durante o combate no Modo Alto. Escolha sua formação tática ideal.
                        </p>

                        {/* 6 Slots do Esquadrão */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                          {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                            const modType = escalatedModules[slotIdx];
                            const modDef = modType ? defenseModuleDefs[modType] : null;

                            if (modDef) {
                              return (
                                <div
                                  key={slotIdx}
                                  className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 flex flex-col items-center text-center relative group shadow-sm"
                                >
                                  <span className="absolute top-1 left-1.5 text-[9px] font-mono text-slate-500">
                                    #{slotIdx + 1}
                                  </span>
                                  <button
                                    onClick={() => toggleEscalatedModule(modType)}
                                    className="absolute top-1 right-1 p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950 transition-colors cursor-pointer"
                                    title="Remover do Esquadrão"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>

                                  <img
                                    src={getModuleSpriteDataUrl(modType)}
                                    alt={modDef.name}
                                    className="w-8 h-8 object-contain image-rendering-pixelated my-1"
                                  />
                                  <span className="text-[10px] font-mono font-bold text-white truncate w-full">
                                    {modDef.name}
                                  </span>
                                  <span className="text-[9px] font-mono text-amber-300 mt-0.5">
                                    {modDef.baseCost} NM
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={slotIdx}
                                className="p-2 rounded-xl bg-slate-950 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center min-h-[85px] text-slate-600"
                              >
                                <span className="text-[9px] font-mono text-slate-600">Vértice #{slotIdx + 1}</span>
                                <span className="text-[10px] font-mono mt-1 text-slate-500">Slot Livre</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Filtro de Módulos */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {[
                          { id: 'all', label: 'Todos os Módulos (8)' },
                          { id: 'assault', label: 'Assalto (Cinético & Térmico)' },
                          { id: 'heavy', label: 'Pesado & Área (Mísseis / Railgun)' },
                          { id: 'support', label: 'Suporte (Tesla / Nanodrones / Dreno)' },
                        ].map((wf) => (
                          <button
                            key={wf.id}
                            onClick={() => {
                              setWeaponsCategory(wf.id as typeof weaponsCategory);
                              sound.playClick();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                              weaponsCategory === wf.id
                                ? 'bg-sky-600 text-white font-bold shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            {wf.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grid dos 8 Módulos de Combate */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {Object.values(defenseModuleDefs)
                        .filter((mod) => {
                          if (weaponsCategory === 'assault') {
                            return mod.type === 'pulse_cannon' || mod.type === 'beam_cruiser';
                          }
                          if (weaponsCategory === 'heavy') {
                            return mod.type === 'plasma_battery' || mod.type === 'missile_launcher' || mod.type === 'railgun_bastion';
                          }
                          if (weaponsCategory === 'support') {
                            return mod.type === 'flux_harvester' || mod.type === 'tesla_coil' || mod.type === 'nanobot_drone';
                          }
                          return true;
                        })
                        .map((mod) => {
                          const costItems = mod.craftCostItems || [];
                          const hasAllMaterials = costItems.length === 0 || costItems.every((req) => {
                            const inv = inventoryItems.find((i) => i.id === req.itemId);
                            return inv && inv.quantity >= req.quantity;
                          });

                          return (
                            <div
                              key={mod.type}
                              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3.5 shadow-sm ${
                                mod.unlocked
                                  ? 'border-emerald-800/40 bg-slate-900/60'
                                  : hasAllMaterials
                                  ? 'border-sky-800/50 bg-slate-900/40 hover:border-sky-700'
                                  : 'border-slate-800/80 bg-slate-950/60'
                              }`}
                            >
                              <div className="flex flex-col gap-2.5">
                                {/* Topo: Sprite + Título + Status */}
                                <div className="flex items-start gap-3">
                                  <img
                                    src={getModuleSpriteDataUrl(mod.type)}
                                    alt={mod.name}
                                    className="w-11 h-11 object-contain image-rendering-pixelated bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 shadow-inner"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 font-mono">
                                      <span className="text-xs font-bold text-white truncate">
                                        [{mod.code || 'MK-3000'}] {mod.name}
                                      </span>
                                      {mod.unlocked ? (
                                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold shrink-0">
                                          DESBLOQUEADO
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold shrink-0">
                                          REQUER MONTAGEM
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-mono text-sky-400 block mt-0.5">
                                      {mod.role}
                                    </span>
                                  </div>
                                </div>

                                {/* Descrição & Especialidade Tática */}
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  {mod.description}
                                </p>
                                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-start gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                                  <span>{mod.tacticalSpecialty}</span>
                                </div>

                                {/* Estatísticas de Combate */}
                                <div className="grid grid-cols-4 gap-1.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800/60 text-center font-mono">
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">DANO</span>
                                    <span className="text-xs font-bold text-slate-200">{mod.baseDamage}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">CADÊNCIA</span>
                                    <span className="text-xs font-bold text-slate-200">{mod.baseFireRate}/s</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">ALCANCE</span>
                                    <span className="text-xs font-bold text-slate-200">{mod.baseRange}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">DEPLOY</span>
                                    <span className="text-xs font-bold text-amber-300">{mod.baseCost} DE</span>
                                  </div>
                                </div>

                                {/* Insumos Físicos de Fabricação */}
                                {!mod.unlocked && costItems.length > 0 && (
                                  <div className="flex flex-col gap-1.5 pt-1">
                                    <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
                                      Materiais Físicos para Fabricar:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {costItems.map((req) => {
                                        const inv = inventoryItems.find((i) => i.id === req.itemId);
                                        const cur = inv?.quantity || 0;
                                        const ok = cur >= req.quantity;
                                        const code = getMaterialCode(req.itemId);
                                        return (
                                          <span
                                            key={req.itemId}
                                            className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                                              ok
                                                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                                                : 'bg-rose-950/50 border-rose-800 text-rose-300'
                                            }`}
                                          >
                                            [{code}] {inv?.name || getMaterialDisplayName(req.itemId)} ({cur}/{req.quantity})
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Ação: Fabricar ou Equipar no Esquadrão */}
                              <div>
                                {mod.unlocked ? (
                                  escalatedModules.includes(mod.type) ? (
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 py-2 px-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-mono text-xs flex items-center justify-center gap-1.5 font-bold shadow-sm">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>NO ESQUADRÃO TÁTICO</span>
                                      </div>
                                      <button
                                        onClick={() => toggleEscalatedModule(mod.type)}
                                        className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
                                        title="Remover do Esquadrão"
                                      >
                                        Remover
                                      </button>
                                    </div>
                                  ) : escalatedModules.length < 6 ? (
                                    <button
                                      onClick={() => toggleEscalatedModule(mod.type)}
                                      className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Equipar no Esquadrão ({escalatedModules.length}/6)</span>
                                    </button>
                                  ) : (
                                    <div className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 font-mono text-xs text-center font-semibold">
                                      Esquadrão Cheio (6/6) · Remova um para equipar
                                    </div>
                                  )
                                ) : (
                                  <button
                                    onClick={() => {
                                      const ok = craftDefenseModule(mod.type);
                                      if (ok) sound.playDeploy(0.15);
                                    }}
                                    disabled={!hasAllMaterials}
                                    className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-1.5"
                                  >
                                    {!hasAllMaterials ? (
                                      'Insumos Físicos Insuficientes'
                                    ) : (
                                      <>
                                        <Hammer className="w-3.5 h-3.5" />
                                        <span>Fabricar Módulo Bélico [{mod.code || 'MK-3000'}]</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Módulos Autônomos da Fuselagem */}
                  <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white font-mono flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-violet-400" />
                        MÓDULOS DE DISPARO AUTÔNOMO (FUSELAGEM DA TORRE)
                      </span>
                      <span className="text-slate-400 font-mono">
                        {autonomousModules.filter((m) => m.equipped).length} / 3 equipados
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {autonomousModules.map((mod) => (
                        <div
                          key={mod.id}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white block">{mod.name}</span>
                            <span className="text-slate-400">{mod.role} · Intervalo: {mod.interval}s</span>
                          </div>

                          {mod.unlocked ? (
                            mod.equipped ? (
                              <button
                                onClick={() => {
                                  unequipAutonomousModule(mod.id);
                                  sound.playClick();
                                }}
                                className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer"
                              >
                                Desequipar
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  equipAutonomousModule(mod.id, 0);
                                  sound.playClick();
                                }}
                                className="px-3 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium cursor-pointer"
                              >
                                Equipar
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => {
                                craftAutonomousModule(mod.id);
                                sound.playUpgrade(0.2);
                              }}
                              disabled={resources.combatData < (mod.costCombatData || 0)}
                              className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer disabled:opacity-40"
                            >
                              Forjar ({mod.costCombatData || 0} Dados)
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================
                  SETOR 10: SALTO DIMENSIONAL & EXPEDIÇÃO
                 ================================================================= */}
              {activeTab === 'expedition' && (
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col gap-4 max-w-xl">
                  <div>
                    <h3 className="font-semibold text-white text-sm">Propulsor de Dobra & Salto Dimensional</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Projeta a estação orbital em uma fenda dimensional para recolher espólios exóticos (Lingotes, Ouro, Grafite, Oxigênio e Hidrogênio) e enfrentar frotas inimigas.
                    </p>
                  </div>

                  {baseSectors.inventory?.installed ? (
                    <>
                      <div className="text-xs text-slate-300 font-mono">
                        Custo de Ignição: <strong className="text-amber-400">{portalCost} DE de Energia</strong>
                      </div>

                      <button
                        onClick={() => {
                          if (canAffordPortal) {
                            sound.playCheckpoint();
                            startExpedition();
                          } else {
                            sound.playAlert();
                          }
                        }}
                        disabled={!canAffordPortal}
                        className="self-start px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Compass className="w-4 h-4" />
                        <span>Iniciar Salto Dimensional</span>
                      </button>
                    </>
                  ) : (
                    <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/50 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                        <Lock className="w-4 h-4 shrink-0" />
                        Requisito Primordial: Silos de Estoque Não Instalados
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        A torre dimensional precisa de capacidade de armazenamento hermético instalada para reter os espólios trazidos do vácuo hostil.
                        Use o <strong className="text-sky-400">Coletor de Minério</strong> para extrair Ferro Meteorítico e monte o compartimento no Construtor.
                      </p>
                      <button
                        onClick={() => {
                          sound.playClick();
                          setActiveTab('fabricator');
                        }}
                        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-2 transition"
                      >
                        <Hammer className="w-4 h-4" />
                        Abrir Projeto dos Silos no Construtor
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Livro de Receitas (Codex) Modal */}
      <CodexModal
        isOpen={showCodex}
        onClose={() => setShowCodex(false)}
        initialMaterialId={codexInitialMaterialId}
        onNavigateToFabricator={() => {
          setActiveTab('fabricator');
        }}
      />

      {/* Modal de Confirmação de Reset Total */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/90 max-w-sm w-full p-5 rounded-xl shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reiniciar Jogo do Zero?</h3>
                <span className="text-[10px] text-slate-400">Apagará dados locais salvos</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Todos os recursos, setores construídos, materiais estocados e circuitos serão redefinidos para os valores iniciais da nova arquitetura.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetGame();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                Sim, Resetar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Descarte de Item (Jogar Fora / Ejetar ao Vácuo) */}
      {discardTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/90 max-w-sm w-full p-5 rounded-xl shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ejetar Item ao Vácuo?</h3>
                <span className="text-[10px] text-slate-400">Liberar capacidade de carga da torre</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Item Selecionado:</span>
                <span className="font-semibold text-white">{discardTargetItem.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Disponível no Estoque:</span>
                <span className="font-mono text-cyan-400 font-bold">{discardTargetItem.quantity} un</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Quantidade para Ejetar:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={discardTargetItem.quantity}
                  value={discardQty}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(discardTargetItem.quantity, parseInt(e.target.value) || 1));
                    setDiscardQty(val);
                  }}
                  className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setDiscardQty(1)}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 cursor-pointer"
                >
                  1
                </button>
                {discardTargetItem.quantity >= 5 && (
                  <button
                    type="button"
                    onClick={() => setDiscardQty(5)}
                    className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    5
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDiscardQty(discardTargetItem.quantity)}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-amber-400 cursor-pointer"
                >
                  Tudo ({discardTargetItem.quantity})
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setDiscardTargetItem(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  discardInventoryItem(discardTargetItem.id, discardQty);
                  setDiscardTargetItem(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ejetar {discardQty} un
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Status Inferior Estilo VSCode */}
      <StatusBarFooter onNavigateToCommand={() => setActiveTab('command')} />
    </div>
  );
};
