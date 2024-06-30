// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IArtistRoyaltyInfo {
  struct ArtistRoyaltyInfo {
    address receiver;
    uint96 royaltyBps;
  }
}
