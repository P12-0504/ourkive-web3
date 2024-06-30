// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

import "../member/IOurkiveMembershipControllerUpgradeable.sol";
import "../OurkiveCollectorToken.sol";
import "../shared/structs/IPayee.sol";
import "../shared/enums/ICurrency.sol";
import "./OurkiveNFTMarketplaceReentrancyGuardUpgradeable.sol";
import "../payment/IOurkivePaymentControllerUpgradeable.sol";
import "../royalties/IOurkiveArtistRoyaltyControllerUpgradeable.sol";
import "../shared/storages/IOurkiveNFTDataStorageUpgradeable.sol";
import "../royalties/IOurkiveCollectorRoyaltyControllerUpgradeable.sol";
import "../allowlist/IOurkiveNFTAllowlistUpgradeable.sol";

interface IOurkiveNFTMarketplaceUpgradeable is IPayee, ICurrency {
  struct Listing {
    address seller;
    address buyer;
    uint256 price;
    Payee[] payees; // Array to store payee information
    bool isPrivate;
  }

  // Events
  event NFTListed(
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );
  event NFTDelisted(address indexed nftAddress, uint256 indexed tokenId);
  event NFTSold(
    address indexed nftAddress,
    uint256 indexed tokenId,
    address buyer,
    address seller,
    uint256 originalPrice,
    uint totalPrice,
    uint collectorFee,
    uint sellerFee
  );
  event MemberPromoted(
    address indexed member,
    bool promotedToOurkivian,
    IOurkiveMembershipControllerUpgradeable.MemberStatus from,
    IOurkiveMembershipControllerUpgradeable.MemberStatus to
  );
  event BuyerSet(
    address indexed nftAddress,
    uint256 indexed tokenId,
    Listing listing,
    address member
  );
  event ArtistRoyalty(
    address indexed nftAddress,
    uint256 indexed tokenId,
    address artist,
    uint amount
  );
  event CollectorRoyalties(
    address indexed nftAddress,
    uint256 indexed tokenId,
    Payee[] collectorRoyaltyPayees
  );
  event PlatformFee(
    address indexed nftAddress,
    uint256 indexed tokenId,
    address platform,
    uint amount
  );

  // Function signatures
  function initialize(
    address ourkiveEOAParam,
    OurkiveKillswitchUpgradeable killswitch,
    address usdcAddress,
    IOurkiveMembershipControllerUpgradeable membershipControllerParam,
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveCollectorToken kiveTokenParam
  ) external;
  function setOurkiveEOA(address ourkiveEOAParam) external;
  function setUSDCToken(
    IERC20 usdcTokenParam,
    IERC20Permit usdcTokenPermitParam
  ) external;
  function setMembershipController(
    IOurkiveMembershipControllerUpgradeable membershipControllerParam
  ) external;
  function setKiveToken(OurkiveCollectorToken kiveTokenParam) external;
  function setMinUsdcForPromotion(uint minUsdcForPromotionParam) external;
  function setReentrancyGuard(
    OurkiveNFTMarketplaceReentrancyGuardUpgradeable reentrancyGuardParam
  ) external;
  function setPaymentController(
    IOurkivePaymentControllerUpgradeable paymentControllerParam
  ) external;
  function setArtistRoyaltyController(
    IOurkiveArtistRoyaltyControllerUpgradeable artistRoyaltyControllerParam
  ) external;
  function setNFTDataStorage(
    IOurkiveNFTDataStorageUpgradeable nftDataStorageParam
  ) external;
  function setCollectorRoyaltyController(
    IOurkiveCollectorRoyaltyControllerUpgradeable collectorRoyaltyControllerParam
  ) external;
  function setNFTAllowlist(
    IOurkiveNFTAllowlistUpgradeable nftAllowlistParam
  ) external;
  function setMinUsdcForPrimarySaleListing(
    uint _minUsdcForPrimarySaleListing
  ) external;
  function setCommissionBps(uint16 _commissionBps) external;

  function listNFT(
    address nftParam,
    uint256 tokenId,
    uint256 price,
    address seller,
    address buyer,
    Payee[] memory payees,
    bool isPrivate
  ) external;
  function delistNFT(address nftParam, uint256 tokenId) external;
  function buyListedNFT(address nftAddress, uint256 tokenId) external payable;
  function setBuyer(address nftParam, uint tokenId, address buyer) external;
  function getNFTListing(
    address nftParam,
    uint tokenId
  ) external view returns (Listing memory);
}
