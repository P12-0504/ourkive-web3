// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../enums/ICurrency.sol";

interface IOurkivePaymentStorageUpgradeable is ICurrency {
  function setCurrencyAddress(
    address currencyAddress,
    Currency currency
  ) external;

  function getCurrencyAddress(
    Currency currency
  ) external view returns (address);
}
