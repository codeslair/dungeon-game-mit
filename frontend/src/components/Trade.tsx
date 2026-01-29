import React, { useState, useEffect, useCallback } from 'react';
import { Web3 } from 'web3';
import './Trade.scss';

interface TradeProps {
  web3: Web3 | null;
  account: string;
  contractAddress: string;
  onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  emoji: string;
}

interface SelectedItem {
  id: number;
  name: string;
  emoji: string;
  tradeAmount: number;
}

// Sword token IDs
const SWORD_TYPES: { [key: number]: { name: string; emoji: string } } = {
  1001: { name: 'Common Sword', emoji: '⚔️' },
  1002: { name: 'Rare Sword', emoji: '🗡️' },
  1003: { name: 'Epic Sword', emoji: '⚡🗡️' },
  2001: { name: 'Legendary Sword 1', emoji: '👑' },
  2002: { name: 'Legendary Sword 2', emoji: '👑' },
  2003: { name: 'Legendary Sword 3', emoji: '👑' },
  2004: { name: 'Legendary Sword 4', emoji: '👑' },
  2005: { name: 'Legendary Sword 5', emoji: '👑' },
};

const Trade: React.FC<TradeProps> = ({ web3, account, contractAddress, onNotification }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: SelectedItem }>({});
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gasEstimate, setGasEstimate] = useState<string>('--');

  // Load player inventory (swords only)
  const loadInventory = useCallback(async () => {
    if (!web3 || !account || !contractAddress) return;

    try {
      const contract = new web3.eth.Contract(
        require('../artifacts/contracts/DungeonToken.sol/DungeonToken.json').abi,
        contractAddress
      ) as any;

      const items: InventoryItem[] = [];

      // Check balance for each sword type
      for (const [swordId, swordInfo] of Object.entries(SWORD_TYPES)) {
        const id = parseInt(swordId);
        const balance = await contract.methods.balanceOf(account, id.toString()).call();
        const quantity = parseInt(balance as string);

        if (quantity > 0) {
          items.push({
            id,
            name: swordInfo.name,
            quantity,
            emoji: swordInfo.emoji,
          });
        }
      }

      setInventory(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
      onNotification('Error loading inventory', 'error');
    }
  }, [web3, account, contractAddress, onNotification]);

  // Estimate gas for batch trade
  const estimateTradeGas = useCallback(async () => {
    if (!web3 || !account || !recipientAddress || Object.keys(selectedItems).length === 0) {
      setGasEstimate('--');
      return;
    }

    try {
      const contract = new web3.eth.Contract(
        require('../artifacts/contracts/DungeonToken.sol/DungeonToken.json').abi,
        contractAddress
      ) as any;

      const ids = Object.values(selectedItems).map(item => item.id.toString());
      const amounts = Object.values(selectedItems).map(item => item.tradeAmount.toString());

      const gasEstimate = await contract.methods
        .safeBatchTransferFrom(
          account,
          recipientAddress,
          ids,
          amounts,
          '0x'
        )
        .estimateGas({ from: account });

      const gasPrice = await web3.eth.getGasPrice();
      const gasCost = BigInt(gasEstimate) * BigInt(gasPrice);
      const costInEth = web3.utils.fromWei(gasCost.toString(), 'ether');
      setGasEstimate(`~${parseFloat(costInEth).toFixed(4)} ETH`);
    } catch (error) {
      setGasEstimate('Error estimating');
    }
  }, [web3, account, recipientAddress, selectedItems, contractAddress]);

  // Update gas estimate when inputs change
  useEffect(() => {
    estimateTradeGas();
  }, [estimateTradeGas]);

  // Load inventory on mount
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Validate recipient address
  const isValidAddress = (address: string): boolean => {
    return web3?.utils.isAddress(address) || false;
  };

  // Toggle sword selection and quantity
  const handleItemToggle = (item: InventoryItem) => {
    setSelectedItems(prev => {
      const newSelected = { ...prev };
      
      if (newSelected[item.id]) {
        delete newSelected[item.id];
      } else {
        newSelected[item.id] = {
          id: item.id,
          name: item.name,
          emoji: item.emoji,
          tradeAmount: 1,
        };
      }
      
      return newSelected;
    });
  };

  // Update amount for selected item
  const handleAmountChange = (itemId: number, amount: string) => {
    const parsedAmount = parseInt(amount) || 0;
    const item = inventory.find(i => i.id === itemId);
    
    if (!item || parsedAmount < 0 || parsedAmount > item.quantity) return;

    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        tradeAmount: parsedAmount,
      },
    }));
  };

  // Handle batch trade submission
  const handleTrade = async () => {
    if (!web3 || !account || !recipientAddress) {
      onNotification('Please fill all fields', 'warning');
      return;
    }

    if (!isValidAddress(recipientAddress)) {
      onNotification('Invalid recipient address', 'error');
      return;
    }

    if (Object.keys(selectedItems).length === 0) {
      onNotification('Please select at least one sword', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const contract = new web3.eth.Contract(
        require('../artifacts/contracts/DungeonToken.sol/DungeonToken.json').abi,
        contractAddress
      ) as any;

      const ids = Object.values(selectedItems).map(item => item.id.toString());
      const amounts = Object.values(selectedItems).map(item => item.tradeAmount.toString());
      const itemSummary = Object.values(selectedItems)
        .map(item => `${item.tradeAmount} ${item.name}`)
        .join(', ');

      await contract.methods
        .safeBatchTransferFrom(
          account,
          recipientAddress,
          ids,
          amounts,
          '0x'
        )
        .send({ from: account });

      onNotification(
        `Successfully traded ${itemSummary} to ${recipientAddress.substring(0, 6)}...`,
        'success'
      );

      // Reset form
      setRecipientAddress('');
      setSelectedItems({});

      // Reload inventory
      loadInventory();
    } catch (error: any) {
      console.error('Trade error:', error);
      onNotification(
        error.message || 'Trade failed. Please try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const totalItems = Object.values(selectedItems).reduce((sum, item) => sum + item.tradeAmount, 0);

  return (
    <div className="trade-container">
      <div className="trade-header">
        <div className="trade-icon">🔄</div>
        <h2>Trade</h2>
      </div>

      {inventory.length === 0 ? (
        <div className="trade-empty">
          <p>No swords available to trade</p>
          <p className="hint">Run the dungeon to get swords!</p>
        </div>
      ) : (
        <>
          {/* Item Selection Grid */}
          <div className="trade-section">
            <label>Select Items to Trade:</label>
            <div className="item-selector">
              {inventory.map((item) => {
                const isSelected = selectedItems[item.id];
                return (
                  <div key={item.id} className={`item-card ${isSelected ? 'selected' : ''}`}>
                    <button
                      className="item-option"
                      onClick={() => handleItemToggle(item)}
                    >
                      <span className="item-emoji">{item.emoji}</span>
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">×{item.quantity}</span>
                    </button>
                    {isSelected && (
                      <div className="amount-control">
                        <input
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={isSelected.tradeAmount}
                          onChange={(e) => handleAmountChange(item.id, e.target.value)}
                          className="amount-input"
                          placeholder={`Amount (max ${item.quantity})`}
                          aria-label={`Trade amount for ${item.name}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Items Summary */}
          {totalItems > 0 && (
            <div className="trade-section">
              <label>Items Selected ({totalItems} total):</label>
              <div className="selected-summary">
                {Object.values(selectedItems).map((item) => (
                  <div key={item.id} className="summary-item">
                    <span className="summary-emoji">{item.emoji}</span>
                    <span className="summary-name">{item.name}</span>
                    <span className="summary-qty">×{item.tradeAmount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipient Address Input */}
          <div className="trade-section">
            <label htmlFor="recipient-address">Recipient Address:</label>
            <input
              id="recipient-address"
              type="text"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              aria-label="Recipient wallet address"
              className={`address-input ${
                recipientAddress && !isValidAddress(recipientAddress) ? 'invalid' : ''
              }`}
            />
            {recipientAddress && !isValidAddress(recipientAddress) && (
              <span className="error-text">Invalid Ethereum address</span>
            )}
          </div>

          {/* Gas Estimate */}
          <div className="trade-section">
            <div className="gas-info">
              <span>Gas Cost: <strong>{gasEstimate}</strong></span>
            </div>
          </div>

          {/* Trade Button */}
          <button
            className="trade-button"
            onClick={handleTrade}
            disabled={
              isLoading ||
              Object.keys(selectedItems).length === 0 ||
              !recipientAddress ||
              !isValidAddress(recipientAddress)
            }
          >
            {isLoading ? 'Processing...' : 'Confirm Batch Trade'}
          </button>
        </>
      )}
    </div>
  );
};

export default Trade;
