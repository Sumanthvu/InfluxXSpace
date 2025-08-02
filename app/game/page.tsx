"use client"
import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import GameBoard from "@/components/game-board"
import { useToast } from "@/hooks/use-toast"
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
    inputs: [{ internalType: "uint256", name: "newScore", type: "uint256" }],
    name: "updateCurrentScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newLevel", type: "uint256" }],
    name: "updateCurrentLevel",
    outputs: [],
    stateMutability: "nonpayable",
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
]

export default function GamePage() {
  const router = useRouter()
  const { account, provider, isConnected } = useWallet()
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [gameStats, setGameStats] = useState({
    level: 1,
    round: 1,
    score: 0,
    keys: 0,
    highScore: 0,
    keysCollected: 0,
    totalKeysCollected: 0,
    sessionScore: 0,
    roundsCompleted: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    if (account && provider) {
      provider.getSigner().then((signer) => {
        const gameContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        setContract(gameContract)
        loadPlayerData(gameContract)
      })
    }
  }, [account, provider])

  const loadPlayerData = async (gameContract: ethers.Contract) => {
    if (!gameContract || !account) return
    try {
      let highScore = 0
      let currentLevel = 1

      try {
        const highScoreResult = await gameContract.getPlayerHighScore(account)
        highScore = Number(highScoreResult) || 0
      } catch (error) {
        console.log("No high score data found, using default value")
      }

      try {
        const currentLevelResult = await gameContract.getPlayerCurrentLevel(account)
        currentLevel = Math.max(1, Number(currentLevelResult) || 1)
      } catch (error) {
        console.log("No current level data found, using default value")
        currentLevel = 1
      }

      setGameStats((prev) => ({
        ...prev,
        highScore,
        level: currentLevel,
      }))
    } catch (error) {
      console.error("Error loading player data:", error)
      // Use default values on error
      setGameStats((prev) => ({
        ...prev,
        highScore: 0,
        level: 1,
      }))
    }
  }

  const syncToBlockchain = useCallback(
    async (shouldNavigateHome = false) => {
      if (!contract || !account || isSyncing) return false

      try {
        setIsSyncing(true)
        const { totalKeysCollected, sessionScore, highScore, level } = gameStats

        // Check if there's actually anything to save
        const hasNewKeys = totalKeysCollected > 0
        const hasNewHighScore = sessionScore > highScore
        const needsLevelUpdate = level > 1 // Only update level if it's above 1

        if (!hasNewKeys && !hasNewHighScore && !needsLevelUpdate) {
          toast({
            title: "No Progress to Save",
            description: "No new progress to sync to blockchain",
          })
          setIsSyncing(false)
          if (shouldNavigateHome) {
            setTimeout(() => {
              router.push("/")
            }, 1000)
          }
          return true
        }

        // Determine the most important single transaction to send
        let primaryTransaction = null
        let transactionDescription = ""

        if (hasNewHighScore) {
          // High score update is most important as it includes overall progress
          toast({
            title: "Saving Progress",
            description: "Updating your high score and progress on blockchain...",
          })

          try {
            primaryTransaction = await contract.updateCurrentScore(sessionScore)
            transactionDescription = `High score updated to ${sessionScore.toLocaleString()}`

            // If we also have keys, add them in the same transaction flow
            if (hasNewKeys) {
              transactionDescription += ` and ${totalKeysCollected} keys added`
            }
          } catch (error) {
            console.error("Error updating score:", error)
            throw new Error("Failed to update score on blockchain")
          }
        } else if (hasNewKeys) {
          // If no new high score, just save the keys
          toast({
            title: "Saving Keys",
            description: `Adding ${totalKeysCollected} keys to blockchain...`,
          })

          try {
            primaryTransaction = await contract.addKeys(totalKeysCollected)
            transactionDescription = `${totalKeysCollected} keys added to your collection`
          } catch (error) {
            console.error("Error adding keys:", error)
            throw new Error("Failed to add keys to blockchain")
          }
        } else if (needsLevelUpdate) {
          // Only level update needed
          toast({
            title: "Saving Level",
            description: `Updating level to ${level}...`,
          })

          try {
            primaryTransaction = await contract.updateCurrentLevel(level)
            transactionDescription = `Level updated to ${level}`
          } catch (error) {
            console.error("Error updating level:", error)
            throw new Error("Failed to update level on blockchain")
          }
        }

        if (!primaryTransaction) {
          throw new Error("No transaction was created")
        }

        // Wait for the single transaction to be mined
        toast({
          title: "Confirming Transaction",
          description: "Waiting for blockchain confirmation...",
        })

        await primaryTransaction.wait()

        // Update local state to reflect saved progress
        setGameStats((prev) => ({
          ...prev,
          totalKeysCollected: 0,
          sessionScore: 0,
          highScore: Math.max(prev.highScore, sessionScore),
        }))

        toast({
          title: "Progress Saved Successfully!",
          description: transactionDescription,
        })

        setIsSyncing(false)

        // Navigate to home if requested
        if (shouldNavigateHome) {
          setTimeout(() => {
            router.push("/")
          }, 2000)
        }

        return true
      } catch (error: any) {
        console.error("Error syncing to blockchain:", error)
        toast({
          title: "Save Failed",
          description: error.message || "Failed to save progress to blockchain",
          variant: "destructive",
        })
        setIsSyncing(false)
        return false
      }
    },
    [contract, account, gameStats, toast, router, isSyncing],
  )

  const handleLevelComplete = useCallback(
    async (newLevel: number, totalScore: number) => {
      // Only update if we have a significant level increase or score improvement
      if (contract && account && !isSyncing && (newLevel > gameStats.level || totalScore > gameStats.highScore)) {
        try {
          setIsSyncing(true)
          toast({
            title: "Saving Level Progress",
            description: "Updating your progress on blockchain...",
          })

          // Send single transaction for the most important update (score includes level progress)
          if (totalScore > gameStats.highScore) {
            const scoreTx = await contract.updateCurrentScore(totalScore)
            await scoreTx.wait()

            setGameStats((prev) => ({
              ...prev,
              highScore: totalScore,
            }))

            toast({
              title: "Level Progress Saved!",
              description: `Level ${newLevel} completed! Score ${totalScore.toLocaleString()} saved to blockchain`,
            })
          } else {
            // Only level update needed
            const levelTx = await contract.updateCurrentLevel(newLevel)
            await levelTx.wait()

            toast({
              title: "Level Progress Saved!",
              description: `Level ${newLevel} progress saved to blockchain`,
            })
          }

          setIsSyncing(false)
        } catch (error) {
          console.error("Error updating level:", error)
          toast({
            title: "Save Failed",
            description: "Failed to save level progress. You can try again later.",
            variant: "destructive",
          })
          setIsSyncing(false)
        }
      }
    },
    [contract, account, gameStats.highScore, gameStats.level, toast, isSyncing, setGameStats],
  )

  const handleSyncToBlockchain = () => {
    syncToBlockchain(false)
  }

  const handleEndGameAndGoHome = () => {
    syncToBlockchain(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <GameBoard
          gameStats={gameStats}
          setGameStats={setGameStats}
          isConnected={isConnected}
          isSyncing={isSyncing}
          onSyncToBlockchain={handleSyncToBlockchain}
          onEndGameAndGoHome={handleEndGameAndGoHome}
          onLevelComplete={handleLevelComplete}
        />
      </div>
    </div>
  )
}
