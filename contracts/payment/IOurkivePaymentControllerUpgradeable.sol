// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../shared/storages/payment/IOurkivePaymentStorageUpgradeable.sol";
import "../shared/structs/IPayee.sol";
import "../shared/enums/ICurrency.sol";
import "../shared/tokens/IERC20PermitExtended.sol";
import "../shared/storages/royalty/IOurkiveArtistRoyaltyStorageUpgradeable.sol";
import "../member/IOurkiveMembershipControllerUpgradeable.sol";

interface IOurkivePaymentControllerUpgradeable is IPayee, ICurrency {
  function setPaymentStorage(
    IOurkivePaymentStorageUpgradeable paymentStorageParam
  ) external;
  function distributePayments(
    Payee[] memory payees,
    Currency currency
  ) external;
  function pay(
    address payable recipient,
    uint amount,
    Currency currency
  ) external payable;
}
