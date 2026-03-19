import type { GameState } from "./types"

export type PlayResult =
  | "single"
  | "double"
  | "triple"
  | "homerun"
  | "walk"
  | "strikeout"
  | "flyout"

export function applyPlay(
  state: GameState,
  result: PlayResult
): GameState {
  const newState: GameState = JSON.parse(JSON.stringify(state))

  const isTop = newState.inningSide === "top"
  const battingIndex = isTop
    ? newState.battingIndexAway
    : newState.battingIndexHome

  const lineup = isTop
    ? newState.lineupAway
    : newState.lineupHome

  const currentBatter = lineup[battingIndex]

  const playDescription = `${currentBatter} - ${result}`

  const pitcher = isTop
    ? newState.pitcherHome
    : newState.pitcherAway

  // Handle outs
  if (result === "strikeout" || result === "flyout") {
    newState.outs += 1

    newState.playerStats[currentBatter].atBats += 1
    newState.playerStats[pitcher].strikeoutsPitched +=
      result === "strikeout" ? 1 : 0
    newState.playerStats[pitcher].inningsPitched += 1

    advanceBatterIndex(newState)
    checkInningChange(newState)

    newState.playLog.push(playDescription)
    return newState
  }

  // Walk (no AB)
  if (result === "walk") {
    advanceRunners(newState, 1)
    newState.bases.first = currentBatter
    advanceBatterIndex(newState)
    newState.playLog.push(playDescription)
    return newState
  }

  // Hits
  const basesToAdvance =
    result === "single"
      ? 1
      : result === "double"
      ? 2
      : result === "triple"
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
}