// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract Faucet {
    uint256 public constant DRIP_AMOUNT = 0.001 ether;
    uint256 public constant MIN_BALANCE_THRESHOLD = 0.05 ether;
    uint256 public constant LOW_BALANCE_PERCENTAGE = 1;

    address public immutable owner;

    error InsufficientContractBalance();
    error Unauthorized();

    constructor() payable {
        owner = msg.sender;
    }

    function withdraw() external {
        if (msg.sender != owner) {
            revert Unauthorized();
        }
        
        uint256 balance = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Transfer failed");
    }

    function drip(address payable to) external {
        uint256 contractBalance = address(this).balance;
        if (contractBalance == 0) revert InsufficientContractBalance();

        uint256 amountToSend;
        if (contractBalance < MIN_BALANCE_THRESHOLD) {
            // Calculate 1% of remaining balance
            amountToSend = (contractBalance * LOW_BALANCE_PERCENTAGE) / 100;
        } else {
            amountToSend = DRIP_AMOUNT;
        }

        (bool success, ) = payable(to).call{value: amountToSend}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
