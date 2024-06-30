// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IOurkiveKillswitchUpgradeable {
  function pause() external;
  function unpause() external;
  function requireNotPaused() external view;
  function requirePaused() external view;
}