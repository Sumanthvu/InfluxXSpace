"use client"
import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"

declare global {
  interface Window {
    ethereum?: any
  }
}

export function useWallet() {
  const [account, setAccount] = useState<string>("")
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Check for existing connection on mount
  useEffect(() => {
    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
          window.ethereum.removeListener("chainChanged", handleChainChanged)
        }
      }
    }
  }, [])

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      setAccount("")
      setProvider(null)
    } else {
      // User switched accounts
      setAccount(accounts[0])
    }
  }, [])

  const handleChainChanged = useCallback(() => {
    // Reload the page when chain changes
    window.location.reload()
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        })

        if (accounts && accounts.length > 0) {
          setAccount(accounts[0])
          setProvider(provider)
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      return {
        success: false,
        error: "MetaMask not found. Please install MetaMask browser extension.",
      }
    }

    try {
      setIsConnecting(true)

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        return { success: false, error: "No accounts found" }
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const account = accounts[0]

      setAccount(account)
      setProvider(provider)

      return { success: true, account }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)

      let errorMessage = "Failed to connect wallet"
      if (error.code === 4001) {
        errorMessage = "User rejected the connection request"
      } else if (error.code === -32002) {
        errorMessage = "Connection request already pending. Please check MetaMask."
      }

      return { success: false, error: errorMessage }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount("")
    setProvider(null)
  }

  const switchToMonad = async () => {
    if (!window.ethereum) return { success: false, error: "MetaMask not found" }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x29A" }], // Monad Testnet Chain ID (666 in decimal)
      })
      return { success: true }
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to MetaMask
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x29A", // 666 in hex
                chainName: "Monad Testnet",
                nativeCurrency: {
                  name: "MON",
                  symbol: "MON",
                  decimals: 18,
                },
                rpcUrls: ["https://testnet1.monad.xyz"],
                blockExplorerUrls: ["https://testnet1.monad.xyz"],
              },
            ],
          })
          return { success: true }
        } catch (addError) {
          return { success: false, error: "Failed to add Monad network" }
        }
      }
      return { success: false, error: "Failed to switch network" }
    }
  }

  return {
    account,
    provider,
    connectWallet,
    disconnectWallet,
    switchToMonad,
    isConnected: !!account,
    isConnecting,
  }
}
