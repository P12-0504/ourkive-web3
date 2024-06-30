// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IOurkiveNftMarketplaceAllowlist {
  /**
   * @dev Emitted when `marketplaceAddress` is added to the allowlist.
   */
  event AddMarketplace(address indexed marketplaceAddress);
  /**
   * @dev Emitted when `marketplaceAddress` is removed from the allowlist.
   */
  event RemoveMarketplace(address indexed marketplaceAddress);

  function addToAllowlist(address martketplaceAddress) external;
  function removeFromAllowlist(address marketplaceAddress) external;
  function isAllowlisted(address marketplaceAddress) external view returns (bool);
}