import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";
import { upgrades, ethers } from "hardhat";
import {
  OurkiveMusicTokenV3__factory,
  PaymentControllerReentrancyAttack__factory,
} from "../typechain";
import {
  MockUSDCWithPermit,
  OurkiveAccessControlUpgradeable,
  OurkiveArtistRoyaltyControllerUpgradeable,
  OurkiveArtistRoyaltyStorageUpgradeable,
  OurkiveCollectorRoyaltyControllerUpgradeable,
  OurkiveCollectorRoyaltyStorageUpgradeable,
  OurkiveCollectorTokenV2Upgradeable,
  OurkiveKillswitchUpgradeable,
  OurkiveMusicTokenV4__factory,
  OurkiveNFTAllowlistUpgradeable,
  OurkiveNFTDataStorageUpgradeable,
  OurkiveNFTMarketplaceUpgradeable,
  OurkivePaymentControllerUpgradeable,
  OurkivePaymentStorageUpgradeable,
} from "../typechain";

/*****************************/
/*          Upgrades         */
/*****************************/

export const upgradeOurkiveMembershipControllerUpgradeable = async (
  membershipController: Contract,
) => {
  const MembershipController = await ethers.getContractFactory(
    "OurkiveMembershipControllerUpgradeable",
  );
  const upgradedMembershipController = await upgrades.upgradeProxy(
    await membershipController.getAddress(),
    MembershipController,
    { constructorArgs: [] },
  );
  await upgradedMembershipController.waitForDeployment();

  return { upgradedMembershipController };
};

/*****************************/
/*          Deployers        */
/*****************************/

export const deployOurkiveAccessControlUpgradeable = async () => {
  const AccessControl = await ethers.getContractFactory(
    "OurkiveAccessControlUpgradeable",
  );

  const accessControl = await upgrades.deployProxy(AccessControl, [], {
    initializer: "initialize",
  });
  await accessControl.waitForDeployment();

  return { accessControl };
};

export const deployOurkiveKillswitchUpgradeable = async (
  accessControl: Contract | OurkiveAccessControlUpgradeable,
) => {
  const Killswitch = await ethers.getContractFactory(
    "OurkiveKillswitchUpgradeable",
  );

  const killswitch = await upgrades.deployProxy(
    Killswitch,
    [await accessControl.getAddress()],
    {
      initializer: "initialize",
    },
  );
  await killswitch.waitForDeployment();

  return { killswitch };
};

export const deployOurkiveDefaultMemberUpgradeable = async () => {
  const DefaultMemberContract = await ethers.getContractFactory(
    "OurkiveDefaultMemberUpgradeable",
  );
  const defaultMemberContract = await upgrades.deployProxy(
    DefaultMemberContract,
    [],
    {
      initializer: "initialize",
    },
  );
  await defaultMemberContract.waitForDeployment();
  return { defaultMemberContract };
};

export const deployOurkiveSupporterUpgradeable = async () => {
  const SupporterContract = await ethers.getContractFactory(
    "OurkiveSupporterUpgradeable",
  );
  const supporterContract = await upgrades.deployProxy(SupporterContract, [], {
    initializer: "initialize",
  });
  await supporterContract.waitForDeployment();
  return { supporterContract };
};

export const deployOurkivePatronUpgradeable = async () => {
  const PatronContract = await ethers.getContractFactory(
    "OurkivePatronUpgradeable",
  );
  const patronContract = await upgrades.deployProxy(PatronContract, [], {
    initializer: "initialize",
  });
  await patronContract.waitForDeployment();
  return { patronContract };
};

export const deployOurkiveOurkivianUpgradeable = async () => {
  const OurkivianContract = await ethers.getContractFactory(
    "OurkiveOurkivianUpgradeable",
  );
  const ourkivianContract = await upgrades.deployProxy(OurkivianContract, [], {
    initializer: "initialize",
  });
  await ourkivianContract.waitForDeployment();
  return { ourkivianContract };
};

export const deployOurkiveMemberStatus = async () => {
  const { defaultMemberContract } =
    await deployOurkiveDefaultMemberUpgradeable();
  const { supporterContract } = await deployOurkiveSupporterUpgradeable();
  const { patronContract } = await deployOurkivePatronUpgradeable();
  const { ourkivianContract } = await deployOurkiveOurkivianUpgradeable();

  return {
    defaultMemberContract,
    supporterContract,
    patronContract,
    ourkivianContract,
  };
};

export const deployOurkiveMembershipControllerUpgradeable = async (
  accessControl: Contract,
  killswitch: Contract,
) => {
  const MembershipController = await ethers.getContractFactory(
    "OurkiveMembershipControllerUpgradeable",
  );

  const membershipController = await upgrades.deployProxy(
    MembershipController,
    [await accessControl.getAddress(), await killswitch.getAddress()],
    {
      initializer: "initialize",
    },
  );
  await membershipController.waitForDeployment();

  return { membershipController };
};

export const deployOurkiveNFTMarketplaceUpgradeable = async (
  owner: HardhatEthersSigner,
  killswitch: Contract,
  mockUsdc: Contract,
  memberManager: Contract,
  accessControl: Contract,
  kiveToken: Contract | OurkiveCollectorTokenV2Upgradeable,
) => {
  const Marketplace = await ethers.getContractFactory(
    "OurkiveNFTMarketplaceUpgradeable",
  );

  const usdcAddress = await mockUsdc.getAddress();

  const marketplace = await upgrades.deployProxy(
    Marketplace,
    [
      owner.address,
      await killswitch.getAddress(),
      usdcAddress,
      await memberManager.getAddress(),
      await accessControl.getAddress(),
      await kiveToken.getAddress(),
    ],
    {
      initializer: "initialize",
    },
  );
  await marketplace.waitForDeployment();

  return {
    marketplace: marketplace as unknown as OurkiveNFTMarketplaceUpgradeable,
  };
};

export const deployOurkiveMusicTokenV2 = async () => {
  const ourkiveMusicToken = await ethers.deployContract("OurkiveMusicTokenV2", [
    "OurkiveMusicTokenV2",
    "MUSIC",
  ]);
  await ourkiveMusicToken.waitForDeployment();

  return { ourkiveMusicToken };
};

export const deployOurkiveMusicTokenV3 = async (
  owner: HardhatEthersSigner,
  ...args: Parameters<OurkiveMusicTokenV3__factory["deploy"]> extends [
    infer _,
    infer __,
    ...infer Rest,
  ]
    ? Rest
    : never
) => {
  const [artistAddress, tokenId, royaltyBps] = args;
  const ourkiveMusicTokenV3 = await new OurkiveMusicTokenV3__factory(
    owner,
  ).deploy("OurkiveMusicTokenV3", "MUSIC", artistAddress, tokenId, royaltyBps);
  await ourkiveMusicTokenV3.waitForDeployment();

  return { ourkiveMusicTokenV3 };
};

export const deployOurkiveCollectorToken = async () => {
  const kiveToken = await ethers.deployContract("OurkiveCollectorToken");
  await kiveToken.waitForDeployment();

  return { kiveToken };
};

export const deployMockUSDCWithPermit = async () => {
  const mockUsdc = await ethers.deployContract("MockUSDCWithPermit");
  await mockUsdc.waitForDeployment();

  return { mockUsdc };
};

export const deployOurkiveArtistRoyaltyStorageUpgradeable = async (
  accessControl: Contract | OurkiveAccessControlUpgradeable,
  killswitch: Contract | OurkiveKillswitchUpgradeable,
) => {
  const ArtistRoyaltyStorage = await ethers.getContractFactory(
    "OurkiveArtistRoyaltyStorageUpgradeable",
  );
  const artistRoyaltyStorage = await upgrades.deployProxy(
    ArtistRoyaltyStorage,
    [await accessControl.getAddress(), await killswitch.getAddress()],
    {
      initializer: "initialize",
    },
  );
  await artistRoyaltyStorage.waitForDeployment();

  return {
    artistRoyaltyStorage:
      artistRoyaltyStorage as unknown as OurkiveArtistRoyaltyStorageUpgradeable,
  };
};

export const deployOurkiveArtistRoyaltyControllerUpgradeable = async (
  accessControl: Contract,
  killswitch: Contract,
  artistRoyaltyStorage: OurkiveArtistRoyaltyStorageUpgradeable,
) => {
  const ArtistRoyaltyController = await ethers.getContractFactory(
    "OurkiveArtistRoyaltyControllerUpgradeable",
  );
  const artistRoyaltyController = await upgrades.deployProxy(
    ArtistRoyaltyController,
    [
      await accessControl.getAddress(),
      await killswitch.getAddress(),
      await artistRoyaltyStorage.getAddress(),
    ],
    {
      initializer: "initialize",
    },
  );
  await artistRoyaltyController.waitForDeployment();

  return {
    artistRoyaltyController:
      artistRoyaltyController as unknown as OurkiveArtistRoyaltyControllerUpgradeable,
  };
};

export const deployOurkiveNFTDataStorageUpgradeable = async (
  accessControl: Contract,
  killswitch: Contract,
) => {
  const NFTDataStorage = await ethers.getContractFactory(
    "OurkiveNFTDataStorageUpgradeable",
  );
  const nftDataStorage = await upgrades.deployProxy(
    NFTDataStorage,
    [await accessControl.getAddress(), await killswitch.getAddress()],
    {
      initializer: "initialize",
    },
  );
  await nftDataStorage.waitForDeployment();

  return {
    nftDataStorage:
      nftDataStorage as unknown as OurkiveNFTDataStorageUpgradeable,
  };
};

export const deployOurkivePaymentStorageUpgradeable = async (
  accessControl: Contract,
  killswitch: Contract,
  usdc: Contract,
) => {
  const PaymentStorage = await ethers.getContractFactory(
    "OurkivePaymentStorageUpgradeable",
  );
  const paymentStorage = await upgrades.deployProxy(
    PaymentStorage,
    [
      await accessControl.getAddress(),
      await killswitch.getAddress(),
      await usdc.getAddress(),
    ],
    {
      initializer: "initialize",
    },
  );
  await paymentStorage.waitForDeployment();

  return {
    paymentStorage:
      paymentStorage as unknown as OurkivePaymentStorageUpgradeable,
  };
};

export const deployOurkivePaymentControllerUpgradeable = async (
  accessControl: Contract,
  killswitch: Contract,
  paymentStorage: OurkivePaymentStorageUpgradeable,
) => {
  const PaymentController = await ethers.getContractFactory(
    "OurkivePaymentControllerUpgradeable",
  );
  const paymentController = await upgrades.deployProxy(
    PaymentController,
    [
      await accessControl.getAddress(),
      await killswitch.getAddress(),
      await paymentStorage.getAddress(),
    ],
    {
      initializer: "initialize",
    },
  );
  await paymentController.waitForDeployment();

  return {
    paymentController:
      paymentController as unknown as OurkivePaymentControllerUpgradeable,
  };
};

export const deployPaymentControllerReentrancyAttack = async (
  owner: HardhatEthersSigner,
  ...args: Parameters<PaymentControllerReentrancyAttack__factory["deploy"]>
) => {
  const [paymentControllerAddress] = args;
  const reentrancyAttack = await new PaymentControllerReentrancyAttack__factory(
    owner,
  ).deploy(paymentControllerAddress);
  await reentrancyAttack.waitForDeployment();

  return { reentrancyAttack };
};

export const deployOurkiveNFTMarketplaceReentrancyGuardUpgradeable = async (
  accessControl: Contract,
) => {
  const ReentrancyGuard = await ethers.getContractFactory(
    "OurkiveNFTMarketplaceReentrancyGuardUpgradeable",
  );
  const reentrancyGuard = await upgrades.deployProxy(
    ReentrancyGuard,
    [await accessControl.getAddress()],
    { initializer: "initialize" },
  );
  await reentrancyGuard.waitForDeployment();

  return { reentrancyGuard };
};

export const deployOurkiveCollectorRoyaltyStorageUpgradeable = async (
  accessControl: Contract,
  killswitch: Contract,
) => {
  const CollectorRoyaltyStorage = await ethers.getContractFactory(
    "OurkiveCollectorRoyaltyStorageUpgradeable",
  );
  const collectorRoyaltyStorage = await upgrades.deployProxy(
    CollectorRoyaltyStorage,
    [await accessControl.getAddress(), await killswitch.getAddress()],
    {
      initializer: "initialize",
    },
  );
  await collectorRoyaltyStorage.waitForDeployment();

  return {
    collectorRoyaltyStorage:
      collectorRoyaltyStorage as unknown as OurkiveCollectorRoyaltyStorageUpgradeable,
  };
};

export const deployOurkiveCollectorRoyaltyControllerUpgradeable = async (
  accessControl: Contract,
  killswitch: Contract,
  collectorRoyaltyStorage: OurkiveCollectorRoyaltyStorageUpgradeable,
) => {
  const CollectorRoyaltyController = await ethers.getContractFactory(
    "OurkiveCollectorRoyaltyControllerUpgradeable",
  );
  const collectorRoyaltyController = await upgrades.deployProxy(
    CollectorRoyaltyController,
    [
      await accessControl.getAddress(),
      await killswitch.getAddress(),
      await collectorRoyaltyStorage.getAddress(),
    ],
    {
      initializer: "initialize",
    },
  );
  await collectorRoyaltyController.waitForDeployment();

  return {
    collectorRoyaltyController:
      collectorRoyaltyController as unknown as OurkiveCollectorRoyaltyControllerUpgradeable,
  };
};

export const deployOurkiveCollectorTokenV2Upgradeable = async () => {
  const KiveToken = await ethers.getContractFactory(
    "OurkiveCollectorTokenV2Upgradeable",
  );
  const kiveToken = await upgrades.deployProxy(KiveToken, [], {
    initializer: "initialize",
  });
  await kiveToken.waitForDeployment();

  return { kive: kiveToken as unknown as OurkiveCollectorTokenV2Upgradeable };
};

export const deployOurkiveNFTAllowlistUpgradeable = async (
  accessControl: Contract | OurkiveAccessControlUpgradeable,
  killswitch: Contract | OurkiveKillswitchUpgradeable,
) => {
  const NFTAllowlist = await ethers.getContractFactory(
    "OurkiveNFTAllowlistUpgradeable",
  );
  const nftAllowlist = await upgrades.deployProxy(
    NFTAllowlist,
    [await accessControl.getAddress(), await killswitch.getAddress()],
    { initializer: "initialize" },
  );
  await nftAllowlist.waitForDeployment();

  return {
    nftAllowlist: nftAllowlist as unknown as OurkiveNFTAllowlistUpgradeable,
  };
};

export const deployOurkiveMusicTokenV4 = async (
  owner: HardhatEthersSigner,
  ...args: Parameters<OurkiveMusicTokenV4__factory["deploy"]> extends [
    infer _,
    infer __,
    ...infer Rest,
  ]
    ? Rest
    : never
) => {
  const [artistAddress, tokenId, royaltyBps] = args;
  const ourkiveMusicTokenV4 = await new OurkiveMusicTokenV4__factory(
    owner,
  ).deploy("OurkiveMusicTokenV3", "MUSIC", artistAddress, tokenId, royaltyBps);
  await ourkiveMusicTokenV4.waitForDeployment();

  return { ourkiveMusicTokenV4 };
};
