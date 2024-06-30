// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IOurkiveArtistAllowlistUpgradeable {
  function allowlistArtist(address artist) external;
  function removeArtist(address artist) external;

  function allowlistedArtists(address artist) external view returns (bool);
}
