import { useState } from "react"
import { createInitialGameState } from "./engine/createInitialGameState"
import { applyPlay, type PlayResult } from "./engine/applyPlay"

export default function App() {
  const [gameState, setGameState] = useState(
    createInitialGameState()
  )

  const [history, setHistory] = useState<
    typeof gameState[]
  >([])

  function handlePlay(result: PlayResult) {
    setHistory((prev) => [...prev, gameState])
    const newState = applyPlay(gameState, result)
    setGameState(newState)
  }

  function handleUndo() {
    if (history.length === 0) return

    const previous = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setGameState(previous)
  }

  const isTop = gameState.inningSide === "top"
  const lineup = isTop
    ? gameState.lineupAway
    : gameState.lineupHome
  const battingIndex = isTop
    ? gameState.battingIndexAway
    : gameState.battingIndexHome
  const currentBatter = lineup[battingIndex]

  return (
    <div className="min-h-screen bg-gray-100 p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">
        SluggerStats
      </h1>

      {/* Scoreboard */}
      <div className="bg-white rounded-xl shadow p-4 space-y-2">
        <div className="flex justify-between text-lg font-semibold">
          <span>Away: {gameState.score.away}</span>
          <span>Home: {gameState.score.home}</span>
        </div>

        <div className="flex justify-between">
          <span>
            Inning: {gameState.inning}{" "}
            {gameState.inningSide}
          </span>
          <span>Outs: {gameState.outs}</span>
        </div>
      </div>

      {/* Bases */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div></div>
          <div>
            2B: {gameState.bases.second ?? "-"}
          </div>
          <div></div>

          <div>
            3B: {gameState.bases.third ?? "-"}
          </div>
          <div></div>
          <div>
            1B: {gameState.bases.first ?? "-"}
          </div>
        </div>
      </div>

      {/* Current Batter */}
      <div className="bg-white rounded-xl shadow p-4 space-y-2">
        <p className="font-semibold text-lg">
          Current Batter: {currentBatter}
        </p>

        <div className="text-sm">
          <p>
            H/AB: {gameState.playerStats[currentBatter].hits}/{gameState.playerStats[currentBatter].atBats}
          </p>
          <p>
            {gameState.playerStats[currentBatter].rbis} RBI
          </p>
        </div>
      </div>

      {/* On Deck / In The Hole */}
      <div className="bg-white rounded-xl shadow p-4">
        <p className="font-medium">
          On Deck: {
            lineup[(battingIndex + 1) % lineup.length]
          }
        </p>
        <p className="font-medium">
          In The Hole: {
            lineup[(battingIndex + 2) % lineup.length]
          }
        </p>
      </div>

      {/* Current Pitcher */}
      <div className="bg-white rounded-xl shadow p-4 space-y-2">
        <p className="font-semibold text-lg">
          Pitcher: {
            isTop
              ? gameState.pitcherHome
              : gameState.pitcherAway
          }
        </p>

        <div className="text-sm">
          <p>
            Strikeouts: {
              gameState.playerStats[
                isTop
                  ? gameState.pitcherHome
                  : gameState.pitcherAway
              ].strikeoutsPitched
            }
          </p>
          <p>
            Innings Pitched: {
              gameState.playerStats[
                isTop
                  ? gameState.pitcherHome
                  : gameState.pitcherAway
              ].inningsPitched
            }
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handlePlay("single")}
          className="bg-green-500 text-white rounded-lg p-2"
        >
          Single
        </button>
        <button
          onClick={() => handlePlay("double")}
          className="bg-green-600 text-white rounded-lg p-2"
        >
          Double
        </button>
        <button
          onClick={() => handlePlay("triple")}
          className="bg-green-700 text-white rounded-lg p-2"
        >
          Triple
        </button>
        <button
          onClick={() => handlePlay("homerun")}
          className="bg-green-800 text-white rounded-lg p-2"
        >
          Home Run
        </button>

        <button
          onClick={() => handlePlay("walk")}
          className="bg-blue-500 text-white rounded-lg p-2"
        >
          Walk
        </button>
        <button
          onClick={() => handlePlay("strikeout")}
          className="bg-red-500 text-white rounded-lg p-2"
        >
          Strikeout
        </button>
        <button
          onClick={() => handlePlay("flyout")}
          className="bg-red-600 text-white rounded-lg p-2 col-span-2"
        >
          Flyout
        </button>
      </div>

      {/* Undo */}
      <button
        onClick={handleUndo}
        className="w-full bg-gray-700 text-white rounded-lg p-2"
      >
        Undo
      </button>
    </div>
  )
}