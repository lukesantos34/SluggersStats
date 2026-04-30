/* eslint-disable @typescript-eslint/no-explicit-any */
import { type FormEvent, useMemo, useState } from "react";

type StartPregameInput = {
  managerA: string;
  managerB: string;
};

type SeasonDashboardScreenProps = {
  season: { name: string; games: any[] } | null;
  standings: any;
  onCreateSeason(name: string): void;
  onAddGame(managerA: string, managerB: string): void;
  onStartPregame(input: StartPregameInput): void;
};

type DisplayGame = {
  id: string;
  managerA: string;
  managerB: string;
  isComplete: boolean;
};

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toDisplayGame(game: unknown, index: number): DisplayGame {
  const raw = (typeof game === "object" && game !== null ? game : {}) as Record<
    string,
    unknown
  >;

  return {
    id: readString(raw.id, "game-" + String(index + 1)),
    managerA: readString(
      raw.managerA,
      readString(raw.homeManager, "Manager A " + String(index + 1)),
    ),
    managerB: readString(
      raw.managerB,
      readString(raw.awayManager, "Manager B " + String(index + 1)),
    ),
    isComplete: readBoolean(raw.isComplete, false),
  };
}

export function SeasonDashboardScreen({
  season,
  standings,
  onCreateSeason,
  onAddGame,
  onStartPregame,
}: SeasonDashboardScreenProps) {
  const [seasonName, setSeasonName] = useState("");
  const [managerA, setManagerA] = useState("");
  const [managerB, setManagerB] = useState("");

  const games = useMemo<DisplayGame[]>(() => {
    if (!season) return [];
    return season.games.map((game, index) => toDisplayGame(game, index));
  }, [season]);

  function handleCreateSeason(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const name = seasonName.trim();
    if (!name) return;
    onCreateSeason(name);
    setSeasonName("");
  }

  function handleAddGame(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const a = managerA.trim();
    const b = managerB.trim();
    if (!a || !b) return;
    onAddGame(a, b);
    setManagerA("");
    setManagerB("");
  }

  function handleSetup(game: DisplayGame): void {
    onStartPregame({
      managerA: game.managerA,
      managerB: game.managerB,
    });
  }

  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <header className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-xl shadow-black/25">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
            SluggerStats
          </p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-zinc-50">
            Season Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create a season, schedule games, and launch setup.
          </p>
        </header>
        {!season ? (
          <main className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-4">
            <div className="mx-auto grid h-full max-w-xl content-center">
              <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                <h2 className="text-lg font-semibold text-zinc-100">
                  Create Season
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Give your season a name to begin.
                </p>

                <form onSubmit={handleCreateSeason} className="mt-4 grid gap-3">
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-zinc-300">Season Name</span>
                    <input
                      value={seasonName}
                      onChange={(event) => setSeasonName(event.target.value)}
                      placeholder="Spring 2026 League"
                      className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100 outline-none ring-cyan-400/60 transition focus:ring-2"
                    />
                  </label>

                  <button
                    type="submit"
                    className="min-h-12 rounded-xl bg-cyan-500 px-4 text-base font-semibold text-zinc-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
                  >
                    Create Season
                  </button>
                </form>
              </section>
            </div>
          </main>
        ) : (
          <main className="min-h-0 flex-1 overflow-hidden">
            <div className="grid h-full gap-3 lg:grid-cols-[1.05fr_1.2fr]">
              <section className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
                    Active Season
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-50">
                    {season.name}
                  </h2>
                </div>

                <form
                  onSubmit={handleAddGame}
                  className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"
                >
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Schedule New Game
                  </h3>

                  <label className="grid gap-1.5 text-sm">
                    <span className="text-zinc-300">Manager A</span>
                    <input
                      value={managerA}
                      onChange={(event) => setManagerA(event.target.value)}
                      placeholder="Mario"
                      className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100 outline-none ring-cyan-400/60 transition focus:ring-2"
                    />
                  </label>

                  <label className="grid gap-1.5 text-sm">
                    <span className="text-zinc-300">Manager B</span>
                    <input
                      value={managerB}
                      onChange={(event) => setManagerB(event.target.value)}
                      placeholder="Luigi"
                      className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100 outline-none ring-emerald-400/60 transition focus:ring-2"
                    />
                  </label>

                  <button
                    type="submit"
                    className="min-h-12 rounded-xl bg-emerald-500 px-4 text-base font-semibold text-zinc-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
                  >
                    Add Game
                  </button>
                </form>

                <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Standings
                  </h3>
                  <div className="mt-2 text-sm text-zinc-300">
                    {Array.isArray(standings) && standings.length > 0 ? (
                      <div className="space-y-2">
                        {standings.map((row: any, index: number) => {
                          const manager = readString(
                            row?.manager,
                            "Manager " + String(index + 1),
                          );
                          const wins =
                            typeof row?.wins === "number"
                              ? String(row.wins)
                              : "-";
                          const losses =
                            typeof row?.losses === "number"
                              ? String(row.losses)
                              : "-";

                          return (
                            <div
                              key={manager + "-" + String(index)}
                              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2"
                            >
                              <span className="font-medium text-zinc-100">
                                {manager}
                              </span>
                              <span className="text-zinc-400">
                                {wins} - {losses}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-zinc-400">No standings yet.</p>
                    )}
                  </div>
                </section>
              </section>

              <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-4">
                <div className="mb-3 flex items-end justify-between">
                  <h3 className="text-lg font-semibold text-zinc-100">
                    Scheduled Games
                  </h3>
                  <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                    {games.length} total
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {games.length === 0 ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                      No games scheduled yet. Add one from the form.
                    </div>
                  ) : (
                    <ul className="grid gap-2">
                      {games.map((game) => (
                        <li
                          key={game.id}
                          className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-zinc-100">
                              {game.managerA} vs {game.managerB}
                            </p>
                            <span
                              className={
                                game.isComplete
                                  ? "rounded-full border border-emerald-500/50 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300"
                                  : "rounded-full border border-cyan-500/50 bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-300"
                              }
                            >
                              {game.isComplete ? "Completed" : "Scheduled"}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSetup(game)}
                            className="mt-3 min-h-11 w-full rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-zinc-950 shadow-md shadow-cyan-500/25 transition hover:bg-cyan-400"
                          >
                            Setup Game
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
