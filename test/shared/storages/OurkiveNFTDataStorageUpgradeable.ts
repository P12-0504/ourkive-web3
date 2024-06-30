import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveKillswitchUpgradeable,
  deployOurkiveMusicTokenV2,
  deployOurkiveMusicTokenV3,
  deployOurkiveNFTDataStorageUpgradeable,
} from "../../../test_utils/deployFixtures";
import {
  TOKEN_ID,
  DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
} from "../../../test_utils/constants";

describe("OurkiveNFTDataStorageUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner, artist] = await ethers.getSigners();

    const { accessControl } = await deployOurkiveAccessControlUpgradeable();

    await accessControl.insertToNFTDataStorageAuthorizedRole(owner.address);

    const nftDataStorageAuthorizedRole =
      await accessControl.NFT_DATA_STORAGE_AUTHORIZED_ROLE();

    const { killswitch } =
      await deployOurkiveKillswitchUpgradeable(accessControl);

    const { ourkiveMusicToken: ourkiveMusicTokenV2 } =
      await deployOurkiveMusicTokenV2();
    const { ourkiveMusicTokenV3 } = await deployOurkiveMusicTokenV3(
      owner,
      artist.address,
      DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
    );

    const { nftDataStorage } = await deployOurkiveNFTDataStorageUpgradeable(
      accessControl,
      killswitch,
    );

    return {
      owner,
      artist,
      nftDataStorage,
      accessControl,
      killswitch,
      ourkiveMusicTokenV2,
      ourkiveMusicTokenV3,
      nftDataStorageAuthorizedRole,
    };
  };

  it("Should initialize correctly with access control and killswitch", async () => {
    const { nftDataStorage } = await loadFixture(beforeEachFixture);
    expect(await nftDataStorage.getKillswitch()).to.not.be.undefined;
    expect(await nftDataStorage.getAccessControl()).to.not.be.undefined;
  });

  it("Should prevent re-initialization", async () => {
    const { nftDataStorage, accessControl, killswitch } =
      await loadFixture(beforeEachFixture);
    await expect(
      nftDataStorage.initialize(
        await accessControl.getAddress(),
        await killswitch.getAddress(),
      ),
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Should allow updating the NFT purchase status", async () => {
    const { nftDataStorage, owner, ourkiveMusicTokenV2, ourkiveMusicTokenV3 } =
      await loadFixture(beforeEachFixture);

    const nftAddressV2 = await ourkiveMusicTokenV2.getAddress();
    const nftAddressV3 = await ourkiveMusicTokenV2.getAddress();
    const expectedResult = true;

    await nftDataStorage.setNFTPurchasedStatus(
      nftAddressV2,
      TOKEN_ID,
      expectedResult,
    );
    await nftDataStorage.setNFTPurchasedStatus(
      nftAddressV3,
      TOKEN_ID,
      expectedResult,
    );

    const hasNFTBeenPurchasedV2 = await nftDataStorage.hasNFTBeenPurchased(
      nftAddressV2,
      TOKEN_ID,
    );
    expect(hasNFTBeenPurchasedV2).to.equal(expectedResult);
    const hasNFTBeenPurchasedV3 = await nftDataStorage.hasNFTBeenPurchased(
      nftAddressV3,
      TOKEN_ID,
    );
    expect(hasNFTBeenPurchasedV3).to.equal(expectedResult);
  });

  it("Should not change the status if set to the same value", async () => {
    const { nftDataStorage, ourkiveMusicTokenV2, ourkiveMusicTokenV3 } =
      await loadFixture(beforeEachFixture);
    const nftAddressV2 = await ourkiveMusicTokenV2.getAddress();
    const nftAddressV3 = await ourkiveMusicTokenV3.getAddress();
    const expectedResult = false;

    await nftDataStorage.setNFTPurchasedStatus(
      nftAddressV2,
      TOKEN_ID,
      expectedResult,
    );
    expect(
      await nftDataStorage.hasNFTBeenPurchased(nftAddressV2, TOKEN_ID),
    ).to.equal(expectedResult);
    await nftDataStorage.setNFTPurchasedStatus(
      nftAddressV3,
      TOKEN_ID,
      expectedResult,
    );
    expect(
      await nftDataStorage.hasNFTBeenPurchased(nftAddressV3, TOKEN_ID),
    ).to.equal(expectedResult);
  });

  it("Should prevent unauthorized users from updating the purchase status", async () => {
    const {
      nftDataStorage,
      artist,
      ourkiveMusicTokenV2,
      nftDataStorageAuthorizedRole,
    } = await loadFixture(beforeEachFixture);
    await expect(
      nftDataStorage
        .connect(artist)
        .setNFTPurchasedStatus(
          await ourkiveMusicTokenV2.getAddress(),
          TOKEN_ID,
          true,
        ),
    ).to.be.revertedWith(
      `AccessControl: account ${artist.address.toLowerCase()} is missing role ${nftDataStorageAuthorizedRole.toLowerCase()}`,
    );
  });
});
