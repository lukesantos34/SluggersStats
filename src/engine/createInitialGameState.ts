import type { GameState } from "./types"

const homeLineup = [
  "mario",
  "luigi",
  "peach",
  "yoshi",
  "dk",
  "toad",
  "wario",
  "bowser",
  "daisy",
]

const awayLineup = [
  "birdo",
  "donkey_kong",
  "toadette",
  "boo",
  "waluigi",
  "koopa",
  "shy_guy",
  "dry_bones",
  "petey",
]

function createEmptyStats() {
  return {
    atBats: 0,
    hits: 0,
    rbis: 0,
    strikeoutsPitched: 0,
    earnedRuns: 0,
    inningsPitched: 0,
  }
}

export function createInitialGameState(): GameState {
  const allPlayers = [...homeLineup, ...awayLineup]

  const playerStats: GameState["playerStats"] = {}

  allPlayers.forEach((player) => {
    playerStats[player] = createEmptyStats()
  })

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

    lineupHome: homeLineup,
    lineupAway: awayLineup,

    battingIndexHome: 0,
    battingIndexAway: 0,

    pitcherHome: "mario",
    pitcherAway: "birdo",

    playerStats,

    playLog: [],
  }
}