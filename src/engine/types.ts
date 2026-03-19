export type InningSide = "top" | "bottom"

export interface PlayerStats {
  atBats: number
  hits: number
  rbis: number

  inningsPitched: number
  strikeoutsPitched: number
  earnedRuns: number
}

export interface GameState {
  inning: number
  inningSide: InningSide
  outs: number

  score: {
    home: number
    away: number
  }

  bases: {
    first: string | null
    second: string | null
    third: string | null
  }

  lineupHome: string[]
  lineupAway: string[]

  battingIndexHome: number
  battingIndexAway: number

  pitcherHome: string
  pitcherAway: string

  playerStats: Record<string, PlayerStats>

  history: GameState[] // For undo functionality
}