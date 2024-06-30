// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IOurkiveNftMarketplaceAllowlist.sol";

contract OurkiveNftMarketplaceAllowlist is Ownable, IOurkiveNftMarketplaceAllowlist {
  mapping(address => bool) private allowlist;

  function addToAllowlist(address marketplaceAddress) public onlyOwner {
    require(marketplaceAddress != address(0), "Cannot add the zero address to the allowlist");
    allowlist[marketplaceAddress] = true;

    emit AddMarketplace(marketplaceAddress);
  }

  function removeFromAllowlist(address marketplaceAddress) public onlyOwner {
    require(marketplaceAddress != address(0), "Cannot remove the zero address from the allowlist");
    allowlist[marketplaceAddress] = false;

    emit RemoveMarketplace(marketplaceAddress);
  }

  function isAllowlisted(address marketplaceAddress) public view returns (bool) {
    return allowlist[marketplaceAddress];
  }
}