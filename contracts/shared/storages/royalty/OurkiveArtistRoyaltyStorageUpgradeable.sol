// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/* Ourkive */
import "./IOurkiveArtistRoyaltyStorageUpgradeable.sol";
import "../../../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../../../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
import "../../../access/OurkiveAccessControlUpgradeable.sol";
import "../../../killswitch/OurkiveKillswitchUpgradeable.sol";

contract OurkiveArtistRoyaltyStorageUpgradeable is
  IOurkiveArtistRoyaltyStorageUpgradeable,
  OurkiveAccessControlProxyUpgradeable,
  OurkiveKillswitchProxyUpgradeable
{
  mapping(address => mapping(uint256 => ArtistRoyaltyInfo))
    public customArtistRoyalties;

  function initialize(
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveKillswitchUpgradeable killswitch
  ) public initializer {
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
    _OurkiveKillswitchProxyUpgradeable_init(killswitch);
  }

  function setCustomArtistRoyalty(
    address nftAddress,
    uint256 tokenId,
    address receiver,
    uint96 royaltyBps
  ) external isCallerArtistRoyaltyStorageAuthorized {
    require(
      receiver != address(0),
      "Artist royalty receiver must not be zero address"
    );
    require(royaltyBps <= 10000, "Artist royalty must be less than 100%");

    customArtistRoyalties[nftAddress][tokenId].receiver = receiver;
    customArtistRoyalties[nftAddress][tokenId].royaltyBps = royaltyBps;
  }

  function getCustomArtistRoyalty(
    address nftAddress,
    uint256 tokenId
  ) public view returns (ArtistRoyaltyInfo memory) {
    return customArtistRoyalties[nftAddress][tokenId];
  }
}
