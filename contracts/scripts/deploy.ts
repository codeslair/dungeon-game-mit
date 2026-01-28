import { ethers } from "hardhat";

async function main() {
  console.log("Deploying DungeonToken (ERC-1155)...");
  
  const DungeonToken = await ethers.getContractFactory("DungeonToken");
  const dungeonToken = await DungeonToken.deploy();
  
  await dungeonToken.waitForDeployment();
  
  const address = await dungeonToken.getAddress();
  console.log("DungeonToken deployed to:", address);
  console.log("\n🎮 Game Token IDs:");
  console.log("  Energy:", await dungeonToken.ENERGY());
  console.log("  Gold:", await dungeonToken.GOLD());
  console.log("  Common Sword:", await dungeonToken.COMMON_SWORD());
  console.log("  Rare Sword:", await dungeonToken.RARE_SWORD());
  console.log("  Epic Sword:", await dungeonToken.EPIC_SWORD());
  
  console.log("\n📋 Copy this address to frontend/src/App.tsx:");
  console.log(`  const [contractAddress] = useState<string>('${address}');`);
  
  return address;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});