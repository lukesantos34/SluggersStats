// types.ts - Type definitions for the baseball game state, player statistics, and resolved plays

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

  playLog: string[]

  maxInnings: number
  isGameOver: boolean
}

/**
 * Bases used by the play engine.
 *
 * "home" is included because runners/batter can score,
 * but only first/second/third exist as occupied bases in GameState.
 */
export type Base = "first" | "second" | "third" | "home"

export type OccupiedBase = Exclude<Base, "home">

/**
 * Where the ball was hit.
 *
 * These are intentionally simple for now.
 * We do not care about exact fielding sequence yet.
 */
export type FieldLocation =
  | "P"
  | "C"
  | "1B"
  | "2B"
  | "SS"
  | "3B"
  | "LF"
  | "CF"
  | "RF"

/**
 * How the ball was contacted.
 */
export type ContactType =
  | "ground"
  | "line"
  | "fly"
  | "pop"
  | "bunt"

/**
 * How a player was put out.
 */
export type OutType =
  | "force"
  | "tag"
  | "doubled_off"
  | "caught"
  | "strikeout"
  | "other"

/**
 * What the batter gets statistical credit for.
 *
 * This is separate from the batter's final result.
 *
 * Example:
 * Batter hits a double but gets tagged out trying for third.
 * statCredit = "double"
 * finalResult = "out"
 * outAt = "third"
 */
export type BatterStatCredit =
  | "out"
  | "strikeout"
  | "single"
  | "double"
  | "triple"
  | "home_run"
  | "walk"
  | "hit_by_pitch"
  | "fielders_choice"
  | "error"

/**
 * Final batter outcome for a resolved play.
 */
export interface BatterOutcome {
  playerId: string

  /**
   * What stat the batter receives.
   */
  statCredit: BatterStatCredit

  /**
   * The base the batter initially earned/reached.
   *
   * Example:
   * Single = first
   * Double = second
   * Walk = first
   *
   * This can still exist even if the batter is later out advancing.
   */
  reachedBase?: Base

  /**
   * Final result after all play chaos is resolved.
   */
  finalResult: "safe" | "out" | "scored"

  /**
   * Final base if the batter ends the play safely on base.
   */
  finalBase?: OccupiedBase

  /**
   * Base where the batter was out, if finalResult is "out".
   */
  outAt?: Base

  /**
   * Type of out, if finalResult is "out".
   */
  outType?: OutType
}

/**
 * Final runner outcome for a resolved play.
 */
export interface RunnerOutcome {
  playerId: string

  /**
   * Where the runner started before the play.
   */
  from: OccupiedBase

  /**
   * Final result after all play chaos is resolved.
   */
  finalResult: "safe" | "out" | "scored"

  /**
   * Final base if the runner ends safely on base.
   */
  finalBase?: OccupiedBase

  /**
   * Base where the runner was out, if finalResult is "out".
   */
  outAt?: Base

  /**
   * Type of out, if finalResult is "out".
   */
  outType?: OutType

  /**
   * Whether this runner scoring should give the batter an RBI.
   *
   * We may keep this simple at first, but this gives us control later.
   */
  rbiCredit?: boolean
}

/**
 * Final, engine-ready play.
 *
 * This is what applyPlay should eventually receive.
 * The UI can collect the play in any order, but it should eventually build this shape.
 */
export interface ResolvedPlay {
  category: "out" | "hit" | "home_run" | "walk_hbp" | "custom"

  result:
    | "strikeout"
    | "groundout"
    | "flyout"
    | "lineout"
    | "popout"
    | "bunt_out"
    | "single"
    | "double"
    | "triple"
    | "home_run"
    | "inside_the_park_home_run"
    | "walk"
    | "hit_by_pitch"
    | "fielders_choice"
    | "error"
    | "custom"

  contactType?: ContactType
  location?: FieldLocation

  batter: BatterOutcome
  runners: RunnerOutcome[]

  outsAdded: number
  runsScored: string[]

  /**
   * One sentence recap for the play log.
   *
   * Example:
   * "Mario doubled to left, scoring Luigi, but was tagged out trying for third."
   */
  playByPlay: string
}