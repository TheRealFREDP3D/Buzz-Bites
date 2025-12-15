import React from 'react';
import { Faction } from '../types';

interface VictoryModalProps {
  winner: Faction | null;
  message: string;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ winner, message, onRestart }) => {
  if (!winner) return null;

  const isBees = winner === Faction.BEES;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className={`max-w-md w-full bg-white rounded-2xl border-8 ${isBees ? 'border-yellow-400' : 'border-red-500'} p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform scale-100 animate-[bounce_0.5s_ease-out]`}>
        <h2 className={`text-5xl text-center mb-4 comic-font ${isBees ? 'text-yellow-600' : 'text-red-600'}`}>
          {isBees ? 'HIVE VICTORY!' : 'COLONY CONQUEST!'}
        </h2>
        <div className="text-8xl text-center mb-6 animate-pulse">
          {isBees ? '🏆🐝' : '🏆🐜'}
        </div>
        <p className="text-center text-lg text-slate-700 mb-8 italic font-serif bg-slate-100 p-4 rounded-lg border border-slate-200">
          "{message}"
        </p>
        <button
          onClick={onRestart}
          className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white text-2xl font-bold rounded-xl shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-1 transition-all comic-font"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};