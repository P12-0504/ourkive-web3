// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IOurkiveRoyaltyReceiver {
  /**
   * @dev Emitted when `RoyaltyReceiver` receives royalty and completes splitting it in the receive method.
   */
  event RoyaltySplit(address indexed _ourkive, address indexed _artist, uint _artistPercentage, uint ourkivePayment, uint artistPayment);
}