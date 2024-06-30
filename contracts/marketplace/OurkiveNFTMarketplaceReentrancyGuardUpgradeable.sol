// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/* Ourkive */
import "../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../access/OurkiveAccessControlUpgradeable.sol";

contract OurkiveNFTMarketplaceReentrancyGuardUpgradeable is
  Initializable,
  OurkiveAccessControlProxyUpgradeable
{
  uint256 private constant _NOT_ENTERED = 1;
  uint256 private constant _ENTERED = 2;

  uint256 private _status;

  function initialize(
    OurkiveAccessControlUpgradeable accessControl
  ) public initializer {
    _status = _NOT_ENTERED;
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
  }

  function _nonReentrantBefore()
    external
    isCallerNFTMarketplaceReentrancyGuardAuthorized
  {
    // On the first call to nonReentrant, _status will be _NOT_ENTERED
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

    // Any calls to nonReentrant after this point will fail
    _status = _ENTERED;
  }

  function _nonReentrantAfter()
    external
    isCallerNFTMarketplaceReentrancyGuardAuthorized
  {
    // By storing the original value once again, a refund is triggered (see
    // https://eips.ethereum.org/EIPS/eip-2200)
    _status = _NOT_ENTERED;
  }

  /**
   * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
   * `nonReentrant` function in the call stack.
   */
  function _reentrancyGuardEntered() internal view returns (bool) {
    return _status == _ENTERED;
  }
}
