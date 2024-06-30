// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/OurkiveAccessControlUpgradeable.sol";
import "../killswitch/OurkiveKillswitchUpgradeable.sol";
import "./IOurkiveMemberUpgradeable.sol";
import "./OurkiveDefaultMemberUpgradeable.sol";
import "./OurkiveSupporterUpgradeable.sol";
import "./OurkivePatronUpgradeable.sol";
import "./OurkiveOurkivianUpgradeable.sol";

interface IOurkiveMembershipControllerUpgradeable {
  // Define the MemberStatus enum
  enum MemberStatus {
    DEFAULT_MEMBER,
    SUPPORTER,
    PATRON
  }

  struct MemberState {
    MemberStatus memberStatus;
    bool isOurkivian;
  }

  // Events
  event OurkivianAdded(
    address indexed member,
    OurkiveOurkivianUpgradeable ourkivianContract
  );
  event OurkiviansAdded(address[] members);
  event MemberStatusSet(
    address indexed member,
    MemberStatus oldMemberStatus,
    MemberStatus newMemberStatus
  );
  event MemberOurkivianSet(address indexed member, bool isOurkivian);
  event OurkiviansRemoved(address[] ourkivians);
  event OurkivianRemovedAtIndex(uint256 index);
  event OurkivianRemoved(address ourkivian);

  // Function signatures
  function initialize(
    OurkiveAccessControlUpgradeable accessControl,
    OurkiveKillswitchUpgradeable killswitch
  ) external;
  function isMemberDefaultMember(address member) external view returns (bool);
  function isMemberOurkivian(address member) external view returns (bool);
  function isMemberSupporter(address member) external view returns (bool);
  function isMemberPatron(address member) external view returns (bool);
  function hasCollectorFee(address member) external view returns (bool);
  function setDefaultMemberContract(
    OurkiveDefaultMemberUpgradeable defaultMemberParam
  ) external;
  function setSupporterContract(
    OurkiveSupporterUpgradeable supporterParam
  ) external;
  function setPatronContract(OurkivePatronUpgradeable patronParam) external;
  function setOurkivianContract(
    OurkiveOurkivianUpgradeable ourkivianParam
  ) external;
  function addOurkivians(address[] calldata newOurkivians) external;
  function setMemberStatus(address member, MemberStatus memberStatus) external;
  function setMemberOurkivian(address member, bool isOurkivian) external;
  function removeAllOurkivians() external;
  function getOurkivians() external view returns (address[] memory);
  function getMemberStatus(address member) external view returns (MemberStatus);
  function getMemberStatusContract(
    address member
  ) external view returns (IOurkiveMemberUpgradeable);
  function getCollectorFee(
    address member,
    uint nftPrice
  ) external view returns (uint);
  function getCollectorFeeBps(address member) external view returns (uint);
  function getNFTBuyerPrice(
    address buyer,
    uint nftPrice
  ) external view returns (uint);
}
