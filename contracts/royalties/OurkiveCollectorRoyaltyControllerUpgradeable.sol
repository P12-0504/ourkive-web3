// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* Ourkive */
import "./IOurkiveCollectorRoyaltyControllerUpgradeable.sol";
import "../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
import "../access/OurkiveAccessControlUpgradeable.sol";
import "../killswitch/OurkiveKillswitchUpgradeable.sol";
import "../shared/storages/royalty/IOurkiveCollectorRoyaltyStorageUpgradeable.sol";

contract OurkiveCollectorRoyaltyControllerUpgradeable is
  IOurkiveCollectorRoyaltyControllerUpgradeable,
  OurkiveAccessControlProxyUpgradeable,
  OurkiveKillswitchProxyUpgradeable
{
  IOurkiveCollectorRoyaltyStorageUpgradeable public collectorRoyaltyStorage;

  function initialize(
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveKillswitchUpgradeable killswitch,
    IOurkiveCollectorRoyaltyStorageUpgradeable collectorRoyaltyStorageParam
  ) public initializer {
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
    _OurkiveKillswitchProxyUpgradeable_init(killswitch);
    collectorRoyaltyStorage = collectorRoyaltyStorageParam;
  }

  function setCollectorRoyaltyStorage(
    IOurkiveCollectorRoyaltyStorageUpgradeable collectorRoyaltyStorageParam
  ) external isCallerOurkiveEOA {
    collectorRoyaltyStorage = collectorRoyaltyStorageParam;
  }

  function addCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    address recipient
  ) external isCallerCollectorRoyaltyControllerAuthorized {
    collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      nftAddress,
      tokenId,
      recipient
    );
  }

  function setCollectorRoyaltyRecipients(
    address nftAddress,
    uint256 tokenId,
    address[] memory collectorRoyaltyRecipients
  ) external isCallerCollectorRoyaltyControllerAuthorized {
    collectorRoyaltyStorage.deleteCollectorRoyaltyRecipients(
      nftAddress,
      tokenId
    );

    for (uint i; i < collectorRoyaltyRecipients.length; i++) {
      collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
        nftAddress,
        tokenId,
        collectorRoyaltyRecipients[i]
      );
    }
  }

  function getCollectorRoyaltyPayee(
    address nftAddress,
    uint256 tokenId,
    uint collectorIndex,
    uint royaltyBps,
    uint price
  ) public view returns (Payee memory) {
    address collectorRoyaltyRecipient = collectorRoyaltyStorage
      .getCollectorRoyaltyRecipient(nftAddress, tokenId, collectorIndex);
    uint collectorRoyaltyAmount = (royaltyBps * price) / 10000;
    return Payee(collectorRoyaltyRecipient, royaltyBps, collectorRoyaltyAmount);
  }

  function getCollectorRoyaltyPayees(
    address nftAddress,
    uint256 tokenId,
    uint[] memory royaltyBpsArray,
    uint price
  ) external view returns (Payee[] memory) {
    address[] memory collectorRoyaltyRecipients = collectorRoyaltyStorage
      .getCollectorRoyaltyRecipients(nftAddress, tokenId);
    Payee[] memory collectorRoyaltyPayees = new Payee[](
      collectorRoyaltyRecipients.length
    );

    for (uint i; i < collectorRoyaltyPayees.length; i++) {
      collectorRoyaltyPayees[i] = Payee(
        collectorRoyaltyRecipients[i],
        royaltyBpsArray[i],
        (royaltyBpsArray[i] * price) / 10000
      );
    }

    return collectorRoyaltyPayees;
  }
}
