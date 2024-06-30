// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../structs/IArtistRoyaltyInfo.sol";

interface IOurkiveNFTDataStorageUpgradeable {
  function setNFTPurchasedStatus(
    address nftAddress,
    uint256 tokenId,
    bool newStatus
  ) external;
  function setNFTSoldCount(
    address nftAddress,
    uint256 tokenId,
    uint _nftSoldCount
  ) external;

  function hasNFTBeenPurchased(
    address nftAddress,
    uint256 tokenId
  ) external view returns (bool);
  function nftSoldCount(
    address nftAddress,
    uint256 tokenId
  ) external view returns (uint);
}
