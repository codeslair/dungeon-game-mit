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
    
    // Events
    event StarterPackClaimed(address indexed player);
    event DungeonRun(address indexed player, uint256 lootId, uint256 amount);
    event ItemCrafted(address indexed player, uint256 resultId, uint256 amount);
    
    constructor() ERC1155("https://game.example/api/item/{id}.json") Ownable(msg.sender) {
        // Owner gets initial supply for testing
        _mint(msg.sender, ENERGY, 1000, "");
        _mint(msg.sender, GOLD, 10000, "");
    }
    
    // Claim starter pack (once per address)
    function claimStarterPack() external {
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
    
    // Craft items - burn lower tier items to create higher tier
    function craftItem(uint256[] memory burnIds, uint256[] memory burnAmounts, uint256 resultId) external {
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
        require(balanceOf(msg.sender, COMMON_SWORD) >= 3, "Insufficient Common Swords");
        
        _burn(msg.sender, COMMON_SWORD, 3);
        _mint(msg.sender, RARE_SWORD, 1, "");
        
        emit ItemCrafted(msg.sender, RARE_SWORD, 1);
    }
    
    // Craft Epic Sword: 2 Rare Swords -> 1 Epic Sword
    function craftEpicSword() external {
        require(balanceOf(msg.sender, RARE_SWORD) >= 2, "Insufficient Rare Swords");
        
        _burn(msg.sender, RARE_SWORD, 2);
        _mint(msg.sender, EPIC_SWORD, 1, "");
        
        emit ItemCrafted(msg.sender, EPIC_SWORD, 1);
    }
    
    // Craft Legendary Sword: 5 Epic Swords + 1000 Gold -> 1 Legendary Sword
    function craftLegendarySword(uint256 legendaryId) external {
        require(legendaryId >= LEGENDARY_SWORD_1 && legendaryId <= LEGENDARY_SWORD_5, "Invalid legendary ID");
        require(balanceOf(msg.sender, EPIC_SWORD) >= 5, "Insufficient Epic Swords");
        require(balanceOf(msg.sender, GOLD) >= 1000, "Insufficient Gold");
        
        _burn(msg.sender, EPIC_SWORD, 5);
        _burn(msg.sender, GOLD, 1000);
        _mint(msg.sender, legendaryId, 1, "");
        
        emit ItemCrafted(msg.sender, legendaryId, 1);
    }
    
    // Admin functions
    function mintEnergy(address to, uint256 amount) external onlyOwner {
        _mint(to, ENERGY, amount, "");
    }
    
    function mintGold(address to, uint256 amount) external onlyOwner {
        _mint(to, GOLD, amount, "");
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