import React, { useState, useEffect, useCallback } from 'react';
import { Web3 } from 'web3';
import WalletConnect from './components/WalletConnect';
import ErrorBox from './components/ErrorBox';
import Dungeon from './components/Dungeon';
import Crafting from './components/Crafting';
import Inventory from './components/Inventory';
import Trade from './components/Trade';
import Footer from './components/Footer';
import { useNotification } from './components/NotificationManager';
import './App.scss';

/**
 * Main App Component
 * Manages wallet connection, account state, and game data
 * Coordinates between all game components (Dungeon, Crafting, Inventory, Trade)
 */
function App() {
  // Wallet and account state
  const [account, setAccount] = useState<string>('');
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [chainId, setChainId] = useState<number>(0);
  const [balance, setBalance] = useState<string>('0');
  
  // Network state
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);
  
  // Game state
  const [energy, setEnergy] = useState<number>(0);
  const [gold, setGold] = useState<number>(0);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState<number>(0);
  
  // Smart contract address on Sepolia testnet
  const [contractAddress] = useState<string>('0x9eAD4A96C3cd8b5c0b9A41dF1F2C632Af5eCF1F7');
  
  // Notification system
  const { addNotification, NotificationContainer } = useNotification();

  // Memoized function to load account ETH balance from blockchain
  const loadAccountBalance = useCallback(async () => {
    if (!account || !web3) return;
    
    try {
      const balanceWei = await web3.eth.getBalance(account);
      const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
      setBalance(parseFloat(balanceEth).toFixed(4));
    } catch (error: any) {
      addNotification('Error loading balance', 'error');
    }
  }, [account, web3, addNotification]);

  // Monitor account/network and validate Sepolia connection
  useEffect(() => {
    if (account && web3) {
      loadAccountBalance();
      
      // Verify user is on Sepolia testnet (chainId 11155111)
      const isSepolia = chainId === 11155111;
      setIsWrongNetwork(!isSepolia);
      
      if (!isSepolia && chainId !== 0) {
        setErrorMessage('Please switch to Sepolia network for testing');
      } else {
        setErrorMessage('');
      }
    }
  }, [account, web3, chainId, loadAccountBalance]);

  // Get human-readable network name from chainId
  const getNetworkName = useCallback((id: number): string => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      31337: 'Hardhat Local',
    };
    return networks[id] || `Network ${id}`;
  }, []);

  // Handle wallet connection success
  const handleConnect = useCallback((accountAddress: string, web3Instance: Web3, chainIdNum: number) => {
    setAccount(accountAddress);
    setWeb3(web3Instance);
    setChainId(chainIdNum);
    setErrorMessage('');
    
    addNotification(`Connected to ${getNetworkName(chainIdNum)}`, 'success');
  }, [addNotification, getNetworkName]);

  // Handle wallet disconnection
  const handleDisconnect = useCallback(() => {
    setAccount('');
    setWeb3(null);
    setChainId(0);
    setBalance('0');
    setErrorMessage('');
    setIsWrongNetwork(false);
  }, []);

  // Forward notification from child components to notification system
  const handleNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    addNotification(message, type);
  }, [addNotification]);

  // Handle energy/gold updates from Dungeon component
  const handleBalanceUpdate = useCallback((energyBalance: number, goldBalance: number) => {
    setEnergy(energyBalance);
    setGold(goldBalance);
  }, []);

  // Trigger inventory refresh after crafting/trading
  const handleInventoryUpdate = useCallback(() => {
    setInventoryRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <h1>Dungeon Loot Game</h1>
          <p className="subtitle">Blockchain Gaming Platform</p>
        </div>
        <div className="header-right">
          {account && (
            <div className="connection-info">
              <div className="info-item">
                <span className="info-label">Account:</span>
                <span className="info-value">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Network:</span>
                <span className="info-value">{getNetworkName(chainId)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Balance:</span>
                <span className="info-value">{balance} ETH</span>
              </div>
            </div>
          )}
          <WalletConnect 
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onNotification={handleNotification}
          />
        </div>
      </header>

      <main className="app-main">
        {/* Notification Container */}
        <NotificationContainer />

        {/* Persistent Error Box */}
        {errorMessage && (
          <ErrorBox 
            message={errorMessage}
            type={isWrongNetwork ? 'warning' : 'error'}
            autoClose={false}
            onClose={() => setErrorMessage('')}
          />
        )}

        {account ? (
          <div className="dashboard">
            {/* Stats Section */}
            <div className="stats-section">
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <span className="stat-label">Energy:</span>
                  <span className="stat-value">{energy}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <span className="stat-label">Gold:</span>
                  <span className="stat-value">{gold}</span>
                </div>
              </div>
            </div>

            {/* Three Column Layout */}
            <div className="game-columns">
              {/* Column 1: Dungeon */}
              {web3 && (
                <Dungeon 
                  web3={web3}
                  account={account}
                  contractAddress={contractAddress}
                  onNotification={handleNotification}
                  onBalanceUpdate={handleBalanceUpdate}
                  onInventoryUpdate={handleInventoryUpdate}
                />
              )}

              {/* Column 2: Crafting */}
              {web3 && (
                <Crafting
                  web3={web3}
                  account={account}
                  contractAddress={contractAddress}
                  onNotification={handleNotification}
                  onInventoryUpdate={handleInventoryUpdate}
                  refreshKey={inventoryRefreshKey}
                />
              )}

              {/* Column 3: Inventory */}
              {web3 && (
                <Inventory 
                  web3={web3}
                  account={account}
                  contractAddress={contractAddress}
                  refreshKey={inventoryRefreshKey}
                />
              )}

              {/* Column 4: Trade */}
              {web3 && (
                <Trade
                  web3={web3}
                  account={account}
                  contractAddress={contractAddress}
                  onNotification={handleNotification}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <div className="content-section">
              <h2>Welcome to Dungeon Loot Game</h2>
              <p className="description">
                This is a blockchain-based dungeon game where you can collect items, 
                battle monsters, and earn rewards. Connect your wallet to get started!
              </p>
              
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🎮</div>
                  <h3>ERC1155 Ready</h3>
                  <p>Multi-token standard for in-game items and characters</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">🔐</div>
                  <h3>Secure Wallet</h3>
                  <p>Connect with MetaMask or any Web3 wallet</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">🌐</div>
                  <h3>Sepolia Testnet</h3>
                  <p>Test environment ready for deployment</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3>Fast & Secure</h3>
                  <p>Built with Hardhat and Web3.js</p>
                </div>
              </div>

              <div className="instructions">
                <h3>Getting Started</h3>
                <ol>
                  <li>Connect your wallet using the button above</li>
                  <li>Switch to Sepolia test network</li>
                  <li>Get test ETH from a Sepolia faucet</li>
                  <li>Start playing the dungeon game!</li>
                </ol>
                <div className="cta-buttons">
                  <a 
                    href="https://sepoliafaucet.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="cta-button primary"
                  >
                    Get Sepolia ETH
                  </a>
                  <a 
                    href="https://metamask.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="cta-button secondary"
                  >
                    Install MetaMask
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;