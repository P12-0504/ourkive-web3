import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveArtistRoyaltyControllerUpgradeable,
  deployOurkiveArtistRoyaltyStorageUpgradeable,
  deployOurkiveKillswitchUpgradeable,
  deployOurkiveMusicTokenV2,
  deployOurkiveMusicTokenV3,
} from "../../test_utils/deployFixtures";
import {
  DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
  TOKEN_ID,
} from "../../test_utils/constants";
import {
  safeMintAndApprovalForAll,
  setArtistAddress,
} from "../../test_utils/musicNFT/OurkiveMusicTokenV2";

describe("OurkiveArtistRoyaltyControllerUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner, artist, marketplace] = await ethers.getSigners();

    const { accessControl } = await deployOurkiveAccessControlUpgradeable();

    const adminRole = await accessControl.ADMIN_ROLE();

    const { killswitch } =
      await deployOurkiveKillswitchUpgradeable(accessControl);

    const { ourkiveMusicToken: ourkiveMusicTokenV2 } =
      await deployOurkiveMusicTokenV2();
    const { ourkiveMusicTokenV3 } = await deployOurkiveMusicTokenV3(
      owner,
      artist.address,
      DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
    );

    const { artistRoyaltyStorage } =
      await deployOurkiveArtistRoyaltyStorageUpgradeable(
        accessControl,
        killswitch,
      );

    await accessControl.insertToArtistRoyaltyStorageAuthorizedRole(
      owner.address,
    );

    const { artistRoyaltyController } =
      await deployOurkiveArtistRoyaltyControllerUpgradeable(
        accessControl,
        killswitch,
        artistRoyaltyStorage,
      );

    return {
      artistRoyaltyStorage,
      artistRoyaltyController,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
      ourkiveMusicTokenV3,
      accessControl,
      killswitch,
      adminRole,
    };
  };

  it("Should initialize correctly with given parameters", async () => {
    const { artistRoyaltyController } = await loadFixture(beforeEachFixture);
    // Check if the contract address is set (indicating deployment and initialization were successful)
    expect(await artistRoyaltyController.getAddress()).to.not.be.undefined;
  });

  it("Should prevent reinitialization", async () => {
    const {
      accessControl,
      killswitch,
      artistRoyaltyStorage,
      artistRoyaltyController,
    } = await loadFixture(beforeEachFixture);
    // Attempt to reinitialize and expect a revert
    await expect(
      artistRoyaltyController.initialize(
        await accessControl.getAddress(),
        await killswitch.getAddress(),
        await artistRoyaltyStorage.getAddress(),
      ),
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Should correctly set artist royalty storage address", async () => {
    const {
      owner,
      accessControl,
      killswitch,
      artistRoyaltyStorage,
      artistRoyaltyController,
    } = await loadFixture(beforeEachFixture);

    await artistRoyaltyController.setArtistRoyaltyStorage(owner.address);

    const artistRoyaltyStorageAddr =
      await artistRoyaltyController.artistRoyaltyStorage();

    expect(artistRoyaltyStorageAddr).to.equal(owner.address);
  });

  it("Should prevent unauthorized entity from setting artist royalty storage address", async () => {
    const {
      owner,
      artist,
      accessControl,
      killswitch,
      artistRoyaltyStorage,
      artistRoyaltyController,
      adminRole,
    } = await loadFixture(beforeEachFixture);

    await expect(
      artistRoyaltyController
        .connect(artist)
        .setArtistRoyaltyStorage(owner.address),
    ).to.be.revertedWith(
      `AccessControl: account ${artist.address.toLowerCase()} is missing role ${adminRole.toLowerCase()}`,
    );
  });

  it("Should retrieve the correct royalty amount and receiver with OurkiveMusicTokenV2", async () => {
    const {
      artistRoyaltyStorage,
      artistRoyaltyController,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
    } = await loadFixture(beforeEachFixture);

    await setArtistAddress(
      ourkiveMusicTokenV2,
      { artist: artist.address },
      owner,
    );
    await safeMintAndApprovalForAll(
      ourkiveMusicTokenV2,
      {
        to: artist.address,
        tokenId: TOKEN_ID,
        uri: "https://example.com/token/0",
        marketplaceAddress: marketplace.address,
      },
      owner,
    );

    const musicNFTAddress = await ourkiveMusicTokenV2.getAddress();

    const setRoyalty = BigInt(1000); // 10%
    const salePrice = ethers.parseEther("1000"); // 1000 ETH
    const expectedRoyaltyAmount = (salePrice * setRoyalty) / BigInt(10000);

    await artistRoyaltyStorage.setCustomArtistRoyalty(
      musicNFTAddress,
      TOKEN_ID,
      artist.address,
      setRoyalty,
    );
    const [receiver, royaltyAmount] =
      await artistRoyaltyController.getArtistRoyaltyRecipientAndAmount(
        musicNFTAddress,
        TOKEN_ID,
        salePrice,
      );

    expect(receiver).to.equal(artist.address);
    expect(royaltyAmount).to.equal(expectedRoyaltyAmount);
  });

  it("Should return zero for unset royalties with OurkiveMusicTokenV2", async () => {
    const {
      artistRoyaltyStorage,
      artistRoyaltyController,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
    } = await loadFixture(beforeEachFixture);

    await setArtistAddress(
      ourkiveMusicTokenV2,
      { artist: artist.address },
      owner,
    );
    await safeMintAndApprovalForAll(
      ourkiveMusicTokenV2,
      {
        to: artist.address,
        tokenId: TOKEN_ID,
        uri: "https://example.com/token/0",
        marketplaceAddress: marketplace.address,
      },
      artist,
    );

    const musicNFTAddress = await ourkiveMusicTokenV2.getAddress();

    const salePrice = ethers.parseEther("1000"); // 1000 ETH

    const [receiver, royaltyAmount] =
      await artistRoyaltyController.getArtistRoyaltyRecipientAndAmount(
        musicNFTAddress,
        999,
        salePrice,
      );
    expect(receiver).to.equal(ethers.ZeroAddress);
    expect(royaltyAmount).to.equal(0);
  });

  it("Should retrieve the correct royalty amount and receiver with OurkiveMusicTokenV3", async () => {
    const {
      artistRoyaltyStorage,
      artistRoyaltyController,
      owner,
      ourkiveMusicTokenV3,
      artist,
      marketplace,
    } = await loadFixture(beforeEachFixture);

    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3
      .connect(artist)
      .safeMintAndApprovalForAll(
        artist.address,
        TOKEN_ID,
        "https://example.com/token/0",
        marketplace.address,
      );

    const musicNFTAddress = await ourkiveMusicTokenV3.getAddress();

    const salePrice = ethers.parseEther("1000"); // 1000 ETH
    const [expectedReceiver, expectedRoyaltyAmount] =
      await ourkiveMusicTokenV3.royaltyInfo(TOKEN_ID, salePrice);

    const [receiver, royaltyAmount] =
      await artistRoyaltyController.getArtistRoyaltyRecipientAndAmount(
        musicNFTAddress,
        TOKEN_ID,
        salePrice,
      );

    expect(receiver).to.equal(expectedReceiver);
    expect(royaltyAmount).to.equal(expectedRoyaltyAmount);
  });

  it("Should return default values for unset royalties with OurkiveMusicTokenV3", async () => {
    const {
      artistRoyaltyStorage,
      artistRoyaltyController,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV3,
    } = await loadFixture(beforeEachFixture);

    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3
      .connect(artist)
      .safeMintAndApprovalForAll(
        artist.address,
        TOKEN_ID,
        "https://example.com/token/0",
        marketplace.address,
      );

    const musicNFTAddress = await ourkiveMusicTokenV3.getAddress();

    const salePrice = ethers.parseEther("1000"); // 1000 ETH

    const [receiver, royaltyAmount] =
      await artistRoyaltyController.getArtistRoyaltyRecipientAndAmount(
        musicNFTAddress,
        999,
        salePrice,
      );
    const expectedRoyaltyAmount =
      (BigInt(DEFAULT_ARTIST_ROYALTY_BASIS_POINTS) * salePrice) / BigInt(10000);
    expect(receiver).to.equal(artist.address);
    expect(royaltyAmount).to.equal(expectedRoyaltyAmount);
  });
});
