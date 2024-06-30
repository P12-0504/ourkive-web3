// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IOurkiveAccessControlUpgradeable {
  function isCallerOurkiveEOA(address caller) external view returns (bool);
  function isCallerKillswitch(address caller) external view returns (bool);
  function isCallerMembershipControllerAuthorized(
    address caller
  ) external view returns (bool);
  function isCallerNFTMarketplaceAuthorized(
    address caller
  ) external view returns (bool);
  function isCallerArtistRoyaltyStorageAuthorized(
    address caller
  ) external view returns (bool);
  function isCallerArtistRoyaltyControllerAuthorized(
    address caller
  ) external view returns (bool);
  function isCallerNFTDataStorageAuthorized(
    address caller
  ) external view returns (bool);
  function isCallerPaymentStorageAuthorized(
    address caller
  ) external view returns (bool);
  function isCallerPaymentControllerAuthorized(
    address caller
  ) external view returns (bool);
  function isCallerNFTMarketplaceReentrancyGuardAuthorized(
    address caller
  ) external view returns (bool);
  function isCallerCollectorRoyaltyStorageAuthorized(
    address caller
  ) external view returns (bool);
  function isCallerCollectorRoyaltyControllerAuthorized(
    address caller
  ) external view returns (bool);
  function isCallerNFTAllowlistAuthorized(
    address caller
  ) external view returns (bool);

  function insertToAdminRole(address admin) external;
  function insertToKillswitchRole(address killswitch) external;
  function insertToMembershipControllerAuthorizedRole(
    address roleAddress
  ) external;
  function insertToNFTMarketplaceAuthorizedRole(address roleAddress) external;
  function insertToArtistRoyaltyStorageAuthorizedRole(
    address roleAddress
  ) external;
  function insertToArtistRoyaltyControllerAuthorizedRole(
    address roleAddress
  ) external;
  function insertToNFTDataStorageAuthorizedRole(address roleAddress) external;
  function insertToPaymentStorageAuthorizedRole(address roleAddress) external;
  function insertToPaymentControllerAuthorizedRole(
    address roleAddress
  ) external;
  function insertToNFTMarketplaceReentrancyGuardAuthorizedRole(
    address roleAddress
  ) external;
  function insertToCollectorRoyaltyStorageAuthorizedRole(
    address roleAddress
  ) external;
  function insertToCollectorRoyaltyControllerAuthorizedRole(
    address roleAddress
  ) external;
  function insertToNFTAllowlistAuthorizedRole(address roleAddress) external;
}
