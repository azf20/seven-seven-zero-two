//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * A proof-of-concept contract that sets its own greeting
 * Designed to be used by EOAs via EIP-7702
 * @author BuidlGuidl
 */
contract YourContract {
  // State Variables
  uint256 private __gap;
  string public greeting;
  uint256 public totalCounter;

  event GreetingChange(
    string newGreeting
  );

  function _setGreeting(string memory _newGreeting) internal {
    greeting = _newGreeting;
    totalCounter += 1;
    emit GreetingChange(_newGreeting);
  }

  /**
   * Function that allows the owner to change the state variable "greeting" of the contract and increase the counters
   *
   * @param _newGreeting (string memory) - new greeting to save on the contract
   */
  function setGreeting(
    string memory _newGreeting
  ) public {
    require(msg.sender == address(this), "Not the Owner");
    _setGreeting(_newGreeting);
  }

  /**
   * Function that allows anyone to change the state variable "greeting" of the contract and increase the counters
   * As long as they have a signature from the owner
   *
   * @param _newGreeting (string memory) - new greeting to save on the contract
   * @param signature (bytes calldata) - signature to verify
   */
  function setGreeting(string memory _newGreeting, bytes calldata signature) public {
    require(isValidSignature(_newGreeting, totalCounter, signature), "Invalid signature");
    _setGreeting(_newGreeting);
  }

  /**
   * @dev Validates if a signature is valid for a given greeting and specific counter value
   * @param _greeting The greeting to verify
   * @param _counter The counter value used in the signature
   * @param _signature The signature to verify
   * @return bool Returns true if the signature is valid
   */
  function isValidSignature(
    string memory _greeting, 
    uint256 _counter,
    bytes calldata _signature
  ) public view returns (bool) {
    // Create hash of greeting and counter
    bytes32 messageHash = keccak256(abi.encodePacked(address(this), _counter, _greeting));
    // Use OpenZeppelin's toEthSignedMessageHash
    bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
    
    // Recover signer from signature
    address signer = ECDSA.recover(ethSignedMessageHash, _signature);
    
    return signer == address(this);
  }

  /**
   * @dev Convenience function to check signature against current totalCounter
   */
  function isValidSignature(
    string memory _greeting, 
    bytes calldata _signature
  ) public view returns (bool) {
    return isValidSignature(_greeting, totalCounter, _signature);
  }

  /**
   * @dev Fallback function to allow contract to receive Ether
   * The receive keyword is used for empty calldata (plain Ether transfers)
   */
  receive() external payable {}

  /**
   * @dev Fallback function called when msg.data is not empty
   */
  fallback() external payable {}
}
