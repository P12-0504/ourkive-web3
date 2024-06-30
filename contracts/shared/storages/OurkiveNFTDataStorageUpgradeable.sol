// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
import "../../access/OurkiveAccessControlUpgradeable.sol";
import "../../killswitch/OurkiveKillswitchUpgradeable.sol";
import "./IOurkiveNFTDataStorageUpgradeable.sol";

contract OurkiveNFTDataStorageUpgradeable is
  IOurkiveNFTDataStorageUpgradeable,
  OurkiveAccessControlProxyUpgradeable,
  OurkiveKillswitchProxyUpgradeable
{
  function initialize(
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveKillswitchUpgradeable killswitch
  ) public initializer {
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
    _OurkiveKillswitchProxyUpgradeable_init(killswitch);
  }

  mapping(address => mapping(uint256 => bool)) public hasNFTBeenPurchased;

  mapping(address => mapping(uint256 => uint)) public nftSoldCount;

  function setNFTPurchasedStatus(
    address nftAddress,
    uint256 tokenId,
    bool newStatus
  ) external isCallerNFTDataStorageAuthorized {
    bool currentStatus = hasNFTBeenPurchased[nftAddress][tokenId];
    if (currentStatus == newStatus) {
      return;
    }
    hasNFTBeenPurchased[nftAddress][tokenId] = newStatus;
  }

  function setNFTSoldCount(
    address nftAddress,
    uint256 tokenId,
    uint _nftSoldCount
  ) external isCallerNFTDataStorageAuthorized {
    nftSoldCount[nftAddress][tokenId] = _nftSoldCount;
  }
}
