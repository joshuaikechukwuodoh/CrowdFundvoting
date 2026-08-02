import { network } from "hardhat";

const { ethers } = await network.create();

console.log("Deploying CrowdFund contract...");

const crowdFund = await ethers.deployContract("CrowdFund");
await crowdFund.waitForDeployment();

const address = await crowdFund.getAddress();
console.log("CrowdFund deployed to:", address);
