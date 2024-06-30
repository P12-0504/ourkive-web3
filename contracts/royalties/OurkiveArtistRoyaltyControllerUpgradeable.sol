// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/* Ourkive */
import "./IOurkiveArtistRoyaltyControllerUpgradeable.sol";
import "../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
import "../access/OurkiveAccessControlUpgradeable.sol";
import "../killswitch/OurkiveKillswitchUpgradeable.sol";
import "../shared/storages/royalty/IOurkiveArtistRoyaltyStorageUpgradeable.sol";

contract OurkiveArtistRoyaltyControllerUpgradeable is
  IOurkiveArtistRoyaltyControllerUpgradeable,
  OurkiveAccessControlProxyUpgradeable,
  OurkiveKillswitchProxyUpgradeable
{
  IOurkiveArtistRoyaltyStorageUpgradeable public artistRoyaltyStorage;

  function initialize(
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveKillswitchUpgradeable killswitch,
    IOurkiveArtistRoyaltyStorageUpgradeable artistRoyaltyStorageParam
  ) public initializer {
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
    _OurkiveKillswitchProxyUpgradeable_init(killswitch);
    artistRoyaltyStorage = artistRoyaltyStorageParam;
  }

  function setArtistRoyaltyStorage(
    IOurkiveArtistRoyaltyStorageUpgradeable artistRoyaltyStorageParam
  ) external isCallerOurkiveEOA {
    artistRoyaltyStorage = artistRoyaltyStorageParam;
  }

  function getArtistRoyaltyRecipientAndAmount(
    address nftAddress,
    uint256 tokenId,
    uint256 price
  ) external view returns (address, uint) {
    IOurkiveArtistRoyaltyStorageUpgradeable.ArtistRoyaltyInfo
      memory artistRoyaltyInfo = artistRoyaltyStorage.getCustomArtistRoyalty(
        nftAddress,
        tokenId
      );

    if (artistRoyaltyInfo.royaltyBps != 0) {
      uint256 artistRoyaltyAmount = (price * artistRoyaltyInfo.royaltyBps) /
        10000;
      return (artistRoyaltyInfo.receiver, artistRoyaltyAmount);
    }

    if (IERC165(nftAddress).supportsInterface(type(IERC2981).interfaceId)) {
      return IERC2981(address(nftAddress)).royaltyInfo(tokenId, price);
    }

    return (address(0), 0);
  }

  function getArtistRoyaltyBps(
    address nftAddress,
    uint256 tokenId,
    uint price
  ) external view returns (uint96) {
    require(price != 0, "Price cannot be zero");
    if (IERC165(nftAddress).supportsInterface(type(IERC2981).interfaceId)) {
      (, uint256 royaltyAmount) = IERC2981(address(nftAddress)).royaltyInfo(
        tokenId,
        price
      );
      return uint96((royaltyAmount * 10000) / price);
    }

    ArtistRoyaltyInfo memory artistRoyaltyInfo = artistRoyaltyStorage
      .getCustomArtistRoyalty(nftAddress, tokenId);
    return artistRoyaltyInfo.royaltyBps;
  }
}
