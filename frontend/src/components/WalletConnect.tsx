import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Web3 } from 'web3';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectProps {
  onConnect: (account: string, web3: Web3, chainId: number) => void;
  onDisconnect: () => void;
  onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

/**
 * WalletConnect Component
 * Manages MetaMask wallet connection and network switching
 * Handles account/network change events and updates parent component
 */
const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, onDisconnect, onNotification }) => {
  const [account, setAccount] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Use refs to avoid stale closures in event listeners
  const accountRef = useRef<string>('');
  const onConnectRef = useRef(onConnect);
  const onNotificationRef = useRef(onNotification);
  
  // Update refs whenever props change
  useEffect(() => {
    accountRef.current = account;
    onConnectRef.current = onConnect;
    onNotificationRef.current = onNotification;
  }, [account, onConnect, onNotification]);

  // Get human-readable network name from chainId
  const getNetworkName = useCallback((id: number): string => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon',
      56: 'BNB Smart Chain',
      42161: 'Arbitrum',
      10: 'Optimism',
      31337: 'Hardhat Local',
    };
    
    return networks[id] || `Unknown Network (${id})`;
  }, []);

  // Update local network name state
  const updateNetworkName = useCallback((chainId: number) => {
    // Network name is computed on-demand, no need to store
    getNetworkName(chainId);
  }, [getNetworkName]);

  // Check if wallet is already connected on component mount
  const checkWalletConnection = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        const web3 = new Web3(window.ethereum);
        
        // Query chainId directly from MetaMask
        const chainIdHex = await window.ethereum.request({ 
          method: 'eth_chainId' 
        });
        const chainIdNumber = parseInt(chainIdHex, 16);
        
        setAccount(accounts[0]);
        updateNetworkName(chainIdNumber);
        onConnect(accounts[0], web3, chainIdNumber);
      }
    } catch (error: any) {
      onNotification(error.message, 'error');
    }
  }, [onConnect, onNotification, updateNetworkName]);

  // Disconnect wallet and reset state
  const disconnectWallet = useCallback(() => {
    setAccount('');
    onDisconnect();
    
    onNotification('Wallet disconnected', 'info');
  }, [onDisconnect, onNotification]);

  // Check wallet connection on component mount
  useEffect(() => {
    checkWalletConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Set up MetaMask event listeners for account/network changes
  useEffect(() => {
    if (!window.ethereum) return;
    
    console.log('Setting up MetaMask event listeners');
    
    // Define listeners that use refs to access latest values
    const onAccountsChanged = (accounts: string[]) => {
      console.log('accountsChanged event fired:', accounts);
      if (accounts.length === 0) {
        // User disconnected wallet from MetaMask
        console.log('No accounts, disconnecting');
        setAccount('');
        onDisconnect();
        onNotificationRef.current('Wallet disconnected', 'info');
      } else {
        // User switched accounts
        const newAccount = accounts[0];
        console.log('New account selected:', newAccount);
        setAccount(newAccount);
        accountRef.current = newAccount;
        
        const web3 = new Web3(window.ethereum);
        window.ethereum.request({ method: 'eth_chainId' }).then((chainIdHex: string) => {
          const chainIdNum = parseInt(chainIdHex, 16);
          console.log('Account changed, calling onConnect with:', newAccount, chainIdNum);
          onConnectRef.current(newAccount, web3, chainIdNum);
        });
      }
    };
    
    const onChainChanged = (chainId: string) => {
      // User switched network in MetaMask
      console.log('chainChanged event fired:', chainId);
      const chainIdNum = parseInt(chainId, 16);
      console.log('Parsed chainId:', chainIdNum);
      onNotificationRef.current(`Network changed to ${getNetworkName(chainIdNum)}`, 'info');
      
      if (accountRef.current && window.ethereum) {
        console.log('Network changed, calling onConnect with:', accountRef.current, chainIdNum);
        const web3 = new Web3(window.ethereum);
        onConnectRef.current(accountRef.current, web3, chainIdNum);
      }
    };
    
    const onDisconnectEvent = () => {
      // MetaMask wallet disconnected (rare event)
      console.log('disconnect event fired');
      setAccount('');
      onDisconnect();
      onNotificationRef.current('Wallet disconnected', 'info');
    };
    
    // Attach event listeners
    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    window.ethereum.on('disconnect', onDisconnectEvent);
    
    console.log('Event listeners attached');
    
    // Cleanup: remove listeners on unmount
    return () => {
      if (window.ethereum) {
        console.log('Removing MetaMask event listeners');
        window.ethereum.removeListener('accountsChanged', onAccountsChanged);
        window.ethereum.removeListener('chainChanged', onChainChanged);
        window.ethereum.removeListener('disconnect', onDisconnectEvent);
      }
    };
  }, [getNetworkName, onDisconnect]);

  // Request wallet connection from user
  const connectWallet = async () => {
    if (!window.ethereum) {
      onNotification('Please install MetaMask to connect your wallet', 'error');
      return;
    }

    setIsConnecting(true);
    
    try {
      // Request accounts from MetaMask
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const web3 = new Web3(window.ethereum);
      const chainIdHex = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      const chainIdNumber = parseInt(chainIdHex, 16);
      
      setAccount(accounts[0]);
      updateNetworkName(chainIdNumber);
      onConnect(accounts[0], web3, chainIdNumber);
      onNotification('Wallet connected successfully!', 'success');
      
    } catch (error: any) {
      if (error.code === 4001) {
        onNotification('Connection rejected by user', 'error');
      } else {
        onNotification(error.message, 'error');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="wallet-connect">
      <button 
        className={`${account ? 'disconnect-button' : 'connect-button'}`}
        onClick={account ? disconnectWallet : connectWallet}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <span className="connecting-spinner">Connecting...</span>
        ) : (
          account ? 'Disconnect' : 'Connect Wallet'
        )}
      </button>
    </div>
  );
};

export default WalletConnect;