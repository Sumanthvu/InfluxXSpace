"use client"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Trophy, Key, Star, Clock, Users, Gamepad2, Award } from "lucide-react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import { useWallet } from "@/hooks/use-wallet"

const CONTRACT_ADDRESS = "0x833D0f532979b56E302056d46FbcC43c89d4e50B"
const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "addKeys",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimDailyPoints",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "keyAmount", type: "uint256" }],
    name: "convertKeysToPoints",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerPoints",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerKeys",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerHighScore",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerBadges",
    outputs: [{ internalType: "bool[3]", name: "", type: "bool[3]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getNextClaimTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTopScores",
    outputs: [
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint256", name: "score", type: "uint256" },
        ],
        internalType: "struct SpacePuzzleGame.HighScore[10]",
        name: "",
        type: "tuple[10]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "BRONZE_THRESHOLD",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "SILVER_THRESHOLD",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "GOLD_THRESHOLD",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]

interface PlayerData {
  points: number
  keys: number
  highScore: number
  badges: [boolean, boolean, boolean]
  nextClaimTime: number
}

interface HighScore {
  player: string
  score: number
}

export default function HomePage() {
  const { account, provider, isConnected } = useWallet()
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [topScores, setTopScores] = useState<HighScore[]>([])
  const [loading, setLoading] = useState(false)
  const [keyAmount, setKeyAmount] = useState("")
  const [thresholds, setThresholds] = useState({ bronze: 50, silver: 200, gold: 900 })
  const { toast } = useToast()

  useEffect(() => {
    if (account && provider) {
      provider.getSigner().then((signer) => {
        const gameContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        setContract(gameContract)
      })
    }
  }, [account, provider])

  useEffect(() => {
    if (account && contract) {
      loadPlayerData()
      loadTopScores()
      loadThresholds()
    }
  }, [account, contract])

  const loadPlayerData = async () => {
    if (!contract || !account) return
    try {
      setLoading(true)

      // Initialize with default values
      let points = 0
      let keys = 0
      let highScore = 0
      let badges = [false, false, false]
      let nextClaimTime = 0

      // Handle each contract call individually with error handling
      try {
        const pointsResult = await contract.getPlayerPoints(account)
        points = Number(pointsResult) || 0
      } catch (error) {
        console.log("No points data found, using default value")
      }

      try {
        const keysResult = await contract.getPlayerKeys(account)
        keys = Number(keysResult) || 0
      } catch (error) {
        console.log("No keys data found, using default value")
      }

      try {
        const highScoreResult = await contract.getPlayerHighScore(account)
        highScore = Number(highScoreResult) || 0
      } catch (error) {
        console.log("No high score data found, using default value")
      }

      try {
        const badgesResult = await contract.getPlayerBadges(account)
        badges = badgesResult || [false, false, false]
      } catch (error) {
        console.log("No badges data found, using default values")
      }

      try {
        const nextClaimTimeResult = await contract.getNextClaimTime(account)
        nextClaimTime = Number(nextClaimTimeResult) || 0
      } catch (error) {
        console.log("No claim time data found, using default value")
      }

      setPlayerData({
        points,
        keys,
        highScore,
        badges,
        nextClaimTime,
      })
    } catch (error) {
      console.error("Error loading player data:", error)
      // Set default values on error
      setPlayerData({
        points: 0,
        keys: 0,
        highScore: 0,
        badges: [false, false, false],
        nextClaimTime: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTopScores = async () => {
    if (!contract) return
    try {
      const scores = await contract.getTopScores()
      const formattedScores = scores
        .map((score: any) => ({
          player: score.player,
          score: Number(score.score),
        }))
        .filter((score: HighScore) => score.player !== "0x0000000000000000000000000000000000000000" && score.score > 0)
      setTopScores(formattedScores)
    } catch (error) {
      console.error("Error loading top scores:", error)
      setTopScores([]) // Set empty array on error
    }
  }

  const loadThresholds = async () => {
    if (!contract) return
    try {
      let bronze = 50
      let silver = 200
      let gold = 900

      // Handle each threshold call individually
      try {
        const bronzeResult = await contract.BRONZE_THRESHOLD()
        bronze = Number(bronzeResult) || 50
      } catch (error) {
        console.log("No bronze threshold found, using default value: 50")
      }

      try {
        const silverResult = await contract.SILVER_THRESHOLD()
        silver = Number(silverResult) || 200
      } catch (error) {
        console.log("No silver threshold found, using default value: 200")
      }

      try {
        const goldResult = await contract.GOLD_THRESHOLD()
        gold = Number(goldResult) || 900
      } catch (error) {
        console.log("No gold threshold found, using default value: 900")
      }

      setThresholds({
        bronze,
        silver,
        gold,
      })
    } catch (error) {
      console.error("Error loading thresholds:", error)
      // Use default values on any error
      setThresholds({
        bronze: 50,
        silver: 200,
        gold: 900,
      })
    }
  }

  const claimDailyPoints = async () => {
    if (!contract) return
    try {
      setLoading(true)
      const tx = await contract.claimDailyPoints()
      await tx.wait()
      toast({
        title: "Success!",
        description: "Daily points claimed successfully!",
      })
      loadPlayerData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.reason || "Failed to claim daily points",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const convertKeys = async () => {
    if (!contract || !keyAmount) return
    try {
      setLoading(true)
      const tx = await contract.convertKeysToPoints(keyAmount)
      await tx.wait()
      toast({
        title: "Success!",
        description: `Converted ${keyAmount} keys to points!`,
      })
      setKeyAmount("")
      loadPlayerData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.reason || "Failed to convert keys",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const canClaimPoints = () => {
    if (!playerData) return false
    return Date.now() / 1000 >= playerData.nextClaimTime
  }

  const getBadgeProgress = () => {
    if (!playerData) return { current: 0, next: thresholds.bronze, progress: 0, nextBadge: "Bronze" }
    const points = playerData.points
    if (points >= thresholds.gold) {
      return { current: points, next: thresholds.gold, progress: 100, nextBadge: "Gold (Max)" }
    } else if (points >= thresholds.silver) {
      return {
        current: points,
        next: thresholds.gold,
        progress: ((points - thresholds.silver) / (thresholds.gold - thresholds.silver)) * 100,
        nextBadge: "Gold",
      }
    } else if (points >= thresholds.bronze) {
      return {
        current: points,
        next: thresholds.silver,
        progress: ((points - thresholds.bronze) / (thresholds.silver - thresholds.bronze)) * 100,
        nextBadge: "Silver",
      }
    } else {
      return {
        current: points,
        next: thresholds.bronze,
        progress: (points / thresholds.bronze) * 100,
        nextBadge: "Bronze",
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Space Puzzle
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Navigate through space, collect keys, avoid enemies, and earn blockchain rewards in this thrilling puzzle
            adventure!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/game">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-3 text-lg"
              >
                <Gamepad2 className="w-5 h-5 mr-2" />
                Play Game
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-purple-500 text-purple-300 hover:bg-purple-500/10 px-8 py-3 text-lg bg-transparent"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Game Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-black/20 backdrop-blur-sm border-cyan-500/20">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-2">
                <Key className="w-6 h-6 text-cyan-400" />
              </div>
              <CardTitle className="text-white">Collect Keys</CardTitle>
              <CardDescription className="text-gray-300">
                Navigate through challenging levels to collect keys and unlock rewards
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle className="text-white">Earn Points</CardTitle>
              <CardDescription className="text-gray-300">
                Convert collected keys into points and climb the leaderboard
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-black/20 backdrop-blur-sm border-yellow-500/20">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <CardTitle className="text-white">NFT Rewards</CardTitle>
              <CardDescription className="text-gray-300">
                Unlock exclusive NFT badges as you reach point milestones
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How to Play */}
        <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20 mb-12">
          <CardHeader>
            <CardTitle className="text-white">How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Game Controls</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Use arrow keys to move your character</li>
                  <li>• Collect all keys in each round</li>
                  <li>• Avoid purple enemies</li>
                  <li>• Reach the spaceship to complete the round</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Round System</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Level 1: 5 rounds, Level 2: 10 rounds, etc.</li>
                  <li>• Complete all rounds to advance to next level</li>
                  <li>• Enemy complexity increases each round</li>
                  <li>• Earn blockchain rewards for progress</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Dashboard (if connected) */}
        {isConnected && playerData && (
          <div className="mt-12">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Your Progress</h2>
              <p className="text-gray-300">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black/20 backdrop-blur-sm">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="actions" className="data-[state=active]:bg-purple-600">
                  Actions
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="data-[state=active]:bg-purple-600">
                  Leaderboard
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Points</CardTitle>
                      <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{playerData.points.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Keys</CardTitle>
                      <Key className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{playerData.keys.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">High Score</CardTitle>
                      <Trophy className="h-4 w-4 text-gold-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{playerData.highScore.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Badges</CardTitle>
                      <Award className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{playerData.badges.filter(Boolean).length}/3</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Badge Progress</CardTitle>
                    <CardDescription className="text-gray-300">
                      Progress to next badge: {getBadgeProgress().nextBadge}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">
                          {getBadgeProgress().current.toLocaleString()} / {getBadgeProgress().next.toLocaleString()}{" "}
                          points
                        </span>
                        <span className="text-gray-300">{Math.round(getBadgeProgress().progress)}%</span>
                      </div>
                      <Progress value={getBadgeProgress().progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Daily Points
                      </CardTitle>
                      <CardDescription className="text-gray-300">Claim your daily point reward</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={claimDailyPoints}
                        disabled={loading || !canClaimPoints()}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {canClaimPoints() ? "Claim Daily Points" : "Already Claimed"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Key className="w-5 h-5 mr-2" />
                        Convert Keys
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Convert keys to points (50 keys = 10 points)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <input
                        type="number"
                        placeholder="Enter key amount"
                        value={keyAmount}
                        onChange={(e) => setKeyAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-black/20 border border-gray-600 text-white rounded-md"
                      />
                      <Button
                        onClick={convertKeys}
                        disabled={loading || !keyAmount}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Convert to Points
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="leaderboard">
                <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Top 10 High Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topScores.length > 0 ? (
                        topScores.map((score, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0
                                    ? "bg-yellow-500 text-black"
                                    : index === 1
                                      ? "bg-gray-400 text-black"
                                      : index === 2
                                        ? "bg-amber-600 text-white"
                                        : "bg-gray-600 text-white"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {score.player.slice(0, 6)}...{score.player.slice(-4)}
                                </p>
                                {score.player.toLowerCase() === account.toLowerCase() && (
                                  <Badge variant="secondary" className="text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-white font-bold text-lg">{score.score.toLocaleString()}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          No scores recorded yet. Be the first to set a high score!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
