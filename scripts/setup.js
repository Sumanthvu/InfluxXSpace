const fs = require("fs")
const path = require("path")

console.log("🚀 Setting up Space Puzzle Game for Monad Blockchain...\n")

// Check if node_modules exists
if (!fs.existsSync("node_modules")) {
  console.log("📦 Installing dependencies...")
  console.log("Please run: npm install\n")
} else {
  console.log("✅ Dependencies already installed\n")
}

// Check for .env.local file
if (!fs.existsSync(".env.local")) {
  console.log("📝 Creating environment file...")
  const envContent = `# Space Puzzle Game Environment Variables
# Add any custom environment variables here
NEXT_PUBLIC_CONTRACT_ADDRESS=0x833D0f532979b56E302056d46FbcC43c89d4e50B
NEXT_PUBLIC_NETWORK_NAME=Monad Testnet
NEXT_PUBLIC_CHAIN_ID=666
`
  fs.writeFileSync(".env.local", envContent)
  console.log("✅ Created .env.local file\n")
}

console.log("🎮 Setup complete! Next steps:")
console.log("1. Install MetaMask browser extension")
console.log("2. Add Monad Testnet to MetaMask:")
console.log("   - Network Name: Monad Testnet")
console.log("   - RPC URL: https://testnet1.monad.xyz")
console.log("   - Chain ID: 666")
console.log("   - Currency: MON")
console.log("3. Get testnet MON tokens from faucet")
console.log("4. Run: npm run dev")
console.log("5. Open http://localhost:3000")
console.log("\n🎯 Happy gaming on Monad blockchain!")
