// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IOurkivePaymentStorageUpgradeable.sol";
import "../../../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../../../access/OurkiveAccessControlUpgradeable.sol";
import "../../../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
import "../../../killswitch/OurkiveKillswitchUpgradeable.sol";

contract OurkivePaymentStorageUpgradeable is
  IOurkivePaymentStorageUpgradeable,
  OurkiveAccessControlProxyUpgradeable,
  OurkiveKillswitchProxyUpgradeable
{
  address public usdc;

  function initialize(
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveKillswitchUpgradeable killswitch,
    address usdcParam
  ) public initializer {
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
    _OurkiveKillswitchProxyUpgradeable_init(killswitch);
    usdc = usdcParam;
  }

  function setCurrencyAddress(
    address currencyAddress,
    Currency currency
  ) external isCallerPaymentStorageAuthorized {
    if (currency == Currency.NATIVE) {
      return;
    }

    if (currency == Currency.USDC) {
      require(
        currencyAddress != address(0),
        "USDC contract address cannot be zero"
      );
      usdc = currencyAddress;
      return;
    }

    revert("Invalid currency");
  }

  function getCurrencyAddress(Currency currency) public view returns (address) {
    if (currency == Currency.NATIVE) {
      return address(0);
    }
    if (currency == Currency.USDC) {
      return usdc;
    }

    revert("Invalid currency");
  }
}
