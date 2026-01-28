import React, { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import WalletConnect from './components/WalletConnect';
import ErrorBox from './components/ErrorBox';
import { useNotification } from './components/NotificationManager';
import './App.scss';

function App() {
  const [account, setAccount] = useState<string>('');
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [chainId, setChainId] = useState<number>(0);
  const [balance, setBalance] = useState<string>('0');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);
  
  // Use custom notification system
  const { addNotification, NotificationContainer } = useNotification();

  // Memoized function to load account balance
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

  useEffect(() => {
    if (account && web3) {
      loadAccountBalance();
      
      // Check if on Sepolia
      const isSepolia = chainId === 11155111;
      setIsWrongNetwork(!isSepolia);
      
      if (!isSepolia && chainId !== 0) {
        setErrorMessage('Please switch to Sepolia network for testing');
      } else {
        setErrorMessage('');
      }
    }
  }, [account, web3, chainId, loadAccountBalance]);

  const getNetworkName = useCallback((id: number): string => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      31337: 'Hardhat Local',
    };
    return networks[id] || `Network ${id}`;
  }, []);

  const handleConnect = useCallback((accountAddress: string, web3Instance: Web3, chainIdNum: number) => {
    setAccount(accountAddress);
    setWeb3(web3Instance);
    setChainId(chainIdNum);
    setErrorMessage('');
    
    addNotification(`Connected to ${getNetworkName(chainIdNum)}`, 'success');
  }, [addNotification, getNetworkName]);

  const handleDisconnect = useCallback(() => {
    setAccount('');
    setWeb3(null);
    setChainId(0);
    setBalance('0');
    setErrorMessage('');
    setIsWrongNetwork(false);
  }, []);

  const handleNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    addNotification(message, type);
  }, [addNotification]);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });
      addNotification('Switched to Sepolia network', 'success');
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, let's add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
          addNotification('Added Sepolia network to wallet', 'success');
        } catch (addError) {
          addNotification('Failed to add Sepolia network to wallet', 'error');
        }
      } else {
        addNotification('Failed to switch network', 'error');
      }
    }
  }, [addNotification]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <h1>🏰 Dungeon Game</h1>
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
                  <span className="stat-value">0</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🪙</div>
                <div className="stat-content">
                  <span className="stat-label">Gold:</span>
                  <span className="stat-value">0</span>
                </div>
              </div>
            </div>

            {/* Game Cards Section */}
            <div className="game-cards">
              <div className="game-card">
                <div className="game-card-icon">🏰</div>
                <h3>Dungeon</h3>
              </div>
              <div className="game-card">
                <div className="game-card-icon">⚒️</div>
                <h3>Crafting</h3>
              </div>
              <div className="game-card">
                <div className="game-card-icon">🎒</div>
                <h3>Inventory</h3>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <div className="content-section">
              <h2>Welcome to Dungeon Game</h2>
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

      <footer className="app-footer">
        <p>Dungeon Game © 2024 | Built with React, Hardhat & Web3.js</p>
        <p className="footer-links">
          <a href="https://hardhat.org" target="_blank" rel="noopener noreferrer">Hardhat</a> • 
          <a href="https://web3js.org" target="_blank" rel="noopener noreferrer">Web3.js</a> • 
          <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">React</a> • 
          <a href="https://www.typescriptlang.org" target="_blank" rel="noopener noreferrer">TypeScript</a>
        </p>
      </footer>
    </div>
  );
}

export default App;