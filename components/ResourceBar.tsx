import React from 'react';

interface ResourceBarProps {
  nectar: number;
  crumbs: number;
  beeHealth: number; // Kept in props if needed later, but not used for bar display anymore
  antHealth: number;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({ nectar, crumbs }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-2 sticky top-2 z-30">
      
      {/* Bee Resources */}
      <div className="bg-white/90 backdrop-blur border-4 border-yellow-500 rounded-xl p-2 shadow-lg relative overflow-hidden flex justify-between items-center px-4">
         <div className="flex items-center gap-3">
             <span className="text-4xl filter drop-shadow-sm">🍯</span>
             <div className="flex flex-col">
                <span className="text-xs text-yellow-800/70 font-bold tracking-wider">NECTAR</span>
                <span className="text-3xl font-bold text-yellow-800 font-mono leading-none">{Math.floor(nectar)}</span>
             </div>
         </div>
      </div>

      {/* Ant Resources */}
      <div className="bg-white/90 backdrop-blur border-4 border-red-500 rounded-xl p-2 shadow-lg relative overflow-hidden flex justify-between items-center px-4">
         <div className="flex items-center gap-3 flex-row-reverse w-full">
             <span className="text-4xl filter drop-shadow-sm">🍪</span>
             <div className="flex flex-col text-right">
                <span className="text-xs text-red-800/70 font-bold tracking-wider">CRUMBS</span>
                <span className="text-3xl font-bold text-red-800 font-mono leading-none">{Math.floor(crumbs)}</span>
             </div>
         </div>
      </div>
    </div>
  );
};