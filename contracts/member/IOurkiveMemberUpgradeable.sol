// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IOurkiveMemberUpgradeable {
  function getMemberStatus() external pure returns (string memory);
  function getCollectorFeeBasisPoint() external pure returns (uint);
  function getCollectorFee(uint nftPrice) external pure returns (uint);
  function getNFTBuyerPrice(uint nftPrice) external pure returns (uint);
}