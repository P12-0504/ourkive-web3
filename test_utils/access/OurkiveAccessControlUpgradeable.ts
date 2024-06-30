import { Contract } from "ethers";

type GetRoleMemberCountArgs = {
  role: string;
};

export async function getRoleMemberCount(
  accessControl: Contract,
  { role }: GetRoleMemberCountArgs
) {
  const args = [role];
  return await accessControl.getRoleMemberCount(...args);
}

type GetRoleMemberArgs = {
  role: string;
  index: number;
};

export async function getRoleMember(
  accessControl: Contract,
  { role, index }: GetRoleMemberArgs
) {
  const args = [role, index];
  return await accessControl.getRoleMember(...args);
}

type GetRoleAdminArgs = {
  role: string;
};

export async function getRoleAdmin(
  accessControl: Contract,
  { role }: GetRoleAdminArgs
) {
  const args = [role];
  return await accessControl.getRoleAdmin(...args);
}

type IsCallerOurkiveEOAArgs = {
  address: string;
};

export async function isCallerOurkiveEOA(
  accessControl: Contract,
  { address }: IsCallerOurkiveEOAArgs
) {
  const args = [address];
  return await accessControl.isCallerOurkiveEOA(...args);
}

type IsCallerKillswitchArgs = {
  address: string;
};

export async function isCallerKillswitch(
  accessControl: Contract,
  { address }: IsCallerKillswitchArgs
) {
  const args = [address];
  return await accessControl.isCallerKillswitch(...args);
}

type IsCallerMembershipControllerAuthorized = {
  address: string;
};

export async function isCallerMembershipControllerAuthorized(
  accessControl: Contract,
  { address }: IsCallerMembershipControllerAuthorized
) {
  const args = [address];
  return await accessControl.isCallerMembershipControllerAuthorized(...args);
}

type IsCallerNFTMarketplaceAuthorized = {
  address: string;
};

export async function isCallerNFTMarketplaceAuthorized(
  accessControl: Contract,
  { address }: IsCallerNFTMarketplaceAuthorized
) {
  const args = [address];
  return await accessControl.isCallerNFTMarketplaceAuthorized(...args);
}

type InsertToAdminRole = {
  admin: string;
};

export async function insertToAdminRole(
  accessControl: Contract,
  { admin }: InsertToAdminRole
) {
  const args = [admin];
  const tx = await accessControl.insertToAdminRole(...args);
  await tx.wait();
  return tx;
}

type InsertToKillswitchRole = {
  address: string;
};

export async function insertToKillswitchRole(
  accessControl: Contract,
  { address }: InsertToKillswitchRole
) {
  const args = [address];
  const tx = await accessControl.insertToKillswitchRole(...args);
  await tx.wait();
  return tx;
}

type InsertToMembershipControllerAuthorizedRole = {
  address: string;
};

export async function insertToMembershipControllerAuthorizedRole(
  accessControl: Contract,
  { address }: InsertToMembershipControllerAuthorizedRole
) {
  const args = [address];
  const tx = await accessControl.insertToMembershipControllerAuthorizedRole(
    ...args
  );
  await tx.wait();
  return tx;
}

type InsertToNFTMarketplaceAuthorizedRole = {
  address: string;
};

export async function insertToNFTMarketplaceAuthorizedRole(
  accessControl: Contract,
  { address }: InsertToNFTMarketplaceAuthorizedRole
) {
  const args = [address];
  const tx = await accessControl.insertToNFTMarketplaceAuthorizedRole(...args);
  await tx.wait();
  return tx;
}

type RenounceRoleArgs = {
  role: string;
  account: string;
};

export async function renounceRole(
  accessControl: Contract,
  { role, account }: RenounceRoleArgs
) {
  const args = [role, account];
  const tx = await accessControl.renounceRole(...args);
  await tx.wait();
  return tx;
}

type RevokeRoleArgs = {
  role: string;
  account: string;
};

export async function revokeRole(
  accessControl: Contract,
  { role, account }: RevokeRoleArgs
) {
  const args = [role, account];
  const tx = await accessControl.revokeRole(...args);
  await tx.wait();
  return tx;
}
