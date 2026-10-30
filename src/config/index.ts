/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import rawMaterials from './materials.json';
import rawRecipes from './recipes.json';
import rawArchetypes from './combat_archetypes.json';
import rawUniverses from './universes.json';
import rawCircuits from './circuits.json';
import rawSectors from './sectors.json';
import rawBalance from './balance.json';

// Type definitions matching JSON schemas
export interface ConfigMaterial {
  id: string;
  code: string; // e.g. "PD-1001"
  name: string;
  family: 'scrap' | 'plastic' | 'electric' | 'organic' | 'unknown' | 'ore' | 'metal' | 'gas' | 'chemical' | 'crystal' | 'dimensional';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  physicalState: 'solid' | 'gas' | 'liquid';
  unit: 'kg' | 'L' | 'un' | 'm³';
  unitWeight: number;
  icon: string; // Lucide icon name, NO EMOJIS
  color: string;
  stage: 'raw' | 'refined' | 'component' | 'subproduct';
  source: string;
  description: string;
  refineYield?: {
    matter?: number;
    tech?: number;
    dimMat?: number;
    energy?: number;
  };
}

export interface ConfigRecipeItemCost {
  itemId: string;
  quantity: number;
}

export interface ConfigRecipe {
  id: string;
  code?: string; // e.g. "MK-1004", "FR-1001", "RC-1001"
  name: string;
  station: 'separator' | 'assembler' | 'furnace' | 'refinery' | 'manual' | 'rolling_mill' | 'wire_drawer' | 'hydraulic_press' | 'lathe_mill' | 'chemical_refinery';
  machineCode?: string; // e.g. "MK-1003", "MK-2001"
  tier: number;
  timeSeconds?: number;
  energyCost: number;
  inputCollectorId?: 'col_debris' | 'col_minerals' | 'col_gases';
  inputCollectorAmount?: number;
  inputItems?: ConfigRecipeItemCost[];
  outputItems: ConfigRecipeItemCost[];
  unlockFeature?: string;
  description: string;
}

export interface ConfigCombatArchetype {
  id: 'piercing_kinetic' | 'plasma_corrosion' | 'emp_concussion' | 'shield_drain';
  name: string;
  icon: string;
  role: string;
  description: string;
  color: string;
  pierceCount?: number;
  damageFalloff?: number;
  dotDuration?: number;
  dotDamagePercent?: number;
  maxStacks?: number;
  slowPercent?: number;
  slowDuration?: number;
  aoeRadius?: number;
  absorptionRatio?: number;
  buffDuration?: number;
  stats: Record<string, string>;
}

export interface ConfigUniverse {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  accentBorder: string;
  unlocked: boolean;
  unlockRequirement: string;
  description: string;
}

export interface ConfigCircuitNode {
  id: string;
  universeId: string;
  tier: number;
  gridX: number;
  gridY: number;
  name: string;
  description: string;
  iconName: string;
  costMatter: number;
  costTech: number;
  costCombatData: number;
  costDimMat: number;
  unlocked: boolean;
  reqIds: string[];
  connectedNodeIds?: string[];
  effect: {
    stat: string;
    value: number;
  };
}

export interface ConfigSector {
  id: string;
  name: string;
  category: 'core' | 'logistics' | 'science' | 'military';
  level: number;
  maxLevel: number;
  installed: boolean;
  status: 'operational' | 'damaged' | 'disabled';
  description: string;
  unlockedFeature: string;
  costMatter: number;
  costTech: number;
  costDimMat: number;
  hp: number;
  maxHp: number;
}

export interface ConfigBalance {
  idle: {
    baseEnergyGain: number;
    overclockMultiplier: number;
    emergencyRepairCostMatter: number;
    collectorBaseRates: {
      debris: number;
      minerals: number;
      gases: number;
    };
    collectorCapacities: {
      debris: number;
      minerals: number;
      gases: number;
    };
    storageBase: {
      solidKg: number;
      gasL: number;
    };
    rateGrowthFactorPerLevel: number;
  };
  expedition: {
    portalBaseCost: number;
    warpDiscountCost: number;
    enemyHpScalingFactor: number;
    enemyDamageScalingFactor: number;
    dropRateMultiplierPerWave: number;
    lootTable: Record<string, { min: number; max: number; chance: number }>;
  };
  scaling: {
    bonusPerLevel: number;
    costMultiplierPerLevel: number;
  };
}

function parseConfigArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray((raw as any).default)) return (raw as any).default as T[];
  return [];
}

// Export typed configurations with defensive fallback
export const GAME_MATERIALS: ConfigMaterial[] = parseConfigArray<ConfigMaterial>(rawMaterials);
export const GAME_RECIPES: ConfigRecipe[] = parseConfigArray<ConfigRecipe>(rawRecipes);
export const GAME_ARCHETYPES: ConfigCombatArchetype[] = parseConfigArray<ConfigCombatArchetype>(rawArchetypes);
export const GAME_UNIVERSES: ConfigUniverse[] = parseConfigArray<ConfigUniverse>(rawUniverses);
export const GAME_CIRCUITS: ConfigCircuitNode[] = parseConfigArray<ConfigCircuitNode>(rawCircuits);
export const GAME_SECTORS: ConfigSector[] = parseConfigArray<ConfigSector>(rawSectors);
export const GAME_BALANCE: ConfigBalance = ((rawBalance as any)?.default || rawBalance) as ConfigBalance;

// Helper to look up material easily
export function getMaterialById(id: string): ConfigMaterial | undefined {
  return GAME_MATERIALS.find((m) => m.id === id);
}

// Helper to look up recipes by station
export function getRecipesByStation(station: ConfigRecipe['station']): ConfigRecipe[] {
  return GAME_RECIPES.filter((r) => r.station === station);
}
