export interface PregameConfig {
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

export interface StartPregameInput {
  gameId?: string;
  managerA: string;
  managerB: string;
}
