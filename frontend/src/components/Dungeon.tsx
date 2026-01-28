import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import DungeonTokenABI from '../artifacts/contracts/DungeonToken.sol/DungeonToken.json';
import './Dungeon.scss';

interface DungeonProps {
  web3: Web3;
  account: string;
  contractAddress: string;
  onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onBalanceUpdate: (energy: number, gold: number) => void;
}

interface DungeonContractMethod {
  call(): Promise<any>;
  send(options: { from: string }): Promise<any>;
  estimateGas(options: { from: string }): Promise<string>;
}

interface DungeonContractInstance {
  methods: {
    hasClaimedStarterPack(address: string): DungeonContractMethod;
    getInventory(address: string): DungeonContractMethod;
    claimStarterPack(): DungeonContractMethod;
    runDungeon(): DungeonContractMethod;
  };
}

const Dungeon: React.FC<DungeonProps> = ({ web3, account, contractAddress, onNotification, onBalanceUpdate }) => {
  const [contract, setContract] = useState<DungeonContractInstance | null>(null);
  const [energy, setEnergy] = useState<number>(0);
  const [gold, setGold] = useState<number>(0);
  const [hasClaimedStarterPack, setHasClaimedStarterPack] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gasEstimates, setGasEstimates] = useState<{
    starterPack: string;
    runDungeon: string;
  }>({
    starterPack: '~0.001 ETH',
    runDungeon: '~0.001 ETH',
  });

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

  // Load player data
  useEffect(() => {
    if (contract && account) {
      loadPlayerData();
    }
  }, [contract, account]);

  const loadPlayerData = async () => {
    if (!contract || !account) return;

    try {
      // Check if claimed starter pack
      const claimed = await contract.methods.hasClaimedStarterPack(account).call();
      setHasClaimedStarterPack(claimed as boolean);

      // Get inventory
      const inventory = await contract.methods.getInventory(account).call() as any;
      const energyBalance = Number(inventory.energy);
      const goldBalance = Number(inventory.gold);
      
      setEnergy(energyBalance);
      setGold(goldBalance);
      
      // Update parent component
      onBalanceUpdate(energyBalance, goldBalance);
    } catch (error: any) {
      console.error('Error loading player data:', error);
    }
  };

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
    if (!contract || !account) return;

    try {
      const starterPackGas = await estimateGas(contract.methods.claimStarterPack());
      setGasEstimates(prev => ({ ...prev, starterPack: starterPackGas }));

      if (energy >= 1) {
        const runDungeonGas = await estimateGas(contract.methods.runDungeon());
        setGasEstimates(prev => ({ ...prev, runDungeon: runDungeonGas }));
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
    }
  };

  useEffect(() => {
    updateGasEstimates();
  }, [contract, account, energy]);

  const handleClaimStarterPack = async () => {
    if (!contract || !account) return;

    setIsLoading(true);
    try {
      await contract.methods.claimStarterPack().send({ from: account });
      onNotification('Starter Pack claimed successfully! You received 10 Energy, 100 Gold, and 1 Common Sword!', 'success');
      await loadPlayerData();
    } catch (error: any) {
      console.error('Error claiming starter pack:', error);
      onNotification(error.message || 'Failed to claim starter pack', 'error');
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
    } catch (error: any) {
      console.error('Error running dungeon:', error);
      onNotification(error.message || 'Failed to run dungeon', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!contract) {
    return (
      <div className="dungeon-container">
        <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
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

      <div className="dungeon-energy">
        <span className="energy-icon">⚡</span>
        <span className="energy-label">Energy: <strong>{energy}</strong></span>
        <div className="energy-info">Cost: 1 Energy per run</div>
      </div>

      <div className="gas-estimate">
        <span className="gas-icon">⛽</span>
        <span className="gas-text">
          Gas: Base <strong>20 Gwei</strong> + Tip <strong>1.5 Gwei</strong> = <strong>30 Gwei</strong> total
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
          {hasClaimedStarterPack ? 'Already Claimed' : 'Claim Starter Pack'}
        </button>
        <div className="action-cost">{gasEstimates.starterPack}</div>

        <button 
          className="action-button claim-rewards"
          onClick={() => onNotification('Time rewards not yet implemented', 'info')}
          disabled={isLoading}
        >
          Claim Time Rewards
        </button>
        <div className="action-cost">~0.001 ETH</div>
      </div>

      <div className="gas-warning">
        <span className="warning-icon">⚠️</span>
        <span className="warning-text">
          Gas estimates are approximate. Actual cost may vary based on network conditions. Last updated: 6:49:54 PM
        </span>
      </div>
    </div>
  );
};

export default Dungeon;
