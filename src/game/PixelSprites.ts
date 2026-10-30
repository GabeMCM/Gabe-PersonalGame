/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModuleType, EnemyType } from '../types/game';

// Draw detailed pixel art fleet module onto any 2D canvas context
export function drawDetailedFleetSprite(
  ctx: CanvasRenderingContext2D,
  type: ModuleType,
  level: number = 1,
  angle: number = 0,
  time: number = 0
) {
  ctx.save();
  ctx.rotate(angle);

  const flameOsc = Math.sin(time * 0.02) * 2;
  const pulseOsc = Math.sin(time * 0.01) * 1.5;

  if (type === 'pulse_cannon') {
    // Interceptor Fast Patrol Ship (Cyan / Stealth Steel)
    // 1. Under-hull shadow / armor plate
    ctx.fillStyle = '#080c14';
    ctx.fillRect(-7, -15, 14, 30);

    // 2. Main fuselage with beveled armor layers
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-5, -13, 10, 26);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-3, -11, 6, 22);

    // 3. Swept angular wings with edge highlights
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(-17, 1, 34, 6);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-15, 2, 30, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-18, 4, 36, 1.5);

    // Wingtip sensor pods
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-18, 1, 2, 5);
    ctx.fillRect(16, 1, 2, 5);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(-18, 2, 2, 2);
    ctx.fillRect(16, 2, 2, 2);

    // 4. Cockpit Canopy with light reflection
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(-3, -8, 6, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-2, -7, 4, 6);
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(-1, -6, 2, 2);

    // 5. Twin heavy pulse cannons with reinforced barrels
    ctx.fillStyle = '#475569';
    ctx.fillRect(-10, -18, 3, 16);
    ctx.fillRect(7, -18, 3, 16);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-9, -17, 1, 14);
    ctx.fillRect(8, -17, 1, 14);
    // Emitter muzzle glow
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-10, -19, 3, 2);
    ctx.fillRect(7, -19, 3, 2);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(-9, -19, 1, 1);
    ctx.fillRect(8, -19, 1, 1);

    // 6. Dual Ion Thrusters with dynamic flame plume
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-5, 13, 4, 3);
    ctx.fillRect(1, 13, 4, 3);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-4, 16, 2, 6 + flameOsc);
    ctx.fillRect(2, 16, 2, 6 + flameOsc);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, 16, 2, 2);
    ctx.fillRect(2, 16, 2, 2);

  } else if (type === 'beam_cruiser') {
    // Continuous Focused Laser Cruiser (Amber / Deep Indigo)
    // 1. Heavy hull chassis
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(-9, -19, 18, 36);
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-7, -17, 14, 32);
    ctx.fillStyle = '#312e81';
    ctx.fillRect(-5, -15, 10, 28);

    // 2. Angular radiator cooling fins
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-19, -5, 38, 8);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-17, -4, 34, 6);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-15, -3, 30, 2);

    // 3. Central Laser Prism Array & Focus Ring
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(0, -23);
    ctx.lineTo(-7, -15);
    ctx.lineTo(7, -15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-5, -15);
    ctx.lineTo(5, -15);
    ctx.closePath();
    ctx.fill();

    // Laser core focal optic
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-2, -20, 4, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -19, 2, 2);

    // 4. Armored bridge and command tower
    ctx.fillStyle = '#475569';
    ctx.fillRect(-4, -5, 8, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, -3, 4, 4);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(-1, -2, 2, 2);

    // 5. Heavy twin thrusters with amber ion burn
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-7, 15, 5, 4);
    ctx.fillRect(2, 15, 5, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-6, 19, 3, 7 + flameOsc);
    ctx.fillRect(3, 19, 3, 7 + flameOsc);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-5, 19, 1, 3);
    ctx.fillRect(4, 19, 1, 3);

  } else if (type === 'plasma_battery') {
    // Heavy Plasma Artillery Platform (Purple / Dark Iron)
    // 1. Octagonal armored turret base
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f3f46';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // 2. Heavy twin mortar tubes with reinforced muzzle breaks
    ctx.fillStyle = '#52525b';
    ctx.fillRect(-9, -22, 6, 18);
    ctx.fillRect(3, -22, 6, 18);
    ctx.fillStyle = '#71717a';
    ctx.fillRect(-8, -21, 2, 16);
    ctx.fillRect(4, -21, 2, 16);
    // Plasma muzzle ring
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(-9, -23, 6, 3);
    ctx.fillRect(3, -23, 6, 3);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(-8, -23, 4, 1);
    ctx.fillRect(4, -23, 4, 1);

    // 3. Plasma Chamber Reactor (Pulsing Energy Sphere)
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.arc(0, 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.arc(0, 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(0, 2, 4 + pulseOsc, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Perimeter armor bolts
    ctx.fillStyle = '#d4d4d8';
    for (let b = 0; b < 6; b++) {
      const ba = (b * Math.PI) / 3;
      ctx.fillRect(Math.cos(ba) * 11 - 1, Math.sin(ba) * 11 - 1, 2, 2);
    }

    // 5. Plasma ion exhausts
    ctx.fillStyle = '#581c87';
    ctx.fillRect(-7, 13, 5, 3);
    ctx.fillRect(2, 13, 5, 3);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(-6, 16, 3, 5 + flameOsc);
    ctx.fillRect(3, 16, 3, 5 + flameOsc);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(-5, 16, 1, 2);
    ctx.fillRect(4, 16, 1, 2);

  } else if (type === 'flux_harvester') {
    // Siphon & Vacuum Collector (Emerald / Chrome)
    // 1. External magnetic containment ring
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Central collector hopper & crystal siphon
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = '#047857';
    ctx.fillRect(-6, -6, 12, 12);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.fillStyle = '#a7f3d0';
    ctx.fillRect(-2, -2, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -1, 2, 2);

    // 3. 3 Magnetic Induction Pylons with orbiting energy field
    for (let p = 0; p < 3; p++) {
      const pa = (p * Math.PI * 2) / 3 + time * 0.003;
      const px = Math.cos(pa) * 15;
      const py = Math.sin(pa) * 15;
      ctx.fillStyle = '#047857';
      ctx.fillRect(px - 3.5, py - 3.5, 7, 7);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(px - 2, py - 2, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, py - 1, 2, 2);

      // Arc connecting to center
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
  } else if (type === 'missile_launcher') {
    // Heavy Guided Micro-Missile Pod [MK-3005] (Industrial Orange / Charcoal Steel)
    // 1. Armored chassis
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-12, -14, 24, 28);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, -12, 20, 24);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-8, -10, 16, 20);

    // 2. Missile Rack Pods (2x3 grid of loaded missile tubes)
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(-9, -15, 18, 5);
    ctx.fillStyle = '#ea580c';
    [-7, -2, 3].forEach((tx) => {
      // Missile tips
      ctx.fillStyle = '#f97316';
      ctx.fillRect(tx, -18, 4, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(tx + 1, -19, 2, 2);
    });

    // 3. Side guidance antennas and stabilizer fins
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-16, -4, 4, 14);
    ctx.fillRect(12, -4, 4, 14);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-17, 0, 2, 6);
    ctx.fillRect(15, 0, 2, 6);

    // 4. Rear solid-fuel boosters
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(-6, 12, 4, 4);
    ctx.fillRect(2, 12, 4, 4);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-5, 16, 2, 5 + flameOsc);
    ctx.fillRect(3, 16, 2, 5 + flameOsc);
  } else if (type === 'tesla_coil') {
    // Cryogenic Tesla Arc Tower [MK-3006] (Deep Navy / Cyan Electrostatic)
    // 1. Armored ceramic base
    ctx.fillStyle = '#082f49';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // 2. Copper induction coil rings
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-10, -6, 20, 3);
    ctx.fillRect(-8, -1, 16, 3);
    ctx.fillRect(-6, 4, 12, 3);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-9, -5, 18, 1);
    ctx.fillRect(-7, 0, 14, 1);

    // 3. Central superconducting cathode sphere
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0f9ff';
    ctx.beginPath();
    ctx.arc(0, -12, 3, 0, Math.PI * 2);
    ctx.fill();

    // 4. Electrostatic spark arcs
    const arcAngle = time * 0.008;
    for (let a = 0; a < 3; a++) {
      const sa = arcAngle + (a * Math.PI * 2) / 3;
      const sx = Math.cos(sa) * 11;
      const sy = -12 + Math.sin(sa) * 8;
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }

    // 5. Cryo thrusters
    ctx.fillStyle = '#075985';
    ctx.fillRect(-6, 14, 4, 3);
    ctx.fillRect(2, 14, 4, 3);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-5, 17, 2, 5 + flameOsc);
    ctx.fillRect(3, 17, 2, 5 + flameOsc);
  } else if (type === 'railgun_bastion') {
    // Hypersonic Mass Accelerator Railgun [MK-3007] (Dark Gunmetal / Emerald Neon)
    // 1. Sleek heavy linear chassis
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(-6, -24, 12, 44);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-5, -22, 10, 40);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-4, -18, 8, 34);

    // 2. Twin magnetic linear accelerator rails
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-7, -26, 2.5, 32);
    ctx.fillRect(4.5, -26, 2.5, 32);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(-6.5, -26, 1.5, 30);
    ctx.fillRect(5, -26, 1.5, 30);

    // 3. Central magnetic bore gap with plasma glow
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-1.5, -24, 3, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-0.5, -23, 1, 16);

    // 4. Capacitor radiator wings
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-15, 2, 30, 6);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-14, 4, 28, 2);

    // 5. High-output Ion thrusters
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-4, 16, 3, 5 + flameOsc);
    ctx.fillRect(1, 16, 3, 5 + flameOsc);
  } else if (type === 'nanobot_drone') {
    // Engineering Drone Bay & Nanobot Swarm [MK-3008] (Titanium White / Lime Glow)
    // 1. Hexagonal hive drone bay
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hexagonal honeycomb matrix
    ctx.fillStyle = '#10b981';
    [-4, 4].forEach((hx) => {
      [-4, 4].forEach((hy) => {
        ctx.fillRect(hx - 2, hy - 2, 4, 4);
      });
    });

    // 3. Orbiting repair micro-drones
    for (let d = 0; d < 3; d++) {
      const da = time * 0.005 + (d * Math.PI * 2) / 3;
      const dx = Math.cos(da) * 16;
      const dy = Math.sin(da) * 16;
      ctx.fillStyle = '#86efac';
      ctx.fillRect(dx - 2.5, dy - 2.5, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dx - 1, dy - 1, 2, 2);

      // Micro laser beam connecting to bay
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dx, dy);
      ctx.stroke();
    }
  }

  // Level badge star
  if (level > 1) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`N${level}`, 0, 22);
  }

  ctx.restore();
}

// Draw detailed pixel art enemy sprite with intricate alien details, textures and lighting
export function drawDetailedEnemySprite(
  ctx: CanvasRenderingContext2D,
  type: EnemyType,
  isHit: boolean,
  time: number
) {
  const pulse = Math.sin(time * 0.012) * 2;
  const flame = Math.sin(time * 0.025) * 3;

  if (type === 'hunter') {
    // Needle Scout / Hunter (Crimson Stealth Raptor Fighter)
    // 1. Underbelly dark chassis
    ctx.fillStyle = isHit ? '#ffffff' : '#450a0a';
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(-14, -12);
    ctx.lineTo(0, -7);
    ctx.lineTo(14, -12);
    ctx.closePath();
    ctx.fill();

    // 2. Primary armor carapace (Deep blood crimson)
    ctx.fillStyle = isHit ? '#ffffff' : '#991b1b';
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(-11, -8);
    ctx.lineTo(0, -4);
    ctx.lineTo(11, -8);
    ctx.closePath();
    ctx.fill();

    // 3. Top faceted plating (Vivid scarlet highlight)
    ctx.fillStyle = isHit ? '#ffffff' : '#dc2626';
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.lineTo(-7, -4);
    ctx.lineTo(0, -2);
    ctx.lineTo(7, -4);
    ctx.closePath();
    ctx.fill();

    // 4. Cockpit / Multi-sensor slit
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-5, 0, 2, 5);
    ctx.fillRect(3, 0, 2, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, 1, 1, 2);
    ctx.fillRect(4, 1, 1, 2);

    // 5. Wingtip plasma disruptor needles
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-13, -14, 2, 6);
    ctx.fillRect(11, -14, 2, 6);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(-13, -15, 2, 2);
    ctx.fillRect(11, -15, 2, 2);

    // 6. Dual afterburners with animated flame
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-8, -13, 3, 5 + flame);
    ctx.fillRect(5, -13, 3, 5 + flame);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-7, -13, 1, 3);
    ctx.fillRect(6, -13, 1, 3);

  } else if (type === 'saboteur') {
    // Industrial Cyber-Wasp Drill / Saboteur (Hazard Amber / Carbon)
    // 1. Heavy arachnid chassis
    ctx.fillStyle = isHit ? '#ffffff' : '#292524';
    ctx.fillRect(-8, -10, 16, 20);
    ctx.fillStyle = isHit ? '#ffffff' : '#b45309';
    ctx.fillRect(-6, -8, 12, 16);

    // 2. Yellow hazard warning stripes
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-6, -6, 12, 2);
    ctx.fillRect(-6, -1, 12, 2);
    ctx.fillRect(-6, 4, 12, 2);
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(-6, -4, 12, 2);
    ctx.fillRect(-6, 1, 12, 2);

    // 3. Counter-rotating Drill Head (Punches forward)
    const drillOffset = Math.sin(time * 0.03) * 1.5;
    ctx.fillStyle = isHit ? '#ffffff' : '#78716c';
    ctx.beginPath();
    ctx.moveTo(0, 18 + drillOffset);
    ctx.lineTo(-6, 8);
    ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fill();

    // Spiral diamond teeth on the drill
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, 18 + drillOffset);
    ctx.lineTo(-3, 12);
    ctx.lineTo(3, 12);
    ctx.closePath();
    ctx.fill();

    // 4. 4 Articulated mechanical legs with joint hinges
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 2;
    const legWiggle = Math.sin(time * 0.015) * 2;
    ctx.beginPath();
    // Front legs
    ctx.moveTo(-8, 3); ctx.lineTo(-14 + legWiggle, 8); ctx.lineTo(-17 + legWiggle, 14);
    ctx.moveTo(8, 3); ctx.lineTo(14 - legWiggle, 8); ctx.lineTo(17 - legWiggle, 14);
    // Rear legs
    ctx.moveTo(-8, -6); ctx.lineTo(-15 - legWiggle, -3); ctx.lineTo(-18 - legWiggle, 3);
    ctx.moveTo(8, -6); ctx.lineTo(15 + legWiggle, -3); ctx.lineTo(18 + legWiggle, 3);
    ctx.stroke();

    // Eye cluster
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3, -2, 2, 2);
    ctx.fillRect(1, -2, 2, 2);

  } else if (type === 'siege') {
    // Heavy Polyhedral Cruiser / Siege (Dreadnought Armor & Siege Cannons)
    // 1. Heavy battleship slab chassis
    ctx.fillStyle = isHit ? '#ffffff' : '#090d16';
    ctx.fillRect(-17, -14, 34, 28);
    ctx.fillStyle = isHit ? '#ffffff' : '#1e293b';
    ctx.fillRect(-15, -12, 30, 24);
    ctx.fillStyle = isHit ? '#ffffff' : '#334155';
    ctx.fillRect(-13, -10, 26, 20);

    // 2. Front reinforced blast ram plate
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-18, 9, 36, 6);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-16, 10, 32, 2);
    ctx.fillStyle = '#fecaca';
    ctx.fillRect(-12, 10, 24, 1);

    // 3. Central Twin Heavy Siege Railguns
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, 14, 12, 11);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-5, 15, 4, 9);
    ctx.fillRect(1, 15, 4, 9);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-5, 23, 4, 2);
    ctx.fillRect(1, 23, 4, 2);

    // 4. Side armor cooling grilles & heat vents
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-14, -6, 3, 10);
    ctx.fillRect(11, -6, 3, 10);

    // 5. Heavy Quad Thruster Array
    ctx.fillStyle = '#ea580c';
    for (let t = -13; t <= 10; t += 7) {
      ctx.fillRect(t, -17, 4, 5 + flame);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(t + 1, -17, 2, 2);
      ctx.fillStyle = '#ea580c';
    }

  } else if (type === 'parasite') {
    // Bio-Mechanical Leech / Parasite (Pulsing Violet Bio-Carapace)
    // 1. Bio-core outer translucent membrane
    ctx.fillStyle = isHit ? '#ffffff' : '#2e1065';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // 2. Pulsing bio-sac
    ctx.fillStyle = isHit ? '#ffffff' : '#7e22ce';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(0, 0, 5 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f0abfc';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. 4 Sinuous segmented undulating tentacles
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    for (let leg = 0; leg < 4; leg++) {
      const la = (leg * Math.PI) / 2 + Math.PI / 4;
      const tentacleOsc = Math.sin(time * 0.015 + leg * 1.5) * 4;
      const x1 = Math.cos(la) * 7;
      const y1 = Math.sin(la) * 7;
      const x2 = Math.cos(la) * 14 + tentacleOsc;
      const y2 = Math.sin(la) * 14;
      const x3 = Math.cos(la) * 19 + tentacleOsc * 1.5;
      const y3 = Math.sin(la) * 19;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(x2, y2, x3, y3);
      ctx.stroke();

      // Tentacle tip stinger
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(x3 - 1.5, y3 - 1.5, 3, 3);
    }

  } else if (type === 'invader') {
    // Blood Ruby Assault Interceptor (Darting High-Speed Infiltrator)
    ctx.fillStyle = isHit ? '#ffffff' : '#450a0a';
    ctx.beginPath();
    ctx.moveTo(0, 17);
    ctx.lineTo(-9, -12);
    ctx.lineTo(0, -7);
    ctx.lineTo(9, -12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isHit ? '#ffffff' : '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(-6, -8);
    ctx.lineTo(6, -8);
    ctx.closePath();
    ctx.fill();

    // Central disruptor blade
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-1.5, 2, 3, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, 8, 2, 4);

    // Tri-thrusters
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-7, -14, 2, 4 + flame);
    ctx.fillRect(-1, -14, 2, 5 + flame);
    ctx.fillRect(5, -14, 2, 4 + flame);

  } else if (type === 'colossus') {
    // Dimensional Dreadnought Boss (Multi-layered Mega-structure Flagship)
    // 1. Massive under-hull foundation
    ctx.fillStyle = isHit ? '#ffffff' : '#030712';
    ctx.fillRect(-28, -24, 56, 48);
    ctx.fillStyle = isHit ? '#ffffff' : '#111827';
    ctx.fillRect(-25, -21, 50, 42);
    ctx.fillStyle = isHit ? '#ffffff' : '#1f2937';
    ctx.fillRect(-22, -18, 44, 36);

    // 2. Heavy armored wing pods with missile batteries
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-34, -10, 10, 24);
    ctx.fillRect(24, -10, 10, 24);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-32, -8, 6, 20);
    ctx.fillRect(26, -8, 6, 20);

    // Missile tube indicators
    ctx.fillStyle = '#fef08a';
    for (let m = -6; m <= 8; m += 4) {
      ctx.fillRect(-31, m, 2, 2);
      ctx.fillRect(29, m, 2, 2);
    }

    // 3. Dual Dark Matter Hyper-Rotors (Vortex containment)
    const corePulse = Math.sin(time * 0.01) * 2;
    ctx.fillStyle = '#4a044e';
    ctx.beginPath();
    ctx.arc(-12, 3, 7, 0, Math.PI * 2);
    ctx.arc(12, 3, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#9333ea';
    ctx.beginPath();
    ctx.arc(-12, 3, 5, 0, Math.PI * 2);
    ctx.arc(12, 3, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(-12, 3, 3 + corePulse, 0, Math.PI * 2);
    ctx.arc(12, 3, 3 + corePulse, 0, Math.PI * 2);
    ctx.fill();

    // 4. Central Commander Citadel & Red Eye Scanner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, 12, 12, 12);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-5, 13, 10, 3);
    // Moving eye scan line
    const eyeScan = Math.sin(time * 0.02) * 3;
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(eyeScan - 1, 13, 2, 3);

    // Forward Heavy Plasma Railguns
    ctx.fillStyle = '#374151';
    ctx.fillRect(-14, 21, 5, 8);
    ctx.fillRect(9, 21, 5, 8);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-14, 27, 5, 2);
    ctx.fillRect(9, 27, 5, 2);

    // 5. Heavy Main Thruster Array (6 heavy exhaust nozzles)
    ctx.fillStyle = '#f97316';
    for (let ex = -18; ex <= 14; ex += 7) {
      ctx.fillRect(ex, -28, 4, 6 + flame);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(ex + 1, -26, 2, 2);
      ctx.fillStyle = '#f97316';
    }
  }
}

// Generate base64 Data URL for UI buy cards
const spriteDataUrlCache: Record<string, string> = {};

export function getModuleSpriteDataUrl(type: ModuleType, level: number = 1): string {
  const cacheKey = `${type}_lvl${level}`;
  if (spriteDataUrlCache[cacheKey]) return spriteDataUrlCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = 56;
  canvas.height = 56;
  const ctx = canvas.getContext('2d')!;

  ctx.imageSmoothingEnabled = false;
  ctx.translate(28, 28);
  drawDetailedFleetSprite(ctx, type, level, 0, 120);

  const dataUrl = canvas.toDataURL('image/png');
  spriteDataUrlCache[cacheKey] = dataUrl;
  return dataUrl;
}

// Generate base64 Data URL for Enemy Intel / Codex
const enemySpriteDataUrlCache: Record<string, string> = {};

export function getEnemySpriteDataUrl(type: EnemyType): string {
  if (enemySpriteDataUrlCache[type]) return enemySpriteDataUrlCache[type];

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.imageSmoothingEnabled = false;
  ctx.translate(32, 32);
  drawDetailedEnemySprite(ctx, type, false, 80);

  const dataUrl = canvas.toDataURL('image/png');
  enemySpriteDataUrlCache[type] = dataUrl;
  return dataUrl;
}
