// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../contracts/YourContract.sol";

contract YourContractTest is Test {
  YourContract public yourContract;

  function setUp() public {
    yourContract = new YourContract();
  }
}
