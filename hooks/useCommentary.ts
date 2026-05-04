import { useEffect, useCallback } from 'react';
import { Faction } from '../types';
import { generateBattleCommentary, generateVictoryMessage } from '../services/geminiService';

export interface UseCommentaryReturn {
  handleCommentaryTrigger: (event: string, winningFaction: Faction, territoryRatio: number) => Promise<void>;
  handleVictoryMessage: (winner: Faction) => Promise<void>;
}

export function useCommentary(
  isLoadingCommentary: boolean,
  onUpdateCommentary: (commentary: string, isLoading?: boolean) => void,
  triggerCommentaryForEvent?: string,
  gameActive?: boolean,
  winner?: Faction | null,
  beeBaseHealth?: number,
  antBaseHealth?: number
): UseCommentaryReturn {
  
  const handleCommentaryTrigger = useCallback(async (
    event: string, 
    winningFaction: Faction, 
    territoryRatio: number
  ) => {
    if (isLoadingCommentary) return;

    onUpdateCommentary("", true); // Set loading state

    if (import.meta.env.VITE_GEMINI_API_KEY) {
      try {
        const comment = await generateBattleCommentary(winningFaction, event, territoryRatio);
        onUpdateCommentary(comment, false);
      } catch (error) {
        console.error("Failed to generate commentary:", error);
        onUpdateCommentary(event, false); // Fallback to event text
      }
    } else {
      onUpdateCommentary(event, false); // No API key, use event text
    }
  }, [isLoadingCommentary, onUpdateCommentary]);

  const handleVictoryMessage = useCallback(async (winner: Faction) => {
    try {
      const message = await generateVictoryMessage(winner);
      onUpdateCommentary(message, false);
    } catch (error) {
      console.error("Failed to generate victory message:", error);
      onUpdateCommentary(`${winner} have conquered the backyard!`, false);
    }
  }, [onUpdateCommentary]);

  // Handle event commentary triggers
  useEffect(() => {
    if (triggerCommentaryForEvent && !isLoadingCommentary) {
      const territoryRatio = beeBaseHealth && antBaseHealth 
        ? (beeBaseHealth / (beeBaseHealth + antBaseHealth)) * 100 
        : 50;
      const winningFaction = territoryRatio > 50 ? Faction.BEES : Faction.ANTS;

      handleCommentaryTrigger(triggerCommentaryForEvent, winningFaction, territoryRatio);
    }
  }, [triggerCommentaryForEvent, isLoadingCommentary, beeBaseHealth, antBaseHealth, handleCommentaryTrigger]);

  // Handle victory messages
  useEffect(() => {
    if (!gameActive && winner) {
      handleVictoryMessage(winner);
    }
  }, [gameActive, winner, handleVictoryMessage]);

  return {
    handleCommentaryTrigger,
    handleVictoryMessage
  };
}
