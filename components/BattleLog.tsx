import React, { useEffect, useRef } from 'react';
import { LogEntry, Faction } from '../types';

interface BattleLogProps {
  logs: LogEntry[];
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-800 text-green-400 p-4 rounded-xl border-4 border-slate-900 font-mono text-sm h-48 overflow-y-auto shadow-inner">
      {logs.length === 0 && <div className="text-center opacity-50 mt-16">Battle hasn't started yet...</div>}
      {logs.map((log) => (
        <div key={log.id} className="mb-1 border-b border-slate-700 pb-1 last:border-0">
          <span className="opacity-50 mr-2">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute:'2-digit', second:'2-digit' })}]</span>
          {log.faction && (
            <span className={`mr-2 font-bold ${log.faction === Faction.BEES ? 'text-yellow-400' : 'text-red-400'}`}>
              {log.faction === Faction.BEES ? '🐝' : '🐜'}
            </span>
          )}
          <span>{log.text}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};