import React from 'react';
import { Faction } from '../types';

interface BaseHealthProps {
  faction: Faction;
  currentHealth: number;
  maxHealth: number;
}

export const BaseHealth: React.FC<BaseHealthProps> = ({ faction, currentHealth, maxHealth }) => {
  const isBees = faction === Faction.BEES;
  const healthPercent = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  
  // Theme configuration based on faction
  const theme = isBees ? {
    borderColor: 'border-yellow-600',
    bgColor: 'bg-yellow-100',
    fillColor: 'bg-gradient-to-t from-yellow-600 to-yellow-400',
    textColor: 'text-yellow-900/50',
    labelColor: 'text-yellow-800',
    labelBorder: 'border-yellow-500',
    iconBg: 'bg-yellow-200',
    image: 'https://image.pollinations.ai/prompt/cute%20cartoon%20beehive%20hanging%20from%20tree%20icon%20vector?width=100&height=100&nologo=true',
    label: 'HIVE'
  } : {
    borderColor: 'border-red-600',
    bgColor: 'bg-red-100',
    fillColor: 'bg-gradient-to-t from-red-600 to-red-400',
    textColor: 'text-red-900/50',
    labelColor: 'text-red-800',
    labelBorder: 'border-red-500',
    iconBg: 'bg-red-200',
    image: 'https://image.pollinations.ai/prompt/cartoon%20anthill%20mound%20red%20ants%20icon%20vector?width=100&height=100&nologo=true',
    label: 'NEST'
  };

  const isLowHealth = healthPercent < 25;

  return (
    <div className={`w-24 flex flex-col items-center gap-2 h-full transition-all duration-300 ${isLowHealth ? 'animate-pulse scale-105' : ''}`}>
      <div className={`w-full flex-1 ${theme.bgColor} border-4 ${isLowHealth ? 'border-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]' : theme.borderColor} rounded-2xl overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] flex flex-col justify-end items-center p-1`}>
        {/* Health Fill Animation */}
        <div 
          className={`absolute bottom-0 left-0 right-0 ${theme.fillColor} transition-all duration-500 ease-out opacity-90`}
          style={{ height: `${healthPercent}%` }}
        />
        
        {/* Numeric Health Overlay */}
        <div className="z-10 text-center mb-2">
          <span className={`text-xl font-bold ${theme.textColor} drop-shadow-sm`}>
            {Math.ceil(currentHealth)}
          </span>
        </div>
        
        {/* Base Icon */}
        <img 
          src={theme.image}
          className={`absolute top-2 left-1/2 -translate-x-1/2 w-16 h-16 drop-shadow-lg z-10 rounded-full border-2 border-white ${theme.iconBg}`}
          alt={`${theme.label} Icon`}
        />
      </div>
      
      {/* Label Badge */}
      <div className={`font-bold ${theme.labelColor} comic-font bg-white px-2 rounded border ${theme.labelBorder}`}>
        {theme.label}
      </div>
    </div>
  );
};