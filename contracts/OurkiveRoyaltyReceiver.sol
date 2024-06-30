// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IOurkiveRoyaltyReceiver.sol";

contract OurkiveRoyaltyReceiver is Ownable, IOurkiveRoyaltyReceiver {
  using SafeMath for uint256;

  address private ourkive;
  address private artist;
  uint private artistPercentage;

  constructor(address _ourkive, address _artist, uint _artistPercentage) {
    ourkive = _ourkive;
    artist = _artist;
    artistPercentage = _artistPercentage;
  }

  receive() external payable {
    require(ourkive != address(0), "Ourkive's address is not set.");
    require(artist != address(0), "Artist's address is not set.");
    require(artistPercentage != 0, "Artist percentage is not set.");
    
    // Calculate artist royalty payment
    uint artistResaleRoyalty = msg.value.mul(artistPercentage).div(10000);

    // Pay Artist
    (bool artistPaymentSuccess, ) = artist.call{value: artistResaleRoyalty}("");
    require(artistPaymentSuccess, "Failed to send Matic to artist.");

    // Pay Remaining to Ourkive
    uint ourkivePayment = msg.value.sub(artistResaleRoyalty);
    (bool ourkivePaymentSuccess, ) = ourkive.call{value: ourkivePayment}("");
    require(ourkivePaymentSuccess, "Failed to send payment to Ourkive.");

    emit RoyaltySplit(ourkive, artist, artistPercentage, ourkivePayment, artistResaleRoyalty);
  }
}