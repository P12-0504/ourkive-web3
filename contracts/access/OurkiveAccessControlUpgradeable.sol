// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";

/* Ourkive */
import "./IOurkiveAccessControlUpgradeable.sol";

/**
 * @dev Ourkive's implementation of a role-based access control system. This contract extends the functionality
 * of OpenZeppelin's AccessControlEnumerableUpgradeable, providing role-based access control mechanisms for other
 * Ourkive smart contracts.
 */
contract OurkiveAccessControlUpgradeable is
  IOurkiveAccessControlUpgradeable,
  AccessControlEnumerableUpgradeable
{
  /**
   * @dev Role identifier for the ADMIN_ROLE. This role has overarching administrative privileges and can manage other roles.
   */
  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

  /**
   * @dev Role identifier for KILLSWITCH_ROLE. This role is responsible for activating killswitch functionalities
   * in the system, effectively halting operations in case of emergencies.
   */
  bytes32 public constant KILLSWITCH_ROLE = keccak256("KILLSWITCH_ROLE");

  /**
   * @dev Role identifier for MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE. Addresses with this role are authorized to
   * call methods in the OurkiveMembershipControllerUpgradeable contract.
   */
  bytes32 public constant MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE =
    keccak256("MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE");

  /**
   * @dev Role identifier for NFT_MARKETPLACE_AUTHORIZED_ROLE. Addresses with this role are authorized to call
   * methods in the OurkiveNFTMarketplaceUpgradeable contract.
   */
  bytes32 public constant NFT_MARKETPLACE_AUTHORIZED_ROLE =
    keccak256("NFT_MARKETPLACE_AUTHORIZED_ROLE");

  // V2
  bytes32 public constant ARTIST_ROYALTY_STORAGE_AUTHORIZED_ROLE =
    keccak256("ARTIST_ROYALTY_STORAGE_AUTHORIZED_ROLE");

  bytes32 public constant ARTIST_ROYALTY_CONTROLLER_AUTHORIZED_ROLE =
    keccak256("ARTIST_ROYALTY_CONTROLLER_AUTHORIZED_ROLE");

  bytes32 public constant NFT_DATA_STORAGE_AUTHORIZED_ROLE =
    keccak256("NFT_DATA_STORAGE_AUTHORIZED_ROLE");

  bytes32 public constant PAYMENT_STORAGE_AUTHORIZED_ROLE =
    keccak256("PAYMENT_STORAGE_AUTHORIZED_ROLE");

  bytes32 public constant PAYMENT_CONTROLLER_AUTHORIZED_ROLE =
    keccak256("PAYMENT_CONTROLLER_AUTHORIZED_ROLE");

  bytes32 public constant NFT_MARKETPLACE_REENTRANCY_GUARD_AUTHORIZED_ROLE =
    keccak256("NFT_MARKETPLACE_REENTRANCY_GUARD_AUTHORIZED_ROLE");

  // V3
  bytes32 public constant COLLECTOR_ROYALTY_STORAGE_AUTHORIZED_ROLE =
    keccak256("COLLECTOR_ROYALTY_STORAGE_AUTHORIZED_ROLE");

  bytes32 public constant COLLECTOR_ROYALTY_CONTROLLER_AUTHORIZED_ROLE =
    keccak256("COLLECTOR_ROYALTY_CONTROLLER_AUTHORIZED_ROLE");

  bytes32 public constant NFT_ALLOWLIST_AUTHORIZED_ROLE =
    keccak256("NFT_ALLOWLIST_AUTHORIZED_ROLE");

  /**
   * @dev Initializes the contract by setting up roles and granting the deployer the default admin role.
   */
  function initialize() public initializer {
    __AccessControlEnumerable_init();

    // Grant the contract deployer the default admin role.
    _grantRole(ADMIN_ROLE, msg.sender);

    // Set ADMIN_ROLE as the admin for all roles.
    _setRoleAdmin(KILLSWITCH_ROLE, ADMIN_ROLE);
    _setRoleAdmin(MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE, ADMIN_ROLE);
    _setRoleAdmin(NFT_MARKETPLACE_AUTHORIZED_ROLE, ADMIN_ROLE);
  }

  /****************************/
  /********  Checkers  ********/
  /****************************/

  /**
   * @dev Checks if a caller has the ADMIN_ROLE.
   * @param caller Address to be checked.
   * @return true if the caller has the ADMIN_ROLE, otherwise it reverts.
   */
  function isCallerOurkiveEOA(address caller) external view returns (bool) {
    _checkRole(ADMIN_ROLE, caller);
    return true;
  }

  /**
   * @dev Checks if a caller has the KILLSWITCH_ROLE.
   * @param caller Address to be checked.
   * @return true if the caller has the KILLSWITCH_ROLE, otherwise it reverts.
   */
  function isCallerKillswitch(address caller) external view returns (bool) {
    _checkRole(KILLSWITCH_ROLE, caller);
    return true;
  }

  /**
   * @dev Checks if a caller is authorized to interact with the membership controller.
   * @param caller Address to be checked.
   * @return true if the caller has the MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE, otherwise it reverts.
   */
  function isCallerMembershipControllerAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE, caller);
    return true;
  }

  /**
   * @dev Checks if a caller is authorized to interact with the NFT marketplace.
   * @param caller Address to be checked.
   * @return true if the caller has the NFT_MARKETPLACE_AUTHORIZED_ROLE, otherwise it reverts.
   */
  function isCallerNFTMarketplaceAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(NFT_MARKETPLACE_AUTHORIZED_ROLE, caller);
    return true;
  }

  function isCallerArtistRoyaltyStorageAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(ARTIST_ROYALTY_STORAGE_AUTHORIZED_ROLE, caller);
    return true;
  }

  function isCallerArtistRoyaltyControllerAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(ARTIST_ROYALTY_CONTROLLER_AUTHORIZED_ROLE, caller);
    return true;
  }

  function isCallerNFTDataStorageAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(NFT_DATA_STORAGE_AUTHORIZED_ROLE, caller);
    return true;
  }

  function isCallerPaymentStorageAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(PAYMENT_STORAGE_AUTHORIZED_ROLE, caller);
    return true;
  }

  function isCallerPaymentControllerAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(PAYMENT_CONTROLLER_AUTHORIZED_ROLE, caller);
    return true;
  }

  function isCallerNFTMarketplaceReentrancyGuardAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(NFT_MARKETPLACE_REENTRANCY_GUARD_AUTHORIZED_ROLE, caller);
    return true;
  }

  function isCallerCollectorRoyaltyStorageAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(COLLECTOR_ROYALTY_STORAGE_AUTHORIZED_ROLE, caller);
    return true;
  }

  function isCallerCollectorRoyaltyControllerAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(COLLECTOR_ROYALTY_CONTROLLER_AUTHORIZED_ROLE, caller);
    return true;
  }

  function isCallerNFTAllowlistAuthorized(
    address caller
  ) external view returns (bool) {
    _checkRole(NFT_ALLOWLIST_AUTHORIZED_ROLE, caller);
    return true;
  }

  /***************************/
  /********  Setters  ********/
  /***************************/

  /**
   * @dev Grants ADMIN_ROLE to a specified address.
   * @param admin Address to be granted the ADMIN_ROLE.
   */
  function insertToAdminRole(address admin) external onlyRole(ADMIN_ROLE) {
    _grantRole(ADMIN_ROLE, admin);
  }

  /**
   * @dev Grants KILLSWITCH_ROLE to a specified address.
   * @param killswitch Address to be granted the KILLSWITCH_ROLE.
   */
  function insertToKillswitchRole(
    address killswitch
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(KILLSWITCH_ROLE, killswitch);
  }

  /**
   * @dev Grants MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE to a specified address.
   * @param roleAddress Address to be granted the MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE.
   */
  function insertToMembershipControllerAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE, roleAddress);
  }

  /**
   * @dev Grants NFT_MARKETPLACE_AUTHORIZED_ROLE to a specified address.
   * @param roleAddress Address to be granted the NFT_MARKETPLACE_AUTHORIZED_ROLE.
   */
  function insertToNFTMarketplaceAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(NFT_MARKETPLACE_AUTHORIZED_ROLE, roleAddress);
  }

  function insertToArtistRoyaltyStorageAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(ARTIST_ROYALTY_STORAGE_AUTHORIZED_ROLE, roleAddress);
  }

  function insertToArtistRoyaltyControllerAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(ARTIST_ROYALTY_CONTROLLER_AUTHORIZED_ROLE, roleAddress);
  }

  function insertToNFTDataStorageAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(NFT_DATA_STORAGE_AUTHORIZED_ROLE, roleAddress);
  }

  function insertToPaymentStorageAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(PAYMENT_STORAGE_AUTHORIZED_ROLE, roleAddress);
  }

  function insertToPaymentControllerAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(PAYMENT_CONTROLLER_AUTHORIZED_ROLE, roleAddress);
  }

  function insertToNFTMarketplaceReentrancyGuardAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(NFT_MARKETPLACE_REENTRANCY_GUARD_AUTHORIZED_ROLE, roleAddress);
  }

  function insertToCollectorRoyaltyStorageAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(COLLECTOR_ROYALTY_STORAGE_AUTHORIZED_ROLE, roleAddress);
  }

  function insertToCollectorRoyaltyControllerAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(COLLECTOR_ROYALTY_CONTROLLER_AUTHORIZED_ROLE, roleAddress);
  }

  function insertToNFTAllowlistAuthorizedRole(
    address roleAddress
  ) external onlyRole(ADMIN_ROLE) {
    _grantRole(NFT_ALLOWLIST_AUTHORIZED_ROLE, roleAddress);
  }
}
