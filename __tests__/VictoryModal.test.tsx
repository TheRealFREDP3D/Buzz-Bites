import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VictoryModal } from '../components/VictoryModal';
import { GamePhase } from '../types';

describe('VictoryModal', () => {
  describe('rendering branches', () => {
    it('renders null when gamePhase === "playing"', () => {
      const { container } = render(
        <VictoryModal
          gamePhase="playing"
          completedLevel={1}
          message=""
          onNextLevel={() => {}}
          onRestart={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders "Level N Complete!" when gamePhase === "level_victory"', () => {
      render(
        <VictoryModal
          gamePhase="level_victory"
          completedLevel={1}
          message="Great job!"
          onNextLevel={() => {}}
          onRestart={() => {}}
        />
      );
      expect(screen.getByText('Level 1 Complete!')).toBeInTheDocument();
    });

    it('renders "Next Level" button when gamePhase === "level_victory"', () => {
      render(
        <VictoryModal
          gamePhase="level_victory"
          completedLevel={1}
          message="Great job!"
          onNextLevel={() => {}}
          onRestart={() => {}}
        />
      );
      expect(screen.getByRole('button', { name: /Next Level/i })).toBeInTheDocument();
    });

    it('renders "Game Over" when gamePhase === "game_over"', () => {
      render(
        <VictoryModal
          gamePhase="game_over"
          completedLevel={3}
          message=""
          onNextLevel={() => {}}
          onRestart={() => {}}
        />
      );
      expect(screen.getByText('Game Over')).toBeInTheDocument();
    });

    it('renders "Reached Level N" when gamePhase === "game_over"', () => {
      render(
        <VictoryModal
          gamePhase="game_over"
          completedLevel={5}
          message=""
          onNextLevel={() => {}}
          onRestart={() => {}}
        />
      );
      expect(screen.getByText('Reached Level 5')).toBeInTheDocument();
    });

    it('renders "Play Again" button when gamePhase === "game_over"', () => {
      render(
        <VictoryModal
          gamePhase="game_over"
          completedLevel={3}
          message=""
          onNextLevel={() => {}}
          onRestart={() => {}}
        />
      );
      expect(screen.getByRole('button', { name: /Play Again/i })).toBeInTheDocument();
    });
  });

  describe('button click handlers', () => {
    it('calls onNextLevel when "Next Level" button is clicked', () => {
      const onNextLevel = vi.fn();
      render(
        <VictoryModal
          gamePhase="level_victory"
          completedLevel={1}
          message=""
          onNextLevel={onNextLevel}
          onRestart={() => {}}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /Next Level/i }));
      expect(onNextLevel).toHaveBeenCalledTimes(1);
    });

    it('calls onRestart when "Play Again" button is clicked', () => {
      const onRestart = vi.fn();
      render(
        <VictoryModal
          gamePhase="game_over"
          completedLevel={3}
          message=""
          onNextLevel={() => {}}
          onRestart={onRestart}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /Play Again/i }));
      expect(onRestart).toHaveBeenCalledTimes(1);
    });
  });
});

// Property-based tests
import * as fc from 'fast-check';

describe('VictoryModal — property-based tests', () => {
  /**
   * Property 6: Victory screen message matches the completed level number
   * Validates: Requirements 5.1
   */
  it('Property 6: victory screen message matches completed level number', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (n) => {
        const { container } = render(
          <VictoryModal
            gamePhase="level_victory"
            completedLevel={n}
            message=""
            onNextLevel={() => {}}
            onRestart={() => {}}
          />
        );
        return container.textContent?.includes(`Level ${n} Complete!`) ?? false;
      }),
      { numRuns: 25 }
    );
  });
});
