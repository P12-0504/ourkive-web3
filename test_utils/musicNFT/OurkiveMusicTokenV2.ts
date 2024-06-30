import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";
import connectMethodToCaller from "../connectMethodToCaller";

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
