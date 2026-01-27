import React, { useState, useEffect, useCallback } from 'react';
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
      
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        web3.eth.getChainId().then(id => {
          const chainIdNumber = Number(id);
          onConnect(newAccount, web3, chainIdNumber);
        });
      }
    }
  }, [disconnectWallet, onConnect]);

  const handleChainChanged = useCallback((newChainId: string) => {
    const chainIdNum = parseInt(newChainId, 16);
    setChainId(chainIdNum);
    updateNetworkName(chainIdNum);
    onNotification(`Network changed to ${getNetworkName(chainIdNum)}`, 'info');
  }, [getNetworkName, onNotification, updateNetworkName]);

  const handleDisconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  useEffect(() => {
    checkWalletConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [checkWalletConnection, handleAccountsChanged, handleChainChanged, handleDisconnect]);

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

  const getNetworkColor = () => {
    if (chainId === 11155111) return '#8a2be2'; // Sepolia purple
    if (chainId === 1) return '#627eea'; // Ethereum blue
    if (chainId === 137) return '#8247e5'; // Polygon purple
    return '#666'; // Default gray
  };

  return (
    <div className="wallet-connect">
      {!account ? (
        <button 
          className="connect-button"
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <span className="connecting-spinner">Connecting...</span>
          ) : (
            'Connect Wallet'
          )}
        </button>
      ) : (
        <div className="wallet-info">
          <div 
            className="network-badge"
            style={{ backgroundColor: getNetworkColor() }}
          >
            {network}
          </div>
          <div className="account-display">
            <span className="account-address">{formatAddress(account)}</span>
            <button 
              className="disconnect-button"
              onClick={disconnectWallet}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;