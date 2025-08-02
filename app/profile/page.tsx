"use client"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Award, Star, Trophy, Key, TrendingUp } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { safeGetNumber, safeGetBooleanArray } from "@/lib/contract-utils"

const CONTRACT_ADDRESS = "0x833D0f532979b56E302056d46FbcC43c89d4e50B"
const CONTRACT_ABI = [
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
    name: "getPlayerCurrentLevel",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerHighestLevel",
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

interface PlayerProfile {
  points: number
  keys: number
  highScore: number
  currentLevel: number
  highestLevel: number
  badges: [boolean, boolean, boolean]
}

export default function ProfilePage() {
  const { account, provider, isConnected } = useWallet()
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null)
  const [thresholds, setThresholds] = useState({ bronze: 50, silver: 200, gold: 900 })
  const [loading, setLoading] = useState(false)

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
      loadPlayerProfile()
      loadThresholds()
    }
  }, [contract, account])

  const loadPlayerProfile = async () => {
    if (!contract || !account) return
    try {
      setLoading(true)

      // Use safe contract calls with default values
      const points = await safeGetNumber(
        () => contract.getPlayerPoints(account),
        0,
        "No points data found, using default value",
      )

      const keys = await safeGetNumber(
        () => contract.getPlayerKeys(account),
        0,
        "No keys data found, using default value",
      )

      const highScore = await safeGetNumber(
        () => contract.getPlayerHighScore(account),
        0,
        "No high score data found, using default value",
      )

      const currentLevel = await safeGetNumber(
        () => contract.getPlayerCurrentLevel(account),
        1,
        "No current level data found, using default value",
      )

      const highestLevel = await safeGetNumber(
        () => contract.getPlayerHighestLevel(account),
        1,
        "No highest level data found, using default value",
      )

      const badges = await safeGetBooleanArray(
        () => contract.getPlayerBadges(account),
        [false, false, false],
        "No badges data found, using default values",
      )

      setPlayerProfile({
        points,
        keys,
        highScore,
        currentLevel: Math.max(1, currentLevel),
        highestLevel: Math.max(1, highestLevel),
        badges: badges as [boolean, boolean, boolean],
      })
    } catch (error) {
      console.error("Error loading player profile:", error)
      // Set default values on error
      setPlayerProfile({
        points: 0,
        keys: 0,
        highScore: 0,
        currentLevel: 1,
        highestLevel: 1,
        badges: [false, false, false],
      })
    } finally {
      setLoading(false)
    }
  }

  const loadThresholds = async () => {
    if (!contract) return
    try {
      const bronze = await safeGetNumber(
        () => contract.BRONZE_THRESHOLD(),
        50,
        "No bronze threshold found, using default value: 50",
      )

      const silver = await safeGetNumber(
        () => contract.SILVER_THRESHOLD(),
        200,
        "No silver threshold found, using default value: 200",
      )

      const gold = await safeGetNumber(
        () => contract.GOLD_THRESHOLD(),
        900,
        "No gold threshold found, using default value: 900",
      )

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

  const getBadgeProgress = () => {
    if (!playerProfile) return { current: 0, next: thresholds.bronze, progress: 0, nextBadge: "Bronze" }
    const points = playerProfile.points
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Connect Wallet</CardTitle>
              <CardDescription className="text-gray-300">Connect your wallet to view your profile</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  const badgeProgress = getBadgeProgress()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Player Profile</h1>
          <p className="text-gray-300">
            {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/20 backdrop-blur-sm border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Points</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{playerProfile?.points.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-black/20 backdrop-blur-sm border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Keys</CardTitle>
              <Key className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{playerProfile?.keys.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">High Score</CardTitle>
              <Trophy className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{playerProfile?.highScore.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-black/20 backdrop-blur-sm border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Current Level</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{playerProfile?.currentLevel || 1}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Badge Progress */}
          <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20">
            <CardHeader>
              <CardTitle className="text-white">Badge Progress</CardTitle>
              <CardDescription className="text-gray-300">
                Progress to next badge: {badgeProgress.nextBadge}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {badgeProgress.current.toLocaleString()} / {badgeProgress.next.toLocaleString()} points
                  </span>
                  <span className="text-gray-300">{Math.round(badgeProgress.progress)}%</span>
                </div>
                <Progress value={badgeProgress.progress} className="h-3" />
              </div>
              <div className="text-sm text-gray-400">
                {badgeProgress.nextBadge === "Gold (Max)"
                  ? "You've reached the maximum badge level!"
                  : `${(badgeProgress.next - badgeProgress.current).toLocaleString()} points to ${badgeProgress.nextBadge} badge`}
              </div>
            </CardContent>
          </Card>

          {/* Level Information */}
          <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20">
            <CardHeader>
              <CardTitle className="text-white">Level Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current Level:</span>
                <span className="text-white font-bold text-xl">{playerProfile?.currentLevel || 1}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Highest Level Reached:</span>
                <span className="text-white font-bold">{playerProfile?.highestLevel || 1}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Rounds per Level:</span>
                <span className="text-white font-bold">{(playerProfile?.currentLevel || 1) * 5}</span>
              </div>
              <div className="text-sm text-gray-400">
                Level {playerProfile?.currentLevel || 1} requires completing {(playerProfile?.currentLevel || 1) * 5}{" "}
                rounds
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Achievements & Badges
            </CardTitle>
            <CardDescription className="text-gray-300">
              Earn badges by accumulating points through gameplay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[
                {
                  id: 1,
                  title: "Bronze Explorer",
                  description: `Reach ${thresholds.bronze} points`,
                  icon: Award,
                  color: "amber-600",
                  threshold: thresholds.bronze,
                  earned: playerProfile?.badges[0] || false,
                },
                {
                  id: 2,
                  title: "Silver Navigator",
                  description: `Reach ${thresholds.silver} points`,
                  icon: Star,
                  color: "gray-400",
                  threshold: thresholds.silver,
                  earned: playerProfile?.badges[1] || false,
                },
                {
                  id: 3,
                  title: "Gold Commander",
                  description: `Reach ${thresholds.gold} points`,
                  icon: Trophy,
                  color: "yellow-500",
                  threshold: thresholds.gold,
                  earned: playerProfile?.badges[2] || false,
                },
              ].map((achievement) => {
                const IconComponent = achievement.icon
                return (
                  <div key={achievement.id} className="text-center">
                    <div
                      className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        achievement.earned ? `bg-${achievement.color}` : "bg-gray-600"
                      }`}
                    >
                      <IconComponent
                        className={`w-10 h-10 ${
                          achievement.earned
                            ? achievement.color === "yellow-500"
                              ? "text-black"
                              : "text-white"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <h3 className="text-white font-bold mb-2">{achievement.title}</h3>
                    <p className="text-gray-300 text-sm mb-2">{achievement.description}</p>
                    <Badge variant={achievement.earned ? "default" : "secondary"}>
                      {achievement.earned
                        ? "Earned ✓"
                        : `${(playerProfile?.points || 0).toLocaleString()}/${achievement.threshold.toLocaleString()}`}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
