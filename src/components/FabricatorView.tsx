/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Hammer,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Box,
  Wrench,
  Sparkles,
  Shield,
  Activity,
  Crosshair,
  Flame,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { GAME_RECIPES, GAME_MATERIALS, ConfigRecipe } from '../config';
import { useGame } from '../context/GameContext';
import { ModuleType } from '../types/game';
import { sound } from '../utils/audio';
import { getMaterialDisplayName, getMaterialCode, getMaterialIcon } from '../utils/materials';
import { MaterialIconBadge } from './MaterialIconBadge';

interface FabricatorViewProps {
  onOpenCodexForMaterial?: (materialId: string) => void;
  highlightRecipeId?: string;
}

type FabricatorFilterCategory = 'all' | 'components' | 'modules' | 'tools';
type AvailabilityFilter = 'all' | 'ready' | 'missing' | 'completed';

export interface FabricatorProject {
  id: string;
  code: string;
  name: string;
  kind: 'component' | 'module' | 'tool';
  subCategory: 'parts' | 'infrastructure' | 'expansion' | 'automation' | 'operational_tool' | 'tactical_equipment';
  tier: number;
  energyCost: number;
  costMatter?: number;
  costTech?: number;
  inputItems: { itemId: string; quantity: number }[];
  outputItemId?: string;
  outputQuantity?: number;
  description: string;
  effectBadge: string;
  unlockFeature?: string;
  automationId?: string;
  autonomousModuleId?: string;
  defenseModuleType?: ModuleType;
  isConstructed: boolean;
  onExecute?: (mult: number) => void;
}

export const FabricatorView: React.FC<FabricatorViewProps> = ({
  onOpenCodexForMaterial,
  highlightRecipeId,
}) => {
  const {
    resources,
    setResources,
    inventoryItems = [],
    setInventoryItems,
    baseSectors,
    setBaseSectors,
    collectors,
    setCollectors,
    automationUpgrades = [],
    installAutomationUpgrade,
    autonomousModules = [],
    craftAutonomousModule,
    defenseModuleDefs,
    craftDefenseModule,
    tower,
    setTower,
    canAcceptCargo,
  } = useGame();

  const [activeCategory, setActiveCategory] = useState<FabricatorFilterCategory>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Estados de grupos recolhidos
  const [collapsedGroups, setCollapsedGroups] = useState<{
    components: boolean;
    modules: boolean;
    tools: boolean;
  }>({
    components: false,
    modules: false,
    tools: false,
  });

  const toggleGroup = (group: 'components' | 'modules' | 'tools') => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    sound.playClick();
  };

  const toggleAllGroups = () => {
    const allCollapsed = collapsedGroups.components && collapsedGroups.modules && collapsedGroups.tools;
    setCollapsedGroups({ components: !allCollapsed, modules: !allCollapsed, tools: !allCollapsed });
    sound.playClick();
  };

  // Status de módulos já construídos na estação
  const oreCollectorUnlocked = !!collectors.find((c) => c.id === 'col_minerals')?.isUnlocked;
  const gasCollectorUnlocked = !!collectors.find((c) => c.id === 'col_gases')?.isUnlocked;
  const inventoryInstalled = !!baseSectors.inventory?.installed;

  // Persistência local de máquinas individuais construídas
  const [constructedMachineIds, setConstructedMachineIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('torre_constructed_machines');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markMachineConstructed = useCallback((id: string) => {
    setConstructedMachineIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem('torre_constructed_machines', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Catálogo estritamente organizado: Peças [RC-xxxx], Módulos [MK-xxxx] e Ferramentas [FR-xxxx]
  const allProjects = useMemo<FabricatorProject[]>(() => {
    const projects: FabricatorProject[] = [];

    // =========================================================================
    // 0. PEÇAS & COMPONENTES DE MONTAGEM [RC-xxxx] (Repetíveis para construção)
    // =========================================================================
    const rawConfigComponents = GAME_RECIPES.filter(
      (r) =>
        r.station === 'assembler' &&
        (r.id.startsWith('craft_part_') ||
          r.code?.startsWith('RC-') ||
          (r.outputItems && r.outputItems.length > 0 && !r.code?.startsWith('MK-') && !r.code?.startsWith('FR-')))
    );

    rawConfigComponents.forEach((comp) => {
      const primaryOut = comp.outputItems?.[0];
      const outputItemId = primaryOut?.itemId;
      const outputQuantity = primaryOut?.quantity || 1;
      const outMat = outputItemId ? GAME_MATERIALS.find((m) => m.id === outputItemId) : undefined;
      projects.push({
        id: comp.id,
        code: comp.code || 'RC-1000',
        name: comp.name,
        kind: 'component',
        subCategory: 'parts',
        tier: comp.tier || 1,
        energyCost: comp.energyCost || 3,
        inputItems: comp.inputItems || [],
        outputItemId,
        outputQuantity,
        description: comp.description,
        effectBadge: outMat ? `Produz: ${outputQuantity}x ${outMat.name}` : 'Peça Intermediária',
        isConstructed: false,
      });
    });

    // =========================================================================
    // 1. MÓDULOS DE INFRAESTRUTURA & MÁQUINAS [MK-xxxx]
    // =========================================================================
    const rawConfigModules = GAME_RECIPES.filter(
      (r) => r.station === 'assembler' && r.code?.startsWith('MK-')
    );

    rawConfigModules.forEach((mod) => {
      let isConstructed = constructedMachineIds.includes(mod.id);
      let badge = 'Módulo Permanente';

      if (mod.unlockFeature === 'unlock_minerals_collector') {
        if (oreCollectorUnlocked) isConstructed = true;
        badge = 'Desbloqueia Coletor de Minérios';
      } else if (mod.unlockFeature === 'unlock_inventory_sector') {
        if (inventoryInstalled) isConstructed = true;
        badge = 'Desbloqueia Silos & Expedição';
      } else if (mod.id === 'craft_furnace_sector' || mod.unlockFeature === 'unlock_furnace_sector') {
        badge = 'Desbloqueia Forno de Recuperação Térmica';
      } else if (mod.id === 'craft_chemical_refinery' || mod.unlockFeature === 'unlock_refinery_sector') {
        badge = 'Desbloqueia Refinaria Química & Reator';
      } else if (mod.unlockFeature === 'unlock_gas_collector') {
        if (gasCollectorUnlocked) isConstructed = true;
        badge = 'Desbloqueia Coletor de Gases';
      }

      projects.push({
        id: mod.id,
        code: mod.code || 'MK-1000',
        name: mod.name,
        kind: 'module',
        subCategory: 'infrastructure',
        tier: mod.tier || 1,
        energyCost: mod.energyCost || 5,
        inputItems: mod.inputItems || [],
        description: mod.description,
        effectBadge: badge,
        unlockFeature: mod.unlockFeature,
        isConstructed,
      });
    });

    // 1.2 Módulos de Automação de Dutos
    automationUpgrades.forEach((up) => {
      projects.push({
        id: up.id,
        code: 'MK-1100',
        name: up.name,
        kind: 'module',
        subCategory: 'automation',
        tier: 2,
        energyCost: 10,
        costMatter: up.costMatter,
        costTech: up.costTech,
        inputItems: up.costItems || [],
        description: up.description,
        effectBadge: 'Automação Contínua',
        automationId: up.id,
        isConstructed: up.installed,
      });
    });

    // =========================================================================
    // 2. FERRAMENTAS & DISPOSITIVOS OPERACIONAIS [FR-xxxx]
    // =========================================================================
    const rawConfigTools = GAME_RECIPES.filter(
      (r) => r.station === 'assembler' && r.code?.startsWith('FR-')
    );

    rawConfigTools.forEach((tool) => {
      let badge = 'Dispositivo Portátil';
      let onExec: ((mult: number) => void) | undefined = undefined;

      if (tool.id === 'craft_tool_maintenance_drone' || tool.code === 'FR-1030') {
        badge = '+150 HP no Casco';
        onExec = (mult) => {
          setTower((prev) => ({
            ...prev,
            coreHp: Math.min(prev.maxCoreHp, prev.coreHp + 150 * mult),
          }));
          setActionSuccessNotice(`Drone ativado! Casco reparado em +${150 * mult} HP.`);
        };
      } else if (tool.id === 'craft_tool_emp_deployer' || tool.code === 'FR-1050') {
        badge = '+35 DE no Reator';
        onExec = (mult) => {
          setResources((prev) => ({
            ...prev,
            dimensionalEnergy: Math.min(
              prev.maxDimensionalEnergy || 100,
              prev.dimensionalEnergy + 35 * mult
            ),
          }));
          setActionSuccessNotice(`Pulso EMP disparado! Injetado +${35 * mult} DE no Reator.`);
        };
      } else if (tool.id === 'craft_tool_sensor_probe' || tool.code === 'FR-1040') {
        badge = '+25 Dados de Combate';
        onExec = (mult) => {
          setResources((prev) => ({
            ...prev,
            combatData: prev.combatData + 25 * mult,
          }));
          setActionSuccessNotice(`Sonda transmitiu telemetria! +${25 * mult} Dados de Combate.`);
        };
      } else if (tool.id === 'craft_tool_shield_booster' || tool.code === 'FR-1060') {
        badge = 'Restauração de Escudos';
        onExec = () => {
          setTower((prev) => {
            const sh = prev.sectors.shields;
            return {
              ...prev,
              sectors: {
                ...prev.sectors,
                shields: { ...sh, hp: sh.maxHp, status: 'operational' },
              },
            };
          });
          setActionSuccessNotice('Sobrealimentador acoplado! Matriz de escudos recalibrada a 100%.');
        };
      } else if (tool.code === 'FR-1001') {
        badge = 'Desbaste Manual';
        onExec = () => setActionSuccessNotice('Pedra de moagem forjada! Aumenta eficácia de triagem mineral.');
      } else if (tool.code === 'FR-1002') {
        badge = 'Cisalhamento de Chapas';
        onExec = () => setActionSuccessNotice('Cortador de sucata calibrado! Prontidão para corte de vigas.');
      } else if (tool.code === 'FR-1003') {
        badge = 'Filtro de Sedimentos';
        onExec = () => setActionSuccessNotice('Filtro sintético confeccionado para linhas de purificação.');
      } else if (tool.code === 'FR-1010') {
        badge = 'Usinagem de Precisão';
        onExec = () => setActionSuccessNotice('Ponta de torneamento temperada para o Torno MK-2005.');
      } else if (tool.code === 'FR-1020') {
        badge = 'Alinhamento Óptico';
        onExec = () => setActionSuccessNotice('Calibrador óptico sincronizado com as miras da torre.');
      }

      projects.push({
        id: tool.id,
        code: tool.code || 'FR-1000',
        name: tool.name,
        kind: 'tool',
        subCategory: 'operational_tool',
        tier: tool.tier || 1,
        energyCost: tool.energyCost || 4,
        inputItems: tool.inputItems || [],
        description: tool.description,
        effectBadge: badge,
        isConstructed: false,
        onExecute: onExec,
      });
    });

    // 2.2 Módulos Táticos Autônomos de Defesa
    autonomousModules.forEach((mod) => {
      if (mod.id === 'auto_emp') return;
      projects.push({
        id: `craft_${mod.id}`,
        code: 'FR-2000',
        name: `Construir ${mod.name}`,
        kind: 'tool',
        subCategory: 'tactical_equipment',
        tier: 3,
        energyCost: 15,
        costMatter: mod.costMatter,
        costTech: mod.costTech,
        inputItems: [
          { itemId: 'part.circuit_scrap', quantity: 2 },
          { itemId: 'mat.copper_wire', quantity: 3 },
          { itemId: 'part.connector', quantity: 4 },
        ],
        description: `Módulo tático autônomo acoplável à fuselagem. ${mod.description}`,
        effectBadge: mod.role.split('·')[0].trim(),
        autonomousModuleId: mod.id,
        isConstructed: mod.unlocked,
      });
    });

    // 2.3 Módulos de Combate da Malha Hexagonal (Modo Assalto)
    if (defenseModuleDefs) {
      Object.values(defenseModuleDefs).forEach((def) => {
        projects.push({
          id: `craft_def_${def.type}`,
          code: def.code || 'MK-3000',
          name: `Módulo Bélico: ${def.name}`,
          kind: 'module',
          subCategory: 'tactical_equipment',
          tier: def.type === 'railgun_bastion' ? 3 : def.type === 'missile_launcher' || def.type === 'tesla_coil' || def.type === 'nanobot_drone' ? 2 : 1,
          energyCost: 15,
          inputItems: def.craftCostItems || [],
          description: `${def.description} ${def.tacticalSpecialty}`,
          effectBadge: def.role.split('·')[0].trim(),
          defenseModuleType: def.type,
          isConstructed: def.unlocked,
        });
      });
    }

    return projects;
  }, [
    oreCollectorUnlocked,
    gasCollectorUnlocked,
    inventoryInstalled,
    constructedMachineIds,
    automationUpgrades,
    autonomousModules,
    defenseModuleDefs,
    setTower,
    setResources,
  ]);

  const canAffordProject = (project: FabricatorProject, mult: number = 1): boolean => {
    if (project.isConstructed) return false;

    if (resources.dimensionalEnergy < project.energyCost * mult) return false;
    if (project.costMatter && resources.commonMatter < project.costMatter * mult) return false;
    if (project.costTech && resources.techComponents < project.costTech * mult) return false;

    if (project.inputItems && project.inputItems.length > 0) {
      const hasAll = project.inputItems.every((req) => {
        const item = inventoryItems.find((i) => i.id === req.itemId);
        return item && item.quantity >= req.quantity * mult;
      });
      if (!hasAll) return false;
    }

    if (project.outputItemId) {
      const mat = GAME_MATERIALS.find((m) => m.id === project.outputItemId);
      const isGas = mat?.physicalState === 'gas' || mat?.family === 'gas';
      const weight = isGas ? 0 : (mat?.unitWeight || 1) * (project.outputQuantity || 1) * mult;
      const liquid = isGas ? (project.outputQuantity || 1) * mult : 0;
      const check = canAcceptCargo(weight, liquid);
      if (!check.allowed) return false;
    }

    return true;
  };

  const handleExecuteProject = (project: FabricatorProject) => {
    const isRepeatable = project.kind === 'component' || project.kind === 'tool';
    const mult = isRepeatable ? batchMultiplier : 1;

    if (!canAffordProject(project, mult)) {
      sound.playAlert();
      return;
    }

    // Caso produza item físico, valida capacidade de estoque
    if (project.outputItemId) {
      const mat = GAME_MATERIALS.find((m) => m.id === project.outputItemId);
      const isGas = mat?.physicalState === 'gas' || mat?.family === 'gas';
      const weight = isGas ? 0 : (mat?.unitWeight || 1) * (project.outputQuantity || 1) * mult;
      const liquid = isGas ? (project.outputQuantity || 1) * mult : 0;
      const check = canAcceptCargo(weight, liquid);
      if (!check.allowed) {
        setActionSuccessNotice(check.reason || 'Armazenamento insuficiente!');
        sound.playAlert();
        return;
      }
    }

    // Caso seja módulo bélico da malha hexagonal, delega para craftDefenseModule que cuida da dedução exata
    if (project.defenseModuleType && craftDefenseModule) {
      const ok = craftDefenseModule(project.defenseModuleType);
      if (ok) {
        sound.playDeploy(0.18);
        setActionSuccessNotice(`Módulo Bélico [${project.code}] ${project.name} fabricado e pronto para deploy na malha!`);
      }
      return;
    }

    setResources((prev) => ({
      ...prev,
      dimensionalEnergy: Math.max(0, prev.dimensionalEnergy - project.energyCost * mult),
      commonMatter: project.costMatter
        ? Math.max(0, prev.commonMatter - project.costMatter * mult)
        : prev.commonMatter,
      techComponents: project.costTech
        ? Math.max(0, prev.techComponents - project.costTech * mult)
        : prev.techComponents,
    }));

    if (project.inputItems && project.inputItems.length > 0) {
      setInventoryItems((prev) => {
        let next = [...prev];
        project.inputItems.forEach((req) => {
          next = next.map((item) =>
            item.id === req.itemId
              ? { ...item, quantity: Math.max(0, item.quantity - req.quantity * mult) }
              : item
          );
        });
        return next;
      });
    }

    if (project.outputItemId) {
      const producedQty = (project.outputQuantity || 1) * mult;
      setInventoryItems((prev) => {
        const next = [...prev];
        const idx = next.findIndex((item) => item.id === project.outputItemId);
        if (idx >= 0) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + producedQty };
        }
        return next;
      });
      const matName = getMaterialDisplayName(project.outputItemId);
      setActionSuccessNotice(`Peça forjada: +${producedQty}x ${matName} armazenada nos Silos!`);
    } else if (project.unlockFeature === 'unlock_minerals_collector') {
      markMachineConstructed(project.id);
      setCollectors((prev) =>
        prev.map((c) =>
          c.id === 'col_minerals' ? { ...c, isUnlocked: true, status: 'COLLECTING' } : c
        )
      );
      setActionSuccessNotice('Coletor de Minério [MK-1004] construído e operando no cinturão!');
    } else if (project.unlockFeature === 'unlock_inventory_sector') {
      markMachineConstructed(project.id);
      setBaseSectors((prev) => ({
        ...prev,
        inventory: { ...prev.inventory, installed: true, level: 1 },
      }));
      setActionSuccessNotice('Hangar de Estoque Industrial [MK-1005] construído! Expedições desbloqueadas.');
    } else if (project.id === 'craft_furnace_sector' || project.unlockFeature === 'unlock_furnace_sector') {
      markMachineConstructed('craft_furnace_sector');
      setBaseSectors((prev) => ({
        ...prev,
        refinery: { ...prev.refinery, installed: true, level: 1 },
      }));
      setActionSuccessNotice('Forno de Recuperação Térmica [MK-2001] construído! Fundição térmica ativada.');
    } else if (project.id === 'craft_chemical_refinery' || project.unlockFeature === 'unlock_refinery_sector') {
      markMachineConstructed('craft_chemical_refinery');
      setBaseSectors((prev) => ({
        ...prev,
        refinery: { ...prev.refinery, installed: true, level: 2 },
      }));
      setActionSuccessNotice('Refinaria Química & Reator [MK-2203] construída! Fracionamento químico avançado ativado.');
    } else if (project.unlockFeature === 'unlock_gas_collector') {
      markMachineConstructed(project.id);
      setCollectors((prev) =>
        prev.map((c) =>
          c.id === 'col_gases' ? { ...c, isUnlocked: true, status: 'COLLECTING' } : c
        )
      );
      setActionSuccessNotice('Coletor de Gases Estelares [MK-2202] construído e captando no vácuo!');
    } else if (project.kind === 'module') {
      markMachineConstructed(project.id);
      setActionSuccessNotice(`Máquina ${project.name} montada com sucesso!`);
    } else if (project.automationId) {
      installAutomationUpgrade(project.automationId);
      setActionSuccessNotice(`Módulo ${project.name} instalado e integrado à estação!`);
    } else if (project.autonomousModuleId) {
      craftAutonomousModule(project.autonomousModuleId);
      setActionSuccessNotice(`Equipamento ${project.name} forjado e disponível para montagem!`);
    } else if (project.onExecute) {
      project.onExecute(mult);
    }

    sound.playUpgrade(0.2);
  };

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      const isRepeatable = p.kind === 'component' || p.kind === 'tool';
      const mult = isRepeatable ? batchMultiplier : 1;
      const affordable = canAffordProject(p, mult);

      if (activeCategory === 'components' && p.kind !== 'component') return false;
      if (activeCategory === 'modules' && p.kind !== 'module') return false;
      if (activeCategory === 'tools' && p.kind !== 'tool') return false;

      if (availabilityFilter === 'completed' && !p.isConstructed) return false;
      if (availabilityFilter === 'ready' && (p.isConstructed || !affordable)) return false;
      if (availabilityFilter === 'missing' && (p.isConstructed || affordable)) return false;

      if (filterSearch) {
        const term = filterSearch.toLowerCase();
        const match =
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.effectBadge.toLowerCase().includes(term);
        if (!match) return false;
      }

      return true;
    });
  }, [allProjects, activeCategory, availabilityFilter, filterSearch, batchMultiplier, resources, inventoryItems]);

  const componentProjects = filteredProjects.filter((p) => p.kind === 'component');
  const moduleProjects = filteredProjects.filter((p) => p.kind === 'module');
  const toolProjects = filteredProjects.filter((p) => p.kind === 'tool');

  const readyComponentsCount = componentProjects.filter((p) => canAffordProject(p, batchMultiplier)).length;
  const readyModulesCount = moduleProjects.filter((p) => canAffordProject(p, 1)).length;
  const readyToolsCount = toolProjects.filter((p) => canAffordProject(p, batchMultiplier)).length;

  return (
    <div className="flex flex-col gap-4 font-sans select-none">
      {/* 1. Header do Construtor [MK-1003] */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-xs">
            <Hammer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Bancada do Construtor Molecular
              </h2>
              <span className="text-[10px] font-mono text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
                [MK-1003] · Módulos & Ferramentas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Setor dedicado à montagem de máquinas permanentes [MK-xxxx] e ferramentas operacionais [FR-xxxx].
            </p>
          </div>
        </div>

        {/* Multiplicador de Lote para Ferramentas */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 px-1">Lote Ferramentas:</span>
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

      {/* Alerta de Ação Realizada */}
      {actionSuccessNotice && (
        <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fadeIn font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccessNotice}</span>
          </div>
          <button
            onClick={() => setActionSuccessNotice(null)}
            className="text-[11px] font-mono text-slate-400 hover:text-white px-2 py-0.5 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 2. Barra de Filtros e Busca */}
      <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código [MK-xxxx], [FR-xxxx] ou nome..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <button
            onClick={toggleAllGroups}
            className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer self-end sm:self-center shrink-0"
          >
            {collapsedGroups.modules && collapsedGroups.tools ? (
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
              { id: 'all', label: `Todos (${filteredProjects.length})` },
              { id: 'components', label: `Peças & Componentes (${componentProjects.length})` },
              { id: 'modules', label: `Máquinas & Infraestrutura (${moduleProjects.length})` },
              { id: 'tools', label: `Ferramentas & Drones (${toolProjects.length})` },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id as FabricatorFilterCategory);
                  sound.playClick();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
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
              { id: 'ready', label: 'Prontos para Construir' },
              { id: 'missing', label: 'Faltam Insumos' },
              { id: 'completed', label: 'Já Instalados' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setAvailabilityFilter(f.id as AvailabilityFilter);
                  sound.playClick();
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition cursor-pointer ${
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

      {/* 3. Lista de Componentes, Módulos e Ferramentas */}
      <div className="flex flex-col gap-3">
        {/* GRUPO 1: PEÇAS & COMPONENTES DE MONTAGEM [RC-xxxx] */}
        {(activeCategory === 'all' || activeCategory === 'components') && componentProjects.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-md">
            <button
              onClick={() => toggleGroup('components')}
              className="w-full px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 border-b border-slate-800 flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  <Box className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Peças & Componentes de Montagem [RC-xxxx]
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Fixadores, placas conformadas, cabos, suportes e conjuntos mecânicos para construção
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-950/50 text-sky-300 border border-sky-800/60">
                  {readyComponentsCount} fabricáveis
                </span>
                {collapsedGroups.components ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {!collapsedGroups.components && (
              <div className="divide-y divide-slate-800/80">
                {componentProjects.map((project) => renderProjectRow(project))}
              </div>
            )}
          </div>
        )}

        {/* GRUPO 2: MÓDULOS DE INFRAESTRUTURA [MK-xxxx] */}
        {(activeCategory === 'all' || activeCategory === 'modules') && moduleProjects.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-md">
            <button
              onClick={() => toggleGroup('modules')}
              className="w-full px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 border-b border-slate-800 flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  <Box className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Módulos & Máquinas Industriais [MK-xxxx]
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Silos de Estoque [MK-1005], Coletores [MK-1004], Fornos [MK-2001], Laminadores e Refinarias
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-950/50 text-sky-300 border border-sky-800/60">
                  {readyModulesCount} disponíveis
                </span>
                {collapsedGroups.modules ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {!collapsedGroups.modules && (
              <div className="divide-y divide-slate-800/80">
                {moduleProjects.map((project) => renderProjectRow(project))}
              </div>
            )}
          </div>
        )}

        {/* GRUPO 2: FERRAMENTAS & DISPOSITIVOS OPERACIONAIS [FR-xxxx] */}
        {(activeCategory === 'all' || activeCategory === 'tools') && toolProjects.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-md">
            <button
              onClick={() => toggleGroup('tools')}
              className="w-full px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 border-b border-slate-800 flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Ferramentas & Dispositivos Operacionais [FR-xxxx]
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Drones de reparo [FR-1030], pulsos EMP [FR-1050], sondas [FR-1040] e pontas abrasivas
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800/60">
                  {readyToolsCount} prontas
                </span>
                {collapsedGroups.tools ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {!collapsedGroups.tools && (
              <div className="divide-y divide-slate-800/80">
                {toolProjects.map((project) => renderProjectRow(project))}
              </div>
            )}
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-mono">
            Nenhum projeto encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );

  function renderProjectRow(project: FabricatorProject) {
    const isRepeatable = project.kind === 'component' || project.kind === 'tool';
    const mult = isRepeatable ? batchMultiplier : 1;
    const isModule = project.kind === 'module';
    const affordable = canAffordProject(project, mult);
    const isExpanded = expandedProjectId === project.id;
    const isHighlighted = highlightRecipeId === project.id;

    return (
      <div
        key={project.id}
        className={`p-3.5 transition-colors ${
          isHighlighted
            ? 'bg-sky-950/30 ring-1 ring-sky-500/50'
            : project.isConstructed
            ? 'bg-slate-950/40 opacity-70'
            : affordable
            ? 'bg-slate-950/70 hover:bg-slate-900/60'
            : 'bg-slate-950/30 opacity-75'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-start lg:items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-sky-300">
                  [{project.code}]
                </span>
                <h4 className="font-bold text-white text-xs sm:text-sm">{project.name}</h4>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    project.isConstructed
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                      : isModule
                      ? 'bg-sky-950/60 text-sky-300 border-sky-500/30'
                      : 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {project.effectBadge}
                </span>

                {project.tier > 1 && (
                  <span className="text-[10px] font-mono text-slate-500">Tier {project.tier}</span>
                )}
              </div>

              {/* Insumos Resumidos */}
              <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                {/* Energia */}
                <span
                  className={`flex items-center gap-1 ${
                    resources.dimensionalEnergy >= project.energyCost * mult
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>{project.energyCost * mult} DE</span>
                </span>

                {project.costMatter && (
                  <span
                    className={
                      resources.commonMatter >= project.costMatter * mult
                        ? 'text-slate-300'
                        : 'text-rose-400'
                    }
                  >
                    {project.costMatter * mult} Mat
                  </span>
                )}
                {project.costTech && (
                  <span
                    className={
                      resources.techComponents >= project.costTech * mult
                        ? 'text-slate-300'
                        : 'text-rose-400'
                    }
                  >
                    {project.costTech * mult} Comp
                  </span>
                )}

                {project.inputItems && project.inputItems.length > 0 && (
                  <>
                    <span className="text-slate-600 hidden sm:inline">·</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {project.inputItems.map((req) => {
                        const inv = inventoryItems.find((i) => i.id === req.itemId);
                        const current = inv?.quantity || 0;
                        const needed = req.quantity * mult;
                        const hasEnough = current >= needed;
                        const code = getMaterialCode(req.itemId);

                        return (
                          <button
                            key={req.itemId}
                            type="button"
                            onClick={(e) => {
                              if (onOpenCodexForMaterial) {
                                e.stopPropagation();
                                onOpenCodexForMaterial(req.itemId);
                                sound.playClick();
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                              hasEnough
                                ? 'bg-slate-900 border border-slate-800 text-slate-300'
                                : 'bg-rose-950/40 border border-rose-900/50 text-rose-300 hover:border-rose-700 cursor-pointer'
                            }`}
                            title={hasEnough ? 'Insumo suficiente no estoque' : 'Insumo insuficiente. Clique para ver no Codex'}
                          >
                            [{code}] {inv?.name || getMaterialDisplayName(req.itemId)}: {current}/{needed}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
            {project.isConstructed ? (
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Instalado na Torre</span>
              </span>
            ) : (
              <button
                onClick={() => handleExecuteProject(project)}
                disabled={!affordable}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  affordable
                    ? isModule
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <span>
                  {project.kind === 'component'
                    ? `Forjar Peça${mult > 1 ? ` (${mult}x)` : ''}`
                    : project.kind === 'tool'
                    ? `Fabricar Ferramenta${mult > 1 ? ` (${mult}x)` : ''}`
                    : 'Construir Módulo'}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                setExpandedProjectId(isExpanded ? null : project.id);
                sound.playClick();
              }}
              className="p-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              title={isExpanded ? 'Recolher detalhes' : 'Ver detalhes do projeto'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2.5 text-xs">
            <p className="text-slate-300 leading-relaxed font-sans">{project.description}</p>

            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Classificação:</span>
                <span className="text-sky-300 font-bold uppercase">{project.subCategory}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Efeito Permanente/Ativo:</span>
                <span className="text-emerald-300 font-bold">{project.effectBadge}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};
