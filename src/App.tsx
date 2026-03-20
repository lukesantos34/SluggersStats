import { useMemo, useState } from "react";
import type { GameState } from "./engine/types";
import { buildGameStateFromSetup } from "./lib/buildGameStateFromSetup";
import { SeasonDashboardScreen } from "./screens/SeasonDashboardScreen";
import { PregameSetupScreen } from "./screens/PregameSetupScreen";
import { LiveGameScreen } from "./screens/LiveGameScreen";

type Screen = "season" | "pregame" | "live";

interface SeasonGame {
  id: string;
  homeManager: string;
  awayManager: string;
  isComplete: boolean;
  homeScore?: number;
  awayScore?: number;
}

interface SeasonState {
  id: string;
  name: string;
  games: SeasonGame[];
}

interface StandingRow {
  manager: string;
  wins: number;
  losses: number;
  played: number;
}

interface PregameConfig {
  managerA: string;
  managerB: string;
  homeManager: string;
  awayManager: string;
  maxInnings: number;
  lineupHome: string[];
  lineupAway: string[];
  pitcherHome: string;
  pitcherAway: string;
}

interface PendingPregameContext {
  gameId: string;
  managerA: string;
  managerB: string;
}

interface LiveGameSession {
  gameId: string;
  initialState: GameState;
}

interface StartPregameInput {
  gameId?: string;
  managerA: string;
  managerB: string;
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return prefix + "_" + crypto.randomUUID();
  }

  return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}

function normalizeName(name: string, fallback: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function upsertSeasonGame(
  season: SeasonState,
  input: StartPregameInput
): { nextSeason: SeasonState; gameId: string } {
  if (input.gameId) {
    const existing = season.games.find((game) => game.id === input.gameId);
    if (existing) {
      return { nextSeason: season, gameId: existing.id };
    }
  }

  const newGame: SeasonGame = {
    id: createId("game"),
    homeManager: normalizeName(input.managerA, "Manager A"),
    awayManager: normalizeName(input.managerB, "Manager B"),
    isComplete: false,
  };

  return {
    nextSeason: {
      ...season,
      games: [...season.games, newGame],
    },
    gameId: newGame.id,
  };
}

function computeStandings(season: SeasonState | null): StandingRow[] {
  if (!season) {
    return [];
  }

  const table = new Map<string, StandingRow>();

  const ensureManager = (manager: string): StandingRow => {
    const key = normalizeName(manager, "Unknown");
    const existing = table.get(key);
    if (existing) {
      return existing;
    }

    const row: StandingRow = {
      manager: key,
      wins: 0,
      losses: 0,
      played: 0,
    };

    table.set(key, row);
    return row;
  };

  season.games.forEach((game) => {
    const home = ensureManager(game.homeManager);
    const away = ensureManager(game.awayManager);

    if (!game.isComplete || game.homeScore === undefined || game.awayScore === undefined) {
      return;
    }

    home.played += 1;
    away.played += 1;

    if (game.homeScore > game.awayScore) {
      home.wins += 1;
      away.losses += 1;
      return;
    }

    if (game.awayScore > game.homeScore) {
      away.wins += 1;
      home.losses += 1;
    }
  });

  return Array.from(table.values()).sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    if (a.losses !== b.losses) {
      return a.losses - b.losses;
    }

    return a.manager.localeCompare(b.manager);
  });
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("season");
  const [season, setSeason] = useState<SeasonState | null>(null);
  const [pendingPregame, setPendingPregame] = useState<PendingPregameContext | null>(null);
  const [liveSession, setLiveSession] = useState<LiveGameSession | null>(null);

  const standings = useMemo(() => computeStandings(season), [season]);

  function handleCreateSeason(name: string): void {
    const seasonName = normalizeName(name, "New Season");
    setSeason({
      id: createId("season"),
      name: seasonName,
      games: [],
    });
    setPendingPregame(null);
    setLiveSession(null);
    setScreen("season");
  }

  function handleAddGame(managerA: string, managerB: string): void {
    setSeason((current) => {
      if (!current) {
        return {
          id: createId("season"),
          name: "New Season",
          games: [
            {
              id: createId("game"),
              homeManager: normalizeName(managerA, "Manager A"),
              awayManager: normalizeName(managerB, "Manager B"),
              isComplete: false,
            },
          ],
        };
      }

      const nextGame: SeasonGame = {
        id: createId("game"),
        homeManager: normalizeName(managerA, "Manager A"),
        awayManager: normalizeName(managerB, "Manager B"),
        isComplete: false,
      };

      return {
        ...current,
        games: [...current.games, nextGame],
      };
    });
  }

  function handleStartPregame(input: StartPregameInput): void {
    if (!season) {
      const seededSeason: SeasonState = {
        id: createId("season"),
        name: "New Season",
        games: [],
      };

      const { nextSeason, gameId } = upsertSeasonGame(seededSeason, input);
      setSeason(nextSeason);
      setPendingPregame({
        gameId,
        managerA: normalizeName(input.managerA, "Manager A"),
        managerB: normalizeName(input.managerB, "Manager B"),
      });
      setScreen("pregame");
      return;
    }

    const { nextSeason, gameId } = upsertSeasonGame(season, input);
    setSeason(nextSeason);
    setPendingPregame({
      gameId,
      managerA: normalizeName(input.managerA, "Manager A"),
      managerB: normalizeName(input.managerB, "Manager B"),
    });
    setScreen("pregame");
  }

  function handleCancelPregame(): void {
    setPendingPregame(null);
    setScreen("season");
  }

  function handleConfirmPregame(config: PregameConfig): void {
    if (!pendingPregame) {
      return;
    }

    const initialState = buildGameStateFromSetup(config);

    setLiveSession({
      gameId: pendingPregame.gameId,
      initialState,
    });

    setScreen("live");
  }

  function handleBackToSeasonFromLive(): void {
    setLiveSession(null);
    setPendingPregame(null);
    setScreen("season");
  }

  function handleGameComplete(finalState: GameState): void {
    if (!liveSession) {
      setScreen("season");
      return;
    }

    setSeason((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        games: current.games.map((game) => {
          if (game.id !== liveSession.gameId) {
            return game;
          }

          return {
            ...game,
            isComplete: true,
            homeScore: finalState.score.home,
            awayScore: finalState.score.away,
          };
        }),
      };
    });

    setLiveSession(null);
    setPendingPregame(null);
    setScreen("season");
  }

  if (screen === "pregame" && pendingPregame) {
    return (
      <PregameSetupScreen
        managerA={pendingPregame.managerA}
        managerB={pendingPregame.managerB}
        defaultMaxInnings={3}
        onBack={handleCancelPregame}
        onConfirm={handleConfirmPregame}
      />
    );
  }

  if (screen === "live" && liveSession) {
    return (
      <LiveGameScreen
        initialGameState={liveSession.initialState}
        onBackToSeason={handleBackToSeasonFromLive}
        onGameComplete={handleGameComplete}
      />
    );
  }

  return (
    <SeasonDashboardScreen
      season={season}
      standings={standings}
      onCreateSeason={handleCreateSeason}
      onAddGame={handleAddGame}
      onStartPregame={handleStartPregame}
    />
  );
}