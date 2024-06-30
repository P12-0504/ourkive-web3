// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.9;

// import "./IOurkiveArtistAllowlistUpgradeable.sol";
// import "../access/OurkiveAccessControlProxyUpgradeable.sol";
// import "../access/OurkiveAccessControlUpgradeable.sol";
// import "../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
// import "../killswitch/OurkiveKillswitchUpgradeable.sol";

// contract OurkiveArtistAllowlistUpgradeable is
//   IOurkiveArtistAllowlistUpgradeable,
//   OurkiveAccessControlProxyUpgradeable,
//   OurkiveKillswitchProxyUpgradeable
// {
//   mapping(address => bool) public allowlistedArtists;

//   function initialize(
//     OurkiveAccessControlUpgradeable accessControl,
//     OurkiveKillswitchUpgradeable killswitch
//   ) public initializer {
//     _OurkiveAccessControlProxyUpgradeable_init(accessControl);
//     _OurkiveKillswitchProxyUpgradeable_init(killswitch);
//   }

//   modifier checkArtist(address artist) {
//     require(artist != address(0), "Artist address should not be zero");
//     _;
//   }

//   function allowlistArtist(
//     address artist
//   ) external isCallerArtistAllowlistAuthorized checkArtist(artist) {
//     allowlistedArtists[artist] = true;
//   }

//   function removeArtist(
//     address artist
//   ) external isCallerArtistAllowlistAuthorized checkArtist(artist) {
//     allowlistedArtists[artist] = false;
//   }
// }
