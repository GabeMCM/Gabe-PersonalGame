/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { AlertOctagon, Wrench, Shield, CheckCircle } from 'lucide-react';

export const DefeatModal: React.FC = () => {
  const {
    expeditionPhase,
    currentWave,
    protectedCargo,
    volatileCargo,
    setMode,
    setExpeditionPhase,
  } = useGame();

  if (expeditionPhase !== 'DEFEAT') return null;

  const returnToBase = () => {
    setExpeditionPhase('SPAWNING');
    setMode('OPERATION');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-xl border border-rose-900/60 rounded-xl bg-slate-950 p-6 flex flex-col gap-6 shadow-2xl">
        <div className="text-center">
          <div className="text-xs font-mono uppercase text-rose-400 tracking-wider flex items-center justify-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <span>Integridade Crítica · Colapso na Onda #{currentWave}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">
            Defesas da Torre Rompidas
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            As hordas inimigas penetraram o escudo de contenção e atingiram o Núcleo Central.
            O protocolo de resgate de emergência desativou os portais e recolheu os destroços da estação.
          </p>
        </div>

        {/* Cargo Salvage Report */}
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/50 flex flex-col gap-3">
          <div className="text-xs font-mono uppercase text-slate-300 border-b border-slate-800 pb-2">
            Relatório de Resgate de Carga
          </div>
          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Carga Protegida (100% Salva no Silo):
              </span>
              <span className="font-semibold tabular-nums">
                +{protectedCargo.matter} Mat · +{protectedCargo.combatData} Dados
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Carga Volátil Resgatada Parcialmente:</span>
              <span className="tabular-nums">
                +{Math.round(volatileCargo.matter * 0.4)} Mat · +{Math.round(volatileCargo.combatData * 0.4)} Dados
              </span>
            </div>
          </div>
        </div>

        {/* Structural Status Alert */}
        <div className="p-3 rounded border border-rose-950 bg-rose-950/20 text-xs text-rose-300 flex items-start gap-2.5">
          <Wrench className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>
            <strong>Danos Estruturais Sofridos:</strong> O Reator, Arsenal e Oficinas sofreram avarias, e os Escudos foram desativados. Acesse o Centro de Operações para realizar reparos antes da próxima incursão.
          </span>
        </div>

        <button
          onClick={returnToBase}
          className="w-full py-3 px-4 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100 font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Retornar à Base e Iniciar Manutenção</span>
        </button>
      </div>
    </div>
  );
};
