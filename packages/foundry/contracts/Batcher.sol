// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {MultiSendCallOnly} from "./utils/MultiSendCallOnly.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title Batcher
/// @author azf20 (inheriting from jxom's ExperimentDelegation)
/// @notice Simple multicall contract for EOAs via EIP-7702
/// @dev WARNING: THIS CONTRACT IS AN EXPERIMENT AND HAS NOT BEEN AUDITED.
contract Batcher is MultiSendCallOnly {

    ////////////////////////////////////////////////////////////////////////
    // Errors
    ////////////////////////////////////////////////////////////////////////

    /// @notice Thrown when a signature is invalid.
    error InvalidSignature();
    error InvalidAuthority();

    ////////////////////////////////////////////////////////////////////////
    // Functions
    ////////////////////////////////////////////////////////////////////////

    /// @notice Internal nonce used for replay protection.
    uint256 public nonce;

    /// @notice Executes a set of calls.
    /// @param calls - The calls to execute.
    function execute(bytes memory calls) public {
        if (msg.sender != address(this)) revert InvalidAuthority();
        multiSendCallOnly(calls);
    }

    /// @notice Executes a set of calls on behalf of the Account, given an EOA signature for authorization.
    /// @param calls - The calls to execute.
    /// @param signature - The EOA signature over the calls
    function execute(
        bytes memory calls,
        bytes calldata signature
    ) public {
        bytes32 digest = keccak256(abi.encodePacked(nonce++, calls));

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(digest);
    
        address signer = ECDSA.recover(ethSignedMessageHash, signature);

        if (signer != address(this)) {
            revert InvalidSignature();
        }

        multiSendCallOnly(calls);
    }

    fallback() external payable {}
    receive() external payable {}
}