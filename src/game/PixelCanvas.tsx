/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  useGame,
  DEFAULT_MODULE_DEFS,
  MODULE_MATERIAL_MAP,
  DEFAULT_ESCALATED_MODULES,
} from '../context/GameContext';
import { getPlayableGrid, getHexesInAoE, hexDistance } from './HexGrid';
import { EnemyType, ModuleType, PlacedModule, RoguelikeUpgrade } from '../types/game';
import { sound } from '../utils/audio';
import {
  drawDetailedFleetSprite,
  drawDetailedEnemySprite,
  getModuleSpriteDataUrl,
} from './PixelSprites';
import { GAME_MATERIALS, GAME_BALANCE } from '../config';
import {
  Crosshair,
  Shield,
  TrendingUp,
  Trash2,
  X,
  Zap,
  Coins,
  Sparkles,
} from 'lucide-react';

// Hexagon size: 14px radius (dense tactical layout)
export const PIXEL_HEX_RADIUS = 14;

export function hexToPixelWorld(q: number, r: number, radius = PIXEL_HEX_RADIUS) {
  const x = radius * Math.sqrt(3) * (q + r / 2);
  const y = radius * (3 / 2) * r;
  return { x, y };
}

// Convert world coordinates to axial hex (q, r)
export function pixelWorldToHex(wx: number, wy: number, radius = PIXEL_HEX_RADIUS): { q: number; r: number } {
  const q_frac = ((Math.sqrt(3) / 3) * wx - (1 / 3) * wy) / radius;
  const r_frac = ((2 / 3) * wy) / radius;
  const x_frac = q_frac;
  const z_frac = r_frac;
  const y_frac = -x_frac - z_frac;

  let rx = Math.round(x_frac);
  let ry = Math.round(y_frac);
  let rz = Math.round(z_frac);

  const x_diff = Math.abs(rx - x_frac);
  const y_diff = Math.abs(ry - y_frac);
  const z_diff = Math.abs(rz - z_frac);

  if (x_diff > y_diff && x_diff > z_diff) {
    rx = -ry - rz;
  } else if (y_diff > z_diff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { q: rx, r: rz };
}

interface PixelEnemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  pattern: 'arc' | 'spiral' | 'zigzag' | 'erratic' | 'siege_stance';
  spawnAngle: number;
  spawnRadius: number;
  currentRadius: number;
  phaseOffset: number;
  hitFlash: number;
  burnDuration?: number;
  slowDuration?: number;
  rewardMatter: number;
  rewardTech: number;
  rewardData: number;
  rewardDim?: number;
  lastShotTime?: number;
  siegeChargeTimer?: number;
}

interface PixelProjectile {
  id: string;
  type: 'pulse' | 'laser' | 'plasma' | 'missile' | 'tesla' | 'railgun' | 'nanobot' | 'emp';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  life: number;
  maxLife: number;
  radius: number;
  targetX?: number;
  targetY?: number;
  targetEnemyId?: string;
  damage: number;
  progress: number;
  speed: number;
  splashRadius: number;
  color: string;
  isHoming?: boolean;
}

interface PixelDebris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface FloatingCombatText {
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  scale?: number;
}

interface LootCrystal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  collected?: boolean;
}

interface EnemyProjectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  glowColor: string;
  type: 'plasma_red' | 'needle_green' | 'void_purple' | 'acid_yellow' | 'beam_crimson' | 'cosmic_blue';
  radius: number;
  life: number;
  maxLife: number;
  targetModuleKey?: string | null;
}

// Strategic Module Stat Evaluator
function computeTacticalStats(
  mod: PlacedModule,
  allPlaced: Record<string, PlacedModule>,
  rogues: RoguelikeUpgrade[],
  waveElapsedSeconds: number,
  isOverdrive: boolean
) {
  let damageMult = 1.0;
  let fireRateMult = isOverdrive ? 2.2 : 1.2;
  let rangeMult = 1.0;
  let hpMult = 1.0;
  let critChance = 0.05;

  const modMaterials = MODULE_MATERIAL_MAP[mod.type] || ['all'];
  const ringDist = Math.max(Math.abs(mod.q), Math.abs(mod.r), Math.abs(-mod.q - mod.r));
  const isOuter = ringDist >= 8;
  const isMid = ringDist >= 5 && ringDist <= 7;
  const isInner = ringDist >= 3 && ringDist <= 4;

  let adjacentCount = 0;
  Object.values(allPlaced).forEach((other) => {
    if (other.hexKey !== mod.hexKey && hexDistance({ q: mod.q, r: mod.r }, { q: other.q, r: other.r }) === 1) {
      adjacentCount++;
    }
  });

  rogues.forEach((upg) => {
    // 1. Material
    if (upg.category === 'material') {
      const match = upg.targetMaterial === 'all' || (upg.targetMaterial && modMaterials.includes(upg.targetMaterial));
      if (match) {
        if (upg.effect.stat === 'fireRate') fireRateMult += upg.effect.value;
        if (upg.effect.stat === 'hullHp') hpMult += upg.effect.value;
        if (upg.effect.stat === 'damage') damageMult += upg.effect.value;
        if (upg.effect.stat === 'range') rangeMult += upg.effect.value;
        if (upg.effect.stat === 'healPower') hpMult += 0.15;
      }
    }

    // 2. Position
    if (upg.category === 'position') {
      if (upg.targetRingZone === 'outer' && isOuter) {
        if (upg.effect.stat === 'damage') damageMult += upg.effect.value;
      } else if (upg.targetRingZone === 'mid' && isMid) {
        if (upg.effect.stat === 'fireRate') fireRateMult += upg.effect.value;
        rangeMult += 0.2;
      } else if (upg.targetRingZone === 'inner' && isInner) {
        if (upg.effect.stat === 'hullHp') hpMult += upg.effect.value;
      } else if (upg.targetRingZone === 'cluster' && adjacentCount > 0) {
        damageMult += upg.effect.value * adjacentCount;
        hpMult += upg.effect.value * adjacentCount;
      }
    }

    // 3. Timing
    if (upg.category === 'timing') {
      if (upg.timingCondition === 'early_wave' && waveElapsedSeconds <= 20) {
        if (upg.effect.stat === 'fireRate') fireRateMult += upg.effect.value;
      } else if (upg.timingCondition === 'late_wave' && waveElapsedSeconds > 30) {
        if (upg.effect.stat === 'damage') damageMult += upg.effect.value;
        critChance += 0.25;
      } else if (upg.timingCondition === 'sustained_fire') {
        const sustained = Math.min(0.5, waveElapsedSeconds * 0.03);
        fireRateMult += sustained;
      }
    }

    // 4. General
    if (upg.category === 'general') {
      if (upg.effect.stat === 'damage') damageMult += upg.effect.value;
      if (upg.effect.stat === 'range') rangeMult += 0.15;
      if (upg.effect.stat === 'critChance') critChance += upg.effect.value;
      if (upg.effect.stat === 'hullHp') hpMult += upg.effect.value;
    }
  });

  const computedMaxHp = Math.round(mod.maxHp * hpMult);
  // Preserva a integridade e nunca encolhe a vida ao adquirir melhorias de HP
  const effectiveCurHp =
    mod.currentHp === undefined || mod.currentHp >= mod.maxHp
      ? computedMaxHp
      : Math.max(1, Math.round((mod.currentHp / mod.maxHp) * computedMaxHp));

  return {
    damage: Math.round(mod.damage * damageMult),
    fireRate: (mod.fireRate || 1) * fireRateMult,
    range: Math.round(mod.range * rangeMult),
    maxHp: computedMaxHp,
    effectiveCurHp,
    critChance,
  };
}

// Categorized material pools for balanced expedition drops across all game products
const COMMON_DROP_POOL = (GAME_MATERIALS || []).filter(
  (m) => m.rarity === 'common' || m.stage === 'raw'
);
const UNCOMMON_DROP_POOL = (GAME_MATERIALS || []).filter(
  (m) => m.rarity === 'uncommon' || m.stage === 'refined'
);
const RARE_DROP_POOL = (GAME_MATERIALS || []).filter(
  (m) => m.rarity === 'rare' || m.stage === 'component'
);
const EPIC_DROP_POOL = (GAME_MATERIALS || []).filter(
  (m) => m.rarity === 'epic' || m.rarity === 'legendary' || m.family === 'dimensional'
);

function generateBalancedEnemyLoot(enemyType: EnemyType, wave: number): Record<string, number> {
  const drops: Record<string, number> = {};

  // Calibrated drop chance: prevents flooding while allowing any item from the tech tree to drop
  let chance = 0.16;
  let count = 1;
  let rareWeight = 0.08 + Math.min(0.12, wave * 0.02);
  let uncommonWeight = 0.28;

  if (enemyType === 'colossus') {
    chance = 1.0;
    count = Math.random() < 0.5 ? 2 : 1;
    rareWeight = 0.45;
    uncommonWeight = 0.40;
  } else if (enemyType === 'siege') {
    chance = 0.45;
    count = 1;
    rareWeight = 0.22;
    uncommonWeight = 0.42;
  } else if (enemyType === 'saboteur') {
    chance = 0.24;
    rareWeight = 0.14;
    uncommonWeight = 0.32;
  } else if (enemyType === 'hunter') {
    chance = 0.20;
  }

  if (Math.random() > chance) return drops;

  for (let c = 0; c < count; c++) {
    const roll = Math.random();
    let pool = COMMON_DROP_POOL;

    if (roll < rareWeight * 0.25 && EPIC_DROP_POOL.length > 0) {
      pool = EPIC_DROP_POOL;
    } else if (roll < rareWeight && RARE_DROP_POOL.length > 0) {
      pool = RARE_DROP_POOL;
    } else if (roll < rareWeight + uncommonWeight && UNCOMMON_DROP_POOL.length > 0) {
      pool = UNCOMMON_DROP_POOL;
    }

    if (pool.length > 0) {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      drops[chosen.id] = (drops[chosen.id] || 0) + 1;
    }
  }

  return drops;
}

export const PixelCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    currentWave,
    tower,
    setTower,
    placedModules,
    setPlacedModules,
    selectedHex,
    setSelectedHex,
    selectedDeployType,
    setSelectedDeployType,
    combatResources,
    setCombatResources,
    combatCurrencies,
    addCombatCurrencies,
    addVolatileCargo,
    onWaveComplete,
    handleDefeat,
    deployModuleToHex,
    upgradePlacedModule,
    repairPlacedModule,
    recyclePlacedModule,
    activeRoguelikeUpgrades,
    activeSkillEffects,
    timeSpeed,
    wavePointsCurrent,
    wavePointsTarget,
    addWavePoints,
    expeditionPhase,
    escalatedModules = DEFAULT_ESCALATED_MODULES,
    defenseModuleDefs = DEFAULT_MODULE_DEFS,
  } = useGame();

  const [radialPos, setRadialPos] = useState<{ x: number; y: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredRadialItem, setHoveredRadialItem] = useState<string | null>(null);

  useEffect(() => {
    if (selectedHex) {
      const timer = setTimeout(() => setMenuOpen(true), 16);
      return () => clearTimeout(timer);
    } else {
      setMenuOpen(false);
    }
  }, [selectedHex]);

  const handleCloseMenu = useCallback(() => {
    sound.playClick();
    setMenuOpen(false);
    setTimeout(() => {
      setSelectedHex(null);
      setSelectedDeployType(null);
    }, 180);
  }, [setSelectedHex, setSelectedDeployType]);

  const stateRef = useRef({
    currentWave,
    tower,
    placedModules,
    selectedHex,
    selectedDeployType,
    activeRoguelikeUpgrades,
    activeSkillEffects,
    timeSpeed,
    wavePointsCurrent,
    wavePointsTarget,
    expeditionPhase,
    escalatedModules,
    combatResources,
    combatCurrencies,
    defenseModuleDefs,
  });

  useEffect(() => {
    stateRef.current = {
      currentWave,
      tower,
      placedModules,
      selectedHex,
      selectedDeployType,
      activeRoguelikeUpgrades,
      activeSkillEffects,
      timeSpeed,
      wavePointsCurrent,
      wavePointsTarget,
      expeditionPhase,
      escalatedModules,
      combatResources,
      combatCurrencies,
      defenseModuleDefs,
    };
  }, [
    currentWave,
    tower,
    placedModules,
    selectedHex,
    selectedDeployType,
    activeRoguelikeUpgrades,
    activeSkillEffects,
    timeSpeed,
    wavePointsCurrent,
    wavePointsTarget,
    expeditionPhase,
    escalatedModules,
    combatResources,
    combatCurrencies,
    defenseModuleDefs,
  ]);

  const callbacksRef = useRef({
    setSelectedHex,
    setSelectedDeployType,
    setCombatResources,
    addCombatCurrencies,
    addVolatileCargo,
    onWaveComplete,
    handleDefeat,
    deployModuleToHex,
    upgradePlacedModule,
    repairPlacedModule,
    recyclePlacedModule,
    setTower,
    setPlacedModules,
    addWavePoints,
  });

  useEffect(() => {
    callbacksRef.current = {
      setSelectedHex,
      setSelectedDeployType,
      setCombatResources,
      addCombatCurrencies,
      addVolatileCargo,
      onWaveComplete,
      handleDefeat,
      deployModuleToHex,
      upgradePlacedModule,
      repairPlacedModule,
      recyclePlacedModule,
      setTower,
      setPlacedModules,
      addWavePoints,
    };
  }, [
    setSelectedHex,
    setSelectedDeployType,
    setCombatResources,
    addCombatCurrencies,
    addVolatileCargo,
    onWaveComplete,
    handleDefeat,
    deployModuleToHex,
    upgradePlacedModule,
    repairPlacedModule,
    recyclePlacedModule,
    setTower,
    setPlacedModules,
    addWavePoints,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Camera state
    let camX = 0;
    let camY = 0;
    let camZoom = 0.95;
    let targetCamX = 0;
    let targetCamY = 0;
    let targetCamZoom = 0.95;

    // Screen Shake
    let screenShake = 0;

    // Mouse tracking
    let mouseScreenX = 0;
    let mouseScreenY = 0;
    let isDragging = false;
    let dragStartScreen = { x: 0, y: 0 };
    let dragStartCam = { x: 0, y: 0 };
    let hoveredHex: { q: number; r: number } | null = null;

    // Playable grid coordinates (Rings 3 to 11)
    const playableHexes = getPlayableGrid(3, 11);
    const hexPosMap: { q: number; r: number; x: number; y: number }[] = playableHexes.map((h) => {
      const pos = hexToPixelWorld(h.q, h.r);
      return { q: h.q, r: h.r, x: pos.x, y: pos.y };
    });

    function findHexAtWorldCoordinates(wx: number, wy: number): { q: number; r: number } | null {
      let closest: { q: number; r: number } | null = null;
      let minDistance = Infinity;

      for (let i = 0; i < hexPosMap.length; i++) {
        const item = hexPosMap[i];
        const dist = Math.hypot(wx - item.x, wy - item.y);
        if (dist < minDistance) {
          minDistance = dist;
          closest = item;
        }
      }

      if (closest && minDistance <= PIXEL_HEX_RADIUS * 0.96) {
        return { q: closest.q, r: closest.r };
      }
      return null;
    }

    // Stars
    const starCount = 380;
    const stars: { x: number; y: number; size: number; alpha: number; color: string; twinkleSpeed: number }[] = [];
    const starColors = ['#e0f2fe', '#fef08a', '#c084fc', '#67e8f9', '#ffffff', '#38bdf8'];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2800,
        y: (Math.random() - 0.5) * 2800,
        size: Math.random() < 0.2 ? 2.5 : Math.random() < 0.6 ? 1.5 : 1,
        alpha: 0.25 + Math.random() * 0.75,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        twinkleSpeed: 1 + Math.random() * 3,
      });
    }

    // Asteroids
    const backgroundAsteroids: { x: number; y: number; vx: number; vy: number; size: number; rot: number; vrot: number; color: string }[] = [];
    for (let i = 0; i < 18; i++) {
      backgroundAsteroids.push({
        x: (Math.random() - 0.5) * 2400,
        y: (Math.random() - 0.5) * 2400,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        size: 8 + Math.random() * 16,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.4,
        color: Math.random() < 0.5 ? '#1e293b' : '#334155',
      });
    }

    const nebulaClouds = [
      { x: -420, y: -260, r: 340, color: 'rgba(126, 34, 206, 0.18)' },
      { x: 380, y: 320, r: 380, color: 'rgba(14, 116, 144, 0.20)' },
      { x: -280, y: 400, r: 300, color: 'rgba(192, 38, 211, 0.16)' },
      { x: 440, y: -340, r: 320, color: 'rgba(217, 119, 6, 0.14)' },
      { x: 0, y: 0, r: 240, color: 'rgba(6, 182, 212, 0.12)' },
    ];

    // Combat runtime
    const activeEnemies: PixelEnemy[] = [];
    const activeProjectiles: PixelProjectile[] = [];
    const activeEnemyProjectiles: EnemyProjectile[] = [];
    const debrisList: PixelDebris[] = [];
    const floatingTexts: FloatingCombatText[] = [];
    const lootCrystals: LootCrystal[] = [];

    let waveRoster: EnemyType[] = [];
    let lastSpawnTime = 0;
    let waveStarted = false;
    let hasSpawnedAny = false;
    let lastWaveId = 0;
    let waveStartTime = 0;
    let lastPeriodicPulseIndex = 0;

    // Tactical Wave Builder: Alternating difficulty escalation
    // Ondas pares: Aumento massivo de quantidade de inimigos (enxames volumosos)
    // Ondas ímpares: Aumento severo de dano, blindagem e introdução de inimigos mais complexos
    function buildWave(wave: number): EnemyType[] {
      const roster: EnemyType[] = [];
      const isEvenWave = wave % 2 === 0;
      const totalCount = Math.round((18 + wave * 9) * (isEvenWave ? 1.3 : 1.05));

      if (wave === 1) {
        // Onda 1: 18 inimigos - Batedores e caçadores ligeiros
        for (let i = 0; i < 18; i++) {
          roster.push(i % 3 === 0 ? 'invader' : 'hunter');
        }
      } else if (wave === 2) {
        // Onda 2: Enxame acelerado com parasitas e invaders
        for (let i = 0; i < totalCount; i++) {
          if (i % 4 === 0) roster.push('parasite');
          else if (i % 2 === 0) roster.push('invader');
          else roster.push('hunter');
        }
      } else if (wave === 3) {
        // Onda 3: Infiltradores Saboteurs com distorção de fase roxa e maior letalidade
        for (let i = 0; i < totalCount; i++) {
          if (i % 3 === 0) roster.push('saboteur');
          else if (i % 2 === 0) roster.push('invader');
          else roster.push('hunter');
        }
      } else if (wave === 4) {
        // Onda 4: Enxame pesado (45+ naves) + 4 Cruzadores de Cerco (Siege)
        const siegeCount = 4;
        for (let s = 0; s < siegeCount; s++) roster.push('siege');
        for (let i = 0; i < totalCount - siegeCount; i++) {
          if (i % 3 === 0) roster.push('parasite');
          else if (i % 3 === 1) roster.push('saboteur');
          else roster.push('invader');
        }
      } else if (wave === 5) {
        // Onda 5: Boss Colossus Dreadnought Flagship + 6 Sieges + escolta completa
        roster.push('colossus');
        const siegeCount = 6;
        for (let s = 0; s < siegeCount; s++) roster.push('siege');
        for (let i = 0; i < totalCount - siegeCount - 1; i++) {
          if (i % 4 === 0) roster.push('parasite');
          else if (i % 4 === 1) roster.push('saboteur');
          else if (i % 4 === 2) roster.push('invader');
          else roster.push('hunter');
        }
      } else {
        // Ondas 6+: Armada mista completa com múltiplos colossos e cerco
        const colossusCount = Math.max(1, Math.floor(wave / 4));
        for (let c = 0; c < colossusCount; c++) roster.push('colossus');
        const siegeCount = Math.min(10, 4 + Math.floor(wave * 0.7));
        for (let s = 0; s < siegeCount; s++) roster.push('siege');
        const remaining = Math.max(20, totalCount - colossusCount - siegeCount);
        for (let i = 0; i < remaining; i++) {
          if (i % 4 === 0) roster.push('parasite');
          else if (i % 4 === 1) roster.push('saboteur');
          else if (i % 4 === 2) roster.push('invader');
          else roster.push('hunter');
        }
      }

      return roster;
    }

    const getCanvasMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / (rect.width || 1);
      const scaleY = canvas.height / (rect.height || 1);
      return {
        screenX: (e.clientX - rect.left) * scaleX,
        screenY: (e.clientY - rect.top) * scaleY,
      };
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        const { screenX, screenY } = getCanvasMousePos(e);
        dragStartScreen = { x: screenX, y: screenY };
        dragStartCam = { x: targetCamX, y: targetCamY };
        isDragging = true;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const { screenX, screenY } = getCanvasMousePos(e);
      mouseScreenX = screenX;
      mouseScreenY = screenY;

      if (isDragging) {
        const dx = (screenX - dragStartScreen.x) / camZoom;
        const dy = (screenY - dragStartScreen.y) / camZoom;
        targetCamX = dragStartCam.x - dx;
        targetCamY = dragStartCam.y - dy;
        return;
      }

      const wx = (mouseScreenX - width / 2) / camZoom + camX;
      const wy = (mouseScreenY - height / 2) / camZoom + camY;
      const hex = findHexAtWorldCoordinates(wx, wy);

      if (hex) {
        hoveredHex = hex;
        canvas.style.cursor = 'pointer';
      } else {
        hoveredHex = null;
        canvas.style.cursor = 'default';
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        const { screenX, screenY } = getCanvasMousePos(e);
        const dragDist = Math.hypot(screenX - dragStartScreen.x, screenY - dragStartScreen.y);
        isDragging = false;

        if (dragDist < 8) {
          const wx = (screenX - width / 2) / camZoom + camX;
          const wy = (screenY - height / 2) / camZoom + camY;
          const hex = findHexAtWorldCoordinates(wx, wy);

          if (hex) {
            callbacksRef.current.setSelectedHex(hex);
            sound.playClick();
          } else {
            // Click outside -> dismiss radial FAB & deselect
            callbacksRef.current.setSelectedHex(null);
            callbacksRef.current.setSelectedDeployType(null);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      targetCamZoom = Math.max(0.65, Math.min(3.2, targetCamZoom * zoomFactor));
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    function drawHexPath(context: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = cx + r * Math.cos(angle);
        const hy = cy + r * Math.sin(angle);
        if (i === 0) context.moveTo(hx, hy);
        else context.lineTo(hx, hy);
      }
      context.closePath();
    }

    function drawDimensionalCitadelTower(
      context: CanvasRenderingContext2D,
      time: number,
      isOverdrive: boolean,
      towerAttackCount: number,
      shieldActive: boolean,
      shieldPct: number,
      coreHpPct: number
    ) {
      context.save();
      const pulse = Math.sin(time * 0.003) * 2;

      // Shield Aura
      if (shieldActive && shieldPct > 0) {
        const shieldGrad = context.createRadialGradient(0, 0, 15, 0, 0, 36 + pulse);
        shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        shieldGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.15)');
        shieldGrad.addColorStop(1, 'rgba(56, 189, 248, 0.45)');
        context.fillStyle = shieldGrad;
        context.beginPath();
        context.arc(0, 0, 36 + pulse, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        context.lineWidth = 1.4;
        context.stroke();
      }

      // Outer Citadel Armor Base
      context.fillStyle = '#0f172a';
      drawHexPath(context, 0, 0, 24);
      context.fill();
      context.strokeStyle = isOverdrive ? '#f59e0b' : '#0284c7';
      context.lineWidth = 1.8;
      context.stroke();

      // Rotating Containment Rings
      const ringAngle1 = time * 0.002;
      const ringAngle2 = -time * 0.003;

      context.strokeStyle = isOverdrive ? 'rgba(251, 191, 36, 0.7)' : 'rgba(56, 189, 248, 0.65)';
      context.lineWidth = 1.6;
      context.beginPath();
      context.ellipse(0, 0, 19, 9, ringAngle1, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = 'rgba(192, 132, 252, 0.65)';
      context.lineWidth = 1.4;
      context.beginPath();
      context.ellipse(0, 0, 19, 9, ringAngle2, 0, Math.PI * 2);
      context.stroke();

      // Core
      const corePulse = Math.sin(time * 0.006) * 3;
      const coreGrad = context.createRadialGradient(0, 0, 2, 0, 0, 14 + corePulse);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, isOverdrive ? '#fbbf24' : '#38bdf8');
      coreGrad.addColorStop(0.7, isOverdrive ? '#ea580c' : '#7c3aed');
      coreGrad.addColorStop(1, 'transparent');

      context.fillStyle = coreGrad;
      context.beginPath();
      context.arc(0, 0, 14 + corePulse, 0, Math.PI * 2);
      context.fill();

      // Turret Barrels
      const turrets = Math.max(1, towerAttackCount || 1);
      for (let t = 0; t < turrets; t++) {
        const tang = (t * (Math.PI * 2)) / turrets + Math.sin(time * 0.002) * 0.15;
        const tx = Math.cos(tang) * 22;
        const ty = Math.sin(tang) * 22;

        context.save();
        context.translate(tx, ty);
        context.rotate(tang);
        context.fillStyle = '#475569';
        context.fillRect(0, -2, 12, 4);
        context.fillStyle = isOverdrive ? '#fbbf24' : '#38bdf8';
        context.fillRect(10, -1.5, 3, 3);
        context.restore();
      }

      context.restore();
    }

    // MAIN RENDER LOOP
    let animId: number;
    let lastTime = performance.now();
    let lastComputedRadialPos: { x: number; y: number } | null = null;

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);

      const effectiveSpeed = stateRef.current.timeSpeed || 1;
      const rawDt = Math.min((time - lastTime) / 1000, 0.1);
      const dt = rawDt * effectiveSpeed;
      lastTime = time;

      const wave = stateRef.current.currentWave;
      const towerState = stateRef.current.tower;
      const placed = stateRef.current.placedModules;
      const selected = stateRef.current.selectedHex;
      const activeEffects = stateRef.current.activeSkillEffects;
      const rogues = stateRef.current.activeRoguelikeUpgrades || [];
      const isOverdrive = (activeEffects?.overdrive || 0) > Date.now();
      const isEmpActive = (activeEffects?.emp_blast || 0) > Date.now();

      // Camera smooth pan & zoom
      camX += (targetCamX - camX) * Math.min(1, 6 * dt);
      camY += (targetCamY - camY) * Math.min(1, 6 * dt);
      camZoom += (targetCamZoom - camZoom) * Math.min(1, 6 * dt);

      // Track screen position of selected hex for Expansive FAB
      if (selected) {
        const hp = hexToPixelWorld(selected.q, selected.r);
        const sx = width / 2 + (hp.x - camX) * camZoom;
        const sy = height / 2 + (hp.y - camY) * camZoom;
        if (
          !lastComputedRadialPos ||
          Math.abs(lastComputedRadialPos.x - sx) > 0.2 ||
          Math.abs(lastComputedRadialPos.y - sy) > 0.2
        ) {
          lastComputedRadialPos = { x: sx, y: sy };
          setRadialPos({ x: sx, y: sy });
        }
      } else {
        if (lastComputedRadialPos) {
          lastComputedRadialPos = null;
          setRadialPos(null);
        }
      }

      // Screen shake decay
      if (screenShake > 0) {
        screenShake = Math.max(0, screenShake - 30 * dt);
      }
      const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
      const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;

      // CLEAR SCREEN
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // SAVE SCREEN MATRIX & APPLY CAMERA TRANSFORM
      ctx.save();
      ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-camX, -camY);

      // 1. NEBULA & STARS
      nebulaClouds.forEach((neb) => {
        const radGrad = ctx.createRadialGradient(neb.x, neb.y, 10, neb.x, neb.y, neb.r);
        radGrad.addColorStop(0, neb.color);
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(neb.x, neb.y, neb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Asteroids
      backgroundAsteroids.forEach((ast) => {
        ast.x += ast.vx * dt;
        ast.y += ast.vy * dt;
        ast.rot += ast.vrot * dt;

        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rot);
        ctx.fillStyle = ast.color;
        ctx.fillRect(-ast.size / 2, -ast.size / 2, ast.size, ast.size);
        ctx.restore();
      });

      // Stars
      stars.forEach((s, idx) => {
        const tw = Math.sin(time * 0.002 * s.twinkleSpeed + idx) * 0.35 + 0.65;
        ctx.globalAlpha = s.alpha * tw;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });
      ctx.globalAlpha = 1.0;

      // 2. PLAYABLE HEXAGONAL GRID
      playableHexes.forEach((hex) => {
        const key = `${hex.q},${hex.r}`;
        const pos = hexToPixelWorld(hex.q, hex.r);
        const isHovered = hoveredHex && hoveredHex.q === hex.q && hoveredHex.r === hex.r;
        const isSelected = selected && selected.q === hex.q && selected.r === hex.r;
        const isOccupied = !!placed[key];

        if (isSelected) {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2.6;
        } else if (isHovered) {
          ctx.fillStyle = isOccupied ? 'rgba(56, 189, 248, 0.22)' : 'rgba(16, 185, 129, 0.25)';
          ctx.strokeStyle = isOccupied ? '#38bdf8' : '#10b981';
          ctx.lineWidth = 1.8;
        } else if (isOccupied) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 1.2;
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
          ctx.lineWidth = 0.8;
        }

        drawHexPath(ctx, pos.x, pos.y, PIXEL_HEX_RADIUS);
        ctx.fill();
        ctx.stroke();

        // Selected Hex Pulsing Radar Brackets
        if (isSelected) {
          const radarOsc = Math.sin(time * 0.006) * 3;
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
          ctx.lineWidth = 1.5;
          drawHexPath(ctx, pos.x, pos.y, PIXEL_HEX_RADIUS + 4 + radarOsc);
          ctx.stroke();
        }
      });

      // AoE visualization for selected module
      if (selected) {
        const key = `${selected.q},${selected.r}`;
        const modAtHex = placed[key];
        if (modAtHex && modAtHex.aoeHexRadius) {
          const aoeHexes = getHexesInAoE({ q: modAtHex.q, r: modAtHex.r }, modAtHex.aoeHexRadius);
          aoeHexes.forEach((ah) => {
            if (ah.q !== modAtHex.q || ah.r !== modAtHex.r) {
              const p = hexToPixelWorld(ah.q, ah.r);
              drawHexPath(ctx, p.x, p.y, PIXEL_HEX_RADIUS - 1);
              ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
              ctx.fill();
              ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          });
        }
      }

      // 3. STATIONARY MEGA ORBITAL RING
      const megaRingRadius = 152;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, megaRingRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, megaRingRadius - 3, 0, Math.PI * 2);
      ctx.stroke();

      // 4. CENTRAL CITADEL TOWER
      const shields = towerState.sectors.shields;
      const shieldPct = Math.round((shields.hp / shields.maxHp) * 100);
      const coreHpPct = Math.round((towerState.coreHp / towerState.maxCoreHp) * 100);

      drawDimensionalCitadelTower(
        ctx,
        time,
        isOverdrive,
        1 + Math.min(3, Math.floor(Object.keys(placed).length / 2)),
        shields.status === 'operational',
        shieldPct,
        coreHpPct
      );

      // EMP Blast High-Voltage Shockwave Field & Radial Arcs
      if (isEmpActive) {
        ctx.save();
        // Expanding electrical wave rings
        for (let ringIdx = 0; ringIdx < 3; ringIdx++) {
          const wavePhase = (time * 0.45 + ringIdx * 200) % 750;
          const alpha = Math.max(0, 1 - wavePhase / 750);
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
          ctx.lineWidth = Math.max(1, 3.5 - (wavePhase / 750) * 2.5);
          ctx.beginPath();
          ctx.arc(0, 0, wavePhase, 0, Math.PI * 2);
          ctx.stroke();

          // Dotted perimeter electrical ring
          ctx.strokeStyle = `rgba(165, 243, 252, ${alpha * 0.6})`;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(0, wavePhase - 8), 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 8 Jagged electrical arcs branching outwards from citadel
        for (let arc = 0; arc < 8; arc++) {
          const baseAng = arc * (Math.PI / 4) + Math.sin(time * 0.006 + arc) * 0.25;
          ctx.strokeStyle = Math.random() < 0.5 ? '#38bdf8' : '#a5f3fc';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const segments = 5;
          const segLen = 45 + (arc % 3) * 20;
          for (let s = 1; s <= segments; s++) {
            const segDist = s * segLen;
            const jitter = (Math.random() - 0.5) * 20;
            const curX = Math.cos(baseAng) * segDist + Math.sin(baseAng) * jitter;
            const curY = Math.sin(baseAng) * segDist - Math.cos(baseAng) * jitter;
            ctx.lineTo(curX, curY);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. DRAW PLACED FLEET MODULES & FIRING ACTION
      const nowSec = time / 1000;
      const waveElapsed = waveStartTime > 0 ? (time - waveStartTime) / 1000 : 0;

      // Periodic Resonance Pulse Roguelike Upgrade (every 10s)
      const hasPeriodicUpgrade = rogues.some((r) => r.id === 'rogue_time_periodic');
      if (hasPeriodicUpgrade && waveElapsed > 0) {
        const currentPulseIndex = Math.floor(waveElapsed / 10);
        if (currentPulseIndex > lastPeriodicPulseIndex) {
          lastPeriodicPulseIndex = currentPulseIndex;
          sound.playLaser(600, 0.15);
          screenShake = Math.min(16, screenShake + 4);

          Object.values(placed).forEach((m) => {
            const mPos = hexToPixelWorld(m.q, m.r);
            activeEnemies.forEach((e) => {
              const d = Math.hypot(e.x - mPos.x, e.y - mPos.y);
              if (d <= 90) {
                e.hp -= 80;
                e.hitFlash = 4;
                e.slowDuration = 2.0;
              }
            });

            for (let k = 0; k < 6; k++) {
              debrisList.push({
                x: mPos.x,
                y: mPos.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                size: 2,
                color: '#38bdf8',
                life: 0,
                maxLife: 0.35,
              });
            }
          });
        }
      }

      Object.values(placed).forEach((mod) => {
        const pos = hexToPixelWorld(mod.q, mod.r);
        const stats = computeTacticalStats(mod, placed, rogues, waveElapsed, isOverdrive);

        let nearestEnemy: PixelEnemy | null = null;
        let nearestDist = Infinity;
        const rangeInPx = stats.range * 24;

        activeEnemies.forEach((e) => {
          const dist = Math.hypot(e.x - pos.x, e.y - pos.y);
          if (dist <= rangeInPx && dist < nearestDist) {
            nearestDist = dist;
            nearestEnemy = e;
          }
        });

        let aimAngle = 0;
        if (nearestEnemy) {
          const targetE: PixelEnemy = nearestEnemy;
          aimAngle = Math.atan2(targetE.y - pos.y, targetE.x - pos.x) - Math.PI / 2;

          const fireInterval = 1 / stats.fireRate;
          if (nowSec - (mod.lastShotTime || 0) >= fireInterval && stats.damage > 0) {
            mod.lastShotTime = nowSec;

            const isCrit = Math.random() < stats.critChance;
            const finalDamage = isCrit ? Math.round(stats.damage * 2.5) : stats.damage;

            if (mod.type === 'beam_cruiser') {
              sound.playBeamHum();
              targetE.hp -= finalDamage * 0.8;
              targetE.hitFlash = 3;
              mod.damageDealt += finalDamage;

              ctx.strokeStyle = isCrit ? '#fbbf24' : '#f59e0b';
              ctx.lineWidth = isCrit ? 5 : 3.5;
              ctx.beginPath();
              ctx.moveTo(pos.x, pos.y);
              ctx.lineTo(targetE.x, targetE.y);
              ctx.stroke();

              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(pos.x, pos.y);
              ctx.lineTo(targetE.x, targetE.y);
              ctx.stroke();
            } else if (mod.type === 'tesla_coil') {
              sound.playHit();
              targetE.hp -= finalDamage;
              targetE.hitFlash = 4;
              targetE.slowDuration = 2.5;
              mod.damageDealt += finalDamage;

              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(pos.x, pos.y);
              const midX = (pos.x + targetE.x) / 2 + (Math.random() - 0.5) * 24;
              const midY = (pos.y + targetE.y) / 2 + (Math.random() - 0.5) * 24;
              ctx.lineTo(midX, midY);
              ctx.lineTo(targetE.x, targetE.y);
              ctx.stroke();

              let chainCount = 0;
              activeEnemies.forEach((other) => {
                if (other.id !== targetE.id && chainCount < 2) {
                  const dOther = Math.hypot(other.x - targetE.x, other.y - targetE.y);
                  if (dOther < 100) {
                    other.hp -= finalDamage * 0.6;
                    other.hitFlash = 3;
                    other.slowDuration = 1.8;
                    chainCount++;
                  }
                }
              });
            } else if (mod.type === 'railgun_bastion') {
              sound.playPlasma();
              screenShake = Math.min(18, screenShake + 4);
              mod.damageDealt += finalDamage;

              const rayAngle = Math.atan2(targetE.y - pos.y, targetE.x - pos.x);
              const maxRayDist = rangeInPx * 1.3;
              const endX = pos.x + Math.cos(rayAngle) * maxRayDist;
              const endY = pos.y + Math.sin(rayAngle) * maxRayDist;

              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 5;
              ctx.beginPath();
              ctx.moveTo(pos.x, pos.y);
              ctx.lineTo(endX, endY);
              ctx.stroke();

              activeEnemies.forEach((e) => {
                const toEx = e.x - pos.x;
                const toEy = e.y - pos.y;
                const projLen = toEx * Math.cos(rayAngle) + toEy * Math.sin(rayAngle);
                if (projLen > 0 && projLen <= maxRayDist) {
                  const perpDist = Math.abs(-toEx * Math.sin(rayAngle) + toEy * Math.cos(rayAngle));
                  if (perpDist < 20) {
                    e.hp -= finalDamage;
                    e.hitFlash = 4;
                  }
                }
              });
            } else if (mod.type === 'nanobot_drone') {
              sound.playCheckpoint();
              const aoeHex = mod.aoeHexRadius || 2;
              const healVal = 25;

              Object.entries(placed).forEach(([otherKey, otherMod]) => {
                if (otherKey !== mod.hexKey) {
                  const distHex = hexDistance({ q: mod.q, r: mod.r }, { q: otherMod.q, r: otherMod.r });
                  if (distHex <= aoeHex) {
                    const oMaxHp = otherMod.maxHp || 150;
                    const oCurHp = otherMod.currentHp ?? oMaxHp;
                    if (oCurHp < oMaxHp) {
                      otherMod.currentHp = Math.min(oMaxHp, oCurHp + healVal);
                      const otherPos = hexToPixelWorld(otherMod.q, otherMod.r);

                      floatingTexts.push({
                        text: `+${healVal} HP`,
                        x: otherPos.x,
                        y: otherPos.y - 12,
                        color: '#4ade80',
                        life: 0,
                        maxLife: 1.0,
                      });
                    }
                  }
                }
              });

              callbacksRef.current.setTower((prev) => {
                const newHp = Math.min(prev.maxCoreHp, prev.coreHp + 15);
                const sh = prev.sectors.shields;
                const newShieldHp = Math.min(sh.maxHp, sh.hp + 10);
                return {
                  ...prev,
                  coreHp: newHp,
                  sectors: {
                    ...prev.sectors,
                    shields: { ...sh, hp: newShieldHp, status: 'operational' },
                  },
                };
              });
            } else {
              const pType =
                mod.type === 'missile_launcher'
                  ? 'missile'
                  : mod.type === 'plasma_battery'
                  ? 'plasma'
                  : 'pulse';

              const fireAngle = Math.atan2(targetE.y - pos.y, targetE.x - pos.x);
              const pSpeed = pType === 'missile' ? 260 : pType === 'plasma' ? 220 : 380;
              const vx = Math.cos(fireAngle) * pSpeed;
              const vy = Math.sin(fireAngle) * pSpeed;
              const maxDist = rangeInPx * 1.35;
              const maxLife = maxDist / pSpeed + 0.2;

              activeProjectiles.push({
                id: `proj_${Date.now()}_${Math.random()}`,
                type: pType,
                x: pos.x,
                y: pos.y,
                vx,
                vy,
                angle: fireAngle,
                life: 0,
                maxLife,
                radius: pType === 'plasma' ? 6 : pType === 'missile' ? 4 : 3,
                targetEnemyId: targetE.id,
                targetX: targetE.x,
                targetY: targetE.y,
                damage: finalDamage,
                progress: 0,
                speed: pSpeed,
                splashRadius: pType === 'plasma' ? 48 : pType === 'missile' ? 32 : 0,
                color: pType === 'plasma' ? '#a855f7' : pType === 'missile' ? '#f97316' : '#38bdf8',
                isHoming: pType === 'missile',
              });

              if (pType === 'pulse') sound.playLaser(440, 0.08);
              else if (pType === 'plasma') sound.playPlasma();
              else sound.playPlasma();
            }

            if (isCrit) {
              floatingTexts.push({
                text: `CRÍTICO! ${finalDamage}`,
                x: targetE.x,
                y: targetE.y - 20,
                color: '#fbbf24',
                life: 0,
                maxLife: 1.0,
                scale: 1.3,
              });
            }
          }
        }

        // Draw Ship Sprite & Dynamic Life Pulse
        ctx.save();
        ctx.translate(pos.x, pos.y);

        // Subtle idle floating bobbing motion so ships feel alive
        const hoverBob = Math.sin(time * 0.003 + (mod.q * 3 + mod.r)) * 1.2;
        ctx.translate(0, hoverBob);

        // Idle energy status aura / reactor pulse ring
        const idlePulse = Math.sin(time * 0.006 + (mod.q * 2 + mod.r)) * 1.5;
        ctx.strokeStyle =
          mod.type === 'pulse_cannon'
            ? 'rgba(56, 189, 248, 0.4)'
            : mod.type === 'beam_cruiser'
            ? 'rgba(245, 158, 11, 0.4)'
            : mod.type === 'plasma_battery'
            ? 'rgba(168, 85, 247, 0.4)'
            : mod.type === 'flux_harvester'
            ? 'rgba(16, 185, 129, 0.45)'
            : mod.type === 'nanobot_drone'
            ? 'rgba(74, 222, 128, 0.45)'
            : 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 13 + idlePulse, 0, Math.PI * 2);
        ctx.stroke();

        // Scale down module so it never overlaps adjacent hexes (circumradius = 14)
        ctx.scale(0.50, 0.50);
        drawDetailedFleetSprite(ctx, mod.type, mod.level, aimAngle, time);

        // Ship Health Bar (scaled neatly right above the ship)
        const maxHp = stats.maxHp;
        const curHp = stats.effectiveCurHp;
        if (curHp < maxHp) {
          const hpRatio = Math.max(0, curHp / maxHp);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-14, -26, 28, 4);
          ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
          ctx.fillRect(-14, -26, 28 * hpRatio, 4);
        }

        ctx.restore();
      });

      // 6. ENEMY SPAWNING & ESCALATION OVER TIME
      const phase = stateRef.current.expeditionPhase;
      const isCombatPhase = phase === 'COMBAT' || phase === 'SPAWNING' || !phase;

      if (isCombatPhase && (lastWaveId !== wave || (waveRoster.length === 0 && activeEnemies.length === 0 && !waveStarted))) {
        waveRoster = buildWave(wave);
        lastSpawnTime = 0;
        waveStarted = true;
        hasSpawnedAny = false;
        lastWaveId = wave;
        waveStartTime = performance.now();
        lastPeriodicPulseIndex = 0;
      }

      // Spawns paced in squads every 1.5 to 2.2s so wave lasts 45-70 seconds
      if (isCombatPhase && waveRoster.length > 0) {
        const spawnInterval = (1.5 + Math.random() * 0.4) / effectiveSpeed;
        if (!hasSpawnedAny || nowSec - lastSpawnTime >= spawnInterval) {
          lastSpawnTime = nowSec;
          hasSpawnedAny = true;

          const spawnCount = Math.min(2, waveRoster.length);
          for (let s = 0; s < spawnCount; s++) {
            if (waveRoster.length === 0) break;
            const enemyType = waveRoster.shift()!;
            const spawnAngle = Math.random() * Math.PI * 2;
            
            // Dynamic off-screen spawn distance beyond viewport so enemies cruise in smoothly
            const halfW = (width / 2) / Math.max(0.65, camZoom);
            const halfH = (height / 2) / Math.max(0.65, camZoom);
            const spawnDist = Math.max(920, Math.hypot(halfW, halfH) + 240);

            let hp = 75 + wave * 28;
            let speed = 52 + wave * 4;
            let dmg = 12 + wave * 3;
            let pattern: 'arc' | 'spiral' | 'zigzag' | 'erratic' | 'siege_stance' = 'zigzag';

            if (enemyType === 'parasite') {
              hp = 55 + wave * 22;
              speed = 76 + wave * 4;
              dmg = 14;
              pattern = 'erratic';
            } else if (enemyType === 'saboteur') {
              hp = 100 + wave * 34;
              speed = 54 + wave * 3;
              dmg = 26;
              pattern = 'spiral';
            } else if (enemyType === 'siege') {
              hp = 260 + wave * 65;
              speed = 32 + wave * 2;
              dmg = 48;
              pattern = 'siege_stance';
            } else if (enemyType === 'colossus') {
              hp = 1100 + wave * 260;
              speed = 24 + wave * 1.5;
              dmg = 95;
              pattern = 'arc';
            } else if (enemyType === 'invader') {
              hp = 65 + wave * 20;
              speed = 84 + wave * 4;
              dmg = 16;
              pattern = 'zigzag';
            } else if (enemyType === 'hunter') {
              hp = 85 + wave * 26;
              speed = 64 + wave * 3.5;
              dmg = 20;
              pattern = 'arc';
            }

            activeEnemies.push({
              id: `enemy_${Date.now()}_${Math.random()}_${s}`,
              type: enemyType,
              x: Math.cos(spawnAngle) * spawnDist,
              y: Math.sin(spawnAngle) * spawnDist,
              angle: spawnAngle,
              hp,
              maxHp: hp,
              speed,
              damage: dmg,
              pattern,
              spawnAngle,
              spawnRadius: spawnDist,
              currentRadius: spawnDist,
              phaseOffset: Math.random() * Math.PI * 2,
              rewardMatter: enemyType === 'colossus' ? 24 : enemyType === 'siege' ? 10 : enemyType === 'saboteur' ? 4 : 2,
              rewardTech: enemyType === 'colossus' ? 6 : enemyType === 'siege' ? 2 : enemyType === 'saboteur' ? 1 : Math.random() < 0.25 ? 1 : 0,
              rewardData: enemyType === 'colossus' ? 3 : enemyType === 'siege' ? 1 : enemyType === 'saboteur' && Math.random() < 0.3 ? 1 : 0,
              rewardDim: enemyType === 'colossus' ? 1 : 0,
              hitFlash: 0,
              lastShotTime: 0,
              siegeChargeTimer: 0,
            });
          }
        }
      }

      // Update enemies
      for (let e = activeEnemies.length - 1; e >= 0; e--) {
        const enemy = activeEnemies[e];
        if (enemy.hitFlash > 0) enemy.hitFlash--;

        if (enemy.burnDuration && enemy.burnDuration > 0) {
          enemy.burnDuration -= dt;
          enemy.hp -= (enemy.maxHp * 0.08 + 8) * dt;
        }

        let speedFactor = 1.0;
        if (isEmpActive) speedFactor = 0;
        else if (enemy.slowDuration && enemy.slowDuration > 0) {
          enemy.slowDuration -= dt;
          speedFactor = 0.5;
        }

        // Siege Ship Tactical Stance: halts at long artillery range (~270px) and charges beam
        if (enemy.type === 'siege' && enemy.currentRadius <= 270) {
          enemy.currentRadius = 270;
          enemy.siegeChargeTimer = (enemy.siegeChargeTimer || 0) + dt;

          if (enemy.siegeChargeTimer >= 3.8 && !isEmpActive) {
            enemy.siegeChargeTimer = 0;
            let targetModKey: string | null = null;
            let targetModDist = Infinity;
            Object.keys(placed).forEach((k) => {
              const m = placed[k];
              const mp = hexToPixelWorld(m.q, m.r);
              const d = Math.hypot(mp.x - enemy.x, mp.y - enemy.y);
              if (d < targetModDist) {
                targetModDist = d;
                targetModKey = k;
              }
            });

            if (targetModKey) {
              const tMod = placed[targetModKey];
              const tPos = hexToPixelWorld(tMod.q, tMod.r);
              sound.playPlasma();
              screenShake = Math.min(14, screenShake + 3);

              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(enemy.x, enemy.y);
              ctx.lineTo(tPos.x, tPos.y);
              ctx.stroke();

              tMod.currentHp = Math.max(0, (tMod.currentHp ?? tMod.maxHp) - enemy.damage);
              tMod.hitFlash = 3;

              floatingTexts.push({
                text: `-${enemy.damage} HP CERCO!`,
                x: tPos.x,
                y: tPos.y - 14,
                color: '#ef4444',
                life: 0,
                maxLife: 1.0,
              });
            }
          }
        } else {
          // Distinct radial movement per enemy type
          if (enemy.type === 'saboteur') {
            const stutter = Math.sin(time * 0.008 + enemy.phaseOffset) > 0.3 ? 1.4 : 0.6;
            enemy.currentRadius -= enemy.speed * stutter * speedFactor * dt;
          } else if (enemy.type === 'hunter') {
            enemy.currentRadius -= enemy.speed * 0.85 * speedFactor * dt;
          } else {
            enemy.currentRadius -= enemy.speed * speedFactor * dt;
          }
        }

        // Distinct angular trajectory per enemy type
        let angle = enemy.spawnAngle;
        const spawnR = enemy.spawnRadius || 920;
        const progress = Math.max(0, 1 - enemy.currentRadius / spawnR);

        if (enemy.type === 'invader') {
          // Rapid zig-zag dash bursts
          angle += Math.sin(enemy.currentRadius * 0.05 + enemy.phaseOffset) * 0.35;
        } else if (enemy.type === 'hunter') {
          // Wide flanking arc encircling before closing
          const flankDir = enemy.phaseOffset > Math.PI ? 1 : -1;
          angle += flankDir * 0.55 * Math.sin(progress * Math.PI);
        } else if (enemy.type === 'saboteur') {
          // Phase-distortion inward spiral
          const spiralDir = enemy.phaseOffset > Math.PI ? 1 : -1;
          angle += (spawnR - enemy.currentRadius) * 0.006 * spiralDir;
        } else if (enemy.type === 'parasite') {
          // Chaotic bio swarm undulation
          angle += Math.sin(time * 0.004 + enemy.phaseOffset) * 0.4 + Math.cos(enemy.currentRadius * 0.035) * 0.22;
        } else if (enemy.type === 'siege') {
          // Heavy siege stance sway
          angle += Math.sin(time * 0.001 + enemy.phaseOffset) * 0.08;
        } else {
          // Colossus: steady cosmic trajectory
          angle += Math.sin(enemy.currentRadius * 0.012) * 0.12;
        }

        enemy.x = Math.cos(angle) * enemy.currentRadius;
        enemy.y = Math.sin(angle) * enemy.currentRadius;
        enemy.angle = Math.atan2(0 - enemy.y, 0 - enemy.x) - Math.PI / 2;

        // Distinct enemy shooting mechanics (attacks start when entering tactical combat range)
        if (enemy.currentRadius <= 560 && !isEmpActive) {
          let shotInterval = 3.0;
          let pType: EnemyProjectile['type'] = 'plasma_red';
          let pColor = '#ef4444';
          let pGlow = 'rgba(239, 68, 68, 0.5)';
          let pSpeed = 230;
          let pRadius = 3;
          let pDmg = Math.max(4, Math.round(enemy.damage * 0.55));

          if (enemy.type === 'invader') {
            shotInterval = 2.6;
            pType = 'plasma_red';
            pColor = '#ef4444';
            pGlow = 'rgba(239, 68, 68, 0.55)';
            pSpeed = 250;
            pRadius = 2.8;
            pDmg = Math.max(5, Math.round(enemy.damage * 0.5));
          } else if (enemy.type === 'hunter') {
            shotInterval = 3.0;
            pType = 'needle_green';
            pColor = '#10b981';
            pGlow = 'rgba(16, 185, 129, 0.6)';
            pSpeed = 270;
            pRadius = 2.5;
            pDmg = Math.max(6, Math.round(enemy.damage * 0.65));
          } else if (enemy.type === 'saboteur') {
            shotInterval = 3.4;
            pType = 'void_purple';
            pColor = '#a855f7';
            pGlow = 'rgba(168, 85, 247, 0.65)';
            pSpeed = 190;
            pRadius = 4.2;
            pDmg = Math.max(8, Math.round(enemy.damage * 0.8));
          } else if (enemy.type === 'parasite') {
            shotInterval = 2.1;
            pType = 'acid_yellow';
            pColor = '#eab308';
            pGlow = 'rgba(234, 179, 8, 0.6)';
            pSpeed = 205;
            pRadius = 3.2;
            pDmg = Math.max(4, Math.round(enemy.damage * 0.45));
          } else if (enemy.type === 'siege') {
            shotInterval = 3.6;
            pType = 'beam_crimson';
            pColor = '#dc2626';
            pGlow = 'rgba(220, 38, 38, 0.7)';
            pSpeed = 170;
            pRadius = 5.2;
            pDmg = Math.max(12, Math.round(enemy.damage * 1.0));
          } else if (enemy.type === 'colossus') {
            shotInterval = 2.6;
            pType = 'cosmic_blue';
            pColor = '#38bdf8';
            pGlow = 'rgba(56, 189, 248, 0.75)';
            pSpeed = 180;
            pRadius = 5.8;
            pDmg = Math.max(15, Math.round(enemy.damage * 1.2));
          }

          if (nowSec - (enemy.lastShotTime || 0) >= shotInterval) {
            enemy.lastShotTime = nowSec;

            // Target nearest placed player ship or citadel core (0, 0)
            let tX = 0;
            let tY = 0;
            let tKey: string | null = null;
            let bestDist = 340;

            Object.keys(placed).forEach((k) => {
              const m = placed[k];
              const mp = hexToPixelWorld(m.q, m.r);
              const d = Math.hypot(mp.x - enemy.x, mp.y - enemy.y);
              if (d < bestDist) {
                bestDist = d;
                tX = mp.x;
                tY = mp.y;
                tKey = k;
              }
            });

            const aimAng = Math.atan2(tY - enemy.y, tX - enemy.x);
            activeEnemyProjectiles.push({
              id: `eproj_${Date.now()}_${Math.random()}`,
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(aimAng) * pSpeed,
              vy: Math.sin(aimAng) * pSpeed,
              damage: pDmg,
              color: pColor,
              glowColor: pGlow,
              type: pType,
              radius: pRadius,
              life: 0,
              maxLife: 4.5,
              targetModuleKey: tKey,
            });
          }
        }

        // Collision with placed modules
        let hitModuleKey: string | null = null;
        const pKeys = Object.keys(placed);
        for (let pk = 0; pk < pKeys.length; pk++) {
          const mk = pKeys[pk];
          const m = placed[mk];
          if (!m) continue;
          const mPos = hexToPixelWorld(m.q, m.r);
          const dToMod = Math.hypot(enemy.x - mPos.x, enemy.y - mPos.y);
          if (dToMod <= 16) {
            hitModuleKey = mk;
            break;
          }
        }

        if (hitModuleKey) {
          const hitMod = placed[hitModuleKey];
          sound.playShieldHit();
          screenShake = Math.min(15, screenShake + 4);

          const dmgDealt = enemy.damage;
          hitMod.currentHp = Math.max(0, (hitMod.currentHp ?? hitMod.maxHp) - dmgDealt);
          hitMod.hitFlash = 3;

          floatingTexts.push({
            text: `-${dmgDealt} HP`,
            x: enemy.x,
            y: enemy.y - 12,
            color: '#f43f5e',
            life: 0,
            maxLife: 0.8,
          });

          // Destruction
          if (hitMod.currentHp <= 0) {
            sound.playExplosion(0.25);
            screenShake = Math.min(22, screenShake + 8);

            floatingTexts.push({
              text: 'MÓDULO DESTRUÍDO!',
              x: enemy.x,
              y: enemy.y - 24,
              color: '#ef4444',
              life: 0,
              maxLife: 1.5,
              scale: 1.25,
            });

            if (hitMod.type === 'plasma_battery') {
              const overloadDmg = 300;
              activeEnemies.forEach((oe) => {
                const distOe = Math.hypot(oe.x - enemy.x, oe.y - enemy.y);
                if (distOe <= 75) {
                  oe.hp -= overloadDmg;
                  oe.hitFlash = 4;
                }
              });

              floatingTexts.push({
                text: `SOBRECARGA: ${overloadDmg} DMG!`,
                x: enemy.x,
                y: enemy.y - 40,
                color: '#c084fc',
                life: 0,
                maxLife: 1.8,
                scale: 1.4,
              });
            }

            callbacksRef.current.setPlacedModules((prev) => {
              const next = { ...prev };
              delete next[hitModuleKey!];
              return next;
            });
          }

          enemy.hp -= 40;
          enemy.hitFlash = 3;
        }

        // Citadel Core Collision
        if (enemy.currentRadius <= 30) {
          sound.playAlert();
          screenShake = Math.min(22, screenShake + 8);

          callbacksRef.current.setTower((prev) => {
            const sh = prev.sectors.shields;
            let nextCore = prev.coreHp;
            let nextSectors = { ...prev.sectors };

            if (sh.status === 'operational' && sh.hp > 0) {
              const newShieldHp = Math.max(0, sh.hp - enemy.damage * 1.5);
              nextSectors.shields = {
                ...sh,
                hp: newShieldHp,
                status: newShieldHp === 0 ? 'disabled' : 'operational',
              };
            } else {
              nextCore = Math.max(0, prev.coreHp - enemy.damage);
            }

            if (nextCore <= 0) {
              setTimeout(() => callbacksRef.current.handleDefeat(), 50);
            }

            return { ...prev, coreHp: nextCore, sectors: nextSectors };
          });

          activeEnemies.splice(e, 1);
          continue;
        }

        // Draw Enemy
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        if (enemy.type === 'saboteur') {
          ctx.globalAlpha = 0.4 + 0.5 * Math.sin(time * 0.015);
        }

        if (enemy.hitFlash > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-10, -10, 20, 20);
        } else {
          drawDetailedEnemySprite(ctx, enemy.type, enemy.hitFlash > 0, time);
        }

        if (enemy.hp < enemy.maxHp) {
          const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-12, -18, 24, 3);
          ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
          ctx.fillRect(-12, -18, 24 * hpRatio, 3);
        }

        // Visual EMP paralysis effects over frozen enemy
        if (isEmpActive) {
          ctx.strokeStyle = Math.random() < 0.5 ? '#38bdf8' : '#e0f2fe';
          ctx.lineWidth = 1.6;
          const arcR = 14 + Math.sin(time * 0.02 + e) * 3;
          ctx.beginPath();
          ctx.arc(0, 0, arcR, (time * 0.01 + e) % (Math.PI * 2), ((time * 0.01 + e) % (Math.PI * 2)) + Math.PI * 1.2);
          ctx.stroke();

          for (let sp = 0; sp < 2; sp++) {
            const spAng = Math.random() * Math.PI * 2;
            const spDist = 10 + Math.random() * 8;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.cos(spAng) * spDist - 1, Math.sin(spAng) * spDist - 1, 2, 2);
          }

          ctx.save();
          ctx.rotate(-enemy.angle);
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'center';
          ctx.fillText('PARALISADO', 0, -22);
          ctx.restore();
        }

        ctx.restore();
      }

      // 7. PROJECTILES
      for (let p = activeProjectiles.length - 1; p >= 0; p--) {
        const proj = activeProjectiles[p];

        // Guided homing ONLY for missile_launcher with realistic turning limit
        if (proj.isHoming && proj.targetEnemyId) {
          const target = activeEnemies.find((e) => e.id === proj.targetEnemyId);
          if (target) {
            const desiredAngle = Math.atan2(target.y - proj.y, target.x - proj.x);
            let diff = desiredAngle - proj.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            const turnRate = 3.6; // rad/s
            proj.angle += Math.sign(diff) * Math.min(Math.abs(diff), turnRate * dt);
            proj.vx = Math.cos(proj.angle) * proj.speed;
            proj.vy = Math.sin(proj.angle) * proj.speed;

            // Smoke trail particle
            if (Math.random() < 0.45) {
              debrisList.push({
                x: proj.x - Math.cos(proj.angle) * 6,
                y: proj.y - Math.sin(proj.angle) * 6,
                vx: -proj.vx * 0.12 + (Math.random() - 0.5) * 16,
                vy: -proj.vy * 0.12 + (Math.random() - 0.5) * 16,
                size: 1.5,
                color: 'rgba(203, 213, 225, 0.65)',
                life: 0,
                maxLife: 0.25,
              });
            }
          }
        }

        // Advance projectile along its ballistic velocity vector
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.life += dt;

        // Collision check against active enemies along trajectory
        let hitEnemy: PixelEnemy | null = null;
        for (let eIdx = 0; eIdx < activeEnemies.length; eIdx++) {
          const e = activeEnemies[eIdx];
          const dist = Math.hypot(e.x - proj.x, e.y - proj.y);
          const enemyRadius = e.type === 'colossus' ? 24 : e.type === 'siege' ? 18 : 12;
          if (dist <= enemyRadius + proj.radius) {
            hitEnemy = e;
            break;
          }
        }

        if (hitEnemy) {
          hitEnemy.hp -= proj.damage;
          hitEnemy.hitFlash = 3;
          sound.playHit();

          if (proj.splashRadius > 0) {
            screenShake = Math.min(15, screenShake + 3);
            activeEnemies.forEach((other) => {
              if (other.id !== hitEnemy!.id) {
                const sDist = Math.hypot(other.x - proj.x, other.y - proj.y);
                if (sDist <= proj.splashRadius) {
                  other.hp -= proj.damage * 0.55;
                  other.hitFlash = 2;
                }
              }
            });
          }

          // Spawn impact debris
          for (let d = 0; d < 4; d++) {
            debrisList.push({
              x: proj.x,
              y: proj.y,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() - 0.5) * 60,
              size: 2,
              color: proj.color,
              life: 0,
              maxLife: 0.2,
            });
          }

          activeProjectiles.splice(p, 1);
          continue;
        }

        // Despawn if max life reached or out of bounds
        if (proj.life >= proj.maxLife || Math.hypot(proj.x, proj.y) > 850) {
          activeProjectiles.splice(p, 1);
          continue;
        }

        // Render Projectile Sprite
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.angle);

        if (proj.type === 'missile') {
          // Micro-missile rocket body
          ctx.fillStyle = '#f97316';
          ctx.fillRect(-4, -1.5, 8, 3);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(-6, -1, 2, 2); // flame exhaust
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(3, -1, 2, 2); // nose cone
        } else if (proj.type === 'plasma') {
          // Glowing plasma orb
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // High-speed kinetic pulse bullet
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-3.5, -1.2, 7, 2.4);

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(1.5, -0.8, 2.5, 1.6);

          const pPulse = Math.sin(time * 0.02) * 1.5;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, 4.5 + pPulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 7.5. ENEMY PROJECTILES (Distinct types, colors, and behaviors)
      for (let ep = activeEnemyProjectiles.length - 1; ep >= 0; ep--) {
        const eproj = activeEnemyProjectiles[ep];
        eproj.x += eproj.vx * dt;
        eproj.y += eproj.vy * dt;
        eproj.life += dt;

        // Collision with placed player modules
        let hitPlayerModKey: string | null = null;
        const placedKeys = Object.keys(placed);
        for (let pk = 0; pk < placedKeys.length; pk++) {
          const mk = placedKeys[pk];
          const m = placed[mk];
          if (!m) continue;
          const mp = hexToPixelWorld(m.q, m.r);
          const dist = Math.hypot(eproj.x - mp.x, eproj.y - mp.y);
          if (dist <= 16 + eproj.radius) {
            hitPlayerModKey = mk;
            break;
          }
        }

        if (hitPlayerModKey) {
          const hitMod = placed[hitPlayerModKey];
          sound.playShieldHit();
          screenShake = Math.min(14, screenShake + 3);

          const dmg = eproj.damage;
          hitMod.currentHp = Math.max(0, (hitMod.currentHp ?? hitMod.maxHp) - dmg);
          hitMod.hitFlash = 3;

          floatingTexts.push({
            text: `-${dmg} HP`,
            x: eproj.x,
            y: eproj.y - 12,
            color: eproj.color,
            life: 0,
            maxLife: 0.8,
          });

          // Destruction check
          if (hitMod.currentHp <= 0) {
            sound.playExplosion(0.25);
            screenShake = Math.min(22, screenShake + 7);

            floatingTexts.push({
              text: 'MÓDULO DESTRUÍDO!',
              x: eproj.x,
              y: eproj.y - 24,
              color: '#ef4444',
              life: 0,
              maxLife: 1.5,
              scale: 1.25,
            });

            callbacksRef.current.setPlacedModules((prev) => {
              const next = { ...prev };
              delete next[hitPlayerModKey!];
              return next;
            });
          }

          // Sparks
          for (let sp = 0; sp < 4; sp++) {
            debrisList.push({
              x: eproj.x,
              y: eproj.y,
              vx: (Math.random() - 0.5) * 50,
              vy: (Math.random() - 0.5) * 50,
              size: 2,
              color: eproj.color,
              life: 0,
              maxLife: 0.25,
            });
          }

          activeEnemyProjectiles.splice(ep, 1);
          continue;
        }

        // Collision with Citadel Core
        const coreDist = Math.hypot(eproj.x, eproj.y);
        if (coreDist <= 28) {
          sound.playAlert();
          screenShake = Math.min(18, screenShake + 4);

          callbacksRef.current.setTower((prev) => {
            const sh = prev.sectors.shields;
            let nextCore = prev.coreHp;
            let nextSectors = { ...prev.sectors };

            if (sh.status === 'operational' && sh.hp > 0) {
              const newShieldHp = Math.max(0, sh.hp - eproj.damage * 1.2);
              nextSectors.shields = {
                ...sh,
                hp: newShieldHp,
                status: newShieldHp === 0 ? 'disabled' : 'operational',
              };
            } else {
              nextCore = Math.max(0, prev.coreHp - eproj.damage);
            }

            if (nextCore <= 0) {
              setTimeout(() => callbacksRef.current.handleDefeat(), 50);
            }

            return { ...prev, coreHp: nextCore, sectors: nextSectors };
          });

          floatingTexts.push({
            text: `-${eproj.damage} TORRE`,
            x: eproj.x,
            y: eproj.y - 10,
            color: '#ef4444',
            life: 0,
            maxLife: 0.8,
          });

          activeEnemyProjectiles.splice(ep, 1);
          continue;
        }

        // Out of bounds or lifetime reached
        if (eproj.life >= eproj.maxLife || Math.hypot(eproj.x, eproj.y) > 1100) {
          activeEnemyProjectiles.splice(ep, 1);
          continue;
        }

        // Draw Distinct Enemy Projectile Graphics
        ctx.save();
        ctx.translate(eproj.x, eproj.y);
        const pAng = Math.atan2(eproj.vy, eproj.vx);
        ctx.rotate(pAng);

        if (eproj.type === 'plasma_red') {
          // Invader: Red high-energy plasma dart
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-5, -1.8, 10, 3.6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(1, -0.9, 4, 1.8);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-6, -2.4, 12, 4.8);
        } else if (eproj.type === 'needle_green') {
          // Hunter: Emerald piercing energy needle
          ctx.fillStyle = '#10b981';
          ctx.fillRect(-7, -1, 14, 2);
          ctx.fillStyle = '#a7f3d0';
          ctx.fillRect(2, -0.6, 5, 1.2);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.stroke();
        } else if (eproj.type === 'void_purple') {
          // Saboteur: Swirling purple void orb
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f3e8ff';
          ctx.fillRect(-1.5, -1.5, 3, 3);
          const spin = (time * 0.015) % (Math.PI * 2);
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 6.5, spin, spin + Math.PI * 1.4);
          ctx.stroke();
        } else if (eproj.type === 'acid_yellow') {
          // Parasite: Caustic bio globule
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-1, -1, 2, 2);
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(-2, 0, 5, 0, Math.PI * 2);
          ctx.stroke();
        } else if (eproj.type === 'beam_crimson') {
          // Siege: Heavy crimson railgun slug with trailing wake
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-8, -2.5, 16, 5);
          ctx.fillStyle = '#fca5a5';
          ctx.fillRect(2, -1.2, 6, 2.4);
          ctx.strokeStyle = 'rgba(220, 38, 38, 0.7)';
          ctx.lineWidth = 1.6;
          ctx.strokeRect(-9, -3.2, 18, 6.4);
        } else {
          // Colossus: Cosmic blue pulsar sphere
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 9 + Math.sin(time * 0.02) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 8. ENEMY DEATH & REWARDS
      for (let k = activeEnemies.length - 1; k >= 0; k--) {
        const enemy = activeEnemies[k];
        if (enemy.hp <= 0) {
          sound.playExplosion(0.12);
          callbacksRef.current.addWavePoints(1);

          const droppedItems = generateBalancedEnemyLoot(enemy.type, wave);

          callbacksRef.current.setCombatResources((prev) => prev + enemy.rewardMatter);
          callbacksRef.current.addCombatCurrencies({
            nanoMatter: enemy.rewardMatter,
            microCircuits: enemy.rewardTech,
            tacticalData: enemy.rewardData,
            dimensionalMatrix: enemy.rewardDim || 0,
          });
          callbacksRef.current.addVolatileCargo({
            matter: enemy.rewardMatter,
            techComponents: enemy.rewardTech,
            dimensionalMaterials: enemy.rewardDim || 0,
            combatData: enemy.rewardData,
            items: droppedItems,
          });

          for (let lc = 0; lc < 3; lc++) {
            lootCrystals.push({
              x: enemy.x,
              y: enemy.y,
              vx: (Math.random() - 0.5) * 80,
              vy: (Math.random() - 0.5) * 80,
              color: '#38bdf8',
              size: 3,
              life: 0,
              maxLife: 1.5,
            });
          }

          activeEnemies.splice(k, 1);
        }
      }

      // Check wave completion
      if (
        isCombatPhase &&
        waveStarted &&
        hasSpawnedAny &&
        waveRoster.length === 0 &&
        activeEnemies.length === 0
      ) {
        waveStarted = false;
        callbacksRef.current.onWaveComplete();
      }

      // 9. PARTICLES & COMBAT TEXTS
      for (let db = debrisList.length - 1; db >= 0; db--) {
        const deb = debrisList[db];
        deb.life += dt;
        if (deb.life >= deb.maxLife) {
          debrisList.splice(db, 1);
        } else {
          deb.x += deb.vx * dt;
          deb.y += deb.vy * dt;
          ctx.fillStyle = deb.color;
          ctx.fillRect(deb.x - deb.size / 2, deb.y - deb.size / 2, deb.size, deb.size);
        }
      }

      for (let ft = floatingTexts.length - 1; ft >= 0; ft--) {
        const textObj = floatingTexts[ft];
        textObj.life += dt;
        if (textObj.life >= textObj.maxLife) {
          floatingTexts.splice(ft, 1);
        } else {
          textObj.y -= 28 * dt;
          ctx.save();
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = textObj.color;
          ctx.textAlign = 'center';
          ctx.fillText(textObj.text, textObj.x, textObj.y);
          ctx.restore();
        }
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  const selKey = selectedHex ? `${selectedHex.q},${selectedHex.r}` : null;
  const currentOccupiedModule = selKey ? placedModules[selKey] : null;

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-slate-950 select-none"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* 1. Backdrop Focus Overlay: dims everything else to focus on hex and radial menu */}
      {selectedHex && radialPos && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[1.5px] z-30 pointer-events-auto cursor-pointer animate-in fade-in duration-200"
          onClick={() => {
            sound.playClick();
            setSelectedHex(null);
            setSelectedDeployType(null);
          }}
        />
      )}

      {/* 2. EXPANSIVE HEXAGONAL TACTICAL FAB CONTAINER AROUND SELECTED HEX */}
      {selectedHex && radialPos && (
        <div
          className="fab-container pointer-events-auto z-40 select-none"
          style={{
            position: 'absolute',
            left: `${radialPos.x}px`,
            top: `${radialPos.y}px`,
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
          }}
        >
          {/* Hexagonal Connecting SVG Guideline Frame strictly centered at (30, 30) */}
          <svg
            className="absolute pointer-events-none"
            style={{
              width: '260px',
              height: '260px',
              left: '30px',
              top: '30px',
              transform: 'translate(-50%, -50%)',
            }}
            viewBox="-130 -130 260 260"
          >
            {/* Outer Hexagon Perimeter Outline passing directly through the 6 button centers */}
            <polygon
              points="90,0 45,78 -45,78 -90,0 -45,-78 45,-78"
              fill="rgba(6, 182, 212, 0.08)"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            {/* Inner Hexagon Ring */}
            <polygon
              points="28,0 14,24.2 -14,24.2 -28,0 -14,-24.2 14,-24.2"
              fill="rgba(2, 132, 199, 0.18)"
              stroke="rgba(56, 189, 248, 0.6)"
              strokeWidth="1"
            />
            {/* Vertex Crosshair Ticks at each of the 6 vertices: matching the exact coordinates */}
            {[
              { x: 90, y: 0 },
              { x: 45, y: 78 },
              { x: -45, y: 78 },
              { x: -90, y: 0 },
              { x: -45, y: -78 },
              { x: 45, y: -78 },
            ].map((v, idx) => (
              <circle
                key={idx}
                cx={v.x}
                cy={v.y}
                r="3"
                fill="#06b6d4"
                stroke="rgba(6, 182, 212, 0.7)"
                strokeWidth="1.5"
              />
            ))}
          </svg>

          {/* Botão Central (Gatilho) - Hexágono Centrado */}
          <button
            onClick={handleCloseMenu}
            className="fab-btn fab-main cursor-pointer group"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '60px',
              height: '60px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              filter: 'drop-shadow(0 0 14px rgba(255, 0, 127, 0.6))',
              transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: menuOpen ? 'scale(1)' : 'scale(0.85)',
            }}
            title="Fechar Menu do Hexágono (Clique para fechar)"
          >
            {/* Hexágono Regular Centrado */}
            <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md">
              <polygon
                points="56,30 43,52.5 17,52.5 4,30 17,7.5 43,7.5"
                fill="#ff007f"
                stroke="#ff80bf"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
            <X className="relative z-10 w-6 h-6 text-white stroke-[2.5] drop-shadow transition-transform duration-300 group-hover:rotate-90" />
          </button>

          {/* Case 1: EMPTY HEX - Render up to 6 UNLOCKED Escalated Module Deployment Pentagons at the 6 Vertices */}
          {!currentOccupiedModule && (
            <>
              {(() => {
                const unlockedEquipped = escalatedModules.filter(
                  (mType) => defenseModuleDefs[mType]?.unlocked
                );

                if (unlockedEquipped.length === 0) {
                  return (
                    <div
                      className="absolute z-50 pointer-events-none w-56 text-center p-2.5 rounded-xl bg-slate-950/98 border border-amber-500/70 text-[11px] font-mono text-amber-300 shadow-2xl backdrop-blur-md"
                      style={{
                        left: '30px',
                        top: '-55px',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      Nenhum módulo construído no Esquadrão. Construa módulos no Hangar da Estação Base.
                    </div>
                  );
                }

                const offsets = [
                  { x: 90, y: 0 },    // Botão 1 (0° - Direita)
                  { x: 45, y: 78 },   // Botão 2 (60° - Inferior Direito)
                  { x: -45, y: 78 },  // Botão 3 (120° - Inferior Esquerdo)
                  { x: -90, y: 0 },   // Botão 4 (180° - Esquerda)
                  { x: -45, y: -78 }, // Botão 5 (240° - Superior Esquerdo)
                  { x: 45, y: -78 },  // Botão 6 (300° - Superior Direito)
                ];

                return offsets.map((off, slotIdx) => {
                  const mType = unlockedEquipped[slotIdx];

                  // Faint hollow pentagon slot if module not equipped
                  if (!mType) {
                    return (
                      <div
                        key={`empty_slot_${slotIdx}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '60px',
                          height: '60px',
                          transform: menuOpen
                            ? `translate(${off.x}px, ${off.y}px) scale(0.85)`
                            : 'translate(0px, 0px) scale(0.3)',
                          opacity: menuOpen ? 0.35 : 0,
                          transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
                          pointerEvents: 'none',
                        }}
                      >
                        <svg viewBox="0 0 60 60" className="w-full h-full">
                          <polygon
                            points="30,4 56,23 46,54 14,54 4,23"
                            fill="rgba(15, 23, 42, 0.4)"
                            stroke="rgba(6, 182, 212, 0.4)"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    );
                  }

                  const def = defenseModuleDefs[mType] || DEFAULT_MODULE_DEFS[mType];
                  const cost = def.tacticalCost || {
                    nanoMatter: def.baseCost,
                    microCircuits: 2,
                    tacticalData: 0,
                    dimensionalMatrix: 0,
                  };

                  const canAfford =
                    combatCurrencies.nanoMatter >= cost.nanoMatter &&
                    combatCurrencies.microCircuits >= cost.microCircuits &&
                    combatCurrencies.tacticalData >= (cost.tacticalData || 0) &&
                    combatCurrencies.dimensionalMatrix >= (cost.dimensionalMatrix || 0);

                  return (
                    <div
                      key={mType}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '60px',
                        height: '60px',
                        transform: menuOpen
                          ? `translate(${off.x}px, ${off.y}px) scale(1)`
                          : 'translate(0px, 0px) scale(0.3)',
                        opacity: menuOpen ? 1 : 0,
                        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
                        pointerEvents: menuOpen ? 'auto' : 'none',
                        zIndex: 6,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canAfford) {
                            const ok = deployModuleToHex(selectedHex.q, selectedHex.r, mType);
                            if (ok) {
                              sound.playDeploy();
                              handleCloseMenu();
                            }
                          } else {
                            sound.playClick();
                          }
                        }}
                        onMouseEnter={() => setHoveredRadialItem(mType)}
                        onMouseLeave={() => setHoveredRadialItem(null)}
                        disabled={!canAfford}
                        className={`relative w-full h-full flex flex-col items-center justify-center cursor-pointer transition-transform duration-200 group ${
                          canAfford ? 'hover:scale-110 active:scale-95' : 'cursor-not-allowed opacity-50'
                        }`}
                        title={`${def.name} (${cost.nanoMatter} NM, ${cost.microCircuits} MC)`}
                      >
                        {/* Pentagon SVG Background */}
                        <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md">
                          <polygon
                            points="30,4 56,23 46,54 14,54 4,23"
                            fill={canAfford ? 'rgba(15, 23, 42, 0.96)' : 'rgba(8, 12, 22, 0.92)'}
                            stroke={canAfford ? '#06b6d4' : '#334155'}
                            strokeWidth={canAfford ? '2.4' : '1.5'}
                            strokeLinejoin="round"
                          />
                        </svg>

                        {/* Ship Sprite (Size optimized for pentagon) */}
                        <img
                          src={getModuleSpriteDataUrl(mType)}
                          alt={def.name}
                          className="relative z-10 w-8 h-8 object-contain pointer-events-none drop-shadow-md mt-0.5"
                          style={{ imageRendering: 'pixelated' }}
                        />

                        {/* Cost Badge at the bottom of the pentagon */}
                        <span className="relative z-10 -mt-1 px-1.5 py-0.2 rounded bg-slate-950/90 border border-amber-500/80 text-[8px] font-mono font-bold text-amber-300 leading-none shadow-md flex items-center gap-1 whitespace-nowrap">
                          <span>{cost.nanoMatter}</span>
                          {cost.microCircuits > 0 && <span className="text-cyan-300">{cost.microCircuits} MC</span>}
                        </span>
                      </button>

                      {/* Tooltip on Hover */}
                      {hoveredRadialItem === mType && (
                        <div
                          className="absolute z-50 pointer-events-none w-52 p-2.5 rounded-xl bg-slate-950/98 border border-cyan-400 shadow-2xl backdrop-blur-md text-left animate-in fade-in zoom-in-95 duration-100"
                          style={{
                            left: off.x >= 0 ? '65px' : 'auto',
                            right: off.x < 0 ? '65px' : 'auto',
                            top: off.y >= 0 ? '30px' : 'auto',
                            bottom: off.y < 0 ? '30px' : 'auto',
                          }}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-white font-mono">
                            <span className="truncate">{def.name}</span>
                            <span className="text-amber-300 ml-1 shrink-0">{cost.nanoMatter} NM</span>
                          </div>
                          <span className="text-[10px] text-cyan-400 font-mono block mt-0.5">
                            {def.role}
                          </span>
                          <div className="flex items-center gap-2 text-[9px] font-mono mt-1 text-slate-300">
                            <span className="text-amber-300">{cost.nanoMatter} Nano-Matéria</span>
                            <span className="text-cyan-300">{cost.microCircuits} Micro-Circ.</span>
                            {(cost.tacticalData || 0) > 0 && (
                              <span className="text-purple-300">{cost.tacticalData} Dados</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                            {def.tacticalSpecialty}
                          </p>
                          <div className="mt-1.5 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-400">
                            <span>Dano: <strong className="text-cyan-300">{def.baseDamage}</strong></span>
                            <span>Cadência: <strong className="text-slate-200">{def.baseFireRate}/s</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </>
          )}

          {/* Case 2: OCCUPIED HEX - Render Quick Action Pentagons along Hexagon Vertices */}
          {currentOccupiedModule && (
            <>
              {(() => {
                const def = defenseModuleDefs[currentOccupiedModule.type] || DEFAULT_MODULE_DEFS[currentOccupiedModule.type];
                const baseCost = def.tacticalCost || {
                  nanoMatter: def.baseCost,
                  microCircuits: 2,
                  tacticalData: 0,
                  dimensionalMatrix: 0,
                };

                const costNano = Math.round(baseCost.nanoMatter * 0.65 * currentOccupiedModule.level);
                const costMicro = Math.max(1, Math.round(baseCost.microCircuits * 0.5 * currentOccupiedModule.level));
                const costData = baseCost.tacticalData ? Math.max(1, Math.round(baseCost.tacticalData * 0.5 * currentOccupiedModule.level)) : 0;
                const costDim = currentOccupiedModule.level >= 3 && baseCost.dimensionalMatrix ? 1 : 0;

                const canAffordUpgrade =
                  combatCurrencies.nanoMatter >= costNano &&
                  combatCurrencies.microCircuits >= costMicro &&
                  combatCurrencies.tacticalData >= costData &&
                  combatCurrencies.dimensionalMatrix >= costDim;

                const repairNano = Math.max(6, Math.round(baseCost.nanoMatter * 0.25));
                const repairMicro = Math.max(1, Math.round(baseCost.microCircuits * 0.2));
                const isDamaged = (currentOccupiedModule.currentHp ?? currentOccupiedModule.maxHp) < currentOccupiedModule.maxHp;
                const canAffordRepair =
                  combatCurrencies.nanoMatter >= repairNano &&
                  combatCurrencies.microCircuits >= repairMicro;

                const recycleRefundNano = Math.round(baseCost.nanoMatter * 0.65 * currentOccupiedModule.level);
                const recycleRefundMicro = Math.round(baseCost.microCircuits * 0.5 * currentOccupiedModule.level);

                const stats = computeTacticalStats(
                  currentOccupiedModule,
                  placedModules,
                  activeRoguelikeUpgrades || [],
                  0,
                  false
                );

                return (
                  <>
                    {/* 1. Evoluir (Botão 6: 300° - Superior Direito, 45px, -78px) */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '60px',
                        height: '60px',
                        transform: menuOpen
                          ? 'translate(45px, -78px) scale(1)'
                          : 'translate(0px, 0px) scale(0.3)',
                        opacity: menuOpen ? 1 : 0,
                        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
                        zIndex: 6,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canAffordUpgrade && currentOccupiedModule.level < 5) {
                            upgradePlacedModule(selKey!);
                            sound.playUpgrade();
                          }
                        }}
                        disabled={!canAffordUpgrade || currentOccupiedModule.level >= 5}
                        className={`relative w-full h-full flex flex-col items-center justify-center cursor-pointer transition-transform duration-200 ${
                          canAffordUpgrade && currentOccupiedModule.level < 5
                            ? 'hover:scale-110 active:scale-95'
                            : 'cursor-not-allowed opacity-50'
                        }`}
                        title={`Evoluir para Nível ${currentOccupiedModule.level + 1} (${costNano} NM + ${costMicro} MC)`}
                      >
                        <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md">
                          <polygon
                            points="30,4 56,23 46,54 14,54 4,23"
                            fill="rgba(15, 23, 42, 0.96)"
                            stroke={currentOccupiedModule.level >= 5 ? '#10b981' : canAffordUpgrade ? '#06b6d4' : '#334155'}
                            strokeWidth="2.4"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <TrendingUp className="relative z-10 w-5 h-5 text-cyan-300 mt-1" />
                        <span className="relative z-10 text-[8px] font-mono font-bold text-amber-300">
                          {currentOccupiedModule.level < 5 ? `${costNano} NM` : 'MÁX'}
                        </span>
                      </button>
                    </div>

                    {/* 2. Reparar Casco (Botão 2: 60° - Inferior Direito, 45px, 78px) */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '60px',
                        height: '60px',
                        transform: menuOpen
                          ? 'translate(45px, 78px) scale(1)'
                          : 'translate(0px, 0px) scale(0.3)',
                        opacity: menuOpen ? 1 : 0,
                        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
                        zIndex: 6,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isDamaged && canAffordRepair) {
                            repairPlacedModule(selKey!);
                            sound.playUpgrade();
                          }
                        }}
                        disabled={!isDamaged || !canAffordRepair}
                        className={`relative w-full h-full flex flex-col items-center justify-center cursor-pointer transition-transform duration-200 ${
                          isDamaged && canAffordRepair
                            ? 'hover:scale-110 active:scale-95'
                            : 'cursor-default opacity-60'
                        }`}
                        title={isDamaged ? `Reparar Casco (${repairNano} NM + ${repairMicro} MC)` : 'Casco em 100%'}
                      >
                        <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md">
                          <polygon
                            points="30,4 56,23 46,54 14,54 4,23"
                            fill="rgba(15, 23, 42, 0.96)"
                            stroke={isDamaged && canAffordRepair ? '#10b981' : '#334155'}
                            strokeWidth="2.4"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <Shield className="relative z-10 w-5 h-5 text-emerald-300 mt-1" />
                        <span className="relative z-10 text-[8px] font-mono font-bold text-emerald-300">
                          {isDamaged ? `${repairNano} NM` : '100%'}
                        </span>
                      </button>
                    </div>

                    {/* 3. Desmanchar / Reciclar (Botão 4: 180° - Esquerda, -90px, 0px) */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '60px',
                        height: '60px',
                        transform: menuOpen
                          ? 'translate(-90px, 0px) scale(1)'
                          : 'translate(0px, 0px) scale(0.3)',
                        opacity: menuOpen ? 1 : 0,
                        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
                        zIndex: 6,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          recyclePlacedModule(selKey!);
                          sound.playClick();
                          handleCloseMenu();
                        }}
                        className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 group"
                        title={`Desmantelar embarcação e reembolsar (+${recycleRefundNano} NM + ${recycleRefundMicro} MC)`}
                      >
                        <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md">
                          <polygon
                            points="30,4 56,23 46,54 14,54 4,23"
                            fill="rgba(20, 10, 15, 0.96)"
                            stroke="#f43f5e"
                            strokeWidth="2.4"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <Trash2 className="relative z-10 w-5 h-5 text-rose-300 mt-1" />
                        <span className="relative z-10 text-[8px] font-mono font-bold text-emerald-400">
                          +{recycleRefundNano} NM
                        </span>
                      </button>
                    </div>

                    {/* 4. Módulo Instalado Info (Botão 1: 0° - Direita, 90px, 0px) */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '60px',
                        height: '60px',
                        transform: menuOpen
                          ? 'translate(90px, 0px) scale(1)'
                          : 'translate(0px, 0px) scale(0.3)',
                        opacity: menuOpen ? 1 : 0,
                        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
                        zIndex: 6,
                      }}
                    >
                      <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none">
                        <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md">
                          <polygon
                            points="30,4 56,23 46,54 14,54 4,23"
                            fill="rgba(15, 23, 42, 0.96)"
                            stroke="#38bdf8"
                            strokeWidth="2.2"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <img
                          src={getModuleSpriteDataUrl(currentOccupiedModule.type)}
                          alt={def.name}
                          className="relative z-10 w-7 h-7 object-contain drop-shadow"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <span className="relative z-10 text-[8px] font-mono font-bold text-cyan-300 -mt-0.5">
                          NV.{currentOccupiedModule.level}
                        </span>
                      </div>
                    </div>

                    {/* 5. Painel Flutuante de Estatísticas Táticas (Afetado a -105px para não sobrepor o botão superior) */}
                    <div
                      className="absolute z-50 pointer-events-none px-3.5 py-1.5 rounded-xl bg-slate-950/98 border border-cyan-400/80 shadow-[0_0_24px_rgba(6,182,212,0.35)] text-center font-mono text-[9px] whitespace-nowrap backdrop-blur-md"
                      style={{
                        left: '30px',
                        top: '-105px',
                        transform: 'translateX(-50%)',
                        opacity: menuOpen ? 1 : 0,
                        transition: 'opacity 0.3s ease 0.1s',
                      }}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-white font-bold">{def.name} · NV.{currentOccupiedModule.level}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-slate-300 mt-0.5">
                        <span className="text-amber-300 font-semibold">{stats.damage} DMG</span>
                        <span>·</span>
                        <span className="text-cyan-300 font-semibold">{currentOccupiedModule.kills} Kills</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-semibold">
                          {stats.effectiveCurHp}/{stats.maxHp} HP
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
};
