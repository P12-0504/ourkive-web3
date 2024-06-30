// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./OurkiveMemberUpgradeable.sol";

contract OurkiveOurkivianUpgradeable is OurkiveMemberUpgradeable {
  function initialize() public initializer {
    OurkiveMemberUpgradeable._OurkiveMemberUpgradeable_init();
  }

  function getMemberStatus() public pure override returns (string memory) {
    return "OURKIVIAN";
  }
  
  function getCollectorFeeBasisPoint() public pure override returns (uint) {
    return 300;
  }
}