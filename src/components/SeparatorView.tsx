/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Filter,
  Zap,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Gauge,
  Lock,
  Hammer,
  ChevronDown,
  ChevronUp,
  Box,
  Wind,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { GAME_MATERIALS, GAME_RECIPES } from '../config';
import { useGame } from '../context/GameContext';
import { sound } from '../utils/audio';
import {
  getMaterialDisplayName,
  getMaterialIcon,
  getMaterialUnit,
  getMaterialCode,
  getMaterialInfo,
} from '../utils/materials';
import { MaterialIconBadge } from './MaterialIconBadge';

interface SeparatorViewProps {
  onOpenCodexForMaterial?: (materialId: string) => void;
  onNavigateToFabricator?: () => void;
}

type SeparatorCategory = 'all' | 'scrap' | 'minerals';
type AvailabilityFilter = 'all' | 'ready' | 'locked';
type SortOption = 'availability' | 'tier' | 'cost' | 'name';

interface SeparatorRecipeItem {
  id: string;
  code: string;
  name: string;
  category: 'scrap' | 'minerals';
  tier: number;
  energyCost: number;
  description: string;
  machineCode?: string;
  inputCollectorId?: 'col_debris' | 'col_gases' | 'col_minerals';
  inputCollectorAmount?: number;
  inputItems?: { itemId: string; quantity: number }[];
  outputItems?: { itemId: string; quantity: number }[];
  isContextRecipe?: boolean;
}

export const SeparatorView: React.FC<SeparatorViewProps> = ({
  onOpenCodexForMaterial,
  onNavigateToFabricator,
}) => {
  const {
    resources,
    setResources,
    inventoryItems = [],
    setInventoryItems,
    collectors,
    setCollectors,
    recipes = [],
    craftProcessingRecipe,
    storageCapacity,
    storageUsed,
    gasStorageCapacity,
    gasStorageUsed,
    volumeCapacity,
    volumeUsed,
    isStorageFull,
  } = useGame();

  const [activeCategory, setActiveCategory] = useState<SeparatorCategory>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('availability');
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // Grupos recolhidos
  const [collapsedGroups, setCollapsedGroups] = useState<{ scrap: boolean; minerals: boolean }>({
    scrap: false,
    minerals: false,
  });

  const toggleGroup = (group: 'scrap' | 'minerals') => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    sound.playClick();
  };

  const toggleAllGroups = () => {
    const allCollapsed = collapsedGroups.scrap && collapsedGroups.minerals;
    setCollapsedGroups({ scrap: !allCollapsed, minerals: !allCollapsed });
    sound.playClick();
  };

  // Coletor de Sucata Espacial [MK-1001]
  const debCol = collectors.find((c) => c.id === 'col_debris');
  const debAmount = Math.round((debCol?.currentAmount || 0) * 10) / 10;
  const debCap = debCol?.capacity || 200;
  const debPercent = Math.min(100, Math.round((debAmount / debCap) * 100));

  // Coletor de Minérios Asteroidais [MK-1004]
  const minCol = collectors.find((c) => c.id === 'col_minerals');
  const isMinUnlocked = !!minCol?.isUnlocked;
  const minAmount = Math.round((minCol?.currentAmount || 0) * 10) / 10;
  const minCap = minCol?.capacity || 300;
  const minPercent = Math.min(100, Math.round((minAmount / minCap) * 100));

  // Catálogo Determinístico de Triagem do Separador [MK-1002]
  const separatorRecipes = useMemo<SeparatorRecipeItem[]>(() => {
    const list: SeparatorRecipeItem[] = [];

    // 1. Receitas do config/recipes.json que pertencem ao separator
    const configSeparatorRecipes = GAME_RECIPES.filter((r) => r.station === 'separator');
    configSeparatorRecipes.forEach((r) => {
      list.push({
        id: r.id,
        code: r.code || 'RC-1000',
        name: r.name,
        category: 'scrap',
        tier: r.tier || 0,
        energyCost: r.energyCost || 1,
        description: r.description,
        machineCode: r.machineCode || 'MK-1002',
        inputItems: r.inputItems,
        outputItems: r.outputItems,
      });
    });

    // 2. Operações de Britagem e Moagem Primária a Frio (Seção 4 do Documento Industrial)
    list.push({
      id: 'sep_crush_regolith',
      code: 'RC-1010',
      name: 'Moagem Fria de Regolito Ferrífero',
      category: 'minerals',
      tier: 0,
      energyCost: 2,
      description: 'Moagem mecânica de regolito ferrífero [PD-1001] na câmara de desbaste para extrair ferro recuperado [PD-2001] sem forno.',
      machineCode: 'MK-1002',
      inputItems: [{ itemId: 'raw.ferrous_regolith', quantity: 2 }],
      outputItems: [{ itemId: 'mat.recovered_iron', quantity: 1 }],
    });

    list.push({
      id: 'sep_sift_silica',
      code: 'RC-1011',
      name: 'Peneiramento Vibratório de Areia Silicatada',
      category: 'minerals',
      tier: 0,
      energyCost: 2,
      description: 'Concentração seletiva por vibração de areia silicatada [PD-1010] para isolar cristais de quartzo [PD-1011].',
      machineCode: 'MK-1002',
      inputItems: [{ itemId: 'raw.silica_sand', quantity: 2 }],
      outputItems: [{ itemId: 'raw.quartz', quantity: 1 }],
    });

    // 3. Ações de Drenagem Direta dos Reservatórios de Coletores
    list.push({
      id: 'drain_collector_debris',
      code: 'MK-1001',
      name: 'Descarregar Reservatório do Coletor de Sucata',
      category: 'scrap',
      tier: 0,
      energyCost: 1,
      description: 'Drena a sucata espacial acumulada pelo trator magnético [MK-1001] para os silos de estoque para triagem manual.',
      machineCode: 'MK-1001',
      inputCollectorId: 'col_debris',
      inputCollectorAmount: Math.max(1, Math.min(20, Math.round(debAmount))),
      outputItems: [
        { itemId: 'scrap.structural', quantity: 2 },
        { itemId: 'scrap.electrical', quantity: 1 },
      ],
    });

    if (isMinUnlocked) {
      list.push({
        id: 'drain_collector_minerals',
        code: 'MK-1004',
        name: 'Descarregar Reservatório do Coletor de Minério',
        category: 'minerals',
        tier: 0,
        energyCost: 1,
        description: 'Drena o minério bruto acumulado pela garra de mineração [MK-1004] para o estoque de sólidos.',
        machineCode: 'MK-1004',
        inputCollectorId: 'col_minerals',
        inputCollectorAmount: Math.max(1, Math.min(25, Math.round(minAmount))),
        outputItems: [
          { itemId: 'raw.ferrous_regolith', quantity: 2 },
          { itemId: 'raw.copper_ore', quantity: 1 },
        ],
      });
    }

    return list;
  }, [debAmount, minAmount, isMinUnlocked]);

  // Estoque dos principais insumos e produtos do Separador
  const separatorMaterials = useMemo(() => {
    const ids = [
      'scrap.structural',
      'scrap.electrical',
      'scrap.mechanical',
      'scrap.electronic',
      'scrap.chemical',
      'scrap.thermal',
      'mat.recovered_iron',
      'mat.recovered_copper',
      'mat.recovered_polymer',
      'part.fastener',
      'part.rough_plate',
      'part.short_wire',
      'part.connector',
      'part.gear_small',
      'part.circuit_scrap',
    ];

    return ids.map((id) => {
      const mat = (GAME_MATERIALS || []).find((m) => m.id === id);
      const inv = (inventoryItems || []).find((i) => i.id === id);
      const code = mat?.code || getMaterialCode(id);
      const displayName = getMaterialDisplayName(id);
      const icon = mat?.icon || getMaterialIcon(id);
      const unit = mat?.unit || getMaterialUnit(id);

      return {
        id,
        code,
        name: displayName,
        icon,
        color: mat?.color,
        unit,
        rarity: mat?.rarity || 'common',
        quantity: inv?.quantity || 0,
      };
    });
  }, [inventoryItems]);

  const canAffordRecipe = (recipe: SeparatorRecipeItem, mult: number = 1): boolean => {
    if (isStorageFull) return false;
    if (resources.dimensionalEnergy < recipe.energyCost * mult) return false;

    if (recipe.inputCollectorId && recipe.inputCollectorAmount) {
      const col = collectors.find((c) => c.id === recipe.inputCollectorId);
      if (!col || !col.isUnlocked || col.currentAmount < recipe.inputCollectorAmount * mult) return false;
    }

    if (recipe.inputItems && recipe.inputItems.length > 0) {
      const hasAll = recipe.inputItems.every((req) => {
        const item = (inventoryItems || []).find((i) => i.id === req.itemId);
        return item && item.quantity >= req.quantity * mult;
      });
      if (!hasAll) return false;
    }

    return true;
  };

  const handleExecuteRecipe = (recipe: SeparatorRecipeItem) => {
    const mult = batchMultiplier;
    if (!canAffordRecipe(recipe, mult)) {
      sound.playAlert();
      return;
    }

    // Deduz energia
    setResources((prev) => ({
      ...prev,
      dimensionalEnergy: Math.max(0, prev.dimensionalEnergy - recipe.energyCost * mult),
    }));

    // Deduz do coletor de buffer se for ação de drenagem
    if (recipe.inputCollectorId && recipe.inputCollectorAmount) {
      setCollectors((prev) =>
        prev.map((c) =>
          c.id === recipe.inputCollectorId
            ? {
                ...c,
                currentAmount: Math.max(
                  0,
                  Math.round((c.currentAmount - (recipe.inputCollectorAmount || 0) * mult) * 10) / 10
                ),
              }
            : c
        )
      );
    }

    // Deduz inputs e adiciona outputs no estoque
    setInventoryItems((prevItems) => {
      const next = [...prevItems];

      if (recipe.inputItems) {
        recipe.inputItems.forEach((req) => {
          const idx = next.findIndex((i) => i.id === req.itemId);
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              quantity: Math.max(0, next[idx].quantity - req.quantity * mult),
            };
          }
        });
      }

      if (recipe.outputItems) {
        recipe.outputItems.forEach((out) => {
          const idx = next.findIndex((i) => i.id === out.itemId);
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              quantity: next[idx].quantity + out.quantity * mult,
            };
          } else {
            const mat = getMaterialInfo(out.itemId);
            if (mat) {
              next.push({
                id: mat.id,
                code: mat.code,
                name: mat.name,
                type: mat.family as any,
                physicalState: mat.physicalState,
                unit: mat.unit,
                quantity: out.quantity * mult,
                unitWeight: mat.unitWeight,
                icon: mat.icon,
                color: mat.color,
                stage: mat.stage as any,
                description: mat.description,
                refineYield: mat.refineYield,
              });
            }
          }
        });
      }

      return next;
    });

    sound.playUpgrade(0.15);
  };

  // Filtragem e ordenação
  const processedRecipes = useMemo(() => {
    let list = separatorRecipes.filter((r) => {
      const matchCat =
        activeCategory === 'all'
          ? true
          : activeCategory === 'minerals'
          ? r.category === 'minerals'
          : r.category === 'scrap';

      if (!matchCat) return false;

      if (filterSearch) {
        const term = filterSearch.toLowerCase();
        const matchText =
          r.name.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term) ||
          r.code.toLowerCase().includes(term);
        if (!matchText) return false;
      }

      if (availabilityFilter === 'ready') {
        return canAffordRecipe(r, batchMultiplier);
      } else if (availabilityFilter === 'locked') {
        return !canAffordRecipe(r, batchMultiplier);
      }

      return true;
    });

    list.sort((a, b) => {
      if (sortOption === 'availability') {
        const aReady = canAffordRecipe(a, batchMultiplier) ? 1 : 0;
        const bReady = canAffordRecipe(b, batchMultiplier) ? 1 : 0;
        return bReady - aReady;
      }
      if (sortOption === 'tier') return a.tier - b.tier;
      if (sortOption === 'cost') return a.energyCost - b.energyCost;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [
    separatorRecipes,
    activeCategory,
    availabilityFilter,
    sortOption,
    filterSearch,
    batchMultiplier,
    resources.dimensionalEnergy,
    collectors,
    inventoryItems,
    isStorageFull,
  ]);

  const scrapRecipes = processedRecipes.filter((r) => r.category === 'scrap');
  const mineralsRecipes = processedRecipes.filter((r) => r.category === 'minerals');

  const readyScrapCount = scrapRecipes.filter((r) => canAffordRecipe(r, batchMultiplier)).length;
  const readyMineralsCount = mineralsRecipes.filter((r) => canAffordRecipe(r, batchMultiplier)).length;

  return (
    <div className="flex flex-col gap-4 font-sans select-none">
      {/* 1. Header do Separador [MK-1002] */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-xs">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Separador Manual & Triagem de Sucata
              </h2>
              <span className="text-[10px] font-mono text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
                [MK-1002]
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cisalha e desmonta lotes de sucata [PD-1201..1208] recuperando metais industriais, fios, rolamentos e fixadores.
            </p>
          </div>
        </div>

        {/* Lote */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 px-1">Lote Triagem:</span>
          {[1, 5, 10].map((m) => (
            <button
              key={m}
              onClick={() => {
                sound.playClick();
                setBatchMultiplier(m);
              }}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                batchMultiplier === m
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {m}x
            </button>
          ))}
        </div>
      </div>

      {/* 2. Medidores de Capacidade de Armazenamento */}
      <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Capacidade de Armazenamento da Estação
            </h3>
          </div>
          {isStorageFull && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Silos de Carga Lotados</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Peso */}
          <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">1. Peso (Sólidos):</span>
              <span className="font-mono text-slate-200 font-bold">
                {storageUsed} / {storageCapacity} kg
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  storageUsed >= storageCapacity ? 'bg-rose-500' : 'bg-violet-500'
                }`}
                style={{ width: `${Math.min(100, Math.round((storageUsed / (storageCapacity || 1)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Litros */}
          <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">2. Litros (Gases/Fluidos):</span>
              <span className="font-mono text-slate-200 font-bold">
                {gasStorageUsed} / {gasStorageCapacity} L
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  gasStorageUsed >= gasStorageCapacity ? 'bg-rose-500' : 'bg-sky-500'
                }`}
                style={{ width: `${Math.min(100, Math.round((gasStorageUsed / (gasStorageCapacity || 1)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Volume */}
          <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">3. Volume (m³):</span>
              <span className="font-mono text-slate-200 font-bold">
                {volumeUsed} / {volumeCapacity} m³
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  volumeUsed >= volumeCapacity ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.round((volumeUsed / (volumeCapacity || 1)) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Barra de Filtros e Busca */}
      <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar triagem por código [RC-xxxx], [PD-xxxx] ou nome..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <button
            onClick={toggleAllGroups}
            className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer self-end sm:self-center shrink-0"
          >
            {collapsedGroups.scrap && collapsedGroups.minerals ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                <span>Expandir Todos</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
                <span>Recolher Todos</span>
              </>
            )}
          </button>
        </div>

        {/* Linha 2 de Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: `Todos (${processedRecipes.length})` },
              { id: 'scrap', label: `Triagem de Sucatas (${scrapRecipes.length})` },
              { id: 'minerals', label: `Britagem de Minérios (${mineralsRecipes.length})` },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id as SeparatorCategory);
                  sound.playClick();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-slate-800 text-sky-300 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <span className="text-slate-700 hidden sm:inline" aria-hidden="true">|</span>

            {[
              { id: 'all', label: 'Todos' },
              { id: 'ready', label: 'Prontos' },
              { id: 'locked', label: 'Faltam Insumos' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setAvailabilityFilter(f.id as AvailabilityFilter);
                  sound.playClick();
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  availabilityFilter === f.id
                    ? 'bg-sky-950/80 text-sky-300 border border-sky-600/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Lista Organizada de Triagem */}
      <div className="flex flex-col gap-3">
        {/* GRUPO 1: TRIAGEM DE SUCATAS */}
        {(activeCategory === 'all' || activeCategory === 'scrap') && scrapRecipes.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-md">
            <button
              onClick={() => toggleGroup('scrap')}
              className="w-full px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 border-b border-slate-800 flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Triagem de Sucata Espacial [MK-1002]
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Desmontagem de Sucata Estrutural, Elétrica, Mecânica, Eletrônica, Química e Térmica
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-950/50 text-sky-300 border border-sky-800/60">
                  {readyScrapCount} prontas
                </span>
                {collapsedGroups.scrap ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {!collapsedGroups.scrap && (
              <div className="divide-y divide-slate-800/80">
                {scrapRecipes.map((recipe) => renderRecipeRow(recipe))}
              </div>
            )}
          </div>
        )}

        {/* GRUPO 2: BRITAGEM E BENEFICIAMENTO A FRIO */}
        {(activeCategory === 'all' || activeCategory === 'minerals') && mineralsRecipes.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-md">
            <button
              onClick={() => toggleGroup('minerals')}
              className="w-full px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 border-b border-slate-800 flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Britagem Primária & Moagem Fria
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Desbaste mecânico de regolitos e separação de areia silicatada
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950/50 text-amber-300 border border-amber-800/60">
                  {readyMineralsCount} prontas
                </span>
                {collapsedGroups.minerals ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {!collapsedGroups.minerals && (
              <div className="divide-y divide-slate-800/80">
                {mineralsRecipes.map((recipe) => renderRecipeRow(recipe))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Painel Inferior de Materiais em Estoque */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Insumos de Sucata & Peças Recuperadas em Estoque
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {separatorMaterials.filter((m) => m.quantity > 0).length} itens disponíveis
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {separatorMaterials.map((mat) => (
            <button
              key={mat.id}
              onClick={() => onOpenCodexForMaterial && onOpenCodexForMaterial(mat.id)}
              className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-sky-500/40 text-left transition-colors flex items-center gap-2 cursor-pointer group"
              title="Consultar no Codex"
            >
              <MaterialIconBadge iconName={mat.icon} color={mat.color} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-sky-300 font-bold truncate">[{mat.code}]</span>
                </div>
                <div className="font-semibold text-xs text-slate-200 truncate group-hover:text-sky-300 transition-colors">
                  {mat.name}
                </div>
                <div className="text-[10px] font-mono text-emerald-400 font-bold truncate">
                  {mat.quantity} {mat.unit}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Renderiza uma linha zero-gap da receita
  function renderRecipeRow(recipe: SeparatorRecipeItem) {
    const mult = batchMultiplier;
    const affordable = canAffordRecipe(recipe, mult);
    const energyNeeded = recipe.energyCost * mult;
    const isExpanded = expandedRecipeId === recipe.id;

    // Buffer check
    let bufferRequired = 0;
    let bufferAvailable = 0;
    let hasBufferCost = true;
    let colName = '';

    if (recipe.inputCollectorId && recipe.inputCollectorAmount) {
      bufferRequired = recipe.inputCollectorAmount * mult;
      const col = collectors.find((c) => c.id === recipe.inputCollectorId);
      bufferAvailable = col?.currentAmount || 0;
      hasBufferCost = !!(col && col.isUnlocked && bufferAvailable >= bufferRequired);
      colName = recipe.inputCollectorId === 'col_minerals' ? 'Minérios' : 'Sucata';
    }

    return (
      <div
        key={recipe.id}
        className={`p-3 transition-colors ${
          affordable ? 'bg-slate-950/60 hover:bg-slate-900/60' : 'bg-slate-950/30 opacity-75'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-2.5 h-2.5 rounded-full mt-1 md:mt-0 shrink-0 ${
                affordable
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-slate-600'
              }`}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-sky-300">
                  [{recipe.code}]
                </span>
                <h5 className="font-bold text-xs sm:text-sm text-slate-100">{recipe.name}</h5>
                {recipe.machineCode && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {recipe.machineCode}
                  </span>
                )}
              </div>

              {/* Requisitos e Rendimentos */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono mt-1 text-slate-400">
                {/* Energia */}
                <span className="flex items-center gap-1 text-amber-300">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{energyNeeded} DE</span>
                </span>

                {/* Buffer Input */}
                {recipe.inputCollectorAmount && (
                  <>
                    <span>·</span>
                    <span className={hasBufferCost ? 'text-slate-300' : 'text-rose-400'}>
                      {bufferRequired}kg {colName} ({Math.round(bufferAvailable)} disp.)
                    </span>
                  </>
                )}

                {/* Item Inputs */}
                {recipe.inputItems &&
                  recipe.inputItems.map((req) => {
                    const inv = inventoryItems.find((i) => i.id === req.itemId);
                    const hasQty = (inv?.quantity || 0) >= req.quantity * mult;
                    const code = getMaterialCode(req.itemId);
                    return (
                      <span
                        key={req.itemId}
                        className={`flex items-center gap-1 ${hasQty ? 'text-slate-300' : 'text-rose-400'}`}
                      >
                        <span>·</span>
                        <span>
                          [{code}] {getMaterialDisplayName(req.itemId)}: {inv?.quantity || 0}/{req.quantity * mult}
                        </span>
                      </span>
                    );
                  })}

                {/* Seta para Rendimentos */}
                <ArrowRight className="w-3 h-3 text-sky-400 shrink-0" />

                {/* Outputs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {recipe.outputItems?.map((out) => {
                    const outCode = getMaterialCode(out.itemId);
                    return (
                      <span
                        key={out.itemId}
                        className="px-1.5 py-0.2 rounded bg-sky-950/60 border border-sky-800/50 text-sky-300 text-[11px]"
                      >
                        +{out.quantity * mult} [{outCode}] {getMaterialDisplayName(out.itemId)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={() => handleExecuteRecipe(recipe)}
              disabled={!affordable}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                affordable
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {isStorageFull
                  ? 'Silos Lotados'
                  : affordable
                  ? `Triar (${mult}x)`
                  : 'Sem Recursos'}
              </span>
            </button>

            <button
              onClick={() => {
                setExpandedRecipeId(isExpanded ? null : recipe.id);
                sound.playClick();
              }}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title={isExpanded ? 'Recolher detalhes técnicos' : 'Expandir detalhes técnicos'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Detalhes Técnicos */}
        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/70 text-xs text-slate-400 flex flex-col gap-1.5">
            <p className="leading-relaxed">{recipe.description}</p>
            {recipe.outputItems && (
              <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                <span className="text-slate-500 font-mono">Componentes recuperados:</span>
                {recipe.outputItems.map((out) => {
                  const outCode = getMaterialCode(out.itemId);
                  return (
                    <button
                      key={out.itemId}
                      onClick={() => onOpenCodexForMaterial && onOpenCodexForMaterial(out.itemId)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-sky-300 cursor-pointer font-mono"
                    >
                      <span className="text-sky-300 font-bold">[{outCode}]</span>
                      <span>{getMaterialDisplayName(out.itemId)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
};
