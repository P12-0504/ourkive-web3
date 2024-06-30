// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IOurkiveNFTAllowlistUpgradeable.sol";
import "../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../access/OurkiveAccessControlUpgradeable.sol";
import "../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
import "../killswitch/OurkiveKillswitchUpgradeable.sol";

contract OurkiveNFTAllowlistUpgradeable is
  IOurkiveNFTAllowlistUpgradeable,
  OurkiveAccessControlProxyUpgradeable,
  OurkiveKillswitchProxyUpgradeable
{
  mapping(address => mapping(uint256 => bool)) public allowlistedNFTs;

  function initialize(
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveKillswitchUpgradeable killswitch
  ) public initializer {
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
    _OurkiveKillswitchProxyUpgradeable_init(killswitch);
  }

  modifier checkNFT(address nft) {
    require(nft != address(0), "NFT address should not be zero");
    _;
  }

  function allowlistNFT(
    address nft,
    uint256 tokenId
  ) external isCallerNFTAllowlistAuthorized checkNFT(nft) {
    allowlistedNFTs[nft][tokenId] = true;
  }

  function removeNFT(
    address nft,
    uint256 tokenId
  ) external isCallerNFTAllowlistAuthorized checkNFT(nft) {
    allowlistedNFTs[nft][tokenId] = false;
  }
}
