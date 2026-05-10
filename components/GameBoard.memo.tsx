import React, { memo, useMemo, useCallback } from 'react';
import { GameUnit, Faction, UnitType } from '../types';
import { LANE_COUNT, GAME_CONFIG } from '../utils/gameConstants';

interface GameBoardProps {
  units: GameUnit[];
  selectedUnit: UnitType | null;
  centerFoodItem: { emoji: string; name: string };
  onLaneClick: (laneIndex: number) => void;
  className?: string;
  'aria-label'?: string;
}

interface UnitRenderProps {
  unit: GameUnit;
  centerFoodItem: { emoji: string; name: string };
  laneUnits: GameUnit[];
}

// Memoized unit component
const UnitRender = memo(({ unit, centerFoodItem, laneUnits }: UnitRenderProps) => {
  const stackInfo = useMemo(() => {
    const stackGroup = laneUnits.filter(u => 
      u.faction === unit.faction && 
      u.type === unit.type && 
      Math.abs(u.position - unit.position) < GAME_CONFIG.UNIT_STACK_PROXIMITY_THRESHOLD
    );

    stackGroup.sort((a, b) => a.instanceId.localeCompare(b.instanceId));
    const stackIndex = stackGroup.findIndex(u => u.instanceId === unit.instanceId);
    const stackSize = stackGroup.length;
    
    const verticalOffset = stackIndex === 0 ? 0 : 
                           (stackIndex % 2 === 0 ? (stackIndex/2) * GAME_CONFIG.UNIT_STACK_VERTICAL_OFFSET : -((stackIndex+1)/2) * GAME_CONFIG.UNIT_STACK_VERTICAL_OFFSET);

    return { stackIndex, stackSize, verticalOffset };
  }, [unit, laneUnits]);

  const hpPercentage = useMemo(() => {
    if (unit.hp <= 0) return 0;
    const percentage = (unit.currentHp / unit.hp) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Clamp to [0, 100]
  }, [unit.currentHp, unit.hp]);

  return (
    <div
      className="absolute transition-all duration-75 ease-linear flex flex-col items-center justify-center w-9 h-9"
      style={{ 
        left: `${unit.position}%`, 
        transform: `translate(-50%, ${stackInfo.verticalOffset}px) scaleX(${unit.faction === Faction.BEES ? 1 : -1})`,
        zIndex: 20 + stackInfo.stackIndex
      }}
    >
      {/* HP Bar */}
      <div className="w-full h-1 bg-gray-700 rounded-full mb-0.5 overflow-hidden"> 
        <div 
          className={`h-full ${unit.faction === Faction.BEES ? 'bg-yellow-400' : 'bg-red-500'}`} 
          style={{ width: `${hpPercentage}%` }}
        />
      </div>
      
      {/* Unit Emoji */}
      <div className="relative">
        <div className={`text-2xl filter drop-shadow-md ${unit.isAttacking ? 'animate-wiggle-fast' : 'animate-bounce-slow'}`}>
          {unit.emoji}
        </div>
        
        {/* Carrying indicator */}
        {unit.isCarrying && (
          <div className="absolute -top-2 -right-2 text-xs animate-bounce bg-white/80 rounded-full w-4 h-4 flex items-center justify-center border border-gray-400 shadow">
            {centerFoodItem.emoji}
          </div>
        )}

        {/* Stack Count Badge */}
        {stackInfo.stackIndex === 0 && stackInfo.stackSize > 1 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white/30 z-30 shadow-sm backdrop-blur-[1px]">
            x{stackInfo.stackSize}
          </div>
        )}
      </div>
      
      {unit.isAttacking && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-lg animate-ping">💥</div>
      )}
    </div>
  );
});

UnitRender.displayName = 'UnitRender';

// Memoized lane component
const LaneRender = memo(({ 
  laneIndex, 
  units, 
  isCenterLane, 
  selectedUnit, 
  centerFoodItem, 
  onLaneClick,
  isValidLane,
  isGathererSelected 
}: {
  laneIndex: number;
  units: GameUnit[];
  isCenterLane: boolean;
  selectedUnit: UnitType | null;
  centerFoodItem: { emoji: string; name: string };
  onLaneClick: (laneIndex: number) => void;
  isValidLane: boolean;
  isGathererSelected: boolean;
}) => {
  const handleClick = useCallback(() => {
    onLaneClick(laneIndex);
  }, [laneIndex, onLaneClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onLaneClick(laneIndex);
    }
  }, [laneIndex, onLaneClick]);

  const laneUnits = useMemo(() => units, [units]);
  
  const laneDescription = isCenterLane 
    ? `Resource Corridor - Lane ${laneIndex + 1} with ${laneUnits.length} units` 
    : `Combat Lane ${laneIndex + 1} with ${laneUnits.length} units`;

  return (
    <div 
      role="button"
      tabIndex={selectedUnit && isValidLane ? 0 : -1}
      aria-label={laneDescription}
      aria-disabled={selectedUnit ? !isValidLane : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative flex-1 w-full border-b border-black/30 flex items-center transition-all duration-300
        ${isCenterLane 
          ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 border-y-4 border-amber-300/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]' 
          : (laneIndex % 2 === 0 ? 'bg-gradient-to-r from-green-800 to-green-700' : 'bg-gradient-to-r from-green-700 to-green-600')
        }
        ${selectedUnit && isValidLane ? 'cursor-pointer hover:brightness-125 focus:ring-2 focus:ring-white focus:outline-none' : ''}
        ${selectedUnit && !isValidLane ? 'cursor-not-allowed grayscale-[0.7] opacity-60' : ''}
        ${selectedUnit && isValidLane ? 'ring-inset ring-4 ring-yellow-400 z-10 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}
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
            <span className="text-4xl filter drop-shadow-lg animate-wiggle-slow">{centerFoodItem.emoji}</span>
          </div>
        </>
      )}

      {/* Units in this lane */}
      {laneUnits.map((unit) => (
        <UnitRender 
          key={unit.instanceId}
          unit={unit}
          centerFoodItem={centerFoodItem}
          laneUnits={laneUnits}
        />
      ))}

      {/* Hover Effects */}
      {selectedUnit && (
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
  );
});

LaneRender.displayName = 'LaneRender';

// Memoized game board component
export const GameBoard = memo(({ units, selectedUnit, centerFoodItem, onLaneClick, className, 'aria-label': ariaLabel }: GameBoardProps) => {
  const centerLaneIndex = useMemo(() => Math.floor(LANE_COUNT / 2), []);
  
  const isGathererSelected = useMemo(() => selectedUnit === UnitType.GATHERER, [selectedUnit]);
  const isCombatUnitSelected = useMemo(() => selectedUnit && !isGathererSelected, [selectedUnit, isGathererSelected]);

  const lanes = useMemo(() => {
    return Array.from({ length: LANE_COUNT }, (_, laneIndex) => {
      const isCenterLane = laneIndex === centerLaneIndex;
      const isValidLane = !selectedUnit || 
                          (isGathererSelected && isCenterLane) || 
                          (isCombatUnitSelected && !isCenterLane);
      
      const laneUnits = units.filter(u => u.lane === laneIndex);

      return {
        laneIndex,
        isCenterLane,
        isValidLane,
        laneUnits
      };
    });
  }, [units, selectedUnit, isGathererSelected, isCombatUnitSelected, centerLaneIndex]);

  return (
    <div 
      role="region"
      aria-label={ariaLabel || "Game battlefield"}
      className={`flex-1 bg-green-700 rounded-xl border-8 border-green-900 shadow-2xl relative overflow-hidden flex flex-col justify-between ${className || ''}`}
    >
      {lanes.map(({ laneIndex, isCenterLane, isValidLane, laneUnits }) => (
        <LaneRender
          key={laneIndex}
          laneIndex={laneIndex}
          units={laneUnits}
          isCenterLane={isCenterLane}
          selectedUnit={selectedUnit}
          centerFoodItem={centerFoodItem}
          onLaneClick={onLaneClick}
          isValidLane={isValidLane}
          isGathererSelected={isGathererSelected}
        />
      ))}
    </div>
  );
});

GameBoard.displayName = 'GameBoard';

export default GameBoard;
