const { ethers } = require('ethers');
require('dotenv').config();

// Contract bytecode and ABI (you would get this from compiling)
const CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b50611234806100206000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c80638c7ea24b1161005b5780638c7ea24b146100d8578063a879b6d2146100ee578063b83d0a5a14610104578063d7e8a4a81461011a57600080fd5b8063123456781461008257806334356d6e14610098578063747bb3a5146100ae575b600080fd5b61008a610130565b60405190815260200160405180910390f35b6100a0610141565b6040516100a5919061044a565b60405180910390f35b6100c16100bc366004610485565b6101d3565b6040516100ce929190610507565b60405180910390f35b6100e0610298565b6040516100a5929190610507565b6100f66102df565b6040516100a59190610542565b61010c610342565b6040516100a5929190610507565b610122610389565b6040516100a59190610542565b60006001905090565b6060600080546101509061056b565b80601f016020809104026020016040519081016040528092919081815260200182805461017c9061056b565b80156101c95780601f1061019e576101008083540402835291602001916101c9565b820191906000526020600020905b8154815290600101906020018083116101ac57829003601f168201915b5050505050905090565b600160208190526000918252604090912080549181018054919291610201906101f89061056b565b80601f01602080910402602001604051908101604052809291908181526020018280546102249061056b565b80156102715780601f1061024657610100808354040283529160200191610271565b820191906000526020600020905b81548152906001019060200180831161025457829003601f168201915b5050505050905082565b6000806002838154811061028e5761028e6105a6565b9060005260206000200160000154925092505050565b600080600380546102b49061056b565b80601f01602080910402602001604051908101604052809291908181526020018280546102e09061056b565b801561032d5780601f106103025761010080835404028352916020019161032d565b820191906000526020600020905b81548152906001019060200180831161031057829003601f168201915b50505050509150915091565b60008061034f61056b565b8060200260200160405190810160405280929190818152602001828054610375906105bc565b8015610390578160010280835404028352916020019161032d565b604051806020016040528060008152509050915091509150565b60006004600c60005b838110156103b8576103aa816105d1565b925050600101610399565b50919050565b6000602082840312156103d057600080fd5b81356001600160a01b03811681146103e757600080fd5b9392505050565b6000815180845260005b81811015610414576020818501810151868301820152016103f8565b506000602082860101526020601f19601f83011685010191505092915050565b6020815260006103e760208301846103ee565b60008060006060848603121561046a57600080fd5b8335925060208401359150604084013590509250925092565b60006020828403121561049557600080fd5b5035919050565b600081518084526020808501945080840160005b838110156104cc578151875295820195908201906001016104b0565b509495945050505050565b6040815260006104ea604083018561049c565b82810360208401526104fc818561049c565b95945050505050565b604081526000610518604083018561049c565b828103602084015261052a818561049c565b95945050505050565b6020815260006103e7602083018461049c565b602081526000610555602083018461049c565b9392505050565b634e487b7160e01b600052602260045260246000fd5b60028104600182168061057f57607f821691505b602082108103610599576105996105a6565b50919050565b634e487b7160e01b600052603260045260246000fd5b6000600182016105c7576105c76105bc565b5060010190565b634e487b7160e01b600052601160045260246000fdfea2646970667358221220abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789064736f6c63430008130033";

const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "productId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "fileHash",
        "type": "string"
      }
    ],
    "name": "storeProductHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "productId",
        "type": "string"
      }
    ],
    "name": "getProductHash",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "productId",
        "type": "string"
      }
    ],
    "name": "getProductInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "fileHash",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function deployContract() {
  console.log("🚀 Deploying ProductAuthenticity contract to BSC Testnet...");
  console.log("====================================================");

  // Check if private key is available
  if (!process.env.BSC_PRIVATE_KEY) {
    console.log("❌ BSC_PRIVATE_KEY not found in environment variables");
    console.log("Please add your private key to the .env file");
    return;
  }

  try {
    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(
      process.env.BSC_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545"
    );
    
    const wallet = new ethers.Wallet(process.env.BSC_PRIVATE_KEY, provider);
    
    console.log("Deploying from account:", wallet.address);

    // Check account balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "BNB");

    if (balance < ethers.parseEther("0.001")) {
      console.log("⚠️  Warning: Low balance. You might need more test BNB from the faucet:");
      console.log("   https://testnet.binance.org/faucet-smart");
    }

    // Simple contract for deployment (we'll use Remix for the full contract)
    const simpleContractCode = `
      pragma solidity ^0.8.19;
      contract ProductAuthenticity {
        mapping(string => string) private productHashes;
        mapping(string => address) private productOwners;
        mapping(string => uint256) private productTimestamps;
        
        event ProductStored(string indexed productId, string fileHash, address indexed owner);
        
        function storeProductHash(string memory productId, string memory fileHash) public {
          require(bytes(productId).length > 0, "Product ID cannot be empty");
          require(bytes(fileHash).length > 0, "File hash cannot be empty");
          
          productHashes[productId] = fileHash;
          productOwners[productId] = msg.sender;
          productTimestamps[productId] = block.timestamp;
          
          emit ProductStored(productId, fileHash, msg.sender);
        }
        
        function getProductHash(string memory productId) public view returns (string memory) {
          return productHashes[productId];
        }
        
        function getProductInfo(string memory productId) public view returns (
          string memory fileHash,
          address owner,
          uint256 timestamp
        ) {
          return (
            productHashes[productId],
            productOwners[productId],
            productTimestamps[productId]
          );
        }
        
        function productExists(string memory productId) public view returns (bool) {
          return bytes(productHashes[productId]).length > 0;
        }
      }
    `;

    console.log("\n📋 For now, let's use Remix IDE for deployment...");
    console.log("1. Go to https://remix.ethereum.org/");
    console.log("2. Create a new file: ProductAuthenticity.sol");
    console.log("3. Copy the contract code from contracts/ProductAuthenticity.sol");
    console.log("4. Compile with Solidity 0.8.19+");
    console.log("5. Connect to BSC Testnet using MetaMask");
    console.log("6. Deploy the contract");
    console.log("7. Copy the deployed contract address");
    console.log("8. Update the .env file with CONTRACT_ADDRESS=<your_address>");

    console.log("\n🌐 BSC Testnet Details:");
    console.log("Network Name: BSC Testnet");
    console.log("RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545");
    console.log("Chain ID: 97");
    console.log("Symbol: tBNB");
    console.log("Explorer: https://testnet.bscscan.com/");

    // Verify we can connect to the network
    const network = await provider.getNetwork();
    console.log("\n✅ Network connection verified:");
    console.log("Chain ID:", network.chainId.toString());
    console.log("Block number:", await provider.getBlockNumber());

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run the deployment
deployContract().catch(console.error);
