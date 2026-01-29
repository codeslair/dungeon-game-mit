import React, { useEffect, useState } from 'react';
import { Web3 } from 'web3';
import DungeonTokenABI from '../abis/DungeonToken.json';
import './AdminPanel.scss';

interface AdminPanelProps {
  web3: Web3;
  account: string;
  contractAddress: string;
  onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onInventoryUpdate: () => void;
}

interface DungeonContractMethod {
  call(): Promise<any>;
  send(options: { from: string }): Promise<any>;
}

interface DungeonContractInstance {
  methods: {
    owner(): DungeonContractMethod;
    resetPlayer(address: string): DungeonContractMethod;
    resetPlayers(addresses: string[]): DungeonContractMethod;
    resetAllPlayers(): DungeonContractMethod;
  };
}

const AdminPanel: React.FC<AdminPanelProps> = ({ web3, account, contractAddress, onNotification, onInventoryUpdate }) => {
  const [contract, setContract] = useState<DungeonContractInstance | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [addressInput, setAddressInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (web3 && account && contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
      const dungeonContract = new web3.eth.Contract(
        DungeonTokenABI.abi as any,
        contractAddress
      ) as unknown as DungeonContractInstance;
      setContract(dungeonContract);
    }
  }, [web3, account, contractAddress]);

  useEffect(() => {
    const loadOwner = async () => {
      if (!contract || !account) return;
      try {
        const owner = await contract.methods.owner().call();
        setOwnerAddress(owner as string);
        setIsOwner(owner?.toLowerCase() === account.toLowerCase());
      } catch (error) {
        console.error('Error loading owner:', error);
      }
    };
    loadOwner();
  }, [contract, account]);

  const parseAddresses = (): string[] => {
    const raw = addressInput
      .split(/[\s,]+/)
      .map(value => value.trim())
      .filter(Boolean);

    const invalid = raw.filter(addr => !web3.utils.isAddress(addr));
    if (invalid.length > 0) {
      onNotification(`Invalid address(es): ${invalid.join(', ')}`, 'warning');
      return [];
    }
    return raw;
  };

  const handleResetSelected = async () => {
    if (!contract || !account) return;
    const addresses = parseAddresses();
    if (addresses.length === 0) {
      onNotification('Please enter at least one valid address.', 'warning');
      return;
    }

    if (!window.confirm(`Reset ${addresses.length} player(s)? This will burn all balances and reset flags.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await contract.methods.resetPlayers(addresses).send({ from: account });
      onNotification('Player balances reset successfully.', 'success');
      onInventoryUpdate();
      setAddressInput('');
    } catch (error: any) {
      console.error('Reset players error:', error);
      onNotification(error?.message || 'Reset failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAll = async () => {
    if (!contract || !account) return;
    if (!window.confirm('Reset ALL tracked players? This may fail if the list is large.')) {
      return;
    }

    setIsLoading(true);
    try {
      await contract.methods.resetAllPlayers().send({ from: account });
      onNotification('All tracked players reset successfully.', 'success');
      onInventoryUpdate();
    } catch (error: any) {
      console.error('Reset all players error:', error);
      onNotification(error?.message || 'Reset all failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h3>Admin Controls</h3>
        <span className="admin-owner">Owner: {ownerAddress}</span>
      </div>

      <div className="admin-section">
        <label htmlFor="reset-addresses">Reset specific players (comma or newline separated):</label>
        <textarea
          id="reset-addresses"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="0xabc...\n0xdef..."
          rows={4}
          disabled={isLoading}
        />
        <button className="admin-button" onClick={handleResetSelected} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Reset Selected Players'}
        </button>
      </div>

      <div className="admin-section danger">
        <p className="warning">Danger zone: resets all tracked players (gas heavy).</p>
        <button className="admin-button danger" onClick={handleResetAll} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Reset All Players'}
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
