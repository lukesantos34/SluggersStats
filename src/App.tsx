// App.tsx - Main React component for the SluggerStats application
import { useState } from "react"
import { createInitialGameState } from "./engine/createInitialGameState"
import { applyPlay, type PlayResult } from "./engine/applyPlay"

export default function App() {
  const [gameState, setGameState] = useState(
    createInitialGameState()
  )

  const getInningDisplay = () => {
    if (gameState.isGameOver) {
      // Extra innings case
      if (gameState.inning - 1 > gameState.maxInnings) {
        return `Final / ${gameState.inning - 1}`
      }

      return "Final"
    }

    return `${gameState.inning} ${gameState.inningSide}`
  }

  const [history, setHistory] = useState<
    typeof gameState[]
  >([])

  type PlayBuilder =
    | { step: "root" }
    | { step: "outType" }
    | { step: "strikeoutType" }
    | { step: "outLocation"; outKind: "groundout" | "lineout" | "flyout" | "popout" }


  const [playBuilder, setPlayBuilder] = useState<PlayBuilder>({
    step: "root",
  })

  function handlePlay(result: PlayResult) {
    setHistory((prev) => [...prev, gameState])
    const newState = applyPlay(gameState, result)
    setGameState(newState)
  }

  function applyAndReset(result: PlayResult) {
    handlePlay(result)
    setPlayBuilder({ step: "root" })
  }

  function handleUndo() {
    if (history.length === 0) return

    const previous = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setGameState(previous)
  }

  function finalizeStrikeout(kind: "looking" | "swinging") {
    applyAndReset({ type: "strikeout", kind })
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
            {getInningDisplay()}
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

    {playBuilder.step === "root" && (
      <div className="grid grid-cols-3 gap-2 text-xs">
        <button
          onClick={() => setPlayBuilder({ step: "outType" })}
          className="bg-red-500 text-white rounded p-2 col-span-3"
        >
          OUT
        </button>

        <button
          onClick={() => applyAndReset({ type: "single" })}
          className="bg-green-500 text-white rounded p-2"
        >
          1B
        </button>

        <button
          onClick={() => applyAndReset({ type: "double" })}
          className="bg-green-600 text-white rounded p-2"
        >
          2B
        </button>

        <button
          onClick={() => applyAndReset({ type: "homerun" })}
          className="bg-green-800 text-white rounded p-2"
        >
          HR
        </button>

        <button
          onClick={() => applyAndReset({ type: "triple" })}
          className="bg-green-700 text-white rounded p-2"
        >
          3B
        </button>

        <button
          onClick={() => applyAndReset({ type: "walk" })}
          className="bg-blue-500 text-white rounded p-2"
        >
          BB
        </button>

        <button
          onClick={handleUndo}
          className="bg-gray-700 text-white rounded p-2 col-span-3"
        >
          Undo
        </button>
      </div>
    )}

    {playBuilder.step === "outType" && (
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={() => setPlayBuilder({ step: "strikeoutType" })}
          className="bg-red-600 text-white rounded p-2 col-span-2"
        >
          Strikeout
        </button>

        <button
          onClick={() =>
            setPlayBuilder({ step: "outLocation", outKind: "groundout" })
          }
          className="bg-red-500 text-white rounded p-2"
        >
          Groundout
        </button>

        <button
          onClick={() =>
            setPlayBuilder({ step: "outLocation", outKind: "lineout" })
          }
          className="bg-red-500 text-white rounded p-2"
        >
          Lineout
        </button>

        <button
          onClick={() =>
            setPlayBuilder({ step: "outLocation", outKind: "flyout" })
          }
          className="bg-red-500 text-white rounded p-2"
        >
          Flyout
        </button>

        <button
          onClick={() =>
            setPlayBuilder({ step: "outLocation", outKind: "popout" })
          }
          className="bg-red-500 text-white rounded p-2"
        >
          Popout
        </button>

        <button
          onClick={() => setPlayBuilder({ step: "root" })}
          className="bg-gray-700 text-white rounded p-2 col-span-2"
        >
          Back
        </button>
      </div>
    )}    

    {playBuilder.step === "strikeoutType" && (
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={() => finalizeStrikeout("looking")}
          className="bg-red-600 text-white rounded p-2"
        >
          Looking
        </button>

        <button
          onClick={() => finalizeStrikeout("swinging")}
          className="bg-red-600 text-white rounded p-2"
        >
          Swinging
        </button>

        <button
          onClick={() => setPlayBuilder({ step: "outType" })}
          className="bg-gray-700 text-white rounded p-2 col-span-2"
        >
          Back
        </button>
      </div>
    )}
    
    </div>
  )
}