const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const {getNamedAccounts, deployments,ethers, network} = require("hardhat");
const {assert, expect} = require("chai");
const { inputToConfig } = require("@ethereum-waffle/compiler");
const {networkConfig} = require("../../helper-config");


describe("Testing for Raffle contract",function(){

    let deployer, raffle, interval, mocks;
    beforeEach(async function(){
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        raffle = await ethers.getContract("Raffle", deployer);
        mocks = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        interval = await raffle.getInterval();
    })

    describe("Constructor", function(){

        it("Checks if raffle is open or not", async function(){
            const response = await raffle.getRaffleState();
            const interval = await raffle.getInterval();
            const entranceFee = await raffle.getEntranceFee();
            const subscriptionId = await raffle.getSubscriptionId();

            assert.equal(response.toString(),"0");
            assert.equal(interval.toString(), "30");
            assert.equal(entranceFee.toString(), ethers.utils.parseEther("0.01"));
            assert.equal(subscriptionId.toString(), "1");

        })
    })

    describe("Testing for 'enter raffle' function",function(){
        it("Checks if minimum amount is entered",async function(){
            // const value = await raffle.enterRaffle();
            await expect(raffle.enterRaffle()).to.be.revertedWith("enterRaffle__InsufficientFunds");
        })

        it("Player added to array",async function(){
            await raffle.enterRaffle({value : ethers.utils.parseEther("0.01")});
            const playerAddress = await raffle.getPlayersAddress(0);
            assert.equal(playerAddress,deployer);
        })

        it("Emit event", async function(){
            const value = await raffle.enterRaffle({value:ethers.utils.parseEther("0.01")});
            expect(value).to.emit(raffle, "RaffleEnter")
        })

        it("Doesn't allow if raffle is in calculating stage", async function(){
            await raffle.enterRaffle({value : ethers.utils.parseEther("0.01")});
            await network.provider.send("evm_increaseTime",[interval. toNumber() + 1]);
            await network.provider.send("evm_mine", []);
            await raffle.performUpkeep([]);
            await expect(raffle.enterRaffle({value : ethers.utils.parseEther("0.01")})).to.be.revertedWith("enterRaffle__RaffleNotOpen");
        })
    })

    describe("Testing for checkUpkeep function", function(){
        it("Returns false if amount is not sent", async function(){
            await network.provider.send("evm_increaseTime", [interval.toNumber()+ 1]);
            await network.provider.send("evm_mine",[]);
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x");
            assert.equal(upkeepNeeded, false);
        })

        it("time not sufficient",async function(){
            await raffle.enterRaffle({value : ethers.utils.parseEther("0.01")});
            await network.provider.send("evm_increaseTime", [interval.toNumber() - 1]);
            await network.provider.send("evm_mine",[]);
            const {upkeepNeeded}  = await raffle.callStatic.checkUpkeep("0x");
            assert.equal(false, upkeepNeeded);
        })

        it("raffle is calculating", async function(){
            await raffle.enterRaffle({value : ethers.utils.parseEther("0.01")});
            await network.provider.send("evm_increaseTime", [interval.toNumber()+ 1]);
            await network.provider.send("evm_mine",[]);
            await raffle.performUpkeep("0x");
            const state = await raffle.getRaffleState();
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x");
            assert.equal(state.toString(), 1);
        })

        it("Returns true if all if's passed", async function(){
            await raffle.enterRaffle({value:ethers.utils.parseEther("0.01")});
            await network.provider.send("evm_increaseTime", [interval.toNumber()+1]);
            await network.provider.send("evm_mine",[]);
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x");
            assert(upkeepNeeded, true);
        })
    })

    describe("Test for performUpkeep function",function(){
        it("Only passes if upkeepNeeded is true", async function(){
            await raffle.enterRaffle({value:ethers.utils.parseEther("0.01")});
            await network.provider.send("evm_increaseTime", [interval.toNumber()+1]);
            await network.provider.send("evm_mine",[]);
            const response = await raffle.performUpkeep([]);
            assert(response);
        })

        it("reverts if upkeepNeeded is false", async function(){
            await raffle.enterRaffle({value:ethers.utils.parseEther("0.01")});
            await network.provider.send("evm_increaseTime", [interval.toNumber()-1]);
            await network.provider.send("evm_mine",[]);
            // const response = raffle.performUpkeep([]);
            await expect(raffle.performUpkeep([])).to.be.revertedWith("upKeepNotTrue");
        })
    })

})