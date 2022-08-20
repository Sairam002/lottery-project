require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("hardhat-contract-sizer");
require("solidity-coverage");
// require("hardhat-gas-reporter");

const kovan_url = process.env.kovan_rpc_url;
const private_key = process.env.private_key;

module.exports = {
  solidity: "0.8.9",
  namedAccounts : {
    deployer: {
      default : 0
    },
    player : {
      default : 0
    }
  },
  defaultNetwroks :"hardhat",
  network:{
    hardhat: {
      chainId : 31337,
      blockConfirmations : 1
    },
    goreli:{
      url: kovan_url,
      accounts:[private_key],
      chainId:42,
      blockConfirmations : 6
    }
  }
};
