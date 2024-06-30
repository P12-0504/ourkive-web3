// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../shared/structs/IPayee.sol";
import "../shared/storages/royalty/IOurkiveCollectorRoyaltyStorageUpgradeable.sol";

interface IOurkiveCollectorRoyaltyControllerUpgradeable is IPayee {
  function setCollectorRoyaltyStorage(
    IOurkiveCollectorRoyaltyStorageUpgradeable collectorRoyaltyStorageParam
  ) external;
  function setCollectorRoyaltyRecipients(
    address nftAddress,
    uint256 tokenId,
    address[] memory collectorRoyaltyRecipients
  ) external;
  function addCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    address recipient
  ) external;

  function getCollectorRoyaltyPayee(
    address nftAddress,
    uint256 tokenId,
    uint collectorIndex,
    uint royaltyBps,
    uint price
  ) external view returns (Payee memory);
  function getCollectorRoyaltyPayees(
    address nftAddress,
    uint256 tokenId,
    uint[] memory royaltyBpsArray,
    uint price
  ) external view returns (Payee[] memory);
}
