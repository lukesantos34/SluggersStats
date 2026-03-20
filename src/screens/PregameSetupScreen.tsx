import { useMemo, useState } from "react";

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

interface PregameSetupScreenProps {
  managerA: string;
  managerB: string;
  defaultMaxInnings?: number;
  onBack: () => void;
  onConfirm: (config: PregameConfig) => void;
}

type ManagerSlot = "A" | "B";

const LINEUP_SIZE = 9;

function makeDefaultLineup(prefix: string): string[] {
  return Array.from({ length: LINEUP_SIZE }, (_, i) => `${prefix} Player ${i + 1}`);
}

function cleanName(value: string): string {
  return value.trim();
}

export function PregameSetupScreen({
  managerA: managerAProp,
  managerB: managerBProp,
  defaultMaxInnings = 3,
  onBack,
  onConfirm,
}: PregameSetupScreenProps) {
  const [managerAName, setManagerAName] = useState(managerAProp);
  const [managerBName, setManagerBName] = useState(managerBProp);

  const [homeSlot, setHomeSlot] = useState<ManagerSlot | null>(null);
  const [maxInnings, setMaxInnings] = useState<number>(defaultMaxInnings);

  const [lineupA, setLineupA] = useState<string[]>(() =>
    makeDefaultLineup(cleanName(managerAProp) || "Team A")
  );
  const [lineupB, setLineupB] = useState<string[]>(() =>
    makeDefaultLineup(cleanName(managerBProp) || "Team B")
  );

  const [pitcherA, setPitcherA] = useState<string>(lineupA[0] ?? "");
  const [pitcherB, setPitcherB] = useState<string>(lineupB[0] ?? "");
  const [errors, setErrors] = useState<string[]>([]);

  const homeManager = useMemo(() => {
    if (!homeSlot) return "";
    return homeSlot === "A" ? cleanName(managerAName) : cleanName(managerBName);
  }, [homeSlot, managerAName, managerBName]);

  const awayManager = useMemo(() => {
    if (!homeSlot) return "";
    return homeSlot === "A" ? cleanName(managerBName) : cleanName(managerAName);
  }, [homeSlot, managerAName, managerBName]);

  function updateLineup(
    team: "A" | "B",
    index: number,
    value: string
  ): void {
    if (team === "A") {
      setLineupA((prev) => prev.map((p, i) => (i === index ? value : p)));
      return;
    }

    setLineupB((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function handleCoinFlip(): void {
    const result: ManagerSlot = Math.random() < 0.5 ? "A" : "B";
    setHomeSlot(result);
  }

  function handleSwapHomeAway(): void {
    if (!homeSlot) return;
    setHomeSlot((prev) => (prev === "A" ? "B" : "A"));
  }

  function validate(): string[] {
    const nextErrors: string[] = [];
    const mA = cleanName(managerAName);
    const mB = cleanName(managerBName);

    if (!mA) nextErrors.push("Manager A name is required.");
    if (!mB) nextErrors.push("Manager B name is required.");
    if (mA && mB && mA.toLowerCase() === mB.toLowerCase()) {
      nextErrors.push("Manager names must be different.");
    }

    if (!homeSlot) nextErrors.push("Run coin flip to assign home and away.");

    if (!Number.isInteger(maxInnings) || maxInnings < 1 || maxInnings > 20) {
      nextErrors.push("Max innings must be an integer between 1 and 20.");
    }

    const cleanedA = lineupA.map(cleanName);
    const cleanedB = lineupB.map(cleanName);

    if (cleanedA.some((p) => !p)) nextErrors.push("Team A lineup must have 9 names.");
    if (cleanedB.some((p) => !p)) nextErrors.push("Team B lineup must have 9 names.");

    const aSet = new Set(cleanedA.map((p) => p.toLowerCase()));
    const bSet = new Set(cleanedB.map((p) => p.toLowerCase()));

    if (aSet.size !== cleanedA.length) nextErrors.push("Team A lineup contains duplicate names.");
    if (bSet.size !== cleanedB.length) nextErrors.push("Team B lineup contains duplicate names.");

    if (!cleanedA.includes(cleanName(pitcherA))) {
      nextErrors.push("Team A starting pitcher must be in Team A lineup.");
    }

    if (!cleanedB.includes(cleanName(pitcherB))) {
      nextErrors.push("Team B starting pitcher must be in Team B lineup.");
    }

    return nextErrors;
  }

  function handleConfirm(): void {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.length > 0 || !homeSlot) return;

    const cleanedA = lineupA.map(cleanName);
    const cleanedB = lineupB.map(cleanName);

    const isAHome = homeSlot === "A";

    onConfirm({
      managerA: cleanName(managerAName),
      managerB: cleanName(managerBName),
      homeManager: isAHome ? cleanName(managerAName) : cleanName(managerBName),
      awayManager: isAHome ? cleanName(managerBName) : cleanName(managerAName),
      maxInnings,
      lineupHome: isAHome ? cleanedA : cleanedB,
      lineupAway: isAHome ? cleanedB : cleanedA,
      pitcherHome: isAHome ? cleanName(pitcherA) : cleanName(pitcherB),
      pitcherAway: isAHome ? cleanName(pitcherB) : cleanName(pitcherA),
    });
  }

  const cleanedLineupA = lineupA.map(cleanName).filter(Boolean);
  const cleanedLineupB = lineupB.map(cleanName).filter(Boolean);

  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <header className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-xl shadow-black/25">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">SluggerStats</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-zinc-50">
            Pregame Setup
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Configure managers, home/away, innings, lineups, and starting pitchers.
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-4">
          <div className="grid gap-4">
            <section className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              <h2 className="text-sm font-semibold text-zinc-100">Managers</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-zinc-300">Manager A</span>
                  <input
                    value={managerAName}
                    onChange={(e) => setManagerAName(e.target.value)}
                    className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100 outline-none ring-cyan-400/60 transition focus:ring-2"
                    placeholder="Manager A"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="text-zinc-300">Manager B</span>
                  <input
                    value={managerBName}
                    onChange={(e) => setManagerBName(e.target.value)}
                    className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100 outline-none ring-cyan-400/60 transition focus:ring-2"
                    placeholder="Manager B"
                  />
                </label>
              </div>
            </section>

            <section className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              <h2 className="text-sm font-semibold text-zinc-100">Home / Away Assignment</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCoinFlip}
                  className="min-h-12 rounded-xl bg-cyan-500 px-4 text-base font-semibold text-zinc-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
                >
                  Coin Flip
                </button>
                <button
                  type="button"
                  onClick={handleSwapHomeAway}
                  disabled={!homeSlot}
                  className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-base font-semibold text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Swap Home/Away
                </button>
              </div>

              <div className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                <p className="text-zinc-300">
                  Home: <span className="font-semibold text-zinc-100">{homeManager || "Not assigned"}</span>
                </p>
                <p className="text-zinc-300">
                  Away: <span className="font-semibold text-zinc-100">{awayManager || "Not assigned"}</span>
                </p>
              </div>
            </section>

            <section className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              <h2 className="text-sm font-semibold text-zinc-100">Game Length</h2>
              <label className="grid max-w-xs gap-1.5 text-sm">
                <span className="text-zinc-300">Max Innings</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxInnings}
                  onChange={(e) => setMaxInnings(Number(e.target.value))}
                  className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100 outline-none ring-cyan-400/60 transition focus:ring-2"
                />
              </label>
            </section>

            <section className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              <h2 className="text-sm font-semibold text-zinc-100">Lineups & Starting Pitchers</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <h3 className="text-sm font-semibold text-cyan-300">
                    Team A: {cleanName(managerAName) || "Manager A"}
                  </h3>
                  {lineupA.map((player, index) => (
                    <input
                      key={`a-${index}`}
                      value={player}
                      onChange={(e) => updateLineup("A", index, e.target.value)}
                      className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none ring-cyan-400/60 transition focus:ring-2"
                      placeholder={`A Batter ${index + 1}`}
                    />
                  ))}
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-zinc-300">Starting Pitcher (Team A)</span>
                    <select
                      value={pitcherA}
                      onChange={(e) => setPitcherA(e.target.value)}
                      className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none ring-cyan-400/60 transition focus:ring-2"
                    >
                      {cleanedLineupA.map((name) => (
                        <option key={`a-p-${name}`} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-2">
                  <h3 className="text-sm font-semibold text-emerald-300">
                    Team B: {cleanName(managerBName) || "Manager B"}
                  </h3>
                  {lineupB.map((player, index) => (
                    <input
                      key={`b-${index}`}
                      value={player}
                      onChange={(e) => updateLineup("B", index, e.target.value)}
                      className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none ring-emerald-400/60 transition focus:ring-2"
                      placeholder={`B Batter ${index + 1}`}
                    />
                  ))}
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-zinc-300">Starting Pitcher (Team B)</span>
                    <select
                      value={pitcherB}
                      onChange={(e) => setPitcherB(e.target.value)}
                      className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none ring-emerald-400/60 transition focus:ring-2"
                    >
                      {cleanedLineupB.map((name) => (
                        <option key={`b-p-${name}`} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </section>

            {errors.length > 0 && (
              <section className="rounded-xl border border-rose-700/70 bg-rose-950/40 p-3">
                <h2 className="text-sm font-semibold text-rose-200">Setup Issues</h2>
                <ul className="mt-2 space-y-1 text-sm text-rose-100">
                  {errors.map((error) => (
                    <li key={error}>• {error}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        <footer className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-base font-semibold text-zinc-100 transition hover:bg-zinc-700"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="min-h-12 rounded-xl bg-emerald-500 px-4 text-base font-semibold text-zinc-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            Start Game
          </button>
        </footer>
      </div>
    </div>
  );
}