import { GameEngineConfig, DEFAULT_ENGINE_CONFIG } from './GameEngine';

export interface DifficultyConfig extends GameEngineConfig {}

/**
 * Pure function. Returns a GameEngineConfig scaled for the given level.
 * Level 1 returns values equal to DEFAULT_ENGINE_CONFIG for the scaled fields.
 */
export function difficultyScaler(level: number): DifficultyConfig {
  // Scaling increments per level above 1
  const levelsAboveBase = Math.max(0, level - 1);

  return {
    ...DEFAULT_ENGINE_CONFIG,
    aiSpawnChance:       clamp(DEFAULT_ENGINE_CONFIG.aiSpawnChance       + levelsAboveBase * 0.01, 0, 0.25),
    aiEconomyPriority:   clamp(DEFAULT_ENGINE_CONFIG.aiEconomyPriority   + levelsAboveBase * 0.05, 0, 0.95),
    aiEliteUnitChance:   clamp(DEFAULT_ENGINE_CONFIG.aiEliteUnitChance   + levelsAboveBase * 0.03, 0, 0.70),
    aiSpecialUnitChance: clamp(DEFAULT_ENGINE_CONFIG.aiSpecialUnitChance + levelsAboveBase * 0.02, 0, 0.50),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
