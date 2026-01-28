# 🏰 Dungeon Loot Game - Deployment & Usage Guide

## 🎮 Game Overview

A blockchain-based RPG where players:
- Claim a starter pack (10 Energy, 100 Gold, 1 Common Sword)
- Run dungeons by spending Energy to earn random loot (ERC-1155 items)
- Craft better items from weaker ones
- View inventory and balances in real-time

## 📦 Installation

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

## 🚀 Deployment

### 1. Deploy to Local Hardhat Network

```bash
# Terminal 1: Start local Hardhat node
npm run node

# Terminal 2: Deploy contract
npm run deploy:local
```

The deployment will output the contract address. Copy this address!

### 2. Deploy to Sepolia Testnet

First, update `.env` with your credentials:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

Then deploy:

```bash
npm run deploy:sepolia
```

### 3. Update Frontend Configuration

Open `frontend/src/App.tsx` and update the contract address:

```typescript
const [contractAddress] = useState<string>('YOUR_DEPLOYED_CONTRACT_ADDRESS');
```

## 🎯 Running the Application

### Option 1: Development Mode (All-in-One)

```bash
npm run dev
```

This runs:
- Local Hardhat node
- Contract deployment
- Frontend dev server

### Option 2: Manual Start

```bash
# Start frontend only
npm run frontend

# Or build for production
npm run build:frontend
```

## 🎮 How to Play

### 1. Connect Wallet
- Click "Connect Wallet" in the header
- Approve MetaMask connection
- Switch to the correct network (Sepolia or Hardhat Local)

### 2. Claim Starter Pack
- Navigate to the Dungeon tab
- Click "Claim Starter Pack"
- Approve the transaction in MetaMask
- You'll receive:
  - 10 Energy
  - 100 Gold  
  - 1 Common Sword

### 3. Run Dungeons
- Click "Run Dungeon" (costs 1 Energy)
- Approve the transaction
- Receive random loot:
  - 70% chance: Common Sword
  - 20% chance: Rare Sword
  - 10% chance: Epic Sword
- Also receive 20-50 Gold per run

### 4. Craft Items (Coming Soon)
- **Rare Sword**: 3 Common Swords → 1 Rare Sword
- **Epic Sword**: 2 Rare Swords → 1 Epic Sword
- **Legendary Sword**: 5 Epic Swords + 1000 Gold → 1 Legendary Sword

## 🪙 Token IDs (ERC-1155)

### Fungible Tokens
- **Energy** (ID: 1): Used to run dungeons
- **Gold** (ID: 2): Used for crafting

### Semi-Fungible Items
- **Common Sword** (ID: 1001)
- **Rare Sword** (ID: 1002)
- **Epic Sword** (ID: 1003)

### Unique Items
- **Legendary Swords** (IDs: 2001-2005): Each one unique

## 📝 Smart Contract Functions

### Player Functions
```solidity
claimStarterPack()              // Claim initial items (once per address)
runDungeon()                    // Spend 1 Energy, get random loot
craftRareSword()                // Burn 3 Common → 1 Rare
craftEpicSword()                // Burn 2 Rare → 1 Epic
craftLegendarySword(uint256)    // Burn 5 Epic + 1000 Gold → 1 Legendary
getInventory(address)           // View player's items
```

### Admin Functions
```solidity
mintEnergy(address, amount)     // Give Energy to player
mintGold(address, amount)       // Give Gold to player
```

## 🛠️ Development

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm run test
```

### Clean Build Artifacts
```bash
npm run clean
```

## 🌐 Network Configuration

### Hardhat Local
- Network ID: 31337
- RPC URL: http://127.0.0.1:8545
- No gas fees required

### Sepolia Testnet
- Network ID: 11155111
- RPC URL: https://sepolia.infura.io/v3/YOUR_KEY
- Get test ETH: https://sepoliafaucet.com

## 🔍 Troubleshooting

### Gas Estimation Issues
- Click the refresh (🔄) button to update gas estimates
- Ensure you have enough ETH for gas fees

### MetaMask Not Updating
- The UI automatically syncs with MetaMask events
- Try switching accounts or networks to trigger updates

### Contract Not Found
- Ensure the contract address in `App.tsx` matches your deployment
- Check that you're on the correct network

### Insufficient Energy
- You need at least 1 Energy to run a dungeon
- If you've used all your Energy, you'll need to wait for admin to grant more
  (or implement a time-based energy regeneration system)

## 📊 Game Mechanics

### Energy System
- Start with 10 Energy from starter pack
- Each dungeon run costs 1 Energy
- Energy is burned (permanently consumed)
- Future: Implement time-based regeneration

### Loot System
- Pseudo-random generation using block data
- 70% Common, 20% Rare, 10% Epic
- Also receive 20-50 Gold per dungeon run

### Crafting System
- Burn lower-tier items to create higher-tier items
- Recipes are fixed and transparent
- Gold is required for higher-tier crafts

## 🔐 Security Notes

- Never commit your `.env` file
- Keep your private keys secure
- Test thoroughly on testnets before mainnet deployment
- The random number generation is pseudo-random (suitable for games, not high-stakes applications)

## 📚 Tech Stack

- **Smart Contracts**: Solidity ^0.8.24, OpenZeppelin ERC-1155
- **Development**: Hardhat, TypeChain
- **Frontend**: React 18, TypeScript, Web3.js
- **Styling**: SCSS
- **Network**: Ethereum (Sepolia Testnet / Local Hardhat)

## 🎨 Features

- ✅ ERC-1155 multi-token standard
- ✅ Starter pack claiming (once per address)
- ✅ Dungeon running with random loot
- ✅ Real-time gas estimation
- ✅ MetaMask integration
- ✅ Energy and Gold tracking
- ✅ Crafting recipes
- ⏳ Inventory UI (Coming Soon)
- ⏳ Trading system (Coming Soon)
- ⏳ Time-based rewards (Coming Soon)

## 📄 License

ISC

---

Built with ❤️ using React, Hardhat & Web3.js
