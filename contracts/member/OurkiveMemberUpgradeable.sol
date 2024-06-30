// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/* Ourkive */
import "./IOurkiveMemberUpgradeable.sol";

/**
 * @dev This abstract contract serves as a base for different types of Ourkive membership contracts.
 * It defines common functions related to collector fees and pricing for NFT buyers, adhering to the 
 * IOurkiveMemberUpgradeable interface. It is designed to be extended and customized for various membership tiers.
 */
abstract contract OurkiveMemberUpgradeable is IOurkiveMemberUpgradeable, Initializable {
  
  /**
   * @dev Initializes the contract. This function is meant to be called from the initializer function 
   * of the derived contract and ensures that the contract is only initialized once.
   */
  function _OurkiveMemberUpgradeable_init() internal onlyInitializing {}

  /**
   * @dev Returns the basis point for calculating the collector fee. This function can be overridden
   * by derived contracts to provide different fee rates for different membership tiers.
   * @return The collector fee basis point.
   */
  function getCollectorFeeBasisPoint() public pure virtual returns (uint) {
    return 300; // Default basis point for collector fee, 3%
  }

  /**
   * @dev Calculates the collector fee based on the NFT price. 
   * @param nftPrice The sale price of the NFT.
   * @return The calculated collector fee.
   */
  function getCollectorFee(uint nftPrice) public pure virtual returns (uint) {
    // Calculates the collector fee as a percentage of the NFT price
    return nftPrice * getCollectorFeeBasisPoint() / 10000;
  }

  /**
   * @dev Calculates the price for the NFT buyer, including the collector fee.
   * @param nftPrice The base sale price of the NFT.
   * @return The total price for the NFT buyer, including the collector fee.
   */
  function getNFTBuyerPrice(uint nftPrice) public pure virtual returns (uint) {
    // The total price includes the base NFT price and the collector fee
    return nftPrice + getCollectorFee(nftPrice);
  }
}
