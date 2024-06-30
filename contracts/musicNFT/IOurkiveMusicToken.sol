// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IOurkiveMusicToken {
  function getArtistAddress() external view returns (address);
  function setArtistAddress(address _collectorAddress) external;
  function safeMintAndApprovalForAll(address to, uint256 tokenId, string memory uri, address marketplaceAddress) external;
  function safeMintByOurkive(address to, uint256 tokenId, string memory uri) external;
}