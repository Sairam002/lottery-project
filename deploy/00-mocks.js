const { ethers,network } = require("hardhat");
const { developmentChains } = require("../helper-config");

const base_fee = ethers.utils.parseEther("0.25");
const gasPerLink = 1e9;

module.exports = async function({getNamedAccounts, deployments}){
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();

    await deploy("VRFCoordinatorV2Mock", {
        contract : "VRFCoordinatorV2Mock",
        from : deployer,
        log : true,
        args : [base_fee, gasPerLink],
        blockConfirmations : 1
    })
    log("Mocks deployerd...");
}


module.exports.tags = ["all","mocks"]