require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    bscTestnet: {
      url: process.env.BSC_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: process.env.BSC_PRIVATE_KEY ? [process.env.BSC_PRIVATE_KEY] : [],
      chainId: 97,
      gasPrice: 10000000000, // 10 gwei
      gas: 8000000
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || ""
    }
  }
};
