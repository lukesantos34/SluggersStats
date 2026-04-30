import type { GameState, PlayerStats } from "../engine/types";
import type { PregameConfig } from "../types/pregame";

function createEmptyStats(): PlayerStats {
  return {
    atBats: 0,
    hits: 0,
    rbis: 0,
    inningsPitched: 0,
    strikeoutsPitched: 0,
    earnedRuns: 0,
  };
}

export function buildGameStateFromSetup(config: PregameConfig): GameState {
  const uniquePlayers = new Set<string>([
    ...config.lineupHome,
    ...config.lineupAway,
    config.pitcherHome,
    config.pitcherAway,
  ]);

  const playerStats: Record<string, PlayerStats> = {};

  uniquePlayers.forEach((playerName) => {
    playerStats[playerName] = createEmptyStats();
  });

  return {
    inning: 1,
    inningSide: "top",
    outs: 0,
    score: {
      home: 0,
      away: 0,
    },
    bases: {
      first: null,
      second: null,
      third: null,
    },
    lineupHome: config.lineupHome,
    lineupAway: config.lineupAway,
    battingIndexHome: 0,
    battingIndexAway: 0,
    pitcherHome: config.pitcherHome,
    pitcherAway: config.pitcherAway,
    playerStats,
    playLog: [],
    maxInnings: config.maxInnings,
    isGameOver: false,
  };
}
