import React from 'react';
import { Faction, UnitType, GameUnit } from './types';
import { LANE_COUNT, BASE_HEALTH, BEE_UNITS } from './constants';
import { ResourceBar } from './components/ResourceBar';
import { UnitControls } from './components/UnitControls';
import { BattleLog } from './components/BattleLog';
import { VictoryModal } from './components/VictoryModal';
import { BaseHealth } from './components/BaseHealth';
import { useGameState } from './hooks/useGameState';
import { useCommentary } from './hooks/useCommentary';

const App: React.FC = () => {
  const {
    gameState,
    spawnUnit,
    upgradeUnit,
    selectUnit,
    restartGame,
    canAffordUnit,
    getUpgradeCost,
    getUnitCount
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

  // Event handlers
  const handleLaneClick = (laneIndex: number) => {
    if (!gameState.gameActive || !gameState.selectedUnit) return;
    
    spawnUnit(Faction.BEES, gameState.selectedUnit, laneIndex);
  };

  const handleUnitSelect = (type: UnitType) => {
    selectUnit(type);
  };

  const handleUnitUpgrade = (type: UnitType) => {
    upgradeUnit(type);
  };

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
            <div className="text-white font-mono text-sm opacity-80 text-right">
              Resource Corridor Edition<br/>
              Defend the Hive!
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

        {/* CENTER: LANES */}
        <div className="flex-1 bg-green-700 rounded-xl border-8 border-green-900 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {Array.from({ length: LANE_COUNT }).map((_, laneIndex) => {
                const isCenterLane = laneIndex === centerLaneIndex;
                const isGathererSelected = gameState.selectedUnit === UnitType.GATHERER;
                const isCombatUnitSelected = gameState.selectedUnit && !isGathererSelected;
                
                // Determine if this lane is valid for the selected unit
                const isValidLane = !gameState.selectedUnit || 
                                    (isGathererSelected && isCenterLane) || 
                                    (isCombatUnitSelected && !isCenterLane);

                const laneUnits = gameState.units.filter(u => u.lane === laneIndex);

                // Pre-calculate stack groups to avoid O(n²) operations
                const stackGroups = new Map<string, GameUnit[]>();
                laneUnits.forEach(unit => {
                    const stackKey = `${unit.faction}_${unit.type}_${Math.floor(unit.position / 3)}`;
                    if (!stackGroups.has(stackKey)) {
                        stackGroups.set(stackKey, []);
                    }
                    stackGroups.get(stackKey)!.push(unit);
                });

                // Sort each stack group by instanceId for consistent ordering
                stackGroups.forEach(group => {
                    group.sort((a, b) => a.instanceId.localeCompare(b.instanceId));
                });

                return (
                <div 
                    key={laneIndex}
                    onClick={() => handleLaneClick(laneIndex)}
                    className={`
                    relative flex-1 w-full border-b border-black/30 flex items-center transition-all duration-300
                    ${isCenterLane 
                        ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 border-y-4 border-amber-300/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]' 
                        : (laneIndex % 2 === 0 ? 'bg-gradient-to-r from-green-800 to-green-700' : 'bg-gradient-to-r from-green-700 to-green-600')
                    }
                    ${gameState.selectedUnit && isValidLane ? 'cursor-pointer hover:brightness-125' : ''}
                    ${gameState.selectedUnit && !isValidLane ? 'cursor-not-allowed grayscale-[0.7] opacity-60' : ''}
                    ${gameState.selectedUnit && isValidLane ? 'ring-inset ring-4 ring-yellow-400 z-10 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}
                    group
                    `}
                >
                    {/* Lane Number */}
                    <div className="absolute left-2 text-white/20 font-mono text-4xl font-bold pointer-events-none z-0">
                    {laneIndex + 1}
                    </div>

                    {/* Center Lane Specifics */}
                    {isCenterLane && (
                        <>
                            <div className="absolute inset-0 flex justify-around items-center opacity-40 pointer-events-none">
                                <span>🥤</span><span>🥪</span><span>🍎</span><span>🍩</span>
                            </div>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/20 text-white text-[10px] font-bold px-2 rounded-b">
                                RESOURCE CORRIDOR
                            </div>
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex flex-col items-center opacity-100 scale-150">
                                <span className="text-4xl filter drop-shadow-lg animate-wiggle-slow">{gameState.centerFoodItem.emoji}</span>
                            </div>
                        </>
                    )}

                    {/* Units in this lane - Optimized rendering */}
                    {laneUnits.map((unit, unitIndex) => {
                        // Find stack group for this unit
                        const stackKey = `${unit.faction}_${unit.type}_${Math.floor(unit.position / 3)}`;
                        const stackGroup = stackGroups.get(stackKey) || [];
                        const stackIndex = stackGroup.findIndex(u => u.instanceId === unit.instanceId);
                        const stackSize = stackGroup.length;
                        
                        const verticalOffset = stackIndex === 0 ? 0 : 
                                               (stackIndex % 2 === 0 ? (stackIndex/2) * 6 : -((stackIndex+1)/2) * 6);

                        return (
                          <div
                            key={unit.instanceId}
                            className="absolute transition-all duration-75 ease-linear flex flex-col items-center justify-center w-9 h-9"
                            style={{ 
                              left: `${unit.position}%`, 
                              transform: `translate(-50%, ${verticalOffset}px) scaleX(${unit.faction === Faction.BEES ? 1 : -1})`,
                              zIndex: 20 + stackIndex
                            }}
                          >
                            {/* HP Bar */}
                            <div className="w-full h-1 bg-gray-700 rounded-full mb-0.5 overflow-hidden"> 
                                <div 
                                    className={`h-full ${unit.faction === Faction.BEES ? 'bg-yellow-400' : 'bg-red-500'}`} 
                                    style={{ width: `${unit.hp > 0 ? (unit.currentHp / unit.hp) * 100 : 0}%` }}
                                ></div>
                            </div>
                            
                            {/* Unit Emoji */}
                            <div className="relative">
                                    <div className={`text-2xl filter drop-shadow-md ${unit.isAttacking ? 'animate-wiggle-fast' : 'animate-bounce-slow'}`}>
                                        {unit.emoji}
                                    </div>
                                    
                                    {/* Carrying indicator */}
                                    {unit.isCarrying && (
                                        <div className="absolute -top-2 -right-2 text-xs animate-bounce bg-white/80 rounded-full w-4 h-4 flex items-center justify-center border border-gray-400 shadow">
                                            {gameState.centerFoodItem.emoji}
                                        </div>
                                    )}

                                    {/* Stack Count Badge */}
                                    {stackIndex === 0 && stackSize > 1 && (
                                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white/30 z-30 shadow-sm backdrop-blur-[1px]">
                                        x{stackSize}
                                      </div>
                                    )}
                            </div>
                            
                            {unit.isAttacking && (
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-lg animate-ping">💥</div>
                            )}
                          </div>
                        );
                    })}

                    {/* Hover Effects */}
                    {gameState.selectedUnit && (
                        <div className={`absolute inset-0 hidden group-hover:flex items-center justify-center z-20 transition-all duration-200
                             ${isValidLane ? 'bg-white/10 backdrop-blur-[1px]' : 'bg-black/40'}
                        `}>
                             {/* Valid Placement */}
                             {isValidLane && (
                                 <div className="flex items-center gap-2 animate-bounce">
                                     <span className="text-4xl">🐝</span>
                                     <span className="font-bold text-white drop-shadow-md text-2xl border-b-2 border-white">DEPLOY</span>
                                 </div>
                             )}
                             
                             {/* Invalid Placement */}
                             {!isValidLane && (
                                 <div className="flex flex-col items-center">
                                    <span className="text-4xl mb-1">🚫</span>
                                    <span className="font-bold text-white text-sm bg-red-600/90 px-3 py-1 rounded shadow-lg uppercase tracking-wider">
                                        {isGathererSelected ? "GATHERER NEEDS FOOD" : "NO COMBAT IN CORRIDOR"}
                                    </span>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            )})}
        </div>

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
        winner={gameState.winner} 
        message={gameState.commentary} 
        onRestart={restartGame} 
      />
      
      <style>{`
        .animate-wiggle-fast { animation: wiggle 0.2s ease-in-out infinite; }
        .animate-wiggle-slow { animation: wiggle 3s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce 1s infinite; }
        @keyframes wiggle { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
      `}</style>
    </div>
  );
};

export default App;
