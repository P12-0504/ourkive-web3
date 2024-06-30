// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/* Ourkive */
import "./OurkiveKillswitchUpgradeable.sol";

/**
 * @dev This abstract contract serves as a proxy for OurkiveKillswitchUpgradeable, allowing derived contracts to
 * inherit killswitch functionality (i.e., pausing and unpausing operations). It extends Initializable and
 * ContextUpgradeable to provide initialization and context features.
 */
abstract contract OurkiveKillswitchProxyUpgradeable is
  Initializable,
  ContextUpgradeable
{
  // Holds the address to the OurkiveKillswitchUpgradeable contract
  OurkiveKillswitchUpgradeable private _killswitch;

  /**
   * @dev Initializes the proxy with a reference to an OurkiveKillswitchUpgradeable contract.
   * This method should be called from the initializer function of the derived contract.
   * @param killswitch The OurkiveKillswitchUpgradeable contract that will be controlled through this proxy.
   */
  function _OurkiveKillswitchProxyUpgradeable_init(
    OurkiveKillswitchUpgradeable killswitch
  ) public onlyInitializing {
    _killswitch = killswitch;
  }

  /**
   * @dev Modifier to ensure that the function can only be called when the killswitch contract is paused.
   * This is used to restrict functionality during emergencies or maintenance.
   */
  modifier requirePaused() {
    _killswitch.requirePaused();
    _;
  }

  /**
   * @dev Modifier to ensure that the function can only be called when the killswitch contract is not paused.
   * This ensures that normal operations can only proceed when the system is fully functional.
   */
  modifier requireNotPaused() {
    _killswitch.requireNotPaused();
    _;
  }

  /**
   * @dev Allows updating the reference to the OurkiveKillswitchUpgradeable contract.
   * This function requires the caller to be the Ourkive EOA (Externally Owned Account), ensuring only authorized users can change the killswitch.
   * @param killswitch The address of the new OurkiveKillswitchUpgradeable contract to set.
   */
  function setKillswitch(OurkiveKillswitchUpgradeable killswitch) external {
    bool isCallerOurkiveEOA = killswitch.getAccessControl().isCallerOurkiveEOA(
      msg.sender
    );
    require(isCallerOurkiveEOA, "Caller must be Ourkive EOA");
    _killswitch = killswitch;
  }

  /**
   * @dev Provides a public view function to get the current OurkiveKillswitchUpgradeable contract interfaced by this proxy.
   * @return The address of OurkiveKillswitchUpgradeable instance currently used by this proxy.
   */
  function getKillswitch() public view returns (OurkiveKillswitchUpgradeable) {
    return _killswitch;
  }
}
