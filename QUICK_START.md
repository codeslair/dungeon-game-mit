# 🚀 Quick Start Guide - Dungeon Loot Game

## ✅ Prerequisites
- Node.js 16+ installed
- MetaMask browser extension
- Test ETH on Sepolia testnet (get from [sepoliafaucet.com](https://sepoliafaucet.com))

## 📋 Installation

```bash
# Install all dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
cd ..
```

## 🎮 Option 1: Local Testing (Recommended for Development)

### Terminal 1: Start Local Hardhat Node
```bash
npm run node
```

### Terminal 2: Deploy Contract to Local Network
```bash
npm run deploy:local
```

You'll see output like:
```
DungeonToken deployed to: 0x5FbDB2315678afccb333f8a9c6122f65991...
```

**Copy this address!**

### Step 3: Update Contract Address in Code

Edit `frontend/src/App.tsx` and replace the contract address:

```typescript
// Line 19 - Update this with your deployed address
const [contractAddress] = useState<string>('0x5FbDB2315678afccb333f8a9c6122f65991...');
```

### Terminal 3: Start Frontend
```bash
npm run frontend
```

### Step 4: Connect in Browser

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. In MetaMask:
   - Select "Localhost 8545" network
   - Approve connection
4. You should now see the game dashboard!

---

## 🎮 Option 2: Sepolia Testnet Deployment

### Step 1: Setup Environment Variables

Create `.env` file in root:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key
```

Get free API key at [infura.io](https://infura.io)

### Step 2: Deploy to Sepolia

```bash
npm run deploy:sepolia
```

Copy the contract address from output.

### Step 3: Update App.tsx

Same as above - update the contract address in `frontend/src/App.tsx`

### Step 4: Start Frontend

```bash
npm run frontend
```

### Step 5: Connect in Browser

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. In MetaMask:
   - Switch to "Sepolia Test Network"
   - Approve connection
4. Game is ready to play!

---

## 🎮 How to Play

### 1️⃣ Claim Starter Pack (Required First)
- Click the Dungeon card
- Click "Claim Starter Pack" button
- Approve transaction in MetaMask
- You get:
  - 10 Energy ⚡
  - 100 Gold 🪙
  - 1 Common Sword 🗡️

### 2️⃣ Run Dungeons
- Click "Run Dungeon" (costs 1 Energy)
- Approve transaction
- Get random loot:
  - 70% Common Sword
  - 20% Rare Sword
  - 10% Epic Sword
  - Plus 20-50 Gold

### 3️⃣ Craft Items (Coming Soon)
Combine items to create stronger ones!

---

## 🔧 Troubleshooting

### "Contract address not set" message
→ Make sure you've updated the contract address in `App.tsx` with your deployed address

### "Please switch to Sepolia network"
→ In MetaMask, select the correct network and refresh the page

### MetaMask not connecting
→ Make sure MetaMask is installed and enabled in your browser

### Transaction failing
→ Make sure you have enough ETH for gas fees:
  - Sepolia: Get from [sepoliafaucet.com](https://sepoliafaucet.com)
  - Local: Hardhat gives infinite test ETH

### "Insufficient energy"
→ You need at least 1 Energy to run a dungeon. Claim starter pack first or wait for admin to grant more.

---

## 📊 Game Data

### Token IDs
- Energy (1): Spend to run dungeons
- Gold (2): Use for crafting
- Common Sword (1001): 70% dungeon loot
- Rare Sword (1002): 20% dungeon loot
- Epic Sword (1003): 10% dungeon loot
- Legendary Swords (2001-2005): Craft with 5 Epic + 1000 Gold

### Gas Costs (Estimated)
- Claim Starter Pack: ~0.001 ETH
- Run Dungeon: ~0.001 ETH
- Craft: ~0.0015 ETH

---

## 📁 Project Structure

```
dungeon-game/
├── contracts/
│   ├── DungeonToken.sol          # ERC-1155 game contract
│   └── scripts/
│       └── deploy.ts              # Deployment script
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Main app component
│   │   ├── components/
│   │   │   └── Dungeon.tsx       # Dungeon game interface
│   │   └── artifacts/            # Auto-generated ABIs
│   └── package.json
├── hardhat.config.ts             # Hardhat configuration
└── package.json                   # Root dependencies
```

---

## 🐛 Development Commands

```bash
# Compile contracts
npm run compile

# Run tests (if implemented)
npm run test

# Clean build artifacts
npm run clean

# Deploy locally
npm run deploy:local

# Deploy to Sepolia
npm run deploy:sepolia

# Start frontend dev server
npm run frontend

# Build frontend for production
npm run build:frontend

# Run everything together
npm run dev
```

---

## 📝 Next Steps

After getting the game running:

1. **Explore the Dungeon** - Run a few dungeons to collect loot
2. **Check Gas Estimates** - Click the 🔄 button to see current gas prices
3. **Build Inventory** - Collect items and prepare for crafting
4. **Implement Crafting** - Code will be added next!
5. **Add Time Rewards** - Passive income system coming soon

---

## ✨ Features

- ✅ ERC-1155 multi-token standard
- ✅ Starter pack claiming
- ✅ Random dungeon loot
- ✅ Real-time gas estimation
- ✅ MetaMask integration
- ✅ Energy and Gold system
- ⏳ Crafting (implemented, UI coming)
- ⏳ Inventory system
- ⏳ Trading
- ⏳ Leaderboards

---

## 💡 Tips

- **Save gas**: Bundle multiple operations together
- **Test first**: Always test on local network before Sepolia
- **Monitor balance**: Keep an eye on your Energy count
- **Refresh data**: Click the 🔄 button if stats don't update

---

## 🆘 Need Help?

1. Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed information
2. Review contract functions in [contracts/DungeonToken.sol](./contracts/DungeonToken.sol)
3. Check component code in [frontend/src/components/Dungeon.tsx](./frontend/src/components/Dungeon.tsx)

---

**Happy adventuring! 🏰⚔️**
