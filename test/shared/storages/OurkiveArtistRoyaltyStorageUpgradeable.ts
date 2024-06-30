import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveArtistRoyaltyStorageUpgradeable,
  deployOurkiveKillswitchUpgradeable,
  deployOurkiveMusicTokenV2,
  deployOurkiveMusicTokenV3,
} from "../../../test_utils/deployFixtures";
import {
  DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
  TOKEN_ID,
} from "../../../test_utils/constants";
import {
  safeMintAndApprovalForAll,
  setArtistAddress,
} from "../../../test_utils/musicNFT/OurkiveMusicTokenV2";

describe("OurkiveArtistRoyaltyStorageUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner, artist, marketplace] = await ethers.getSigners();

    const { accessControl } = await deployOurkiveAccessControlUpgradeable();

    await accessControl.insertToArtistRoyaltyStorageAuthorizedRole(
      owner.address,
    );

    const artistRoyaltyStorageAuthorizedRole =
      await accessControl.ARTIST_ROYALTY_STORAGE_AUTHORIZED_ROLE();

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

    return {
      artistRoyaltyStorage,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
      ourkiveMusicTokenV3,
      accessControl,
      killswitch,
      artistRoyaltyStorageAuthorizedRole,
    };
  };

  it("Should initialize correctly with given parameters", async () => {
    const { artistRoyaltyStorage } = await loadFixture(beforeEachFixture);
    // Check if the contract address is set (indicating deployment and initialization were successful)
    expect(await artistRoyaltyStorage.getAddress()).to.not.be.undefined;
  });

  it("Should prevent reinitialization", async () => {
    const { artistRoyaltyStorage, owner, accessControl, killswitch } =
      await loadFixture(beforeEachFixture);
    // Attempt to reinitialize and expect a revert
    await expect(
      artistRoyaltyStorage.initialize(
        await accessControl.getAddress(),
        await killswitch.getAddress(),
      ),
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Should allow setting a valid artist royalty", async () => {
    const { artistRoyaltyStorage, artist, ourkiveMusicTokenV2 } =
      await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();
    await artistRoyaltyStorage.setCustomArtistRoyalty(
      nftAddress,
      TOKEN_ID,
      artist.address,
      DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
    );
    const { receiver, royaltyBps } =
      await artistRoyaltyStorage.customArtistRoyalties(nftAddress, TOKEN_ID);
    expect(receiver).to.equal(artist.address);
    expect(royaltyBps).to.equal(DEFAULT_ARTIST_ROYALTY_BASIS_POINTS);
  });

  it("Should revert if the royalty receiver is the zero address", async () => {
    const { artistRoyaltyStorage, owner } =
      await loadFixture(beforeEachFixture);
    await expect(
      artistRoyaltyStorage.setCustomArtistRoyalty(
        owner.address,
        TOKEN_ID,
        ethers.ZeroAddress,
        100,
      ),
    ).to.be.revertedWith("Artist royalty receiver must not be zero address");
  });

  it("Should revert if the royalty basis points are over 10000", async () => {
    const { artistRoyaltyStorage, owner } =
      await loadFixture(beforeEachFixture);
    await expect(
      artistRoyaltyStorage.setCustomArtistRoyalty(
        owner.address,
        1,
        owner.address,
        10001,
      ),
    ).to.be.revertedWith("Artist royalty must be less than 100%");
  });

  it("Should retrieve the correct royalty amount and receiver with OurkiveMusicTokenV2", async () => {
    const {
      artistRoyaltyStorage,
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

    const expectedRoyaltyBps = BigInt(1000); // 10%

    await artistRoyaltyStorage.setCustomArtistRoyalty(
      musicNFTAddress,
      TOKEN_ID,
      artist.address,
      expectedRoyaltyBps,
    );
    const [receiver, royaltyBps] =
      await artistRoyaltyStorage.getCustomArtistRoyalty(
        musicNFTAddress,
        TOKEN_ID,
      );

    expect(receiver).to.equal(artist.address);
    expect(royaltyBps).to.equal(expectedRoyaltyBps);
  });

  it("Should return zero for unset royalties with OurkiveMusicTokenV2", async () => {
    const {
      artistRoyaltyStorage,
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
      await artistRoyaltyStorage.getCustomArtistRoyalty(musicNFTAddress, 999);
    expect(receiver).to.equal(ethers.ZeroAddress);
    expect(royaltyAmount).to.equal(0);
  });

  it("Should retrieve the correct royalty amount and receiver with OurkiveMusicTokenV3", async () => {
    const {
      artistRoyaltyStorage,
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
    const expectedRoyaltyBps =
      (expectedRoyaltyAmount * BigInt(10000)) / salePrice;

    const [receiver, royaltyBps] =
      await artistRoyaltyStorage.getCustomArtistRoyalty(
        musicNFTAddress,
        TOKEN_ID,
      );

    expect(receiver).to.equal(ethers.ZeroAddress);
    expect(royaltyBps).to.equal(0);
  });

  it("Should return zero for unset royalties with OurkiveMusicTokenV3", async () => {
    const {
      artistRoyaltyStorage,
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

    const [receiver, royaltyBps] =
      await artistRoyaltyStorage.getCustomArtistRoyalty(musicNFTAddress, 999);
    expect(receiver).to.equal(ethers.ZeroAddress);
    expect(royaltyBps).to.equal(0);
  });

  it("Should prevent unauthorized users from updating the artist royalty", async () => {
    const {
      artistRoyaltyStorage,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
      artistRoyaltyStorageAuthorizedRole,
    } = await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    await expect(
      artistRoyaltyStorage
        .connect(artist)
        .setCustomArtistRoyalty(
          nftAddress,
          TOKEN_ID,
          artist.address,
          DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
        ),
    ).to.be.revertedWith(
      `AccessControl: account ${artist.address.toLowerCase()} is missing role ${artistRoyaltyStorageAuthorizedRole.toLowerCase()}`,
    );
  });
});
