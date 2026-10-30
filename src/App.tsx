/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { OperationView } from './components/OperationView';
import { PixelCanvas } from './game/PixelCanvas';
import { ExpeditionHUD } from './components/ExpeditionHUD';
import { HexControlDock } from './components/HexControlDock';
import { RoguelikeChoiceModal } from './components/RoguelikeChoiceModal';
import { ExtractionModal } from './components/ExtractionModal';
import { DefeatModal } from './components/DefeatModal';

const MainLayout: React.FC = () => {
  const { mode } = useGame();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Main Game Viewport - 100% immersive fullscreen */}
      <main className="w-full h-full relative overflow-hidden flex flex-col">
        {mode === 'OPERATION' ? (
          <OperationView />
        ) : (
          <div className="w-full h-full relative">
            {/* Primary View: 2D Pixel Art Top-View */}
            <PixelCanvas />

            {/* Tactical HUD Overlay */}
            <ExpeditionHUD />

            {/* Bottom Collapsible Hex Control Dock */}
            <HexControlDock />

            {/* Interactive Modals */}
            <RoguelikeChoiceModal />
            <ExtractionModal />
            <DefeatModal />
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <MainLayout />
    </GameProvider>
  );
}
