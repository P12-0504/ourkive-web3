// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../payment/IOurkivePaymentControllerUpgradeable.sol";
import "../../shared/structs/IPayee.sol";
import "../../shared/enums/ICurrency.sol";

contract PaymentControllerReentrancyAttack is IPayee, ICurrency {
  IOurkivePaymentControllerUpgradeable public paymentController;
  address public owner;
  bool public attackEnabled = false;

  constructor(address _paymentController) {
    paymentController = IOurkivePaymentControllerUpgradeable(
      _paymentController
    );
    owner = msg.sender;
  }

  // Function to receive ETH
  receive() external payable {
    if (attackEnabled) {
      attackEnabled = false; // prevent infinite loop
      Payee[] memory payees = new Payee[](1);
      payees[0] = Payee(payable(msg.sender), 10000, msg.value);
      paymentController.distributePayments(payees, Currency.NATIVE);
    }
  }

  // Enable the attack and make a call to distributePayments
  function attack() public payable {
    require(msg.sender == owner, "Only owner can initiate attack");
    attackEnabled = true;
    Payee[] memory payees = new Payee[](1);
    payees[0] = Payee(payable(address(this)), 10000, msg.value);
    paymentController.distributePayments(payees, Currency.NATIVE);
  }
}
