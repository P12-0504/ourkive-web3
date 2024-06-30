// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./OurkiveKillswitchUpgradeable.sol";

interface IOurkiveKillswitchProxyUpgradeable {
  function setKillswitch(OurkiveKillswitchUpgradeable killswitch) external;
  function getKillswitch() external view returns (OurkiveKillswitchUpgradeable);
}