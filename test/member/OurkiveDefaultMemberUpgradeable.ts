import { ethers } from "hardhat";
import { expect } from "chai";
import { deployOurkiveDefaultMemberUpgradeable } from "../../test_utils/deployFixtures";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  DEFAULT_COLLECTOR_FEE_DISCOUNT_BASIS_POINT,
  getCollectorFee,
  getNFTBuyerPrice,
} from "../../test_utils/member/OurkiveMemberUpgradeable";

describe("OurkiveDefaultMemberUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner] = await ethers.getSigners();

    const { defaultMemberContract } =
      await deployOurkiveDefaultMemberUpgradeable();

    return { owner, defaultMemberContract };
  };

  it("Should have all methods properly working", async () => {
    const { defaultMemberContract } = await loadFixture(beforeEachFixture);

    // Member Status
    const memberStatus = await defaultMemberContract.getMemberStatus();
    expect(memberStatus).to.equal("DEFAULT_MEMBER");

    // Collector Fee Discount Basis Point
    const collectorFeeDiscountBasisPoint =
      await defaultMemberContract.getCollectorFeeBasisPoint();
    expect(collectorFeeDiscountBasisPoint).to.equal(
      DEFAULT_COLLECTOR_FEE_DISCOUNT_BASIS_POINT
    );

    // Collector Fee Amount
    const collectorFeeAmount = await getCollectorFee(defaultMemberContract, {
      nftPrice: ethers.parseUnits("1", 6),
    });
    expect(collectorFeeAmount).to.equal(ethers.parseUnits("0.03", 6));

    // Collector Fee Amount
    const buyerPrice = await getNFTBuyerPrice(defaultMemberContract, {
      nftPrice: ethers.parseUnits("1", 6),
    });
    expect(buyerPrice).to.equal(ethers.parseUnits("1.03", 6));
  });
});
