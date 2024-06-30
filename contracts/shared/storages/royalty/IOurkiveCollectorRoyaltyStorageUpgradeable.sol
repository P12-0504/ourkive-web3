// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IOurkiveCollectorRoyaltyStorageUpgradeable {
  function insertCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    uint collectorIndex,
    address recipient
  ) external;
  function addCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    address recipient
  ) external;
  function removeCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    uint collectorIndex
  ) external;
  function deleteCollectorRoyaltyRecipients(
    address nftAddress,
    uint256 tokenId
  ) external;

  function getCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    uint collectorIndex
  ) external view returns (address);
  function getCollectorRoyaltyRecipients(
    address nftAddress,
    uint256 tokenId
  ) external view returns (address[] memory);
}
