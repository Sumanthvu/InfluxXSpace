# Space Puzzle Game - Monad Blockchain

A decentralized space puzzle game built on the Monad blockchain where players collect keys, avoid enemies, and earn NFT rewards.

## Features

- **Blockchain Integration**: Built on Monad testnet with smart contract integration
- **NFT Rewards**: Earn exclusive NFT badges for reaching point milestones
- **Progressive Difficulty**: Enemy count increases every 2 rounds with level scaling
- **Leaderboard System**: Compete with other players on the global leaderboard
- **Daily Rewards**: Claim daily points to boost your progress
- **Key Conversion**: Convert collected keys into points (50 keys = 10 points)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- **MetaMask** browser extension
- **Git** for version control

## Installation & Setup

### Step 1: Clone/Download the Project

If you downloaded the ZIP file:
1. Extract the ZIP file to your desired location
2. Open terminal/command prompt
3. Navigate to the extracted folder:
   \`\`\`bash
   cd space-puzzle-game
   \`\`\`

If using Git:
\`\`\`bash
git clone <repository-url>
cd space-puzzle-game
\`\`\`

### Step 2: Install Dependencies

Run the following command to install all required packages:

\`\`\`bash
npm install
\`\`\`

Or if you prefer yarn:
\`\`\`bash
yarn install
\`\`\`

### Step 3: Configure MetaMask for Monad Network

1. Open MetaMask browser extension
2. Click on the network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add Network" or "Custom RPC"
4. Enter the following details:

   - **Network Name**: Monad Testnet
   - **New RPC URL**: https://testnet1.monad.xyz
   - **Chain ID**: 666
   - **Currency Symbol**: MON
   - **Block Explorer URL**: https://testnet1.monad.xyz

5. Click "Save" to add the network
6. Switch to the Monad Testnet network

### Step 4: Get Testnet Tokens

To interact with the game, you'll need MON tokens for transaction fees:

1. Visit the Monad testnet faucet (if available)
2. Enter your wallet address
3. Request testnet MON tokens
4. Wait for the tokens to arrive in your wallet

### Step 5: Start the Development Server

Run the development server:

\`\`\`bash
npm run dev
\`\`\`

Or with yarn:
\`\`\`bash
yarn dev
\`\`\`

The application will start on `http://localhost:3000`

### Step 6: Connect Your Wallet

1. Open your browser and go to `http://localhost:3000`
2. Click the "Connect Wallet" button in the top right
3. Approve the connection in MetaMask
4. Ensure you're connected to the Monad Testnet network

## Game Instructions

### How to Play

1. **Movement**: Use arrow keys to move your character (cyan circle)
2. **Objective**: Collect all blue keys in each round
3. **Avoid Enemies**: Stay away from purple enemies that move around the board
4. **Complete Rounds**: After collecting all keys, reach the orange spaceship
5. **Level Progression**: Complete all rounds in a level to advance

### Game Mechanics

- **Level Structure**: Level 1 has 5 rounds, Level 2 has 10 rounds, etc.
- **Enemy Scaling**: Enemy count increases every 2 rounds
- **Scoring**: 
  - Keys: 100 × level points each
  - Round completion: 500 × level bonus points
- **Lives**: Game ends if you touch an enemy

### Blockchain Features

- **Save Progress**: Click "Save Progress" to sync your game data to the blockchain
- **Daily Points**: Claim daily points once every 24 hours
- **Key Conversion**: Convert 50 keys into 10 points
- **NFT Badges**: Automatically earn badges at 50, 200, and 900 points

## Smart Contract

- **Network**: Monad Testnet
- **Contract Address**: `0x833D0f532979b56E302056d46FbcC43c89d4e50B`
- **Features**: Player progress tracking, leaderboard, NFT badge minting

## Project Structure

\`\`\`
space-puzzle-game/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── game/              # Game page
│   ├── dashboard/         # Player dashboard
│   ├── profile/           # Player profile
│   └── achievements/      # Achievements page
├── components/            # React components
│   ├── ui/               # UI components
│   ├── game-board.tsx    # Main game component
│   └── navigation.tsx    # Navigation component
├── hooks/                # Custom React hooks
│   ├── use-wallet.ts     # Wallet connection hook
│   └── use-toast.ts      # Toast notification hook
└── lib/                  # Utility functions
\`\`\`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### Common Issues

1. **MetaMask Connection Issues**
   - Ensure MetaMask is installed and unlocked
   - Check that you're on the Monad Testnet network
   - Try refreshing the page and reconnecting

2. **Transaction Failures**
   - Ensure you have enough MON tokens for gas fees
   - Check that the contract address is correct
   - Verify you're on the correct network

3. **Game Not Loading**
   - Check browser console for errors
   - Ensure all dependencies are installed
   - Try clearing browser cache

4. **Network Issues**
   - Verify Monad RPC URL is accessible
   - Check your internet connection
   - Try switching networks and back

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify your MetaMask configuration
3. Ensure you have testnet tokens
4. Check that the smart contract is deployed and accessible

## Development

### Adding New Features

1. Create new components in the `components/` directory
2. Add new pages in the `app/` directory
3. Update smart contract interactions in the respective page files
4. Test thoroughly on the Monad testnet

### Smart Contract Integration

The game integrates with a Solidity smart contract that handles:
- Player progress tracking
- Leaderboard management
- NFT badge minting
- Daily point claims
- Key to point conversions

## License

This project is for educational and demonstration purposes.

## Support

For technical support or questions about the game, please check the troubleshooting section above or refer to the Monad documentation.
\`\`\`

Now let's create a simple setup script to help with installation:
