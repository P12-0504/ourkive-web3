// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/* Ourkive */
import "./IOurkivePaymentControllerUpgradeable.sol";
import "../shared/tokens/IERC20PermitExtended.sol";
import "../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../access/OurkiveAccessControlUpgradeable.sol";
import "../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
import "../killswitch/OurkiveKillswitchUpgradeable.sol";
import "../member/IOurkiveMembershipControllerUpgradeable.sol";
import "../shared/storages/payment/IOurkivePaymentStorageUpgradeable.sol";

contract OurkivePaymentControllerUpgradeable is
  IOurkivePaymentControllerUpgradeable,
  OurkiveAccessControlProxyUpgradeable,
  OurkiveKillswitchProxyUpgradeable,
  ReentrancyGuardUpgradeable
{
  using SafeERC20 for IERC20PermitExtended;

  IOurkivePaymentStorageUpgradeable public paymentStorage;

  function initialize(
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveKillswitchUpgradeable killswitch,
    IOurkivePaymentStorageUpgradeable paymentStorageParam
  ) public initializer {
    __ReentrancyGuard_init();
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
    _OurkiveKillswitchProxyUpgradeable_init(killswitch);
    paymentStorage = paymentStorageParam;
  }

  function setPaymentStorage(
    IOurkivePaymentStorageUpgradeable paymentStorageParam
  ) external isCallerOurkiveEOA {
    paymentStorage = paymentStorageParam;
  }

  /**
   * @dev Distribute payments among payees
   */
  function distributePayments(
    Payee[] memory payees,
    Currency currency
  ) external isCallerPaymentControllerAuthorized nonReentrant {
    require(payees.length > 0, "At least one payee is required");

    for (uint i; i < payees.length; i++) {
      pay(payable(payees[i].walletAddress), payees[i].amount, currency);
    }
  }

  function _validatePayees(Payee[] memory payees) private pure {
    // Check if the total percent is 100
    uint256 totalPecent = 0;
    for (uint i = 0; i < payees.length; i++) {
      totalPecent += payees[i].percent;
    }

    require(totalPecent == 10000, "Total share bps must be 10000");
  }

  // TODO: Add an access control modifier
  function pay(
    address payable recipient,
    uint amount,
    Currency currency
  ) public payable isCallerPaymentControllerAuthorized {
    if (recipient == address(0) || amount == 0) {
      return;
    }

    if (currency == Currency.NATIVE) {
      _payNativeToken(recipient, amount);
      return;
    }

    _payERC20(recipient, amount, currency);
  }

  function _payNativeToken(address payable recipient, uint amount) private {
    require(
      address(this).balance >= amount,
      "Insufficient native token balance"
    );
    (bool paid, ) = recipient.call{value: amount}("");
    require(paid, "Failed to pay with native currency");
  }

  function _payERC20(
    address payable recipient,
    uint amount,
    Currency currency
  ) private {
    IERC20PermitExtended erc20 = IERC20PermitExtended(
      paymentStorage.getCurrencyAddress(currency)
    );
    uint256 erc20Balance = erc20.balanceOf(address(this));
    require(erc20Balance >= amount, "Insufficient ERC20 token balance");
    bool erc20paid = erc20.transfer(recipient, amount);
    require(erc20paid, "Failed to pay with ERC20");
  }

  receive() external payable {}
}
