export function buildGameStateFromSetup(setup: any): any {
  // This function should take the pregame setup configuration and build the initial GameState
  // For now, we'll return a stubbed GameState. You can expand this based on your actual GameState structure.
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
        lineupHome: setup.lineupHome,
        lineupAway: setup.lineupAway,
        battingIndexHome: 0,
        battingIndexAway: 0,
        pitcherHome: setup.pitcherHome,
        pitcherAway: setup.pitcherAway,
        playerStats: {}, // You can initialize player stats based on the lineup
        playLog: [],
    }
}