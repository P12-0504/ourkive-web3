import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, ContractTransactionReceipt, Log, Signature } from "ethers";
import connectMethodToCaller from "../connectMethodToCaller";
import { ethers } from "hardhat";
import {
  OurkiveMusicTokenV2,
  OurkiveMusicTokenV2__factory,
  OurkiveMusicTokenV3,
  OurkiveNFTMarketplaceUpgradeable,
} from "../../typechain";
import marketplaceJson from "../../artifacts/contracts/marketplace/IOurkiveNFTMarketplaceUpgradeable.sol/IOurkiveNFTMarketplaceUpgradeable.json";
import {
  insertToMembershipControllerAuthorizedRole,
  insertToNFTMarketplaceAuthorizedRole,
} from "../access/OurkiveAccessControlUpgradeable";
import { DEFAULT_ARTIST_ROYALTY_BASIS_POINTS } from "../constants";
import {
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveKillswitchUpgradeable,
  deployOurkiveMemberStatus,
  deployOurkiveMembershipControllerUpgradeable,
  deployMockUSDCWithPermit,
  deployOurkiveNFTMarketplaceUpgradeable,
  deployOurkiveArtistRoyaltyStorageUpgradeable,
  deployOurkiveArtistRoyaltyControllerUpgradeable,
  deployOurkivePaymentStorageUpgradeable,
  deployOurkivePaymentControllerUpgradeable,
  deployOurkiveNFTDataStorageUpgradeable,
  deployOurkiveNFTMarketplaceReentrancyGuardUpgradeable,
  deployOurkiveCollectorRoyaltyStorageUpgradeable,
  deployOurkiveCollectorRoyaltyControllerUpgradeable,
  deployOurkiveMusicTokenV3,
  deployOurkiveCollectorTokenV2Upgradeable,
  deployOurkiveNFTAllowlistUpgradeable,
} from "../deployFixtures";
import {
  setDefaultMemberContract,
  setSupporterContract,
  setPatronContract,
  setOurkivianContract,
} from "../member/OurkiveMembershipControllerUpgradeable";

export type Payee = {
  walletAddress: string;
  percent: number | bigint;
  amount: number | bigint;
};

export async function setupOurkiveNFTMarketplace(
  owner: HardhatEthersSigner,
  artist: HardhatEthersSigner,
  collectors: HardhatEthersSigner[],
  tokenLimit: number,
) {
  const { accessControl } = await deployOurkiveAccessControlUpgradeable();
  const { killswitch } =
    await deployOurkiveKillswitchUpgradeable(accessControl);
  const {
    supporterContract,
    defaultMemberContract,
    patronContract,
    ourkivianContract,
  } = await deployOurkiveMemberStatus();
  const { membershipController } =
    await deployOurkiveMembershipControllerUpgradeable(
      accessControl,
      killswitch,
    );

  const adminRole = await accessControl.ADMIN_ROLE();
  const membershipControllerAuthorizedRole =
    await accessControl.MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE();
  const nftMarketplaceAuthorizedRole =
    await accessControl.NFT_MARKETPLACE_AUTHORIZED_ROLE();

  // Assign EOA + contract addresses to the
  // membership controller + NFT marketplace
  await insertToMembershipControllerAuthorizedRole(accessControl, {
    address: owner.address,
  });
  await insertToNFTMarketplaceAuthorizedRole(accessControl, {
    address: owner.address,
  });
  await insertToMembershipControllerAuthorizedRole(accessControl, {
    address: await killswitch.getAddress(),
  });
  await insertToNFTMarketplaceAuthorizedRole(accessControl, {
    address: await killswitch.getAddress(),
  });

  await setDefaultMemberContract(
    membershipController,
    { address: await defaultMemberContract.getAddress() },
    owner,
  );
  await setSupporterContract(
    membershipController,
    { address: await supporterContract.getAddress() },
    owner,
  );
  await setPatronContract(
    membershipController,
    { address: await patronContract.getAddress() },
    owner,
  );
  await setOurkivianContract(
    membershipController,
    { address: await ourkivianContract.getAddress() },
    owner,
  );

  // Deploy the mock USDC contract
  const { mockUsdc } = await deployMockUSDCWithPermit();

  // Mint 1000000 to the collectors
  const initialSupplyStr = "1000000000";
  const initialSupply = ethers.parseUnits(initialSupplyStr, 6);
  for (let i = 0; i < collectors.length; i++) {
    await mockUsdc.connect(collectors[i]).getFunction("mint")(initialSupply);
  }

  const kive = await ethers.deployContract("OurkiveCollectorToken");
  await kive.waitForDeployment();

  const { kive: kiveV2 } = await deployOurkiveCollectorTokenV2Upgradeable();

  await kiveV2.setTokenLimit(tokenLimit);

  const { marketplace } = await deployOurkiveNFTMarketplaceUpgradeable(
    owner,
    killswitch,
    mockUsdc,
    membershipController,
    accessControl,
    kive,
  );

  const { artistRoyaltyStorage } =
    await deployOurkiveArtistRoyaltyStorageUpgradeable(
      accessControl,
      killswitch,
    );
  const { artistRoyaltyController } =
    await deployOurkiveArtistRoyaltyControllerUpgradeable(
      accessControl,
      killswitch,
      artistRoyaltyStorage,
    );
  const { paymentStorage } = await deployOurkivePaymentStorageUpgradeable(
    accessControl,
    killswitch,
    mockUsdc,
  );
  const { paymentController } = await deployOurkivePaymentControllerUpgradeable(
    accessControl,
    killswitch,
    paymentStorage,
  );
  const { nftDataStorage } = await deployOurkiveNFTDataStorageUpgradeable(
    accessControl,
    killswitch,
  );
  const { reentrancyGuard } =
    await deployOurkiveNFTMarketplaceReentrancyGuardUpgradeable(accessControl);
  const { collectorRoyaltyStorage } =
    await deployOurkiveCollectorRoyaltyStorageUpgradeable(
      accessControl,
      killswitch,
    );
  const { collectorRoyaltyController } =
    await deployOurkiveCollectorRoyaltyControllerUpgradeable(
      accessControl,
      killswitch,
      collectorRoyaltyStorage,
    );
  const { nftAllowlist } = await deployOurkiveNFTAllowlistUpgradeable(
    accessControl,
    killswitch,
  );

  await marketplace.setPaymentController(await paymentController.getAddress());
  await marketplace.setArtistRoyaltyController(
    await artistRoyaltyController.getAddress(),
  );
  await marketplace.setNFTDataStorage(await nftDataStorage.getAddress());
  await marketplace.setReentrancyGuard(await reentrancyGuard.getAddress());
  await marketplace.setCollectorRoyaltyController(
    await collectorRoyaltyController.getAddress(),
  );
  await marketplace.setOurkiveEOA(owner.address);
  await marketplace.setNFTAllowlist(await nftAllowlist.getAddress());
  await marketplace.setMinUsdcForPrimarySaleListing(ethers.parseUnits("1", 6));
  const commissionBps = 2000n;
  await marketplace.setCommissionBps(commissionBps);

  // Set authorized entities for each contract
  await accessControl.insertToArtistRoyaltyStorageAuthorizedRole(owner.address);
  await accessControl.insertToArtistRoyaltyControllerAuthorizedRole(
    owner.address,
  );
  await accessControl.insertToNFTDataStorageAuthorizedRole(owner.address);
  await accessControl.insertToPaymentStorageAuthorizedRole(owner.address);
  await accessControl.insertToPaymentControllerAuthorizedRole(owner.address);
  await accessControl.insertToNFTMarketplaceReentrancyGuardAuthorizedRole(
    owner.address,
  );
  await accessControl.insertToCollectorRoyaltyStorageAuthorizedRole(
    owner.address,
  );
  await accessControl.insertToCollectorRoyaltyControllerAuthorizedRole(
    owner.address,
  );
  await accessControl.insertToNFTAllowlistAuthorizedRole(owner.address);

  await accessControl.insertToArtistRoyaltyStorageAuthorizedRole(
    await artistRoyaltyController.getAddress(),
  );
  await accessControl.insertToArtistRoyaltyControllerAuthorizedRole(
    await marketplace.getAddress(),
  );
  await accessControl.insertToNFTDataStorageAuthorizedRole(
    await marketplace.getAddress(),
  );
  await accessControl.insertToPaymentStorageAuthorizedRole(
    await paymentController.getAddress(),
  );
  await accessControl.insertToPaymentControllerAuthorizedRole(
    await marketplace.getAddress(),
  );
  await accessControl.insertToNFTMarketplaceReentrancyGuardAuthorizedRole(
    await marketplace.getAddress(),
  );
  await accessControl.insertToCollectorRoyaltyStorageAuthorizedRole(
    await collectorRoyaltyController.getAddress(),
  );
  await accessControl.insertToCollectorRoyaltyControllerAuthorizedRole(
    await marketplace.getAddress(),
  );
  await accessControl.insertToMembershipControllerAuthorizedRole(
    await marketplace.getAddress(),
  );

  const ourkiveMusicToken = await new OurkiveMusicTokenV2__factory(
    owner,
  ).deploy("OurkiveMusicTokenV2", "MUSIC");
  await ourkiveMusicToken.waitForDeployment();

  const ourkiveMusicTokenTwo = await new OurkiveMusicTokenV2__factory(
    owner,
  ).deploy("OurkiveMusicTokenV2", "MUSIC");
  await ourkiveMusicToken.waitForDeployment();

  const { ourkiveMusicTokenV3 } = await deployOurkiveMusicTokenV3(
    owner,
    artist.address,
    DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
  );
  const { ourkiveMusicTokenV3: ourkiveMusicTokenV3Two } =
    await deployOurkiveMusicTokenV3(
      owner,
      artist.address,
      DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
    );

  const nftPrice = ethers.parseUnits("1000", 6);

  await nftAllowlist.allowlistNFT(await ourkiveMusicToken.getAddress(), 0);
  await nftAllowlist.allowlistNFT(await ourkiveMusicTokenTwo.getAddress(), 0);
  await nftAllowlist.allowlistNFT(await ourkiveMusicTokenV3.getAddress(), 0);
  await nftAllowlist.allowlistNFT(await ourkiveMusicTokenV3Two.getAddress(), 0);

  return {
    ourkiveMusicToken,
    ourkiveMusicTokenTwo,
    ourkiveMusicTokenV3,
    ourkiveMusicTokenV3Two,
    owner,
    marketplace,
    artist,
    initialSupply,
    nftPrice,
    mockUsdc,
    membershipController,
    adminRole,
    membershipControllerAuthorizedRole,
    nftMarketplaceAuthorizedRole,
    paymentController,
    artistRoyaltyStorage,
    artistRoyaltyController,
    collectorRoyaltyController,
    collectors,
    kive,
    kiveV2,
    nftAllowlist,
    commissionBps,
  };
}

/*****************************/
/*          Mutators         */
/*****************************/

type SetOurkiveEOAParams = {
  ourkiveEOA: string;
};

export async function setOurkiveEOA(
  marketplace: Contract,
  { ourkiveEOA }: SetOurkiveEOAParams,
  caller: HardhatEthersSigner,
) {
  const args = [ourkiveEOA];
  const tx = await connectMethodToCaller(
    marketplace,
    caller,
    "setOurkiveEOA",
  )(...args);
  return tx;
}

type SetUSDCTokenParams = {
  usdcToken: string;
  usdcTokenPermit: string;
};

export async function setUSDCToken(
  marketplace: Contract,
  { usdcToken, usdcTokenPermit }: SetUSDCTokenParams,
  caller: HardhatEthersSigner,
) {
  const args = [usdcToken, usdcTokenPermit];
  const tx = await connectMethodToCaller(
    marketplace,
    caller,
    "setUSDCToken",
  )(...args);
  return tx;
}

type SetMembershipControllerParams = {
  kiveToken: string;
};

export async function setMembershipController(
  marketplace: Contract,
  { membershipController }: SetKiveTokenParams,
  caller: HardhatEthersSigner,
) {
  const args = [membershipController];
  const tx = await connectMethodToCaller(
    marketplace,
    caller,
    "setMembershipController",
  )(...args);
  return tx;
}

type SetKiveTokenParams = {
  membershipController: string;
};

export async function setKiveToken(
  marketplace: Contract,
  { kiveToken }: SetMembershipControllerParams,
  caller: HardhatEthersSigner,
) {
  const args = [kiveToken];
  const tx = await connectMethodToCaller(
    marketplace,
    caller,
    "setKiveToken",
  )(...args);
  return tx;
}

type SetMinUsdcForPromotionParams = {
  minUsdcForPromotion: bigint;
};

export async function setMinUsdcForPromotion(
  marketplace: Contract,
  { minUsdcForPromotion }: SetMinUsdcForPromotionParams,
  caller: HardhatEthersSigner,
) {
  const args = [minUsdcForPromotion];
  const tx = await connectMethodToCaller(
    marketplace,
    caller,
    "setMinUsdcForPromotion",
  )(...args);
  return tx;
}

type DelistNFTParams = {
  nftParam: string;
  tokenId: number;
};

export async function delistNFT(
  marketplace: Contract,
  { nftParam, tokenId }: DelistNFTParams,
  caller: HardhatEthersSigner,
) {
  const args = [nftParam, tokenId];
  const tx = await connectMethodToCaller(
    marketplace,
    caller,
    "delistNFT",
  )(...args);
  await tx.wait();
  return tx;
}

type SetBuyerParams = {
  nftParam: string;
  tokenId: number;
  buyer: string;
};

export async function setBuyer(
  marketplace: Contract,
  { nftParam, tokenId, buyer }: SetBuyerParams,
  caller: HardhatEthersSigner,
) {
  const args = [nftParam, tokenId, buyer];
  const tx = await connectMethodToCaller(
    marketplace,
    caller,
    "setBuyer",
  )(...args);
  await tx.wait();
  return tx;
}

/*****************************/
/*          Getters          */
/*****************************/

/*****************************/
/*       Helper Methods      */
/*****************************/

type PrepareBuyListedNFTParams = {
  mockUsdc: Contract;
  spender: OurkiveNFTMarketplaceUpgradeable;
};

export const prepareBuyListedNFTParams = async (
  mockUsdc: Contract,
  usdcOwner: HardhatEthersSigner,
  spender: OurkiveNFTMarketplaceUpgradeable,
  nftPrice: bigint,
) => {
  // Prepare params of buyListedNFT
  const nonce = Number(await mockUsdc.nonces(usdcOwner.address));
  const deadline = Math.floor(Date.now() / 1000) + 3600; // Plus 1 hour
  const signature = await usdcOwner.signTypedData(
    {
      name: "Mock USDC",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await mockUsdc.getAddress(),
    },
    {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    {
      owner: usdcOwner.address,
      spender: await spender.getAddress(),
      value: nftPrice,
      nonce,
      deadline,
    },
  );
  const { v, r, s } = ethers.Signature.from(signature);

  return { deadline, v, r, s };
};

export const mintAndApprove = async (
  musicToken: OurkiveMusicTokenV2 | OurkiveMusicTokenV3,
  artist: HardhatEthersSigner,
  marketplaceAddress: string,
) => {
  // Mint token to artist
  await musicToken.setArtistAddress(artist.address);
  await musicToken
    .connect(artist)
    .safeMintAndApprovalForAll(
      artist.address,
      0,
      "https://example.com/token/0",
      marketplaceAddress,
    );
};

type ListNFTParams = {
  nftAddress: string;
  tokenId: number;
  nftPrice: number | bigint;
  seller: string;
  buyer: string;
  payees: {
    walletAddress: string;
    percent: number | bigint;
    amount: number | bigint;
  }[];
  isPrivate: boolean;
};

type GetNFTListingParams = {
  nftAddress: string;
  tokenId: number;
};

type BuyListedNFTParams = {
  nftAddress: string;
  tokenId: number;
  deadline: number;
} & Pick<ReturnType<typeof Signature.from>, "v" | "r" | "s">;

export async function listNFTAndCheck(
  marketplace: OurkiveNFTMarketplaceUpgradeable,
  listNFTParams: ListNFTParams,
  expectedNFTListingPrice: bigint | number,
) {
  const { nftAddress, tokenId, nftPrice, seller, buyer, payees, isPrivate } =
    listNFTParams;
  await marketplace.listNFT(
    nftAddress,
    tokenId,
    nftPrice,
    seller,
    buyer,
    payees,
    isPrivate,
  );

  const nftListing = await marketplace.getNFTListing(nftAddress, tokenId);
  expect(nftListing.price).to.equal(expectedNFTListingPrice);
}

type GetNFTBuyerPriceParams = {
  buyer: HardhatEthersSigner;
  nftPrice: number | bigint;
};

export async function prepareAndBuyListedNFT(
  marketplace: OurkiveNFTMarketplaceUpgradeable,
  membershipController: Contract,
  getNFTBuyerPriceParams: GetNFTBuyerPriceParams,
  prepareBuyListedNFTParamsParams: PrepareBuyListedNFTParams,
  nftAddress: string,
  tokenId: number,
  artistAddress: string,
  artistRoyaltyAmount: number | bigint,
  collectorRoyaltyPayees: Payee[],
  platformAddress: string,
  platformFee: number | bigint,
) {
  const collectorRoyalties = collectorRoyaltyPayees.map(
    ({ walletAddress, percent, amount }) => [
      walletAddress,
      BigInt(percent),
      amount,
    ],
  );
  const { buyer, nftPrice } = getNFTBuyerPriceParams;
  const newNftPrice = await membershipController.getNFTBuyerPrice(
    buyer.address,
    nftPrice,
  );

  const { mockUsdc, spender } = prepareBuyListedNFTParamsParams;
  await mockUsdc.connect(buyer).getFunction("approve")(spender, newNftPrice);

  const tx = await marketplace.connect(buyer).buyListedNFT(nftAddress, tokenId);
  const receipt = await tx.wait();

  _checkEventsAfterPurchase(
    nftAddress,
    tokenId,
    artistAddress,
    artistRoyaltyAmount,
    collectorRoyalties,
    receipt,
    platformAddress,
    platformFee,
  );

  return { newNftPrice };
}

function _checkEventsAfterPurchase(
  nftAddress: string,
  tokenId: number,
  artistAddress: string,
  artistRoyaltyAmount: number | bigint,
  collectorRoyalties: (string | number | bigint)[][],
  receipt: ContractTransactionReceipt | null,
  platformAddress: string,
  platformFee: number | bigint,
) {
  if (receipt == null) {
    throw new Error("No receipt");
  }

  const marketplaceAbi = marketplaceJson["abi"];

  const iface = new ethers.Interface(marketplaceAbi);

  let collectorRoyaltiesEvent;
  let artistRoyaltyEvent;
  let platformFeeEvent;

  for (const log of receipt.logs) {
    try {
      const parsedLog = iface.parseLog(log as any);
      if (parsedLog?.name === "CollectorRoyalties") {
        collectorRoyaltiesEvent = parsedLog;
      } else if (parsedLog?.name === "ArtistRoyalty") {
        artistRoyaltyEvent = parsedLog;
      } else if (parsedLog?.name === "PlatformFee") {
        platformFeeEvent = parsedLog;
      }
    } catch (error) {
      // Skip logs that don't belong to our events
    }
  }

  if (!collectorRoyaltiesEvent) {
    throw new Error("CollectorRoyalties event not found");
  }

  if (!artistRoyaltyEvent) {
    throw new Error("ArtistRoyalty event not found");
  }

  if (!platformFeeEvent) {
    throw new Error("PlatformFee event not found");
  }

  const actualCollectorRoyalties = collectorRoyaltiesEvent.args[2];
  _checkCollectorRoyaltiesArgs(actualCollectorRoyalties, collectorRoyalties);

  _checkArtistRoyaltyArgs(artistRoyaltyEvent.args, [
    nftAddress,
    tokenId,
    artistAddress,
    artistRoyaltyAmount,
  ]);

  _checkPlatformFeeArgs(platformFeeEvent.args, [
    nftAddress,
    tokenId,
    platformAddress,
    platformFee,
  ]);
}

function _checkCollectorRoyaltiesArgs(
  actualCollectorRoyalties: (string | number | bigint)[][],
  collectorRoyalties: (string | number | bigint)[][],
) {
  for (let i = 0; i < actualCollectorRoyalties.length; i++) {
    for (let j = 0; j < actualCollectorRoyalties[i].length; j++) {
      expect(actualCollectorRoyalties[i][j]).to.equal(collectorRoyalties[i][j]);
    }
  }
}

function _checkArtistRoyaltyArgs(
  artistRoyaltyEventArgs: (string | number | bigint)[],
  expectedResult: (string | number | bigint)[],
) {
  for (let i = 0; i < artistRoyaltyEventArgs.length; i++) {
    expect(artistRoyaltyEventArgs[i]).to.equal(expectedResult[i]);
  }
}

function _checkPlatformFeeArgs(
  platformFeeEventArgs: (string | number | bigint)[],
  expectedResult: (string | number | bigint)[],
) {
  for (let i = 0; i < platformFeeEventArgs.length; i++) {
    expect(platformFeeEventArgs[i]).to.equal(expectedResult[i]);
  }
}

type ListAndPurchaseNFT = {
  marketplace: OurkiveNFTMarketplaceUpgradeable;
  nftAddress: string;
  tokenId: number;
  nftPrice: bigint | number;
  seller: HardhatEthersSigner;
  payees: Payee[];
  isPrivate: boolean;
  membershipController: Contract;
  buyer: HardhatEthersSigner;
  mockUsdc: Contract;
  artistRoyaltyAddress: string;
  artistRoyaltyAmount: number | bigint;
  collectorRoyaltyPayees: Payee[];
  platformAddress: string;
  platformFee: number | bigint;
};

export async function listAndPurchaseNFT({
  marketplace,
  nftAddress,
  tokenId,
  nftPrice,
  seller,
  payees,
  isPrivate,
  membershipController,
  buyer,
  mockUsdc,
  artistRoyaltyAddress,
  artistRoyaltyAmount,
  collectorRoyaltyPayees,
  platformAddress,
  platformFee,
}: ListAndPurchaseNFT) {
  await listNFTAndCheck(
    marketplace,
    {
      nftAddress,
      tokenId,
      nftPrice,
      seller: seller.address,
      buyer: ethers.ZeroAddress,
      payees,
      isPrivate,
    },
    isPrivate ? 0 : nftPrice,
  );

  if (isPrivate) {
    await marketplace.setBuyer(nftAddress, tokenId, buyer.address);
  }

  const { newNftPrice } = await prepareAndBuyListedNFT(
    marketplace,
    membershipController,
    { buyer, nftPrice },
    { mockUsdc, spender: marketplace },
    nftAddress,
    0,
    artistRoyaltyAddress,
    artistRoyaltyAmount,
    collectorRoyaltyPayees,
    platformAddress,
    platformFee,
  );

  return { nftPrice: newNftPrice };
}
