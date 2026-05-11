import React, { useCallback } from 'react';
import { Faction, UnitType } from './types';
import { LANE_COUNT, BASE_HEALTH, BEE_UNITS } from './constants';
import { ResourceBar } from './components/ResourceBar';
import { UnitControls } from './components/UnitControls';
import { BattleLog } from './components/BattleLog';
import { VictoryModal } from './components/VictoryModal';
import { BaseHealth } from './components/BaseHealth';
import { GameBoard } from './components/GameBoard.memo';
import { useGameState } from './hooks/useGameState';
import { useCommentary } from './hooks/useCommentary';

const App: React.FC = () => {
  const {
    gameState,
    spawnUnit,
    upgradeUnit,
    selectUnit,
    restartGame,
    advanceLevel,
    startNextLevel,
    canAffordUnit,
    getUpgradeCost,
    getUnitCount,
    currentLevel,
    gamePhase
  } = useGameState();

  const { handleCommentaryTrigger } = useCommentary(
    gameState.isLoadingCommentary,
    (commentary, isLoading) => {
      // This would be handled by the reducer in a full implementation
      console.log('Commentary:', commentary, 'Loading:', isLoading);
    },
    gameState.triggerCommentaryForEvent,
    gameState.gameActive,
    gameState.winner,
    gameState.beeBaseHealth,
    gameState.antBaseHealth
  );

  // Event handlers - memoized for performance
  const handleNextLevel = useCallback(() => {
    advanceLevel();
    startNextLevel();
  }, [advanceLevel, startNextLevel]);

  const handleLaneClick = useCallback((laneIndex: number) => {
    if (!gameState.gameActive || !gameState.selectedUnit) return;
    
    spawnUnit(Faction.BEES, gameState.selectedUnit, laneIndex);
  }, [gameState.gameActive, gameState.selectedUnit, spawnUnit]);

  const handleUnitSelect = useCallback((type: UnitType) => {
    selectUnit(type);
  }, [selectUnit]);

  const handleUnitUpgrade = useCallback((type: UnitType) => {
    upgradeUnit(type);
  }, [upgradeUnit]);

  const centerLaneIndex = Math.floor(LANE_COUNT / 2);

  return (
    <div className="min-h-screen flex flex-col max-w-[1800px] mx-auto p-4 select-none">
      
      {/* Header */}
      <div className="relative h-40 rounded-3xl overflow-hidden mb-4 shadow-2xl border-4 border-white">
         <img 
           src="https://image.pollinations.ai/prompt/cartoon%20backyard%20battle%20bees%20vs%20ants%20funny%20comic%20style%20wide%20angle?width=1024&height=512&nologo=true" 
           alt="Backyard Battle" 
           className="w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between px-8 pb-4">
            <h1 className="text-5xl text-white comic-font drop-shadow-md stroke-black text-stroke-2">
              BUZZ <span className="text-yellow-400">vs</span> BITE
            </h1>
            <div className="flex flex-col items-end gap-1">
              <span className="bg-yellow-400 text-black font-bold px-3 py-1 rounded-full comic-font text-lg shadow">
                LEVEL {gameState.currentLevel}
              </span>
              <div className="text-white font-mono text-sm opacity-80 text-right">
                Resource Corridor Edition<br/>
                Defend the Hive!
              </div>
            </div>
         </div>
      </div>

      <ResourceBar 
        nectar={gameState.beeResources} 
        crumbs={gameState.antResources} 
        beeHealth={gameState.beeBaseHealth}
        antHealth={gameState.antBaseHealth}
      />

      {/* Commentary */}
      <div className="backdrop-blur-md bg-slate-900/70 text-yellow-300 p-3 rounded-xl mb-4 text-center font-bold border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] relative z-20 text-lg tracking-wide transition-all duration-300">
         <span className="mr-3 text-xl animate-pulse inline-block">🎙️</span>
         "{gameState.commentary}"
      </div>

      {/* MAIN BATTLEFIELD CONTAINER */}
      <div className="flex flex-row gap-2 h-[500px] mb-2">
        
        {/* LEFT: BEE HIVE + HEALTH */}
        <BaseHealth 
            faction={Faction.BEES} 
            currentHealth={gameState.beeBaseHealth} 
            maxHealth={BASE_HEALTH}
        />

        {/* CENTER: LANES - Using memoized GameBoard component */}
        <GameBoard
          units={gameState.units}
          selectedUnit={gameState.selectedUnit}
          centerFoodItem={gameState.centerFoodItem}
          onLaneClick={handleLaneClick}
          aria-label="Game battlefield with 7 lanes"
        />

        {/* RIGHT: ANT NEST + HEALTH */}
        <BaseHealth 
            faction={Faction.ANTS} 
            currentHealth={gameState.antBaseHealth} 
            maxHealth={BASE_HEALTH}
        />

      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <UnitControls 
            units={BEE_UNITS}
            resources={gameState.beeResources} 
            onSelect={handleUnitSelect}
            onUpgrade={handleUnitUpgrade}
            selectedUnit={gameState.selectedUnit}
            beeArmyCount={getUnitCount(Faction.BEES)}
            unitLevels={gameState.unitLevels}
          />
        </div>
        <div className="md:col-span-1">
             <BattleLog logs={gameState.logs} />
             <div className="mt-2 text-xs text-center text-slate-500">
               <span className="bg-green-200 px-1 rounded">Lane {centerLaneIndex + 1}</span> is the Resource Corridor. Only Gatherers can enter!
             </div>
        </div>
      </div>

      <VictoryModal 
        gamePhase={gameState.gamePhase}
        currentLevel={gameState.currentLevel + 1}
        completedLevel={gameState.currentLevel}
        message={gameState.commentary} 
        onNextLevel={handleNextLevel}
        onRestart={restartGame} 
      />
    </div>
  );
};

export default App;
