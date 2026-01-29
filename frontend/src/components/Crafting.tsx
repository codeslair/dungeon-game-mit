import React, { useEffect, useState } from 'react';
import { Web3 } from 'web3';
import DungeonTokenABI from '../abis/DungeonToken.json';
import './Crafting.scss';

interface CraftingProps {
  web3: Web3;
  account: string;
  contractAddress: string;
  onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onInventoryUpdate: () => void;
  refreshKey: number;
}

interface DungeonContractMethod {
  call(): Promise<any>;
  send(options: { from: string }): Promise<any>;
  estimateGas(options: { from: string }): Promise<string>;
}

interface DungeonContractInstance {
  methods: {
    balanceOf(address: string, tokenId: number): { call(): Promise<string> };
    hasCraftedLegendary(address: string, tokenId: number): { call(): Promise<boolean> };
    craftRareSword(): DungeonContractMethod;
    craftEpicSword(): DungeonContractMethod;
    craftLegendarySword(legendaryId: number): DungeonContractMethod;
  };
}

type RecipeType = 'rare' | 'epic' | 'legendary';

// Token IDs from smart contract
const TOKEN_IDS = {
  GOLD: 2,
  COMMON: 1001,
  RARE: 1002,
  EPIC: 1003,
  LEGENDARY_IDS: [2001, 2002, 2003, 2004, 2005],
};

/**
 * Crafting Component
 * Allows players to upgrade swords by combining materials
 * Recipes:
 * - Rare: 3 common swords → 1 rare sword
 * - Epic: 2 rare swords → 1 epic sword
 * - Legendary: 5 epic swords + 1000 gold → 1 legendary sword (5 variants)
 */
const Crafting: React.FC<CraftingProps> = ({ web3, account, contractAddress, onNotification, onInventoryUpdate, refreshKey }) => {
  // Contract and UI state
  const [contract, setContract] = useState<DungeonContractInstance | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeType>('rare');
  const [legendaryId, setLegendaryId] = useState<number>(TOKEN_IDS.LEGENDARY_IDS[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gasEstimate, setGasEstimate] = useState<string>('~0.001 ETH');
  
  // Player resource balances
  const [balances, setBalances] = useState({
    common: 0,
    rare: 0,
    epic: 0,
    gold: 0,
  });
  
  // Track which legendary variants player has already crafted
  const [legendaryAlreadyCrafted, setLegendaryAlreadyCrafted] = useState<Set<number>>(new Set());

  // Initialize contract when wallet connects
  useEffect(() => {
    if (web3 && account && contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
      const dungeonContract = new web3.eth.Contract(
        DungeonTokenABI.abi as any,
        contractAddress
      ) as unknown as DungeonContractInstance;
      setContract(dungeonContract);
    }
  }, [web3, account, contractAddress]);

  /**
   * Load player's sword and gold balances from blockchain
   * Also checks which legendary variants they've already crafted
   */
  const loadBalances = async () => {
    if (!contract || !account) return;

    try {
      // Fetch all balance in parallel
      const [common, rare, epic, gold] = await Promise.all([
        contract.methods.balanceOf(account, TOKEN_IDS.COMMON).call(),
        contract.methods.balanceOf(account, TOKEN_IDS.RARE).call(),
        contract.methods.balanceOf(account, TOKEN_IDS.EPIC).call(),
        contract.methods.balanceOf(account, TOKEN_IDS.GOLD).call(),
      ]);

      setBalances({
        common: Number(common),
        rare: Number(rare),
        epic: Number(epic),
        gold: Number(gold),
      });

      // Check which legendary variants have been crafted (prevent duplicates)
      const craftedLegendaries = new Set<number>();
      for (const legId of TOKEN_IDS.LEGENDARY_IDS) {
        const hasCrafted = await contract.methods.hasCraftedLegendary(account, legId).call();
        if (hasCrafted) {
          craftedLegendaries.add(legId);
        }
      }
      setLegendaryAlreadyCrafted(craftedLegendaries);
    } catch (error) {
      console.error('Error loading crafting balances:', error);
    }
  };

  // Reload balances when contract/account changes or inventory is updated
  useEffect(() => {
    if (contract && account) {
      loadBalances();
    }
  }, [contract, account, refreshKey]);

  /**
   * Estimate gas cost for a specific contract method
   * Returns formatted cost in ETH
   */
  const estimateGas = async (method: DungeonContractMethod) => {
    try {
      const gas = await method.estimateGas({ from: account });
      const gasPrice = await web3.eth.getGasPrice();
      const gasCost = BigInt(gas) * BigInt(gasPrice);
      const costInEth = web3.utils.fromWei(gasCost.toString(), 'ether');
      return `~${parseFloat(costInEth).toFixed(4)} ETH`;
    } catch (error) {
      return '~0.001 ETH';
    }
  };

  /**
   * Update gas estimate when recipe or legendary variant selection changes
   */
  const updateGasEstimate = async () => {
    if (!contract || !account) return;

    try {
      let method: DungeonContractMethod;
      if (selectedRecipe === 'rare') {
        method = contract.methods.craftRareSword();
      } else if (selectedRecipe === 'epic') {
        method = contract.methods.craftEpicSword();
      } else {
        method = contract.methods.craftLegendarySword(legendaryId);
      }
      const estimate = await estimateGas(method);
      setGasEstimate(estimate);
    } catch (error) {
      console.error('Error estimating craft gas:', error);
    }
  };

  // Update gas estimate when recipe selection changes
  useEffect(() => {
    updateGasEstimate();
  }, [contract, account, selectedRecipe, legendaryId]);

  const canCraftRare = balances.common >= 3;
  const canCraftEpic = balances.rare >= 2;
  const canCraftLegendary = balances.epic >= 5 && balances.gold >= 1000;

  const canCraft =
    selectedRecipe === 'rare'
      ? canCraftRare
      : selectedRecipe === 'epic'
      ? canCraftEpic
      : canCraftLegendary;

  const handleCraft = async () => {
    if (!contract || !account) return;
    if (selectedRecipe === 'legendary' && legendaryAlreadyCrafted.has(legendaryId)) {
      onNotification('You already crafted this legendary variant!', 'warning');
      return;
    }
    if (!canCraft) {
      onNotification('Insufficient materials for crafting', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      if (selectedRecipe === 'rare') {
        await contract.methods.craftRareSword().send({ from: account });
        onNotification('Crafted Rare Sword!', 'success');
      } else if (selectedRecipe === 'epic') {
        await contract.methods.craftEpicSword().send({ from: account });
        onNotification('Crafted Epic Sword!', 'success');
      } else {
        await contract.methods.craftLegendarySword(legendaryId).send({ from: account });
        onNotification('Crafted Legendary Sword!', 'success');
      }

      await loadBalances();
      onInventoryUpdate();
    } catch (error: any) {
      console.error('Error crafting item:', error);
      onNotification(error.message || 'Crafting failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!contract) {
    return (
      <div className="crafting-container">
        <p className="crafting-empty">Connect your wallet to use crafting.</p>
      </div>
    );
  }

  return (
    <div className="crafting-container">
      <div className="crafting-header">
        <div className="crafting-icon">⚒️</div>
        <h2>Crafting</h2>
      </div>

      <div className="crafting-balances">
        <div className="balance-item">Common: <strong>{balances.common}</strong></div>
        <div className="balance-item">Rare: <strong>{balances.rare}</strong></div>
        <div className="balance-item">Epic: <strong>{balances.epic}</strong></div>
        <div className="balance-item">Gold: <strong>{balances.gold}</strong></div>
      </div>

      <div className="recipe-selector">
        <button
          className={selectedRecipe === 'rare' ? 'active' : ''}
          onClick={() => setSelectedRecipe('rare')}
          disabled={isLoading}
        >
          Craft Rare Sword
        </button>
        <button
          className={selectedRecipe === 'epic' ? 'active' : ''}
          onClick={() => setSelectedRecipe('epic')}
          disabled={isLoading}
        >
          Craft Epic Sword
        </button>
        <button
          className={selectedRecipe === 'legendary' ? 'active' : ''}
          onClick={() => setSelectedRecipe('legendary')}
          disabled={isLoading}
        >
          Craft Legendary Sword
        </button>
      </div>

      {selectedRecipe === 'legendary' && (
        <div className="legendary-selector">
          <label htmlFor="legendaryId">Legendary Variant:</label>
          <select
            id="legendaryId"
            value={legendaryId}
            onChange={(e) => setLegendaryId(Number(e.target.value))}
            disabled={isLoading}
          >
            {TOKEN_IDS.LEGENDARY_IDS.map((id, index) => (
              <option key={id} value={id}>Legendary Sword #{index + 1}</option>
            ))}
          </select>
        </div>
      )}

      <div className="recipe-details">
        <h3>Requirements</h3>
        {selectedRecipe === 'rare' && (
          <ul>
            <li className={canCraftRare ? 'ok' : 'bad'}>{canCraftRare ? '✅' : '❌'} 3 Common Swords</li>
          </ul>
        )}
        {selectedRecipe === 'epic' && (
          <ul>
            <li className={canCraftEpic ? 'ok' : 'bad'}>{canCraftEpic ? '✅' : '❌'} 2 Rare Swords</li>
          </ul>
        )}
        {selectedRecipe === 'legendary' && (
          <ul>
            <li className={balances.epic >= 5 ? 'ok' : 'bad'}>{balances.epic >= 5 ? '✅' : '❌'} 5 Epic Swords</li>
            <li className={balances.gold >= 1000 ? 'ok' : 'bad'}>{balances.gold >= 1000 ? '✅' : '❌'} 1000 Gold</li>
            {legendaryAlreadyCrafted.has(legendaryId) && (
              <li className="bad">⚠️ Already crafted this variant</li>
            )}
          </ul>
        )}
      </div>

      <div className="crafting-actions">
        <button
          className="craft-button"
          onClick={handleCraft}
          disabled={isLoading || !canCraft || (selectedRecipe === 'legendary' && legendaryAlreadyCrafted.has(legendaryId))}
        >
          {isLoading ? 'Crafting...' : 'Craft'}
        </button>
        <div className="action-cost">{gasEstimate}</div>
      </div>
    </div>
  );
};

export default Crafting;
