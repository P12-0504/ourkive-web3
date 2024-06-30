// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/* Ourkive */
import "../member/IOurkiveMembershipControllerUpgradeable.sol";
import "./IOurkiveNFTMarketplaceUpgradeable.sol";
import "../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
import "../OurkiveCollectorToken.sol";
import "../payment/IOurkivePaymentControllerUpgradeable.sol";
import "../royalties/IOurkiveArtistRoyaltyControllerUpgradeable.sol";
import "./OurkiveNFTMarketplaceReentrancyGuardUpgradeable.sol";
import "../shared/storages/IOurkiveNFTDataStorageUpgradeable.sol";
import "../royalties/IOurkiveCollectorRoyaltyControllerUpgradeable.sol";
import "../allowlist/IOurkiveNFTAllowlistUpgradeable.sol";

/**
 * @dev This contract implements an NFT marketplace for the Ourkive ecosystem,
 * facilitating the listing, sale, and transfer of NFTs among members.
 */
contract OurkiveNFTMarketplaceUpgradeable is
  IOurkiveNFTMarketplaceUpgradeable,
  OwnableUpgradeable,
  OurkiveAccessControlProxyUpgradeable,
  OurkiveKillswitchProxyUpgradeable
{
  using SafeERC20 for IERC20;
  using SafeERC20 for IERC20Permit;

  // Constants
  uint96 public constant FIRST_COLLECTOR_ROYALTY_BPS = 150;
  uint96 public constant SECOND_COLLECTOR_ROYALTY_BPS = 90;
  uint96 public constant THIRD_COLLECTOR_ROYALTY_BPS = 60;

  // State Variables
  address public ourkiveEOA; // Address of Ourkive's externally owned account (EOA)
  IERC20 public usdcToken; // USDC Token contract for payments
  IERC20Permit public usdcTokenPermit; // USDC Token with permit capabilities
  IOurkiveMembershipControllerUpgradeable public membershipController; // Membership controller contract
  OurkiveCollectorToken public kiveToken; // Ourkive's collector token
  uint public minUsdcForPromotion; // Minimum USDC required for promotion in the marketplace

  // Mapping of NFT listings by contract address and token ID
  mapping(address => mapping(uint256 => Listing)) private _listings;

  OurkiveNFTMarketplaceReentrancyGuardUpgradeable public reentrancyGuard;

  IOurkivePaymentControllerUpgradeable public paymentController;

  IOurkiveArtistRoyaltyControllerUpgradeable public artistRoyaltyController;

  IOurkiveNFTDataStorageUpgradeable public nftDataStorage;

  IOurkiveCollectorRoyaltyControllerUpgradeable
    public collectorRoyaltyController;

  IOurkiveNFTAllowlistUpgradeable public nftAllowlist;

  uint public minUsdcForPrimarySaleListing;

  uint16 public commissionBps;

  /**
   * @dev Initializes the marketplace with necessary contracts and configurations.
   * @param ourkiveEOAParam Address of the Ourkive EOA.
   * @param killswitch Killswitch contract for emergency control.
   * @param usdcAddress Address of the USDC token contract.
   * @param membershipControllerParam Membership controller contract.
   * @param accessControl Access control contract.
   * @param kiveTokenParam Ourkive collector token contract.
   */
  function initialize(
    address ourkiveEOAParam,
    OurkiveKillswitchUpgradeable killswitch,
    address usdcAddress,
    IOurkiveMembershipControllerUpgradeable membershipControllerParam,
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveCollectorToken kiveTokenParam
  ) public initializer {
    __Ownable_init();
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
    _OurkiveKillswitchProxyUpgradeable_init(killswitch);
    ourkiveEOA = ourkiveEOAParam;
    usdcToken = IERC20(usdcAddress);
    usdcTokenPermit = IERC20Permit(usdcAddress);
    membershipController = membershipControllerParam;
    kiveToken = kiveTokenParam;
    minUsdcForPromotion = 1000000000; // 1000 USDC
  }

  modifier nonReentrant() {
    reentrancyGuard._nonReentrantBefore();
    _;
    reentrancyGuard._nonReentrantAfter();
  }

  // Various setter functions for updating the state variables
  function setOurkiveEOA(address ourkiveEOAParam) external isCallerOurkiveEOA {
    ourkiveEOA = ourkiveEOAParam;
  }
  function setUSDCToken(
    IERC20 usdcTokenParam,
    IERC20Permit usdcTokenPermitParam
  ) external isCallerOurkiveEOA {
    usdcToken = usdcTokenParam;
    usdcTokenPermit = usdcTokenPermitParam;
  }
  function setMembershipController(
    IOurkiveMembershipControllerUpgradeable membershipControllerParam
  ) external isCallerOurkiveEOA {
    membershipController = membershipControllerParam;
  }
  function setKiveToken(
    OurkiveCollectorToken kiveTokenParam
  ) external isCallerOurkiveEOA {
    kiveToken = kiveTokenParam;
  }
  function setMinUsdcForPromotion(
    uint minUsdcForPromotionParam
  ) external isCallerOurkiveEOA {
    minUsdcForPromotion = minUsdcForPromotionParam;
  }
  function setReentrancyGuard(
    OurkiveNFTMarketplaceReentrancyGuardUpgradeable reentrancyGuardParam
  ) external isCallerOurkiveEOA {
    reentrancyGuard = reentrancyGuardParam;
  }
  function setPaymentController(
    IOurkivePaymentControllerUpgradeable paymentControllerParam
  ) external isCallerOurkiveEOA {
    paymentController = paymentControllerParam;
  }
  function setArtistRoyaltyController(
    IOurkiveArtistRoyaltyControllerUpgradeable artistRoyaltyControllerParam
  ) external isCallerOurkiveEOA {
    artistRoyaltyController = artistRoyaltyControllerParam;
  }
  function setNFTDataStorage(
    IOurkiveNFTDataStorageUpgradeable nftDataStorageParam
  ) external isCallerOurkiveEOA {
    nftDataStorage = nftDataStorageParam;
  }
  function setCollectorRoyaltyController(
    IOurkiveCollectorRoyaltyControllerUpgradeable collectorRoyaltyControllerParam
  ) external isCallerOurkiveEOA {
    collectorRoyaltyController = collectorRoyaltyControllerParam;
  }
  function setNFTAllowlist(
    IOurkiveNFTAllowlistUpgradeable nftAllowlistParam
  ) external isCallerOurkiveEOA {
    nftAllowlist = nftAllowlistParam;
  }
  function setMinUsdcForPrimarySaleListing(
    uint _minUsdcForPrimarySaleListing
  ) external isCallerOurkiveEOA {
    minUsdcForPrimarySaleListing = _minUsdcForPrimarySaleListing;
  }
  function setCommissionBps(uint16 _commissionBps) external isCallerOurkiveEOA {
    commissionBps = _commissionBps;
  }

  function listNFT(
    address nftParam,
    uint256 tokenId,
    uint256 price,
    address seller,
    address buyer,
    Payee[] memory payees,
    bool isPrivate
  ) external requireNotPaused {
    validateListNFTRequirements(nftParam, tokenId, seller, buyer);

    updateNFTListing(
      nftParam,
      tokenId,
      price,
      seller,
      buyer,
      payees,
      isPrivate
    );

    emit NFTListed(nftParam, tokenId, isPrivate ? 0 : price);
  }

  /**
   * @dev Validates the requirements for listing an NFT.
   */
  function validateListNFTRequirements(
    address nftParam,
    uint256 tokenId,
    address seller,
    address buyer
  ) private view {
    IERC721 nft = IERC721(nftParam);
    require(nft.ownerOf(tokenId) == seller, "Not the owner");
    require(
      nft.getApproved(tokenId) == address(this) ||
        nft.isApprovedForAll(seller, address(this)),
      "Contract not approved"
    );
    require(seller != buyer, "Seller cannot be a buyer");
    require(
      nftAllowlist.allowlistedNFTs(nftParam, tokenId),
      "NFT must be allowlisted"
    );
    require(
      msg.sender == seller || msg.sender == ourkiveEOA,
      "Only authorized entity can update the listing"
    );
  }

  /**
   * @dev Updates an NFT listing with new details.
   */
  function updateNFTListing(
    address nftParam,
    uint256 tokenId,
    uint256 price,
    address seller,
    address buyer,
    Payee[] memory payees,
    bool isPrivate
  ) private {
    Listing storage newListing = _listings[nftParam][tokenId];
    newListing.price = price;
    newListing.seller = seller;
    newListing.buyer = buyer;
    newListing.isPrivate = isPrivate;

    bool hasNFTBeenPurchased = nftDataStorage.hasNFTBeenPurchased(
      nftParam,
      tokenId
    );
    if (!hasNFTBeenPurchased) {
      _updateNFTPrimaryListing(newListing, payees, price);
      return;
    }

    _updateNFTSecondaryListing(nftParam, tokenId, newListing, payees, price);
  }

  function _updateNFTPrimaryListing(
    Listing storage newListing,
    Payee[] memory payees,
    uint price
  ) private {
    delete newListing.payees;
    _checkPayeesAndPrice(payees, price);
    _addCommissionPayee(newListing, price);
    _replacePayeesForPrimarySale(newListing, payees, price);
  }

  function _checkPayeesAndPrice(
    Payee[] memory payees,
    uint price
  ) private view {
    require(
      price >= minUsdcForPrimarySaleListing,
      "Listing price must be at least 100 USDC"
    );

    uint256 totalPercent = 0;

    for (uint256 i = 0; i < payees.length; i++) {
      totalPercent += payees[i].percent;
    }

    require(totalPercent == 8000, "Total percent must equal 8000");
  }

  function _addCommissionPayee(Listing storage newListing, uint price) private {
    newListing.payees.push(
      Payee(ourkiveEOA, commissionBps, (price * commissionBps) / 10000)
    );
  }

  function _replacePayeesForPrimarySale(
    Listing storage listing,
    Payee[] memory payees,
    uint256 price
  ) private {
    for (uint i; i < payees.length; i++) {
      payees[i].amount = (price * payees[i].percent) / 10000;
      listing.payees.push(payees[i]);
    }
  }

  function _updateNFTSecondaryListing(
    address nftAddress,
    uint256 tokenId,
    Listing storage newListing,
    Payee[] memory payees,
    uint price
  ) private {
    require(payees.length == 1, "Only the seller should be a payee");

    uint originalBps = payees[0].percent;
    uint originalAmount = (price * payees[0].percent) / 10000;

    delete newListing.payees;

    _updateListingWithArtistRoyalty(
      nftAddress,
      tokenId,
      newListing,
      payees,
      price,
      originalBps,
      originalAmount
    );
  }

  function _updateListingWithArtistRoyalty(
    address nftAddress,
    uint256 tokenId,
    Listing storage newListing,
    Payee[] memory payees,
    uint price,
    uint originalBps,
    uint originalAmount
  ) private {
    uint96 artistRoyaltyBps = artistRoyaltyController.getArtistRoyaltyBps(
      nftAddress,
      tokenId,
      price
    );
    (
      address artistRoyaltyRecipient,
      uint artistRoyaltyAmount
    ) = artistRoyaltyController.getArtistRoyaltyRecipientAndAmount(
        nftAddress,
        tokenId,
        price
      );

    if (artistRoyaltyBps != 0) {
      newListing.payees.push(
        Payee(artistRoyaltyRecipient, artistRoyaltyBps, artistRoyaltyAmount)
      );
    }
    newListing.payees.push(
      Payee(
        payees[0].walletAddress,
        originalBps - artistRoyaltyBps,
        originalAmount - artistRoyaltyAmount
      )
    );
  }

  /**
   * @dev Private method for delisting an NFT from the marketplace.
   */
  function _delistNFT(address nftParam, uint256 tokenId) private {
    delete _listings[nftParam][tokenId];
    emit NFTDelisted(nftParam, tokenId);
  }

  /**
   * @dev Delists an NFT from the marketplace.
   */
  function delistNFT(
    address nftParam,
    uint256 tokenId
  ) public requireNotPaused {
    IERC721 nft = IERC721(nftParam);
    require(nft.ownerOf(0) == msg.sender, "Only owner can delist nft");
    _delistNFT(nftParam, tokenId);
  }

  /**
   * @dev Checks if a member can be promoted to Ourkivian.
   */
  function canPromoteToOurkivian() private pure returns (bool) {
    return false;
  }

  /**
   * @dev Checks if a member can be promoted to Supporter.
   */
  function canPromoteToSupporter(
    address member,
    uint price
  ) private view returns (bool) {
    return
      price < minUsdcForPromotion &&
      membershipController.isMemberDefaultMember(member);
  }

  /**
   * @dev Checks if a member can be promoted to Patron.
   */
  function canPromoteToPatron(
    address member,
    uint price
  ) private view returns (bool) {
    return
      price >= minUsdcForPromotion &&
      (membershipController.isMemberDefaultMember(member) ||
        membershipController.isMemberSupporter(member));
  }

  /**
   * @dev Promotes a member based on transaction criteria.
   */
  function promoteMember(uint price) private {
    bool promotedToOurkivian = false;
    IOurkiveMembershipControllerUpgradeable.MemberStatus from = membershipController
        .getMemberStatus(msg.sender);
    IOurkiveMembershipControllerUpgradeable.MemberStatus to = IOurkiveMembershipControllerUpgradeable
        .MemberStatus(0);

    if (canPromoteToOurkivian()) {
      membershipController.setMemberOurkivian(msg.sender, true);
      promotedToOurkivian = true;
    }

    if (canPromoteToPatron(msg.sender, price)) {
      to = IOurkiveMembershipControllerUpgradeable.MemberStatus(2);
      membershipController.setMemberStatus(msg.sender, to);
    } else if (canPromoteToSupporter(msg.sender, price)) {
      to = IOurkiveMembershipControllerUpgradeable.MemberStatus(1);
      membershipController.setMemberStatus(msg.sender, to);
    }

    emit MemberPromoted(msg.sender, promotedToOurkivian, from, to);
  }

  /**
   * @dev Prevent unauthorized identity from purchasing an NFT
   */
  function checkPrivateListing(Listing memory listing) private view {
    if (listing.isPrivate && listing.buyer != msg.sender) {
      revert("Only a specific buyer can purchase this NFT");
    }
  }

  /**
   * @dev Handles the purchase of a listed NFT.
   */
  function buyListedNFT(
    address nftAddress,
    uint256 tokenId
  ) external payable requireNotPaused nonReentrant {
    Listing storage listing = _listings[nftAddress][tokenId];

    checkPrivateListing(listing);

    // Recalculate NFT price based on the user's member status
    uint newPrice = membershipController.getNFTBuyerPrice(
      msg.sender,
      listing.price
    );

    require(usdcToken.balanceOf(msg.sender) >= newPrice, "Insufficient funds");

    // Transfer USDC from collector to this smart contract
    usdcToken.transferFrom(msg.sender, address(paymentController), newPrice);

    // Get collector fee bps
    uint collectorFeeBps = membershipController.getCollectorFeeBps(msg.sender);

    // Get NFT sold count
    uint nftSoldCount = nftDataStorage.nftSoldCount(nftAddress, tokenId);

    // Get collector royalty payees
    Payee[] memory collectorRoyaltyPayees = _getCollectorRoyaltyPayees(
      nftAddress,
      tokenId,
      listing.price
    );

    // Get platform fee
    uint platformFeeBps = _getPlatformFeeBps(nftSoldCount, collectorFeeBps);
    uint platformFee = _getPlatformFee(platformFeeBps, listing.price);

    // Add marketplace fee payee + collector royalties payees
    _addCollectorFeePayees(
      nftAddress,
      tokenId,
      platformFeeBps,
      platformFee,
      nftSoldCount,
      listing.seller,
      collectorRoyaltyPayees,
      listing
    );

    // Call distributePayments function to distribute the funds
    paymentController.distributePayments(listing.payees, Currency.USDC);

    // Transfer the NFT to the buyer
    IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

    // Mark this token as purchased
    nftDataStorage.setNFTPurchasedStatus(nftAddress, tokenId, true);

    // Increment nft sold count
    nftDataStorage.setNFTSoldCount(nftAddress, tokenId, nftSoldCount + 1);

    // Emit events
    _emitEventsAfterPurchase(
      nftAddress,
      tokenId,
      nftSoldCount,
      platformFee,
      collectorRoyaltyPayees,
      listing.payees[0]
    );

    // Remove the listing
    _delistNFT(nftAddress, tokenId);
  }

  function _addCollectorFeePayees(
    address nftAddress,
    uint256 tokenId,
    uint platformFeeBps,
    uint platformFee,
    uint nftSoldCount,
    address seller,
    Payee[] memory collectorRoyaltyPayees,
    Listing storage listing
  ) private {
    _addCollectorRoyaltyPayees(nftSoldCount, collectorRoyaltyPayees, listing);

    _addPlatformFeePayee(platformFeeBps, platformFee, listing);

    _addCollectorRoyaltyRecipient(nftAddress, tokenId, nftSoldCount, seller);
  }

  function _addCollectorRoyaltyPayees(
    uint nftSoldCount,
    Payee[] memory collectorRoyaltyPayees,
    Listing storage listing
  ) private {
    // Skip first two sales
    if (nftSoldCount < 2) {
      return;
    }

    for (uint i; i < collectorRoyaltyPayees.length; i++) {
      listing.payees.push(collectorRoyaltyPayees[i]);
    }
  }

  function _getCollectorRoyaltyPayees(
    address nftAddress,
    uint256 tokenId,
    uint price
  ) private view returns (Payee[] memory) {
    uint[] memory collectorRoyaltyBpsArray = new uint[](3);
    collectorRoyaltyBpsArray[0] = FIRST_COLLECTOR_ROYALTY_BPS;
    collectorRoyaltyBpsArray[1] = SECOND_COLLECTOR_ROYALTY_BPS;
    collectorRoyaltyBpsArray[2] = THIRD_COLLECTOR_ROYALTY_BPS;

    Payee[] memory collectorRoyaltyPayees = collectorRoyaltyController
      .getCollectorRoyaltyPayees(
        nftAddress,
        tokenId,
        collectorRoyaltyBpsArray,
        price
      );

    return collectorRoyaltyPayees;
  }

  function _addPlatformFeePayee(
    uint platformFeeBps,
    uint platformFee,
    Listing storage listing
  ) private {
    if (platformFeeBps == 0) {
      return;
    }

    listing.payees.push(Payee(ourkiveEOA, platformFeeBps, platformFee));
  }

  function _getPlatformFee(
    uint platformFeeBps,
    uint price
  ) private pure returns (uint) {
    return (platformFeeBps * price) / 10000;
  }

  function _getPlatformFeeBps(
    uint nftSoldCount,
    uint collectorFeeBps
  ) private pure returns (uint) {
    uint platformFeeBps;
    if (nftSoldCount == 0 || nftSoldCount == 1) {
      platformFeeBps = collectorFeeBps;
    } else if (nftSoldCount == 2) {
      platformFeeBps = collectorFeeBps - FIRST_COLLECTOR_ROYALTY_BPS;
    } else if (nftSoldCount == 3) {
      platformFeeBps =
        collectorFeeBps -
        (FIRST_COLLECTOR_ROYALTY_BPS + SECOND_COLLECTOR_ROYALTY_BPS);
    }

    return platformFeeBps;
  }

  function _addCollectorRoyaltyRecipient(
    address nftAddress,
    uint256 tokenId,
    uint nftSoldCount,
    address seller
  ) private {
    // Register first three collectors
    if (nftSoldCount == 0 || nftSoldCount > 3) {
      return;
    }

    collectorRoyaltyController.addCollectorRoyaltyRecipient(
      nftAddress,
      tokenId,
      seller
    );
  }

  function _addPayees(
    Payee[] storage listingPayees,
    Payee[] memory newPayees
  ) private {
    for (uint256 i; i < newPayees.length; i++) {
      listingPayees.push(newPayees[i]);
    }
  }

  function _emitEventsAfterPurchase(
    address nftAddress,
    uint256 tokenId,
    uint nftSoldCount,
    uint platformFee,
    Payee[] memory collectorRoyaltyPayees,
    Payee memory lastListingPayee
  ) private {
    address artist = nftSoldCount > 0
      ? lastListingPayee.walletAddress
      : address(0);
    uint artistAmount = nftSoldCount > 0 ? lastListingPayee.amount : 0;

    emit ArtistRoyalty(nftAddress, tokenId, artist, artistAmount);
    emit CollectorRoyalties(nftAddress, tokenId, collectorRoyaltyPayees);
    emit PlatformFee(nftAddress, tokenId, ourkiveEOA, platformFee);
  }

  /**
   * @dev Sets a specific buyer for a private listing.
   * @param nftParam The address of the NFT contract.
   * @param tokenId The token ID of the NFT.
   * @param buyer The address of the buyer.
   */
  function setBuyer(
    address nftParam,
    uint tokenId,
    address buyer
  ) external isCallerNFTMarketplaceAuthorized {
    _listings[nftParam][tokenId].buyer = buyer;

    emit BuyerSet(nftParam, tokenId, _listings[nftParam][tokenId], buyer);
  }

  /**
   * @dev Retrieves a private NFT listing.
   */
  function getNFTPrivateListing(
    Listing memory privateListing
  ) private pure returns (Listing memory) {
    privateListing.price = 0;
    privateListing.buyer = address(0);
    return privateListing;
  }

  /**
   * @dev Retrieves an NFT listing from the marketplace.
   */
  function getNFTListing(
    address nftParam,
    uint tokenId
  ) external view requireNotPaused returns (Listing memory) {
    Listing memory listing = _listings[nftParam][tokenId];
    bool isPrivateListing = listing.isPrivate && listing.buyer != msg.sender;
    if (isPrivateListing) {
      return getNFTPrivateListing(listing);
    }
    return _listings[nftParam][tokenId];
  }
}
