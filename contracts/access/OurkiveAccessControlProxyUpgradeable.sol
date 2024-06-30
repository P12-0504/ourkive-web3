// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/* Ourkive */
import "./IOurkiveAccessControlUpgradeable.sol";
import "./IOurkiveAccessControlProxyUpgradeable.sol";

/**
 * @dev This abstract contract acts as a proxy to facilitate the use of the OurkiveAccessControlUpgradeable.
 * It is designed to be inherited by other contracts that need role-based access control.
 * This proxy simplifies the interaction with the access control functionalities.
 */
abstract contract OurkiveAccessControlProxyUpgradeable is
  IOurkiveAccessControlProxyUpgradeable,
  Initializable,
  ContextUpgradeable
{
  // Reference to the OurkiveAccessControlUpgradeable contract
  IOurkiveAccessControlUpgradeable private _accessControl;

  /**
   * @dev Initializes the proxy with a reference to an OurkiveAccessControlUpgradeable contract.
   * This internal function should be called during the initialization phase of a derived contract.
   * @param accessControl An instance of IOurkiveAccessControlUpgradeable to interface with access control functionalities.
   */
  function _OurkiveAccessControlProxyUpgradeable_init(
    IOurkiveAccessControlUpgradeable accessControl
  ) internal onlyInitializing {
    _accessControl = accessControl;
  }

  /**
   * @dev Modifier to restrict function access to users with the Ourkive EOA role.
   * It calls the access control contract to check the caller's role.
   */
  modifier isCallerOurkiveEOA() {
    _accessControl.isCallerOurkiveEOA(msg.sender);
    _;
  }

  /**
   * @dev Modifier to restrict function access to users authorized for the Membership Controller.
   * It verifies the caller's role through the access control contract.
   */
  modifier isCallerMembershipControllerAuthorized() {
    _accessControl.isCallerMembershipControllerAuthorized(msg.sender);
    _;
  }

  /**
   * @dev Modifier to restrict function access to users authorized for the NFT Marketplace.
   * It verifies the caller's role through the access control contract.
   */
  modifier isCallerNFTMarketplaceAuthorized() {
    _accessControl.isCallerNFTMarketplaceAuthorized(msg.sender);
    _;
  }

  modifier isCallerArtistRoyaltyStorageAuthorized() {
    _accessControl.isCallerArtistRoyaltyStorageAuthorized(msg.sender);
    _;
  }

  modifier isCallerArtistRoyaltyControllerAuthorized() {
    _accessControl.isCallerArtistRoyaltyControllerAuthorized(msg.sender);
    _;
  }

  modifier isCallerNFTDataStorageAuthorized() {
    _accessControl.isCallerNFTDataStorageAuthorized(msg.sender);
    _;
  }

  modifier isCallerPaymentStorageAuthorized() {
    _accessControl.isCallerPaymentStorageAuthorized(msg.sender);
    _;
  }

  modifier isCallerPaymentControllerAuthorized() {
    _accessControl.isCallerPaymentControllerAuthorized(msg.sender);
    _;
  }

  modifier isCallerNFTMarketplaceReentrancyGuardAuthorized() {
    _accessControl.isCallerNFTMarketplaceReentrancyGuardAuthorized(msg.sender);
    _;
  }

  modifier isCallerCollectorRoyaltyStorageAuthorized() {
    _accessControl.isCallerCollectorRoyaltyStorageAuthorized(msg.sender);
    _;
  }

  modifier isCallerCollectorRoyaltyControllerAuthorized() {
    _accessControl.isCallerCollectorRoyaltyControllerAuthorized(msg.sender);
    _;
  }

  modifier isCallerNFTAllowlistAuthorized() {
    _accessControl.isCallerNFTAllowlistAuthorized(msg.sender);
    _;
  }

  /**
   * @dev Allows a user with the Ourkive EOA role to update the access control contract used by this proxy.
   * @param accessControl The new access control contract to set.
   */
  function setAccessControl(
    IOurkiveAccessControlUpgradeable accessControl
  ) external isCallerOurkiveEOA {
    _accessControl = accessControl;
  }

  /**
   * @dev Public view function to get the current access control contract interfaced by this proxy.
   * @return The address of IOurkiveAccessControlUpgradeable instance currently used by this proxy.
   */
  function getAccessControl()
    public
    view
    returns (IOurkiveAccessControlUpgradeable)
  {
    return _accessControl;
  }
}
