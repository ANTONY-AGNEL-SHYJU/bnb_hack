const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ProductAuthenticity contract to BSC Testnet...");
  console.log("====================================================");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from account:", deployer.address);

  // Check account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "BNB");

  if (balance < hre.ethers.parseEther("0.001")) {
    console.log("⚠️  Warning: Low balance. You might need more test BNB from the faucet:");
    console.log("   https://testnet.binance.org/faucet-smart");
  }

  // Get the contract factory
  const ProductAuthenticity = await hre.ethers.getContractFactory("ProductAuthenticity");

  // Deploy the contract
  console.log("\n📋 Deploying contract...");
  const contract = await ProductAuthenticity.deploy();
  
  // Wait for deployment to complete
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔗 Transaction hash:", contract.deploymentTransaction().hash);
  console.log("⛽ Gas used:", contract.deploymentTransaction().gasLimit.toString());

  // Verify network
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");

  // Show BSCScan link
  console.log("\n🔍 View on BSCScan:");
  console.log("   Contract:", `https://testnet.bscscan.com/address/${contractAddress}`);
  console.log("   Transaction:", `https://testnet.bscscan.com/tx/${contract.deploymentTransaction().hash}`);

  console.log("\n📝 Next Steps:");
  console.log("1. Update your .env file with the contract address:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Verify the contract (optional):");
  console.log(`   npx hardhat verify --network bscTestnet ${contractAddress}`);
  console.log("3. Start your ScanChain server:");
  console.log("   npm start");

  return contractAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((contractAddress) => {
    console.log(`\n🎉 Deployment completed! Contract: ${contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
