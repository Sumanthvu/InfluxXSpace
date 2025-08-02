"use client"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Star, Key, Trophy, Award, Clock, Users } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"

const CONTRACT_ADDRESS = "0x833D0f532979b56E302056d46FbcC43c89d4e50B"
const CONTRACT_ABI = [
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
]

export default function DashboardPage() {
  const { account, provider, isConnected } = useWallet()
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [playerData, setPlayerData] = useState({
    points: 0,
    keys: 0,
    badges: [false, false, false],
    nextClaimTime: 0,
  })
  const [topScores, setTopScores] = useState<Array<{ player: string; score: number }>>([])
  const [keyAmount, setKeyAmount] = useState("")
  const [loading, setLoading] = useState(false)
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
    if (contract && account) {
      loadPlayerData()
      loadTopScores()
    }
  }, [contract, account])

  const loadPlayerData = async () => {
    if (!contract || !account) return
    try {
      // Initialize with default values
      let points = 0
      let keys = 0
      let badges = [false, false, false]
      let nextClaimTime = 0

      // Handle each contract call individually
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
        badges,
        nextClaimTime,
      })
    } catch (error) {
      console.error("Error loading player data:", error)
      // Set default values on error
      setPlayerData({
        points: 0,
        keys: 0,
        badges: [false, false, false],
        nextClaimTime: 0,
      })
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
        .filter((score: any) => score.player !== "0x0000000000000000000000000000000000000000" && score.score > 0)
      setTopScores(formattedScores)
    } catch (error) {
      console.error("Error loading top scores:", error)
      setTopScores([]) // Set empty array on error
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
    return Date.now() / 1000 >= playerData.nextClaimTime
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Connect Wallet</CardTitle>
              <CardDescription className="text-gray-300">Connect your wallet to view your dashboard</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/20 backdrop-blur-sm border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Points</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{playerData.points.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-black/20 backdrop-blur-sm border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Keys</CardTitle>
              <Key className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{playerData.keys.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Badges</CardTitle>
              <Award className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{playerData.badges.filter(Boolean).length}/3</div>
            </CardContent>
          </Card>
          <Card className="bg-black/20 backdrop-blur-sm border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Rank</CardTitle>
              <Trophy className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                #{topScores.findIndex((score) => score.player.toLowerCase() === account.toLowerCase()) + 1 || "-"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Actions */}
          <div className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Daily Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={claimDailyPoints}
                  disabled={loading || !canClaimPoints()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {canClaimPoints() ? "Claim Daily Points" : "Claimed Today"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20">
              <CardHeader>
                <CardTitle className="text-white">Convert Keys to Points</CardTitle>
                <CardDescription className="text-gray-300">50 keys = 10 points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="number"
                  placeholder="Enter key amount (multiples of 50)"
                  value={keyAmount}
                  onChange={(e) => setKeyAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 border border-gray-600 text-white rounded-md"
                />
                <Button
                  onClick={convertKeys}
                  disabled={loading || !keyAmount}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Convert Keys
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topScores.slice(0, 10).map((score, index) => (
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
                    <div className="text-white font-bold">{score.score.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
