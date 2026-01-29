import React, { useState, useEffect } from 'react';
import { Web3 } from 'web3';
import DungeonTokenABI from '../abis/DungeonToken.json';
import './Inventory.scss';

interface InventoryProps {
  web3: Web3;
  account: string;
  contractAddress: string;
  refreshKey: number;
}

interface InventoryItem {
  id: number;
  name: string;
  icon: string;
  quantity: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface DungeonContractInstance {
  methods: {
    balanceOf(address: string, tokenId: number): {
      call(): Promise<string>;
    };
  };
}

/**
 * Inventory Component
 * Displays user's sword collection with rarity levels
 * Fetches balances from smart contract for each sword type
 */
const Inventory: React.FC<InventoryProps> = ({ web3, account, contractAddress, refreshKey }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Reload inventory when web3, account, or contract changes
  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3, account, contractAddress, refreshKey]);

  /**
   * Load player's sword inventory from blockchain
   * Queries balance for each sword type (common, rare, epic, legendary)
   */
  const loadInventory = async () => {
    if (!web3 || !account || contractAddress === '0x0000000000000000000000000000000000000000') {
      setIsLoading(false);
      return;
    }

    try {
      const contract = new web3.eth.Contract(
        DungeonTokenABI.abi as any,
        contractAddress
      ) as unknown as DungeonContractInstance;

      // Define all sword types with their token IDs, icons, and rarity
      const tokenIds = [
        { id: 1001, name: 'Common Sword', icon: '🗡️', rarity: 'common' as const },
        { id: 1002, name: 'Rare Sword', icon: '⚔️', rarity: 'rare' as const },
        { id: 1003, name: 'Epic Sword', icon: '⚡🗡️', rarity: 'epic' as const },
        { id: 2001, name: 'Legendary Sword #1', icon: '🗡️✨', rarity: 'legendary' as const },
        { id: 2002, name: 'Legendary Sword #2', icon: '⚔️✨', rarity: 'legendary' as const },
        { id: 2003, name: 'Legendary Sword #3', icon: '🗡️🔥', rarity: 'legendary' as const },
        { id: 2004, name: 'Legendary Sword #4', icon: '⚔️⚡', rarity: 'legendary' as const },
        { id: 2005, name: 'Legendary Sword #5', icon: '🗡️💎', rarity: 'legendary' as const },
      ];

      const inventoryItems: InventoryItem[] = [];

      // Query balance for each sword type
      for (const token of tokenIds) {
        const balance = await contract.methods.balanceOf(account, token.id).call();
        const quantity = Number(balance);
        
        // Only add items that player owns (quantity > 0)
        if (quantity > 0) {
          inventoryItems.push({
            id: token.id,
            name: token.name,
            icon: token.icon,
            quantity,
            rarity: token.rarity,
          });
        }
      }

      setItems(inventoryItems);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setIsLoading(false);
    }
  };

  // Show error message if contract not initialized
  if (!web3 || contractAddress === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="inventory-container">
        <div className="inventory-header">
          <div className="inventory-icon">🎒</div>
          <h2>Inventory</h2>
        </div>
        <p className="no-contract">Please set contract address in App.tsx</p>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="inventory-icon">🎒</div>
        <h2>Inventory</h2>
      </div>

      {isLoading ? (
        <div className="loading">Loading inventory...</div>
      ) : items.length === 0 ? (
        <div className="empty-inventory">
          <p>No items yet!</p>
          <p className="hint">Run dungeons to collect loot!</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {items.map((item) => (
            <div key={item.id} className={`inventory-item ${item.rarity}`}>
              <div className="item-icon">{item.icon}</div>
              <div className="item-info">
                <div className="item-name">{item.name}</div>
                <div className="item-quantity">x{item.quantity}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;
