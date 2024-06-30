import { ethers } from "hardhat";
import { expect } from "chai";
import { deployOurkiveSupporterUpgradeable } from "../../test_utils/deployFixtures";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  DEFAULT_COLLECTOR_FEE_DISCOUNT_BASIS_POINT,
  getCollectorFee,
  getNFTBuyerPrice,
} from "../../test_utils/member/OurkiveMemberUpgradeable";

describe("OurkiveSupporterUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner] = await ethers.getSigners();

    const { supporterContract } = await deployOurkiveSupporterUpgradeable();

    return { owner, supporterContract };
  };

  it("Should have all methods properly working", async () => {
    const { supporterContract } = await loadFixture(beforeEachFixture);

    // Member Status
    const memberStatus = await supporterContract.getMemberStatus();
    expect(memberStatus).to.equal("SUPPORTER");

    // Collector Fee Discount Basis Point
    const collectorFeeDiscountBasisPoint =
      await supporterContract.getCollectorFeeBasisPoint();
    expect(collectorFeeDiscountBasisPoint).to.equal(
      DEFAULT_COLLECTOR_FEE_DISCOUNT_BASIS_POINT
    );

    // Collector Fee Amount
    const collectorFeeAmount = await getCollectorFee(supporterContract, {
      nftPrice: ethers.parseUnits("1", 6),
    });
    expect(collectorFeeAmount).to.equal(ethers.parseUnits("0.03", 6));

    // Collector Fee Amount
    const buyerPrice = await getNFTBuyerPrice(supporterContract, {
      nftPrice: ethers.parseUnits("1", 6),
    });
    expect(buyerPrice).to.equal(ethers.parseUnits("1.03", 6));
  });
});
