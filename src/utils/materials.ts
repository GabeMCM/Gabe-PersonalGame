/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GAME_MATERIALS, ConfigMaterial } from '../config';

// Legacy / alias map so old identifiers map to the new PD-xxxx catalog
export const LEGACY_MATERIAL_ID_MAP: Record<string, string> = {
  steel_scrap: 'scrap.structural',
  scrap_steel: 'scrap.structural',
  scrap: 'scrap.structural',
  scrap_hull: 'scrap.structural',
  raw_armor_scrap: 'scrap.structural',
  pure_silicon: 'raw.silica_sand',
  silicon: 'raw.silica_sand',
  quartz: 'raw.quartz',
  copper_wire: 'mat.copper_wire',
  copper: 'raw.copper_ore',
  wire: 'scrap.electrical',
  scrap_wiring: 'scrap.electrical',
  raw_wiring: 'scrap.electrical',
  plastic: 'mat.recovered_polymer',
  plastics: 'mat.recovered_polymer',
  comp_plastic: 'mat.recovered_polymer',
  iron: 'mat.iron_ingot',
  iron_ore: 'raw.ferrous_regolith',
  raw_iron: 'raw.ferrous_regolith',
  raw_meteorite: 'raw.ferrous_regolith',
  ore_meteoritic_iron: 'raw.ferrous_regolith',
  iron_scrap: 'scrap.structural',
  titanium: 'raw.titanium_ore',
  oxygen: 'raw.oxygen_mix',
  canister_oxygen: 'raw.oxygen_mix',
  hydrogen: 'raw.hydrogen_gas',
  canister_hydrogen: 'raw.hydrogen_gas',
  helium3: 'raw.helium_mix',
  he3: 'raw.helium_mix',
  gas_he3: 'raw.helium_mix',
  nanites: 'raw.organic_residue',
  organic: 'raw.organic_residue',
  comp_organic: 'raw.organic_residue',
  pcb: 'part.circuit_scrap',
  comp_pcb_board: 'part.circuit_scrap',
  plasma: 'mat.dense_plasma',
  cell_plasma_fusion: 'mat.dense_plasma',
  durasteel: 'mat.iron_sheet',
  plate_durasteel: 'mat.iron_sheet',
  comp_electric: 'part.connector',
};

// Known human names for collectors and subsystem codes
export const SYSTEM_CODE_NAME_MAP: Record<string, string> = {
  col_debris: 'Coletor de Sucata [MK-1001]',
  col_minerals: 'Coletor de Minério [MK-1004]',
  col_gases: 'Coletor de Gases [MK-2202]',
};

/**
 * Returns the technical code (PD-xxxx, FR-xxxx, MK-xxxx, RC-xxxx) for any material or entity.
 */
export function getMaterialCode(itemId: string | undefined | null): string {
  if (!itemId) return 'PD-0000';
  if (/^(PD|FR|MK|RC)-\d{4}$/.test(itemId)) return itemId;

  const mat = GAME_MATERIALS.find((m) => m.id === itemId);
  if (mat && mat.code) return mat.code;

  const mappedId = LEGACY_MATERIAL_ID_MAP[itemId];
  if (mappedId) {
    const mappedMat = GAME_MATERIALS.find((m) => m.id === mappedId);
    if (mappedMat && mappedMat.code) return mappedMat.code;
  }

  return 'PD-1000';
}

/**
 * Returns a human-friendly material name in Portuguese.
 */
export function getMaterialDisplayName(itemId: string | undefined | null): string {
  if (!itemId) return 'Material Desconhecido';

  // 1. Check exact match in GAME_MATERIALS
  const mat = GAME_MATERIALS.find((m) => m.id === itemId || m.code === itemId);
  if (mat && mat.name) return mat.name;

  // 2. Check legacy alias map
  const mappedId = LEGACY_MATERIAL_ID_MAP[itemId];
  if (mappedId) {
    const mappedMat = GAME_MATERIALS.find((m) => m.id === mappedId);
    if (mappedMat && mappedMat.name) return mappedMat.name;
  }

  // 3. Check system code name map
  if (SYSTEM_CODE_NAME_MAP[itemId]) {
    return SYSTEM_CODE_NAME_MAP[itemId];
  }

  // 4. Humanize snake_case or kebab-case string into Clean Title Case
  return itemId
    .replace(/^raw\.|^mat\.|^part\.|^scrap\.|^comp_|^ore_|^metal_|^gas_|^canister_|^plate_|^ingot_/, '')
    .split(/[_-\s.]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Returns a Lucide icon component name for the material.
 * Absolutely NO emojis are returned.
 */
export function getMaterialIcon(itemId: string | undefined | null): string {
  if (!itemId) return 'Box';
  const mat = GAME_MATERIALS.find((m) => m.id === itemId || m.code === itemId);
  if (mat && mat.icon) return mat.icon;

  const mappedId = LEGACY_MATERIAL_ID_MAP[itemId];
  if (mappedId) {
    const mappedMat = GAME_MATERIALS.find((m) => m.id === mappedId);
    if (mappedMat && mappedMat.icon) return mappedMat.icon;
  }

  if (itemId.includes('scrap') || itemId.includes('hull')) return 'Layers';
  if (itemId.includes('electric') || itemId.includes('wire') || itemId.includes('coil')) return 'Zap';
  if (itemId.includes('mechanical') || itemId.includes('gear') || itemId.includes('shaft')) return 'Wrench';
  if (itemId.includes('electronic') || itemId.includes('circuit')) return 'Cpu';
  if (itemId.includes('gas') || itemId.includes('canister') || itemId.includes('hydrogen')) return 'Wind';
  if (itemId.includes('fluid') || itemId.includes('oil') || itemId.includes('acid') || itemId.includes('liquid')) return 'Droplet';
  if (itemId.includes('thermal') || itemId.includes('furnace') || itemId.includes('plasma')) return 'Flame';

  return 'Box';
}

export function getMaterialUnit(itemId: string | undefined | null): string {
  if (!itemId) return 'kg';
  const mat = GAME_MATERIALS.find((m) => m.id === itemId || m.code === itemId);
  if (mat && mat.unit) return mat.unit;

  const mappedId = LEGACY_MATERIAL_ID_MAP[itemId];
  if (mappedId) {
    const mappedMat = GAME_MATERIALS.find((m) => m.id === mappedId);
    if (mappedMat && mappedMat.unit) return mappedMat.unit;
  }

  if (itemId.includes('gas') || itemId.includes('fluid') || itemId.includes('oil')) return 'L';
  return 'kg';
}

export function getMaterialInfo(itemId: string | undefined | null): ConfigMaterial | undefined {
  if (!itemId) return undefined;
  const mat = GAME_MATERIALS.find((m) => m.id === itemId || m.code === itemId);
  if (mat) return mat;
  const mappedId = LEGACY_MATERIAL_ID_MAP[itemId];
  if (mappedId) {
    return GAME_MATERIALS.find((m) => m.id === mappedId);
  }
  return undefined;
}

/**
 * Calculates volume (m³), weight (kg) and liquid volume (L) for any material quantity.
 * Supports the 3 measurement units: Volume (m³), Peso (kg), Litros (L).
 */
export function getMaterialPhysicalMetrics(itemId: string, quantity: number) {
  const info = getMaterialInfo(itemId);
  const isGas = (info?.physicalState as string) === 'gas' || (info?.physicalState as string) === 'liquid' || itemId.includes('gas') || itemId.includes('canister');
  const unit = info?.unit || (isGas ? 'L' : 'kg');

  let weightKg = 0;
  let liquidL = 0;

  if (isGas) {
    liquidL = quantity;
  } else {
    weightKg = quantity * (info?.unitWeight || 1.0);
  }

  // Volume in cubic meters (m³): solids ~0.05 m³/kg, gases ~0.04 m³/L, components ~0.03 m³/un
  const volumeM3 = Math.round((weightKg * 0.05 + liquidL * 0.04) * 100) / 100;

  return {
    weightKg: Math.round(weightKg * 10) / 10,
    liquidL: Math.round(liquidL * 10) / 10,
    volumeM3,
    isGas,
    unit,
    primaryValueString: isGas ? `${quantity} L` : `${weightKg} kg`,
    fullSummary: `${isGas ? `${quantity} L` : `${weightKg} kg`} · ${volumeM3} m³`,
  };
}
