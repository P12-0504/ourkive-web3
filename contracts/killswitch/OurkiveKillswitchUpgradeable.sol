// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/* Ourkive */
import "../access/OurkiveAccessControlProxyUpgradeable.sol";
import "./IOurkiveKillswitchUpgradeable.sol";

/**
 * @dev This contract extends the functionalities of OurkiveAccessControlProxyUpgradeable and PausableUpgradeable
 * to implement a killswitch mechanism. The killswitch can pause and unpause contract operations, providing an
 * emergency control mechanism.
 */
contract OurkiveKillswitchUpgradeable is IOurkiveKillswitchUpgradeable, PausableUpgradeable, OurkiveAccessControlProxyUpgradeable {
  
  /**
   * @dev Initializes the contract by setting up the access control and pausable mechanisms.
   * @param accessControl An instance of IOurkiveAccessControlUpgradeable to set up role-based access control.
   */
  function initialize(IOurkiveAccessControlUpgradeable accessControl) public initializer {
    __Pausable_init();
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
  }

  /**
   * @dev Pauses the contract operations. Can only be called by an account with the admin role (i.e. ADMIN_ROLE).
   * This function triggers the paused state, disabling certain functions as per PausableUpgradeable.
   */
  function pause() public isCallerOurkiveEOA {
    _pause();
  }

  /**
   * @dev Unpauses the contract operations, resuming normal functionality. 
   * Can only be called by an account with the admin role (i.e. ADMIN_ROLE).
   * This function lifts the paused state, re-enabling functions that were disabled during the paused state.
   */
  function unpause() public isCallerOurkiveEOA {
    _unpause();
  }

  /**
   * @dev External view function to ensure the contract is not paused. 
   * It reverts if the contract is currently paused.
   * This can be used as a precondition for other functions to proceed only when the contract is active.
   */
  function requireNotPaused() external view {
    _requireNotPaused();
  }

  /**
   * @dev External view function to ensure the contract is paused. 
   * It reverts if the contract is not currently paused.
   * This can be used as a precondition for functions that should only operate when the contract is in a paused state.
   */
  function requirePaused() external view {
    _requirePaused();
  }
}
