/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import {
  X,
  Search,
  BookOpen,
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
  Factory,
  RefreshCw,
  Box,
  Wrench,
  Shield,
  Crosshair,
  Flame,
  Radio,
  Target,
  ExternalLink,
  ChevronRight,
  Check,
} from 'lucide-react';
import { GAME_MATERIALS, GAME_RECIPES, ConfigMaterial, ConfigRecipe } from '../config';
import { useGame, DEFAULT_MODULE_DEFS } from '../context/GameContext';
import { sound } from '../utils/audio';
import { getMaterialCode, getMaterialDisplayName } from '../utils/materials';
import { MaterialIconBadge } from './MaterialIconBadge';
import { getModuleSpriteDataUrl } from '../game/PixelSprites';
import { ModuleType } from '../types/game';

export type CodexTab = 'materials' | 'recipes' | 'fleets' | 'sectors' | 'enemies';

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMaterialId?: string;
  initialTab?: CodexTab;
  initialSearch?: string;
  onNavigateToFabricator?: (recipeId?: string) => void;
}

type MaterialFilter = 'all' | 'component' | 'scrap' | 'ore' | 'metal' | 'gas' | 'chemical';

// Normalize strings for resilient searching (removes accents, lowercase)
function normalizeText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Error Boundary for modal resilience
interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CodexErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CodexModal error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-300 space-y-4">
          <div className="p-3 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Instabilidade no Codex Tecnológico</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {this.state.error?.message || 'Ocorreu um erro ao renderizar o banco de dados do Codex.'}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recarregar Dados
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Incursões & Ameaças Dimensionais
interface EnemyDossier {
  id: string;
  code: string;
  name: string;
  role: string;
  threatLevel: 'Baixo' | 'Médio' | 'Alto' | 'Extremo';
  hp: number;
  speed: string;
  description: string;
  tacticalTip: string;
  spoils: string[];
}

const ENEMY_DOSSIERS: EnemyDossier[] = [
  {
    id: 'scout',
    code: 'IN-101',
    name: 'Batedor Alfa (Invasor Rápido)',
    role: 'Vanguarda · Enxame Veloz',
    threatLevel: 'Baixo',
    hp: 45,
    speed: 'Ultra Rápida (180 km/s)',
    description: 'Nave de reconhecimento leve armada com canhões de pulso balístico direto. Avança em grupos de 3 a 5 unidades buscando flanquear os módulos mais externos.',
    tacticalTip: 'Vulnerável a Canhões de Pulso [MK-3001] e Torres Tesla [MK-3006] que eliminam alvos rápidos em cadeia.',
    spoils: ['[PD-1001] Sucata Estrutural', '[PD-1002] Sucata Eletrônica', 'Nano-Matéria (3 NM)'],
  },
  {
    id: 'destroyer',
    code: 'IN-202',
    name: 'Fragmentador Ômega (Destruidor)',
    role: 'Artilharia Pesada · Perfurador de Casco',
    threatLevel: 'Médio',
    hp: 140,
    speed: 'Média (110 km/s)',
    description: 'Nave de suporte bélico com blindagem reforçada. Dispara projéteis de fragmentação pesada que causam dano alto se atingirem diretamente os hexágonos ocupados.',
    tacticalTip: 'Use o Bastião Blindado Railgun [MK-3007] ou Cruzeiro de Feixe [MK-3002] para furar a carcaça blindada à distância.',
    spoils: ['[PD-2001] Ferro Recuperado', '[PD-2011] Lingote de Cobre', 'Micro-Circuitos (4 MC)'],
  },
  {
    id: 'cruiser',
    code: 'IN-303',
    name: 'Cruzador Fantasma Dimensional',
    role: 'Nave de Cerco · Raio de Plasma',
    threatLevel: 'Alto',
    hp: 320,
    speed: 'Moderada (90 km/s)',
    description: 'Cruzador de batalha alienígena envolto em campo de distorção de fase. Bombardeia com esferas concentradas de plasma térmico que derretem escudos e causam dano sustentado.',
    tacticalTip: 'Contra-ataque com Baterias de Plasma Radial [MK-3003] e Drones Naníticos [MK-3008] para sustentar a regeneração das naves vizinhas.',
    spoils: ['[PD-3011] Micro-Bobina', '[PD-3021] Placa Reforçada', 'Dados Táticos (2 DT)'],
  },
  {
    id: 'titan_swarm',
    code: 'IN-404',
    name: 'Titã Colosso & Enxame Abissal',
    role: 'Chefe de Onda · Nave-Mãe Devastadora',
    threatLevel: 'Extremo',
    hp: 850,
    speed: 'Lenta (60 km/s)',
    description: 'Leviatã colossal de fenda cósmica. Possui camadas quádruplas de blindagem biônica, dispara salvas de micro-mísseis teleguiados e emite pulsos de desaceleração nos módulos da torre.',
    tacticalTip: 'Requer posicionamento tático denso com sinergias de adjacência, suporte de cura de Drones [MK-3008] e desaceleração do Vórtice Magnético [MK-3004].',
    spoils: ['[PD-3032] Câmara Térmica', '[PD-3105] Chapa Durasteel', 'Matriz Dimensional (1 MD)', 'Nano-Matéria Alta (+120 NM)'],
  },
];

// Setores & Silos da Base
interface SectorDossier {
  id: string;
  code: string;
  name: string;
  category: 'Comando' | 'Produção' | 'Logística' | 'Bélico';
  description: string;
  statusText: string;
  functionalities: string[];
  keyMaterials: string[];
}

const SECTOR_DOSSIERS: SectorDossier[] = [
  {
    id: 'command',
    code: 'MK-1001',
    name: 'Cidadela Central & Painel de Comando',
    category: 'Comando',
    description: 'O núcleo operacional de toda a estação. Monitora a integridade do casco, a estabilidade dimensional e os silos primários de carga da expedição.',
    statusText: 'Núcleo Primário Ativo',
    functionalities: [
      'Visualização do estoque de carga consolidado (peso, litros e volume)',
      'Ejeção de excedentes ao vácuo para liberar espaço de estocagem',
      'Ativação do salto de dobra para Incursões Dimensionais no Modo Alto',
    ],
    keyMaterials: ['[PD-1001] Sucata Estrutural', '[PD-2001] Ferro Recuperado'],
  },
  {
    id: 'fabricator',
    code: 'MK-1002',
    name: 'Construtor Molecular & Hangar de Projetos',
    category: 'Produção',
    description: 'Central de manufatura avançada. Constrói módulos industriais, silos adicionais e ferramentas operacionais utilizando insumos do estoque.',
    statusText: 'Linha de Montagem Operacional',
    functionalities: [
      'Construção de Silos de Carga [MK-1005] para expandir permanentemente o armazém',
      'Montagem da Broca de Perfuração Asteroidal [MK-1004]',
      'Fabricação de drones de reparo [FR-1030] e pulsos EMP de contenção [FR-1050]',
    ],
    keyMaterials: ['[PD-2001] Ferro Recuperado', '[PD-3104] Chapa de Ferro', '[PD-3011] Micro-Bobina'],
  },
  {
    id: 'separator',
    code: 'MK-1003',
    name: 'Separador Magnético & Triagem de Destroços',
    category: 'Produção',
    description: 'Processa sucatas recuperadas no vácuo espacial através de peneiramento magnético e centrífuga, isolando minérios brutos e plásticos sintéticos.',
    statusText: 'Esteira de Triagem Automatizada',
    functionalities: [
      'Decomposição de Sucata Estrutural [PD-1001] e Sucata Eletrônica [PD-1002]',
      'Recuperação de Cobre Bruto [PD-1011] e Cristais de Quartzo [PD-1021]',
      'Alimentação direta dos silos de entrada do Forno Térmico',
    ],
    keyMaterials: ['[PD-1001] Sucata Estrutural', '[PD-1002] Sucata Eletrônica'],
  },
  {
    id: 'furnace',
    code: 'MK-2001',
    name: 'Forno Térmico de Indução & Fundição de Ligas',
    category: 'Produção',
    description: 'Câmara de alta temperatura capaz de fundir minérios asteroidais em barras metálicas puras e forjar ligas de Durasteel com alta resistência mecânica.',
    statusText: 'Cadinho de Fusão Térmica Ativo',
    functionalities: [
      'Redução de Minério de Ferro [PD-1010] em Lingotes de Ferro Puro [PD-2001]',
      'Refino de Cobre Puro [PD-2011] e Cristais de Silício Puro [PD-2021]',
      'Forjamento térmico de Chapas de Durasteel Hiper-Densas [PD-3105]',
    ],
    keyMaterials: ['[PD-1010] Minério de Ferro', '[PD-2001] Ferro Recuperado', '[PD-2021] Silício'],
  },
  {
    id: 'refinery',
    code: 'MK-2201',
    name: 'Refinaria Criogênica & Condensador Molecular',
    category: 'Produção',
    description: 'Destila e fraciona gases interestelares colhidos no vácuo a temperaturas criogênicas (-218°C), gerando propelentes e reagentes químicos ácidos.',
    statusText: 'Vácuo Criogênico Estabilizado',
    functionalities: [
      'Fracionamento de Misturas de Hidrogênio [PD-1101] e Oxigênio [PD-1102]',
      'Síntese de Ácido Sulfúrico Industrial [PD-2501] para placas de circuito',
      'Purificação de Metano e Amônia Criogênica',
    ],
    keyMaterials: ['[PD-1101] Hidrogênio Bruto', '[PD-1102] Oxigênio Puro', '[PD-2501] Reagentes'],
  },
  {
    id: 'silo',
    code: 'MK-1005',
    name: 'Silos de Carga Expandidos & Tanques Criogênicos',
    category: 'Logística',
    description: 'Bódulos estanques e reforçados que ampliam a capacidade máxima de peso (kg) e fluidos (L) da torre, evitando bloqueio por estoque cheio.',
    statusText: 'Pressurização Nominal',
    functionalities: [
      'Aumenta capacidade de carga física em +250 kg a +1.000 kg',
      'Compartimentos estanques para gases perigosos e ácidos',
      'Garante que os espólios do Modo Alto sejam integralmente descarregados no cofre',
    ],
    keyMaterials: ['[PD-3104] Chapa de Ferro', '[PD-3021] Placa Reforçada'],
  },
];

export const CodexModal: React.FC<CodexModalProps> = ({
  isOpen,
  onClose,
  initialMaterialId,
  initialTab = 'materials',
  initialSearch = '',
  onNavigateToFabricator,
}) => {
  const gameState = useGame();
  const inventoryItems = Array.isArray(gameState?.inventoryItems) ? gameState.inventoryItems : [];
  const defenseModuleDefs = gameState?.defenseModuleDefs || DEFAULT_MODULE_DEFS;
  const escalatedModules = Array.isArray(gameState?.escalatedModules) ? gameState.escalatedModules : [];

  const [activeTab, setActiveTab] = useState<CodexTab>(initialTab);
  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedFamily, setSelectedFamily] = useState<MaterialFilter>('all');

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(() => {
    return initialMaterialId || GAME_MATERIALS[0]?.id || 'part.thermal_chamber';
  });

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(() => {
    return GAME_RECIPES[0]?.id || '';
  });

  const [selectedFleetType, setSelectedFleetType] = useState<ModuleType>('pulse_cannon');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('command');
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>('scout');

  // Synchronize when initial props change
  useEffect(() => {
    if (initialMaterialId) {
      setSelectedMaterialId(initialMaterialId);
      setActiveTab('materials');
    }
  }, [initialMaterialId]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Normalized search query and digit-only query for ultra-smart code matching
  const searchNormalized = useMemo(() => normalizeText(search), [search]);
  const searchDigits = useMemo(() => (search || '').replace(/\D/g, ''), [search]);

  // =========================================================================
  // 1. FILTERED MATERIALS (Smart search & robust category classification)
  // =========================================================================
  const filteredMaterials = useMemo(() => {
    return (GAME_MATERIALS || []).filter((mat) => {
      if (!mat) return false;

      // Smart Search: matches code (PD-3032), bare digits (3032), name, ID, description, source, family
      let matchSearch = true;
      if (searchNormalized !== '') {
        const matCode = (mat.code || '').toLowerCase();
        const matCodeDigits = (mat.code || '').replace(/\D/g, '');
        const matName = normalizeText(mat.name || '');
        const matId = normalizeText(mat.id || '');
        const matDesc = normalizeText(mat.description || '');
        const matSource = normalizeText(mat.source || '');
        const matFamily = normalizeText(mat.family || '');

        const matchesCode = matCode.includes(searchNormalized);
        const matchesDigits = searchDigits.length >= 2 && matCodeDigits.includes(searchDigits);
        const matchesName = matName.includes(searchNormalized);
        const matchesId = matId.includes(searchNormalized);
        const matchesDesc = matDesc.includes(searchNormalized);
        const matchesSource = matSource.includes(searchNormalized);
        const matchesFamily = matFamily.includes(searchNormalized);

        matchSearch =
          matchesCode ||
          matchesDigits ||
          matchesName ||
          matchesId ||
          matchesDesc ||
          matchesSource ||
          matchesFamily;
      }

      // Robust Category Filter
      let matchFamily = true;
      if (selectedFamily !== 'all') {
        const code = mat.code || '';
        const stage = mat.stage || '';
        const family = mat.family || '';

        switch (selectedFamily) {
          case 'component':
            // Components, parts, micro-devices (PD-3xxx, stage: component, etc.)
            matchFamily =
              stage === 'component' ||
              code.startsWith('PD-3') ||
              ['plastic', 'electric', 'organic'].includes(family);
            break;
          case 'metal':
            // Pure metals, refined bars, alloys (PD-20xx, PD-21xx, family: metal)
            matchFamily =
              family === 'metal' ||
              code.startsWith('PD-20') ||
              code.startsWith('PD-21');
            break;
          case 'ore':
            // Raw mined planetary ores (PD-10xx, family: ore)
            matchFamily =
              family === 'ore' ||
              code.startsWith('PD-101') ||
              code.startsWith('PD-102');
            break;
          case 'gas':
            // Atmospheric & dimensional gases (PD-11xx, family: gas)
            matchFamily =
              family === 'gas' ||
              code.startsWith('PD-11') ||
              mat.physicalState === 'gas';
            break;
          case 'chemical':
            // Reagents, acids, synthetic solutions (PD-25xx, family: chemical)
            matchFamily =
              family === 'chemical' ||
              code.startsWith('PD-25');
            break;
          case 'scrap':
            // Space debris, broken wreckage (PD-1001, PD-1002, family: scrap)
            matchFamily =
              family === 'scrap' ||
              code.startsWith('PD-100');
            break;
        }
      }

      return matchSearch && matchFamily;
    });
  }, [searchNormalized, searchDigits, selectedFamily]);

  const selectedMaterial = useMemo(() => {
    if (!GAME_MATERIALS || GAME_MATERIALS.length === 0) return null;
    return (
      GAME_MATERIALS.find((m) => m.id === selectedMaterialId) ||
      filteredMaterials[0] ||
      GAME_MATERIALS[0] ||
      null
    );
  }, [selectedMaterialId, filteredMaterials]);

  const currentStock = useMemo(() => {
    if (!selectedMaterial) return 0;
    return inventoryItems.find((i) => i?.id === selectedMaterial.id)?.quantity || 0;
  }, [selectedMaterial, inventoryItems]);

  const recipesUsingMaterial = useMemo(() => {
    if (!selectedMaterial || !Array.isArray(GAME_RECIPES)) return [];
    return GAME_RECIPES.filter((r) =>
      r?.inputItems?.some((input) => input?.itemId === selectedMaterial.id)
    );
  }, [selectedMaterial]);

  const recipesProducingMaterial = useMemo(() => {
    if (!selectedMaterial || !Array.isArray(GAME_RECIPES)) return [];
    return GAME_RECIPES.filter((r) =>
      r?.outputItems?.some((output) => output?.itemId === selectedMaterial.id)
    );
  }, [selectedMaterial]);

  // =========================================================================
  // 2. FILTERED RECIPES (Smart search)
  // =========================================================================
  const filteredRecipes = useMemo(() => {
    return (GAME_RECIPES || []).filter((rec) => {
      if (!rec) return false;
      if (searchNormalized === '') return true;

      const recCode = (rec.code || '').toLowerCase();
      const recDigits = (rec.code || '').replace(/\D/g, '');
      const recName = normalizeText(rec.name || '');
      const recStation = normalizeText(rec.station || '');
      const recDesc = normalizeText(rec.description || '');

      const matchesCode = recCode.includes(searchNormalized);
      const matchesDigits = searchDigits.length >= 2 && recDigits.includes(searchDigits);
      const matchesName = recName.includes(searchNormalized);
      const matchesStation = recStation.includes(searchNormalized);
      const matchesDesc = recDesc.includes(searchNormalized);

      // Check if inputs or outputs match
      const matchesInputs = rec.inputItems?.some((inp) => {
        const mat = GAME_MATERIALS.find((m) => m.id === inp.itemId);
        return mat && (normalizeText(mat.name).includes(searchNormalized) || (mat.code || '').toLowerCase().includes(searchNormalized));
      });

      const matchesOutputs = rec.outputItems?.some((out) => {
        const mat = GAME_MATERIALS.find((m) => m.id === out.itemId);
        return mat && (normalizeText(mat.name).includes(searchNormalized) || (mat.code || '').toLowerCase().includes(searchNormalized));
      });

      return (
        matchesCode ||
        matchesDigits ||
        matchesName ||
        matchesStation ||
        matchesDesc ||
        matchesInputs ||
        matchesOutputs
      );
    });
  }, [searchNormalized, searchDigits]);

  const selectedRecipe = useMemo(() => {
    return (
      (GAME_RECIPES || []).find((r) => r.id === selectedRecipeId) ||
      filteredRecipes[0] ||
      GAME_RECIPES[0] ||
      null
    );
  }, [selectedRecipeId, filteredRecipes]);

  // =========================================================================
  // 3. FILTERED COMBAT FLEETS (All 8 defense modules)
  // =========================================================================
  const fleetList = useMemo(() => {
    return Object.values(defenseModuleDefs);
  }, [defenseModuleDefs]);

  const filteredFleets = useMemo(() => {
    return fleetList.filter((f) => {
      if (searchNormalized === '') return true;
      const fCode = (f.code || '').toLowerCase();
      const fDigits = (f.code || '').replace(/\D/g, '');
      const fName = normalizeText(f.name || '');
      const fRole = normalizeText(f.role || '');
      const fDesc = normalizeText(f.description || '');

      return (
        fCode.includes(searchNormalized) ||
        (searchDigits.length >= 2 && fDigits.includes(searchDigits)) ||
        fName.includes(searchNormalized) ||
        fRole.includes(searchNormalized) ||
        fDesc.includes(searchNormalized)
      );
    });
  }, [fleetList, searchNormalized, searchDigits]);

  const selectedFleet = useMemo(() => {
    return (
      fleetList.find((f) => f.type === selectedFleetType) ||
      filteredFleets[0] ||
      fleetList[0]
    );
  }, [fleetList, selectedFleetType, filteredFleets]);

  // =========================================================================
  // 4. FILTERED BASE SECTORS
  // =========================================================================
  const filteredSectors = useMemo(() => {
    return SECTOR_DOSSIERS.filter((s) => {
      if (searchNormalized === '') return true;
      const sCode = (s.code || '').toLowerCase();
      const sDigits = (s.code || '').replace(/\D/g, '');
      const sName = normalizeText(s.name || '');
      const sDesc = normalizeText(s.description || '');

      return (
        sCode.includes(searchNormalized) ||
        (searchDigits.length >= 2 && sDigits.includes(searchDigits)) ||
        sName.includes(searchNormalized) ||
        sDesc.includes(searchNormalized)
      );
    });
  }, [searchNormalized, searchDigits]);

  const selectedSector = useMemo(() => {
    return (
      SECTOR_DOSSIERS.find((s) => s.id === selectedSectorId) ||
      filteredSectors[0] ||
      SECTOR_DOSSIERS[0]
    );
  }, [selectedSectorId, filteredSectors]);

  // =========================================================================
  // 5. FILTERED ENEMIES
  // =========================================================================
  const filteredEnemies = useMemo(() => {
    return ENEMY_DOSSIERS.filter((e) => {
      if (searchNormalized === '') return true;
      const eCode = (e.code || '').toLowerCase();
      const eDigits = (e.code || '').replace(/\D/g, '');
      const eName = normalizeText(e.name || '');
      const eRole = normalizeText(e.role || '');
      const eDesc = normalizeText(e.description || '');

      return (
        eCode.includes(searchNormalized) ||
        (searchDigits.length >= 2 && eDigits.includes(searchDigits)) ||
        eName.includes(searchNormalized) ||
        eRole.includes(searchNormalized) ||
        eDesc.includes(searchNormalized)
      );
    });
  }, [searchNormalized, searchDigits]);

  const selectedEnemy = useMemo(() => {
    return (
      ENEMY_DOSSIERS.find((e) => e.id === selectedEnemyId) ||
      filteredEnemies[0] ||
      ENEMY_DOSSIERS[0]
    );
  }, [selectedEnemyId, filteredEnemies]);

  if (!isOpen) return null;

  const getRarityBadge = (rarity?: ConfigMaterial['rarity']) => {
    switch (rarity) {
      case 'common':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Comum
          </span>
        );
      case 'uncommon':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60">
            Incomum
          </span>
        );
      case 'rare':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            Raro
          </span>
        );
      case 'epic':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
            Épico / Exótico
          </span>
        );
      case 'legendary':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
            Multiversal
          </span>
        );
      default:
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Padrão
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-6xl h-[92vh] max-h-[860px] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* =====================================================================
            TOP HEADER: TITLE + OVERALL CODEX STATS + CLOSE
           ===================================================================== */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide font-mono">
                  CODEX TECNOLÓGICO & MANUAL UNIVERSAL
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  ENCICLOPÉDIA COMPLETA DA EXPEDIÇÃO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Consulte fórmulas de forja, onde encontrar cada insumo, naves bélicas, setores da base e espólios de inimigos.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
            title="Fechar Codex (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =====================================================================
            SEÇÃO DE ABAS PRINCIPAIS DO CODEX (5 SEÇÕES)
           ===================================================================== */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-950/70 overflow-x-auto shrink-0">
          {[
            {
              id: 'materials' as CodexTab,
              label: 'Materiais & Recursos [PD-xxxx]',
              count: filteredMaterials.length,
              icon: Box,
              color: 'text-cyan-400',
            },
            {
              id: 'recipes' as CodexTab,
              label: 'Receitas Industriais [RC-xxxx]',
              count: filteredRecipes.length,
              icon: Factory,
              color: 'text-amber-400',
            },
            {
              id: 'fleets' as CodexTab,
              label: 'Embarcações Bélicas [MK-3xxx]',
              count: filteredFleets.length,
              icon: Crosshair,
              color: 'text-emerald-400',
            },
            {
              id: 'sectors' as CodexTab,
              label: 'Setores & Silos [MK-1xxx / 2xxx]',
              count: filteredSectors.length,
              icon: Layers,
              color: 'text-indigo-400',
            },
            {
              id: 'enemies' as CodexTab,
              label: 'Incursões & Ameaças',
              count: filteredEnemies.length,
              icon: Target,
              color: 'text-rose-400',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  sound.playClick();
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xs border border-slate-700 ring-1 ring-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* =====================================================================
            BARRA DE BUSCA INTELIGENTE + FILTROS DE CATEGORIA
           ===================================================================== */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[240px] max-w-lg">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Digite código (ex: 3032, PD-3032, RC-1001), nome, peça ou origem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/90 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros de Família (apenas quando na aba de Materiais) */}
          {activeTab === 'materials' && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
              {[
                { id: 'all' as MaterialFilter, label: 'Todos' },
                { id: 'component' as MaterialFilter, label: 'Componentes [PD-3xxx]' },
                { id: 'metal' as MaterialFilter, label: 'Metais & Ligas [PD-2xxx]' },
                { id: 'ore' as MaterialFilter, label: 'Minérios [PD-10xx]' },
                { id: 'gas' as MaterialFilter, label: 'Gases [PD-11xx]' },
                { id: 'chemical' as MaterialFilter, label: 'Química [PD-25xx]' },
                { id: 'scrap' as MaterialFilter, label: 'Sucatas [PD-100x]' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFamily(f.id);
                    sound.playClick();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                    selectedFamily === f.id
                      ? 'bg-cyan-600 text-white font-bold shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* =====================================================================
            CORPO DO CODEX: RENDERIZA A ABA SELECIONADA
           ===================================================================== */}
        <CodexErrorBoundary onReset={() => setSelectedMaterialId('part.thermal_chamber')}>
          <div className="flex-1 flex overflow-hidden">
            {/* ---------------------------------------------------------------
                ABA 1: MATERIAIS & RECURSOS [PD-xxxx]
               --------------------------------------------------------------- */}
            {activeTab === 'materials' && (
              <>
                {/* Coluna Esquerda: Lista de Materiais */}
                <div className="w-72 sm:w-80 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/30">
                  {filteredMaterials.map((mat) => {
                    const isSelected = mat.id === selectedMaterial?.id;
                    const stock = inventoryItems.find((i) => i?.id === mat.id)?.quantity || 0;

                    return (
                      <button
                        key={mat.id}
                        onClick={() => {
                          sound.playClick();
                          setSelectedMaterialId(mat.id);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/60 border-l-4 border-cyan-400 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MaterialIconBadge iconName={mat.icon} color={mat.color} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs truncate flex items-center gap-1.5 font-mono">
                              <span className="text-cyan-400 font-bold">[{mat.code}]</span>
                              <span className="text-white truncate">{mat.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block capitalize">
                              {mat.stage || mat.family} · {mat.unit || 'un'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            stock > 0
                              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {stock} {mat.unit || 'un'}
                        </span>
                      </button>
                    );
                  })}

                  {filteredMaterials.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono">
                      Nenhum material encontrado com a busca "{search}".
                    </div>
                  )}
                </div>

                {/* Coluna Direita: Detalhes do Material Selecionado */}
                {selectedMaterial ? (
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-900/60">
                    {/* Header Card do Material */}
                    <div className="p-5 rounded-2xl border border-slate-700/80 bg-slate-900/80 flex flex-wrap items-start justify-between gap-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <MaterialIconBadge iconName={selectedMaterial.icon} color={selectedMaterial.color} size="lg" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap font-mono">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-700 text-cyan-300">
                              [{selectedMaterial.code}]
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-white font-sans">
                              {selectedMaterial.name || selectedMaterial.id}
                            </h3>
                            {getRarityBadge(selectedMaterial.rarity)}
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              ID: {selectedMaterial.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
                            {selectedMaterial.description || 'Nenhuma descrição técnica disponível.'}
                          </p>
                        </div>
                      </div>

                      {/* Status de Estoque em Alta Visibilidade */}
                      <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-right shrink-0 shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                          Estoque Disponível
                        </div>
                        <div className={`text-xl font-mono font-bold ${currentStock > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {currentStock}{' '}
                          <span className="text-xs font-normal text-slate-400">{selectedMaterial.unit || 'un'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          Massa: {selectedMaterial.unitWeight || 1} {selectedMaterial.physicalState === 'gas' ? 'L' : 'kg'}/un
                        </div>
                      </div>
                    </div>

                    {/* Origem Primária & Local de Obtenção */}
                    <div className="p-4 rounded-xl border border-sky-900/50 bg-sky-950/30 space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2 font-mono">
                        <Info className="w-4 h-4" />
                        Onde Encontrar & Origem Primária
                      </h4>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {selectedMaterial.source || 'Adquirido em coleta ou expedições táticas.'}
                      </p>
                    </div>

                    {/* Como Fabricar este Material */}
                    {recipesProducingMaterial.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
                          <Factory className="w-4 h-4 text-emerald-400" />
                          Como Fabricar este Material ({recipesProducingMaterial.length} processo(s))
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {recipesProducingMaterial.map((recipe) => (
                            <div
                              key={recipe.id}
                              className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/40 space-y-3"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                  <span className="text-xs font-bold text-white font-mono">[{recipe.code || 'RC-????'}] {recipe.name}</span>
                                  <span className="text-[11px] text-slate-400 ml-2 font-mono">
                                    (Máquina: {recipe.station})
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    onClose();
                                    if (onNavigateToFabricator) onNavigateToFabricator(recipe.id);
                                  }}
                                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition cursor-pointer font-mono shadow-xs"
                                >
                                  Ir para Fabricação
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Insumos necessários */}
                              {recipe.inputItems && recipe.inputItems.length > 0 && (
                                <div className="text-xs text-slate-400">
                                  <span className="font-semibold text-slate-300 font-mono">Insumos Exigidos: </span>
                                  <div className="flex flex-wrap gap-2 mt-1.5">
                                    {recipe.inputItems.map((inp) => {
                                      const inMat = GAME_MATERIALS.find((m) => m.id === inp.itemId);
                                      const inStock = inventoryItems.find((i) => i?.id === inp.itemId)?.quantity || 0;
                                      const hasEnough = inStock >= inp.quantity;
                                      return (
                                        <button
                                          key={inp.itemId}
                                          onClick={() => {
                                            setSelectedMaterialId(inp.itemId);
                                            sound.playClick();
                                          }}
                                          className={`px-2 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 border cursor-pointer hover:scale-102 transition ${
                                            hasEnough
                                              ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                                              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                                          }`}
                                          title="Clique para ver este ingrediente no Codex"
                                        >
                                          <span className="text-cyan-300 font-bold">[{getMaterialCode(inp.itemId)}]</span>
                                          <span>{inMat?.name || inp.itemId}:</span>
                                          <strong className={hasEnough ? 'text-emerald-400' : 'text-rose-400'}>
                                            {inStock}/{inp.quantity}
                                          </strong>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Em Quais Receitas este Material é Utilizado */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        Onde é Utilizado ({recipesUsingMaterial.length} projetos)
                      </h4>
                      {recipesUsingMaterial.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {recipesUsingMaterial.map((recipe) => (
                            <div
                              key={recipe.id}
                              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-white font-mono">{recipe.name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {recipe.station}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-2">
                                {recipe.description}
                              </p>
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-mono">
                                  Requer:{' '}
                                  <strong className="text-cyan-400">
                                    {recipe.inputItems?.find((i) => i.itemId === selectedMaterial.id)?.quantity || 1}{' '}
                                    {selectedMaterial.unit || 'un'}
                                  </strong>
                                </span>
                                <button
                                  onClick={() => {
                                    onClose();
                                    if (onNavigateToFabricator) onNavigateToFabricator(recipe.id);
                                  }}
                                  className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer font-mono"
                                >
                                  Abrir Projeto <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic p-4 bg-slate-950/20 rounded-xl border border-slate-800 font-mono">
                          Este material é um produto final de consumo ou utilizado para construção direta de embarcações na malha tática.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-mono">
                    Selecione um material no menu à esquerda.
                  </div>
                )}
              </>
            )}

            {/* ---------------------------------------------------------------
                ABA 2: RECEITAS INDUSTRIAIS [RC-xxxx]
               --------------------------------------------------------------- */}
            {activeTab === 'recipes' && (
              <>
                {/* Lista de Receitas */}
                <div className="w-72 sm:w-80 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/30">
                  {filteredRecipes.map((rec) => {
                    const isSelected = rec.id === selectedRecipe?.id;
                    return (
                      <button
                        key={rec.id}
                        onClick={() => {
                          setSelectedRecipeId(rec.id);
                          sound.playClick();
                        }}
                        className={`w-full px-4 py-3 text-left flex flex-col gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/60 border-l-4 border-amber-400 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-amber-400 font-bold">[{rec.code || 'RC-????'}]</span>
                          <span className="text-[10px] text-slate-400 capitalize">{rec.station}</span>
                        </div>
                        <span className="text-xs font-bold text-white truncate font-sans">{rec.name}</span>
                      </button>
                    );
                  })}

                  {filteredRecipes.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono">
                      Nenhuma receita encontrada para "{search}".
                    </div>
                  )}
                </div>

                {/* Detalhes da Receita Selecionada */}
                {selectedRecipe ? (
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-900/60">
                    <div className="p-5 rounded-2xl border border-slate-700/80 bg-slate-900/80 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-950/90 border border-amber-700 text-amber-300">
                            [{selectedRecipe.code || 'RC-????'}]
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white font-sans">{selectedRecipe.name}</h3>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                          Estação: {selectedRecipe.station}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedRecipe.description}</p>
                    </div>

                    {/* Pipeline: Insumos -> Processamento -> Produtos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Insumos */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono flex items-center gap-2">
                          <span>Entrada (Insumos Necessários)</span>
                        </h4>
                        <div className="space-y-2">
                          {selectedRecipe.inputItems?.map((inp) => {
                            const mat = GAME_MATERIALS.find((m) => m.id === inp.itemId);
                            const stock = inventoryItems.find((i) => i.id === inp.itemId)?.quantity || 0;
                            const hasEnough = stock >= inp.quantity;
                            return (
                              <div
                                key={inp.itemId}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono"
                              >
                                <span className="text-slate-300 font-medium">
                                  [{getMaterialCode(inp.itemId)}] {mat?.name || inp.itemId}
                                </span>
                                <span className={hasEnough ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                  {stock} / {inp.quantity} {mat?.unit || 'un'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Produtos */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-2">
                          <span>Saída (Produto Gerado)</span>
                        </h4>
                        <div className="space-y-2">
                          {selectedRecipe.outputItems?.map((out) => {
                            const mat = GAME_MATERIALS.find((m) => m.id === out.itemId);
                            return (
                              <div
                                key={out.itemId}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono"
                              >
                                <span className="text-white font-bold">
                                  [{getMaterialCode(out.itemId)}] {mat?.name || out.itemId}
                                </span>
                                <span className="text-emerald-400 font-bold">
                                  +{out.quantity} {mat?.unit || 'un'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {/* ---------------------------------------------------------------
                ABA 3: EMBARCAÇÕES BÉLICAS [MK-3xxx] (Os 8 Módulos de Combate)
               --------------------------------------------------------------- */}
            {activeTab === 'fleets' && (
              <>
                {/* Lista de Frotas */}
                <div className="w-72 sm:w-80 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/30">
                  {filteredFleets.map((fleet) => {
                    const isSelected = fleet.type === selectedFleet?.type;
                    const isEscalated = escalatedModules.includes(fleet.type);

                    return (
                      <button
                        key={fleet.type}
                        onClick={() => {
                          setSelectedFleetType(fleet.type);
                          sound.playClick();
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/60 border-l-4 border-emerald-400 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={getModuleSpriteDataUrl(fleet.type)}
                            alt={fleet.name}
                            className="w-7 h-7 object-contain drop-shadow shrink-0"
                            style={{ imageRendering: 'pixelated' }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs truncate flex items-center gap-1.5 font-mono">
                              <span className="text-emerald-400 font-bold">[{fleet.code}]</span>
                              <span className="text-white truncate">{fleet.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">
                              {fleet.role}
                            </span>
                          </div>
                        </div>

                        {isEscalated ? (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-700 shrink-0">
                            ESQUADRÃO
                          </span>
                        ) : fleet.unlocked ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                            PRONTO
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-900 shrink-0">
                            BLOQUEADO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Detalhes da Embarcação Selecionada */}
                {selectedFleet ? (
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-900/60">
                    <div className="p-5 rounded-2xl border border-slate-700/80 bg-slate-900/80 flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2 shadow-inner">
                          <img
                            src={getModuleSpriteDataUrl(selectedFleet.type)}
                            alt={selectedFleet.name}
                            className="w-12 h-12 object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap font-mono">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-700 text-emerald-300">
                              [{selectedFleet.code}]
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-white font-sans">{selectedFleet.name}</h3>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {selectedFleet.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
                            {selectedFleet.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono block">Custo Hexagonal (Modo Alto)</span>
                        <span className="text-base font-mono font-bold text-amber-400">
                          {selectedFleet.tacticalCost?.nanoMatter || selectedFleet.baseCost} NM (Nano-Matéria)
                        </span>
                      </div>
                    </div>

                    {/* Especificações de Combate */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-center">
                        <span className="text-[10px] text-slate-500 block">Blindagem / Vida</span>
                        <strong className="text-emerald-400 text-sm font-bold">{selectedFleet.baseHp} HP</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-center">
                        <span className="text-[10px] text-slate-500 block">Dano por Tiro</span>
                        <strong className="text-amber-400 text-sm font-bold">{selectedFleet.baseDamage} DMG</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-center">
                        <span className="text-[10px] text-slate-500 block">Cadência de Fogo</span>
                        <strong className="text-cyan-400 text-sm font-bold">{selectedFleet.baseFireRate} tiros/s</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-center">
                        <span className="text-[10px] text-slate-500 block">Alcance Balístico</span>
                        <strong className="text-purple-400 text-sm font-bold">{selectedFleet.baseRange} hex</strong>
                      </div>
                    </div>

                    {/* Habilidade Tática & Raio Hexagonal */}
                    <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-2">
                        <Crosshair className="w-4 h-4" />
                        Especialidade Tática & Efeito de Área (AoE: {selectedFleet.aoeHexRadius || 1} Hexágonos)
                      </h4>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {selectedFleet.tacticalSpecialty || 'Armamento balístico padrão para combate espacial.'}
                      </p>
                    </div>

                    {/* Materiais Físicos para Fabricar no Modo Baixo */}
                    {selectedFleet.craftCostItems && selectedFleet.craftCostItems.length > 0 && (
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                          Insumos Físicos de Fabricação no Construtor [MK-1002]
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedFleet.craftCostItems.map((req) => {
                            const inv = inventoryItems.find((i) => i.id === req.itemId);
                            const current = inv?.quantity || 0;
                            const hasEnough = current >= req.quantity;
                            const code = getMaterialCode(req.itemId);
                            return (
                              <button
                                key={req.itemId}
                                onClick={() => {
                                  setSelectedMaterialId(req.itemId);
                                  setActiveTab('materials');
                                  sound.playClick();
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border flex items-center gap-2 cursor-pointer hover:scale-102 transition ${
                                  hasEnough
                                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                                    : 'bg-rose-950/50 border-rose-900/60 text-rose-300'
                                }`}
                                title="Ver material no Codex"
                              >
                                <span className="text-cyan-400 font-bold">[{code}]</span>
                                <span>{inv?.name || getMaterialDisplayName(req.itemId)}:</span>
                                <strong className={hasEnough ? 'text-emerald-400' : 'text-rose-400'}>
                                  {current}/{req.quantity}
                                </strong>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}

            {/* ---------------------------------------------------------------
                ABA 4: SETORES & SILOS DA BASE [MK-1xxx / MK-2xxx]
               --------------------------------------------------------------- */}
            {activeTab === 'sectors' && (
              <>
                <div className="w-72 sm:w-80 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/30">
                  {filteredSectors.map((sector) => {
                    const isSelected = sector.id === selectedSector?.id;
                    return (
                      <button
                        key={sector.id}
                        onClick={() => {
                          setSelectedSectorId(sector.id);
                          sound.playClick();
                        }}
                        className={`w-full px-4 py-3 text-left flex flex-col gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/60 border-l-4 border-indigo-400 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-indigo-400 font-bold">[{sector.code}]</span>
                          <span className="text-[10px] text-slate-400">{sector.category}</span>
                        </div>
                        <span className="text-xs font-bold text-white truncate font-sans">{sector.name}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedSector ? (
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-900/60">
                    <div className="p-5 rounded-2xl border border-slate-700/80 bg-slate-900/80 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-950/90 border border-indigo-700 text-indigo-300">
                            [{selectedSector.code}]
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white font-sans">{selectedSector.name}</h3>
                        </div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {selectedSector.statusText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedSector.description}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                        Funcionalidades Principais do Setor
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {selectedSector.functionalities.map((func, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>{func}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Materiais Primordiais Manipulados
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSector.keyMaterials.map((matStr, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
                          >
                            {matStr}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {/* ---------------------------------------------------------------
                ABA 5: INCURSÕES & AMEAÇAS (Inimigos do Modo Alto)
               --------------------------------------------------------------- */}
            {activeTab === 'enemies' && (
              <>
                <div className="w-72 sm:w-80 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/30">
                  {filteredEnemies.map((enemy) => {
                    const isSelected = enemy.id === selectedEnemy?.id;
                    return (
                      <button
                        key={enemy.id}
                        onClick={() => {
                          setSelectedEnemyId(enemy.id);
                          sound.playClick();
                        }}
                        className={`w-full px-4 py-3 text-left flex flex-col gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950/60 border-l-4 border-rose-400 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-rose-400 font-bold">[{enemy.code}]</span>
                          <span className="text-[10px] text-slate-400">{enemy.threatLevel}</span>
                        </div>
                        <span className="text-xs font-bold text-white truncate font-sans">{enemy.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate">{enemy.role}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedEnemy ? (
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-900/60">
                    <div className="p-5 rounded-2xl border border-slate-700/80 bg-slate-900/80 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-950/90 border border-rose-700 text-rose-300">
                            [{selectedEnemy.code}]
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white font-sans">{selectedEnemy.name}</h3>
                        </div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-bold">
                          Ameaça: {selectedEnemy.threatLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedEnemy.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono">
                        <span className="text-[10px] text-slate-500 block">Vida / Blindagem</span>
                        <strong className="text-rose-400 text-sm">{selectedEnemy.hp} HP</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono">
                        <span className="text-[10px] text-slate-500 block">Velocidade de Deslocamento</span>
                        <strong className="text-cyan-400 text-sm">{selectedEnemy.speed}</strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Tática de Combate Recomendada
                      </h4>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">{selectedEnemy.tacticalTip}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                        Espólios Coletáveis ao Destruir
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEnemy.spoils.map((spoil, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300"
                          >
                            {spoil}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </CodexErrorBoundary>
      </div>
    </div>
  );
};
