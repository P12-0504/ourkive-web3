// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../structs/IArtistRoyaltyInfo.sol";

interface IOurkiveArtistRoyaltyStorageUpgradeable is IArtistRoyaltyInfo {
  function setCustomArtistRoyalty(
    address nftAddress,
    uint256 tokenId,
    address receiver,
    uint96 royaltyBps
  ) external;

  function getCustomArtistRoyalty(
    address nftAddress,
    uint256 tokenId
  ) external view returns (ArtistRoyaltyInfo memory);
}
