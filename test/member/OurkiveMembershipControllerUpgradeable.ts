import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveKillswitchUpgradeable,
  deployOurkiveMembershipControllerUpgradeable,
  deployOurkiveMemberStatus,
} from "../../test_utils/deployFixtures";
import {
  insertToKillswitchRole,
  insertToMembershipControllerAuthorizedRole,
  insertToNFTMarketplaceAuthorizedRole,
} from "../../test_utils/access/OurkiveAccessControlUpgradeable";
import {
  MemberStatus,
  addOurkivians,
  getCollectorFee,
  getMemberStatus,
  getMemberStatusContract,
  getNFTBuyerPrice,
  hasCollectorFee,
  isMemberDefaultMember,
  isMemberOurkivian,
  isMemberPatron,
  isMemberSupporter,
  setDefaultMemberContract,
  setMemberOurkivian,
  setMemberStatus,
  setOurkivianContract,
  setPatronContract,
  setSupporterContract,
} from "../../test_utils/member/OurkiveMembershipControllerUpgradeable";
import connectMethodToCaller from "../../test_utils/connectMethodToCaller";

describe("OurkiveMembershipControllerUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner, artist, collector, collectorTwo] = await ethers.getSigners();

    const { accessControl } = await deployOurkiveAccessControlUpgradeable();
    const { killswitch } =
      await deployOurkiveKillswitchUpgradeable(accessControl);
    const {
      defaultMemberContract,
      supporterContract,
      patronContract,
      ourkivianContract,
    } = await deployOurkiveMemberStatus();
    const { membershipController } =
      await deployOurkiveMembershipControllerUpgradeable(
        accessControl,
        killswitch,
      );

    await insertToKillswitchRole(accessControl, {
      address: await killswitch.getAddress(),
    });

    await insertToMembershipControllerAuthorizedRole(accessControl, {
      address: owner.address,
    });

    await insertToNFTMarketplaceAuthorizedRole(accessControl, {
      address: owner.address,
    });

    await setDefaultMemberContract(
      membershipController,
      {
        address: await defaultMemberContract.getAddress(),
      },
      owner,
    );
    await setSupporterContract(
      membershipController,
      {
        address: await supporterContract.getAddress(),
      },
      owner,
    );
    await setPatronContract(
      membershipController,
      {
        address: await patronContract.getAddress(),
      },
      owner,
    );
    await setOurkivianContract(
      membershipController,
      {
        address: await ourkivianContract.getAddress(),
      },
      owner,
    );

    const membershipControllerAuthorizedRole =
      await accessControl.MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE();
    const nftMarketplaceAuthorizedRole =
      await accessControl.NFT_MARKETPLACE_AUTHORIZED_ROLE();

    const nftPrice = ethers.parseUnits("1000", 6);

    return {
      owner,
      artist,
      collector,
      collectorTwo,
      accessControl,
      killswitch,
      membershipController,
      nftPrice,
      membershipControllerAuthorizedRole,
      nftMarketplaceAuthorizedRole,
      defaultMemberContract,
      supporterContract,
      patronContract,
      ourkivianContract,
    };
  };

  it("Check if the price comes out as expected for default member", async () => {
    const { collector, membershipController, nftPrice, defaultMemberContract } =
      await loadFixture(beforeEachFixture);

    // Make sure that collector is a default member
    const isCollectorDefaultMember = await isMemberDefaultMember(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(isCollectorDefaultMember).to.equal(true);
    const isCollectorSupporter = await isMemberSupporter(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(isCollectorSupporter).to.equal(false);
    const isCollectorPatron = await isMemberPatron(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(isCollectorPatron).to.equal(false);
    const isCollectorOurkivian = await isMemberOurkivian(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(isCollectorOurkivian).to.equal(false);

    // Check collector fee
    const collectorFeeAmount = await getCollectorFee(
      membershipController,
      { member: collector.address, nftPrice },
      collector,
    );
    expect(collectorFeeAmount).to.equal(ethers.parseUnits("30", 6));

    // Check hasCollectorFee
    const doesCollectorHaveFee = await hasCollectorFee(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(doesCollectorHaveFee).to.equal(true);

    // Check the NFT prices
    const collectorNftPrice = await getNFTBuyerPrice(
      membershipController,
      { buyer: collector.address, nftPrice },
      collector,
    );
    expect(collectorNftPrice).to.equal(ethers.parseUnits("1030", 6));

    // Check member status contract address
    const memberContract = await getMemberStatusContract(
      membershipController,
      { member: collector.address },
      collector,
    );
    const defaultMemberContractAddress =
      await defaultMemberContract.getAddress();
    expect(memberContract.toLowerCase()).to.equal(
      defaultMemberContractAddress.toLowerCase(),
    );
  });

  it("Check if the price comes out as expected for collector", async () => {
    const {
      owner,
      collector,
      membershipController,
      nftPrice,
      supporterContract,
    } = await loadFixture(beforeEachFixture);

    await setMemberStatus(
      membershipController,
      { member: collector.address, memberStatus: MemberStatus.SUPPORTER },
      owner,
    );

    const isCollectorSupporter = await isMemberSupporter(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(isCollectorSupporter).to.equal(true);

    const collectorFeeAmount = await getCollectorFee(
      membershipController,
      { member: collector.address, nftPrice },
      collector,
    );
    expect(collectorFeeAmount).to.equal(ethers.parseUnits("30", 6));

    const doesCollectorHaveFee = await hasCollectorFee(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(doesCollectorHaveFee).to.equal(true);

    const collectorNftPrice = await getNFTBuyerPrice(
      membershipController,
      { buyer: collector.address, nftPrice },
      collector,
    );
    expect(collectorNftPrice).to.equal(ethers.parseUnits("1030", 6));

    const memberContract = await getMemberStatusContract(
      membershipController,
      { member: collector.address },
      collector,
    );
    const collectorContractAddress = await supporterContract.getAddress();
    expect(memberContract.toLowerCase()).to.equal(
      collectorContractAddress.toLowerCase(),
    );
  });

  it("Check if the price comes out as expected for patron", async () => {
    const { owner, collector, membershipController, nftPrice, patronContract } =
      await loadFixture(beforeEachFixture);

    await setMemberStatus(
      membershipController,
      { member: collector.address, memberStatus: MemberStatus.PATRON },
      owner,
    );

    const isCollectorPatron = await isMemberPatron(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(isCollectorPatron).to.equal(true);

    const collectorFeeAmount = await getCollectorFee(
      membershipController,
      { member: collector.address, nftPrice },
      collector,
    );
    expect(collectorFeeAmount).to.equal(ethers.parseUnits("30", 6));

    const doesCollectorHaveFee = await hasCollectorFee(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(doesCollectorHaveFee).to.equal(true);

    const collectorNftPrice = await getNFTBuyerPrice(
      membershipController,
      { buyer: collector.address, nftPrice },
      collector,
    );
    expect(collectorNftPrice).to.equal(ethers.parseUnits("1030", 6));

    const memberContract = await getMemberStatusContract(
      membershipController,
      { member: collector.address },
      collector,
    );
    const patronContractAddress = await patronContract.getAddress();
    expect(memberContract.toLowerCase()).to.equal(
      patronContractAddress.toLowerCase(),
    );
  });
  it("Check if the price comes out as expected for ourkivian", async () => {
    const { owner, collector, membershipController, nftPrice } =
      await loadFixture(beforeEachFixture);

    await setMemberOurkivian(
      membershipController,
      { member: collector.address, isOurkivian: true },
      owner,
    );

    const isCollectorOurkivian = await isMemberOurkivian(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(isCollectorOurkivian).to.equal(true);

    const collectorFeeAmount = await getCollectorFee(
      membershipController,
      { member: collector.address, nftPrice },
      collector,
    );

    expect(collectorFeeAmount).to.equal(ethers.parseUnits("30", 6));

    const doesCollectorHaveFee = await hasCollectorFee(
      membershipController,
      { member: collector.address },
      collector,
    );
    expect(doesCollectorHaveFee).to.equal(true);

    const collectorNftPrice = await getNFTBuyerPrice(
      membershipController,
      { buyer: collector.address, nftPrice },
      collector,
    );
    expect(collectorNftPrice).to.equal(ethers.parseUnits("1030", 6));
  });

  it("Should correctly set and retrieve member statuses", async () => {
    const { owner, collector, membershipController } =
      await loadFixture(beforeEachFixture);

    await setMemberStatus(
      membershipController,
      { member: owner.address, memberStatus: MemberStatus.SUPPORTER },
      owner,
    ); // Set to COLLECTOR
    expect(
      await getMemberStatus(
        membershipController,
        { member: owner.address },
        owner,
      ),
    ).to.equal(MemberStatus.SUPPORTER);

    await setMemberStatus(
      membershipController,
      { member: collector.address, memberStatus: MemberStatus.PATRON },
      owner,
    ); // Set to PATRON
    expect(
      await membershipController.getMemberStatus(collector.address),
    ).to.equal(MemberStatus.PATRON);
  });

  it("Should correctly add and remove Ourkivians", async () => {
    const { owner, collector, membershipController } =
      await loadFixture(beforeEachFixture);

    // Add Ourkivian
    await setMemberOurkivian(
      membershipController,
      { member: collector.address, isOurkivian: true },
      owner,
    );
    expect(
      await isMemberOurkivian(
        membershipController,
        { member: collector.address },
        collector,
      ),
    ).to.equal(true);

    // Remove Ourkivian
    await setMemberOurkivian(
      membershipController,
      { member: collector.address, isOurkivian: false },
      owner,
    );
    expect(
      await isMemberOurkivian(
        membershipController,
        { member: collector.address },
        collector,
      ),
    ).to.equal(false);
  });

  it("Should only allow the owner to set member statuses", async () => {
    const {
      collector,
      membershipController,
      artist,
      membershipControllerAuthorizedRole,
    } = await loadFixture(beforeEachFixture);

    await expect(
      setMemberStatus(
        membershipController,
        { member: collector.address, memberStatus: MemberStatus.SUPPORTER },
        artist,
      ),
    ).to.be.revertedWith(
      `AccessControl: account ${artist.address.toLowerCase()} is missing role ${membershipControllerAuthorizedRole}`,
    );
  });

  it("Should revert functions when the contract is paused", async () => {
    const { owner, collector, membershipController, killswitch } =
      await loadFixture(beforeEachFixture);

    await connectMethodToCaller(killswitch, owner, "pause")();

    await expect(
      setMemberStatus(
        membershipController,
        { member: collector.address, memberStatus: MemberStatus.SUPPORTER },
        owner,
      ),
    ).to.be.revertedWith("Pausable: paused");
  });

  it("Should emit events on setting member status", async () => {
    const { owner, collector, membershipController } =
      await loadFixture(beforeEachFixture);

    await expect(
      setMemberStatus(
        membershipController,
        { member: collector.address, memberStatus: MemberStatus.SUPPORTER },
        owner,
      ),
    )
      .to.emit(membershipController, "MemberStatusSet")
      .withArgs(
        collector.address,
        MemberStatus.DEFAULT_MEMBER,
        MemberStatus.SUPPORTER,
      );
  });

  it("Should correctly add and remove multiple Ourkivians", async () => {
    const { owner, membershipController, collector, collectorTwo } =
      await loadFixture(beforeEachFixture);

    const newOurkivians = [collector.address, collectorTwo.address];

    // Add multiple Ourkivians
    await addOurkivians(membershipController, { newOurkivians }, owner);

    let ourkivians = await membershipController.getOurkivians();
    expect(ourkivians).to.eql(newOurkivians);
    expect(
      await isMemberOurkivian(
        membershipController,
        { member: collector.address },
        collector,
      ),
    ).to.be.true;
    expect(
      await isMemberOurkivian(
        membershipController,
        { member: collectorTwo.address },
        collectorTwo,
      ),
    ).to.be.true;

    // Remove all Ourkivians
    await membershipController.removeAllOurkivians();
    ourkivians = await membershipController.getOurkivians();
    expect(ourkivians).to.have.lengthOf(0);
    expect(
      await isMemberOurkivian(
        membershipController,
        { member: collector.address },
        collector,
      ),
    ).to.be.false;
    expect(
      await isMemberOurkivian(
        membershipController,
        { member: collectorTwo.address },
        collectorTwo,
      ),
    ).to.be.false;
  });
});
