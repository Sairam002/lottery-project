//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error enterRaffle__InsufficientFunds();
error TransactionFailed();
error enterRaffle__RaffleNotOpen();
error upKeepNotTrue(uint currnetBalance, uint numberOfPlayers, uint state);

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    enum RaffleState {
        OPEN,
        CALCULATING
    }

    uint private immutable i_entranceFee;
    address payable[] private s_playersArray;
    address payable private s_recentWinner;
    RaffleState private s_raffleState;
    uint private s_lastTimeStamp;
    uint private immutable i_interval;

    uint32 private immutable i_callBackGasLimit;
    bytes32 private immutable i_keyHash;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint64 private immutable i_subscriptionId;

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint indexed _requestId);
    event RaffleWinner(address indexed _winner);

    constructor(
        uint _entranceFee,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint32 _callBackGasLimit,
        uint _interval,
        uint64 _subscriptionid
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        i_entranceFee = _entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        i_keyHash = _keyHash;
        i_callBackGasLimit = _callBackGasLimit;
        i_subscriptionId = _subscriptionid;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = _interval;
    }

    function enterRaffle() public payable {
        if ((msg.value) < (i_entranceFee)) {
            revert enterRaffle__InsufficientFunds();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert enterRaffle__RaffleNotOpen();
        }
        s_playersArray.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function checkUpkeep(
        bytes memory /*checkData*/
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /*performData*/
        )
    {
        bool isOpen = false;
        bool timePassed = false;
        bool hasPlayers = false;
        bool hasBalance = false;
        if (s_raffleState == RaffleState.OPEN) {
            isOpen = true;
        }

        uint timeInterval = (block.timestamp - s_lastTimeStamp);
        if (timeInterval > i_interval) {
            timePassed = true;
        }

        if (s_playersArray.length > 0) {
            hasPlayers = true;
        }

        if (address(this).balance > 0) {
            hasBalance = true;
        }

        if (isOpen && timePassed && hasPlayers && hasBalance) {
            upkeepNeeded = true;
        }
    }

    function performUpkeep(
        bytes calldata /*performData*/
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert upKeepNotTrue(
                address(this).balance,
                s_playersArray.length,
                uint(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING;
        uint requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callBackGasLimit,
            NUM_WORDS
        );

        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        uint indexOfWinner = randomWords[0] % (s_playersArray.length);
        address payable winner = s_playersArray[indexOfWinner];
        s_recentWinner = winner;

        (bool success, ) = winner.call{value: address(this).balance}("");
        if (!success) {
            revert TransactionFailed();
        }
        s_playersArray = new address payable[](0);
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        emit RaffleWinner(winner);
    }

    function getVRFCoordinator()
        public
        view
        returns (VRFCoordinatorV2Interface)
    {
        return i_vrfCoordinator;
    }

    function getEntranceFee() public view returns (uint) {
        return i_entranceFee;
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint) {
        return NUM_WORDS;
    }

    function getPlayersAddress(uint _index)
        public
        view
        returns (address payable)
    {
        return s_playersArray[_index];
    }

    function getLatestTimeStamp() public view returns (uint) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint) {
        return i_interval;
    }

    function getSubscriptionId() public view returns (uint64) {
        return i_subscriptionId;
    }
}
