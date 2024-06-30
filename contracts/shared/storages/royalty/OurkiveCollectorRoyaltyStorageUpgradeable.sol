// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* Ourkive */
import "./IOurkiveCollectorRoyaltyStorageUpgradeable.sol";
import "../../../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../../../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
import "../../../access/OurkiveAccessControlUpgradeable.sol";
import "../../../killswitch/OurkiveKillswitchUpgradeable.sol";

contract OurkiveCollectorRoyaltyStorageUpgradeable is
  IOurkiveCollectorRoyaltyStorageUpgradeable,
  OurkiveAccessControlProxyUpgradeable,
  OurkiveKillswitchProxyUpgradeable
{
  mapping(address => mapping(uint256 => address[]))
    public collectorRoyaltyRecipients;

  function initialize(
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveKillswitchUpgradeable killswitch
  ) public initializer {
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
    _OurkiveKillswitchProxyUpgradeable_init(killswitch);
  }

  modifier validateStorageWrite(address recipient) {
    require(
      recipient != address(0),
      "Collector royalty recipient must not be zero address"
    );
    _;
  }

  function insertCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    uint collectorIndex,
    address recipient
  )
    external
    isCallerCollectorRoyaltyStorageAuthorized
    validateStorageWrite(recipient)
  {
    collectorRoyaltyRecipients[nftAddress][tokenId][collectorIndex] = recipient;
  }

  function addCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    address recipient
  )
    external
    isCallerCollectorRoyaltyStorageAuthorized
    validateStorageWrite(recipient)
  {
    collectorRoyaltyRecipients[nftAddress][tokenId].push(recipient);
  }

  function removeCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    uint collectorIndex
  ) external isCallerCollectorRoyaltyStorageAuthorized {
    require(
      collectorIndex < collectorRoyaltyRecipients[nftAddress][tokenId].length,
      "collectorIndex out of bounds"
    );

    for (
      uint i = collectorIndex;
      i < collectorRoyaltyRecipients[nftAddress][tokenId].length - 1;
      i++
    ) {
      collectorRoyaltyRecipients[nftAddress][tokenId][
        i
      ] = collectorRoyaltyRecipients[nftAddress][tokenId][i + 1];
    }
    collectorRoyaltyRecipients[nftAddress][tokenId].pop();
  }

  function deleteCollectorRoyaltyRecipients(
    address nftAddress,
    uint256 tokenId
  ) external isCallerCollectorRoyaltyStorageAuthorized {
    delete collectorRoyaltyRecipients[nftAddress][tokenId];
  }

  function getCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    uint collectorIndex
  ) external view returns (address) {
    return collectorRoyaltyRecipients[nftAddress][tokenId][collectorIndex];
  }

  function getCollectorRoyaltyRecipients(
    address nftAddress,
    uint256 tokenId
  ) external view returns (address[] memory) {
    return collectorRoyaltyRecipients[nftAddress][tokenId];
  }
}
