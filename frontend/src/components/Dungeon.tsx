import React, { useState, useEffect } from 'react';
import { Web3 } from 'web3';
import DungeonTokenABI from '../abis/DungeonToken.json';
import './Dungeon.scss';

interface DungeonProps {
  web3: Web3;
  account: string;
  contractAddress: string;
  onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onBalanceUpdate: (energy: number, gold: number) => void;
  onInventoryUpdate: () => void;
}

interface DungeonContractMethod {
  call(): Promise<any>;
  send(options: { from: string }): Promise<any>;
  estimateGas(options: { from: string }): Promise<string>;
}

interface DungeonContractInstance {
  methods: {
    hasClaimedStarterPack(address: string): DungeonContractMethod;
    lastTimeRewardClaim(address: string): DungeonContractMethod;
    getInventory(address: string): DungeonContractMethod;
    claimStarterPack(): DungeonContractMethod;
    runDungeon(): DungeonContractMethod;
    claimTimeRewards(): DungeonContractMethod;
  };
}

/**
 * Dungeon Component
 * Main game loop for dungeon exploration and rewards
 * Players can:
 * - Claim starter pack (100 energy, 500 gold, 1 common sword)
 * - Run dungeons to earn gold and swords
 * - Claim passive time rewards every 24 hours
 */
const Dungeon: React.FC<DungeonProps> = ({ web3, account, contractAddress, onNotification, onBalanceUpdate, onInventoryUpdate }) => {
  // Contract and wallet state
  const [contract, setContract] = useState<DungeonContractInstance | null>(null);
  
  // Player balance state
  const [energy, setEnergy] = useState<number>(0);
  const [hasClaimedStarterPack, setHasClaimedStarterPack] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlayerDataLoaded, setIsPlayerDataLoaded] = useState<boolean>(false);
  
  // Gas estimation state (for UI display)
  const [gasEstimates, setGasEstimates] = useState<{
    starterPack: string;
    runDungeon: string;
    timeRewards: string;
  }>({
    starterPack: '~0.001 ETH',
    runDungeon: '~0.001 ETH',
    timeRewards: '~0.001 ETH',
  });
  
  // Time reward countdown state
  const [timeRewardCountdown, setTimeRewardCountdown] = useState<string>('Ready');
  const [canClaimTimeReward, setCanClaimTimeReward] = useState<boolean>(true);
  const [lastGasUpdate, setLastGasUpdate] = useState<string>('Never');
  
  // Network gas breakdown display
  const [baseFee, setBaseFee] = useState<string>('--');
  const [priorityFee, setPriorityFee] = useState<string>('--');
  const [totalGas, setTotalGas] = useState<string>('--');

  // Initialize contract with Web3.js
  useEffect(() => {
    if (web3 && account && contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
      try {
        const dungeonContract = new web3.eth.Contract(
          DungeonTokenABI.abi as any,
          contractAddress
        ) as unknown as DungeonContractInstance;
        setContract(dungeonContract);
      } catch (error) {
        console.error('Error initializing contract:', error);
        onNotification('Failed to initialize contract', 'error');
      }
    }
  }, [web3, account, contractAddress, onNotification]);

  // Load player data when contract is ready
  useEffect(() => {
    if (contract && account) {
      setIsPlayerDataLoaded(false);
      loadPlayerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, account]);

  /**
   * Load player state from blockchain:
   * - Starter pack claim status
   * - Current energy and gold balance
   * - Notify parent component of balance updates
   */
  const loadPlayerData = async () => {
    if (!contract || !account) return;

    try {
      // Check if player has already claimed starter pack
      const claimed = await contract.methods.hasClaimedStarterPack(account).call();
      setHasClaimedStarterPack(claimed as boolean);

      // Fetch player's current energy and gold balance
      const inventory = await contract.methods.getInventory(account).call() as any;
      const energyBalance = Number(inventory.energy);
      
      setEnergy(energyBalance);
      
      // Notify parent of balance update
      onBalanceUpdate(energyBalance, Number(inventory.gold));
      setIsPlayerDataLoaded(true);
    } catch (error: any) {
      console.error('Error loading player data:', error);
      setIsPlayerDataLoaded(true);
    }
  };

  /**
   * Estimate gas cost for a specific contract method
   * Returns formatted cost in ETH (e.g., "0.0015 ETH")
   */
  const estimateGas = async (method: DungeonContractMethod) => {
    try {
      const gasEstimate = await method.estimateGas({ from: account });
      const gasPrice = await web3.eth.getGasPrice();
      const gasCost = BigInt(gasEstimate) * BigInt(gasPrice);
      const costInEth = web3.utils.fromWei(gasCost.toString(), 'ether');
      return `~${parseFloat(costInEth).toFixed(4)} ETH`;
    } catch (error) {
      return '~0.001 ETH';
    }
  };

  const updateGasEstimates = async () => {
    if (!contract || !account || !isPlayerDataLoaded) return;

    try {
      // Fetch current gas price from network
      const gasPrice = await web3.eth.getGasPrice();
      const gasPriceGwei = parseFloat(web3.utils.fromWei(gasPrice.toString(), 'gwei'));
      
      // Get latest block to extract base fee (EIP-1559)
      const latestBlock = await web3.eth.getBlock('latest');
      let baseFeeGwei = 0;
      let priorityFeeGwei = 0;
      
      if (latestBlock.baseFeePerGas) {
        baseFeeGwei = parseFloat(web3.utils.fromWei(latestBlock.baseFeePerGas.toString(), 'gwei'));
        priorityFeeGwei = gasPriceGwei - baseFeeGwei;
      } else {
        // Fallback for non-EIP-1559 networks
        baseFeeGwei = gasPriceGwei * 0.9;
        priorityFeeGwei = gasPriceGwei * 0.1;
      }
      
      // Update gas breakdown display
      setBaseFee(baseFeeGwei.toFixed(2));
      setPriorityFee(priorityFeeGwei.toFixed(2));
      setTotalGas(gasPriceGwei.toFixed(2));
      
      // Update all button gas estimates
      if (hasClaimedStarterPack) {
        setGasEstimates(prev => ({ ...prev, starterPack: 'N/A' }));
      } else {
        const starterPackGas = await estimateGas(contract.methods.claimStarterPack());
        setGasEstimates(prev => ({ ...prev, starterPack: starterPackGas }));
      }

      if (energy >= 1) {
        const runDungeonGas = await estimateGas(contract.methods.runDungeon());
        setGasEstimates(prev => ({ ...prev, runDungeon: runDungeonGas }));
      } else {
        setGasEstimates(prev => ({ ...prev, runDungeon: 'N/A' }));
      }
      
      if (canClaimTimeReward) {
        const timeRewardsGas = await estimateGas(contract.methods.claimTimeRewards());
        setGasEstimates(prev => ({ ...prev, timeRewards: timeRewardsGas }));
      } else {
        setGasEstimates(prev => ({ ...prev, timeRewards: 'N/A' }));
      }
      
      // Update timestamp
      const now = new Date();
      setLastGasUpdate(now.toLocaleTimeString());
    } catch (error) {
      console.error('Error estimating gas:', error);
    }
  };

  useEffect(() => {
    updateGasEstimates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, account, energy, hasClaimedStarterPack, canClaimTimeReward, isPlayerDataLoaded]);

  // Timer for Time Rewards (update every second)
  useEffect(() => {
    if (contract && account) {
      // Call immediately on mount
      updateTimeRewardCountdown();
      
      const timer = setInterval(() => {
        updateTimeRewardCountdown();
      }, 1000);

      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, account]);

  const updateTimeRewardCountdown = async () => {
    if (!contract || !account) return;

    try {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const lastClaim = await contract.methods.lastTimeRewardClaim(account).call() as string;
      const lastClaimTimestamp = parseInt(lastClaim);
      const cooldownDuration = 5 * 60; // 5 minutes in seconds

      const nextClaimTime = lastClaimTimestamp + cooldownDuration;
      const timeRemaining = nextClaimTime - now;

      if (timeRemaining <= 0) {
        setCanClaimTimeReward(true);
        setTimeRewardCountdown('Ready');
      } else {
        setCanClaimTimeReward(false);
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        setTimeRewardCountdown(`${minutes}m ${seconds}s`);
      }
    } catch (error: any) {
      console.error('Error updating time reward countdown:', error);
      // If error (likely first-time claim), allow claiming
      setCanClaimTimeReward(true);
      setTimeRewardCountdown('Ready');
    }
  };

  const handleClaimStarterPack = async () => {
    if (!contract || !account) return;
    if (hasClaimedStarterPack) {
      onNotification('Starter pack already claimed for this wallet.', 'info');
      return;
    }

    setIsLoading(true);
    try {
      await contract.methods.claimStarterPack().send({ from: account });
      onNotification('Starter Pack claimed successfully! You received 10 Energy, 100 Gold, and 1 Common Sword!', 'success');
      await loadPlayerData();
      onInventoryUpdate();
    } catch (error: any) {
      console.error('Error claiming starter pack:', error);
      const message = error?.message || 'Failed to claim starter pack';
      if (message.toLowerCase().includes('starter pack already claimed')) {
        onNotification('Starter pack already claimed for this wallet.', 'info');
      } else {
        onNotification(message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDungeon = async () => {
    if (!contract || !account) return;
    if (energy < 1) {
      onNotification('Not enough energy to run dungeon', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await contract.methods.runDungeon().send({ from: account });
      onNotification('Dungeon completed! Check your inventory for loot!', 'success');
      await loadPlayerData();
      onInventoryUpdate();
    } catch (error: any) {
      console.error('Error running dungeon:', error);
      onNotification(error.message || 'Failed to run dungeon', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimTimeRewards = async () => {
    if (!contract || !account) return;
    if (!canClaimTimeReward) {
      onNotification('Please wait before claiming again', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      // Call smart contract method - this will trigger MetaMask
      await contract.methods.claimTimeRewards().send({ from: account });
      onNotification('Time Rewards claimed! Check your inventory for Energy and Gold!', 'success');
      
      // Update countdown and reload data
      updateTimeRewardCountdown();
      await loadPlayerData();
      onInventoryUpdate();
    } catch (error: any) {
      console.error('Error claiming time rewards:', error);
      onNotification(error.message || 'Failed to claim time rewards', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!contract) {
    return (
      <div className="dungeon-container">
        <p className="no-contract-message">
          ⚠️ Please set contract address in App.tsx
        </p>
      </div>
    );
  }

  return (
    <div className="dungeon-container">
      <div className="dungeon-header">
        <div className="dungeon-icon">🏰</div>
        <h2>Dungeon</h2>
      </div>

      {/* Time Rewards Timer Display */}
      {!canClaimTimeReward && (
        <div className="time-rewards-timer">
          <span className="timer-icon">⏱️</span>
          <span className="timer-label">Next Claim Available In:</span>
          <span className="timer-countdown">{timeRewardCountdown}</span>
        </div>
      )}

      <div className="dungeon-actions">
        <button 
          className="action-button run-dungeon"
          onClick={handleRunDungeon}
          disabled={isLoading || energy < 1}
        >
          {isLoading ? 'Processing...' : 'Run Dungeon'}
        </button>
        <div className="action-cost">{gasEstimates.runDungeon}</div>

        <button 
          className="action-button claim-starter"
          onClick={handleClaimStarterPack}
          disabled={isLoading || hasClaimedStarterPack}
        >
          {hasClaimedStarterPack ? 'Starter Pack Claimed' : 'Claim Starter Pack'}
        </button>
        <div className="action-cost">{gasEstimates.starterPack}</div>

        <button 
          className="action-button claim-rewards"
          onClick={handleClaimTimeRewards}
          disabled={isLoading || !canClaimTimeReward}
          title={canClaimTimeReward ? 'Claim your daily rewards!' : `Available in ${timeRewardCountdown}`}
        >
          {canClaimTimeReward ? '✓ Claim Time Rewards' : 'Time Rewards Cooldown'}
        </button>
        <div className="action-cost">{gasEstimates.timeRewards}</div>
      </div>

      <div className="gas-estimate">
        <span className="gas-icon">⛽</span>
        <span className="gas-text">
          Gas: Base <strong>{baseFee} Gwei</strong> + Tip <strong>{priorityFee} Gwei</strong> = <strong>{totalGas} Gwei</strong> total
        </span>
      </div>

      <div className="gas-warning">
        <span className="warning-icon">⚠️</span>
        <span className="warning-text">
          Gas estimates are approximate. Actual cost may vary based on network conditions. Last updated: {lastGasUpdate}
        </span>
        <button className="refresh-gas" onClick={updateGasEstimates} disabled={isLoading}>
          🔄
        </button>
      </div>

      <div className="loot-chances">
        <h3>Loot Chances:</h3>
        <ul>
          <li><span className="chance">70%</span> - Common Sword</li>
          <li><span className="chance">20%</span> - Rare Sword</li>
          <li><span className="chance">10%</span> - Epic Sword</li>
        </ul>
      </div>

      <div className="loot-chances dungeon-cost-note">
        <h3>Dungeon Cost:</h3>
        <ul>
          <li><span className="chance">Cost:</span> 1 Energy per run</li>
        </ul>
      </div>

      <div className="loot-chances time-rewards-info">
        <h3>Time Rewards (5min cooldown):</h3>
        <ul>
          <li><span className="chance">Energy:</span> 1-2 (random)</li>
          <li><span className="chance">Gold:</span> 5-10 (random)</li>
        </ul>
      </div>
    </div>
  );
};

export default Dungeon;
