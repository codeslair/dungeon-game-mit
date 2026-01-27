import { ethers } from "hardhat";

async function main() {
  console.log("Deploying DungeonToken...");
  
  const DungeonToken = await ethers.getContractFactory("DungeonToken");
  const dungeonToken = await DungeonToken.deploy();
  
  await dungeonToken.waitForDeployment();
  
  const address = await dungeonToken.getAddress();
  console.log("DungeonToken deployed to:", address);
  console.log("Token name:", await dungeonToken.name());
  console.log("Token symbol:", await dungeonToken.symbol());
  console.log("Total supply:", (await dungeonToken.totalSupply()).toString());
  
  return address;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});