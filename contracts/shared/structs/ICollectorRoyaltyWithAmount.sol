// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ICollectorRoyaltyWithAmount {
  struct CollectorRoyaltyWithAmount {
    address receiver;
    uint amount;
  }
}
