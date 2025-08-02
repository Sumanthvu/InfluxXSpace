"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Wallet, Sun, Moon, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"

export default function Navigation() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { account, connectWallet, disconnectWallet, isConnected, isConnecting } = useWallet()

  const handleConnect = async () => {
    const result = await connectWallet()
    if (result.success) {
      toast({
        title: "Wallet Connected",
        description: `Connected to ${result.account?.slice(0, 6)}...${result.account?.slice(-4)}`,
      })
    } else {
      toast({
        title: "Connection Failed",
        description: result.error || "Failed to connect wallet",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/game", label: "Game" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
    { href: "/achievements", label: "Achievements" },
  ]

  return (
    <nav className="bg-black/20 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-orange-400">
            Space Puzzle
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-orange-400 ${
                  pathname === item.href ? "text-orange-400" : "text-gray-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-gray-300 hover:text-white"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  className="border-orange-500 text-orange-400 hover:bg-orange-500/10 bg-transparent"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
