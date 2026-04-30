// applyPlay.ts - Core logic for applying a play result to the game state
import type { GameState } from "./types"

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