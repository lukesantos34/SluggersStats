// applyPlay.ts - Core logic for applying a play result to the game state
import type {
  GameState,
  OccupiedBase,
  ResolvedPlay,
} from "./types"

export type PlayResult =
  | { type: "single" }
  | { type: "double" }
  | { type: "triple" }
  | { type: "homerun" }
  | { type: "walk" }
  | { type: "strikeout"; kind: "looking" | "swinging" }
  | { type: "groundout"; location: string }
  | { type: "lineout"; location: string }
  | { type: "flyout"; location: string }
  | { type: "popout"; location: string }

function buildPlayDescription(
  batter: string,
  result: PlayResult
): string {
  if (result.type === "single") return `${batter} singled.`
  if (result.type === "double") return `${batter} doubled.`
  if (result.type === "triple") return `${batter} tripled.`
  if (result.type === "homerun") return `${batter} hit a home run.`
  if (result.type === "walk") return `${batter} walked.`

  if (result.type === "strikeout") {
    return result.kind === "looking"
      ? `${batter} struck out looking.`
      : `${batter} struck out swinging.`
  }

  if (result.type === "lineout") {
    return `${batter} lined out to ${result.location}.`
  }

  if (result.type === "groundout") {
    return `${batter} grounded out to ${result.location}.`
  }

  if (result.type === "flyout") {
    return `${batter} flied out to ${result.location}.`
  }

  if (result.type === "popout") {
    return `${batter} popped out to ${result.location}.`
  }

  return ""
}

export function applyPlay(
  state: GameState,
  result: PlayResult
): GameState {
  if (state.isGameOver) return state
  
  const newState: GameState = JSON.parse(JSON.stringify(state))

  const isTop = newState.inningSide === "top"
  const battingIndex = isTop
    ? newState.battingIndexAway
    : newState.battingIndexHome

  const lineup = isTop
    ? newState.lineupAway
    : newState.lineupHome

  const currentBatter = lineup[battingIndex]

  const playDescription = buildPlayDescription(
    currentBatter,
    result
  )

  const pitcher = isTop
    ? newState.pitcherHome
    : newState.pitcherAway

  // Handle outs
  if (result.type === "strikeout" || result.type === "flyout") {
    newState.outs += 1

    newState.playerStats[currentBatter].atBats += 1
    newState.playerStats[pitcher].strikeoutsPitched +=
      result.type === "strikeout" ? 1 : 0
    newState.playerStats[pitcher].inningsPitched += 1

    advanceBatterIndex(newState)
    checkInningChange(newState)

    newState.playLog.push(playDescription)
    return newState
  }

  // Walk (no AB)
  if (result.type === "walk") {
    advanceRunners(newState, 1)
    newState.bases.first = currentBatter
    checkPostPlayEndConditions(newState)
    advanceBatterIndex(newState)
    newState.playLog.push(playDescription)
    return newState
  }

  // Hits
  const basesToAdvance =
    result.type === "single"
      ? 1
      : result.type === "double"
      ? 2
      : result.type === "triple"
      ? 3
      : 4

  newState.playerStats[currentBatter].atBats += 1
  newState.playerStats[currentBatter].hits += 1

  advanceRunners(newState, basesToAdvance)

  if (basesToAdvance < 4) {
    placeBatter(newState, basesToAdvance, currentBatter)
  } else {
    scoreRun(newState, currentBatter)
  }

  checkPostPlayEndConditions(newState)
  advanceBatterIndex(newState)
  newState.playLog.push(playDescription)
  return newState
}



function cloneState(state: GameState): GameState {
  return structuredClone(state)
}

function getBattingTeam(state: GameState): "away" | "home" {
  return state.inningSide === "top" ? "away" : "home"
}

function getPitchingTeam(state: GameState): "away" | "home" {
  return state.inningSide === "top" ? "home" : "away"
}

function getCurrentPitcher(state: GameState): string {
  if (getPitchingTeam(state) === "home") {
    return state.pitcherHome
  }

  return state.pitcherAway
}

function advanceBatter(state: GameState) {
  if (state.inningSide === "top") {
    state.battingIndexAway =
      (state.battingIndexAway + 1) % state.lineupAway.length
  } else {
    state.battingIndexHome =
      (state.battingIndexHome + 1) % state.lineupHome.length
  }
}

function scoreResolvedRun(state: GameState) {
  const battingTeam = getBattingTeam(state)

  if (battingTeam === "away") {
    state.score.away += 1
  } else {
    state.score.home += 1
  }
}

function clearBases(state: GameState) {
  state.bases.first = null
  state.bases.second = null
  state.bases.third = null
}

function setBase(state: GameState, base: OccupiedBase, playerId: string) {
  state.bases[base] = playerId
}

function clearBase(state: GameState, base: OccupiedBase) {
  state.bases[base] = null
}

function isAtBat(statCredit: ResolvedPlay["batter"]["statCredit"]) {
  return statCredit !== "walk" && statCredit !== "hit_by_pitch"
}

function isHit(statCredit: ResolvedPlay["batter"]["statCredit"]) {
  return (
    statCredit === "single" ||
    statCredit === "double" ||
    statCredit === "triple" ||
    statCredit === "home_run"
  )
}

function handleInningTransition(state: GameState) {
  if (state.outs < 3) return

  clearBases(state)

  if (state.inningSide === "top") {
    state.inningSide = "bottom"
    state.outs = 0
    return
  }

  if (
    state.inningSide === "bottom" &&
    state.inning >= state.maxInnings &&
    state.score.home !== state.score.away
  ) {
    state.isGameOver = true
    state.outs = 3
    return
  }

  state.inning += 1
  state.inningSide = "top"
  state.outs = 0
}

function checkResolvedWalkOff(state: GameState) {
  if (
    state.inningSide === "bottom" &&
    state.inning >= state.maxInnings &&
    state.score.home > state.score.away
  ) {
    state.isGameOver = true
  }
}

function applyBatterStats(state: GameState, play: ResolvedPlay) {
  const batter = play.batter.playerId
  const stats = state.playerStats[batter]

  if (!stats) return

  if (isAtBat(play.batter.statCredit)) {
    stats.atBats += 1
  }

  if (isHit(play.batter.statCredit)) {
    stats.hits += 1
  }

  const rbisFromRunners = play.runners.filter(
    (runner) => runner.finalResult === "scored" && runner.rbiCredit
  ).length

  const rbiFromSelf =
    play.batter.finalResult === "scored" &&
    play.batter.statCredit === "home_run"
      ? 1
      : 0

  stats.rbis += rbisFromRunners + rbiFromSelf
}

function applyPitcherStats(state: GameState, play: ResolvedPlay) {
  const pitcher = getCurrentPitcher(state)
  const stats = state.playerStats[pitcher]

  if (!stats) return

  if (play.result === "strikeout") {
    stats.strikeoutsPitched += 1
  }

  // This is simple for now. Later we can separate earned/unearned runs.
  stats.earnedRuns += play.runsScored.length

  // Current stat name says inningsPitched, but we are storing fractional innings here.
  // Later we may replace this with outsPitched for better accuracy.
  stats.inningsPitched += play.outsAdded / 3
}

function applyRunnerOutcomes(state: GameState, play: ResolvedPlay) {
  play.runners.forEach((runner) => {
    clearBase(state, runner.from)

    if (runner.finalResult === "safe" && runner.finalBase) {
      setBase(state, runner.finalBase, runner.playerId)
    }

    if (runner.finalResult === "scored") {
      scoreResolvedRun(state)
    }
  })
}

function applyBatterOutcome(state: GameState, play: ResolvedPlay) {
  const batter = play.batter.playerId

  if (play.batter.finalResult === "safe" && play.batter.finalBase) {
    setBase(state, play.batter.finalBase, batter)
  }

  if (play.batter.finalResult === "scored") {
    scoreResolvedRun(state)
  }
}

/**
 * Applies a fully resolved play to the game state.
 *
 * This function does not guess what happened.
 * It only applies the facts already stored in ResolvedPlay.
 */
export function applyResolvedPlay(
  currentState: GameState,
  play: ResolvedPlay
): GameState {
  if (currentState.isGameOver) {
    return currentState
  }

  const newState = cloneState(currentState)

  applyBatterStats(newState, play)
  applyPitcherStats(newState, play)

  applyRunnerOutcomes(newState, play)
  applyBatterOutcome(newState, play)

  newState.outs += play.outsAdded

  advanceBatter(newState)

  newState.playLog.push(play.playByPlay)

  checkResolvedWalkOff(newState)
  handleInningTransition(newState)

  return newState
}

function advanceBatterIndex(state: GameState) {
  if (state.inningSide === "top") {
    state.battingIndexAway =
      (state.battingIndexAway + 1) % state.lineupAway.length
  } else {
    state.battingIndexHome =
      (state.battingIndexHome + 1) % state.lineupHome.length
  }
}

function advanceRunners(state: GameState, bases: number) {
  const { third, second, first } = state.bases

  state.bases.third = null
  state.bases.second = null
  state.bases.first = null

  if (third) moveRunner(state, third, 3 + bases)
  if (second) moveRunner(state, second, 2 + bases)
  if (first) moveRunner(state, first, 1 + bases)
}

function moveRunner(
  state: GameState,
  runner: string,
  targetBase: number
) {
  if (targetBase >= 4) {
    scoreRun(state, runner)
  } else if (targetBase === 3) {
    state.bases.third = runner
  } else if (targetBase === 2) {
    state.bases.second = runner
  } else if (targetBase === 1) {
    state.bases.first = runner
  }
}

function placeBatter(
  state: GameState,
  bases: number,
  batter: string
) {
  if (bases === 3) state.bases.third = batter
  if (bases === 2) state.bases.second = batter
  if (bases === 1) state.bases.first = batter
}

function scoreRun(state: GameState, player: string) {
  if (state.inningSide === "top") {
    state.score.away += 1
  } else {
    state.score.home += 1
  }

  state.playerStats[player].rbis += 1
  state.playLog.push(`${player} scores a run`)
}

function checkInningChange(state: GameState) {
  if (state.outs < 3) return

  state.outs = 0
  state.bases.first = null
  state.bases.second = null
  state.bases.third = null

  if (state.inningSide === "top") {
    state.inningSide = "bottom"
  } else {
    state.inningSide = "top"
    state.inning += 1
  }

  checkEndOfInningMercy(state)
  checkGameEnd(state)
}

function checkGameEnd(state: GameState) {
  const { inning, maxInnings, inningSide, score } = state

  const home = score.home
  const away = score.away

  // If we have not reached the final inning yet, never end
  if (inning < maxInnings) return

  // Case 1:
  // We just finished the TOP of the final inning.
  // That means inningSide just switched TO "bottom".
  if (inning === maxInnings && inningSide === "bottom") {
    // If home team already leading, no need to play bottom
    if (home > away) {
      state.isGameOver = true
    }
    return
  }

  // Case 2:
  // We just finished the BOTTOM of an inning.
  // That means inningSide just switched TO "top".
  if (inningSide === "top" && inning > maxInnings) {
    // If scores are not tied, game is over
    if (home !== away) {
      state.isGameOver = true
    }
  }
}

function checkPostPlayEndConditions(state: GameState) {
  checkImmediateMercy(state)
  checkWalkOff(state)
}

function checkWalkOff(state: GameState) {
  const { inning, maxInnings, inningSide, score } = state

  // Must be bottom half
  if (inningSide !== "bottom") return

  // Must be final inning or later
  if (inning < maxInnings) return

  // If home takes the lead, game ends immediately
  if (score.home > score.away) {
    state.isGameOver = true
  }
}

function checkImmediateMercy(state: GameState) {
  const { inningSide, score } = state

  const diff = score.home - score.away

  // Only applies during bottom half
  if (inningSide === "bottom" && diff >= 10) {
    state.isGameOver = true
  }
}

function checkEndOfInningMercy(state: GameState) {
  const diff = Math.abs(state.score.home - state.score.away)

  if (diff >= 10) {
    state.isGameOver = true
  }
}