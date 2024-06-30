import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import { ethers } from "ethers";
require("dotenv").config();

const {
  SEPOLIA_API_URL,
  SEPOLIA_PRIVATE_KEY,
  SEPOLIA_PRIVATE_KEY_2,
  SEPOLIA_ARTIST_PRIVATE_KEY,
  GOERLI_API_URL,
  VAN_LUDWIG_OFFICIAL_PRIVATE_KEY,
  POLYGON_MAINNET_API_URL,
  POLYGON_MUMBAI_API_URL,
  OUTKIVE_OFFICIAL_PRIVATE_KEY,
  GOERLI_PRIVATE_KEY,
  POLYGON_AMOY_API_URL,
  BASE_SEPOLIA_API_URL,
  BASE_API_URL,
} = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "localhost",
  etherscan: {
    apiKey: {
      matic: process.env.POLYGON_SCAN_API_KEY ?? "",
      polygon_amoy: process.env.POLYGON_SCAN_API_KEY ?? "",
      sepolia: process.env.ETHEREUM_SEPOLIA_API_KEY ?? "",
      base_sepolia: process.env.BASE_SEPOLIA_SCAN_API_KEY ?? "",
      base: process.env.BASE_SCAN_API_KEY ?? "",
    },
    customChains: [
      {
        network: "matic",
        chainId: 137,
        urls: {
          apiURL: "https://api.polygonscan.com/api", // The API URL for PolygonScan
          browserURL: "https://polygonscan.com", // The browser URL for PolygonScan
        },
      },
      {
        network: "polygon_amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
      {
        network: "base_sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  networks: {
    sepolia: {
      url: SEPOLIA_API_URL,
      accounts: [
        `0x${OUTKIVE_OFFICIAL_PRIVATE_KEY}`,
        `0x${SEPOLIA_PRIVATE_KEY}`,
        `0x${SEPOLIA_PRIVATE_KEY_2}`,
        `0x${SEPOLIA_ARTIST_PRIVATE_KEY}`,
      ],
    },
    goerli: {
      url: GOERLI_API_URL,
      accounts: [
        `0x${OUTKIVE_OFFICIAL_PRIVATE_KEY}`,
        `0x${GOERLI_PRIVATE_KEY}`,
        `0x${SEPOLIA_ARTIST_PRIVATE_KEY}`,
      ],
    },
    polygon_mumbai: {
      url: POLYGON_MUMBAI_API_URL,
      accounts: [
        `0x${OUTKIVE_OFFICIAL_PRIVATE_KEY}`,
        `0x${VAN_LUDWIG_OFFICIAL_PRIVATE_KEY}`,
      ],
    },
    matic: {
      url: POLYGON_MAINNET_API_URL,
      accounts: [`0x${OUTKIVE_OFFICIAL_PRIVATE_KEY}`],
      gasPrice: Number(ethers.parseUnits("33", "gwei")),
    },
    polygon_amoy: {
      url: POLYGON_AMOY_API_URL,
      accounts: [`0x${OUTKIVE_OFFICIAL_PRIVATE_KEY}`],
      timeout: 600000,
      gasPrice: Number(ethers.parseUnits("33", "gwei")),
    },
    base_sepolia: {
      url: BASE_SEPOLIA_API_URL,
      accounts: [`0x${OUTKIVE_OFFICIAL_PRIVATE_KEY}`],
      timeout: 60000,
      gasPrice: Number(ethers.parseUnits("0.001", "gwei")),
    },
    base: {
      url: BASE_API_URL,
      accounts: [`0x${OUTKIVE_OFFICIAL_PRIVATE_KEY}`],
      timeout: 60000,
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
    alwaysGenerateOverloads: true, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;
