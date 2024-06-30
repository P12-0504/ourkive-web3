// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../shared/structs/IArtistRoyaltyInfo.sol";

interface IOurkiveArtistRoyaltyControllerUpgradeable is IArtistRoyaltyInfo {
  function getArtistRoyaltyRecipientAndAmount(
    address nftAddress,
    uint256 tokenId,
    uint256 price
  ) external view returns (address, uint);
  function getArtistRoyaltyBps(
    address nftAddress,
    uint256 tokenId,
    uint256 price
  ) external view returns (uint96);
}
