import React, { useState, useEffect, useCallback, useRef } from 'react';
import Web3 from 'web3';

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

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, onDisconnect, onNotification }) => {
  const [account, setAccount] = useState<string>('');
  const [network, setNetwork] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
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

  const updateNetworkName = useCallback((chainId: number) => {
    setNetwork(getNetworkName(chainId));
  }, [getNetworkName]);

  const checkWalletConnection = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        const web3 = new Web3(window.ethereum);
        const chainId = await web3.eth.getChainId();
        const chainIdNumber = Number(chainId);
        
        setAccount(accounts[0]);
        setChainId(chainIdNumber);
        updateNetworkName(chainIdNumber);
        onConnect(accounts[0], web3, chainIdNumber);
      }
    } catch (error: any) {
      onNotification(error.message, 'error');
    }
  }, [onConnect, onNotification, updateNetworkName]);

  const disconnectWallet = useCallback(() => {
    setAccount('');
    setNetwork('');
    setChainId(0);
    onDisconnect();
    
    onNotification('Wallet disconnected', 'info');
  }, [onDisconnect, onNotification]);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      const newAccount = accounts[0];
      setAccount(newAccount);
      accountRef.current = newAccount;
    }
  }, [disconnectWallet]);

  const handleChainChanged = useCallback((newChainId: string) => {
    const chainIdNum = parseInt(newChainId, 16);
    setChainId(chainIdNum);
    updateNetworkName(chainIdNum);
  }, [updateNetworkName]);

  const handleDisconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Set up event listeners once on mount
  useEffect(() => {
    if (!window.ethereum) return;
    
    console.log('Setting up MetaMask event listeners');
    
    // Define listeners that use refs to access latest values
    const onAccountsChanged = (accounts: string[]) => {
      console.log('accountsChanged event fired:', accounts);
      if (accounts.length === 0) {
        console.log('No accounts, disconnecting');
        setAccount('');
        setNetwork('');
        setChainId(0);
        onDisconnect();
        onNotificationRef.current('Wallet disconnected', 'info');
      } else {
        const newAccount = accounts[0];
        console.log('New account selected:', newAccount);
        setAccount(newAccount);
        accountRef.current = newAccount;
        
        const web3 = new Web3(window.ethereum);
        web3.eth.getChainId().then(id => {
          const chainIdNumber = Number(id);
          console.log('Account changed, calling onConnect with:', newAccount, chainIdNumber);
          onConnectRef.current(newAccount, web3, chainIdNumber);
        });
      }
    };
    
    const onChainChanged = (chainId: string) => {
      console.log('chainChanged event fired:', chainId);
      const chainIdNum = parseInt(chainId, 16);
      console.log('Parsed chainId:', chainIdNum);
      setChainId(chainIdNum);
      setNetwork(getNetworkName(chainIdNum));
      onNotificationRef.current(`Network changed to ${getNetworkName(chainIdNum)}`, 'info');
      
      if (accountRef.current && window.ethereum) {
        console.log('Network changed, calling onConnect with:', accountRef.current, chainIdNum);
        const web3 = new Web3(window.ethereum);
        onConnectRef.current(accountRef.current, web3, chainIdNum);
      }
    };
    
    const onDisconnectEvent = () => {
      console.log('disconnect event fired');
      setAccount('');
      setNetwork('');
      setChainId(0);
      onDisconnect();
      onNotificationRef.current('Wallet disconnected', 'info');
    };
    
    // Attach listeners
    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    window.ethereum.on('disconnect', onDisconnectEvent);
    
    console.log('Event listeners attached');
    
    return () => {
      if (window.ethereum) {
        console.log('Removing MetaMask event listeners');
        window.ethereum.removeListener('accountsChanged', onAccountsChanged);
        window.ethereum.removeListener('chainChanged', onChainChanged);
        window.ethereum.removeListener('disconnect', onDisconnectEvent);
      }
    };
  }, [getNetworkName, onDisconnect]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      onNotification('Please install MetaMask to connect your wallet', 'error');
      return;
    }

    setIsConnecting(true);
    
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const web3 = new Web3(window.ethereum);
      const chainId = await web3.eth.getChainId();
      const chainIdNumber = Number(chainId);
      
      setAccount(accounts[0]);
      setChainId(chainIdNumber);
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

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getNetworkColorClass = () => {
    if (chainId === 11155111) return 'network-badge-sepolia';
    if (chainId === 1) return 'network-badge-ethereum';
    if (chainId === 137) return 'network-badge-polygon';
    return 'network-badge-default';
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