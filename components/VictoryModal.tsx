import React from 'react';
import { GamePhase } from '../types';

interface VictoryModalProps {
  gamePhase: GamePhase;
  completedLevel: number;
  message: string;
  onNextLevel: () => void;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ gamePhase, completedLevel, message, onNextLevel, onRestart }) => {
  if (gamePhase === 'playing') return null;

  if (gamePhase === 'level_victory') {
    const nextLevel = completedLevel + 1;
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border-8 border-yellow-400 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform scale-100 animate-[bounce_0.5s_ease-out]">
          <h2 className="text-5xl text-center mb-4 comic-font text-yellow-600">
            Level {completedLevel} Complete!
          </h2>
          <div className="text-8xl text-center mb-6 animate-pulse">
            🏆🐝
          </div>
          <p className="text-center text-lg text-slate-700 mb-8 italic font-serif bg-slate-100 p-4 rounded-lg border border-slate-200">
            "Get ready for Level {nextLevel}! {message}"
          </p>
          <button
            onClick={onNextLevel}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-white text-2xl font-bold rounded-xl shadow-[0_4px_0_rgb(234,179,8)] active:shadow-none active:translate-y-1 transition-all comic-font"
          >
            Next Level →
          </button>
        </div>
      </div>
    );
  }

  // game_over
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border-8 border-red-500 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform scale-100 animate-[bounce_0.5s_ease-out]">
        <h2 className="text-5xl text-center mb-4 comic-font text-red-600">
          Game Over
        </h2>
        <div className="text-8xl text-center mb-6 animate-pulse">
          🐜💀
        </div>
        <p className="text-center text-xl text-slate-700 mb-8 font-bold">
          Reached Level {completedLevel}
        </p>
        <button
          onClick={onRestart}
          className="w-full py-4 bg-red-500 hover:bg-red-400 text-white text-2xl font-bold rounded-xl shadow-[0_4px_0_rgb(185,28,28)] active:shadow-none active:translate-y-1 transition-all comic-font"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};