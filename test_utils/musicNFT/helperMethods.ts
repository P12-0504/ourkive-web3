import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { OurkiveMusicTokenV2, OurkiveMusicTokenV3 } from "../../typechain";
import { expect } from "chai";
import { Contract } from "ethers";
import { MemberStatus } from "../member/OurkiveMembershipControllerUpgradeable";

export async function checkOwnerOf(
  ourkiveMusicToken: OurkiveMusicTokenV2 | OurkiveMusicTokenV3,
  expectedOwner: HardhatEthersSigner,
) {
  const NFTOwnerAddress = await ourkiveMusicToken.ownerOf(0);
  expect(NFTOwnerAddress).to.equal(expectedOwner.address);
}

export async function checkBalanceOf(
  usdc: Contract,
  recipientAddr: string,
  expectedAmount: bigint | number,
) {
  const collectorUSDCBalance = await usdc.balanceOf(recipientAddr);
  expect(collectorUSDCBalance).to.equal(expectedAmount);
}

export async function checkIsApprovedForAll(
  nft: OurkiveMusicTokenV2 | OurkiveMusicTokenV3,
  owner: string,
  operator: string,
  expectedResult: boolean,
) {
  const isMarketplaceApproved = await nft.isApprovedForAll(owner, operator);
  expect(isMarketplaceApproved).to.equal(expectedResult);
}
