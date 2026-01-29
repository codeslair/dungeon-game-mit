// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DungeonToken is ERC1155, Ownable {
    // Token IDs
    uint256 public constant ENERGY = 1;
    uint256 public constant GOLD = 2;
    uint256 public constant COMMON_SWORD = 1001;
    uint256 public constant RARE_SWORD = 1002;
    uint256 public constant EPIC_SWORD = 1003;
    uint256 public constant LEGENDARY_SWORD_1 = 2001;
    uint256 public constant LEGENDARY_SWORD_2 = 2002;
    uint256 public constant LEGENDARY_SWORD_3 = 2003;
    uint256 public constant LEGENDARY_SWORD_4 = 2004;
    uint256 public constant LEGENDARY_SWORD_5 = 2005;
    
    // Game constants
    uint256 public constant DUNGEON_ENERGY_COST = 1;
    uint256 public constant STARTER_PACK_ENERGY = 10;
    uint256 public constant STARTER_PACK_GOLD = 100;
    
    // Tracking who claimed starter pack
    mapping(address => bool) public hasClaimedStarterPack;

    // Player registry for admin resets (demo use only)
    address[] public playerList;
    mapping(address => bool) public isPlayer;
    
    // Tracking last time rewards claim per player
    mapping(address => uint256) public lastTimeRewardClaim;
    uint256 public constant TIME_REWARD_COOLDOWN = 5 minutes;
    
    // Tracking legendary sword crafting (one per variant per player)
    mapping(address => mapping(uint256 => bool)) public hasCraftedLegendary;
    
    // Events
    event StarterPackClaimed(address indexed player);
    event DungeonRun(address indexed player, uint256 lootId, uint256 amount);
    event ItemCrafted(address indexed player, uint256 resultId, uint256 amount);
    event PlayerReset(address indexed player);
    
    constructor() ERC1155("https://game.example/api/item/{id}.json") Ownable(msg.sender) {
        // Owner gets initial supply for testing
        _mint(msg.sender, ENERGY, 1000, "");
        _mint(msg.sender, GOLD, 10000, "");
        _trackPlayer(msg.sender);
    }

    // Internal: track players who interact with the game
    function _trackPlayer(address player) internal {
        if (!isPlayer[player]) {
            isPlayer[player] = true;
            playerList.push(player);
        }
    }

    // Internal: burn full balance of a token if present
    function _burnIfBalance(address player, uint256 tokenId) internal {
        uint256 bal = balanceOf(player, tokenId);
        if (bal > 0) {
            _burn(player, tokenId, bal);
        }
    }

    // Internal: reset a single player (balances + flags)
    function _resetPlayer(address player) internal {
        _burnIfBalance(player, ENERGY);
        _burnIfBalance(player, GOLD);
        _burnIfBalance(player, COMMON_SWORD);
        _burnIfBalance(player, RARE_SWORD);
        _burnIfBalance(player, EPIC_SWORD);
        _burnIfBalance(player, LEGENDARY_SWORD_1);
        _burnIfBalance(player, LEGENDARY_SWORD_2);
        _burnIfBalance(player, LEGENDARY_SWORD_3);
        _burnIfBalance(player, LEGENDARY_SWORD_4);
        _burnIfBalance(player, LEGENDARY_SWORD_5);

        hasClaimedStarterPack[player] = false;
        lastTimeRewardClaim[player] = 0;
        hasCraftedLegendary[player][LEGENDARY_SWORD_1] = false;
        hasCraftedLegendary[player][LEGENDARY_SWORD_2] = false;
        hasCraftedLegendary[player][LEGENDARY_SWORD_3] = false;
        hasCraftedLegendary[player][LEGENDARY_SWORD_4] = false;
        hasCraftedLegendary[player][LEGENDARY_SWORD_5] = false;

        emit PlayerReset(player);
    }
    
    // Claim starter pack (once per address)
    function claimStarterPack() external {
        _trackPlayer(msg.sender);
        require(!hasClaimedStarterPack[msg.sender], "Starter pack already claimed");
        
        hasClaimedStarterPack[msg.sender] = true;
        
        // Mint starter items
        _mint(msg.sender, ENERGY, STARTER_PACK_ENERGY, "");
        _mint(msg.sender, GOLD, STARTER_PACK_GOLD, "");
        _mint(msg.sender, COMMON_SWORD, 1, "");
        
        emit StarterPackClaimed(msg.sender);
    }
    
    // Run dungeon - spend energy to get random loot
    function runDungeon() external {
        _trackPlayer(msg.sender);
        require(balanceOf(msg.sender, ENERGY) >= DUNGEON_ENERGY_COST, "Insufficient energy");
        
        // Burn energy
        _burn(msg.sender, ENERGY, DUNGEON_ENERGY_COST);
        
        // Generate pseudo-random loot
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 100;
        
        uint256 lootId;
        uint256 lootAmount;
        
        if (random < 70) {
            // 70% - Common Sword
            lootId = COMMON_SWORD;
            lootAmount = 1;
        } else if (random < 90) {
            // 20% - Rare Sword
            lootId = RARE_SWORD;
            lootAmount = 1;
        } else {
            // 10% - Epic Sword
            lootId = EPIC_SWORD;
            lootAmount = 1;
        }
        
        // Mint loot
        _mint(msg.sender, lootId, lootAmount, "");
        
        // Also mint some gold as base reward
        uint256 goldReward = 20 + (random % 31); // 20-50 gold
        _mint(msg.sender, GOLD, goldReward, "");
        
        emit DungeonRun(msg.sender, lootId, lootAmount);
    }
    
    // Claim time rewards (once per 24 hours)
    function claimTimeRewards() external {
        _trackPlayer(msg.sender);
        require(
            block.timestamp >= lastTimeRewardClaim[msg.sender] + TIME_REWARD_COOLDOWN,
            "Time reward cooldown not met"
        );
        
        lastTimeRewardClaim[msg.sender] = block.timestamp;
        
        // Generate pseudo-random rewards: 5-10 Gold and 1-2 Energy
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 100;
        uint256 goldReward = 5 + (random % 6);
        uint256 energyReward = 1 + (random % 2);
        
        _mint(msg.sender, ENERGY, energyReward, "");
        _mint(msg.sender, GOLD, goldReward, "");
        
        emit DungeonRun(msg.sender, 0, 0); // Reusing DungeonRun event for time rewards
    }
    
    // Craft items - burn lower tier items to create higher tier
    function craftItem(uint256[] memory burnIds, uint256[] memory burnAmounts, uint256 resultId) external {
        _trackPlayer(msg.sender);
        require(burnIds.length == burnAmounts.length, "Array length mismatch");
        
        // Burn required items
        for (uint256 i = 0; i < burnIds.length; i++) {
            _burn(msg.sender, burnIds[i], burnAmounts[i]);
        }
        
        // Mint result item
        uint256 resultAmount = 1;
        _mint(msg.sender, resultId, resultAmount, "");
        
        emit ItemCrafted(msg.sender, resultId, resultAmount);
    }
    
    // Craft Rare Sword: 3 Common Swords -> 1 Rare Sword
    function craftRareSword() external {
        _trackPlayer(msg.sender);
        require(balanceOf(msg.sender, COMMON_SWORD) >= 3, "Insufficient Common Swords");
        
        _burn(msg.sender, COMMON_SWORD, 3);
        _mint(msg.sender, RARE_SWORD, 1, "");
        
        emit ItemCrafted(msg.sender, RARE_SWORD, 1);
    }
    
    // Craft Epic Sword: 2 Rare Swords -> 1 Epic Sword
    function craftEpicSword() external {
        _trackPlayer(msg.sender);
        require(balanceOf(msg.sender, RARE_SWORD) >= 2, "Insufficient Rare Swords");
        
        _burn(msg.sender, RARE_SWORD, 2);
        _mint(msg.sender, EPIC_SWORD, 1, "");
        
        emit ItemCrafted(msg.sender, EPIC_SWORD, 1);
    }
    
    // Craft Legendary Sword: 5 Epic Swords + 1000 Gold -> 1 Legendary Sword (limit 1 per variant per player)
    function craftLegendarySword(uint256 legendaryId) external {
        _trackPlayer(msg.sender);
        require(legendaryId >= LEGENDARY_SWORD_1 && legendaryId <= LEGENDARY_SWORD_5, "Invalid legendary ID");
        require(!hasCraftedLegendary[msg.sender][legendaryId], "Already crafted this legendary variant");
        require(balanceOf(msg.sender, EPIC_SWORD) >= 5, "Insufficient Epic Swords");
        require(balanceOf(msg.sender, GOLD) >= 1000, "Insufficient Gold");
        
        hasCraftedLegendary[msg.sender][legendaryId] = true;
        
        _burn(msg.sender, EPIC_SWORD, 5);
        _burn(msg.sender, GOLD, 1000);
        _mint(msg.sender, legendaryId, 1, "");
        
        emit ItemCrafted(msg.sender, legendaryId, 1);
    }
    
    // Admin functions
    function mintEnergy(address to, uint256 amount) external onlyOwner {
        _trackPlayer(to);
        _mint(to, ENERGY, amount, "");
    }
    
    function mintGold(address to, uint256 amount) external onlyOwner {
        _trackPlayer(to);
        _mint(to, GOLD, amount, "");
    }

    // Admin: reset players (demo use only)
    function resetPlayer(address player) external onlyOwner {
        _resetPlayer(player);
    }

    function resetPlayers(address[] calldata players) external onlyOwner {
        for (uint256 i = 0; i < players.length; i++) {
            _resetPlayer(players[i]);
        }
    }

    function resetAllPlayers() external onlyOwner {
        for (uint256 i = 0; i < playerList.length; i++) {
            _resetPlayer(playerList[i]);
        }
    }

    // Player registry helpers
    function getPlayerCount() external view returns (uint256) {
        return playerList.length;
    }

    function getPlayerAt(uint256 index) external view returns (address) {
        return playerList[index];
    }
    
    // Get player's full inventory
    function getInventory(address player) external view returns (
        uint256 energy,
        uint256 gold,
        uint256 commonSword,
        uint256 rareSword,
        uint256 epicSword
    ) {
        energy = balanceOf(player, ENERGY);
        gold = balanceOf(player, GOLD);
        commonSword = balanceOf(player, COMMON_SWORD);
        rareSword = balanceOf(player, RARE_SWORD);
        epicSword = balanceOf(player, EPIC_SWORD);
    }
}