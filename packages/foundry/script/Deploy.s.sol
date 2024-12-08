//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/YourContract.sol";
import "../contracts/Batcher.sol";
import "../contracts/Faucet.sol";
import "../contracts/FreeToken.sol";
import "../contracts/BuyableToken.sol";
contract DeployScript is ScaffoldETHDeploy {

  function logNewContract(string memory name, address addr) internal pure {
    console.logString(
      string.concat(
        name, " deployed at: ", vm.toString(addr)
      )
    );
  }

  function run() external ScaffoldEthDeployerRunner {
    YourContract yourContract = new YourContract();
    logNewContract("YourContract", address(yourContract));

    Batcher batcher = new Batcher();
    logNewContract("Batcher", address(batcher));

    Faucet faucet = new Faucet{value: 0.1 ether}();
    logNewContract("Faucet", address(faucet));

    FreeToken freeToken = new FreeToken("Gratis", "GRATIS");
    logNewContract("FreeToken", address(freeToken));

    BuyableToken buyableToken = new BuyableToken("Buyable", "BUYABLE", address(freeToken));
    logNewContract("BuyableToken", address(buyableToken));
  }
}
