/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { getMaterialById } from '../config';
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Package,
  Cpu,
  Coins,
  Sparkles,
  Layers,
  Flame,
  Wind,
} from 'lucide-react';

export const ExtractionModal: React.FC = () => {
  const {
    expeditionPhase,
    currentWave,
    protectedCargo,
    volatileCargo,
    extractExpedition,
    advanceToNextWave,
  } = useGame();

  if (expeditionPhase !== 'EXTRACTION_CHECKPOINT') return null;

  // Aggregate all physical cargo items
  const combinedItemsMap: Record<string, number> = {};
  if (protectedCargo.items) {
    Object.entries(protectedCargo.items).forEach(([id, qty]) => {
      combinedItemsMap[id] = (combinedItemsMap[id] || 0) + (qty as number);
    });
  }
  if (volatileCargo.items) {
    Object.entries(volatileCargo.items).forEach(([id, qty]) => {
      combinedItemsMap[id] = (combinedItemsMap[id] || 0) + (qty as number);
    });
  }

  const physicalCargoList = Object.entries(combinedItemsMap)
    .filter(([, qty]) => qty > 0)
    .map(([itemId, qty]) => {
      const mat = getMaterialById(itemId);
      return {
        id: itemId,
        code: mat?.code || 'PD-1000',
        name: mat?.name || itemId,
        quantity: qty,
        unit: mat?.unit || 'kg',
        isGas: mat?.physicalState === 'gas' || mat?.family === 'gas',
      };
    });

  const totalItemCount = physicalCargoList.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none font-sans">
      <div className="w-full max-w-2xl border border-slate-800 rounded-2xl bg-slate-950 p-6 flex flex-col gap-5 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-xs font-mono uppercase text-emerald-300 font-bold tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Marco de Extração · Onda #{currentWave} Concluída</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mt-2 font-mono">
            Retorno Seguro à Estação Base
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
            Seus compartimentos blindados trancaram toda a carga resgatada. Ao extrair agora, todos os minérios e gases serão transferidos diretamente para os Silos de Estoque da Base.
          </p>
        </div>

        {/* 1. Real Physical Cargo to Station Silos */}
        <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-400">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Carga Real Resgatada (Destino: Silos da Estação)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {physicalCargoList.length} tipos · {totalItemCount} unidades/kg
            </span>
          </div>

          {physicalCargoList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {physicalCargoList.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.isGas ? (
                      <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="text-cyan-400 font-bold text-[10px]">[{item.code}]</span>
                    <span className="text-slate-200 truncate">{item.name}</span>
                  </div>
                  <span className="text-emerald-400 font-bold shrink-0 ml-2">
                    +{item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-xs font-mono text-slate-500 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
              Nenhum minério bruto no compartimento nesta expedição.
            </div>
          )}
        </div>

        {/* 2. Combat Construction Currencies (Moeda de Construção & Evolução) */}
        <div className="border border-slate-800/80 rounded-xl p-3.5 bg-slate-900/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-slate-400">
            <Coins className="w-3.5 h-3.5 text-cyan-400" />
            <span>Recursos Táticos de Expedição (Moeda de Construção & Telemetria)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">NANO-MATÉRIA</div>
              <div className="text-base font-bold font-mono text-amber-300 tabular-nums">
                +{protectedCargo.matter} NM
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">MICRO-CIRCUITOS</div>
              <div className="text-base font-bold font-mono text-cyan-300 tabular-nums">
                +{protectedCargo.techComponents} MC
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">DADOS TÁTICOS</div>
              <div className="text-base font-bold font-mono text-purple-300 tabular-nums">
                +{protectedCargo.combatData} DT
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">MATRIZ DIMENSIONAL</div>
              <div className="text-base font-bold font-mono text-emerald-300 tabular-nums">
                +{protectedCargo.dimensionalMaterials} MD
              </div>
            </div>
          </div>
        </div>

        {/* Warning callout */}
        <div className="p-3 rounded-xl border border-amber-900/40 bg-amber-950/20 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span className="leading-tight">
            <strong>Decisão Tática:</strong> Se optar por continuar, enfrentará ondas com inimigos mais velozes e destruidores pesados. Se o Núcleo for destruído, apenas a carga protegida será recuperada.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={extractExpedition}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-emerald-500/60 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Extrair Carga para os Silos</span>
          </button>

          <button
            onClick={advanceToNextWave}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Arriscar Onda #{currentWave + 1}</span>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
