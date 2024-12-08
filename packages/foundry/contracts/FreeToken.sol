// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FreeToken is ERC20 {
    uint256 public constant MINT_AMOUNT = 100 * 10**18; // 100 tokens with 18 decimals

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to) external {
        _mint(to, MINT_AMOUNT);
    }
}
