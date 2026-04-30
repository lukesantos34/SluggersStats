// buildResolvedPlay.ts - Builds engine-ready ResolvedPlay objects from simple UI choices

import type {
  Base,
  ContactType,
  FieldLocation,
  GameState,
  OccupiedBase,
  ResolvedPlay,
  RunnerOutcome,
} from "./types"

function getCurrentBatter(state: GameState): string {
  if (state.inningSide === "top") {
    return state.lineupAway[state.battingIndexAway]
  }

  return state.lineupHome[state.battingIndexHome]
}

function getRunnerOutcomesFromBases(state: GameState): RunnerOutcome[] {
  const runners: RunnerOutcome[] = []

  if (state.bases.third) {
    runners.push({
      playerId: state.bases.third,
      from: "third",
      finalResult: "safe",
      finalBase: "third",
    })
  }

  if (state.bases.second) {
    runners.push({
      playerId: state.bases.second,
      from: "second",
      finalResult: "safe",
      finalBase: "second",
    })
  }

  if (state.bases.first) {
    runners.push({
      playerId: state.bases.first,
      from: "first",
      finalResult: "safe",
      finalBase: "first",
    })
  }

  return runners
}

function advanceBase(base: OccupiedBase, amount: number): Base {
  const baseOrder: Base[] = ["first", "second", "third", "home"]
  const currentIndex = baseOrder.indexOf(base)
  const nextIndex = Math.min(currentIndex + amount, baseOrder.length - 1)

  return baseOrder[nextIndex]
}

function getHitBase(result: "single" | "double" | "triple" | "inside_the_park_home_run"): Base {
  if (result === "single") return "first"
  if (result === "double") return "second"
  if (result === "triple") return "third"
  return "home"
}

function getAdvanceAmount(result: "single" | "double" | "triple" | "inside_the_park_home_run") {
  if (result === "single") return 1
  if (result === "double") return 2
  if (result === "triple") return 3
  return 4
}

function formatLocation(location: FieldLocation): string {
  const names: Record<FieldLocation, string> = {
    P: "pitcher",
    C: "catcher",
    "1B": "first",
    "2B": "second",
    SS: "shortstop",
    "3B": "third",
    LF: "left",
    CF: "center",
    RF: "right",
  }

  return names[location]
}

function formatHitResult(result: "single" | "double" | "triple" | "inside_the_park_home_run"): string {
  if (result === "inside_the_park_home_run") return "inside-the-park home run"
  return result
}

export function buildBasicOutPlay(
  state: GameState,
  input: {
    result: "strikeout" | "groundout" | "flyout" | "lineout" | "popout" | "bunt_out"
    strikeoutType?: "swinging" | "looking"
    location?: FieldLocation
  }
): ResolvedPlay {
  const batter = getCurrentBatter(state)

  const runners = getRunnerOutcomesFromBases(state)

  let playByPlay = ""

  if (input.result === "strikeout") {
    playByPlay = `${batter} struck out ${input.strikeoutType ?? "swinging"}.`
  } else {
    const locationText = input.location ? formatLocation(input.location) : "the field"

    const outText: Record<
    "groundout" | "flyout" | "lineout" | "popout" | "bunt_out",
    string
    > = {
    groundout: "grounded out",
    flyout: "flied out",
    lineout: "lined out",
    popout: "popped out",
    bunt_out: "bunted out",
    }

    playByPlay = `${batter} ${outText[input.result]} to ${locationText}.`
  }

  return {
    category: "out",
    result: input.result,
    contactType:
      input.result === "groundout"
        ? "ground"
        : input.result === "flyout"
          ? "fly"
          : input.result === "lineout"
            ? "line"
            : input.result === "popout"
              ? "pop"
              : input.result === "bunt_out"
                ? "bunt"
                : undefined,
    location: input.location,

    batter: {
      playerId: batter,
      statCredit: input.result === "strikeout" ? "strikeout" : "out",
      finalResult: "out",
      outType: input.result === "strikeout" ? "strikeout" : "caught",
    },

    // For basic outs, runners are suggested to hold.
    // If runners exist, the runner board can edit these.
    runners,

    outsAdded: 1,
    runsScored: [],

    playByPlay,
  }
}

export function buildBasicHitPlay(
  state: GameState,
  input: {
    result: "single" | "double" | "triple" | "inside_the_park_home_run"
    contactType: ContactType
    location: FieldLocation
  }
): ResolvedPlay {
  const batter = getCurrentBatter(state)

  const hitBase = getHitBase(input.result)
  const advanceAmount = getAdvanceAmount(input.result)

  const runners: RunnerOutcome[] = getRunnerOutcomesFromBases(state).map((runner) => {
    const destination = advanceBase(runner.from, advanceAmount)

    if (destination === "home") {
      return {
        playerId: runner.playerId,
        from: runner.from,
        finalResult: "scored",
        rbiCredit: true,
      }
    }

    return {
      playerId: runner.playerId,
      from: runner.from,
      finalResult: "safe",
      finalBase: destination,
    }
  })

  const batterScored = hitBase === "home"

  const playByPlay =
    input.result === "inside_the_park_home_run"
      ? `${batter} hit an inside-the-park home run to ${formatLocation(input.location)}.`
      : `${batter} ${formatHitResult(input.result)}d to ${formatLocation(input.location)}.`

  return {
    category: "hit",
    result: input.result,
    contactType: input.contactType,
    location: input.location,

    batter: {
      playerId: batter,
      statCredit: input.result === "inside_the_park_home_run" ? "home_run" : input.result,
      reachedBase: hitBase,
      finalResult: batterScored ? "scored" : "safe",
      finalBase: batterScored ? undefined : hitBase,
    },

    runners,

    outsAdded: 0,
    runsScored: [
      ...runners
        .filter((runner) => runner.finalResult === "scored")
        .map((runner) => runner.playerId),
      ...(batterScored ? [batter] : []),
    ],

    playByPlay,
  }
}

export function buildHomeRunPlay(
  state: GameState,
  input: {
    direction: "left" | "center" | "right"
  }
): ResolvedPlay {
  const batter = getCurrentBatter(state)

  const runners: RunnerOutcome[] = getRunnerOutcomesFromBases(state).map((runner) => ({
    playerId: runner.playerId,
    from: runner.from,
    finalResult: "scored",
    rbiCredit: true,
  }))

  return {
    category: "home_run",
    result: "home_run",

    batter: {
      playerId: batter,
      statCredit: "home_run",
      reachedBase: "home",
      finalResult: "scored",
    },

    runners,

    outsAdded: 0,
    runsScored: [
      ...runners.map((runner) => runner.playerId),
      batter,
    ],

    playByPlay: `${batter} homered to ${input.direction}.`,
  }
}

export function buildWalkOrHbpPlay(
  state: GameState,
  input: {
    result: "walk" | "hit_by_pitch"
  }
): ResolvedPlay {
  const batter = getCurrentBatter(state)

  const runners: RunnerOutcome[] = []

  const first = state.bases.first
  const second = state.bases.second
  const third = state.bases.third

  // Force movement only.
  if (first && second && third) {
    runners.push({
      playerId: third,
      from: "third",
      finalResult: "scored",
      rbiCredit: input.result === "walk" || input.result === "hit_by_pitch",
    })

    runners.push({
      playerId: second,
      from: "second",
      finalResult: "safe",
      finalBase: "third",
    })

    runners.push({
      playerId: first,
      from: "first",
      finalResult: "safe",
      finalBase: "second",
    })
  } else if (first && second) {
    runners.push({
      playerId: second,
      from: "second",
      finalResult: "safe",
      finalBase: "third",
    })

    runners.push({
      playerId: first,
      from: "first",
      finalResult: "safe",
      finalBase: "second",
    })
  } else if (first) {
    runners.push({
      playerId: first,
      from: "first",
      finalResult: "safe",
      finalBase: "second",
    })
  }

  // Runners who are not forced stay where they are.
  if (third && !(first && second && third)) {
    runners.push({
      playerId: third,
      from: "third",
      finalResult: "safe",
      finalBase: "third",
    })
  }

  if (second && !first) {
    runners.push({
      playerId: second,
      from: "second",
      finalResult: "safe",
      finalBase: "second",
    })
  }

  const runsScored = runners
    .filter((runner) => runner.finalResult === "scored")
    .map((runner) => runner.playerId)

  return {
    category: "walk_hbp",
    result: input.result,

    batter: {
      playerId: batter,
      statCredit: input.result,
      reachedBase: "first",
      finalResult: "safe",
      finalBase: "first",
    },

    runners,

    outsAdded: 0,
    runsScored,

    playByPlay:
      input.result === "walk"
        ? `${batter} walked.`
        : `${batter} was hit by a pitch.`,
  }
}