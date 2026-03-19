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
    <div className="h-screen bg-gray-100 p-3 flex flex-col gap-3">
      <h1 className="text-xl font-bold text-center">
        SluggerStats
      </h1>

      {/* Top Section */}
      <div className="bg-white rounded-xl shadow p-3 text-sm">
        <div className="flex justify-between font-semibold">
          <span>Away: {gameState.score.away}</span>
          <span>Home: {gameState.score.home}</span>
        </div>

        <div className="flex justify-between">
          <span>
            {gameState.inning} {gameState.inningSide}
          </span>
          <span>Outs: {gameState.outs}</span>
        </div>
      </div>

      {/* Middle Section */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* Left: Bases + Stats */}
        <div className="flex-1 bg-white rounded-xl shadow p-3 text-xs space-y-2">
          <div>
            2B: {gameState.bases.second ?? "-"}
          </div>
          <div className="flex justify-between">
            <span>
              3B: {gameState.bases.third ?? "-"}
            </span>
            <span>
              1B: {gameState.bases.first ?? "-"}
            </span>
          </div>

          <div className="pt-2 border-t">
            <p className="font-semibold">
              {currentBatter}
            </p>
            <p>
              AB: {gameState.playerStats[currentBatter].atBats}
            </p>
            <p>
              H: {gameState.playerStats[currentBatter].hits}
            </p>
            <p>
              RBI: {gameState.playerStats[currentBatter].rbis}
            </p>
          </div>
        </div>

        {/* Right: Play Log */}
        <div className="flex-1 bg-white rounded-xl shadow p-3 text-xs overflow-y-auto">
          <p className="font-semibold mb-2">
            Play Log
          </p>
          {gameState.playLog
            .slice()
            .reverse()
            .map((play, index) => (
              <p key={index}>{play}</p>
            ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <button onClick={() => handlePlay("single")} className="bg-green-500 text-white rounded p-1">
          1B
        </button>
        <button onClick={() => handlePlay("double")} className="bg-green-600 text-white rounded p-1">
          2B
        </button>
        <button onClick={() => handlePlay("triple")} className="bg-green-700 text-white rounded p-1">
          3B
        </button>
        <button onClick={() => handlePlay("homerun")} className="bg-green-800 text-white rounded p-1">
          HR
        </button>
        <button onClick={() => handlePlay("walk")} className="bg-blue-500 text-white rounded p-1">
          BB
        </button>
        <button onClick={() => handlePlay("strikeout")} className="bg-red-500 text-white rounded p-1">
          K
        </button>
        <button onClick={() => handlePlay("flyout")} className="bg-red-600 text-white rounded p-1 col-span-2">
          Fly
        </button>
        <button onClick={handleUndo} className="bg-gray-700 text-white rounded p-1">
          Undo
        </button>
      </div>
    </div>
  )
}