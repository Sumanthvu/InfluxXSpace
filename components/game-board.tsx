"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface GameStats {
  level: number
  round: number
  score: number
  keys: number
  highScore: number
  keysCollected: number
  totalKeysCollected: number
  sessionScore: number
  roundsCompleted: number
}

interface GameBoardProps {
  gameStats: GameStats
  setGameStats: (stats: GameStats | ((prev: GameStats) => GameStats)) => void
  isConnected: boolean
  isSyncing: boolean
  onSyncToBlockchain: () => void
  onEndGameAndGoHome: () => void
  onLevelComplete: (newLevel: number, totalScore: number) => void
}

interface Position {
  x: number
  y: number
}

interface Enemy {
  id: number
  position: Position
  direction: Position
}

const GRID_SIZE = 10

// Get number of rounds for each level
const getRoundsForLevel = (level: number): number => {
  return level * 5 // Level 1: 5 rounds, Level 2: 10 rounds, etc.
}

export default function GameBoard({
  gameStats,
  setGameStats,
  isConnected,
  isSyncing,
  onSyncToBlockchain,
  onEndGameAndGoHome,
  onLevelComplete,
}: GameBoardProps) {
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 0, y: 0 })
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [keys, setKeys] = useState<Position[]>([])
  const [gameState, setGameState] = useState<"playing" | "paused" | "gameOver" | "roundComplete" | "levelComplete">(
    "playing",
  )
  const [keysRemaining, setKeysRemaining] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [canReachSpaceship, setCanReachSpaceship] = useState(false)
  const { toast } = useToast()

  // Use refs to prevent toast calls during render
  const hasShownRoundStart = useRef(false)
  const hasShownAllKeysCollected = useRef(false)

  // Calculate game complexity based on level and round
  const getGameComplexity = useCallback(() => {
    const baseEnemies = 2
    const baseKeys = 3

    // Increase enemy count every 2 rounds
    const roundEnemyIncrease = Math.floor((gameStats.round - 1) / 2)
    const levelEnemyIncrease = Math.floor((gameStats.level - 1) / 2)

    const enemyCount = Math.min(baseEnemies + roundEnemyIncrease + levelEnemyIncrease, 8)
    const keyCount = Math.min(
      baseKeys + Math.floor((gameStats.level - 1) / 3) + Math.floor((gameStats.round - 1) / 4),
      6,
    )
    return { enemyCount, keyCount }
  }, [gameStats.level, gameStats.round])

  // Initialize round
  const initializeRound = useCallback(() => {
    setPlayerPosition({ x: 0, y: 0 })
    setCanReachSpaceship(false)
    setGameState("playing")
    hasShownRoundStart.current = false
    hasShownAllKeysCollected.current = false

    const { enemyCount, keyCount } = getGameComplexity()

    // Generate enemies
    const newEnemies: Enemy[] = []
    for (let i = 0; i < enemyCount; i++) {
      let position: Position
      do {
        position = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        }
      } while (
        (position.x === 0 && position.y === 0) || // Not on player start
        (position.x === GRID_SIZE - 1 && position.y === GRID_SIZE - 1) // Not on spaceship
      )

      newEnemies.push({
        id: i,
        position,
        direction: {
          x: Math.random() > 0.5 ? 1 : -1,
          y: Math.random() > 0.5 ? 1 : -1,
        },
      })
    }
    setEnemies(newEnemies)

    // Generate keys
    const newKeys: Position[] = []
    for (let i = 0; i < keyCount; i++) {
      let position: Position
      do {
        position = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        }
      } while (
        (position.x === 0 && position.y === 0) || // Not on player start
        (position.x === GRID_SIZE - 1 && position.y === GRID_SIZE - 1) || // Not on spaceship
        newEnemies.some((enemy) => enemy.position.x === position.x && enemy.position.y === position.y) || // Not on enemy
        newKeys.some((key) => key.x === position.x && key.y === position.y) // Not on another key
      )
      newKeys.push(position)
    }

    setKeys(newKeys)
    setKeysRemaining(keyCount)
    setGameStarted(true)

    // Show round start notification after a delay to avoid render issues
    setTimeout(() => {
      if (!hasShownRoundStart.current) {
        const totalRounds = getRoundsForLevel(gameStats.level)
        toast({
          title: `Round ${gameStats.round} Started!`,
          description: `Level ${gameStats.level} - Round ${gameStats.round}/${totalRounds} | ${keyCount} keys, ${enemyCount} enemies`,
        })
        hasShownRoundStart.current = true
      }
    }, 100)
  }, [gameStats.level, gameStats.round, getGameComplexity, toast])

  // Initialize first round
  useEffect(() => {
    initializeRound()
  }, [initializeRound])

  // Enemy movement with gradual complexity increase
  useEffect(() => {
    if (gameState !== "playing") return

    // Base speed with very gradual increase in complexity
    const baseSpeed = 1000
    const levelSpeedIncrease = (gameStats.level - 1) * 30
    const roundSpeedIncrease = (gameStats.round - 1) * 15
    const enemySpeed = Math.max(600, baseSpeed - levelSpeedIncrease - roundSpeedIncrease)

    const interval = setInterval(() => {
      setEnemies((prevEnemies) =>
        prevEnemies.map((enemy) => {
          let newX = enemy.position.x + enemy.direction.x
          let newY = enemy.position.y + enemy.direction.y
          let newDirectionX = enemy.direction.x
          let newDirectionY = enemy.direction.y

          // Bounce off walls
          if (newX < 0 || newX >= GRID_SIZE) {
            newDirectionX = -enemy.direction.x
            newX = enemy.position.x + newDirectionX
          }
          if (newY < 0 || newY >= GRID_SIZE) {
            newDirectionY = -enemy.direction.y
            newY = enemy.position.y + newDirectionY
          }

          return {
            ...enemy,
            position: { x: newX, y: newY },
            direction: { x: newDirectionX, y: newDirectionY },
          }
        }),
      )
    }, enemySpeed)

    return () => clearInterval(interval)
  }, [gameState, gameStats.level, gameStats.round])

  // Game logic and collision detection
  useEffect(() => {
    if (!gameStarted || gameState !== "playing") return

    // Check enemy collision - GAME OVER
    const hitEnemy = enemies.some(
      (enemy) => enemy.position.x === playerPosition.x && enemy.position.y === playerPosition.y,
    )
    if (hitEnemy) {
      endGame("enemy")
      return
    }

    // Check key collection
    const collectedKey = keys.find((key) => key.x === playerPosition.x && key.y === playerPosition.y)
    if (collectedKey) {
      setKeys((prevKeys) => prevKeys.filter((key) => key !== collectedKey))
      setKeysRemaining((prev) => {
        const newRemaining = prev - 1
        if (newRemaining === 0) {
          setCanReachSpaceship(true)
          // Use setTimeout to avoid render-time state updates
          setTimeout(() => {
            if (!hasShownAllKeysCollected.current) {
              toast({
                title: "All Keys Collected!",
                description: "Reach the spaceship to complete the round!",
              })
              hasShownAllKeysCollected.current = true
            }
          }, 50)
        }
        return newRemaining
      })

      const keyPoints = 100 * gameStats.level
      setGameStats((prev) => ({
        ...prev,
        score: prev.score + keyPoints,
        sessionScore: prev.sessionScore + keyPoints,
        keys: prev.keys + 1,
        keysCollected: prev.keysCollected + 1,
        totalKeysCollected: prev.totalKeysCollected + 1,
      }))
    }

    // Check spaceship reach - only if all keys collected
    if (playerPosition.x === GRID_SIZE - 1 && playerPosition.y === GRID_SIZE - 1) {
      if (canReachSpaceship && keysRemaining === 0) {
        completeRound()
      } else if (!canReachSpaceship) {
        // Use setTimeout to avoid render-time state updates
        setTimeout(() => {
          toast({
            title: "Collect All Keys First!",
            description: `You need to collect ${keysRemaining} more keys before reaching the spaceship`,
            variant: "destructive",
          })
        }, 50)
        // Move player back
        setPlayerPosition({ x: GRID_SIZE - 2, y: GRID_SIZE - 1 })
      }
    }
  }, [
    playerPosition,
    enemies,
    keys,
    keysRemaining,
    gameState,
    gameStats,
    gameStarted,
    canReachSpaceship,
    setGameStats,
    toast,
  ])

  const completeRound = () => {
    const roundBonus = 500 * gameStats.level
    const totalRounds = getRoundsForLevel(gameStats.level)

    setGameStats((prev) => ({
      ...prev,
      score: prev.score + roundBonus,
      sessionScore: prev.sessionScore + roundBonus,
      roundsCompleted: prev.roundsCompleted + 1,
    }))

    // Check if level is complete
    if (gameStats.round >= totalRounds) {
      // Level Complete!
      setGameState("levelComplete")
      const newLevel = gameStats.level + 1
      const totalScore = gameStats.score + roundBonus

      setTimeout(() => {
        toast({
          title: "🎉 Congratulations!",
          description: `Level ${gameStats.level} completed! You are now Level ${newLevel}!`,
        })
      }, 100)

      // Notify parent component about level completion
      onLevelComplete(newLevel, totalScore)

      // Move to next level after delay
      setTimeout(() => {
        setGameStats((prev) => ({
          ...prev,
          level: newLevel,
          round: 1,
          keysCollected: 0,
        }))
        initializeRound()
      }, 4000)
    } else {
      // Round Complete
      setGameState("roundComplete")
      setTimeout(() => {
        toast({
          title: "Round Complete!",
          description: `Round ${gameStats.round} of ${totalRounds} completed! +${roundBonus} bonus points`,
        })
      }, 100)

      // Move to next round after delay
      setTimeout(() => {
        setGameStats((prev) => ({
          ...prev,
          round: prev.round + 1,
          keysCollected: 0,
        }))
        initializeRound()
      }, 2000)
    }
  }

  const endGame = (reason: "enemy" | "manual") => {
    setGameState("gameOver")
    if (reason === "enemy") {
      setTimeout(() => {
        toast({
          title: "Game Over!",
          description: "You were caught by an enemy! Your progress will be saved.",
          variant: "destructive",
        })
      }, 100)
    }
  }

  const movePlayer = useCallback(
    (direction: Position) => {
      if (gameState !== "playing") return
      setPlayerPosition((prev) => {
        const newX = Math.max(0, Math.min(GRID_SIZE - 1, prev.x + direction.x))
        const newY = Math.max(0, Math.min(GRID_SIZE - 1, prev.y + direction.y))
        return { x: newX, y: newY }
      })
    },
    [gameState],
  )

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          movePlayer({ x: 0, y: -1 })
          break
        case "ArrowDown":
          e.preventDefault()
          movePlayer({ x: 0, y: 1 })
          break
        case "ArrowLeft":
          e.preventDefault()
          movePlayer({ x: -1, y: 0 })
          break
        case "ArrowRight":
          e.preventDefault()
          movePlayer({ x: 1, y: 0 })
          break
        case "r":
        case "R":
          if (gameState === "gameOver") {
            restartGame()
          }
          break
        case "p":
        case "P":
          togglePause()
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [movePlayer, gameState])

  const restartGame = () => {
    setGameStats((prev) => ({
      ...prev,
      level: 1,
      round: 1,
      score: 0,
      keysCollected: 0,
      roundsCompleted: 0,
    }))
    setGameStarted(false)
    initializeRound()
  }

  const togglePause = () => {
    setGameState((prev) => (prev === "paused" ? "playing" : "paused"))
  }

  const renderCell = (x: number, y: number) => {
    const isPlayer = playerPosition.x === x && playerPosition.y === y
    const enemy = enemies.find((e) => e.position.x === x && e.position.y === y)
    const hasKey = keys.some((key) => key.x === x && key.y === y)
    const isSpaceship = x === GRID_SIZE - 1 && y === GRID_SIZE - 1

    let content = null
    let bgColor = "bg-slate-800"

    if (isPlayer) {
      content = <div className="w-8 h-8 bg-cyan-400 rounded-full border-2 border-cyan-300 shadow-lg" />
    } else if (enemy) {
      content = (
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <div className="w-4 h-4 bg-purple-400 rounded-full" />
        </div>
      )
    } else if (hasKey) {
      content = (
        <div className="w-6 h-6 bg-blue-400 rounded-full border-2 border-blue-300 animate-pulse shadow-lg">
          <div className="w-2 h-2 bg-blue-200 rounded-full mx-auto mt-1" />
        </div>
      )
    } else if (isSpaceship) {
      content = (
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
          <div className="w-4 h-4 bg-orange-300 rounded-sm" />
        </div>
      )
      bgColor = "bg-orange-900/30"
    }

    return (
      <div key={`${x}-${y}`} className={`w-12 h-12 ${bgColor} border border-gray-700 flex items-center justify-center`}>
        {content}
      </div>
    )
  }

  const totalRounds = getRoundsForLevel(gameStats.level)
  const { enemyCount } = getGameComplexity()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Into Stellar </h1>
        <p className="text-gray-300">Use arrow keys to move • Collect all keys • Reach the spaceship</p>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <Button onClick={restartGame} className="bg-orange-600 hover:bg-orange-700 text-white">
          Restart (R)
        </Button>
        <Button
          onClick={togglePause}
          variant="outline"
          className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 bg-transparent"
        >
          {gameState === "paused" ? "Resume" : "Pause"} (P)
        </Button>
        <Button onClick={() => endGame("manual")} variant="destructive">
          End Game
        </Button>
        {isConnected && (gameStats.totalKeysCollected > 0 || gameStats.sessionScore > 0) && (
          <Button onClick={onSyncToBlockchain} disabled={isSyncing} className="bg-green-600 hover:bg-green-700">
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Progress"
            )}
          </Button>
        )}
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-300">Level</div>
            <div className="text-xl font-bold text-white">{gameStats.level}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-300">Round</div>
            <div className="text-xl font-bold text-purple-400">
              {gameStats.round}/{totalRounds}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/20 backdrop-blur-sm border-cyan-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-300">Keys</div>
            <div className="text-xl font-bold text-cyan-400">{gameStats.keys}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-300">Score</div>
            <div className="text-xl font-bold text-white">{gameStats.score.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/20 backdrop-blur-sm border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-300">High Score</div>
            <div className="text-xl font-bold text-yellow-400">{gameStats.highScore.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/20 backdrop-blur-sm border-green-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-300">Rounds Done</div>
            <div className="text-xl font-bold text-green-400">{gameStats.roundsCompleted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Game Status */}
      <div className="text-center mb-6">
        <div className="text-lg text-white">
          Collect all keys: <span className="text-cyan-400 font-bold">{keysRemaining} remaining</span>
        </div>
        {keysRemaining === 0 && canReachSpaceship && (
          <div className="text-green-400 font-bold animate-pulse">
            All keys collected! Reach the orange spaceship to complete the round!
          </div>
        )}
        {keysRemaining > 0 && (
          <div className="text-orange-400">Collect all keys first before reaching the spaceship</div>
        )}
        <div className="text-sm text-gray-400 mt-2">
          Enemies: {enemyCount} | Level {gameStats.level}, Round {gameStats.round} | Enemy increase every 2 rounds
        </div>
      </div>

      {/* Game Board */}
      <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20 mx-auto w-fit">
        <CardContent className="p-6">
          <div className="grid grid-cols-10 gap-1 bg-slate-900 p-4 rounded-lg">
            {Array.from({ length: GRID_SIZE }, (_, y) => Array.from({ length: GRID_SIZE }, (_, x) => renderCell(x, y)))}
          </div>
        </CardContent>
      </Card>

      {/* Game State Overlays */}
      {gameState === "paused" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-black/80 backdrop-blur-sm border-gray-500/20">
            <CardHeader>
              <CardTitle className="text-white text-center">Game Paused</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={togglePause} className="bg-green-600 hover:bg-green-700">
                Resume Game
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {gameState === "gameOver" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-black/80 backdrop-blur-sm border-red-500/20 max-w-md">
            <CardHeader>
              <CardTitle className="text-white text-center">Game Over!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-gray-300">
                <div>
                  Final Score: <span className="text-white font-bold">{gameStats.score.toLocaleString()}</span>
                </div>
                <div>
                  Level Reached: <span className="text-white font-bold">{gameStats.level}</span>
                </div>
                <div>
                  Round Reached:{" "}
                  <span className="text-purple-400 font-bold">
                    {gameStats.round}/{totalRounds}
                  </span>
                </div>
                <div>
                  Keys Collected: <span className="text-cyan-400 font-bold">{gameStats.keys}</span>
                </div>
                <div>
                  Rounds Completed: <span className="text-green-400 font-bold">{gameStats.roundsCompleted}</span>
                </div>
              </div>

              {isConnected && (gameStats.totalKeysCollected > 0 || gameStats.sessionScore > gameStats.highScore) ? (
                <div className="space-y-3">
                  {isSyncing ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                      <p className="text-blue-400">Saving your progress to blockchain...</p>
                      <p className="text-sm text-gray-400">Please confirm transactions in your wallet</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-yellow-400 text-sm">You have unsaved progress!</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={restartGame} variant="outline" className="bg-transparent">
                          Play Again
                        </Button>
                        <Button onClick={onEndGameAndGoHome} className="bg-green-600 hover:bg-green-700">
                          Save & Go Home
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 justify-center">
                  <Button onClick={restartGame} className="bg-orange-600 hover:bg-orange-700">
                    Play Again
                  </Button>
                  <Button onClick={onEndGameAndGoHome} variant="outline" className="bg-transparent">
                    Go Home
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {gameState === "roundComplete" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-black/80 backdrop-blur-sm border-green-500/20">
            <CardHeader>
              <CardTitle className="text-white text-center">Round Complete!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-gray-300 mb-4">
                <div>
                  Round {gameStats.round - 1} of {totalRounds} completed!
                </div>
                <div>Bonus: +{500 * gameStats.level} points</div>
                <div className="text-cyan-400">Keys collected this round: +{gameStats.keysCollected}</div>
              </div>
              <div className="text-sm text-gray-400">Starting next round...</div>
            </CardContent>
          </Card>
        </div>
      )}

      {gameState === "levelComplete" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-black/80 backdrop-blur-sm border-yellow-500/20">
            <CardHeader>
              <CardTitle className="text-white text-center text-2xl">🎉 Congratulations!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-gray-300 mb-4">
                <div className="text-xl text-green-400 font-bold mb-2">Level {gameStats.level} Completed!</div>
                <div className="text-lg">You are now Level {gameStats.level + 1}!</div>
                <div>All {totalRounds} rounds finished!</div>
                <div>Final Bonus: +{500 * gameStats.level} points</div>
                <div className="text-yellow-400 mt-2">
                  Total Score: {(gameStats.score + 500 * gameStats.level).toLocaleString()}
                </div>
              </div>
              <div className="text-sm text-gray-400">Advancing to Level {gameStats.level + 1}...</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legend */}
      <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20 mt-6">
        <CardHeader>
          <CardTitle className="text-white text-center">Game Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-cyan-400 rounded-full border-2 border-cyan-300 mb-2" />
              <span className="text-gray-300 text-sm">Player</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mb-2">
                <div className="w-4 h-4 bg-purple-400 rounded-full" />
              </div>
              <span className="text-gray-300 text-sm">Enemy</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 bg-blue-400 rounded-full border-2 border-blue-300 mb-2">
                <div className="w-2 h-2 bg-blue-200 rounded-full mx-auto mt-1" />
              </div>
              <span className="text-gray-300 text-sm">Key</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mb-2">
                <div className="w-4 h-4 bg-orange-300 rounded-sm" />
              </div>
              <span className="text-gray-300 text-sm">Spaceship</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
