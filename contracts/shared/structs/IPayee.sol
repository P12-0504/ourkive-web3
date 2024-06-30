// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IPayee {
  struct Payee {
    address walletAddress;
    uint256 percent; // Represented as a basis point
    uint256 amount;
  }
}
