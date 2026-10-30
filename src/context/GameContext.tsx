/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  GameMode,
  PlayerResources,
  TowerState,
  BaseSector,
  BaseSectorId,
  InventoryItem,
  UniverseId,
  UniverseInfo,
  CircuitNode,
  AutonomousModule,
  TechUpgrade,
  DefenseModuleDef,
  PlacedModule,
  ModuleType,
  RoguelikeUpgrade,
  ExpeditionCargo,
  SectorType,
  ExpeditionPhase,
  SkillType,
  CollectorState,
  CollectorId,
  ProcessingRecipe,
  AutomationUpgrade,
  CombatArchetypeId,
  StorageCompartment,
  CombatCurrencies,
  TacticalCost,
} from '../types/game';
import { sound } from '../utils/audio';
import { generateUniverseCircuitNodes } from '../game/CircuitMatrix';
import {
  GAME_MATERIALS,
  GAME_RECIPES,
  GAME_ARCHETYPES,
  GAME_UNIVERSES,
  GAME_CIRCUITS,
  GAME_SECTORS,
  GAME_BALANCE,
  ConfigRecipe,
} from '../config';
import { LEGACY_MATERIAL_ID_MAP } from '../utils/materials';

// Default defense module definitions with explicit roles, combat stats, durability (HP) and Hex AoE
export const DEFAULT_MODULE_DEFS: Record<ModuleType, DefenseModuleDef> = {
  pulse_cannon: {
    type: 'pulse_cannon',
    code: 'MK-3001',
    name: 'Canhão de Pulso Interceptor',
    role: 'Interceptador Rápido · Cadência Alta',
    description: 'Bateria de pulso rápido com mira orientável em 360°. Excelente contra hordas rápidas e caçadores invasores.',
    baseCost: 24,
    baseHp: 150,
    baseDamage: 26,
    baseRange: 16,
    baseFireRate: 2.4,
    aoeHexRadius: 1,
    color: '#06b6d4',
    unlockCostData: 0,
    unlocked: true,
    tacticalSpecialty: 'Dano balístico contínuo anti-enxame com alta cadência.',
    tacticalCost: { nanoMatter: 24, microCircuits: 2, tacticalData: 0, dimensionalMatrix: 0 },
  },
  beam_cruiser: {
    type: 'beam_cruiser',
    code: 'MK-3002',
    name: 'Cruzeiro de Feixe Focado',
    role: 'Cruzador Pesado · Raio Laser Térmico',
    description: 'Raio laser contínuo de alta temperatura. Derrete alvos blindados pesados e quebra escudos de cerco.',
    baseCost: 36,
    baseHp: 160,
    baseDamage: 48,
    baseRange: 20,
    baseFireRate: 1.0,
    aoeHexRadius: 1,
    color: '#f59e0b',
    unlockCostData: 20,
    unlocked: false,
    tacticalSpecialty: 'Feixe contínuo que ignora parte da resistência de alvos blindados.',
    tacticalCost: { nanoMatter: 36, microCircuits: 5, tacticalData: 1, dimensionalMatrix: 0 },
    craftCostItems: [
      { itemId: 'mat.copper_wire', quantity: 4 },
      { itemId: 'mat.rough_glass', quantity: 2 },
      { itemId: 'part.connector', quantity: 2 },
    ],
  },
  plasma_battery: {
    type: 'plasma_battery',
    code: 'MK-3003',
    name: 'Bateria de Plasma Radial',
    role: 'Artilharia Orbital · Dano em Área Radial',
    description: 'Dispara morteiros pesados de plasma com detonação em área. Ao ser destruída por inimigos, detona em sobrecarga causando 240 de dano radial em 2 hexágonos!',
    baseCost: 48,
    baseHp: 180,
    baseDamage: 80,
    baseRange: 22,
    baseFireRate: 0.65,
    aoeHexRadius: 2,
    color: '#a855f7',
    unlockCostData: 35,
    unlocked: false,
    tacticalSpecialty: 'Explosão em 2 hexágonos ao atacar e sobrecarga devastadora ao ser destruída.',
    tacticalCost: { nanoMatter: 48, microCircuits: 8, tacticalData: 2, dimensionalMatrix: 0 },
    craftCostItems: [
      { itemId: 'mat.iron_sheet', quantity: 4 },
      { itemId: 'raw.hydrogen_gas', quantity: 4 },
      { itemId: 'part.gear_small', quantity: 2 },
    ],
  },
  flux_harvester: {
    type: 'flux_harvester',
    code: 'MK-3004',
    name: 'Vórtice Magnético & Coletor',
    role: 'Refinaria Magnética · Vórtice & Matéria',
    description: 'Emite um vórtice gravitacional num raio de 2 hexágonos que desacelera invasores próximos (-30% velocidade) e magnetiza espólios do vácuo.',
    baseCost: 30,
    baseHp: 140,
    baseDamage: 12,
    baseRange: 18,
    baseFireRate: 0.5,
    aoeHexRadius: 2,
    color: '#10b981',
    unlockCostData: 25,
    unlocked: false,
    tacticalSpecialty: 'Campo desacelerador de 2 hexágonos em área e drenagem contínua de recursos.',
    tacticalCost: { nanoMatter: 30, microCircuits: 4, tacticalData: 0, dimensionalMatrix: 0 },
    craftCostItems: [
      { itemId: 'mat.copper_ingot', quantity: 4 },
      { itemId: 'mat.iron_bar', quantity: 2 },
      { itemId: 'part.connector', quantity: 2 },
    ],
  },
  missile_launcher: {
    type: 'missile_launcher',
    code: 'MK-3005',
    name: 'Bateria de Micro-Mísseis Guiados',
    role: 'Salva Balística · Mísseis Teleguiados',
    description: 'Dispara salvas de micro-mísseis teleguiados em trajetória curva com rastro de fumaça e explosões em cadeia. Fragata de longo alcance com fuselagem leve.',
    baseCost: 42,
    baseHp: 110,
    baseDamage: 65,
    baseRange: 24,
    baseFireRate: 0.9,
    aoeHexRadius: 1,
    color: '#f97316',
    unlockCostData: 40,
    unlocked: false,
    tacticalSpecialty: 'Mísseis velozes teleguiados de longo alcance com alta letalidade.',
    tacticalCost: { nanoMatter: 42, microCircuits: 6, tacticalData: 2, dimensionalMatrix: 0 },
    craftCostItems: [
      { itemId: 'mat.iron_sheet', quantity: 4 },
      { itemId: 'raw.oxygen_mix', quantity: 4 },
      { itemId: 'part.fastener', quantity: 4 },
    ],
  },
  tesla_coil: {
    type: 'tesla_coil',
    code: 'MK-3006',
    name: 'Torre Tesla Criogênica',
    role: 'Descarga Elétrica · Choque em Cadeia',
    description: 'Descarrega arcos elétricos ionizados de alta voltagem que saltam em cadeia entre até 3 inimigos num raio de 2 hexágonos e congelam alvos.',
    baseCost: 45,
    baseHp: 210,
    baseDamage: 52,
    baseRange: 19,
    baseFireRate: 1.2,
    aoeHexRadius: 2,
    color: '#38bdf8',
    unlockCostData: 35,
    unlocked: false,
    tacticalSpecialty: 'Relâmpagos em arco em 2 hexágonos que congelam e desaceleram alvos por 2s.',
    tacticalCost: { nanoMatter: 45, microCircuits: 7, tacticalData: 2, dimensionalMatrix: 0 },
    craftCostItems: [
      { itemId: 'mat.copper_wire', quantity: 6 },
      { itemId: 'raw.oxygen_mix', quantity: 3 },
      { itemId: 'part.connector', quantity: 3 },
    ],
  },
  railgun_bastion: {
    type: 'railgun_bastion',
    code: 'MK-3007',
    name: 'Bastião Blindado Railgun',
    role: 'Tanque Blindado · Sniper Hiper-Penetrante',
    description: 'Bastião com blindagem maciça reforçada de 480 HP! Funciona como linha de frente pesada absorvendo ataques inimigos enquanto seu acelerador de massa perfura fileiras inteiras de invasores.',
    baseCost: 65,
    baseHp: 480,
    baseDamage: 120,
    baseRange: 30,
    baseFireRate: 0.45,
    aoeHexRadius: 1,
    color: '#22c55e',
    unlockCostData: 60,
    unlocked: false,
    tacticalSpecialty: 'Alta blindagem defensiva (480 HP) e perfuração linear completa através de múltiplos alvos.',
    tacticalCost: { nanoMatter: 65, microCircuits: 12, tacticalData: 4, dimensionalMatrix: 1 },
    craftCostItems: [
      { itemId: 'mat.iron_sheet', quantity: 6 },
      { itemId: 'mat.copper_wire', quantity: 4 },
      { itemId: 'part.fastener', quantity: 6 },
    ],
  },
  nanobot_drone: {
    type: 'nanobot_drone',
    code: 'MK-3008',
    name: 'Hangar de Drones & Reparo Aliado',
    role: 'Suporte Vital · Regenerador em Área',
    description: 'Pulsa ondas naníticas em um raio de 2 hexágonos a cada 2.5s, restaurando +25 HP de todas as embarcações aliadas vizinhas e +15 HP na Cidadela Central.',
    baseCost: 55,
    baseHp: 220,
    baseDamage: 15,
    baseRange: 15,
    baseFireRate: 0.8,
    aoeHexRadius: 2,
    color: '#4ade80',
    unlockCostData: 30,
    unlocked: false,
    tacticalSpecialty: 'Cura em área de 2 hexágonos (+25 HP para aliados) e regeneração contínua da Torre.',
    tacticalCost: { nanoMatter: 55, microCircuits: 10, tacticalData: 3, dimensionalMatrix: 1 },
    craftCostItems: [
      { itemId: 'mat.recovered_polymer', quantity: 4 },
      { itemId: 'part.circuit_scrap', quantity: 3 },
      { itemId: 'part.fastener', quantity: 4 },
    ],
  },
};

// Initial Expandable Base Sectors (Começam bloqueados, exceto o Comando e Reator!)
export const INITIAL_BASE_SECTORS: Record<BaseSectorId, BaseSector> = {
  command: {
    id: 'command',
    name: 'Centro de Comando Primário',
    category: 'core',
    level: 1,
    maxLevel: 5,
    installed: true,
    status: 'operational',
    description: 'Ponte de comando central. Controla telemetria, estoque, silos de carga e navegação espacial.',
    unlockedFeature: 'Status vital da torre e controle de expedições dimensionais.',
    costMatter: 0,
    costTech: 0,
    costDimMat: 0,
    hp: 1000,
    maxHp: 1000,
  },
  inventory: {
    id: 'inventory',
    name: 'Hangar de Estoque & Silos',
    category: 'logistics',
    level: 1,
    maxLevel: 5,
    installed: true,
    status: 'operational',
    description: 'Armazém modular e compartimentos estanques para produtos químicos, ligas e lingotes.',
    unlockedFeature: 'Capacidade de carga expandida através de silos modulares.',
    costMatter: 0,
    costTech: 0,
    costDimMat: 0,
    hp: 400,
    maxHp: 400,
  },
  circuits: {
    id: 'circuits',
    name: 'Matriz de Circuitos Multiversais',
    category: 'science',
    level: 1,
    maxLevel: 5,
    installed: true,
    status: 'operational',
    description: 'Laboratório de cálculo quântico capaz de sintonizar frequências dimensionais e criar builds complexas.',
    unlockedFeature: 'Árvore de Circuitos e nós de passivas expansíveis por universos.',
    costMatter: 0,
    costTech: 0,
    costDimMat: 0,
    hp: 350,
    maxHp: 350,
  },
  equipment: {
    id: 'equipment',
    name: 'Oficina de Equipamentos Autônomos',
    category: 'military',
    level: 1,
    maxLevel: 4,
    installed: true,
    status: 'operational',
    description: 'Linha de montagem para módulos de suporte automáticos (EMP, Flak, Nanobots, Laser Orbital).',
    unlockedFeature: 'Slots de Equipamentos Autônomos que disparam automaticamente.',
    costMatter: 0,
    costTech: 0,
    costDimMat: 0,
    hp: 450,
    maxHp: 450,
  },
  refinery: {
    id: 'refinery',
    name: 'Refinaria & Fracionador Criogênico',
    category: 'logistics',
    level: 1,
    maxLevel: 5,
    installed: true,
    status: 'operational',
    description: 'Sistemas criogênicos e térmicos de processamento de gases e minérios espaciais.',
    unlockedFeature: 'Fracionamento de gases e fundição térmica de lingotes.',
    costMatter: 0,
    costTech: 0,
    costDimMat: 0,
    hp: 350,
    maxHp: 350,
  },
  research: {
    id: 'research',
    name: 'Centro de Pesquisa & Engenharia',
    category: 'science',
    level: 1,
    maxLevel: 5,
    installed: true,
    status: 'operational',
    description: 'Setor de inovação tecnológica permanente para calibragem de frotas e defesas da torre.',
    unlockedFeature: 'Pesquisas avançadas de infraestrutura e eficácia bélica.',
    costMatter: 0,
    costTech: 0,
    costDimMat: 0,
    hp: 400,
    maxHp: 400,
  },
  shields: {
    id: 'shields',
    name: 'Matriz de Escudos Defensivos',
    category: 'military',
    level: 1,
    maxLevel: 5,
    installed: true,
    status: 'operational',
    description: 'Projetor de cúpula de força hexagonal que absorve impactos diretos e defende a fuselagem.',
    unlockedFeature: 'Cria cúpula de escudo protetor com regeneração automática contínua.',
    costMatter: 0,
    costTech: 0,
    costDimMat: 0,
    hp: 500,
    maxHp: 500,
  },
  reactor: {
    id: 'reactor',
    name: 'Reator de Fusão Estelar',
    category: 'core',
    level: 1,
    maxLevel: 5,
    installed: true,
    status: 'operational',
    description: 'Célula de energia primordial. Alimenta todos os sistemas elétricos e saltos de portal.',
    unlockedFeature: 'Energia Dimensional para ativação de propulsores e módulos.',
    costMatter: 0,
    costTech: 0,
    costDimMat: 0,
    hp: 600,
    maxHp: 600,
  },
};

// Initial Collectors (Início apenas com Coletor de Sucata operando; Minérios e Gases iniciam bloqueados/offline)
// Initial Collectors: MK-1001 (active), MK-1004 (locked until crafted in Fabricator), MK-2202 (locked until crafted)
export const INITIAL_COLLECTORS: CollectorState[] = [
  {
    id: 'col_debris',
    name: 'Coletor de Sucata Espacial [MK-1001]',
    subsystemName: 'Trator Magnético de Resíduos',
    physicalState: 'solid',
    unit: 'kg',
    currentAmount: 15,
    capacity: GAME_BALANCE.idle.collectorCapacities.debris,
    ratePerSecond: GAME_BALANCE.idle.collectorBaseRates.debris,
    status: 'COLLECTING',
    isAutomated: false,
    isUnlocked: true,
    icon: 'Layers',
    bufferItems: [
      { id: 'scrap.structural', name: 'Sucata Estrutural [PD-1201]', amount: 60, unit: 'kg', yieldItemId: 'scrap.structural' },
      { id: 'scrap.electrical', name: 'Sucata Elétrica [PD-1202]', amount: 40, unit: 'kg', yieldItemId: 'scrap.electrical' },
      { id: 'scrap.mechanical', name: 'Sucata Mecânica [PD-1203]', amount: 30, unit: 'kg', yieldItemId: 'scrap.mechanical' },
      { id: 'scrap.electronic', name: 'Sucata Eletrônica [PD-1204]', amount: 20, unit: 'kg', yieldItemId: 'scrap.electronic' },
    ],
  },
  {
    id: 'col_minerals',
    name: 'Coletor de Minério [MK-1004]',
    subsystemName: 'Garra Magnética de Mineração',
    physicalState: 'solid',
    unit: 'kg',
    currentAmount: 0,
    capacity: GAME_BALANCE.idle.collectorCapacities.minerals,
    ratePerSecond: GAME_BALANCE.idle.collectorBaseRates.minerals,
    status: 'OFFLINE',
    isAutomated: false,
    isUnlocked: false,
    unlockHint: 'Requer fabricação no Construtor [MK-1003]',
    icon: 'Layers',
    bufferItems: [
      { id: 'raw.ferrous_regolith', name: 'Regolito Ferrífero [PD-1001]', amount: 70, unit: 'kg', yieldItemId: 'raw.ferrous_regolith' },
      { id: 'raw.copper_ore', name: 'Minério de Cobre [PD-1002]', amount: 45, unit: 'kg', yieldItemId: 'raw.copper_ore' },
      { id: 'raw.silica_sand', name: 'Areia Silicatada [PD-1010]', amount: 35, unit: 'kg', yieldItemId: 'raw.silica_sand' },
      { id: 'raw.graphite', name: 'Grafita Espacial [PD-1012]', amount: 20, unit: 'kg', yieldItemId: 'raw.graphite' },
    ],
  },
  {
    id: 'col_gases',
    name: 'Coletor de Gases Estelares [MK-2202]',
    subsystemName: 'Sifão Criogênico de Vácuo',
    physicalState: 'gas',
    unit: 'L',
    currentAmount: 0,
    capacity: GAME_BALANCE.idle.collectorCapacities.gases,
    ratePerSecond: GAME_BALANCE.idle.collectorBaseRates.gases,
    status: 'OFFLINE',
    isAutomated: false,
    isUnlocked: false,
    unlockHint: 'Requer fabricação no Construtor [MK-1003]',
    icon: 'Wind',
    bufferItems: [
      { id: 'raw.hydrogen_gas', name: 'Hidrogênio Bruto [PD-1105]', amount: 75, unit: 'L', yieldItemId: 'raw.hydrogen_gas' },
      { id: 'raw.oxygen_mix', name: 'Mistura Oxigenada [PD-1108]', amount: 40, unit: 'L', yieldItemId: 'raw.oxygen_mix' },
      { id: 'raw.helium_mix', name: 'Mistura com Hélio [PD-1106]', amount: 15, unit: 'L', yieldItemId: 'raw.helium_mix' },
    ],
  },
];

// Initial Inventory Items: mapped directly from GAME_MATERIALS (with starter scrap kit from Section 5.2)
// Starter kit: 4 scrap.structural (PD-1201), 2 scrap.electrical (PD-1202), 2 scrap.mechanical (PD-1203), 1 scrap.electronic (PD-1204)
export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = GAME_MATERIALS.map((mat) => {
  let startingQty = 0;
  if (mat.id === 'scrap.structural' || mat.code === 'PD-1201') startingQty = 4;
  if (mat.id === 'scrap.electrical' || mat.code === 'PD-1202') startingQty = 2;
  if (mat.id === 'scrap.mechanical' || mat.code === 'PD-1203') startingQty = 2;
  if (mat.id === 'scrap.electronic' || mat.code === 'PD-1204') startingQty = 1;
  return {
    id: mat.id,
    code: mat.code,
    name: mat.name,
    type: mat.family as any,
    physicalState: mat.physicalState,
    unit: mat.unit,
    quantity: startingQty,
    unitWeight: mat.unitWeight,
    icon: mat.icon,
    color: mat.color,
    stage: mat.stage as any,
    description: mat.description,
    refineYield: mat.refineYield,
  };
});

// Processing Recipes Catalog (Refining & Foundry with PD-xxxx catalog)
export const INITIAL_PROCESSING_RECIPES: ProcessingRecipe[] = [
  // --- REFINARIA CRIOGÊNICA & GASES ---
  {
    id: 'proc_cryo_all',
    name: 'Drenar & Fracionar Reservatório de Gases [MK-2202]',
    category: 'cryogenic',
    targetCollectorId: 'col_gases',
    inputCollectorCost: 50,
    energyCost: 5,
    tier: 1,
    description: 'Fraciona 50L do coletor de gases em Hidrogênio Bruto [PD-1105], Oxigênio [PD-1108] e Hélio [PD-1106]. Requer Coletor MK-2202 construído.',
    outputItems: [
      { itemId: 'raw.hydrogen_gas', quantity: 20 },
      { itemId: 'raw.oxygen_mix', quantity: 15 },
      { itemId: 'raw.helium_mix', quantity: 5 },
    ],
    unlocked: true,
  },
  {
    id: 'proc_cryo_h2',
    name: 'Purificar Hidrogênio em Combustível',
    category: 'cryogenic',
    targetCollectorId: 'col_gases',
    inputCollectorCost: 30,
    energyCost: 3,
    tier: 1,
    description: 'Condensa 30L do gás bruto coletado em Hidrogênio purificado [PD-1105]. Requer Coletor MK-2202 construído.',
    outputItems: [{ itemId: 'raw.hydrogen_gas', quantity: 25 }],
    unlocked: true,
  },
  {
    id: 'proc_cryo_o2',
    name: 'Purificar Oxigênio Pressurizado',
    category: 'cryogenic',
    targetCollectorId: 'col_gases',
    inputCollectorCost: 30,
    energyCost: 3,
    tier: 1,
    description: 'Purifica 30L de mistura oxigenada [PD-1108] para suporte de vida. Requer Coletor MK-2202 construído.',
    outputItems: [{ itemId: 'raw.oxygen_mix', quantity: 25 }],
    unlocked: true,
  },

  // --- FORNO DE RECUPERAÇÃO TÉRMICA [MK-2001] ---
  {
    id: 'proc_furnace_all',
    name: 'Drenar & Fundir Reservatório de Minérios [MK-2001]',
    category: 'furnace',
    targetCollectorId: 'col_minerals',
    inputCollectorCost: 50,
    energyCost: 8,
    tier: 1,
    description: 'Redução térmica de 50kg de minérios asteroidais em Lingotes de Ferro [PD-3101], Cobre [PD-3102] e Sílica [PD-1010]. Requer Broca MK-1004 construída.',
    outputItems: [
      { itemId: 'mat.iron_ingot', quantity: 18 },
      { itemId: 'mat.copper_ingot', quantity: 12 },
      { itemId: 'raw.silica_sand', quantity: 8 },
    ],
    unlocked: true,
  },
  {
    id: 'proc_furnace_iron',
    name: 'Fundir Lingotes de Ferro Primário [RC-2001]',
    category: 'furnace',
    inputItems: [
      { itemId: 'raw.ferrous_regolith', quantity: 3 },
      { itemId: 'scrap.structural', quantity: 1 },
    ],
    energyCost: 4,
    tier: 1,
    description: 'Funde regolito ferrífero [PD-1001] e sucata a 1500°C gerando lingotes de ferro estrutural [PD-3101].',
    outputItems: [{ itemId: 'mat.iron_ingot', quantity: 3 }],
    unlocked: true,
  },
  {
    id: 'proc_furnace_copper',
    name: 'Fundir Lingotes de Cobre Puro [RC-2002]',
    category: 'furnace',
    inputItems: [
      { itemId: 'raw.copper_ore', quantity: 3 },
    ],
    energyCost: 4,
    tier: 1,
    description: 'Funde minério de cobre [PD-1002] no forno gerando lingotes de cobre condutor [PD-3102].',
    outputItems: [{ itemId: 'mat.copper_ingot', quantity: 2 }],
    unlocked: true,
  },

  // --- DESMONTADOR & SEPARADOR [MK-1002] ---
  {
    id: 'proc_dismantle_all',
    name: 'Drenar Reservatório de Sucata para Estoque [MK-1001]',
    category: 'dismantler',
    targetCollectorId: 'col_debris',
    energyCost: 2,
    tier: 1,
    description: 'Descarrega a sucata espacial coletada diretamente para os silos de estoque para triagem manual.',
    outputItems: [
      { itemId: 'scrap.structural', quantity: 6 },
      { itemId: 'scrap.electrical', quantity: 4 },
      { itemId: 'scrap.mechanical', quantity: 3 },
      { itemId: 'scrap.electronic', quantity: 2 },
    ],
    unlocked: true,
  },

  // --- LIGAS E BENEFICIAMENTO AVANÇADO ---
  {
    id: 'craft_iron_sheet',
    name: 'Laminar Chapas de Ferro [RC-2004]',
    category: 'foundry',
    tier: 1,
    energyCost: 4,
    description: 'Conforma lingotes de ferro [PD-3101] no laminador [MK-2003] em chapas reforçadas [PD-3104].',
    inputItems: [{ itemId: 'mat.iron_ingot', quantity: 2 }],
    outputItems: [{ itemId: 'mat.iron_sheet', quantity: 2 }],
    unlocked: true,
  },
  {
    id: 'craft_copper_wire',
    name: 'Trefilar Fios Condutores de Cobre [RC-2005]',
    category: 'foundry',
    tier: 1,
    energyCost: 4,
    description: 'Estiramento mecânico de lingotes de cobre [PD-3102] na trefiladora [MK-2002] em fios [PD-3105].',
    inputItems: [{ itemId: 'mat.copper_ingot', quantity: 2 }],
    outputItems: [{ itemId: 'mat.copper_wire', quantity: 3 }],
    unlocked: true,
  },
  {
    id: 'craft_plasma_cell',
    name: 'Sintetizar Célula de Plasma Denso',
    category: 'foundry',
    tier: 2,
    energyCost: 10,
    description: 'Condensa Hélio com Hidrogênio [PD-1105] sob alta pressão gerando plasma ionizado [PD-7006].',
    inputItems: [
      { itemId: 'raw.helium_mix', quantity: 3 },
      { itemId: 'raw.hydrogen_gas', quantity: 3 },
    ],
    outputItems: [{ itemId: 'mat.dense_plasma', quantity: 1 }],
    unlocked: true,
  },
];

// Expandable Storage Compartments (Silos, Cryo Tanks, Modular Compartments)
// Rebalanced storage: starts at 400 kg / 300 L / 35.0 m³ with comp_initial for comfortable early-game stockpiling
export const INITIAL_STORAGE_COMPARTMENTS: StorageCompartment[] = [
  {
    id: 'comp_initial',
    code: 'EST-0001',
    name: 'Armazém Central Integrado',
    type: 'modular',
    weightBonus: 400,
    liquidBonus: 300,
    volumeBonus: 35.0,
    built: true,
    costItems: [],
    description: 'Capacidade nativa básica da fuselagem da estação para início de operações.',
  },
  {
    id: 'comp_silo_1',
    code: 'MK-1005',
    name: 'Silo de Carga Pressurizado Alfa',
    type: 'silo',
    weightBonus: 600,
    liquidBonus: 0,
    volumeBonus: 35.0,
    built: false,
    costItems: [
      { itemId: 'mat.recovered_iron', quantity: 6 },
      { itemId: 'part.fastener', quantity: 4 },
    ],
    description: 'Silo blindado de contenção para minérios pesados e sucatas metálicas.',
  },
  {
    id: 'comp_cryo_1',
    code: 'MK-2201',
    name: 'Bateria de Tanques Criogênicos',
    type: 'cryo',
    weightBonus: 0,
    liquidBonus: 600,
    volumeBonus: 35.0,
    built: false,
    costItems: [
      { itemId: 'mat.recovered_copper', quantity: 4 },
      { itemId: 'mat.recovered_polymer', quantity: 3 },
    ],
    description: 'Cilindros de vácuo refrigerados para armazenar fluidos voláteis e gases atmosféricos.',
  },
  {
    id: 'comp_modular_1',
    code: 'MK-1006',
    name: 'Hangar de Carga Modular Expansível',
    type: 'modular',
    weightBonus: 800,
    liquidBonus: 400,
    volumeBonus: 60.0,
    built: false,
    costItems: [
      { itemId: 'mat.iron_sheet', quantity: 4 },
      { itemId: 'part.gear_small', quantity: 2 },
      { itemId: 'part.connector', quantity: 4 },
    ],
    description: 'Extensão estrutural externa com docas mecânicas que expande massivamente todas as capacidades.',
  },
  {
    id: 'comp_vault_deep',
    code: 'MK-1007',
    name: 'Câmara de Contenção de Alta Densidade',
    type: 'modular',
    weightBonus: 1200,
    liquidBonus: 800,
    volumeBonus: 90.0,
    built: false,
    costItems: [
      { itemId: 'mat.iron_sheet', quantity: 6 },
      { itemId: 'mat.copper_wire', quantity: 4 },
      { itemId: 'mat.technical_ceramic', quantity: 3 },
    ],
    description: 'Cofre selado magnético para super-armazenamento de componentes de alta tecnologia.',
  },
];

// Initial Industrial Automation Upgrades
export const INITIAL_AUTOMATION_UPGRADES: AutomationUpgrade[] = [
  {
    id: 'auto_silos',
    name: 'Silos de Carga Pressurizados (+250 kg)',
    description: 'Amplia a capacidade máxima do hangar em +250 kg usando chapas de ferro [PD-3104].',
    costMatter: 80,
    costTech: 8,
    costItems: [
      { itemId: 'mat.iron_sheet', quantity: 3 },
      { itemId: 'part.circuit_scrap', quantity: 2 },
    ],
    installed: false,
    type: 'expanded_silos',
  },
  {
    id: 'auto_cryo_tanks',
    name: 'Bateria de Tanques Criogênicos (+250 Litros)',
    description: 'Adiciona tanques refrigerados que ampliam a capacidade de fluidos e gases em +250 L.',
    costMatter: 90,
    costTech: 10,
    costItems: [
      { itemId: 'mat.iron_sheet', quantity: 2 },
      { itemId: 'mat.recovered_polymer', quantity: 2 },
    ],
    installed: false,
    type: 'cryo_tanks',
  },
  {
    id: 'auto_ore_pipeline',
    name: 'Duto Automatizado de Minérios',
    description: 'Drena automaticamente o Coletor de Minérios diretamente para o Forno quando atinge 80% da capacidade.',
    costMatter: 120,
    costTech: 15,
    costItems: [
      { itemId: 'mat.iron_sheet', quantity: 3 },
      { itemId: 'part.motor_basic', quantity: 1 },
    ],
    installed: false,
    type: 'ore_pipeline',
  },
  {
    id: 'auto_gas_compressor',
    name: 'Compressor Pneumático de Gases',
    description: 'Transfere e separa automaticamente os gases dos coletores para os tanques criogênicos sem intervenção manual.',
    costMatter: 140,
    costTech: 18,
    costItems: [
      { itemId: 'part.circuit_scrap', quantity: 3 },
      { itemId: 'mat.dense_plasma', quantity: 2 },
    ],
    installed: false,
    type: 'gas_compressor',
  },
  {
    id: 'auto_scrap_sorter',
    name: 'Triagem Magnética de Destroços',
    description: 'Desmancha e separa automaticamente sucatas espaciais em blindagem e componentes elétricos continuamente.',
    costMatter: 110,
    costTech: 12,
    costItems: [
      { itemId: 'scrap.structural', quantity: 15 },
      { itemId: 'part.connector', quantity: 4 },
    ],
    installed: false,
    type: 'scrap_sorter',
  },
];

// Universes Configuration
export const UNIVERSES_CONFIG: UniverseInfo[] = [
  {
    id: 'univ_matter',
    name: 'Universo 1: Matéria & Balística',
    subtitle: 'Física Clássica · Canhões Cinéticos · Alta Cadência',
    color: '#38bdf8',
    accentBorder: 'border-cyan-500/40',
    unlocked: true,
    unlockRequirement: 'Disponível na Estação Base',
    description: 'Evolua baterias de canhões, projéteis múltiplos, velocidade de disparo e mineração pesada.',
  },
  {
    id: 'univ_quantum',
    name: 'Universo 2: Frequência Quântica',
    subtitle: 'Energia Pura · Lasers Perfurantes · Células de Fusão',
    color: '#a855f7',
    accentBorder: 'border-purple-500/40',
    unlocked: false,
    unlockRequirement: 'Alcance a Onda 5 na Expedição ou Nível 2 na Matriz de Circuitos',
    description: 'Desbloqueie feixes térmicos, amplificação crítica e recarga autônoma ultra-rápida.',
  },
  {
    id: 'univ_void',
    name: 'Universo 3: O Vazio Abissal',
    subtitle: 'Matéria Escura · Nanobots · Buracos Negros Gravitacionais',
    color: '#f43f5e',
    accentBorder: 'border-rose-500/40',
    unlocked: false,
    unlockRequirement: 'Alcance a Onda 10 na Expedição ou Nível 3 na Matriz de Circuitos',
    description: 'Poder destrutivo dimensional, canibalização de matéria de inimigos e auto-reparo nanítico supremo.',
  },
];

// Multiverse Circuit Nodes (Format of square connected microchips lattice as drawn by the user)
export const MULTIVERSE_CIRCUIT_NODES: CircuitNode[] = [
  ...generateUniverseCircuitNodes('univ_matter'),
  ...generateUniverseCircuitNodes('univ_quantum'),
  ...generateUniverseCircuitNodes('univ_void'),
];

// Autonomous Modules (Habilidades Automáticas que disparam sozinhas)
export const INITIAL_AUTONOMOUS_MODULES: AutonomousModule[] = [
  {
    id: 'auto_emp',
    name: 'Disparador EMP Autônomo',
    role: 'Controle de Multidão · Pulso Eletromagnético',
    description: 'Descarrega automaticamente uma onda de choque que paralisa todos os alvos por 4s a cada 20s.',
    interval: 20,
    lastFiredTime: 0,
    progressPct: 0,
    energyCost: 10,
    unlocked: true,
    equipped: true,
    slotIndex: 0,
    costMatter: 0,
    costTech: 0,
    costCombatData: 0,
    category: 'tactical',
    icon: 'Zap',
  },
  {
    id: 'auto_flak',
    name: 'Canhão Flak de Disparo Rápido',
    role: 'Artilharia Automática · Salva de Fragmentos',
    description: 'Dispara automaticamente uma salva concentrada de 6 projéteis de alta velocidade a cada 8s.',
    interval: 8,
    lastFiredTime: 0,
    progressPct: 0,
    energyCost: 5,
    unlocked: false,
    equipped: false,
    slotIndex: -1,
    costMatter: 140,
    costTech: 6,
    costCombatData: 10,
    category: 'offensive',
    icon: 'Crosshair',
  },
  {
    id: 'auto_orbital',
    name: 'Laser Orbital Aniquilador',
    role: 'Vaporizador Pesado · Feixe Térmico',
    description: 'Focaliza automaticamente o alvo de maior HP e dispara um feixe de plasma devastador a cada 16s.',
    interval: 16,
    lastFiredTime: 0,
    progressPct: 0,
    energyCost: 15,
    unlocked: false,
    equipped: false,
    slotIndex: -1,
    costMatter: 220,
    costTech: 10,
    costCombatData: 18,
    category: 'offensive',
    icon: 'Flame',
  },
  {
    id: 'auto_nano',
    name: 'Matriz Nanítica de Reparo Contínuo',
    role: 'Suporte Vital · Auto-Cura Sistêmica',
    description: 'Injeta enxames de nanorrobôs reparadores que reconstroem +50 HP no Núcleo a cada 12s.',
    interval: 12,
    lastFiredTime: 0,
    progressPct: 0,
    energyCost: 8,
    unlocked: false,
    equipped: false,
    slotIndex: -1,
    costMatter: 180,
    costTech: 8,
    costCombatData: 14,
    category: 'defensive',
    icon: 'Activity',
  },
  {
    id: 'auto_phase',
    name: 'Gerador de Escudo de Fase',
    role: 'Defesa Absoluta · Invulnerabilidade Periódica',
    description: 'Ativa automaticamente uma barreira quântica impenetrável por 3.5s a cada 24s.',
    interval: 24,
    lastFiredTime: 0,
    progressPct: 0,
    energyCost: 12,
    unlocked: false,
    equipped: false,
    slotIndex: -1,
    costMatter: 260,
    costTech: 12,
    costCombatData: 22,
    category: 'defensive',
    icon: 'Shield',
  },
];

// Module Material Affiliation Map for Roguelike Material Synergies
export const MODULE_MATERIAL_MAP: Record<ModuleType, ('copper' | 'iron_steel' | 'silica' | 'polymer' | 'all')[]> = {
  pulse_cannon: ['iron_steel', 'copper', 'all'],
  beam_cruiser: ['silica', 'copper', 'all'],
  plasma_battery: ['iron_steel', 'all'],
  flux_harvester: ['copper', 'iron_steel', 'all'],
  missile_launcher: ['iron_steel', 'polymer', 'all'],
  tesla_coil: ['copper', 'polymer', 'all'],
  railgun_bastion: ['iron_steel', 'copper', 'all'],
  nanobot_drone: ['polymer', 'silica', 'all'],
};

// Default escalated modules for active combat squadron (starts with unlocked pulse_cannon, max 6)
export const DEFAULT_ESCALATED_MODULES: ModuleType[] = ['pulse_cannon'];

// Strategic Roguelike Tactical Upgrades Pool
// Categorized strictly into: 'material' | 'position' | 'timing' | 'general'
export const ROGUELIKE_POOL: RoguelikeUpgrade[] = [
  // --- CATEGORIA: MATERIAIS ---
  {
    id: 'rogue_mat_copper',
    name: 'Supercondução de Cobre [PD-3104]',
    category: 'material',
    targetMaterial: 'copper',
    rarity: 'rare',
    description: '+35% de Cadência de Disparo em todas as embarcações com fiação ou ligas de Cobre [PD-3104/3102].',
    flavor: 'Filamentos atômicos sem perda resistiva garantem recarga elétrica ultra-veloz dos canhões.',
    effect: { stat: 'fireRate', value: 0.35 },
  },
  {
    id: 'rogue_mat_iron',
    name: 'Blindagem de Ferro Laminado [PD-3105]',
    category: 'material',
    targetMaterial: 'iron_steel',
    rarity: 'rare',
    description: '+45% de HP Máximo e +20% de Dano cinético em módulos estruturados em Ferro e Chapas Reforçadas.',
    flavor: 'Plaquetas de ferro espacial forjadas a 1500°C absorvem estilhaços de alta energia.',
    effect: { stat: 'hullHp', value: 0.45 },
  },
  {
    id: 'rogue_mat_silica',
    name: 'Prismas Ópticos de Sílica [PD-3106]',
    category: 'material',
    targetMaterial: 'silica',
    rarity: 'rare',
    description: '+30% de Alcance de combate e +25% de penetração em módulos com lentes e circuitos de Sílica.',
    flavor: 'Vidro purificado de alta refração colima fótons em feixes ultra-densos de longo alcance.',
    effect: { stat: 'range', value: 0.3 },
  },
  {
    id: 'rogue_mat_polymer',
    name: 'Nanites & Polímeros Reativos [PD-2003]',
    category: 'material',
    targetMaterial: 'polymer',
    rarity: 'epic',
    description: '+35% de Raio de Efeito Hexagonal e regeneração contínua de integridade para módulos com Polímeros.',
    flavor: 'Cadeias moleculares elastoméricas que se auto-reparam ao entrar em contato com vácuo.',
    effect: { stat: 'healPower', value: 0.35 },
  },
  {
    id: 'rogue_mat_all',
    name: 'Harmonia Metalúrgica Universal',
    category: 'material',
    targetMaterial: 'all',
    rarity: 'epic',
    description: '+25% de HP Máximo e +15% de Dano em todas as embarcações construídas com ligas refinadas.',
    flavor: 'Fusão perfeita de elementos básicos da tabela periódica aplicada aos chassis da frota.',
    effect: { stat: 'hullHp', value: 0.25 },
  },

  // --- CATEGORIA: POSICIONAMENTO ---
  {
    id: 'rogue_pos_outer',
    name: 'Vanguarda do Perímetro Externo',
    category: 'position',
    targetRingZone: 'outer',
    rarity: 'rare',
    description: '+40% de Dano e +20% de velocidade de projétil para embarcações nos Anéis Externos (8 a 11).',
    flavor: 'A primeira linha de contato recebe suprimento prioritário de munição de alta densidade.',
    effect: { stat: 'damage', value: 0.4 },
  },
  {
    id: 'rogue_pos_mid',
    name: 'Cinturão Tático Intermediário',
    category: 'position',
    targetRingZone: 'mid',
    rarity: 'rare',
    description: '+30% de Cadência e +25% de Raio de Alcance para embarcações no Anel Intermediário (5 a 7).',
    flavor: 'Posicionamento estratégico no arco central maximiza os ângulos de tiro cruzado.',
    effect: { stat: 'fireRate', value: 0.3 },
  },
  {
    id: 'rogue_pos_inner',
    name: 'Baluarte do Núcleo Central',
    category: 'position',
    targetRingZone: 'inner',
    rarity: 'epic',
    description: '+60% de HP Máximo para embarcações nos Anéis Centrais (3 a 4) adjacentes à Cidadela.',
    flavor: 'Rede de blindagem sobreposta ancorada diretamente nos reatores da estação espacial.',
    effect: { stat: 'hullHp', value: 0.6 },
  },
  {
    id: 'rogue_pos_cluster',
    name: 'Doutrina de Falange Adjacente',
    category: 'position',
    targetRingZone: 'cluster',
    rarity: 'rare',
    description: 'Cada módulo ganha +15% de Dano e +15% de HP para cada módulo aliado diretamente vizinho na grade.',
    flavor: 'Embarcações agrupadas compartilham escudos de campo e computadores de bordo em malha.',
    effect: { stat: 'damage', value: 0.15 },
  },

  // --- CATEGORIA: TEMPO ---
  {
    id: 'rogue_time_early',
    name: 'Impulso Alfa de Vanguarda (Primeiros 20s)',
    category: 'timing',
    timingCondition: 'early_wave',
    rarity: 'rare',
    description: 'Nos primeiros 20 segundos de cada onda, todos os módulos disparam com +60% de Cadência!',
    flavor: 'Capacitores sobrecarregados descarregam salvas devastadoras na aproximação dos batedores inimigos.',
    effect: { stat: 'fireRate', value: 0.6 },
  },
  {
    id: 'rogue_time_late',
    name: 'Sobrecarga de Cerco Prolongado (>30s)',
    category: 'timing',
    timingCondition: 'late_wave',
    rarity: 'epic',
    description: 'Após 30s de combate ininterrupto, as armas superaquecem concedendo +45% de Dano e +25% Crítico.',
    flavor: 'Fusão induzida no reator converte o calor excessivo em pura energia cinética letal.',
    effect: { stat: 'damage', value: 0.45 },
  },
  {
    id: 'rogue_time_sustained',
    name: 'Aquecimento Balístico Progressivo',
    category: 'timing',
    timingCondition: 'sustained_fire',
    rarity: 'common',
    description: '+3% de Cadência por segundo de combate ininterrupto (até +50%), resetando ao vencer a onda.',
    flavor: 'Aceleração giroscópica contínua dos motores e alimentadores de munição.',
    effect: { stat: 'fireRate', value: 0.5 },
  },
  {
    id: 'rogue_time_periodic',
    name: 'Pulso de Ressonância Periódica (a cada 10s)',
    category: 'timing',
    timingCondition: 'periodic',
    rarity: 'epic',
    description: 'A cada 10 segundos na onda, todos os módulos emitem um pulso radial eletromagnético de 80 de dano.',
    flavor: 'Sincronização harmônica das baterias gera descargas espontâneas no vácuo espacial.',
    effect: { stat: 'chainDamage', value: 0.4 },
  },

  // --- CATEGORIA: GERAL ---
  {
    id: 'rogue_gen_firepower',
    name: 'Calibração Balística Universal',
    category: 'general',
    rarity: 'common',
    description: '+25% de Dano Global e +15% de Alcance para toda e qualquer frota ativa na grade.',
    flavor: 'Algoritmos aperfeiçoados de cálculo balístico instalados no firmware de mira geral.',
    effect: { stat: 'damage', value: 0.25 },
  },
  {
    id: 'rogue_gen_crit',
    name: 'Computador Tático de Ponto Crítico',
    category: 'general',
    rarity: 'rare',
    description: '+20% de Chance Crítica universal com multiplicador de 2.5x de dano balístico.',
    flavor: 'Identificação automática de pontos fracos estruturais nos cascos invasores.',
    effect: { stat: 'critChance', value: 0.2 },
  },
  {
    id: 'rogue_gen_salvage',
    name: 'Condutores de Sucata Dimensional',
    category: 'general',
    rarity: 'common',
    description: '+50% de recursos, sucatas e dados de combate coletados ao destruir naves invasoras.',
    flavor: 'Pás magnéticas que atraem todo o entulho resultante das explosões inimigas.',
    effect: { stat: 'harvest', value: 0.5 },
  },
  {
    id: 'rogue_gen_hull',
    name: 'Reforço Estrutural Supremo',
    category: 'general',
    rarity: 'legendary',
    description: '+50% de HP Máximo para todas as frotas e regeneração de 15% de integridade ao encerrar a onda.',
    flavor: 'Nanomateriais compósitos tecidos diretamente na blindagem primária das naves.',
    effect: { stat: 'hullHp', value: 0.5 },
  },
];

interface GameContextType {
  mode: GameMode;
  setMode: (m: GameMode) => void;
  resources: PlayerResources;
  setResources: React.Dispatch<React.SetStateAction<PlayerResources>>;
  tower: TowerState;
  setTower: React.Dispatch<React.SetStateAction<TowerState>>;
  // Base Sectors System
  baseSectors: Record<BaseSectorId, BaseSector>;
  setBaseSectors: React.Dispatch<React.SetStateAction<Record<BaseSectorId, BaseSector>>>;
  installBaseSector: (id: BaseSectorId) => boolean;
  upgradeBaseSector: (id: BaseSectorId) => boolean;
  // Inventory System & Dual Storage
  inventoryItems: InventoryItem[];
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  discardInventoryItem: (itemId: string, quantity?: number) => void;
  refineInventoryItem: (itemId: string) => boolean;
  recycleAllOres: () => boolean;
  storageCapacity: number;
  storageUsed: number;
  gasStorageCapacity: number;
  gasStorageUsed: number;
  volumeCapacity: number;
  volumeUsed: number;
  isStorageFull: boolean;
  canAcceptCargo: (addWeightKg?: number, addLiquidL?: number) => { allowed: boolean; reason?: string };
  // Storage Compartments (Silos, Cryo, Modular)
  storageCompartments: StorageCompartment[];
  buildStorageCompartment: (compartmentId: string) => boolean;
  repairTowerHull: () => boolean;
  // Collectors & Industrial Processing
  collectors: CollectorState[];
  setCollectors: React.Dispatch<React.SetStateAction<CollectorState[]>>;
  processCollector: (collectorId: CollectorId, processAmount?: number) => boolean;
  recipes: ProcessingRecipe[];
  craftProcessingRecipe: (recipeId: string, multiplier?: number) => boolean;
  defenseModuleDefs: Record<ModuleType, DefenseModuleDef>;
  craftDefenseModule: (type: ModuleType) => boolean;
  automationUpgrades: AutomationUpgrade[];
  installAutomationUpgrade: (upgradeId: string) => boolean;
  // Combat Archetypes & Codex
  activeArchetypeId: CombatArchetypeId;
  setActiveArchetypeId: (id: CombatArchetypeId) => void;
  showCodex: boolean;
  setShowCodex: (show: boolean) => void;
  codexInitialMaterialId?: string;
  openCodexForMaterial: (matId: string) => void;
  // Multiverse Circuit Tree
  universes: UniverseInfo[];
  circuitNodes: CircuitNode[];
  activeUniverseId: UniverseId;
  setActiveUniverseId: (u: UniverseId) => void;
  unlockCircuitNode: (id: string) => boolean;
  towerAttackCount: number; // Number of simultaneous shots tower fires
  // Autonomous Equipment Modules (Automated, non-playable)
  autonomousModules: AutonomousModule[];
  craftAutonomousModule: (id: string) => boolean;
  equipAutonomousModule: (id: string, slotIndex: number) => boolean;
  unequipAutonomousModule: (id: string) => void;
  activeSkillEffects: Record<SkillType, number>;
  triggerActiveSkill: (id: SkillType) => boolean;
  // Legacy compatibility props
  techUpgrades: TechUpgrade[];
  purchaseTechUpgrade: () => true;
  towerPassives: CircuitNode[];
  unlockPassiveNode: (id: string) => boolean;
  towerSkills: any[];
  equippedSkillIds: SkillType[];
  equipSkill: (id: SkillType, slotIndex?: number) => boolean;
  unequipSkill: (id: SkillType) => void;
  unlockActiveSkill: (id: SkillType) => boolean;
  repairSector: (sector: SectorType) => void;
  upgradeSector: (sector: SectorType) => void;
  repairCore: () => void;
  isOverclocked: boolean;
  overclockIdleMining: () => void;
  isWarping: boolean;
  setIsWarping: (v: boolean) => void;
  // Expedition State
  expeditionPhase: ExpeditionPhase;
  setExpeditionPhase: (phase: ExpeditionPhase) => void;
  currentWave: number;
  combatResources: number;
  setCombatResources: React.Dispatch<React.SetStateAction<number>>;
  combatCurrencies: CombatCurrencies;
  setCombatCurrencies: React.Dispatch<React.SetStateAction<CombatCurrencies>>;
  addCombatCurrencies: (added: Partial<CombatCurrencies>) => void;
  placedModules: Record<string, PlacedModule>;
  setPlacedModules: React.Dispatch<React.SetStateAction<Record<string, PlacedModule>>>;
  selectedHex: { q: number; r: number } | null;
  setSelectedHex: (hex: { q: number; r: number } | null) => void;
  selectedDeployType: ModuleType | null;
  setSelectedDeployType: (type: ModuleType | null) => void;
  activeRoguelikeUpgrades: RoguelikeUpgrade[];
  offeredRoguelikeChoices: RoguelikeUpgrade[];
  chooseRoguelikeUpgrade: (upgrade: RoguelikeUpgrade) => void;
  // Escalated Tactical Loadout (Max 6 active modules)
  escalatedModules: ModuleType[];
  setEscalatedModules: React.Dispatch<React.SetStateAction<ModuleType[]>>;
  toggleEscalatedModule: (type: ModuleType) => boolean;
  startExpedition: () => void;
  extractExpedition: () => void;
  handleDefeat: () => void;
  deployModuleToHex: (q: number, r: number, type: ModuleType) => boolean;
  upgradePlacedModule: (hexKey: string) => boolean;
  repairPlacedModule: (hexKey: string) => boolean;
  batchUpgradeModules: (hexKeys: string[]) => { upgradedCount: number; totalCost: number };
  batchRepairModules: (hexKeys: string[]) => { repairedCount: number; totalCost: number };
  recyclePlacedModule: (hexKey: string) => void;
  protectedCargo: ExpeditionCargo;
  volatileCargo: ExpeditionCargo;
  addVolatileCargo: (cargo: Partial<ExpeditionCargo>) => void;
  onWaveComplete: () => void;
  advanceToNextWave: () => void;
  wavePointsCurrent: number;
  wavePointsTarget: number;
  addWavePoints: (pts: number) => void;
  timeSpeed: number;
  setTimeSpeed: (s: number) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

const STORAGE_KEY = 'torre_dimensional_save_v10_clean';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<GameMode>('OPERATION');

  // Player Resources (Dual Storage: Solids in kg, Gases in Liters) - Experiência do Zero Absoluto
  const [resources, setResources] = useState<PlayerResources>(() => ({
    dimensionalEnergy: 50,
    maxDimensionalEnergy: 100,
    commonMatter: 30,
    techComponents: 0,
    dimensionalMaterials: 0,
    combatData: 0,
    storageUsed: 11, // Kit inicial: 10kg sucata de casco + 4 un plástico (0.8kg)
    storageMax: 100,
    gasStorageUsed: 0,
    gasStorageMax: 100,
  }));

  // Collectors (Buffers de Entrada)
  const [collectors, setCollectors] = useState<CollectorState[]>(INITIAL_COLLECTORS);

  // Recipes & Automations
  const [recipes, setRecipes] = useState<ProcessingRecipe[]>(INITIAL_PROCESSING_RECIPES);
  const [automationUpgrades, setAutomationUpgrades] = useState<AutomationUpgrade[]>(INITIAL_AUTOMATION_UPGRADES);

  // Base Sectors
  const [baseSectors, setBaseSectors] = useState<Record<BaseSectorId, BaseSector>>(INITIAL_BASE_SECTORS);

  // Tower Structure
  const [tower, setTower] = useState<TowerState>(() => ({
    coreHp: 1000,
    maxCoreHp: 1000,
    sectors: {
      reactor: {
        name: 'Reator de Fusão',
        type: 'reactor',
        hp: 400,
        maxHp: 400,
        level: 1,
        status: 'operational',
        description: 'Alimenta os canhões de pulso e a cadência de fogo.',
      },
      arsenal: {
        name: 'Arsenal Bélico',
        type: 'arsenal',
        hp: 400,
        maxHp: 400,
        level: 1,
        status: 'operational',
        description: 'Fornece multiplicadores de dano balístico.',
      },
      shields: {
        name: 'Emissores de Escudo',
        type: 'shields',
        hp: 500,
        maxHp: 500,
        level: 1,
        status: 'operational',
        description: 'Absorve impactos e protege a integridade do Núcleo.',
      },
      workshops: {
        name: 'Oficinas Automatizadas',
        type: 'workshops',
        hp: 350,
        maxHp: 350,
        level: 1,
        status: 'operational',
        description: 'Gera matéria comum passiva e gerencia reparos.',
      },
    },
    baseSectors: INITIAL_BASE_SECTORS,
  }));

  // Storage Compartments (Limited initial storage: 100 kg / 60 L / 8 m³)
  const [storageCompartments, setStorageCompartments] = useState<StorageCompartment[]>(INITIAL_STORAGE_COMPARTMENTS);

  // Inventory Items (Mapped from GAME_MATERIALS with starter scrap kit)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => INITIAL_INVENTORY_ITEMS);

  // Combat Archetype & Codex State
  const [activeArchetypeId, setActiveArchetypeId] = useState<CombatArchetypeId>('piercing_kinetic');
  const [showCodex, setShowCodex] = useState<boolean>(false);
  const [codexInitialMaterialId, setCodexInitialMaterialId] = useState<string>('comp_plastic');

  const openCodexForMaterial = useCallback((matId: string) => {
    setCodexInitialMaterialId(matId);
    setShowCodex(true);
    sound.playClick();
  }, []);

  // Multiverse Circuit Tree
  const [universes, setUniverses] = useState<UniverseInfo[]>(UNIVERSES_CONFIG);
  const [activeUniverseId, setActiveUniverseId] = useState<UniverseId>('univ_matter');
  const [circuitNodes, setCircuitNodes] = useState<CircuitNode[]>(MULTIVERSE_CIRCUIT_NODES);

  // Autonomous Equipment Modules
  const [autonomousModules, setAutonomousModules] = useState<AutonomousModule[]>(INITIAL_AUTONOMOUS_MODULES);

  // Tech upgrades for legacy compatibility
  const [techUpgrades, setTechUpgrades] = useState<TechUpgrade[]>([]);

  // Overclock and Warp
  const [overclockUntil, setOverclockUntil] = useState<number>(0);
  const isOverclocked = Date.now() < overclockUntil;
  const [isWarping, setIsWarping] = useState<boolean>(false);

  // Active skill visual effects
  const [activeSkillEffects, setActiveSkillEffects] = useState<Record<SkillType, number>>({
    emp_blast: 0,
    overdrive: 0,
    orbital_strike: 0,
    nano_repair: 0,
    phase_shield: 0,
    missile_swarm: 0,
  });

  // Expedition Combat State
  const [expeditionPhase, setExpeditionPhase] = useState<ExpeditionPhase>('COMBAT');
  const [currentWave, setCurrentWave] = useState(1);
  const [combatResources, setCombatResources] = useState(65);
  const [combatCurrencies, setCombatCurrencies] = useState<CombatCurrencies>({
    nanoMatter: 65,
    microCircuits: 8,
    tacticalData: 2,
    dimensionalMatrix: 0,
  });

  const addCombatCurrencies = useCallback((added: Partial<CombatCurrencies>) => {
    setCombatCurrencies((prev) => ({
      nanoMatter: prev.nanoMatter + (added.nanoMatter || 0),
      microCircuits: prev.microCircuits + (added.microCircuits || 0),
      tacticalData: prev.tacticalData + (added.tacticalData || 0),
      dimensionalMatrix: prev.dimensionalMatrix + (added.dimensionalMatrix || 0),
    }));
    if (added.nanoMatter) {
      setCombatResources((prev) => prev + added.nanoMatter!);
    }
  }, []);
  const [placedModules, setPlacedModules] = useState<Record<string, PlacedModule>>({});
  const [selectedHex, setSelectedHex] = useState<{ q: number; r: number } | null>(null);
  const [selectedDeployType, setSelectedDeployType] = useState<ModuleType | null>(null);
  const [defenseModuleDefs, setDefenseModuleDefs] = useState<Record<ModuleType, DefenseModuleDef>>(() => DEFAULT_MODULE_DEFS);
  const [escalatedModules, setEscalatedModules] = useState<ModuleType[]>(DEFAULT_ESCALATED_MODULES);
  const [activeRoguelikeUpgrades, setActiveRoguelikeUpgrades] = useState<RoguelikeUpgrade[]>([]);
  const [offeredRoguelikeChoices, setOfferedRoguelikeChoices] = useState<RoguelikeUpgrade[]>([]);
  const [timeSpeed, setTimeSpeed] = useState<number>(1);
  const [wavePointsCurrent, setWavePointsCurrent] = useState<number>(0);
  const wavePointsTarget = useMemo(() => 20 + currentWave * 10, [currentWave]);

  const toggleEscalatedModule = useCallback(
    (type: ModuleType): boolean => {
      const def = defenseModuleDefs[type];
      if (!def || !def.unlocked) return false;

      setEscalatedModules((prev) => {
        if (prev.includes(type)) {
          if (prev.length <= 1) return prev; // Keep at least one
          return prev.filter((t) => t !== type);
        }
        if (prev.length >= 6) {
          return prev; // Max 6!
        }
        return [...prev, type];
      });
      sound.playClick();
      return true;
    },
    [defenseModuleDefs]
  );

  const addWavePoints = useCallback((pts: number) => {
    setWavePointsCurrent((prev) => Math.min(wavePointsTarget, prev + pts));
  }, [wavePointsTarget]);

  const [protectedCargo, setProtectedCargo] = useState<ExpeditionCargo>({
    matter: 0,
    techComponents: 0,
    dimensionalMaterials: 0,
    combatData: 0,
  });

  const [volatileCargo, setVolatileCargo] = useState<ExpeditionCargo>({
    matter: 0,
    techComponents: 0,
    dimensionalMaterials: 0,
    combatData: 0,
  });

  // Load state on mount
  useEffect(() => {
    try {
      // Purge legacy save states from previous versions
      const legacyKeys = [
        'torre_dimensional_save_v9',
        'torre_dimensional_save_v8',
        'torre_dimensional_save_v7',
        'torre_dimensional_save_v6',
        'torre_dimensional_save_v5',
        'torre_dimensional_save_v4',
        'torre_dimensional_save_v3',
        'torre_dimensional_save_v2',
        'torre_dimensional_save_v1',
        'orbital_defense_v1_save',
        'orbital_defense_save',
      ];
      legacyKeys.forEach((key) => {
        try { localStorage.removeItem(key); } catch {}
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.resources) setResources((prev) => ({ ...prev, ...p.resources }));
        if (p.baseSectors && typeof p.baseSectors === 'object') {
          setBaseSectors((prev) => ({ ...prev, ...p.baseSectors }));
        }
        if (p.inventoryItems && Array.isArray(p.inventoryItems)) {
          // Merge with INITIAL_INVENTORY_ITEMS and remap any legacy IDs (e.g. steel_scrap -> scrap_hull)
          const savedMap = new Map<string, number>();
          p.inventoryItems.forEach((i: any) => {
            if (i && typeof i.id === 'string' && typeof i.quantity === 'number') {
              const canonicalId = LEGACY_MATERIAL_ID_MAP[i.id] || i.id;
              savedMap.set(canonicalId, (savedMap.get(canonicalId) || 0) + i.quantity);
            }
          });
          setInventoryItems(
            INITIAL_INVENTORY_ITEMS.map((item) => ({
              ...item,
              quantity: savedMap.has(item.id) ? (savedMap.get(item.id) as number) : item.quantity,
            }))
          );
        }
        if (p.storageCompartments && Array.isArray(p.storageCompartments)) {
          const builtSet = new Set(p.storageCompartments.filter((c: StorageCompartment) => c.built).map((c: StorageCompartment) => c.id));
          setStorageCompartments(
            INITIAL_STORAGE_COMPARTMENTS.map((c) => ({
              ...c,
              built: builtSet.has(c.id) || c.id === 'comp_initial',
            }))
          );
        }
        if (p.defenseModuleDefs && typeof p.defenseModuleDefs === 'object') {
          setDefenseModuleDefs((prev) => {
            const next = { ...prev };
            (Object.keys(DEFAULT_MODULE_DEFS) as ModuleType[]).forEach((key) => {
              if (p.defenseModuleDefs[key]?.unlocked) {
                next[key] = { ...next[key], unlocked: true };
              }
            });
            return next;
          });
        }
        if (p.escalatedModules && Array.isArray(p.escalatedModules)) {
          setEscalatedModules(p.escalatedModules);
        }
        if (p.universes && Array.isArray(p.universes)) {
          const savedUniMap = new Map<string, UniverseInfo>(p.universes.map((u: UniverseInfo) => [u.id, u]));
          setUniverses(
            UNIVERSES_CONFIG.map((u) => {
              const su = savedUniMap.get(u.id);
              if (!su) return u;
              return {
                ...u,
                unlocked: typeof su.unlocked === 'boolean' ? su.unlocked : u.unlocked,
              };
            })
          );
        }
        if (p.activeArchetypeId && typeof p.activeArchetypeId === 'string') {
          setActiveArchetypeId(p.activeArchetypeId as CombatArchetypeId);
        }
        if (p.collectors && Array.isArray(p.collectors)) {
          const savedColMap = new Map<string, CollectorState>(p.collectors.map((c: CollectorState) => [c.id, c]));
          setCollectors(
            INITIAL_COLLECTORS.map((c) => {
              const sc = savedColMap.get(c.id);
              if (!sc) return c;
              const isUnlocked = typeof sc.isUnlocked === 'boolean' ? sc.isUnlocked : c.isUnlocked;
              return {
                ...c,
                isUnlocked,
                currentAmount: isUnlocked ? (typeof sc.currentAmount === 'number' ? sc.currentAmount : 0) : 0,
                status: isUnlocked ? (sc.status || 'COLLECTING') : 'OFFLINE',
                isAutomated: sc.isAutomated || c.isAutomated,
              };
            })
          );
        }
        if (p.automationUpgrades && Array.isArray(p.automationUpgrades)) {
          const savedUpgrades = new Set(p.automationUpgrades.filter((u: AutomationUpgrade) => u.installed).map((u: AutomationUpgrade) => u.id));
          setAutomationUpgrades(
            INITIAL_AUTOMATION_UPGRADES.map((u) => ({
              ...u,
              installed: savedUpgrades.has(u.id),
            }))
          );
        }
        if (p.circuitNodes && Array.isArray(p.circuitNodes)) {
          const unlockedSet = new Set(p.circuitNodes.filter((cn: CircuitNode) => cn.unlocked).map((cn: CircuitNode) => cn.id));
          setCircuitNodes(MULTIVERSE_CIRCUIT_NODES.map((cn) => ({ ...cn, unlocked: unlockedSet.has(cn.id) })));
        }
        if (p.autonomousModules) setAutonomousModules(p.autonomousModules);

        // Offline Simulation Calculation
        if (typeof p.lastSavedTimestamp === 'number' && p.lastSavedTimestamp > 0) {
          const elapsedSeconds = Math.min(86400 * 2, Math.max(0, Math.floor((Date.now() - p.lastSavedTimestamp) / 1000)));
          if (elapsedSeconds > 5) {
            // Offline dimensional energy regen (+1.5/s)
            const offlineEnergyGain = Math.floor(elapsedSeconds * 1.5);
            setResources((prev) => ({
              ...prev,
              dimensionalEnergy: Math.min(prev.maxDimensionalEnergy, prev.dimensionalEnergy + offlineEnergyGain),
            }));

            // Offline collectors accumulation
            setCollectors((prev) =>
              prev.map((c) => {
                if (!c.isUnlocked) return c;
                const offlineAccumulated = c.ratePerSecond * elapsedSeconds;
                const newAmount = Math.min(c.capacity, Math.round((c.currentAmount + offlineAccumulated) * 10) / 10);
                return {
                  ...c,
                  currentAmount: newAmount,
                  status: newAmount >= c.capacity ? 'FULL' : c.isAutomated ? 'AUTOMATED' : 'COLLECTING',
                };
              })
            );
          }
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save state on change
  useEffect(() => {
    try {
      const toSave = {
        resources,
        baseSectors,
        inventoryItems,
        storageCompartments,
        defenseModuleDefs,
        escalatedModules,
        universes,
        activeArchetypeId,
        circuitNodes,
        autonomousModules,
        collectors,
        automationUpgrades,
        lastSavedTimestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Ignore
    }
  }, [
    resources,
    baseSectors,
    inventoryItems,
    storageCompartments,
    defenseModuleDefs,
    escalatedModules,
    universes,
    activeArchetypeId,
    circuitNodes,
    autonomousModules,
    collectors,
    automationUpgrades,
  ]);

  // Calculate storage capacity based on inventory sector level, upgrades and passives
  const storageBonusFromPassives = useMemo(() => {
    return circuitNodes
      .filter((n) => n.unlocked && n.effect.stat === 'storageBonus')
      .reduce((sum, n) => sum + n.effect.value, 0);
  }, [circuitNodes]);

  // 3 Units of Measurement: Peso (kg), Litros (L), Volume (m³)
  // Base inicial limitada com comp_initial (100kg / 60L / 8m³). Cada novo compartimento construído amplia a capacidade!
  const storageCapacity = useMemo(() => {
    const builtWeight = storageCompartments
      .filter((c) => c.built)
      .reduce((sum, c) => sum + c.weightBonus, 0);
    return builtWeight + storageBonusFromPassives;
  }, [storageCompartments, storageBonusFromPassives]);

  const gasStorageCapacity = useMemo(() => {
    return storageCompartments
      .filter((c) => c.built)
      .reduce((sum, c) => sum + c.liquidBonus, 0);
  }, [storageCompartments]);

  const volumeCapacity = useMemo(() => {
    return Math.round(
      storageCompartments
        .filter((c) => c.built)
        .reduce((sum, c) => sum + c.volumeBonus, 0) * 10
    ) / 10;
  }, [storageCompartments]);

  const storageUsed = useMemo(() => {
    return Math.round(
      inventoryItems
        .filter((item) => item.physicalState === 'solid' || item.unit === 'kg' || item.unit === 'un')
        .reduce((acc, item) => acc + item.quantity * (item.unitWeight || 1.0), 0) * 10
    ) / 10;
  }, [inventoryItems]);

  const gasStorageUsed = useMemo(() => {
    return Math.round(
      inventoryItems
        .filter((item) => item.physicalState === 'gas' || (item.physicalState as string) === 'liquid' || item.unit === 'L')
        .reduce((acc, item) => acc + item.quantity * (item.unitWeight || 1.0), 0) * 10
    ) / 10;
  }, [inventoryItems]);

  const volumeUsed = useMemo(() => {
    return Math.round((storageUsed * 0.03 + gasStorageUsed * 0.02) * 10) / 10;
  }, [storageUsed, gasStorageUsed]);

  const isStorageFull = useMemo(() => {
    return storageUsed >= storageCapacity || gasStorageUsed >= gasStorageCapacity || volumeUsed >= volumeCapacity;
  }, [storageUsed, storageCapacity, gasStorageUsed, gasStorageCapacity, volumeUsed, volumeCapacity]);

  const canAcceptCargo = useCallback(
    (addWeightKg = 0, addLiquidL = 0) => {
      if (storageUsed + addWeightKg > storageCapacity) {
        return {
          allowed: false,
          reason: `Capacidade de Peso Esgotada (${storageUsed}/${storageCapacity} kg)! Construa ou evolua Silos de Estoque no Construtor.`,
        };
      }
      if (gasStorageUsed + addLiquidL > gasStorageCapacity) {
        return {
          allowed: false,
          reason: `Capacidade de Fluidos Esgotada (${gasStorageUsed}/${gasStorageCapacity} L)! Construa ou evolua Silos de Estoque no Construtor.`,
        };
      }
      const nextVol = Math.round(((storageUsed + addWeightKg) * 0.03 + (gasStorageUsed + addLiquidL) * 0.02) * 10) / 10;
      if (nextVol > volumeCapacity) {
        return {
          allowed: false,
          reason: `Volume de Carga Esgotado (${volumeUsed}/${volumeCapacity} m³)! Construa ou evolua Silos de Estoque no Construtor.`,
        };
      }
      return { allowed: true };
    },
    [storageUsed, storageCapacity, gasStorageUsed, gasStorageCapacity, volumeUsed, volumeCapacity]
  );

  // Tower simultaneous attack count (starts at 1, goes up with circuit nodes!)
  const towerAttackCount = useMemo(() => {
    const extraGuns = circuitNodes
      .filter((n) => n.unlocked && n.effect.stat === 'towerShots')
      .reduce((sum, n) => sum + n.effect.value, 0);
    return Math.max(1, 1 + extraGuns);
  }, [circuitNodes]);

  // Unlock universes dynamically when player reaches wave checkpoints
  useEffect(() => {
    setUniverses((prev) =>
      prev.map((u) => {
        if (u.id === 'univ_quantum' && currentWave >= 5) {
          return { ...u, unlocked: true };
        }
        if (u.id === 'univ_void' && currentWave >= 10) {
          return { ...u, unlocked: true };
        }
        return u;
      })
    );
  }, [currentWave]);

  // Autonomous equipment interval loop (Ticks only during active expedition combat)
  useEffect(() => {
    if (mode !== 'EXPEDITION' || expeditionPhase !== 'COMBAT') return;

    const autoInterval = setInterval(() => {
      const now = Date.now();
      setAutonomousModules((prev) =>
        prev.map((mod) => {
          if (!mod.equipped || !mod.unlocked) return mod;
          const elapsed = (now - mod.lastFiredTime) / 1000;
          const progress = Math.min(100, Math.round((elapsed / mod.interval) * 100));

          // Trigger automated ability when progress reaches 100%
          if (elapsed >= mod.interval) {
            // Trigger automatic effect
            if (mod.id === 'auto_emp') {
              setActiveSkillEffects((eff) => ({ ...eff, emp_blast: now + 4000 }));
              sound.playLaser(450, 0.15);
            } else if (mod.id === 'auto_flak') {
              sound.playLaser(850, 0.08);
            } else if (mod.id === 'auto_orbital') {
              setActiveSkillEffects((eff) => ({ ...eff, orbital_strike: now + 2500 }));
              sound.playExplosion(0.12);
            } else if (mod.id === 'auto_nano') {
              setActiveSkillEffects((eff) => ({ ...eff, nano_repair: now + 2000 }));
              setTower((t) => ({ ...t, coreHp: Math.min(t.maxCoreHp, t.coreHp + 45) }));
              sound.playUpgrade(0.1);
            } else if (mod.id === 'auto_phase') {
              setActiveSkillEffects((eff) => ({ ...eff, phase_shield: now + 3500 }));
            }

            return {
              ...mod,
              lastFiredTime: now,
              progressPct: 0,
            };
          }

          return { ...mod, progressPct: progress };
        })
      );
    }, 500);

    return () => clearInterval(autoInterval);
  }, [mode, expeditionPhase]);

  // Passive resource regeneration & Collector Accumulation Loop (Ticks every second)
  useEffect(() => {
    const resInterval = setInterval(() => {
      // 1. Advance Collector Buffers (Gases, Minérios e Destroços acumulam até a capacidade)
      setCollectors((prev) =>
        prev.map((c) => {
          // If collector is NOT unlocked, it must stay OFFLINE and NEVER accumulate!
          if (!c.isUnlocked) {
            return {
              ...c,
              currentAmount: 0,
              status: 'OFFLINE',
            };
          }

          const ocMult = isOverclocked ? 2.0 : 1.0;
          const refSector = baseSectors.refinery;
          const refBonus = refSector.installed ? 1 + refSector.level * 0.25 : 1.0;
          const rate = c.ratePerSecond * ocMult * refBonus;

          if (c.currentAmount >= c.capacity) {
            return { ...c, status: 'FULL' };
          }

          const nextAmount = Math.min(c.capacity, Math.round((c.currentAmount + rate) * 10) / 10);
          const isFull = nextAmount >= c.capacity;
          return {
            ...c,
            currentAmount: nextAmount,
            status: isFull ? 'FULL' : c.isAutomated ? 'AUTOMATED' : 'COLLECTING',
          };
        })
      );

      // 2. Continuous energy regeneration and dual storage sync
      setResources((prev) => {
        const ocMult = isOverclocked ? 2.0 : 1.0;
        const addEnergy = Math.round(1.5 * ocMult);

        return {
          ...prev,
          dimensionalEnergy: Math.min(prev.maxDimensionalEnergy, prev.dimensionalEnergy + addEnergy),
          storageUsed: Math.min(storageCapacity, storageUsed),
          storageMax: storageCapacity,
          gasStorageUsed: Math.min(gasStorageCapacity, gasStorageUsed),
          gasStorageMax: gasStorageCapacity,
        };
      });
    }, 1000);

    return () => clearInterval(resInterval);
  }, [isOverclocked, baseSectors.refinery, storageUsed, storageCapacity, gasStorageUsed, gasStorageCapacity]);

  // Install / Construct locked base sector
  const installBaseSector = useCallback(
    (sectorId: BaseSectorId): boolean => {
      const sector = baseSectors[sectorId];
      if (!sector || sector.installed) return false;

      if (
        resources.commonMatter >= sector.costMatter &&
        resources.techComponents >= sector.costTech &&
        resources.dimensionalMaterials >= sector.costDimMat
      ) {
        setResources((prev) => ({
          ...prev,
          commonMatter: prev.commonMatter - sector.costMatter,
          techComponents: prev.techComponents - sector.costTech,
          dimensionalMaterials: prev.dimensionalMaterials - sector.costDimMat,
        }));

        setBaseSectors((prev) => ({
          ...prev,
          [sectorId]: {
            ...prev[sectorId],
            installed: true,
            level: 1,
          },
        }));

        sound.playUpgrade(0.15);
        return true;
      }
      return false;
    },
    [baseSectors, resources]
  );

  // Upgrade base sector level
  const upgradeBaseSector = useCallback(
    (sectorId: BaseSectorId): boolean => {
      const sector = baseSectors[sectorId];
      if (!sector || !sector.installed || sector.level >= sector.maxLevel) return false;

      const upgradeCostMatter = Math.round(sector.costMatter * 1.5 * sector.level);
      const upgradeCostTech = Math.round(sector.costTech * 1.4 * sector.level);

      if (resources.commonMatter >= upgradeCostMatter && resources.techComponents >= upgradeCostTech) {
        setResources((prev) => ({
          ...prev,
          commonMatter: prev.commonMatter - upgradeCostMatter,
          techComponents: prev.techComponents - upgradeCostTech,
        }));

        setBaseSectors((prev) => ({
          ...prev,
          [sectorId]: {
            ...prev[sectorId],
            level: prev[sectorId].level + 1,
            maxHp: prev[sectorId].maxHp + 100,
            hp: prev[sectorId].hp + 100,
          },
        }));

        sound.playUpgrade(0.15);
        return true;
      }
      return false;
    },
    [baseSectors, resources]
  );

  // Build Expandable Storage Compartment (Silo, Cryo, Modular)
  const buildStorageCompartment = useCallback(
    (compartmentId: string): boolean => {
      const comp = storageCompartments.find((c) => c.id === compartmentId);
      if (!comp || comp.built) return false;

      // Verify required physical materials
      const hasAll = comp.costItems.every((req) => {
        const item = inventoryItems.find((i) => i.id === req.itemId);
        return item && item.quantity >= req.quantity;
      });
      if (!hasAll) return false;

      // Deduct required items from inventory
      setInventoryItems((prev) =>
        prev.map((item) => {
          const req = comp.costItems.find((r) => r.itemId === item.id);
          if (req) {
            return { ...item, quantity: Math.max(0, item.quantity - req.quantity) };
          }
          return item;
        })
      );

      // Set compartment as built
      setStorageCompartments((prev) =>
        prev.map((c) => (c.id === compartmentId ? { ...c, built: true } : c))
      );

      // Also ensure inventory base sector is marked installed to unlock expeditions
      setBaseSectors((prev) => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          installed: true,
          level: Math.max(prev.inventory.level, 1),
        },
      }));

      sound.playUpgrade(0.25);
      return true;
    },
    [storageCompartments, inventoryItems]
  );

  // Discard / Eject inventory item to vacuum to free up cargo space
  const discardInventoryItem = useCallback((itemId: string, quantity?: number) => {
    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const toDiscard = quantity !== undefined ? Math.min(item.quantity, quantity) : item.quantity;
          return { ...item, quantity: Math.max(0, item.quantity - toDiscard) };
        }
        return item;
      })
    );
    sound.playCoin(0.08);
  }, []);

  // Repair Tower Hull using real physical materials (e.g. PD-2001 Ferro Recuperado, PD-3104 Chapas)
  const repairTowerHull = useCallback((): boolean => {
    if (tower.coreHp >= tower.maxCoreHp) return false;
    const candidates = [
      { id: 'mat.recovered_iron', needed: 4, hp: 350 },
      { id: 'mat.iron_sheet', needed: 2, hp: 500 },
      { id: 'scrap.structural', needed: 4, hp: 200 },
    ];
    const match = candidates.find((c) => {
      const inv = inventoryItems.find((i) => i.id === c.id);
      return inv && inv.quantity >= c.needed;
    });

    if (!match) return false;

    setInventoryItems((prev) =>
      prev.map((item) =>
        item.id === match.id ? { ...item, quantity: Math.max(0, item.quantity - match.needed) } : item
      )
    );

    setTower((t) => ({ ...t, coreHp: Math.min(t.maxCoreHp, t.coreHp + match.hp) }));
    sound.playUpgrade(0.18);
    return true;
  }, [tower, inventoryItems]);

  // Refine single inventory item into usable currencies
  const refineInventoryItem = useCallback(
    (itemId: string): boolean => {
      const item = inventoryItems.find((i) => i.id === itemId);
      if (!item || item.quantity <= 0 || !item.refineYield) return false;

      setInventoryItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i))
      );

      setResources((prev) => ({
        ...prev,
        commonMatter: prev.commonMatter + (item.refineYield?.matter || 0),
        dimensionalEnergy: Math.min(
          prev.maxDimensionalEnergy,
          prev.dimensionalEnergy + (item.refineYield?.energy || 0)
        ),
        techComponents: prev.techComponents + (item.refineYield?.tech || 0),
        dimensionalMaterials: prev.dimensionalMaterials + (item.refineYield?.dimMat || 0),
      }));

      sound.playCoin(0.08);
      return true;
    },
    [inventoryItems]
  );

  // Recycle all raw ores into matter and components
  const recycleAllOres = useCallback((): boolean => {
    let gainedMatter = 0;
    let gainedEnergy = 0;
    let gainedTech = 0;
    let gainedDimMat = 0;
    let processed = false;

    setInventoryItems((prev) =>
      prev.map((i) => {
        if (i.refineYield && i.quantity > 0) {
          processed = true;
          gainedMatter += (i.refineYield.matter || 0) * i.quantity;
          gainedEnergy += (i.refineYield.energy || 0) * i.quantity;
          gainedTech += (i.refineYield.tech || 0) * i.quantity;
          gainedDimMat += (i.refineYield.dimMat || 0) * i.quantity;
          return { ...i, quantity: 0 };
        }
        return i;
      })
    );

    if (processed) {
      setResources((prev) => ({
        ...prev,
        commonMatter: prev.commonMatter + gainedMatter,
        dimensionalEnergy: Math.min(prev.maxDimensionalEnergy, prev.dimensionalEnergy + gainedEnergy),
        techComponents: prev.techComponents + gainedTech,
        dimensionalMaterials: prev.dimensionalMaterials + gainedDimMat,
      }));
      sound.playUpgrade(0.12);
      return true;
    }
    return false;
  }, []);

  // Manual / Tactical processing of Collector Buffers
  const processCollector = useCallback(
    (collectorId: CollectorId, processAmount?: number): boolean => {
      let success = false;
      const targetCol = collectors.find((c) => c.id === collectorId);
      if (!targetCol || !targetCol.isUnlocked || targetCol.currentAmount <= 0) return false;

      const toProcessAmount = processAmount ? Math.min(targetCol.currentAmount, processAmount) : targetCol.currentAmount;
      if (toProcessAmount <= 0) return false;

      // Strict Storage Limit Enforcement (Peso kg ou Litros L)
      const isGas = targetCol.physicalState === 'gas';
      const check = canAcceptCargo(isGas ? 0 : toProcessAmount, isGas ? toProcessAmount : 0);
      if (!check.allowed) {
        sound.playError();
        return false;
      }

      setCollectors((prev) =>
        prev.map((col) => {
          if (col.id !== collectorId || !col.isUnlocked || col.currentAmount <= 0) return col;

          const toProcess = processAmount ? Math.min(col.currentAmount, processAmount) : col.currentAmount;
          if (toProcess <= 0) return col;

          const ratio = toProcess / col.capacity;

          // Convert buffer into refined products in inventory
          setInventoryItems((prevItems) => {
            const next = [...prevItems];
            col.bufferItems.forEach((buf) => {
              const yieldAmount = Math.max(1, Math.round(buf.amount * ratio * 1.2));
              const existingIdx = next.findIndex((item) => item.id === buf.yieldItemId);
              if (existingIdx >= 0) {
                next[existingIdx] = {
                  ...next[existingIdx],
                  quantity: next[existingIdx].quantity + yieldAmount,
                };
              }
            });

            // Special scrap triaging: yields additional scrap pieces to inventory
            if (col.id === 'col_debris') {
              const structGained = Math.max(1, Math.floor(toProcess / 5));
              const stIdx = next.findIndex((item) => item.id === 'scrap.structural');
              if (stIdx >= 0) {
                next[stIdx] = { ...next[stIdx], quantity: next[stIdx].quantity + structGained };
              }
              const elecGained = Math.max(1, Math.floor(toProcess / 8));
              const elIdx = next.findIndex((item) => item.id === 'scrap.electrical');
              if (elIdx >= 0) {
                next[elIdx] = { ...next[elIdx], quantity: next[elIdx].quantity + elecGained };
              }
              if (Math.random() < 0.25) {
                const chemIdx = next.findIndex((item) => item.id === 'scrap.chemical');
                if (chemIdx >= 0) {
                  next[chemIdx] = { ...next[chemIdx], quantity: next[chemIdx].quantity + 1 };
                }
              }
            }

            // Special mineral triaging: extracts raw ferrous regolith, copper ore, silica sand, and graphite
            if (col.id === 'col_minerals') {
              const ironGained = Math.max(1, Math.floor(toProcess * 0.45));
              const feIdx = next.findIndex((item) => item.id === 'raw.ferrous_regolith');
              if (feIdx >= 0) {
                next[feIdx] = { ...next[feIdx], quantity: next[feIdx].quantity + ironGained };
              }

              const cuGained = Math.max(1, Math.floor(toProcess * 0.3));
              const cuIdx = next.findIndex((item) => item.id === 'raw.copper_ore');
              if (cuIdx >= 0) {
                next[cuIdx] = { ...next[cuIdx], quantity: next[cuIdx].quantity + cuGained };
              }

              const sandGained = Math.max(0, Math.floor(toProcess * 0.15));
              if (sandGained > 0) {
                const saIdx = next.findIndex((item) => item.id === 'raw.silica_sand');
                if (saIdx >= 0) {
                  next[saIdx] = { ...next[saIdx], quantity: next[saIdx].quantity + sandGained };
                }
              }

              if (Math.random() < 0.25) {
                const tiIdx = next.findIndex((item) => item.id === 'raw.titanium_ore');
                if (tiIdx >= 0) {
                  next[tiIdx] = { ...next[tiIdx], quantity: next[tiIdx].quantity + 1 };
                }
              }
            }
            return next;
          });

          success = true;
          return {
            ...col,
            currentAmount: Math.max(0, Math.round((col.currentAmount - toProcess) * 10) / 10),
            status: col.isAutomated ? 'AUTOMATED' : 'COLLECTING',
          };
        })
      );

      if (success) {
        if (collectorId === 'col_gases') sound.playLaser(320, 0.12);
        else if (collectorId === 'col_minerals') sound.playUpgrade(0.12);
        else sound.playCoin(0.1);
      }
      return success;
    },
    []
  );

  // Craft Recipe in Refinery / Foundry (Stage 1, Stage 2, Stage 3) with batch multiplier
  const craftProcessingRecipe = useCallback(
    (recipeId: string, multiplier: number = 1): boolean => {
      const mult = Math.max(1, Math.floor(multiplier));
      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) return false;

      // Energy check
      const totalEnergy = recipe.energyCost * mult;
      if (resources.dimensionalEnergy < totalEnergy) return false;

      // Target collector cost check (requires the collector to be unlocked and have sufficient stock!)
      if (recipe.targetCollectorId) {
        const col = collectors.find((c) => c.id === recipe.targetCollectorId);
        if (!col || !col.isUnlocked) return false;
        const requiredAmount = (recipe.inputCollectorCost || 30) * mult;
        if (col.currentAmount < requiredAmount) return false;
      }

      // Input items check
      if (recipe.inputItems && recipe.inputItems.length > 0) {
        const hasAllItems = recipe.inputItems.every((req) => {
          const invItem = inventoryItems.find((i) => i.id === req.itemId);
          return invItem && invItem.quantity >= req.quantity * mult;
        });
        if (!hasAllItems) return false;
      }

      // Deduct Energy
      setResources((prev) => ({
        ...prev,
        dimensionalEnergy: Math.max(0, prev.dimensionalEnergy - totalEnergy),
      }));

      // Deduct from Collector Reservoir if applicable
      if (recipe.targetCollectorId) {
        const costToDeduct = (recipe.inputCollectorCost || 30) * mult;
        setCollectors((prev) =>
          prev.map((c) =>
            c.id === recipe.targetCollectorId
              ? {
                  ...c,
                  currentAmount: Math.max(0, Math.round((c.currentAmount - costToDeduct) * 10) / 10),
                  status: c.isAutomated ? 'AUTOMATED' : 'COLLECTING',
                }
              : c
          )
        );
      }

      // Deduct input items & add output items in Inventory
      setInventoryItems((prevItems) => {
        let updated = [...prevItems];

        // Deduct inputs
        if (recipe.inputItems) {
          recipe.inputItems.forEach((req) => {
            updated = updated.map((item) =>
              item.id === req.itemId
                ? { ...item, quantity: Math.max(0, item.quantity - req.quantity * mult) }
                : item
            );
          });
        }

        // Add outputs
        recipe.outputItems.forEach((out) => {
          const existingIdx = updated.findIndex((i) => i.id === out.itemId);
          if (existingIdx >= 0) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: updated[existingIdx].quantity + out.quantity * mult,
            };
          }
        });

        return updated;
      });

      sound.playUpgrade(0.18);
      return true;
    },
    [recipes, resources.dimensionalEnergy, collectors, inventoryItems]
  );

  // Install Automation Upgrade
  const installAutomationUpgrade = useCallback(
    (upgradeId: string): boolean => {
      const up = automationUpgrades.find((u) => u.id === upgradeId);
      if (!up || up.installed) return false;

      if (resources.commonMatter < up.costMatter || resources.techComponents < up.costTech) return false;

      // Check item requirements
      if (up.costItems && up.costItems.length > 0) {
        const hasItems = up.costItems.every((req) => {
          const item = inventoryItems.find((i) => i.id === req.itemId);
          return item && item.quantity >= req.quantity;
        });
        if (!hasItems) return false;
      }

      // Deduct currency
      setResources((prev) => ({
        ...prev,
        commonMatter: prev.commonMatter - up.costMatter,
        techComponents: prev.techComponents - up.costTech,
      }));

      // Deduct items
      if (up.costItems && up.costItems.length > 0) {
        setInventoryItems((prev) =>
          prev.map((item) => {
            const req = up.costItems?.find((r) => r.itemId === item.id);
            if (req) {
              return { ...item, quantity: Math.max(0, item.quantity - req.quantity) };
            }
            return item;
          })
        );
      }

      // Install upgrade
      setAutomationUpgrades((prev) =>
        prev.map((u) => (u.id === upgradeId ? { ...u, installed: true } : u))
      );

      // Trigger automatic pipeline flags
      if (up.type === 'ore_pipeline') {
        setCollectors((prev) =>
          prev.map((c) => (c.id === 'col_minerals' ? { ...c, isAutomated: true, status: 'AUTOMATED' } : c))
        );
      } else if (up.type === 'gas_compressor') {
        setCollectors((prev) =>
          prev.map((c) => (c.id === 'col_gases' ? { ...c, isAutomated: true, status: 'AUTOMATED' } : c))
        );
      } else if (up.type === 'scrap_sorter') {
        setCollectors((prev) =>
          prev.map((c) => (c.id === 'col_debris' ? { ...c, isAutomated: true, status: 'AUTOMATED' } : c))
        );
      }

      sound.playUpgrade(0.25);
      return true;
    },
    [automationUpgrades, resources, inventoryItems]
  );

  // Unlock circuit node on the Multiverse tree
  const unlockCircuitNode = useCallback(
    (nodeId: string): boolean => {
      const node = circuitNodes.find((n) => n.id === nodeId);
      if (!node || node.unlocked) return false;

      // Verify connected prerequisites: Tier 0 sempre liberado para início de build, demais requerem conexão
      const reqsSatisfied =
        node.tier === 0 ||
        node.reqIds.length === 0 ||
        (node.connectedNodeIds && node.connectedNodeIds.some((id) => circuitNodes.find((c) => c.id === id)?.unlocked)) ||
        node.reqIds.some((rId) => circuitNodes.find((c) => c.id === rId)?.unlocked) ||
        circuitNodes.some(
          (other) =>
            other.universeId === node.universeId &&
            other.unlocked &&
            // Vizinho vertical na coluna, vizinho horizontal ou vizinho diagonal N e N+1
            ((other.gridX === node.gridX &&
              Math.abs(other.gridY - node.gridY) <= (node.tier === 0 || node.tier === 3 ? 2 : 1)) ||
              (Math.abs(other.gridX - node.gridX) === 1 && Math.abs(other.gridY - node.gridY) <= 1) ||
              other.reqIds.includes(node.id))
        );

      if (!reqsSatisfied) return false;

      if (
        resources.combatData >= (node.costCombatData || 0) &&
        resources.dimensionalMaterials >= (node.costDimMat || 0)
      ) {
        setResources((prev) => ({
          ...prev,
          combatData: prev.combatData - (node.costCombatData || 0),
          dimensionalMaterials: prev.dimensionalMaterials - (node.costDimMat || 0),
        }));

        setCircuitNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, unlocked: true } : n)));
        sound.playUpgrade(0.18);
        return true;
      }
      return false;
    },
    [circuitNodes, resources.combatData, resources.dimensionalMaterials]
  );

  // Craft Autonomous Equipment Module
  const craftAutonomousModule = useCallback(
    (moduleId: string): boolean => {
      const mod = autonomousModules.find((m) => m.id === moduleId);
      if (!mod || mod.unlocked) return false;

      if (resources.combatData >= (mod.costCombatData || 0)) {
        setResources((prev) => ({
          ...prev,
          combatData: prev.combatData - (mod.costCombatData || 0),
        }));

        // Find available slot if any
        const equippedCount = autonomousModules.filter((m) => m.equipped).length;
        const autoEquip = equippedCount < 3;

        setAutonomousModules((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  unlocked: true,
                  equipped: autoEquip,
                  slotIndex: autoEquip ? equippedCount : -1,
                  lastFiredTime: Date.now(),
                }
              : m
          )
        );

        sound.playUpgrade(0.2);
        return true;
      }
      return false;
    },
    [autonomousModules, resources]
  );

  // Equip Autonomous Module to slot
  const equipAutonomousModule = useCallback(
    (moduleId: string, slotIndex: number): boolean => {
      const mod = autonomousModules.find((m) => m.id === moduleId);
      if (!mod || !mod.unlocked) return false;

      setAutonomousModules((prev) =>
        prev.map((m) => {
          if (m.slotIndex === slotIndex) {
            return { ...m, equipped: false, slotIndex: -1 };
          }
          if (m.id === moduleId) {
            return { ...m, equipped: true, slotIndex, lastFiredTime: Date.now() };
          }
          return m;
        })
      );

      sound.playDeploy(0.12);
      return true;
    },
    [autonomousModules]
  );

  // Unequip Autonomous Module
  const unequipAutonomousModule = useCallback((moduleId: string) => {
    setAutonomousModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, equipped: false, slotIndex: -1 } : m))
    );
  }, []);

  // Overclock Idle mining (doubles production for 45s)
  const overclockIdleMining = useCallback(() => {
    if (resources.dimensionalEnergy >= 15) {
      setResources((prev) => ({ ...prev, dimensionalEnergy: prev.dimensionalEnergy - 15 }));
      setOverclockUntil(Date.now() + 45000);
      sound.playUpgrade(0.15);
    }
  }, [resources.dimensionalEnergy]);

  // Start Expedition (Warp Jump)
  const startExpedition = useCallback(() => {
    // Requisito estrito: Requer Estoque (Silos de Carga) construído para armazenar espólios!
    if (!baseSectors.inventory?.installed) {
      sound.playClick();
      return;
    }

    const warpPassive = circuitNodes.find((n) => n.id === 'pass_warp_1')?.unlocked;
    const warpCost = warpPassive ? GAME_BALANCE.expedition.warpDiscountCost : GAME_BALANCE.expedition.portalBaseCost;

    if (resources.dimensionalEnergy >= warpCost) {
      setIsWarping(true);
      sound.playWarp(0.2);

      setTimeout(() => {
        setResources((prev) => ({
          ...prev,
          dimensionalEnergy: prev.dimensionalEnergy - warpCost,
        }));
        setMode('EXPEDITION');
        setExpeditionPhase('COMBAT');
        setCurrentWave(1);
        setCombatResources(65);
        setCombatCurrencies({
          nanoMatter: 65,
          microCircuits: 8,
          tacticalData: 2,
          dimensionalMatrix: 0,
        });
        setTower((prev) => ({
          ...prev,
          coreHp: prev.maxCoreHp || 1000,
        }));
        setPlacedModules({});
        setSelectedHex(null);
        setSelectedDeployType(null);
        setActiveRoguelikeUpgrades([]);
        setWavePointsCurrent(0);
        setProtectedCargo({ matter: 0, techComponents: 0, dimensionalMaterials: 0, combatData: 0, items: {} });
        setVolatileCargo({ matter: 0, techComponents: 0, dimensionalMaterials: 0, combatData: 0, items: {} });
        setIsWarping(false);
      }, 1200);
    }
  }, [baseSectors.inventory, circuitNodes, resources.dimensionalEnergy]);

  // Extract Expedition
  const extractExpedition = useCallback(() => {
    sound.playWarp(0.2);
    setResources((prev) => ({
      ...prev,
      commonMatter: prev.commonMatter + protectedCargo.matter + volatileCargo.matter,
      techComponents: prev.techComponents + protectedCargo.techComponents + volatileCargo.techComponents,
      dimensionalMaterials:
        prev.dimensionalMaterials + protectedCargo.dimensionalMaterials + volatileCargo.dimensionalMaterials,
      combatData: prev.combatData + protectedCargo.combatData + volatileCargo.combatData + currentWave * 5,
    }));

    // Transfer all extracted items (both protected and volatile) directly to station inventory!
    const allExtractedItems: Record<string, number> = {};
    if (protectedCargo.items) {
      Object.entries(protectedCargo.items).forEach(([k, v]) => {
        allExtractedItems[k] = (allExtractedItems[k] || 0) + v;
      });
    }
    if (volatileCargo.items) {
      Object.entries(volatileCargo.items).forEach(([k, v]) => {
        allExtractedItems[k] = (allExtractedItems[k] || 0) + v;
      });
    }

    if (Object.keys(allExtractedItems).length > 0) {
      setInventoryItems((prev) => {
        const next = [...prev];
        Object.entries(allExtractedItems).forEach(([itemId, qty]) => {
          const idx = next.findIndex((item) => item.id === itemId);
          if (idx >= 0) {
            next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          }
        });
        return next;
      });
    }

    setMode('OPERATION');
    setExpeditionPhase('COMBAT');
  }, [protectedCargo, volatileCargo, currentWave]);

  // Handle Defeat
  const handleDefeat = useCallback(() => {
    sound.playDefeat(0.2);
    // Preserves protected cargo and recovers 40% of volatile matter & combat data as salvage
    const recoveredVolatileMatter = Math.round((volatileCargo.matter || 0) * 0.4);
    const recoveredVolatileCombatData = Math.round((volatileCargo.combatData || 0) * 0.4);

    setResources((prev) => ({
      ...prev,
      commonMatter: prev.commonMatter + protectedCargo.matter + recoveredVolatileMatter,
      techComponents: prev.techComponents + protectedCargo.techComponents,
      dimensionalMaterials: prev.dimensionalMaterials + protectedCargo.dimensionalMaterials,
      combatData: prev.combatData + protectedCargo.combatData + recoveredVolatileCombatData + Math.max(1, Math.floor(currentWave * 2)),
    }));

    // Transfer guaranteed protected items to station inventory
    if (protectedCargo.items && Object.keys(protectedCargo.items).length > 0) {
      setInventoryItems((prev) => {
        const next = [...prev];
        Object.entries(protectedCargo.items || {}).forEach(([itemId, qty]) => {
          const idx = next.findIndex((item) => item.id === itemId);
          if (idx >= 0) {
            next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          }
        });
        return next;
      });
    }

    setExpeditionPhase('DEFEAT');
  }, [protectedCargo, volatileCargo, currentWave]);

  // Craft & Assemble Defense Module using real physical materials
  const craftDefenseModule = useCallback(
    (type: ModuleType): boolean => {
      const def = defenseModuleDefs[type];
      if (!def || def.unlocked) return false;
      const costItems = def.craftCostItems || [];
      if (costItems.length > 0) {
        const hasAll = costItems.every((req) => {
          const inv = inventoryItems.find((i) => i.id === req.itemId);
          return inv && inv.quantity >= req.quantity;
        });
        if (!hasAll) return false;

        // Deduct materials from inventory
        setInventoryItems((prev) =>
          prev.map((item) => {
            const req = costItems.find((c) => c.itemId === item.id);
            if (req) {
              return { ...item, quantity: Math.max(0, item.quantity - req.quantity) };
            }
            return item;
          })
        );
      }

      setDefenseModuleDefs((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          unlocked: true,
        },
      }));

      setEscalatedModules((prev) => {
        if (!prev.includes(type) && prev.length < 6) {
          return [...prev, type];
        }
        return prev;
      });

      sound.playUpgrade(0.2);
      return true;
    },
    [defenseModuleDefs, inventoryItems]
  );

  // Deploy module to hex during expedition
  const deployModuleToHex = useCallback(
    (q: number, r: number, type: ModuleType): boolean => {
      const def = defenseModuleDefs[type] || DEFAULT_MODULE_DEFS[type];
      if (!def || !def.unlocked) return false;

      const cost = def.tacticalCost || {
        nanoMatter: def.baseCost,
        microCircuits: Math.max(1, Math.round(def.baseCost * 0.15)),
        tacticalData: 0,
        dimensionalMatrix: 0,
      };

      if (
        combatCurrencies.nanoMatter < cost.nanoMatter ||
        combatCurrencies.microCircuits < cost.microCircuits ||
        combatCurrencies.tacticalData < (cost.tacticalData || 0) ||
        combatCurrencies.dimensionalMatrix < (cost.dimensionalMatrix || 0)
      ) {
        return false;
      }

      setCombatCurrencies((prev) => ({
        nanoMatter: prev.nanoMatter - cost.nanoMatter,
        microCircuits: prev.microCircuits - cost.microCircuits,
        tacticalData: prev.tacticalData - (cost.tacticalData || 0),
        dimensionalMatrix: prev.dimensionalMatrix - (cost.dimensionalMatrix || 0),
      }));
      setCombatResources((prev) => Math.max(0, prev - cost.nanoMatter));

      const hexKey = `${q},${r}`;
      const hp = def.baseHp || 150;
      setPlacedModules((prev) => ({
        ...prev,
        [hexKey]: {
          instanceId: `mod_${Date.now()}_${Math.random()}`,
          hexKey,
          q,
          r,
          type,
          level: 1,
          currentHp: hp,
          maxHp: hp,
          damage: def.baseDamage,
          range: def.baseRange,
          fireRate: def.baseFireRate,
          aoeHexRadius: def.aoeHexRadius || 1,
          hitFlash: 0,
          lastShotTime: 0,
          kills: 0,
          damageDealt: 0,
          accumulatedResources: 0,
        },
      }));

      sound.playDeploy(0.12);
      return true;
    },
    [defenseModuleDefs, combatCurrencies]
  );

  const upgradePlacedModule = useCallback(
    (hexKey: string): boolean => {
      const mod = placedModules[hexKey];
      if (!mod) return false;
      const def = defenseModuleDefs[mod.type] || DEFAULT_MODULE_DEFS[mod.type];
      const baseCost = def.tacticalCost || {
        nanoMatter: def.baseCost,
        microCircuits: Math.max(1, Math.round(def.baseCost * 0.15)),
        tacticalData: 0,
        dimensionalMatrix: 0,
      };
      const reqNano = Math.round(baseCost.nanoMatter * 0.6 * mod.level);
      const reqMicro = Math.max(1, Math.round(baseCost.microCircuits * 0.5 * mod.level));

      if (combatCurrencies.nanoMatter < reqNano || combatCurrencies.microCircuits < reqMicro) {
        return false;
      }

      setCombatCurrencies((prev) => ({
        ...prev,
        nanoMatter: prev.nanoMatter - reqNano,
        microCircuits: prev.microCircuits - reqMicro,
      }));
      setCombatResources((prev) => Math.max(0, prev - reqNano));

      const newMaxHp = Math.round(mod.maxHp * 1.35);
      const hpHeal = Math.round(newMaxHp * 0.35);

      setPlacedModules((prev) => ({
        ...prev,
        [hexKey]: {
          ...mod,
          level: mod.level + 1,
          maxHp: newMaxHp,
          currentHp: Math.min(newMaxHp, (mod.currentHp ?? mod.maxHp) + hpHeal),
          damage: Math.round(mod.damage * 1.3),
          range: mod.range + 1,
          fireRate: Number((mod.fireRate * 1.15).toFixed(2)),
        },
      }));

      sound.playUpgrade(0.12);
      return true;
    },
    [placedModules, defenseModuleDefs, combatCurrencies]
  );

  const repairPlacedModule = useCallback(
    (hexKey: string): boolean => {
      const mod = placedModules[hexKey];
      if (!mod || mod.currentHp >= mod.maxHp) return false;
      const def = defenseModuleDefs[mod.type] || DEFAULT_MODULE_DEFS[mod.type];
      const baseCost = def.tacticalCost || {
        nanoMatter: def.baseCost,
        microCircuits: 2,
        tacticalData: 0,
        dimensionalMatrix: 0,
      };
      const reqNano = Math.max(8, Math.round(baseCost.nanoMatter * 0.25));
      const reqMicro = Math.max(1, Math.round(baseCost.microCircuits * 0.25));

      if (combatCurrencies.nanoMatter < reqNano || combatCurrencies.microCircuits < reqMicro) {
        return false;
      }

      setCombatCurrencies((prev) => ({
        ...prev,
        nanoMatter: prev.nanoMatter - reqNano,
        microCircuits: prev.microCircuits - reqMicro,
      }));
      setCombatResources((prev) => Math.max(0, prev - reqNano));

      setPlacedModules((prev) => ({
        ...prev,
        [hexKey]: {
          ...mod,
          currentHp: mod.maxHp,
        },
      }));
      sound.playUpgrade(0.12);
      return true;
    },
    [placedModules, defenseModuleDefs, combatCurrencies]
  );

  const batchUpgradeModules = useCallback(
    (hexKeys: string[]): { upgradedCount: number; totalCost: number } => {
      let costSum = 0;
      let count = 0;
      const updates: Record<string, PlacedModule> = {};

      let remainingNano = combatCurrencies.nanoMatter;
      let remainingMicro = combatCurrencies.microCircuits;

      for (const k of hexKeys) {
        const mod = placedModules[k];
        if (!mod || mod.level >= 5) continue;
        const def = defenseModuleDefs[mod.type] || DEFAULT_MODULE_DEFS[mod.type];
        const baseCost = def.tacticalCost || {
          nanoMatter: def.baseCost,
          microCircuits: Math.max(1, Math.round(def.baseCost * 0.15)),
          tacticalData: 0,
          dimensionalMatrix: 0,
        };
        const reqNano = Math.round(baseCost.nanoMatter * 0.6 * mod.level);
        const reqMicro = Math.max(1, Math.round(baseCost.microCircuits * 0.5 * mod.level));

        if (remainingNano >= reqNano && remainingMicro >= reqMicro) {
          remainingNano -= reqNano;
          remainingMicro -= reqMicro;
          costSum += reqNano;
          count++;
          const newMaxHp = Math.round(mod.maxHp * 1.35);
          const hpHeal = Math.round(newMaxHp * 0.35);
          updates[k] = {
            ...mod,
            level: mod.level + 1,
            maxHp: newMaxHp,
            currentHp: Math.min(newMaxHp, (mod.currentHp ?? mod.maxHp) + hpHeal),
            damage: Math.round(mod.damage * 1.3),
            range: mod.range + 1,
            fireRate: Number((mod.fireRate * 1.15).toFixed(2)),
          };
        }
      }

      if (count > 0) {
        setCombatCurrencies((prev) => ({
          ...prev,
          nanoMatter: remainingNano,
          microCircuits: remainingMicro,
        }));
        setCombatResources(remainingNano);
        setPlacedModules((prev) => ({ ...prev, ...updates }));
        sound.playUpgrade(0.14);
      }
      return { upgradedCount: count, totalCost: costSum };
    },
    [placedModules, defenseModuleDefs, combatCurrencies]
  );

  const batchRepairModules = useCallback(
    (hexKeys: string[]): { repairedCount: number; totalCost: number } => {
      let costSum = 0;
      let count = 0;
      const updates: Record<string, PlacedModule> = {};

      let remainingNano = combatCurrencies.nanoMatter;
      let remainingMicro = combatCurrencies.microCircuits;

      for (const k of hexKeys) {
        const mod = placedModules[k];
        if (!mod || (mod.currentHp ?? mod.maxHp) >= mod.maxHp) continue;
        const def = defenseModuleDefs[mod.type] || DEFAULT_MODULE_DEFS[mod.type];
        const baseCost = def.tacticalCost || {
          nanoMatter: def.baseCost,
          microCircuits: 2,
          tacticalData: 0,
          dimensionalMatrix: 0,
        };
        const reqNano = Math.max(8, Math.round(baseCost.nanoMatter * 0.25));
        const reqMicro = Math.max(1, Math.round(baseCost.microCircuits * 0.25));

        if (remainingNano >= reqNano && remainingMicro >= reqMicro) {
          remainingNano -= reqNano;
          remainingMicro -= reqMicro;
          costSum += reqNano;
          count++;
          updates[k] = {
            ...mod,
            currentHp: mod.maxHp,
          };
        }
      }

      if (count > 0) {
        setCombatCurrencies((prev) => ({
          ...prev,
          nanoMatter: remainingNano,
          microCircuits: remainingMicro,
        }));
        setCombatResources(remainingNano);
        setPlacedModules((prev) => ({ ...prev, ...updates }));
        sound.playUpgrade(0.14);
      }
      return { repairedCount: count, totalCost: costSum };
    },
    [placedModules, defenseModuleDefs, combatCurrencies]
  );

  const recyclePlacedModule = useCallback(
    (hexKey: string) => {
      const mod = placedModules[hexKey];
      if (!mod) return;
      const def = defenseModuleDefs[mod.type] || DEFAULT_MODULE_DEFS[mod.type];
      const baseCost = def.tacticalCost || {
        nanoMatter: def.baseCost,
        microCircuits: 2,
        tacticalData: 0,
        dimensionalMatrix: 0,
      };
      const refundNano = Math.round(baseCost.nanoMatter * 0.65 * mod.level);
      const refundMicro = Math.max(1, Math.round(baseCost.microCircuits * 0.5 * mod.level));

      setCombatCurrencies((prev) => ({
        ...prev,
        nanoMatter: prev.nanoMatter + refundNano,
        microCircuits: prev.microCircuits + refundMicro,
      }));
      setCombatResources((prev) => prev + refundNano);
      setPlacedModules((prev) => {
        const next = { ...prev };
        delete next[hexKey];
        return next;
      });
      sound.playCoin(0.1);
    },
    [placedModules, defenseModuleDefs]
  );

  const addVolatileCargo = useCallback((cargo: Partial<ExpeditionCargo>) => {
    setVolatileCargo((prev) => {
      const mergedItems = { ...(prev.items || {}) };
      if (cargo.items) {
        Object.entries(cargo.items).forEach(([k, v]) => {
          mergedItems[k] = (mergedItems[k] || 0) + v;
        });
      }
      return {
        matter: prev.matter + (cargo.matter || 0),
        techComponents: prev.techComponents + (cargo.techComponents || 0),
        dimensionalMaterials: prev.dimensionalMaterials + (cargo.dimensionalMaterials || 0),
        combatData: prev.combatData + (cargo.combatData || 0),
        items: mergedItems,
      };
    });
  }, []);

  const onWaveComplete = useCallback(() => {
    sound.playWaveClear(0.15);
    // Draw 3 random roguelike choices
    const shuffled = [...ROGUELIKE_POOL].sort(() => 0.5 - Math.random());
    setOfferedRoguelikeChoices(shuffled.slice(0, 3));
    setExpeditionPhase('UPGRADE_SELECTION');
  }, []);

  const chooseRoguelikeUpgrade = useCallback((upgrade: RoguelikeUpgrade) => {
    setActiveRoguelikeUpgrades((prev) => [...prev, upgrade]);
    sound.playUpgrade(0.15);

    // Lock volatile cargo into protected cargo on completing wave
    setProtectedCargo((prev) => {
      const mergedItems = { ...(prev.items || {}) };
      if (volatileCargo.items) {
        Object.entries(volatileCargo.items).forEach(([k, v]) => {
          mergedItems[k] = (mergedItems[k] || 0) + v;
        });
      }
      return {
        matter: prev.matter + volatileCargo.matter,
        techComponents: prev.techComponents + volatileCargo.techComponents,
        dimensionalMaterials: prev.dimensionalMaterials + volatileCargo.dimensionalMaterials,
        combatData: prev.combatData + volatileCargo.combatData,
        items: mergedItems,
      };
    });
    setVolatileCargo({ matter: 0, techComponents: 0, dimensionalMaterials: 0, combatData: 0, items: {} });

    // Extraction checkpoint every 3 waves (wave 3, 6, 9...)
    if (currentWave % 3 === 0) {
      setExpeditionPhase('EXTRACTION_CHECKPOINT');
    } else {
      // Advance to next wave and resume combat immediately!
      setCurrentWave((w) => w + 1);
      setCombatResources((prev) => prev + 35 + currentWave * 8);
      addCombatCurrencies({
        nanoMatter: 35 + currentWave * 8,
        microCircuits: 4 + Math.floor(currentWave / 2),
        tacticalData: 1 + Math.floor(currentWave / 4),
      });
      setWavePointsCurrent(0);
      setExpeditionPhase('COMBAT');
    }
  }, [currentWave, volatileCargo, addCombatCurrencies]);

  const advanceToNextWave = useCallback(() => {
    setCurrentWave((w) => w + 1);
    setCombatResources((prev) => prev + 35 + currentWave * 8);
    addCombatCurrencies({
      nanoMatter: 35 + currentWave * 8,
      microCircuits: 4 + Math.floor(currentWave / 2),
      tacticalData: 1 + Math.floor(currentWave / 4),
    });
    setWavePointsCurrent(0);
    setExpeditionPhase('COMBAT');
  }, [currentWave, addCombatCurrencies]);

  // Backward compatibility triggers
  const triggerActiveSkill = useCallback((id: SkillType): boolean => {
    const now = Date.now();
    setActiveSkillEffects((eff) => ({ ...eff, [id]: now + 4000 }));
    sound.playLaser(500, 0.12);
    return true;
  }, []);

  // Reset completo do jogo para experiência do zero absoluto
  const resetGame = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.clear();
    } catch {
      // Ignore
    }
    setResources({
      dimensionalEnergy: 50,
      maxDimensionalEnergy: 100,
      commonMatter: 30,
      techComponents: 0,
      dimensionalMaterials: 0,
      combatData: 0,
      storageUsed: 11, // Starter scrap: 10kg scrap_hull + 4 comp_plastic
      storageMax: 100,
      gasStorageUsed: 0,
      gasStorageMax: 100,
    });
    setBaseSectors(INITIAL_BASE_SECTORS);
    setInventoryItems(INITIAL_INVENTORY_ITEMS);
    setCollectors(INITIAL_COLLECTORS);
    setRecipes(INITIAL_PROCESSING_RECIPES);
    setAutomationUpgrades(INITIAL_AUTOMATION_UPGRADES);
    setCircuitNodes(MULTIVERSE_CIRCUIT_NODES);
    setAutonomousModules(INITIAL_AUTONOMOUS_MODULES);
    setUniverses(UNIVERSES_CONFIG);
    setActiveUniverseId('univ_matter');
    setActiveArchetypeId('piercing_kinetic');
    setTower({
      coreHp: 1000,
      maxCoreHp: 1000,
      sectors: {
        reactor: {
          name: 'Reator de Fusão',
          type: 'reactor',
          hp: 400,
          maxHp: 400,
          level: 1,
          status: 'operational',
          description: 'Alimenta os canhões de pulso e a cadência de fogo.',
        },
        arsenal: {
          name: 'Arsenal Bélico',
          type: 'arsenal',
          hp: 400,
          maxHp: 400,
          level: 1,
          status: 'operational',
          description: 'Fornece multiplicadores de dano balístico.',
        },
        shields: {
          name: 'Emissores de Escudo',
          type: 'shields',
          hp: 500,
          maxHp: 500,
          level: 1,
          status: 'operational',
          description: 'Absorve impactos e protege a integridade do Núcleo.',
        },
        workshops: {
          name: 'Oficinas Automatizadas',
          type: 'workshops',
          hp: 350,
          maxHp: 350,
          level: 1,
          status: 'operational',
          description: 'Gera matéria comum passiva e gerencia reparos.',
        },
      },
      baseSectors: INITIAL_BASE_SECTORS,
    });
    setMode('OPERATION');
    setExpeditionPhase('COMBAT');
    setCurrentWave(1);
    setCombatResources(65);
    setCombatCurrencies({
      nanoMatter: 65,
      microCircuits: 8,
      tacticalData: 2,
      dimensionalMatrix: 0,
    });
    setPlacedModules({});
    setSelectedHex(null);
    setSelectedDeployType(null);
    setActiveRoguelikeUpgrades([]);
    setOfferedRoguelikeChoices([]);
    setDefenseModuleDefs(DEFAULT_MODULE_DEFS);
    setProtectedCargo({ matter: 0, techComponents: 0, dimensionalMaterials: 0, combatData: 0 });
    setVolatileCargo({ matter: 0, techComponents: 0, dimensionalMaterials: 0, combatData: 0 });
    sound.playCheckpoint();
  }, []);

  return (
    <GameContext.Provider
      value={{
        mode,
        setMode,
        resetGame,
        resources,
        setResources,
        tower,
        setTower,
        baseSectors,
        setBaseSectors,
        installBaseSector,
        upgradeBaseSector,
        inventoryItems,
        setInventoryItems,
        discardInventoryItem,
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
        storageCompartments,
        buildStorageCompartment,
        repairTowerHull,
        collectors,
        setCollectors,
        processCollector,
        recipes,
        craftProcessingRecipe,
        defenseModuleDefs,
        craftDefenseModule,
        activeArchetypeId,
        setActiveArchetypeId,
        showCodex,
        setShowCodex,
        codexInitialMaterialId,
        openCodexForMaterial,
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
        activeSkillEffects,
        triggerActiveSkill,
        // Legacy compat
        techUpgrades,
        purchaseTechUpgrade: () => true,
        towerPassives: circuitNodes,
        unlockPassiveNode: unlockCircuitNode,
        towerSkills: autonomousModules,
        equippedSkillIds: ['emp_blast'],
        equipSkill: () => true,
        unequipSkill: () => {},
        unlockActiveSkill: () => true,
        repairSector: () => {},
        upgradeSector: () => {},
        repairCore: () => {
          setTower((t) => ({ ...t, coreHp: t.maxCoreHp }));
          sound.playUpgrade(0.1);
        },
        isOverclocked,
        overclockIdleMining,
        isWarping,
        setIsWarping,
        expeditionPhase,
        setExpeditionPhase,
        currentWave,
        combatResources,
        setCombatResources,
        combatCurrencies,
        setCombatCurrencies,
        addCombatCurrencies,
        placedModules,
        setPlacedModules,
        selectedHex,
        setSelectedHex,
        selectedDeployType,
        setSelectedDeployType,
        activeRoguelikeUpgrades,
        offeredRoguelikeChoices,
        chooseRoguelikeUpgrade,
        escalatedModules,
        setEscalatedModules,
        toggleEscalatedModule,
        startExpedition,
        extractExpedition,
        handleDefeat,
        deployModuleToHex,
        upgradePlacedModule,
        repairPlacedModule,
        batchUpgradeModules,
        batchRepairModules,
        recyclePlacedModule,
        protectedCargo,
        volatileCargo,
        addVolatileCargo,
        onWaveComplete,
        advanceToNextWave,
        wavePointsCurrent,
        wavePointsTarget,
        addWavePoints,
        timeSpeed,
        setTimeSpeed,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
