// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BuyableToken is ERC20 {
    uint256 public constant MINT_AMOUNT = 10 ether; // 100 tokens with 18 decimals
    uint256 public constant PRICE = 5 ether; // 0.1 Free tokens per Buyable token
    IERC20 public immutable paymentToken;

    constructor(
        string memory name, 
        string memory symbol,
        address _paymentToken
    ) ERC20(name, symbol) {
        paymentToken = IERC20(_paymentToken);
    }

    function mint(address to) external {
        require(
            paymentToken.transferFrom(msg.sender, address(this), PRICE),
            "Payment failed"
        );
        _mint(to, MINT_AMOUNT);
    }
}
