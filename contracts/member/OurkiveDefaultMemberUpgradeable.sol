// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./OurkiveMemberUpgradeable.sol";

/**
 * @dev This contract represents the default member tier in the Ourkive ecosystem. It extends the 
 * OurkiveMemberUpgradeable contract, inheriting its methods for fee calculations and adding specific 
 * functionalities for a default member.
 */
contract OurkiveDefaultMemberUpgradeable is OurkiveMemberUpgradeable {
  /**
   * @dev Initializes the OurkiveDefaultMemberUpgradeable contract. This function calls the initializer of 
   * OurkiveMemberUpgradeable to set up the base contract. It must be called as part of the contract deployment 
   * process to properly initialize the contract instance.
   */
  function initialize() public initializer {
    OurkiveMemberUpgradeable._OurkiveMemberUpgradeable_init();
  }

  /**
   * @dev Provides the member status for the default member tier. Overrides the getMemberStatus function 
   * from the OurkiveMemberUpgradeable contract.
   * @return A string representing the status of the member. For this contract, it always returns "DEFAULT_MEMBER".
   */
  function getMemberStatus() public pure override returns (string memory) {
    // The status for this member tier is always "DEFAULT_MEMBER"
    return "DEFAULT_MEMBER";
  }
}
