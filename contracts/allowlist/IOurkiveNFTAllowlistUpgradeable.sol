// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IOurkiveNFTAllowlistUpgradeable {
  function allowlistNFT(address nft, uint256 tokenId) external;
  function removeNFT(address nft, uint256 tokenId) external;

  function allowlistedNFTs(
    address nft,
    uint256 tokenId
  ) external view returns (bool);
}
