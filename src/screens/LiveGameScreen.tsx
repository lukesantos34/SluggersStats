import { useEffect, useMemo, useRef, useState } from "react";
import { applyPlay, type PlayResult } from "../engine/applyPlay";
import type { GameState } from "../engine/types";

type Tab = "game" | "log" | "team1" | "team2";

type PlayBuilderState =
  | { step: "root" }
  | { step: "outType" }
  | { step: "strikeoutType" }
  | {
      step: "outLocation";
      outKind: "groundout" | "lineout" | "flyout" | "popout";
    };

type LiveGameScreenProps = {
  initialGameState: GameState;
  onBackToSeason: () => void;
  onGameComplete: (finalState: GameState) => void;
};

const OUTFIELD_POSITIONS = [
  "pitcher",
  "catcher",
  "first",
  "second",
  "shortstop",
  "third",
  "left",
  "center",
  "right",
] as const;

function getInningDisplay(state: GameState): string {
  if (state.isGameOver) {
    if (state.inning - 1 > state.maxInnings) {
      return "Final / " + String(state.inning - 1);
    }
    return "Final";
  }
  return String(state.inning) + " " + state.inningSide;
}

function TeamStatsBlock({
  title,
  lineup,
  state,
}: {
  title: string;
  lineup: string[];
  state: GameState;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-300">
        {title}
      </h3>
      <div className="space-y-2">
        {lineup.map((name) => {
          const stats = state.playerStats[name];
          return (
            <div
              key={name}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm"
            >
              <div className="font-semibold text-zinc-100">{name}</div>
              <div className="mt-1 text-zinc-400">
                AB {stats?.atBats ?? 0} • H {stats?.hits ?? 0} • RBI{" "}
                {stats?.rbis ?? 0}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LiveGameScreen({
  initialGameState,
  onBackToSeason,
  onGameComplete,
}: LiveGameScreenProps) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [history, setHistory] = useState<GameState[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("game");
  const [playBuilder, setPlayBuilder] = useState<PlayBuilderState>({
    step: "root",
  });

  const didNotifyCompletion = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGameState(initialGameState);
    setHistory([]);
    setActiveTab("game");
    setPlayBuilder({ step: "root" });
    didNotifyCompletion.current = false;
  }, [initialGameState]);

  useEffect(() => {
    if (gameState.isGameOver && !didNotifyCompletion.current) {
      didNotifyCompletion.current = true;
      onGameComplete(gameState);
    }
  }, [gameState, onGameComplete]);

  const isTop = gameState.inningSide === "top";

  const lineup = useMemo(
    () => (isTop ? gameState.lineupAway : gameState.lineupHome),
    [gameState.lineupAway, gameState.lineupHome, isTop],
  );

  const battingIndex = isTop
    ? gameState.battingIndexAway
    : gameState.battingIndexHome;
  const currentBatter = lineup[battingIndex] ?? "-";

  function handlePlay(result: PlayResult): void {
    if (gameState.isGameOver) return;
    setHistory((prev) => [...prev, gameState]);
    setGameState(applyPlay(gameState, result));
  }

  function applyAndReset(result: PlayResult): void {
    handlePlay(result);
    setPlayBuilder({ step: "root" });
  }

  function handleUndo(): void {
    if (history.length === 0 || gameState.isGameOver) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setGameState(previous);
  }

  function finalizeStrikeout(kind: "looking" | "swinging"): void {
    applyAndReset({ type: "strikeout", kind });
  }

  function finalizeFieldOut(
    type: "groundout" | "lineout" | "flyout" | "popout",
    location: string,
  ): void {
    applyAndReset({ type, location });
  }

  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <header className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3 shadow-xl shadow-black/25">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
              Live Game
            </p>
            <h1 className="text-xl font-semibold text-zinc-50">SluggerStats</h1>
          </div>
          <button
            type="button"
            onClick={onBackToSeason}
            className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700"
          >
            Season
          </button>
        </header>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3 shadow-xl shadow-black/20">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300">
                Away
              </p>
              <p className="text-2xl font-bold text-zinc-50">
                {gameState.score.away}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-zinc-400">
                Inning
              </p>
              <p className="text-lg font-semibold text-zinc-100">
                {getInningDisplay(gameState)}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Outs: {gameState.outs}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-right sm:text-left">
              <p className="text-xs uppercase tracking-wide text-emerald-300">
                Home
              </p>
              <p className="text-2xl font-bold text-zinc-50">
                {gameState.score.home}
              </p>
            </div>
          </div>
        </section>

        <nav className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("game")}
            className={
              "min-h-11 rounded-xl px-2 text-xs font-semibold transition sm:text-sm " +
              (activeTab === "game"
                ? "bg-cyan-500 text-zinc-950"
                : "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700")
            }
          >
            Game
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("log")}
            className={
              "min-h-11 rounded-xl px-2 text-xs font-semibold transition sm:text-sm " +
              (activeTab === "log"
                ? "bg-cyan-500 text-zinc-950"
                : "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700")
            }
          >
            Play Log
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("team1")}
            className={
              "min-h-11 rounded-xl px-2 text-xs font-semibold transition sm:text-sm " +
              (activeTab === "team1"
                ? "bg-cyan-500 text-zinc-950"
                : "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700")
            }
          >
            Team 1
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("team2")}
            className={
              "min-h-11 rounded-xl px-2 text-xs font-semibold transition sm:text-sm " +
              (activeTab === "team2"
                ? "bg-cyan-500 text-zinc-950"
                : "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700")
            }
          >
            Team 2
          </button>
        </nav>

        <main className="min-h-0 flex-1 overflow-hidden">
          {activeTab === "game" && (
            <div className="grid h-full gap-3 md:grid-cols-2">
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
                  Game View
                </h2>
                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <div className="mb-2 text-sm font-semibold text-zinc-100">
                    Bases
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1">
                      1B: {gameState.bases.first ?? "-"}
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1">
                      2B: {gameState.bases.second ?? "-"}
                    </div>
                    <div className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1">
                      3B: {gameState.bases.third ?? "-"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-sm">
                  <div className="text-zinc-400">Current Batter</div>
                  <div className="text-lg font-semibold text-zinc-100">
                    {currentBatter}
                  </div>
                  <div className="mt-2 text-zinc-400">
                    AB {gameState.playerStats[currentBatter]?.atBats ?? 0} • H{" "}
                    {gameState.playerStats[currentBatter]?.hits ?? 0} • RBI{" "}
                    {gameState.playerStats[currentBatter]?.rbis ?? 0}
                  </div>
                </div>
              </section>

              <section className="min-h-0 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
                  Recent Plays
                </h2>
                <div className="mt-3 h-[calc(100%-1.75rem)] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-sm">
                  {gameState.playLog.length === 0 ? (
                    <p className="text-zinc-500">No plays yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {gameState.playLog
                        .slice()
                        .reverse()
                        .map((play, index) => (
                          <p
                            key={String(index) + "-" + play}
                            className="text-zinc-200"
                          >
                            {play}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === "log" && (
            <section className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
                Play by Play
              </h2>
              <div className="mt-3 h-[calc(100%-1.75rem)] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-sm">
                {gameState.playLog.length === 0 ? (
                  <p className="text-zinc-500">No plays yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {gameState.playLog.map((play, index) => (
                      <p
                        key={String(index) + "-" + play}
                        className="text-zinc-200"
                      >
                        {play}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "team1" && (
            <TeamStatsBlock
              title="Home Team"
              lineup={gameState.lineupHome}
              state={gameState}
            />
          )}

          {activeTab === "team2" && (
            <TeamStatsBlock
              title="Away Team"
              lineup={gameState.lineupAway}
              state={gameState}
            />
          )}
        </main>

        {activeTab === "game" && !gameState.isGameOver && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3 shadow-xl shadow-black/20">
            {playBuilder.step === "root" && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPlayBuilder({ step: "outType" })}
                  className="col-span-3 min-h-14 rounded-xl bg-rose-500 px-3 text-base font-bold text-zinc-50 transition hover:bg-rose-400"
                >
                  OUT
                </button>

                <button
                  type="button"
                  onClick={() => applyAndReset({ type: "single" })}
                  className="min-h-12 rounded-xl bg-emerald-400 px-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
                >
                  1B
                </button>
                <button
                  type="button"
                  onClick={() => applyAndReset({ type: "double" })}
                  className="min-h-12 rounded-xl bg-emerald-500 px-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  2B
                </button>
                <button
                  type="button"
                  onClick={() => applyAndReset({ type: "triple" })}
                  className="min-h-12 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-zinc-50 transition hover:bg-emerald-500"
                >
                  3B
                </button>
                <button
                  type="button"
                  onClick={() => applyAndReset({ type: "homerun" })}
                  className="min-h-12 rounded-xl bg-emerald-700 px-3 text-sm font-semibold text-zinc-50 transition hover:bg-emerald-600"
                >
                  HR
                </button>
                <button
                  type="button"
                  onClick={() => applyAndReset({ type: "walk" })}
                  className="min-h-12 rounded-xl bg-cyan-500 px-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
                >
                  BB
                </button>
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="col-span-3 min-h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Undo
                </button>
              </div>
            )}

            {playBuilder.step === "outType" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlayBuilder({ step: "strikeoutType" })}
                  className="col-span-2 min-h-12 rounded-xl bg-rose-600 px-3 text-sm font-semibold text-zinc-50 transition hover:bg-rose-500"
                >
                  Strikeout
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPlayBuilder({
                      step: "outLocation",
                      outKind: "groundout",
                    })
                  }
                  className="min-h-12 rounded-xl bg-rose-500 px-3 text-sm font-semibold text-zinc-50 transition hover:bg-rose-400"
                >
                  Groundout
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPlayBuilder({ step: "outLocation", outKind: "lineout" })
                  }
                  className="min-h-12 rounded-xl bg-rose-500 px-3 text-sm font-semibold text-zinc-50 transition hover:bg-rose-400"
                >
                  Lineout
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPlayBuilder({ step: "outLocation", outKind: "flyout" })
                  }
                  className="min-h-12 rounded-xl bg-rose-500 px-3 text-sm font-semibold text-zinc-50 transition hover:bg-rose-400"
                >
                  Flyout
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPlayBuilder({ step: "outLocation", outKind: "popout" })
                  }
                  className="min-h-12 rounded-xl bg-rose-500 px-3 text-sm font-semibold text-zinc-50 transition hover:bg-rose-400"
                >
                  Popout
                </button>
                <button
                  type="button"
                  onClick={() => setPlayBuilder({ step: "root" })}
                  className="col-span-2 min-h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700"
                >
                  Back
                </button>
              </div>
            )}

            {playBuilder.step === "strikeoutType" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => finalizeStrikeout("looking")}
                  className="min-h-12 rounded-xl bg-rose-600 px-3 text-sm font-semibold text-zinc-50 transition hover:bg-rose-500"
                >
                  Looking
                </button>
                <button
                  type="button"
                  onClick={() => finalizeStrikeout("swinging")}
                  className="min-h-12 rounded-xl bg-rose-600 px-3 text-sm font-semibold text-zinc-50 transition hover:bg-rose-500"
                >
                  Swinging
                </button>
                <button
                  type="button"
                  onClick={() => setPlayBuilder({ step: "outType" })}
                  className="col-span-2 min-h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700"
                >
                  Back
                </button>
              </div>
            )}

            {playBuilder.step === "outLocation" && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {OUTFIELD_POSITIONS.map((position) => (
                  <button
                    type="button"
                    key={position}
                    onClick={() =>
                      finalizeFieldOut(playBuilder.outKind, position)
                    }
                    className="min-h-12 rounded-xl bg-rose-500 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-50 transition hover:bg-rose-400"
                  >
                    {position}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPlayBuilder({ step: "outType" })}
                  className="col-span-3 min-h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700 sm:col-span-5"
                >
                  Back
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
