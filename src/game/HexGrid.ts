/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// Hexagon size reduced by 50% (from 1.35 to 0.68) to double density without increasing overall distance
export const HEX_RADIUS = 0.68; // Distance from center to vertex
export const HEX_HEIGHT = 0.12;

export interface HexCoord {
  q: number;
  r: number;
}

export function axialToCube(hex: HexCoord): { x: number; y: number; z: number } {
  return {
    x: hex.q,
    z: hex.r,
    y: -hex.q - hex.r,
  };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return (Math.abs(ac.x - bc.x) + Math.abs(ac.y - bc.y) + Math.abs(ac.z - bc.z)) / 2;
}

// Return all hexes within AoE hex distance of a center coordinate
export function getHexesInAoE(center: HexCoord, radius: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
}

// Convert axial (q, r) to 3D world coordinates (X, Y=0, Z)
export function hexToWorld(q: number, r: number, radius = HEX_RADIUS): THREE.Vector3 {
  const x = radius * Math.sqrt(3) * (q + r / 2);
  const z = radius * (3 / 2) * r;
  return new THREE.Vector3(x, 0, z);
}

// Generate spiral rings of hexagons from radius minRing to maxRing
export function getHexRing(radius: number): HexCoord[] {
  if (radius === 0) return [{ q: 0, r: 0 }];
  const results: HexCoord[] = [];
  const directions = [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: -1, r: 0 },
    { q: 0, r: -1 },
    { q: 1, r: -1 },
  ];

  let current = {
    q: directions[4].q * radius,
    r: directions[4].r * radius,
  };

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push({ ...current });
      current = {
        q: current.q + directions[i].q,
        r: current.r + directions[i].r,
      };
    }
  }

  return results;
}

// Playable grid: Rings 3 to 11 (Ring 0 is the Singularity Core, Rings 1-2 is the Citadel hull)
// Rings 3 to 11 provide 18 + 24 + 30 + 36 + 42 + 48 + 54 + 60 + 66 = 378 tactical hex cells!
export function getPlayableGrid(minRing = 3, maxRing = 11): HexCoord[] {
  const grid: HexCoord[] = [];
  for (let ring = minRing; ring <= maxRing; ring++) {
    grid.push(...getHexRing(ring));
  }
  return grid;
}

// Create procedural 3D Hexagon tile geometry
export function createHexGeometry(radius = HEX_RADIUS - 0.08, height = HEX_HEIGHT): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();

  const extrudeSettings = {
    depth: height,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.rotateX(Math.PI / 2); // Place horizontal on XZ plane
  return geom;
}
