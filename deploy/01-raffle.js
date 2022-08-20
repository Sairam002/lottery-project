const { ethers } = require("hardhat");
const { networks } = require("../hardhat.config");
const { developmentChains, networkConfig } = require("../helper-config");

module.exports = async({getNamedAccounts, deployments}) =>{
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;
    const entranceFee = networkConfig[chainId].entranceFee;
    const subscriptionFundAmount = ethers.utils.parseEther("2");
    const callBackGasLimit = networkConfig[chainId].callBackGasLimit;
    const interval = 30;
    const keyHash = networkConfig[chainId].keyHash;

    let VRFCoordinatorV2address;
    let subscriptionId;

    if(developmentChains.includes(network.name)){
        const vrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock");
        VRFCoordinatorV2address = vrfCoordinatorV2.address;
        const transactionResponse = await vrfCoordinatorV2.createSubscription();
        const transactionReceipt = await transactionResponse.wait(1);
        subscriptionId = transactionReceipt.events[0].args.subId;
        await vrfCoordinatorV2.fundSubscription(subscriptionId, subscriptionFundAmount);
        // await vrfCoordinatorV2.addConsumer(subscriptionId, raffle.address);

    }else{
        VRFCoordinatorV2address = networkConfig[chainId].VRFCoordinatorV2address;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }

    const raffle = await deploy("Raffle",{
        contract : "Raffle",
        args :[entranceFee, VRFCoordinatorV2address, keyHash, callBackGasLimit, interval, subscriptionId],
        from : deployer,
        log : true,
        waitConformations : network.config.blockConfirmations || 1
    })
}



module.exports.tags = ["all", "raffle"]