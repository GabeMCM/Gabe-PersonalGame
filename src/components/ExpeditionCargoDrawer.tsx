/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { getMaterialById } from '../config';
import { sound } from '../utils/audio';
import {
  Package,
  X,
  Coins,
  Cpu,
  Layers,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Flame,
  Wind,
} from 'lucide-react';

interface ExpeditionCargoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpeditionCargoDrawer: React.FC<ExpeditionCargoDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { volatileCargo, protectedCargo, currentWave } = useGame();

  if (!isOpen) return null;

  const rawItems = Object.entries(volatileCargo.items || {}).filter(
    ([, qty]) => (qty as number) > 0
  );

  const totalVolatileCount =
    rawItems.reduce((acc, [, qty]) => acc + (qty as number), 0) +
    (volatileCargo.matter > 0 ? 1 : 0) +
    (volatileCargo.techComponents > 0 ? 1 : 0) +
    (volatileCargo.combatData > 0 ? 1 : 0) +
    (volatileCargo.dimensionalMaterials > 0 ? 1 : 0);

  // Categorize acquired materials
  const minerals: { id: string; name: string; code: string; qty: number; unit: string }[] = [];
  const gases: { id: string; name: string; code: string; qty: number; unit: string }[] = [];
  const techPieces: { id: string; name: string; code: string; qty: number; unit: string }[] = [];

  rawItems.forEach(([itemId, qty]) => {
    const mat = getMaterialById(itemId);
    const itemData = {
      id: itemId,
      name: mat?.name || itemId,
      code: mat?.code || 'PD-1000',
      qty: qty as number,
      unit: mat?.unit || 'kg',
    };
    if (mat?.physicalState === 'gas' || mat?.family === 'gas') {
      gases.push(itemData);
    } else if (mat?.family === 'ore' || mat?.family === 'metal') {
      minerals.push(itemData);
    } else {
      techPieces.push(itemData);
    }
  });

  return (
    <aside className="fixed right-3 top-[120px] sm:top-[128px] bottom-3 w-80 sm:w-88 max-h-[calc(100vh-140px)] z-40 pointer-events-auto flex flex-col select-none font-sans animate-in slide-in-from-right duration-200">
      <div className="w-full h-full flex flex-col rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Package className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Carga & Espólios
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Onda #{currentWave} · {totalVolatileCount} lotes resgatados
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar manifesto de carga"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Callout: Volatile vs Secured */}
        <div className="px-3 py-2 bg-amber-950/30 border-b border-amber-800/40 shrink-0 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] font-mono leading-tight">
            <span className="text-amber-200 font-bold">Carga Volátil do Vácuo:</span>
            <p className="text-amber-300/80 text-[10px] mt-0.5">
              Os espólios são transferidos para os silos blindados da base apenas ao concluir a expedição ou no ponto de extração.
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {/* 1. Currencies & Data */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
              Moeda Tática de Construção & Telemetria
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 block truncate">Nano-Matéria</span>
                  <strong className="text-xs font-mono text-amber-300">+{volatileCargo.matter} NM</strong>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 block truncate">Micro-Circuitos</span>
                  <strong className="text-xs font-mono text-cyan-300">+{volatileCargo.techComponents} MC</strong>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 block truncate">Dados Táticos</span>
                  <strong className="text-xs font-mono text-purple-300">+{volatileCargo.combatData} DT</strong>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 block truncate">Matriz Dimensional</span>
                  <strong className="text-xs font-mono text-emerald-300">+{volatileCargo.dimensionalMaterials} MD</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Minérios & Metais */}
          {minerals.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>Minérios e Regolito ({minerals.length})</span>
              </span>
              <div className="flex flex-col gap-1">
                {minerals.map((m) => (
                  <div
                    key={m.id}
                    className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-sky-300 font-bold text-[10px]">[{m.code}]</span>
                      <span className="text-slate-200 truncate">{m.name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold shrink-0 ml-2">
                      +{m.qty} {m.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Gases e Atmosféricos */}
          {gases.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5 flex items-center gap-1">
                <Wind className="w-3 h-3 text-cyan-400" />
                <span>Gases & Fluidos Criogênicos ({gases.length})</span>
              </span>
              <div className="flex flex-col gap-1">
                {gases.map((g) => (
                  <div
                    key={g.id}
                    className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-cyan-300 font-bold text-[10px]">[{g.code}]</span>
                      <span className="text-slate-200 truncate">{g.name}</span>
                    </div>
                    <span className="text-cyan-400 font-bold shrink-0 ml-2">
                      +{g.qty} {g.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Sucatas e Componentes */}
          {techPieces.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>Destroços & Peças Estruturais ({techPieces.length})</span>
              </span>
              <div className="flex flex-col gap-1">
                {techPieces.map((p) => (
                  <div
                    key={p.id}
                    className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-indigo-300 font-bold text-[10px]">[{p.code}]</span>
                      <span className="text-slate-200 truncate">{p.name}</span>
                    </div>
                    <span className="text-indigo-400 font-bold shrink-0 ml-2">
                      +{p.qty} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rawItems.length === 0 && (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs">
              <Package className="w-8 h-8 opacity-40 text-slate-600" />
              <span>Nenhum espólio material resgatado ainda nesta onda.</span>
              <span className="text-[10px] text-slate-600">
                Elimine fragatas e cruzadores invasores para extrair cargas voláteis.
              </span>
            </div>
          )}
        </div>

        {/* Footer info: Protected cargo in vault */}
        <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Seguro no Silo:</span>
          </div>
          <span className="text-emerald-300 font-semibold">
            {protectedCargo.matter} NM · {protectedCargo.techComponents} Tech
          </span>
        </div>
      </div>
    </aside>
  );
};
