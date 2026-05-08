import React from 'react';
import { Unit, UnitType } from '../types';
import { UPGRADE_COST_INCREASE, UPGRADE_STAT_INCREASE } from '../constants';

interface UnitControlsProps {
  units: Record<UnitType, Unit>;
  resources: number;
  onSelect: (type: UnitType) => void;
  onUpgrade: (type: UnitType) => void;
  selectedUnit: UnitType | null;
  beeArmyCount: number;
  unitLevels: Record<UnitType, number>;
}

export const UnitControls: React.FC<UnitControlsProps> = ({ 
  units, 
  resources, 
  onSelect, 
  onUpgrade, 
  selectedUnit, 
  beeArmyCount,
  unitLevels 
}) => {
  return (
    <div className="p-4 rounded-xl border-4 border-yellow-500 bg-yellow-100 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl text-yellow-800 comic-font">RECRUITMENT & UPGRADES</h3>
        <div className="text-sm font-bold text-yellow-900 bg-yellow-300 px-3 py-1 rounded-full border border-yellow-600">
           Total Army: {beeArmyCount}
        </div>
      </div>
      
      {/* Updated grid to 5 columns for new unit type */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {Object.values(units).map((unit: Unit) => {
          const currentLevel = unitLevels[unit.type] || 1;
          const canAffordUnit = resources >= unit.cost;
          const isSelected = selectedUnit === unit.type;
          
          // Calculate Upgrade Cost: Base * (1.5 ^ (level - 1))
          const upgradeCost = Math.floor(unit.baseUpgradeCost * Math.pow(UPGRADE_COST_INCREASE, currentLevel - 1));
          const canAffordUpgrade = resources >= upgradeCost;

          // Calculate Current Stats for Tooltip
          const multiplier = Math.pow(1 + UPGRADE_STAT_INCREASE, currentLevel - 1);
          const currentHp = Math.floor(unit.hp * multiplier);
          const currentAttack = Math.floor(unit.attack * multiplier);

          // Distinct styling for Gatherers
          const isGatherer = unit.type === UnitType.GATHERER;
          // Changed to Cyan/Sky for better distinction as requested
          const cardBaseColor = isGatherer ? 'bg-cyan-400 border-cyan-700' : 'bg-yellow-400 border-yellow-700';
          const cardHoverColor = isGatherer ? 'hover:bg-cyan-300 active:bg-cyan-500' : 'hover:bg-yellow-300 active:bg-yellow-500';
          const cardSelectedColor = 'bg-blue-400 border-blue-700 border-b-4';

          return (
            <div key={unit.id} className="flex flex-col gap-1 group relative">
              
               {/* Tooltip - Popover above the card */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-slate-900/80 backdrop-blur-md text-white text-xs rounded-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 border-2 border-yellow-500/50 scale-95 group-hover:scale-100 origin-bottom flex flex-col gap-2">
                <div className="font-bold text-yellow-400 text-lg mb-1 flex justify-between items-center comic-font tracking-wide">
                   <span>{unit.name}</span>
                   <span className="bg-slate-700 px-2 py-0.5 rounded text-xs font-sans text-white border border-slate-500">Lvl {currentLevel}</span>
                </div>
                <p className="italic text-slate-300 mb-3 text-[11px] border-b border-slate-700 pb-2 leading-tight">{unit.description}</p>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono">
                   <div className="flex justify-between">
                      <span className="text-slate-400">Health:</span>
                      <span className="font-bold text-green-400">{currentHp}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-400">Damage:</span>
                      <span className="font-bold text-red-400">{currentAttack}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-400">Speed:</span>
                      <span className="font-bold text-blue-400">{unit.speed}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-400">Range:</span>
                      <span className="font-bold text-purple-400">{unit.range}</span>
                   </div>
                   {unit.attack > 0 && (
                    <div className="flex justify-between">
                        <span className="text-slate-400">Atk Spd:</span>
                        <span className="font-bold text-orange-400">{(unit.attackSpeed / 1000).toFixed(1)}s</span>
                    </div>
                   )}
                   {unit.gatherRate > 0 && (
                    <div className="flex justify-between col-span-2 bg-yellow-900/30 rounded px-1 mt-1">
                      <span className="text-yellow-200/70">Passive:</span>
                      <span className="font-bold text-yellow-400">+{unit.gatherRate}/tick</span>
                    </div>
                   )}
                   {unit.type === UnitType.GATHERER && (
                    <div className="flex justify-between col-span-2 bg-green-900/30 rounded px-1 mt-1">
                      <span className="text-green-200/70">Haul:</span>
                      <span className="font-bold text-green-400">15 Food</span>
                    </div>
                   )}
                </div>
                
                {/* Arrow Tip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 border-8 border-transparent border-t-yellow-500/50"></div>
              </div>

              {/* Recruit Button */}
              <button
                onClick={() => onSelect(unit.type)}
                disabled={!canAffordUnit && !isSelected}
                className={`
                  relative overflow-hidden rounded-t-xl border-x-4 border-t-4 transition-all duration-150 p-1 flex flex-col items-center justify-center h-28 w-full
                  ${isSelected 
                     ? `${cardSelectedColor} translate-y-[4px] shadow-none` 
                     : `${cardBaseColor} ${cardHoverColor} border-b-4 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.3)] active:translate-y-[4px] active:shadow-none`
                  }
                  ${!canAffordUnit && !isSelected ? 'opacity-60 grayscale-[0.8] cursor-not-allowed border-gray-500 bg-gray-300 shadow-none translate-y-[4px]' : ''}
                `}
              >
                <div className="absolute top-1 right-1 bg-black/20 text-white text-[10px] px-1.5 rounded font-bold">
                  Lvl {currentLevel}
                </div>
                <div className="text-3xl mb-1 filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-200">{unit.emoji}</div>
                <div className={`font-bold text-xs leading-tight text-center px-1 ${isSelected ? 'text-white' : 'text-yellow-900'}`}>{unit.name}</div>
                
                <div className="mt-1 flex items-center text-xs font-mono font-bold bg-black/10 px-2 py-0.5 rounded">
                   <span>🪙 {unit.cost}</span>
                </div>

                {isSelected && (
                  <div className="absolute inset-0 bg-blue-500/20 animate-pulse flex items-center justify-center pointer-events-none">
                     <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold transform -rotate-12">PLACING...</span>
                  </div>
                )}
              </button>

              {/* Upgrade Button */}
              <button
                onClick={() => onUpgrade(unit.type)}
                disabled={!canAffordUpgrade}
                className={`
                  rounded-b-xl border-x-4 border-b-4 border-t-0 p-1 text-[10px] font-bold text-white flex flex-col items-center justify-center h-12 transition-all duration-150
                  ${canAffordUpgrade 
                    ? 'bg-green-500 border-green-700 hover:bg-green-400 cursor-pointer shadow-[0_4px_0_0_#15803d] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#15803d] active:translate-y-[4px] active:shadow-none' 
                    : 'bg-gray-500 border-gray-700 cursor-not-allowed opacity-80 shadow-none translate-y-[4px]'}
                `}
              >
                <span>UPGRADE</span>
                <span className="bg-black/20 px-1 rounded mt-0.5">🪙 {upgradeCost}</span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-center text-yellow-800/60 text-sm italic">
        {selectedUnit ? "Click a lane to deploy!" : "Select to recruit, or upgrade for stronger units!"}
      </div>
    </div>
  );
};