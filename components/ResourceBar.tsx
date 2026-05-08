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
      <div className="bg-white/40 backdrop-blur-md border-2 border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)] rounded-2xl p-2 relative overflow-hidden flex justify-between items-center px-4 transition-all hover:scale-105">
         <div className="flex items-center gap-3">
             <span className="text-4xl filter drop-shadow-md animate-pulse">🍯</span>
             <div className="flex flex-col">
                <span className="text-xs text-yellow-900/80 font-bold tracking-wider drop-shadow-sm">NECTAR</span>
                <span className="text-3xl font-bold text-yellow-900 font-mono leading-none drop-shadow-sm">{Math.floor(nectar)}</span>
             </div>
         </div>
      </div>

      {/* Ant Resources */}
      <div className="bg-white/40 backdrop-blur-md border-2 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-2xl p-2 relative overflow-hidden flex justify-between items-center px-4 transition-all hover:scale-105">
         <div className="flex items-center gap-3 flex-row-reverse w-full">
             <span className="text-4xl filter drop-shadow-md animate-pulse" style={{ animationDelay: '0.5s' }}>🍪</span>
             <div className="flex flex-col text-right">
                <span className="text-xs text-red-900/80 font-bold tracking-wider drop-shadow-sm">CRUMBS</span>
                <span className="text-3xl font-bold text-red-900 font-mono leading-none drop-shadow-sm">{Math.floor(crumbs)}</span>
             </div>
         </div>
      </div>
    </div>
  );
};