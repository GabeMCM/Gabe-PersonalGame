/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CircuitNode, UniverseId } from '../types/game';

export interface CircuitConnection {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'horizontal' | 'vertical' | 'diagonal';
}

/**
 * Topologia de Circuitos:
 * - Coluna Central (x = 0): abriga os nós de NÍVEL 0 (em cima e embaixo de 0, em y in {-4, -2, 0, 2, 4}).
 *   Todos os nós de Nível 0 ficam disponíveis para compra desde o início, permitindo ao jogador escolher
 *   por onde começar sua build.
 * - Colunas Adjacentes:
 *   - x = ±1: NÍVEL 1 (de y = -4 a +4 contínuo)
 *   - x = ±2: NÍVEL 2 (de y = -4 a +4 contínuo)
 *   - x = ±3: NÍVEL 3 (em y in {-4, -2, 0, 2, 4})
 * - Conexões:
 *   - N com N (vertical na mesma coluna)
 *   - N com N+1 (horizontal e diagonal criando caminhos de build)
 */

interface UniverseThemeConfig {
  prefix: string;
  coreL0Name: string;
  l0Names: string[];
  l1Name: string;
  l2Name: string;
  l3Name: string;
}

const UNIVERSE_THEMES: Record<UniverseId, UniverseThemeConfig> = {
  univ_matter: {
    prefix: 'u1',
    coreL0Name: 'Núcleo Balístico Primordial',
    l0Names: [
      'Sifão de Vácuo Pesado',
      'Reator de Fusão Quântica',
      'Núcleo Balístico Primordial',
      'Matriz de Fogo Intercalado',
      'Artilharia Orbital Quádrupla',
    ],
    l1Name: 'Canhão Balístico',
    l2Name: 'Acelerador Eletromagnético',
    l3Name: 'Hiper-Canhão de Matéria',
  },
  univ_quantum: {
    prefix: 'u2',
    coreL0Name: 'Núcleo Térmico Quântico',
    l0Names: [
      'Coletor de Partículas Rápidas',
      'Barreira de Fase Estelar',
      'Núcleo Térmico Quântico',
      'Feixe de Plasma Contínuo',
      'Lança-Chamas de Antimatéria',
    ],
    l1Name: 'Feixe de Fótons',
    l2Name: 'Refração de Cristal',
    l3Name: 'Super-Laser Taquiônico',
  },
  univ_void: {
    prefix: 'u3',
    coreL0Name: 'Singularidade Gravitacional',
    l0Names: [
      'Vórtice Canibalizador',
      'Matriz Nanítica Abissal',
      'Singularidade Gravitacional',
      'Canhão de Matéria Escura',
      'Horizonte de Eventos Focado',
    ],
    l1Name: 'Ruptura Espacial',
    l2Name: 'Sifão Entrópico',
    l3Name: 'Aniquilador do Vazio',
  },
};

export function generateUniverseCircuitNodes(universeId: UniverseId): CircuitNode[] {
  const nodes: CircuitNode[] = [];
  const theme = UNIVERSE_THEMES[universeId];
  const p = theme.prefix;

  // 1. Nível 0: Coluna Central (x = 0)
  // Posições y in {-4, -2, 0, 2, 4} com espaço vazio entre eles (y in {-3, -1, 1, 3})
  // Todos os 0's iniciam disponíveis (reqIds vazio) para escolha livre de build
  const l0Ys = [-4, -2, 0, 2, 4];
  l0Ys.forEach((y, index) => {
    const isCore = y === 0;
    const id = `${p}_x0_y${y}`;

    let effectStat: CircuitNode['effect']['stat'] = 'towerDamage';
    let effectVal = 0.05;
    let desc = '+5% de Dano Base em todos os canhões.';
    let iconName = 'Cpu';

    if (y === 0) {
      effectStat = 'towerDamage';
      effectVal = 0.08;
      desc = 'Ponto de ignição central. Fornece +8% de Dano Global e alimenta as vias adjacentes.';
      iconName = 'Cpu';
    } else if (y === 2) {
      effectStat = 'towerShots';
      effectVal = 1;
      desc = '+1 Canhão Automático Simultâneo na torre.';
      iconName = 'Crosshair';
    } else if (y === 4) {
      effectStat = 'towerShots';
      effectVal = 1;
      desc = '+1 Canhão de Artilharia Independente.';
      iconName = 'Crosshair';
    } else if (y === -2) {
      effectStat = 'shieldCap';
      effectVal = 50;
      desc = '+50 HP de Escudo Máximo na torre.';
      iconName = 'Shield';
    } else if (y === -4) {
      effectStat = 'droneCount';
      effectVal = 1;
      desc = '+1 Drone Minerador Autônomo orbitando a base.';
      iconName = 'Layers';
    }

    nodes.push({
      id,
      universeId,
      tier: 0,
      gridX: 0,
      gridY: y,
      name: theme.l0Names[index] || `Nível 0 [0,${y}]`,
      description: desc,
      iconName,
      costMatter: 20, // Custo inicial acessível para o jogador escolher qualquer ponto de partida
      costTech: 0,
      costCombatData: 0,
      costDimMat: 0,
      unlocked: false, // Inicia disponível para compra, permitindo ao jogador escolher livremente onde iniciar
      reqIds: [], // Disponível diretamente para compra inicial
      effect: {
        stat: effectStat,
        value: effectVal,
      },
    });
  });

  // Helper de efeitos granulares (2% a 5%) para o Nível 1 (colunas x = 1 e x = -1)
  function getL1Effect(y: number, isEast: boolean) {
    const absY = Math.abs(y);
    if (isEast) {
      if (absY % 3 === 0) return { stat: 'towerDamage' as const, value: 0.03, desc: '+3% Dano dos Canhões', icon: 'Crosshair', costM: 25, costT: 1 };
      if (absY % 3 === 1) return { stat: 'fireRate' as const, value: 0.025, desc: '+2.5% Cadência de Fogo', icon: 'Zap', costM: 22, costT: 1 };
      return { stat: 'critChance' as const, value: 0.02, desc: '+2% Chance Crítica', icon: 'Sparkles', costM: 28, costT: 1 };
    } else {
      if (absY % 3 === 0) return { stat: 'shieldCap' as const, value: 20, desc: '+20 HP de Escudo', icon: 'Shield', costM: 24, costT: 1 };
      if (absY % 3 === 1) return { stat: 'miningSpeed' as const, value: 0.04, desc: '+4% Rendimento Mineral', icon: 'Layers', costM: 20, costT: 0 };
      return { stat: 'storageBonus' as const, value: 15, desc: '+15kg Capacidade de Estoque', icon: 'Box', costM: 22, costT: 1 };
    }
  }

  // Helper de efeitos granulares (3% a 6%) para o Nível 2 (colunas x = 2 e x = -2)
  function getL2Effect(y: number, isEast: boolean) {
    const absY = Math.abs(y);
    if (isEast) {
      if (absY % 3 === 0) return { stat: 'towerDamage' as const, value: 0.04, desc: '+4% Dano de Projétil', icon: 'Crosshair', costM: 55, costT: 3 };
      if (absY % 3 === 1) return { stat: 'fireRate' as const, value: 0.035, desc: '+3.5% Velocidade de Ataque', icon: 'Zap', costM: 50, costT: 2 };
      return { stat: 'critChance' as const, value: 0.03, desc: '+3% Chance Crítica Reforçada', icon: 'Sparkles', costM: 60, costT: 3 };
    } else {
      if (absY % 3 === 0) return { stat: 'shieldCap' as const, value: 35, desc: '+35 HP de Escudo Energético', icon: 'Shield', costM: 52, costT: 2 };
      if (absY % 3 === 1) return { stat: 'miningSpeed' as const, value: 0.05, desc: '+5% Extração de Minérios', icon: 'Layers', costM: 48, costT: 2 };
      return { stat: 'storageBonus' as const, value: 25, desc: '+25kg Capacidade do Armazém', icon: 'Box', costM: 50, costT: 2 };
    }
  }

  // 2. Nível 1: Colunas em x = 1 (Leste) e x = -1 (Oeste)
  // Sem gaps de y = -4 a +4 (9 nós por coluna)
  const allYs = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  [-1, 1].forEach((x) => {
    const isEast = x > 0;
    const sideName = isEast ? 'Leste' : 'Oeste';

    allYs.forEach((y) => {
      const id = `${p}_x${x}_y${y}`;
      const { stat, value, desc, icon, costM, costT } = getL1Effect(y, isEast);

      // Conexões com Nível 0 ao lado (horizontal e diagonal) ou com Nível 1 vizinho
      const reqIds: string[] = [];
      // Horizontal ou diagonal ao Nível 0
      l0Ys.forEach((l0Y) => {
        if (Math.abs(l0Y - y) <= 1) {
          reqIds.push(`${p}_x0_y${l0Y}`);
        }
      });
      // Vertical na coluna
      if (y > -4) reqIds.push(`${p}_x${x}_y${y - 1}`);
      if (y < 4) reqIds.push(`${p}_x${x}_y${y + 1}`);

      nodes.push({
        id,
        universeId,
        tier: 1,
        gridX: x,
        gridY: y,
        name: `${theme.l1Name} (${sideName}) [${y > 0 ? `+${y}` : y}]`,
        description: desc,
        iconName: icon,
        costMatter: costM,
        costTech: costT,
        costCombatData: 2,
        costDimMat: 0,
        unlocked: false,
        reqIds,
        effect: { stat, value },
      });
    });
  });

  // 3. Nível 2: Colunas em x = 2 (Leste) e x = -2 (Oeste)
  // Sem gaps de y = -4 a +4 (9 nós por coluna)
  [-2, 2].forEach((x) => {
    const isEast = x > 0;
    const sideName = isEast ? 'Leste' : 'Oeste';
    const parentX = isEast ? 1 : -1;

    allYs.forEach((y) => {
      const id = `${p}_x${x}_y${y}`;
      const { stat, value, desc, icon, costM, costT } = getL2Effect(y, isEast);

      // Conexões com Nível 1 ao lado (horizontal e diagonal)
      const reqIds = [`${p}_x${parentX}_y${y}`];
      if (y > -4) reqIds.push(`${p}_x${parentX}_y${y - 1}`);
      if (y < 4) reqIds.push(`${p}_x${parentX}_y${y + 1}`);

      nodes.push({
        id,
        universeId,
        tier: 2,
        gridX: x,
        gridY: y,
        name: `${theme.l2Name} (${sideName}) [${y > 0 ? `+${y}` : y}]`,
        description: desc,
        iconName: icon,
        costMatter: costM,
        costTech: costT,
        costCombatData: 6,
        costDimMat: 0,
        unlocked: false,
        reqIds,
        effect: { stat, value },
      });
    });
  });

  // 4. Nível 3: Colunas Periféricas em x = 3 (Leste) e x = -3 (Oeste)
  // Com espaçamento aberto em y in {-4, -2, 0, 2, 4} (5 nós por coluna)
  const l3Ys = [-4, -2, 0, 2, 4];
  [-3, 3].forEach((x) => {
    const isEast = x > 0;
    const sideName = isEast ? 'Leste' : 'Oeste';
    const parentX = isEast ? 2 : -2;

    l3Ys.forEach((y) => {
      const id = `${p}_x${x}_y${y}`;
      let stat: CircuitNode['effect']['stat'] = 'towerDamage';
      let value = 0.08;
      let desc = '+8% de Dano Supremo';
      let icon = 'Zap';

      if (isEast) {
        if (y === 0) {
          stat = 'towerDamage';
          value = 0.12;
          desc = '+12% de Dano de Canhões Hiper-Acelerados';
          icon = 'Crosshair';
        } else if (y === 2) {
          stat = 'critChance';
          value = 0.06;
          desc = '+6% Chance Crítica Fatal e +15% Dano Crítico';
          icon = 'Sparkles';
        } else if (y === 4) {
          stat = 'towerShots';
          value = 1;
          desc = '+1 Canhão de Artilharia Pesada em leque';
          icon = 'Crosshair';
        } else if (y === -2) {
          stat = 'fireRate';
          value = 0.08;
          desc = '+8% Cadência Total de Disparo da Base';
          icon = 'Zap';
        } else if (y === -4) {
          stat = 'vacuumRadius';
          value = 500;
          desc = 'Vórtice Hiper-Gravitacional (+500px alcance de sucção)';
          icon = 'Activity';
        }
      } else {
        if (y === 0) {
          stat = 'shieldCap';
          value = 80;
          desc = '+80 HP de Barreira de Força com auto-regeneração';
          icon = 'Shield';
        } else if (y === 2) {
          stat = 'storageBonus';
          value = 60;
          desc = '+60kg de Armazenamento de Alta Densidade';
          icon = 'Box';
        } else if (y === 4) {
          stat = 'miningSpeed';
          value = 0.12;
          desc = '+12% Rendimento Mineral em todas as fontes';
          icon = 'Layers';
        } else if (y === -2) {
          stat = 'droneCount';
          value = 1;
          desc = '+1 Drone Coletor Quântico Independente';
          icon = 'Cpu';
        } else if (y === -4) {
          stat = 'autoRepairRate';
          value = 5;
          desc = '+5 HP/s Auto-Reparo Contínuo da Fuselagem';
          icon = 'Shield';
        }
      }

      // Conexões com Nível 2 ao lado (horizontal e diagonal)
      const reqIds = [`${p}_x${parentX}_y${y}`];
      if (y > -4) reqIds.push(`${p}_x${parentX}_y${y - 1}`);
      if (y < 4) reqIds.push(`${p}_x${parentX}_y${y + 1}`);

      nodes.push({
        id,
        universeId,
        tier: 3,
        gridX: x,
        gridY: y,
        name: `${theme.l3Name} (${sideName}) [${y > 0 ? `+${y}` : y}]`,
        description: desc,
        iconName: icon,
        costMatter: 110,
        costTech: 5,
        costCombatData: 12,
        costDimMat: 1,
        unlocked: false,
        reqIds,
        effect: { stat, value },
      });
    });
  });

  // Mapear todas as conexões visuais bidirecionais (verticais N-N, horizontais e diagonais N-(N+1))
  const connections = getCircuitVisualConnections(nodes);
  const connMap = new Map<string, string[]>();
  connections.forEach((c) => {
    if (!connMap.has(c.fromId)) connMap.set(c.fromId, []);
    if (!connMap.has(c.toId)) connMap.set(c.toId, []);
    connMap.get(c.fromId)!.push(c.toId);
    connMap.get(c.toId)!.push(c.fromId);
  });

  nodes.forEach((n) => {
    n.connectedNodeIds = connMap.get(n.id) || [];
    if (n.tier === 0) {
      n.unlocked = false;
      n.reqIds = []; // Todos os nós de Nível 0 começam livres e disponíveis para compra
    } else {
      // Requisitos satisfeitos se qualquer nó adjacente conectado estiver ativado
      n.reqIds = n.connectedNodeIds;
    }
  });

  return nodes;
}

/**
 * Conexões visuais do circuito:
 * 1. Vertical entre N e N na mesma coluna
 * 2. Horizontal e Diagonal entre N e N+1 criando caminhos de build
 */
export function getCircuitVisualConnections(nodes: CircuitNode[]): CircuitConnection[] {
  const connections: CircuitConnection[] = [];
  const nodeMap = new Map<string, CircuitNode>();
  nodes.forEach((n) => nodeMap.set(`${n.gridX},${n.gridY}`, n));

  const seen = new Set<string>();

  function addEdge(fromNode: CircuitNode, toNode: CircuitNode, type: 'horizontal' | 'vertical' | 'diagonal') {
    const key = fromNode.id < toNode.id ? `${fromNode.id}->${toNode.id}` : `${toNode.id}->${fromNode.id}`;
    if (seen.has(key)) return;
    seen.add(key);

    connections.push({
      fromId: fromNode.id,
      toId: toNode.id,
      fromX: fromNode.gridX,
      fromY: fromNode.gridY,
      toX: toNode.gridX,
      toY: toNode.gridY,
      type,
    });
  }

  // 1. Conexões Verticais (N com N na mesma coluna):
  // (A) Coluna x = 0 (Nível 0): vertical entre os 0's
  const l0Ys = [-4, -2, 0, 2, 4];
  for (let i = 0; i < l0Ys.length - 1; i++) {
    const n1 = nodeMap.get(`0,${l0Ys[i]}`);
    const n2 = nodeMap.get(`0,${l0Ys[i + 1]}`);
    if (n1 && n2) addEdge(n1, n2, 'vertical');
  }

  // (B) Colunas x = 1 e x = -1 (Nível 1): vertical contínuo de y = -4 a +4
  [-1, 1].forEach((x) => {
    for (let y = -4; y < 4; y++) {
      const n1 = nodeMap.get(`${x},${y}`);
      const n2 = nodeMap.get(`${x},${y + 1}`);
      if (n1 && n2) addEdge(n1, n2, 'vertical');
    }
  });

  // (C) Colunas x = 2 e x = -2 (Nível 2): vertical contínuo de y = -4 a +4
  [-2, 2].forEach((x) => {
    for (let y = -4; y < 4; y++) {
      const n1 = nodeMap.get(`${x},${y}`);
      const n2 = nodeMap.get(`${x},${y + 1}`);
      if (n1 && n2) addEdge(n1, n2, 'vertical');
    }
  });

  // (D) Colunas x = 3 e x = -3 (Nível 3): vertical entre nós periféricos
  [-3, 3].forEach((x) => {
    for (let i = 0; i < l0Ys.length - 1; i++) {
      const n1 = nodeMap.get(`${x},${l0Ys[i]}`);
      const n2 = nodeMap.get(`${x},${l0Ys[i + 1]}`);
      if (n1 && n2) addEdge(n1, n2, 'vertical');
    }
  });

  // 2. Conexões Horizontais e Diagonais entre N e N+1:
  // Conecta cada nó N com o nó N+1 diretamente ao lado (horizontal) e diagonalmente (y-1 e y+1)
  nodes.forEach((node) => {
    // East branch (+1)
    if (node.gridX >= 0 && node.gridX < 3) {
      const nextX = node.gridX + 1;

      // Horizontal (mesmo y)
      const nHoriz = nodeMap.get(`${nextX},${node.gridY}`);
      if (nHoriz) addEdge(node, nHoriz, 'horizontal');

      // Diagonal Superior (y + 1)
      const nDiagUp = nodeMap.get(`${nextX},${node.gridY + 1}`);
      if (nDiagUp) addEdge(node, nDiagUp, 'diagonal');

      // Diagonal Inferior (y - 1)
      const nDiagDown = nodeMap.get(`${nextX},${node.gridY - 1}`);
      if (nDiagDown) addEdge(node, nDiagDown, 'diagonal');
    }

    // West branch (-1)
    if (node.gridX <= 0 && node.gridX > -3) {
      const nextX = node.gridX - 1;

      // Horizontal (mesmo y)
      const nHoriz = nodeMap.get(`${nextX},${node.gridY}`);
      if (nHoriz) addEdge(node, nHoriz, 'horizontal');

      // Diagonal Superior (y + 1)
      const nDiagUp = nodeMap.get(`${nextX},${node.gridY + 1}`);
      if (nDiagUp) addEdge(node, nDiagUp, 'diagonal');

      // Diagonal Inferior (y - 1)
      const nDiagDown = nodeMap.get(`${nextX},${node.gridY - 1}`);
      if (nDiagDown) addEdge(node, nDiagDown, 'diagonal');
    }
  });

  return connections;
}
