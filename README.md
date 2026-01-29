# 🏰 Dungeon Game - Blockchain Gaming Platform

A blockchain-based dungeon game built on Ethereum where players can collect items, battle monsters, craft legendary weapons, and trade with other players. All game assets are ERC-1155 tokens stored on the Sepolia testnet.

## 🎮 Live Demo

**Production**: [https://dungeon-game-mit.vercel.app/](https://dungeon-game-mit.vercel.app/)

## ✨ Features

- **🎒 Starter Pack**: New players receive 10 energy, 100 gold, and 1 common sword
- **⚔️ Dungeon Battles**: Explore dungeons to earn rewards (costs 1 energy per run)
  - 70% chance: Common sword + 20-50 gold
  - 20% chance: Rare sword + 20-50 gold
  - 10% chance: Epic sword + 20-50 gold
- **🔨 Crafting System**: 
  - Craft Rare Swords (3 common swords)
  - Craft Epic Swords (2 rare swords)
  - Craft Legendary Swords (5 epic swords + 1000 gold)
- **💰 Resource Management**: Energy and gold as in-game currencies
- **⏰ Time Rewards**: Claim 1-2 energy and 5-10 gold every 5 minutes
- **🔗 MetaMask Integration**: Connect your wallet to play
- **🎨 Beautiful UI**: Modern, responsive design with SCSS styling

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Web3.js 4.16.0** for blockchain interaction
- **SCSS** for styling
- **Create React App** for build tooling

### Blockchain
- **Hardhat** - Smart contract development framework
- **Solidity** - Smart contract language
- **OpenZeppelin** - Secure contract libraries (ERC-1155, Ownable)
- **Sepolia Testnet** - Ethereum test network

### Deployment
- **Vercel** - Frontend hosting with GitHub auto-deploy
- **GitHub** - Version control and CI/CD

## 📦 Smart Contract

**DungeonToken (ERC-1155)**
- **Network**: Sepolia Testnet
- **Contract Address**: `0x35B8380cf5BbCD4211C928AD78873d6166aF4157`
- **Chain ID**: 11155111

### Token Types
- **1001**: Common Sword (🗡️)
- **1002**: Rare Sword (⚔️)
- **1003**: Epic Sword (⚡🗡️)
- **2001-2005**: Legendary Swords (🗡️✨, ⚔️✨, 🗡️🔥, ⚔️⚡, 🗡️💎)
- **1**: Energy (⚡)
- **2**: Gold (💰)

## 🚀 Getting Started

### Prerequisites

- Node.js v25.5.0 or higher
- npm v11.8.0 or higher
- MetaMask browser extension
- Sepolia testnet ETH (get from [faucet](https://sepoliafaucet.com/))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/codeslair/dungeon-game-mit.git
cd dungeon-game-mit
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. **Set up environment variables**
```bash
# Create .env file in root directory
cp .env.example .env

# Add your configuration:
# SEPOLIA_RPC_URL=your_sepolia_rpc_url
# PRIVATE_KEY=your_private_key
```

4. **Copy contract ABIs**
```bash
npm run copy-abi
```

5. **Start the development server**
```bash
cd frontend
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 🔧 Development Commands

### Smart Contract Development

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat run contracts/scripts/deploy.ts --network sepolia

# Start local Hardhat node
npx hardhat node
```

### Frontend Development

```bash
# Start dev server
cd frontend
npm start

# Build for production
npm run build

# Run tests
npm test

# Copy contract ABIs
npm run copy-abi
```

## 📁 Project Structure

```
dungeon-game/
├── contracts/               # Smart contracts
│   ├── DungeonToken.sol    # Main ERC-1155 game contract
│   └── scripts/
│       └── deploy.ts       # Deployment script
├── frontend/               # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── Dungeon.tsx
│   │   │   ├── Crafting.tsx
│   │   │   ├── Inventory.tsx
│   │   │   └── Trade.tsx
│   │   ├── abis/         # Contract ABIs
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Main app component
│   └── package.json
├── hardhat.config.ts      # Hardhat configuration
├── vercel.json           # Vercel deployment config
└── README.md

```

## 🎯 How to Play

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Switch to Sepolia**: The app will prompt you to switch to Sepolia testnet
3. **Claim Starter Pack**: Get your initial resources (10 energy, 100 gold, 1 common sword)
4. **Explore Dungeons**: Click "Enter Dungeon" to battle and earn gold + swords
5. **Craft Weapons**: Use the crafting menu to upgrade your swords
6. **Manage Resources**: Claim time rewards (1-2 energy, 5-10 gold) every 5 minutes
7. **Trade Items**: Exchange items with other players (coming soon)

## 🔒 Security

- Contract uses OpenZeppelin's audited libraries
- Only contract owner can perform administrative functions
- All transactions require user approval via MetaMask
- No private keys are stored in the application

## 🌐 Deployment

The project uses Vercel for continuous deployment:

1. **Automatic Deployment**: Pushes to `main` branch auto-deploy
2. **Preview Deployments**: Pull requests get preview URLs
3. **Production URL**: https://dungeon-game-mit.vercel.app/

### Manual Deployment

```bash
# Build frontend
cd frontend
npm run build

# The build output is in frontend/build/
# Vercel automatically deploys from this directory
```

## 🐛 Known Issues

- MetaMask must be installed and unlocked
- Sepolia testnet required (mainnet not supported)

## 📝 License

MIT License - feel free to use this project for learning and development.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using React, Hardhat, and Web3.js**
