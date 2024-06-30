// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* OpenZeppelin */
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/* Ourkive */
import "./IOurkiveMembershipControllerUpgradeable.sol";
import "../killswitch/OurkiveKillswitchUpgradeable.sol";
import "../OurkiveCollectorToken.sol";
import "../access/OurkiveAccessControlProxyUpgradeable.sol";
import "../killswitch/OurkiveKillswitchProxyUpgradeable.sol";
import "./IOurkiveMemberUpgradeable.sol";
import "./OurkiveDefaultMemberUpgradeable.sol";
import "./OurkiveSupporterUpgradeable.sol";
import "./OurkivePatronUpgradeable.sol";
import "./OurkiveOurkivianUpgradeable.sol";

/**
 * @dev This contract manages and controls the various membership types within the Ourkive ecosystem.
 * It handles member status assignments, checks, and related functionalities.
 */
contract OurkiveMembershipControllerUpgradeable is
  IOurkiveMembershipControllerUpgradeable,
  OurkiveAccessControlProxyUpgradeable,
  OurkiveKillswitchProxyUpgradeable
{
  // State variables
  mapping(address => MemberState) public members; // Maps addresses to their membership states
  OurkiveDefaultMemberUpgradeable public defaultMember; // Contract for default members
  OurkiveSupporterUpgradeable public supporter; // Contract for supporter members
  OurkivePatronUpgradeable public patron; // Contract for patron members
  OurkiveOurkivianUpgradeable public ourkivian; // Contract for ourkivian members
  address[] public ourkivians; // Array of addresses who are ourkivians

  /**
   * @dev Initializes the controller with access control and killswitch configurations.
   * @param accessControl The access control contract to be used.
   * @param killswitch The killswitch contract to be used.
   */
  function initialize(
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveKillswitchUpgradeable killswitch
  ) public initializer {
    _OurkiveAccessControlProxyUpgradeable_init(accessControl);
    _OurkiveKillswitchProxyUpgradeable_init(killswitch);
  }

  /*****************************/
  /********  Modifiers  ********/
  /*****************************/

  /**
   * @dev Ensures the input for member status is valid.
   * @param memberStatus The status of the member to be validated.
   */
  modifier isInputMemberStatus(MemberStatus memberStatus) {
    require(
      memberStatus == MemberStatus.DEFAULT_MEMBER ||
        memberStatus == MemberStatus.SUPPORTER ||
        memberStatus == MemberStatus.PATRON,
      "Invalid member state input"
    );
    _;
  }

  /*****************************/
  /*********  Checkers  ********/
  /*****************************/

  // Various checker functions to determine the membership status of a member
  // They verify if a member belongs to a particular membership category

  function isMemberDefaultMember(
    address member
  ) public view requireNotPaused returns (bool) {
    return members[member].memberStatus == MemberStatus.DEFAULT_MEMBER;
  }

  function isMemberOurkivian(
    address member
  ) public view requireNotPaused returns (bool) {
    return members[member].isOurkivian && doesOurkivianExist(member);
  }

  function isMemberSupporter(
    address member
  ) public view requireNotPaused returns (bool) {
    return members[member].memberStatus == MemberStatus.SUPPORTER;
  }

  function isMemberPatron(
    address member
  ) public view requireNotPaused returns (bool) {
    return members[member].memberStatus == MemberStatus.PATRON;
  }

  /**
   * @dev Checks if an Ourkivian exists in the ourkivians array.
   * @param ourkivianAddress The address to check.
   * @return true if exists, false otherwise.
   */
  function doesOurkivianExist(
    address ourkivianAddress
  ) internal view returns (bool) {
    for (uint i = 0; i < ourkivians.length; i++) {
      if (ourkivians[i] == ourkivianAddress) {
        return true;
      }
    }
    return false;
  }

  /**
   * @dev Determines if a member has to pay a collector fee.
   * @param member The address of the member.
   * @return true if the member has a collector fee, false otherwise.
   */
  function hasCollectorFee(
    address member
  ) public view requireNotPaused returns (bool) {
    uint fee = getMemberStatusContract(member).getCollectorFeeBasisPoint();
    if (isMemberOurkivian(member)) {
      fee = ourkivian.getCollectorFeeBasisPoint();
    } else if (isMemberDefaultMember(member)) {
      fee = defaultMember.getCollectorFeeBasisPoint();
    }

    return fee != 0;
  }

  /*****************************/
  /********   Setters   ********/
  /*****************************/

  // Setter functions for updating contract references for various member types

  function setDefaultMemberContract(
    OurkiveDefaultMemberUpgradeable defaultMemberParam
  ) external isCallerOurkiveEOA {
    defaultMember = defaultMemberParam;
  }
  function setSupporterContract(
    OurkiveSupporterUpgradeable supporterParam
  ) external isCallerOurkiveEOA {
    supporter = supporterParam;
  }
  function setPatronContract(
    OurkivePatronUpgradeable patronParam
  ) external isCallerOurkiveEOA {
    patron = patronParam;
  }
  function setOurkivianContract(
    OurkiveOurkivianUpgradeable ourkivianParam
  ) external isCallerOurkiveEOA {
    ourkivian = ourkivianParam;
  }

  /**
   * @dev Adds a new Ourkivian member.
   * @param newOurkivian The address of the new Ourkivian member.
   */
  function insertOurkivian(
    address newOurkivian
  ) internal isCallerMembershipControllerAuthorized {
    if (!doesOurkivianExist(newOurkivian)) {
      ourkivians.push(newOurkivian);
      emit OurkivianAdded(newOurkivian, ourkivian);
    }
  }

  /**
   * @dev Adds multiple Ourkivian members at once.
   * @param newOurkivians An array of addresses to be added as Ourkivians.
   */
  function addOurkivians(
    address[] calldata newOurkivians
  ) external isCallerOurkiveEOA {
    for (uint i = 0; i < newOurkivians.length; i++) {
      ourkivians.push(newOurkivians[i]);
      setMemberOurkivian(newOurkivians[i], true);
    }

    emit OurkiviansAdded(newOurkivians);
  }

  /**
   * @dev Sets the membership status for a member.
   * @param member The address of the member.
   * @param memberStatus The new status to be set.
   */
  function setMemberStatus(
    address member,
    MemberStatus memberStatus
  )
    external
    isCallerMembershipControllerAuthorized
    isInputMemberStatus(memberStatus)
    requireNotPaused
  {
    MemberState memory memberState = members[member];
    members[member] = MemberState(memberStatus, memberState.isOurkivian);

    emit MemberStatusSet(member, memberState.memberStatus, memberStatus);
  }

  /**
   * @dev Sets or unsets a member as an Ourkivian.
   * @param member The address of the member.
   * @param isOurkivian Boolean indicating whether the member is an Ourkivian.
   */
  function setMemberOurkivian(
    address member,
    bool isOurkivian
  ) public isCallerMembershipControllerAuthorized requireNotPaused {
    MemberState memory memberState = members[member];
    members[member] = MemberState(memberState.memberStatus, isOurkivian);

    isOurkivian ? insertOurkivian(member) : removeOurkivian(member);

    emit MemberOurkivianSet(member, isOurkivian);
  }

  /*****************************/
  /*******   Deleters   ********/
  /*****************************/

  /**
   * @dev Removes all Ourkivian members.
   */
  function removeAllOurkivians() external isCallerOurkiveEOA {
    address[] memory oldOurkivians = ourkivians;

    for (uint i = 0; i < oldOurkivians.length; i++) {
      setMemberOurkivian(oldOurkivians[i], false);
    }

    delete ourkivians;

    emit OurkiviansRemoved(oldOurkivians);
  }

  /**
   * @dev Removes an Ourkivian member at a specific index in the ourkivians array.
   * @param index The index at which to remove the Ourkivian.
   */
  function removeOurkivianAtIndex(uint index) internal {
    require(index < ourkivians.length, "Index out of bounds");

    for (uint i = index; i < ourkivians.length - 1; i++) {
      ourkivians[i] = ourkivians[i + 1];
    }

    ourkivians.pop();

    emit OurkivianRemovedAtIndex(index);
  }

  /**
   * @dev Removes an Ourkivian member by address.
   * @param ourkivianAddress The address of the Ourkivian to remove.
   */
  function removeOurkivian(
    address ourkivianAddress
  ) internal isCallerMembershipControllerAuthorized requireNotPaused {
    for (uint i = 0; i < ourkivians.length; i++) {
      if (ourkivians[i] == ourkivianAddress) {
        removeOurkivianAtIndex(i);

        emit OurkivianRemoved(ourkivianAddress);
        break;
      }
    }
  }

  /*****************************/
  /********   Getters   ********/
  /*****************************/

  /**
   * @dev Returns the list of Ourkivian members.
   * @return An array of addresses who are Ourkivians.
   */
  function getOurkivians()
    public
    view
    requireNotPaused
    returns (address[] memory)
  {
    return ourkivians;
  }

  /**
   * @dev Retrieves the membership status of a given member.
   * @param member The address of the member.
   * @return The membership status of the member.
   */
  function getMemberStatus(
    address member
  ) public view requireNotPaused returns (MemberStatus) {
    return members[member].memberStatus;
  }

  /**
   * @dev Retrieves the specific member contract based on the member's status.
   * @param member The address of the member.
   * @return The corresponding member contract.
   */
  function getMemberStatusContract(
    address member
  ) public view requireNotPaused returns (IOurkiveMemberUpgradeable) {
    MemberState memory memberState = members[member];
    if (memberState.memberStatus == MemberStatus.DEFAULT_MEMBER) {
      return defaultMember;
    }

    if (memberState.memberStatus == MemberStatus.SUPPORTER) {
      return supporter;
    }

    // Only patron is left
    return patron;
  }

  /**
   * @dev Calculates the collector fee for a member based on the NFT price.
   * @param member The address of the member.
   * @param nftPrice The price of the NFT.
   * @return The calculated collector fee.
   */
  function getCollectorFee(
    address member,
    uint nftPrice
  ) public view requireNotPaused returns (uint) {
    if (isMemberOurkivian(member)) {
      return ourkivian.getCollectorFee(nftPrice);
    }

    return getMemberStatusContract(member).getCollectorFee(nftPrice);
  }

  function getCollectorFeeBps(
    address member
  ) public view requireNotPaused returns (uint) {
    if (isMemberOurkivian(member)) {
      return ourkivian.getCollectorFeeBasisPoint();
    }

    return getMemberStatusContract(member).getCollectorFeeBasisPoint();
  }

  /**
   * @dev Calculates the price for an NFT buyer including the collector fee.
   * @param buyer The address of the NFT buyer.
   * @param nftPrice The base price of the NFT.
   * @return The total price including the collector fee.
   */
  function getNFTBuyerPrice(
    address buyer,
    uint nftPrice
  ) public view requireNotPaused returns (uint) {
    if (isMemberOurkivian(buyer)) {
      return ourkivian.getNFTBuyerPrice(nftPrice);
    }

    return getMemberStatusContract(buyer).getNFTBuyerPrice(nftPrice);
  }
}
