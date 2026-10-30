/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Unlockable Base Sectors
export type BaseSectorId =
  | 'command'
  | 'inventory'
  | 'circuits'
  | 'equipment'
  | 'refinery'
  | 'research'
  | 'shields'
  | 'reactor';

export type SectorStatus = 'operational' | 'damaged' | 'disabled';

export interface BaseSector {
  id: BaseSectorId;
  name: string;
  category: 'core' | 'logistics' | 'science' | 'military';
  level: number;
  maxLevel: number;
  installed: boolean; // locked at start until constructed!
  status: SectorStatus;
  description: string;
  unlockedFeature: string;
  costMatter: number;
  costTech: number;
  costDimMat: number;
  hp: number;
  maxHp: number;
}

// Backward compatibility for legacy tower state
export type SectorType = 'reactor' | 'arsenal' | 'shields' | 'workshops';
export interface SectorData {
  name: string;
  type: SectorType;
  hp: number;
  maxHp: number;
  level: number;
  status: SectorStatus;
  description: string;
}

export interface TowerState {
  coreHp: number;
  maxCoreHp: number;
  sectors: Record<SectorType, SectorData>;
  baseSectors: Record<BaseSectorId, BaseSector>;
}

export interface PlayerResources {
  dimensionalEnergy: number;
  maxDimensionalEnergy: number;
  commonMatter: number;
  techComponents: number;
  dimensionalMaterials: number;
  combatData: number;
  // Warehouse & inventory tracking (Dual: Solids in kg, Gases in Liters)
  storageUsed: number;
  storageMax: number;
  gasStorageUsed: number;
  gasStorageMax: number;
}

// Physical state and industrial tier
export type ItemPhysicalState = 'solid' | 'gas' | 'liquid';
export type ItemStage = 'raw' | 'refined' | 'subproduct' | 'component';

// Inventory & Warehouse Items
export interface InventoryItem {
  id: string;
  code?: string; // e.g. "PD-1001"
  name: string;
  type: 'ore' | 'crystal' | 'component' | 'dimensional' | 'alloy' | 'gas' | 'chemical' | 'scrap' | 'metal' | 'plastic' | 'electric' | 'organic';
  physicalState: ItemPhysicalState; // 'solid' -> kg, 'gas' -> L, 'liquid' -> L
  unit: 'kg' | 'L' | 'un' | 'm³';
  quantity: number;
  unitWeight: number; // in kg (solids) or L (gases/liquids)
  icon: string;
  color: string;
  stage: ItemStage;
  description: string;
  refineYield?: {
    matter?: number;
    energy?: number;
    tech?: number;
    dimMat?: number;
  };
}

// Collector Architecture
export type CollectorId = 'col_gases' | 'col_minerals' | 'col_debris';

export interface CollectorBufferItem {
  id: string;
  name: string;
  amount: number;
  unit: 'kg' | 'L';
  yieldItemId: string; // What refined product it creates
}

export type CombatArchetypeId = 'piercing_kinetic' | 'plasma_corrosion' | 'emp_concussion' | 'shield_drain';

export interface CollectorState {
  id: CollectorId;
  name: string;
  subsystemName: string;
  physicalState: ItemPhysicalState;
  unit: 'kg' | 'L';
  currentAmount: number;
  capacity: number; // When 100%, collection stops until drained/processed
  ratePerSecond: number;
  status: 'COLLECTING' | 'FULL' | 'AUTOMATED' | 'OFFLINE';
  isAutomated: boolean; // Dutos de alimentação automatizados
  isUnlocked?: boolean; // Bloqueado no início até ser construído
  unlockHint?: string; // Como o jogador desbloqueia
  bufferItems: CollectorBufferItem[];
  icon: string;
}

// Processing and Crafting Recipes (Tree: Stage 0 -> 1 -> 2 -> 3)
export interface ProcessingRecipe {
  id: string;
  name: string;
  category: 'cryogenic' | 'furnace' | 'dismantler' | 'foundry';
  targetCollectorId?: CollectorId;
  inputCollectorCost?: number; // amount taken from collector buffer
  inputItems?: { itemId: string; quantity: number }[];
  outputItems: { itemId: string; quantity: number }[];
  energyCost: number;
  tier: 1 | 2 | 3;
  description: string;
  unlocked: boolean;
}

// Industrial Automation Upgrades
export interface AutomationUpgrade {
  id: string;
  name: string;
  description: string;
  costMatter: number;
  costTech: number;
  costItems?: { itemId: string; quantity: number }[];
  installed: boolean;
  type: 'ore_pipeline' | 'gas_compressor' | 'scrap_sorter' | 'expanded_silos' | 'cryo_tanks';
}

// Expandable Storage Compartments (Silos, Cryo Tanks, Modular Vaults)
export interface StorageCompartment {
  id: string;
  code: string;
  name: string;
  type: 'silo' | 'cryo' | 'modular';
  weightBonus: number; // kg
  liquidBonus: number; // L
  volumeBonus: number; // m³
  built: boolean;
  costItems: { itemId: string; quantity: number }[];
  description: string;
}


// Multiverse Circuit Tree
export type UniverseId = 'univ_matter' | 'univ_quantum' | 'univ_void';

export interface UniverseInfo {
  id: UniverseId;
  name: string;
  subtitle: string;
  color: string;
  accentBorder: string;
  unlocked: boolean;
  unlockRequirement: string;
  description: string;
}

export interface CircuitNode {
  id: string;
  universeId: UniverseId;
  tier: 0 | 1 | 2 | 3 | 4;
  gridX: number; // Horizontal coordinate on circuit board
  gridY: number; // Vertical coordinate (0 = central axis, >0 north, <0 south)
  name: string;
  description: string;
  iconName: string;
  costMatter: number;
  costTech: number;
  costCombatData: number;
  costDimMat: number;
  unlocked: boolean;
  reqIds: string[]; // Connected parent/prerequisite nodes
  connectedNodeIds?: string[]; // All bidirectional connections in circuit bus
  effect: {
    stat:
      | 'towerShots' // extra automated cannons/attacks!
      | 'towerDamage'
      | 'fireRate'
      | 'miningSpeed'
      | 'droneCount'
      | 'autoRepairRate'
      | 'vacuumRadius'
      | 'shieldCap'
      | 'critChance'
      | 'overclockEfficiency'
      | 'storageBonus';
    value: number;
  };
}

// Backward compatibility alias for TowerPassiveNode
export type TowerPassiveNode = CircuitNode;

// Autonomous Equipment Modules (Habilidades Automáticas não-jogáveis com ativação própria)
export interface AutonomousModule {
  id: string;
  name: string;
  role: string;
  description: string;
  interval: number; // Trigger interval in seconds (e.g. every 12s)
  lastFiredTime: number; // timestamp
  progressPct: number; // 0 to 100% cooldown progress
  energyCost: number;
  unlocked: boolean;
  equipped: boolean;
  slotIndex: number; // 0..3 or -1
  costMatter: number;
  costTech: number;
  costCombatData: number;
  category: 'offensive' | 'defensive' | 'support' | 'tactical';
  icon: string;
}

// Backward-compatible Active Skill type
export type SkillType =
  | 'emp_blast'
  | 'overdrive'
  | 'orbital_strike'
  | 'nano_repair'
  | 'phase_shield'
  | 'missile_swarm';

export interface TowerActiveSkill {
  id: SkillType;
  name: string;
  description: string;
  cooldown: number;
  lastUsedTime: number;
  energyCost: number;
  unlocked: boolean;
  unlockCostMatter: number;
  unlockCostData: number;
  unlockCostTech: number;
  category: 'offensive' | 'defensive' | 'tactical';
}

export type TechBranch = 'efficiency' | 'infrastructure' | 'stability' | 'research';

export interface TechUpgrade {
  id: string;
  branch: TechBranch;
  name: string;
  description: string;
  costMatter: number;
  costCombatData: number;
  level: number;
  maxLevel: number;
  multiplier: number;
  unlocked: boolean;
}

export type ModuleType =
  | 'pulse_cannon'
  | 'beam_cruiser'
  | 'plasma_battery'
  | 'flux_harvester'
  | 'missile_launcher'
  | 'tesla_coil'
  | 'railgun_bastion'
  | 'nanobot_drone';

export interface CombatCurrencies {
  nanoMatter: number;
  microCircuits: number;
  tacticalData: number;
  dimensionalMatrix: number;
}

export interface TacticalCost {
  nanoMatter: number;
  microCircuits: number;
  tacticalData?: number;
  dimensionalMatrix?: number;
}

export interface DefenseModuleDef {
  type: ModuleType;
  code?: string;
  name: string;
  role: string;
  description: string;
  baseCost: number;
  baseHp: number;
  baseDamage: number;
  baseRange: number;
  baseFireRate: number;
  aoeHexRadius?: number;
  color: string;
  unlockCostData: number;
  unlocked: boolean;
  tacticalSpecialty: string;
  tacticalCost?: TacticalCost;
  craftCostItems?: { itemId: string; quantity: number }[];
}

export interface PlacedModule {
  instanceId: string;
  hexKey: string;
  q: number;
  r: number;
  type: ModuleType;
  level: number;
  currentHp: number;
  maxHp: number;
  damage: number;
  range: number;
  fireRate: number;
  aoeHexRadius?: number;
  hitFlash?: number;
  lastShotTime: number;
  kills: number;
  damageDealt: number;
  accumulatedResources: number;
  lastPulseTime?: number;
}

export type EnemyType = 'hunter' | 'saboteur' | 'siege' | 'parasite' | 'invader' | 'colossus';

export interface EnemyDef {
  type: EnemyType;
  name: string;
  description: string;
  baseHp: number;
  speed: number;
  damage: number;
  targetPreference: 'fleets' | 'sectors' | 'shields' | 'core';
  dropValue: number;
  color: string;
  size: number;
}

export type RoguelikeCategory = 'material' | 'position' | 'timing' | 'general';
export type TacticalMaterialTarget = 'copper' | 'iron_steel' | 'silica' | 'polymer' | 'all';
export type TacticalPositionTarget = 'outer' | 'mid' | 'inner' | 'cluster';
export type TacticalTimingCondition = 'early_wave' | 'late_wave' | 'sustained_fire' | 'periodic';

export interface RoguelikeUpgrade {
  id: string;
  name: string;
  category: RoguelikeCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  flavor: string;
  targetMaterial?: TacticalMaterialTarget;
  targetRingZone?: TacticalPositionTarget;
  timingCondition?: TacticalTimingCondition;
  effect: {
    stat:
      | 'damage'
      | 'range'
      | 'fireRate'
      | 'harvest'
      | 'recoilResource'
      | 'critChance'
      | 'chainDamage'
      | 'hullHp'
      | 'healPower'
      | 'deathExplosion'
      | 'globalDefense';
    value: number;
  };
}

export interface ExpeditionCargo {
  matter: number;
  techComponents: number;
  dimensionalMaterials: number;
  combatData: number;
  items?: Record<string, number>;
}

export type GameMode = 'OPERATION' | 'EXPEDITION';

export type ExpeditionPhase =
  | 'SPAWNING'
  | 'COMBAT'
  | 'WAVE_CLEAR'
  | 'UPGRADE_SELECTION'
  | 'EXTRACTION_CHECKPOINT'
  | 'DEFEAT'
  | 'EXTRACTED';
