import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";
import { expect } from "chai";
import connectMethodToCaller from "../connectMethodToCaller";
import { OurkiveMusicTokenV2, OurkiveMusicTokenV3 } from "../../typechain";

/*****************************/
/*          Mutators         */
/*****************************/

type SetArtistAddressParams = {
  artist: string;
};

export async function setArtistAddress(
  musicToken: Contract,
  { artist }: SetArtistAddressParams,
  caller: HardhatEthersSigner,
) {
  const args = [artist];
  const tx = await connectMethodToCaller(
    musicToken,
    caller,
    "setArtistAddress",
  )(...args);
  await tx.wait();
  return tx;
}

type SetRoyaltyParams = {
  tokenId: number;
  royaltyRecipient: string;
  royaltyBps: number;
};

export async function setRoyalty(
  musicToken: Contract,
  { tokenId, royaltyRecipient, royaltyBps }: SetRoyaltyParams,
  caller: HardhatEthersSigner,
) {
  const args = [tokenId, royaltyRecipient, royaltyBps];
  const tx = await connectMethodToCaller(
    musicToken,
    caller,
    "setRoyalty",
  )(...args);
  await tx.wait();
  return tx;
}

type SafeMintAndApprovalForAllParams = {
  to: string;
  tokenId: number;
  uri: string;
  marketplaceAddress: string;
};

export async function safeMintAndApprovalForAll(
  musicToken: Contract,
  { to, tokenId, uri, marketplaceAddress }: SafeMintAndApprovalForAllParams,
  caller: HardhatEthersSigner,
) {
  const args = [to, tokenId, uri, marketplaceAddress];
  const tx = await connectMethodToCaller(
    musicToken,
    caller,
    "safeMintAndApprovalForAll",
  )(...args);
  await tx.wait();
  return tx;
}

type SetApprovalForAllParams = {
  operator: string;
  approved: boolean;
};

export async function setApprovalForAll(
  musicToken: Contract,
  { operator, approved }: SetApprovalForAllParams,
  caller: HardhatEthersSigner,
) {
  const args = [operator, approved];
  const tx = await connectMethodToCaller(
    musicToken,
    caller,
    "setApprovalForAll",
  )(...args);
  await tx.wait();
  return tx;
}

/*****************************/
/*          Getters          */
/*****************************/

type BalanceOfParams = {
  owner: string;
};

export async function balanceOf(
  musicToken: Contract,
  { owner }: BalanceOfParams,
  caller: HardhatEthersSigner,
) {
  const args = [owner];
  const tokenOwner = await connectMethodToCaller(
    musicToken,
    caller,
    "balanceOf",
  )(...args);
  return tokenOwner;
}

type IsApprovedForAllParams = {
  owner: string;
  operator: string;
};

export async function isApprovedForAll(
  musicToken: Contract,
  { owner, operator }: IsApprovedForAllParams,
  caller: HardhatEthersSigner,
) {
  const args = [owner, operator];
  const tokenOwner = await connectMethodToCaller(
    musicToken,
    caller,
    "isApprovedForAll",
  )(...args);
  return tokenOwner;
}

type RoyaltyInfoParams = {
  tokenId: number;
  salePrice: number;
};

export async function royaltyInfo(
  musicToken: Contract,
  { tokenId, salePrice }: RoyaltyInfoParams,
  caller: HardhatEthersSigner,
) {
  const args = [tokenId, salePrice];
  const royaltyInfo = await connectMethodToCaller(
    musicToken,
    caller,
    "royaltyInfo",
  )(...args);
  return royaltyInfo;
}

/*****************************/
/*       Helper Methods      */
/*****************************/
