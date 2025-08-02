"use client"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Star, Trophy } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"

const CONTRACT_ADDRESS = "0x833D0f532979b56E302056d46FbcC43c89d4e50B"
const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerBadges",
    outputs: [{ internalType: "bool[3]", name: "", type: "bool[3]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerPoints",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]

export default function AchievementsPage() {
  const { account, provider, isConnected } = useWallet()
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [playerData, setPlayerData] = useState({
    points: 0,
    badges: [false, false, false],
  })
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
      setLoading(true)
      loadPlayerData().finally(() => setLoading(false))
    }
  }, [contract, account])

  const loadPlayerData = async () => {
    if (!contract || !account) return
    try {
      // Handle potential empty responses from contract
      let points = 0
      let badges = [false, false, false]

      try {
        const pointsResult = await contract.getPlayerPoints(account)
        points = Number(pointsResult) || 0
      } catch (error) {
        console.log("No points data found, using default value")
        points = 0
      }

      try {
        const badgesResult = await contract.getPlayerBadges(account)
        badges = badgesResult || [false, false, false]
      } catch (error) {
        console.log("No badges data found, using default values")
        badges = [false, false, false]
      }

      setPlayerData({
        points,
        badges,
      })
    } catch (error) {
      console.error("Error loading player data:", error)
      // Set default values on error
      setPlayerData({
        points: 0,
        badges: [false, false, false],
      })
    }
  }

  const achievements = [
    {
      id: 1,
      title: "Bronze Explorer",
      description: "Reach 50 points",
      icon: Award,
      color: "amber-600",
      threshold: 50,
      earned: playerData.badges[0],
    },
    {
      id: 2,
      title: "Silver Navigator",
      description: "Reach 200 points",
      icon: Star,
      color: "gray-400",
      threshold: 200,
      earned: playerData.badges[1],
    },
    {
      id: 3,
      title: "Gold Commander",
      description: "Reach 900 points",
      icon: Trophy,
      color: "yellow-500",
      threshold: 900,
      earned: playerData.badges[2],
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white">Loading your achievements...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Connect Wallet</CardTitle>
              <CardDescription className="text-gray-300">Connect your wallet to view your achievements</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Achievements</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {achievements.map((achievement) => {
            const IconComponent = achievement.icon
            return (
              <Card key={achievement.id} className="bg-black/20 backdrop-blur-sm border-gray-500/20">
                <CardHeader className="text-center">
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
                  <CardTitle className="text-white">{achievement.title}</CardTitle>
                  <CardDescription className="text-gray-300">{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge variant={achievement.earned ? "default" : "secondary"}>
                    {achievement.earned ? "Earned" : `${playerData.points}/${achievement.threshold}`}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <Card className="bg-black/20 backdrop-blur-sm border-gray-500/20">
          <CardHeader>
            <CardTitle className="text-white">Achievement Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current Points:</span>
                <span className="text-white font-bold">{playerData.points}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Badges Earned:</span>
                <span className="text-white font-bold">{playerData.badges.filter(Boolean).length}/3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Next Milestone:</span>
                <span className="text-white font-bold">
                  {playerData.points >= 900
                    ? "All achievements unlocked!"
                    : playerData.points >= 200
                      ? `${900 - playerData.points} points to Gold`
                      : playerData.points >= 50
                        ? `${200 - playerData.points} points to Silver`
                        : `${50 - playerData.points} points to Bronze`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
