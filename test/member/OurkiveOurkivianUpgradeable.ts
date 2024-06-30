import { ethers } from "hardhat";
import { expect } from "chai";
import { deployOurkiveOurkivianUpgradeable } from "../../test_utils/deployFixtures";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
	DEFAULT_COLLECTOR_FEE_DISCOUNT_BASIS_POINT,
	getCollectorFee,
	getNFTBuyerPrice,
} from "../../test_utils/member/OurkiveMemberUpgradeable";

describe("OurkiveOurkivianUpgradeable", () => {
	const beforeEachFixture = async () => {
		const [owner] = await ethers.getSigners();

		const { ourkivianContract } = await deployOurkiveOurkivianUpgradeable();

		return { owner, ourkivianContract };
	};

	it("Should have all methods properly working", async () => {
		const { ourkivianContract } = await loadFixture(beforeEachFixture);

		// Member Status
		const memberStatus = await ourkivianContract.getMemberStatus();
		expect(memberStatus).to.equal("OURKIVIAN");

		// Collector Fee Discount Basis Point
		const collectorFeeDiscountBasisPoint =
			await ourkivianContract.getCollectorFeeBasisPoint();
		expect(collectorFeeDiscountBasisPoint).to.equal(
			DEFAULT_COLLECTOR_FEE_DISCOUNT_BASIS_POINT
		);

		// Collector Fee Amount
		const collectorFeeAmount = await getCollectorFee(ourkivianContract, {
			nftPrice: ethers.parseUnits("1", 6),
		});
		expect(collectorFeeAmount).to.equal(ethers.parseUnits("0.03", 6));

		// Collector Fee Amount
		const buyerPrice = await getNFTBuyerPrice(ourkivianContract, {
			nftPrice: ethers.parseUnits("1", 6),
		});
		expect(buyerPrice).to.equal(ethers.parseUnits("1.03", 6));
	});
});
