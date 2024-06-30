// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IOurkiveAccessControlUpgradeable.sol";

interface IOurkiveAccessControlProxyUpgradeable {
  function setAccessControl(IOurkiveAccessControlUpgradeable accessControl) external;
  function getAccessControl() external view returns (IOurkiveAccessControlUpgradeable);
}