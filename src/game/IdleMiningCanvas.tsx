/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../utils/audio';

interface SpaceMeteor {
  id: string;
  type: 'iron' | 'crystal' | 'gold' | 'dark_matter' | 'pirate';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hp: number;
  maxHp: number;
  rotation: number;
  vRot: number;
  color: string;
}

interface TowerProjectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  size: number;
  damage: number;
  targetMeteorId: string;
}

interface FloatingMineralParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

export const IdleMiningCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    tower,
    setResources,
    isWarping,
    isOverclocked,
    towerAttackCount,
    baseSectors,
    circuitNodes,
    activeSkillEffects,
  } = useGame();

  const stateRef = useRef({
    tower,
    isWarping,
    isOverclocked,
    towerAttackCount,
    baseSectors,
    circuitNodes,
    activeSkillEffects,
  });

  useEffect(() => {
    stateRef.current = {
      tower,
      isWarping,
      isOverclocked,
      towerAttackCount,
      baseSectors,
      circuitNodes,
      activeSkillEffects,
    };
  }, [tower, isWarping, isOverclocked, towerAttackCount, baseSectors, circuitNodes, activeSkillEffects]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const meteors: SpaceMeteor[] = [];
    const projectiles: TowerProjectile[] = [];
    const particles: FloatingMineralParticle[] = [];

    // Cruise travel starfield: moving slowly to the left (-X direction) to simulate tower moving forward (+X)
    const stars: { x: number; y: number; s: number; a: number; speed: number; color: string }[] = [];
    for (let i = 0; i < 240; i++) {
      stars.push({
        x: Math.random() * 2400,
        y: Math.random() * 1200,
        s: Math.random() < 0.2 ? 2.5 : Math.random() < 0.6 ? 1.5 : 1,
        a: 0.2 + Math.random() * 0.8,
        speed: 18 + Math.random() * 32, // Low cruising speed
        color: Math.random() < 0.15 ? '#38bdf8' : Math.random() < 0.1 ? '#f59e0b' : '#ffffff',
      });
    }

    // Nebular drift clouds
    const nebulas = [
      { x: 300, y: 150, r: 240, color: 'rgba(14, 116, 144, 0.12)' },
      { x: 700, y: 350, r: 280, color: 'rgba(88, 28, 135, 0.14)' },
      { x: 1200, y: 200, r: 260, color: 'rgba(30, 58, 138, 0.1)' },
    ];

    function spawnMeteor(atRightEdge = true) {
      const types: ('iron' | 'crystal' | 'gold' | 'dark_matter' | 'pirate')[] = [
        'iron', 'iron', 'crystal', 'crystal', 'gold', 'dark_matter', 'pirate'
      ];
      const type = types[Math.floor(Math.random() * types.length)];

      let x = atRightEdge ? width + 50 : Math.random() * width;
      let y = Math.random() * height;

      // Slow drift from right to left with slight vertical variance
      const vx = -(25 + Math.random() * 20);
      const vy = (Math.random() - 0.5) * 12;

      let color = '#78716c';
      let size = 18 + Math.random() * 10;
      let hp = 40;

      if (type === 'crystal') {
        color = '#06b6d4';
        size = 15 + Math.random() * 8;
        hp = 30;
      } else if (type === 'gold') {
        color = '#f59e0b';
        size = 14 + Math.random() * 6;
        hp = 35;
      } else if (type === 'dark_matter') {
        color = '#c084fc';
        size = 16 + Math.random() * 8;
        hp = 50;
      } else if (type === 'pirate') {
        color = '#ef4444';
        size = 18;
        hp = 55;
      }

      meteors.push({
        id: `meteor_${Date.now()}_${Math.random()}`,
        type,
        x,
        y,
        vx,
        vy,
        size,
        hp,
        maxHp: hp,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.8,
        color,
      });
    }

    // Seed initial meteors
    for (let i = 0; i < 9; i++) {
      spawnMeteor(false);
    }

    let lastShotTime = 0;
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const curTower = stateRef.current.tower;
      const curOverclock = stateRef.current.isOverclocked;
      const curAttackCount = stateRef.current.towerAttackCount || 1;
      const curBaseSectors = stateRef.current.baseSectors;
      const curSkillEffects = stateRef.current.activeSkillEffects;
      const isWarp = stateRef.current.isWarping;

      const cx = width * 0.42; // Tower cruising in mid-left, looking ahead towards the right (+X)
      const cy = height * 0.5;

      // 1. BACKGROUND COSMOS & DRIFTING NEBULA
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Move Nebulas slowly leftwards
      nebulas.forEach((neb) => {
        neb.x -= 8 * dt;
        if (neb.x < -neb.r) neb.x = width + neb.r;
        const grad = ctx.createRadialGradient(neb.x, neb.y, 10, neb.x, neb.y, neb.r);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(neb.x, neb.y, neb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Cruising Stars: move from right to left
      stars.forEach((s) => {
        const starSpeed = isWarp ? s.speed * 12 : s.speed * (curOverclock ? 1.8 : 1.0);
        s.x -= starSpeed * dt;
        if (s.x < -10) {
          s.x = width + 10;
          s.y = Math.random() * height;
        }

        if (isWarp) {
          // Hyperspace streak lines
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = s.s;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + 35, s.y);
          ctx.stroke();
        } else {
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.a;
          ctx.fillRect(s.x, s.y, s.s, s.s);
          ctx.globalAlpha = 1.0;
        }
      });

      // 2. SPAWN & UPDATE METEORS (moving slowly from right to left)
      if (meteors.length < 12 && Math.random() < 0.04) {
        spawnMeteor(true);
      }

      for (let m = meteors.length - 1; m >= 0; m--) {
        const meteor = meteors[m];
        meteor.x += meteor.vx * dt * (curOverclock ? 1.4 : 1.0);
        meteor.y += meteor.vy * dt;
        meteor.rotation += meteor.vRot * dt;

        // Despawn if passed behind the tower offscreen
        if (meteor.x < -60) {
          meteors.splice(m, 1);
          continue;
        }

        // Draw Meteor / Space Debris
        ctx.save();
        ctx.translate(meteor.x, meteor.y);
        ctx.rotate(meteor.rotation);

        if (meteor.type === 'pirate') {
          // Small pirate drone skiff drifting
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(-10, -7, 20, 14);
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(12, 0);
          ctx.lineTo(-9, -8);
          ctx.lineTo(-9, 8);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-2, -3, 5, 6);
          // Thruster
          ctx.fillStyle = '#f97316';
          ctx.fillRect(-12, -3, 3, 6);
        } else {
          // Faceted space mineral
          ctx.fillStyle = meteor.color;
          ctx.beginPath();
          const sides = meteor.type === 'crystal' ? 5 : 6;
          for (let s = 0; s < sides; s++) {
            const sang = (s * Math.PI * 2) / sides;
            const r = meteor.size * (0.8 + ((s * 2) % 3) * 0.15);
            const px = Math.cos(sang) * r;
            const py = Math.sin(sang) * r;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.45)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Shiny mineral specular spot
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(-2, -2, 4, 4);
        }

        ctx.restore();

        // Check if destroyed
        if (meteor.hp <= 0) {
          sound.playExplosion(0.08);

          // Grant Idle resources
          setResources((prev) => {
            const mult = curOverclock ? 2.0 : 1.0;
            let addMatter = Math.round((meteor.type === 'iron' ? 22 : 8) * mult);
            let addEnergy = Math.round((meteor.type === 'crystal' ? 12 : 2) * mult);
            let addTech = meteor.type === 'gold' || meteor.type === 'pirate' ? 2 : 0;
            let addDim = meteor.type === 'dark_matter' ? 1 : 0;
            let addData = meteor.type === 'pirate' ? 3 : 0;

            return {
              ...prev,
              commonMatter: prev.commonMatter + addMatter,
              dimensionalEnergy: Math.min(prev.maxDimensionalEnergy, prev.dimensionalEnergy + addEnergy),
              techComponents: prev.techComponents + addTech,
              dimensionalMaterials: prev.dimensionalMaterials + addDim,
              combatData: prev.combatData + addData,
            };
          });

          // Shattered mineral particles flying towards tower intake
          for (let p = 0; p < 8; p++) {
            particles.push({
              x: meteor.x,
              y: meteor.y,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() - 0.5) * 60,
              color: meteor.color,
              life: 0,
              maxLife: 0.6,
            });
          }

          meteors.splice(m, 1);
        }
      }

      // 3. TOWER SHOTS: NO QUADRADINHOS! ONLY PROJECTILES DIRECTLY FROM TOWER
      // Fire rate is based on overclock and upgrades
      const fireInterval = curOverclock ? 0.35 : 0.65;
      const nowSec = time / 1000;

      if (nowSec - lastShotTime >= fireInterval && meteors.length > 0) {
        lastShotTime = nowSec;

        // Target closest meteors in front of the tower
        const targetable = [...meteors]
          .filter((m) => m.x > cx - 20)
          .sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));

        const shotsToFire = Math.min(curAttackCount, targetable.length > 0 ? curAttackCount : 1);

        for (let s = 0; s < shotsToFire; s++) {
          const target = targetable[s % targetable.length];
          if (!target) continue;

          // Turret barrel origin on the tower hull
          const turretSpreadY = (s - (shotsToFire - 1) / 2) * 10;
          const originX = cx + 24;
          const originY = cy + turretSpreadY;

          projectiles.push({
            x: originX,
            y: originY,
            targetX: target.x,
            targetY: target.y,
            speed: 550,
            color: curOverclock ? '#f59e0b' : '#38bdf8',
            size: curOverclock ? 4 : 3,
            damage: curOverclock ? 35 : 24,
            targetMeteorId: target.id,
          });

          sound.playLaser(1100 + s * 80, 0.05);
        }
      }

      // 4. UPDATE & DRAW TOWER PROJECTILES
      for (let p = projectiles.length - 1; p >= 0; p--) {
        const proj = projectiles[p];
        const target = meteors.find((m) => m.id === proj.targetMeteorId);

        // Update target position if still alive
        if (target) {
          proj.targetX = target.x;
          proj.targetY = target.y;
        }

        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 18 || !target) {
          // Hit meteor!
          if (target) {
            target.hp -= proj.damage;
            sound.playHit(0.06);

            // Impact spark
            for (let k = 0; k < 4; k++) {
              particles.push({
                x: proj.x,
                y: proj.y,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                color: proj.color,
                life: 0,
                maxLife: 0.3,
              });
            }
          }
          projectiles.splice(p, 1);
        } else {
          // Fly forward towards target
          const moveDist = proj.speed * dt;
          proj.x += (dx / dist) * moveDist;
          proj.y += (dy / dist) * moveDist;

          // Draw high-speed projectile bolt with glowing streak
          ctx.save();
          ctx.strokeStyle = proj.color;
          ctx.lineWidth = proj.size;
          ctx.beginPath();
          ctx.moveTo(proj.x - (dx / dist) * 12, proj.y - (dy / dist) * 12);
          ctx.lineTo(proj.x, proj.y);
          ctx.stroke();

          // White inner energy core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, proj.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 5. DRAW DRAWING PARTICLES FLYING INTO THE TOWER'S INTAKE
      for (let pt = particles.length - 1; pt >= 0; pt--) {
        const p = particles[pt];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(pt, 1);
        } else {
          // Attract magnetically towards tower center
          const pAngle = Math.atan2(cy - p.y, cx - p.x);
          p.x += Math.cos(pAngle) * 80 * dt + p.vx * dt;
          p.y += Math.sin(pAngle) * 80 * dt + p.vy * dt;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        }
      }

      // 6. DRAW THE DIMENSIONAL TOWER (Identical pixel art to High Mode - NO SPINNING RING)
      ctx.save();
      ctx.translate(cx, cy);

      // (A) Forcefield Shield Dome if shields are installed
      const shieldsInstalled = curBaseSectors.shields.installed;
      if (shieldsInstalled) {
        const shieldPulse = Math.sin(time * 0.003) * 1.5;
        ctx.strokeStyle = curOverclock ? 'rgba(245, 158, 11, 0.45)' : 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, 56 + shieldPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = curOverclock ? 'rgba(245, 158, 11, 0.06)' : 'rgba(6, 182, 212, 0.06)';
        ctx.fill();
      }

      // (B) Stationary Sector Pods around the Tower (Attached directly to the hull)
      const installedPods = [
        { id: 'reactor', angle: Math.PI, color: '#f59e0b', installed: curBaseSectors.reactor.installed },
        { id: 'arsenal', angle: -Math.PI / 2, color: '#ef4444', installed: curBaseSectors.equipment.installed || true },
        { id: 'shields', angle: Math.PI / 2, color: '#06b6d4', installed: shieldsInstalled },
        { id: 'inventory', angle: 0, color: '#10b981', installed: curBaseSectors.inventory.installed },
      ];

      installedPods.forEach((pod) => {
        if (!pod.installed) return;
        const px = Math.cos(pod.angle) * 36;
        const py = Math.sin(pod.angle) * 36;

        // Pod structure
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 7, py - 7, 14, 14);
        ctx.strokeStyle = pod.color;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(px - 7, py - 7, 14, 14);
        ctx.fillStyle = pod.color;
        ctx.fillRect(px - 2.5, py - 2.5, 5, 5);

        // Connection strut to central tower
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(pod.angle) * 24, Math.sin(pod.angle) * 24);
        ctx.lineTo(px, py);
        ctx.stroke();
      });

      // (C) Hexagonal Fortress Base Hull (Matching Pixel Art High Mode)
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const hAngle = (i * Math.PI) / 3;
        const hx = Math.cos(hAngle) * 28;
        const hy = Math.sin(hAngle) * 28;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = curOverclock ? '#f59e0b' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rotating Holographic Quantum Containment Rings
      const ringAngle1 = time * 0.002;
      const ringAngle2 = -time * 0.003;
      ctx.strokeStyle = curOverclock ? 'rgba(251, 191, 36, 0.7)' : 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 19, 9, ringAngle1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.65)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 19, 9, ringAngle2, 0, Math.PI * 2);
      ctx.stroke();

      // (D) Forward Automated Heavy Cannons on the front of the Tower
      // Scales with towerAttackCount (1 shot = 1 center cannon, 2 = twin cannons, 3 = triple, 4 = quad)
      const cannonBarrels = curAttackCount;
      for (let c = 0; c < cannonBarrels; c++) {
        const barrelY = (c - (cannonBarrels - 1) / 2) * 9;
        ctx.fillStyle = '#334155';
        ctx.fillRect(20, barrelY - 3, 14, 6);
        ctx.fillStyle = curOverclock ? '#f59e0b' : '#38bdf8';
        ctx.fillRect(32, barrelY - 2, 4, 4);
      }

      // (E) Glowing Core Reactor in the Center (Pulsing Taquion Energy)
      const corePulse = Math.sin(time * 0.006) * 3;
      const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16 + corePulse);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, curOverclock ? '#fbbf24' : '#38bdf8');
      coreGrad.addColorStop(0.7, curOverclock ? '#ea580c' : '#7c3aed');
      coreGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 16 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      // (F) Autonomous EMP / Shield Visual Shockwaves if active
      if (curSkillEffects?.emp_blast && curSkillEffects.emp_blast > Date.now()) {
        const empProgress = 1 - (curSkillEffects.emp_blast - Date.now()) / 4000;
        ctx.strokeStyle = `rgba(56, 189, 248, ${1 - empProgress})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, empProgress * 220, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [setResources]);

  return (
    <div className="relative w-full h-full min-h-[360px] md:min-h-[460px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Floating HUD Badges inside Canvas */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <div className="px-2.5 py-1 rounded bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono text-slate-300 flex items-center gap-2 shadow">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>VELOCIDADE DE CRUZEIRO: <strong className="text-cyan-400">120 km/s</strong></span>
        </div>

        <div className="px-2.5 py-1 rounded bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow">
          <span>CANHÕES ATIVOS: <strong className="text-amber-400">{towerAttackCount}x</strong></span>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-500 pointer-events-none bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/60">
        Navegação Cósmica Contínua · Disparos & Mineração Automatizados
      </div>
    </div>
  );
};
