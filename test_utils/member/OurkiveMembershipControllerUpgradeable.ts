import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";
import { expect } from "chai";
import connectMethodToCaller from "../connectMethodToCaller";

// Need to be synced with
// the enum on the contract
export enum MemberStatus {
  DEFAULT_MEMBER = 0,
  SUPPORTER = 1,
  PATRON = 2,
}

/*****************************/
/*          Mutators         */
/*****************************/

type SetContractArgs = {
  address: string;
};

type SetDefaultMemberContractArgs = SetContractArgs;

export async function setDefaultMemberContract(
  defaultMemberContract: Contract,
  { address }: SetDefaultMemberContractArgs,
  caller: HardhatEthersSigner,
) {
  const args = [address];
  const tx = await connectMethodToCaller(
    defaultMemberContract,
    caller,
    "setDefaultMemberContract",
  )(...args);
  await tx.wait();
  return tx;
}

type SetSupporterContractArgs = SetContractArgs;

export async function setSupporterContract(
  supporterContract: Contract,
  { address }: SetSupporterContractArgs,
  caller: HardhatEthersSigner,
) {
  const args = [address];
  const tx = await connectMethodToCaller(
    supporterContract,
    caller,
    "setSupporterContract",
  )(...args);
  await tx.wait();
  return tx;
}

type SetPatronContractArgs = SetContractArgs;

export async function setPatronContract(
  patronContract: Contract,
  { address }: SetPatronContractArgs,
  caller: HardhatEthersSigner,
) {
  const args = [address];
  const tx = await connectMethodToCaller(
    patronContract,
    caller,
    "setPatronContract",
  )(...args);
  await tx.wait();
  return tx;
}

type SetOurkivianContractArgs = SetContractArgs;

export async function setOurkivianContract(
  ourkivianContract: Contract,
  { address }: SetOurkivianContractArgs,
  caller: HardhatEthersSigner,
) {
  const args = [address];
  const tx = await connectMethodToCaller(
    ourkivianContract,
    caller,
    "setOurkivianContract",
  )(...args);
  await tx.wait();
  return tx;
}

type SetMemberStatusArgs = {
  member: string;
  memberStatus: MemberStatus;
};

export async function setMemberStatus(
  membershipController: Contract,
  { member, memberStatus }: SetMemberStatusArgs,
  caller: HardhatEthersSigner,
) {
  const args = [member, memberStatus];
  const tx = await connectMethodToCaller(
    membershipController,
    caller,
    "setMemberStatus",
  )(...args);
  await tx.wait();
  return tx;
}

type AddOurkiviansArgs = {
  newOurkivians: string[];
};

export async function addOurkivians(
  membershipController: Contract,
  { newOurkivians }: AddOurkiviansArgs,
  caller: HardhatEthersSigner,
) {
  const args = [newOurkivians];
  const tx = await connectMethodToCaller(
    membershipController,
    caller,
    "addOurkivians",
  )(...args);
  await tx.wait();
  return tx;
}

type SetMemberOurkviainArgs = {
  member: string;
  isOurkivian: boolean;
};

export async function setMemberOurkivian(
  membershipController: Contract,
  { member, isOurkivian }: SetMemberOurkviainArgs,
  caller: HardhatEthersSigner,
) {
  const args = [member, isOurkivian];
  const tx = await connectMethodToCaller(
    membershipController,
    caller,
    "setMemberOurkivian",
  )(...args);
  await tx.wait();
  return tx;
}

/*****************************/
/*          Getters          */
/*****************************/
type IsMemberSpecialUserArgs = {
  member: string;
};

type IsMemberDefaultMemberArgs = {
  member: string;
};

export async function isMemberDefaultMember(
  membershipController: Contract,
  { member }: IsMemberDefaultMemberArgs,
  caller: HardhatEthersSigner,
) {
  const args = [member];
  const memberStatus = await connectMethodToCaller(
    membershipController,
    caller,
    "isMemberDefaultMember",
  )(...args);
  return memberStatus;
}

type IsMemberSupporterArgs = {
  member: string;
};

export async function isMemberSupporter(
  membershipController: Contract,
  { member }: IsMemberSupporterArgs,
  caller: HardhatEthersSigner,
) {
  const args = [member];
  const memberStatus = await connectMethodToCaller(
    membershipController,
    caller,
    "isMemberSupporter",
  )(...args);
  return memberStatus;
}

type IsMemberPatronArgs = {
  member: string;
};

export async function isMemberPatron(
  membershipController: Contract,
  { member }: IsMemberPatronArgs,
  caller: HardhatEthersSigner,
) {
  const args = [member];
  const memberStatus = await connectMethodToCaller(
    membershipController,
    caller,
    "isMemberPatron",
  )(...args);
  return memberStatus;
}

type IsMemberOurkivianArgs = {
  member: string;
};

export async function isMemberOurkivian(
  membershipController: Contract,
  { member }: IsMemberOurkivianArgs,
  caller: HardhatEthersSigner,
) {
  const args = [member];
  const memberStatus = await connectMethodToCaller(
    membershipController,
    caller,
    "isMemberOurkivian",
  )(...args);
  return memberStatus;
}

type GetMemberStatusArgs = {
  member: string;
};

export async function getMemberStatus(
  membershipController: Contract,
  { member }: GetMemberStatusArgs,
  caller: HardhatEthersSigner,
) {
  const args = [member];
  const memberStatus = await connectMethodToCaller(
    membershipController,
    caller,
    "getMemberStatus",
  )(...args);
  return memberStatus;
}

type HasCollectorFeeArgs = {
  member: string;
};

export async function hasCollectorFee(
  membershipController: Contract,
  { member }: HasCollectorFeeArgs,
  caller: HardhatEthersSigner,
) {
  const args = [member];
  const hasCollectorFee = await connectMethodToCaller(
    membershipController,
    caller,
    "hasCollectorFee",
  )(...args);
  return hasCollectorFee;
}

type GetMemberStatusContractArgs = {
  member: string;
};

export async function getMemberStatusContract(
  membershipController: Contract,
  { member }: GetMemberStatusContractArgs,
  caller: HardhatEthersSigner,
) {
  const args = [member];
  const memberStatusContract = await connectMethodToCaller(
    membershipController,
    caller,
    "getMemberStatusContract",
  )(...args);
  return memberStatusContract;
}

type GetCollectorFeeArgs = {
  member: string;
  nftPrice: bigint;
};

export async function getCollectorFee(
  membershipController: Contract,
  { member, nftPrice }: GetCollectorFeeArgs,
  caller: HardhatEthersSigner,
) {
  const args = [member, nftPrice];
  const collectorFee = await connectMethodToCaller(
    membershipController,
    caller,
    "getCollectorFee",
  )(...args);
  return collectorFee;
}

type GetNFTBuyerPriceArgs = {
  buyer: string;
  nftPrice: bigint;
};

export async function getNFTBuyerPrice(
  membershipController: Contract,
  { buyer, nftPrice }: GetNFTBuyerPriceArgs,
  caller: HardhatEthersSigner,
) {
  const args = [buyer, nftPrice];
  const nftBuyerPrice = await connectMethodToCaller(
    membershipController,
    caller,
    "getNFTBuyerPrice",
  )(...args);
  return nftBuyerPrice;
}

export const checkIsMemberOurkivian = async (
  membershipController: Contract,
  collector: HardhatEthersSigner,
  expectedResult: boolean = true,
) => {
  const isOurkivian = await membershipController.isMemberOurkivian(
    collector.address,
  );
  expect(isOurkivian).to.equal(expectedResult);
};

export async function checkGetMemberStatus(
  membershipController: Contract,
  collector: HardhatEthersSigner,
  expectedMemberStatus: MemberStatus,
) {
  const memberStatus = await membershipController.getMemberStatus(
    collector.address,
  );
  expect(memberStatus).to.equal(expectedMemberStatus);
}

export async function checkOurkiviansCount(
  membershipController: Contract,
  expectedOurkiviansCount: number,
) {
  const ourkivians = await membershipController.getOurkivians();
  expect(ourkivians).to.have.lengthOf(expectedOurkiviansCount);
}
