// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./OurkiveMemberUpgradeable.sol";

/**
 * @dev This contract represents the patron member tier in the Ourkive ecosystem. It extends
 * the OurkiveMemberUpgradeable contract, inheriting its methods for fee calculations and adding specific
 * functionalities for a patron member.
 */
contract OurkivePatronUpgradeable is OurkiveMemberUpgradeable {
  /**
   * @dev Initializes the OurkivePatronUpgradeable contract. This function calls the initializer of
   * OurkiveMemberUpgradeable to set up the base contract. It is crucial to call this initializer during 
   * the contract deployment process to ensure that the contract is properly set up.
   */
  function initialize() public initializer {
    OurkiveMemberUpgradeable._OurkiveMemberUpgradeable_init();
  }

  /**
   * @dev Provides the member status for the patron member tier. Overrides the getMemberStatus function
   * from the OurkiveMemberUpgradeable contract.
   * @return A string representing the status of the member. For this contract, it always returns "PATRON".
   */
  function getMemberStatus() public pure override returns (string memory) {
    // The status for this member tier is always "PATRON"
    return "PATRON";
  }
}
