import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveCollectorRoyaltyStorageUpgradeable,
  deployOurkiveKillswitchUpgradeable,
  deployOurkiveMusicTokenV2,
  deployOurkiveMusicTokenV3,
} from "../../../test_utils/deployFixtures";
import {
  DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
  TOKEN_ID,
} from "../../../test_utils/constants";
import getUnauthorizedErrorMessage from "../../../test_utils/access/getUnauthorizedErrorMessage";

describe("OurkiveCollectorRoyaltyStorageUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner, artist, marketplace, collector, collector2, collector3] =
      await ethers.getSigners();

    const { accessControl } = await deployOurkiveAccessControlUpgradeable();

    await accessControl.insertToCollectorRoyaltyStorageAuthorizedRole(
      owner.address,
    );

    const collectorRoyaltyStorageAuthorizedRole =
      await accessControl.COLLECTOR_ROYALTY_STORAGE_AUTHORIZED_ROLE();

    const { killswitch } =
      await deployOurkiveKillswitchUpgradeable(accessControl);

    const { ourkiveMusicToken: ourkiveMusicTokenV2 } =
      await deployOurkiveMusicTokenV2();
    const { ourkiveMusicTokenV3 } = await deployOurkiveMusicTokenV3(
      owner,
      artist.address,
      DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
    );

    const { collectorRoyaltyStorage } =
      await deployOurkiveCollectorRoyaltyStorageUpgradeable(
        accessControl,
        killswitch,
      );

    return {
      collectorRoyaltyStorage,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
      ourkiveMusicTokenV3,
      accessControl,
      killswitch,
      collectorRoyaltyStorageAuthorizedRole,
      collector,
      collector2,
      collector3,
    };
  };

  it("Should initialize correctly with given parameters", async () => {
    const { collectorRoyaltyStorage } = await loadFixture(beforeEachFixture);
    // Check if the contract address is set (indicating deployment and initialization were successful)
    expect(await collectorRoyaltyStorage.getAddress()).to.not.be.undefined;
  });

  it("Should prevent reinitialization", async () => {
    const { collectorRoyaltyStorage, owner, accessControl, killswitch } =
      await loadFixture(beforeEachFixture);
    // Attempt to reinitialize and expect a revert
    await expect(
      collectorRoyaltyStorage.initialize(
        await accessControl.getAddress(),
        await killswitch.getAddress(),
      ),
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Should allow setting a valid artist royalty", async () => {
    const {
      collectorRoyaltyStorage,
      ourkiveMusicTokenV2,
      collector,
      collector2,
      collector3,
    } = await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    // Add first collector royalty
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      nftAddress,
      TOKEN_ID,
      collector.address,
    );

    const collectorIndex = 0;
    let collectorRoyalties =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipients(
        nftAddress,
        TOKEN_ID,
      );
    const collectorRoyaltyOne =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        nftAddress,
        TOKEN_ID,
        collectorIndex,
      );

    expect(collectorRoyalties.length).to.equal(1);
    expect(collectorRoyalties[collectorIndex]).to.equal(collector.address);

    expect(collectorRoyaltyOne).to.equal(collector.address);

    // Add second collector royalty
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      nftAddress,
      TOKEN_ID,
      collector2.address,
    );

    const collector2Index = 1;
    collectorRoyalties =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipients(
        nftAddress,
        TOKEN_ID,
      );
    let collectorRoyaltyTwo =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        nftAddress,
        TOKEN_ID,
        collector2Index,
      );

    expect(collectorRoyalties.length).to.equal(2);
    expect(collectorRoyalties[collectorIndex]).to.equal(collector.address);
    expect(collectorRoyalties[collector2Index]).to.equal(collector2.address);

    expect(collectorRoyaltyTwo).to.equal(collector2.address);

    // Add third collector royalty
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      nftAddress,
      TOKEN_ID,
      collector3.address,
    );

    const collector3Index = 2;
    collectorRoyalties =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipients(
        nftAddress,
        TOKEN_ID,
      );
    let collectorRoyaltyThree =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        nftAddress,
        TOKEN_ID,
        collector3Index,
      );

    expect(collectorRoyalties.length).to.equal(3);
    expect(collectorRoyalties[collectorIndex]).to.equal(collector.address);
    expect(collectorRoyalties[collector2Index]).to.equal(collector2.address);
    expect(collectorRoyalties[collector3Index]).to.equal(collector3.address);

    expect(collectorRoyaltyThree).to.equal(collector3.address);
  });

  it("Should revert if the royalty receiver is the zero address", async () => {
    const { collectorRoyaltyStorage, owner } =
      await loadFixture(beforeEachFixture);
    await expect(
      collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
        owner.address,
        TOKEN_ID,
        ethers.ZeroAddress,
      ),
    ).to.be.revertedWith(
      "Collector royalty recipient must not be zero address",
    );
  });

  it("Should be able to successfully update a collector royalty", async () => {
    const {
      collectorRoyaltyStorage,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
      collector,
      collector2,
      collector3,
    } = await loadFixture(beforeEachFixture);

    const musicNFTAddress = await ourkiveMusicTokenV2.getAddress();

    // Add collector royalties
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector.address,
    );
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector2.address,
    );
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector3.address,
    );

    const collectorIndex = 0;
    const collector2Index = 1;
    const collector3Index = 2;

    // Update second collector royalty
    await collectorRoyaltyStorage.insertCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector2Index,
      collector2.address,
    );

    // Check collector royalties
    let collectorRoyalties =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipients(
        musicNFTAddress,
        TOKEN_ID,
      );
    let collectorRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collectorIndex,
      );
    let collectorTwoRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collector2Index,
      );
    let collectorThreeRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collector3Index,
      );

    expect(collectorRoyalties).to.have.length(3);
    expect(collectorRoyalties[collectorIndex]).to.equal(collector.address);
    expect(collectorRoyalties[collector2Index]).to.equal(collector2.address);
    expect(collectorRoyalties[collector3Index]).to.equal(collector3.address);

    expect(collectorRoyalty).to.equal(collector.address);
    expect(collectorTwoRoyalty).to.equal(collector2.address);
    expect(collectorThreeRoyalty).to.equal(collector3.address);

    // Update first collector royalty
    await collectorRoyaltyStorage.insertCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collectorIndex,
      collector.address,
    );

    // Check collector royalties
    collectorRoyalties =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipients(
        musicNFTAddress,
        TOKEN_ID,
      );
    collectorRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collectorIndex,
      );
    collectorTwoRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collector2Index,
      );
    collectorThreeRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collector3Index,
      );

    expect(collectorRoyalties).to.have.length(3);
    expect(collectorRoyalties[collectorIndex]).to.equal(collector.address);
    expect(collectorRoyalties[collector2Index]).to.equal(collector2.address);
    expect(collectorRoyalties[collector3Index]).to.equal(collector3.address);

    expect(collectorRoyalty).to.equal(collector.address);
    expect(collectorTwoRoyalty).to.equal(collector2.address);
    expect(collectorThreeRoyalty).to.equal(collector3.address);

    // Update third collector royalty
    await collectorRoyaltyStorage.insertCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector3Index,
      collector3.address,
    );

    // Check collector royalties
    collectorRoyalties =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipients(
        musicNFTAddress,
        TOKEN_ID,
      );
    collectorRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collectorIndex,
      );
    collectorTwoRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collector2Index,
      );
    collectorThreeRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collector3Index,
      );

    expect(collectorRoyalties).to.have.length(3);
    expect(collectorRoyalties[collectorIndex]).to.equal(collector.address);
    expect(collectorRoyalties[collector2Index]).to.equal(collector2.address);
    expect(collectorRoyalties[collector3Index]).to.equal(collector3.address);

    expect(collectorRoyalty).to.equal(collector.address);
    expect(collectorTwoRoyalty).to.equal(collector2.address);
    expect(collectorThreeRoyalty).to.equal(collector3.address);
  });

  it("Should revert if the collector index is out of bounds", async () => {
    const {
      collectorRoyaltyStorage,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
    } = await loadFixture(beforeEachFixture);

    const musicNFTAddress = await ourkiveMusicTokenV2.getAddress();

    await expect(
      collectorRoyaltyStorage.insertCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        1,
        owner.address,
      ),
    ).to.be.revertedWithPanic(0x32); // our-of-bounds error
  });

  it("Should correctly remove collector royalty", async () => {
    const {
      collectorRoyaltyStorage,
      owner,
      ourkiveMusicTokenV3,
      artist,
      marketplace,
      collector,
      collector2,
      collector3,
    } = await loadFixture(beforeEachFixture);

    const musicNFTAddress = await ourkiveMusicTokenV3.getAddress();

    // Add collector royalties
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector.address,
    );
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector2.address,
    );
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector3.address,
    );

    await collectorRoyaltyStorage.removeCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      1,
    );

    const collectorIndex = 0;
    const collectorTwoIndex = 1;
    const collectorThreeIndex = 2;

    const collectorRoyalties =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipients(
        musicNFTAddress,
        TOKEN_ID,
      );
    const collectorRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collectorIndex,
      );
    const collectorTwoRoyalty =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipient(
        musicNFTAddress,
        TOKEN_ID,
        collectorTwoIndex,
      );

    expect(collectorRoyalties).to.have.length(2);
    expect(collectorRoyalties[collectorIndex]).to.equal(collector.address);
    expect(collectorRoyalties[collectorTwoIndex]).to.equal(collector3.address);

    expect(collectorRoyalty).to.equal(collector.address);
    expect(collectorTwoRoyalty).to.equal(collector3.address);
  });

  it("Should delete the whole collector royalties for the given NFT", async () => {
    const {
      collectorRoyaltyStorage,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV3,
      collector,
      collector2,
      collector3,
    } = await loadFixture(beforeEachFixture);

    const musicNFTAddress = await ourkiveMusicTokenV3.getAddress();

    // Add collector royalties
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector.address,
    );
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector2.address,
    );
    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      collector3.address,
    );

    await collectorRoyaltyStorage.removeCollectorRoyaltyRecipient(
      musicNFTAddress,
      TOKEN_ID,
      1,
    );

    await collectorRoyaltyStorage.deleteCollectorRoyaltyRecipients(
      musicNFTAddress,
      TOKEN_ID,
    );

    const collectorRoyalties =
      await collectorRoyaltyStorage.getCollectorRoyaltyRecipients(
        musicNFTAddress,
        TOKEN_ID,
      );

    expect(collectorRoyalties).to.have.length(0);
  });

  it("Should prevent unauthorized users from inserting a collector royalty", async () => {
    const {
      collectorRoyaltyStorage,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
      collectorRoyaltyStorageAuthorizedRole,
      collector,
    } = await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      nftAddress,
      TOKEN_ID,
      collector.address,
    );

    await expect(
      collectorRoyaltyStorage
        .connect(artist)
        .insertCollectorRoyaltyRecipient(
          nftAddress,
          TOKEN_ID,
          0,
          collector.address,
        ),
    ).to.be.revertedWith(
      `AccessControl: account ${artist.address.toLowerCase()} is missing role ${collectorRoyaltyStorageAuthorizedRole.toLowerCase()}`,
    );
  });

  it("Should prevent unauthorized users from adding a collector royalty", async () => {
    const {
      collectorRoyaltyStorage,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
      collectorRoyaltyStorageAuthorizedRole,
      collector,
    } = await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    await expect(
      collectorRoyaltyStorage
        .connect(artist)
        .addCollectorRoyaltyRecipient(nftAddress, TOKEN_ID, collector.address),
    ).to.be.revertedWith(
      `AccessControl: account ${artist.address.toLowerCase()} is missing role ${collectorRoyaltyStorageAuthorizedRole.toLowerCase()}`,
    );
  });

  it("Should prevent unauthorized users from removing a collector royalty", async () => {
    const {
      collectorRoyaltyStorage,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
      collectorRoyaltyStorageAuthorizedRole,
      collector,
    } = await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      nftAddress,
      TOKEN_ID,
      collector.address,
    );

    await expect(
      collectorRoyaltyStorage
        .connect(artist)
        .removeCollectorRoyaltyRecipient(nftAddress, TOKEN_ID, 0),
    ).to.be.revertedWith(
      `AccessControl: account ${artist.address.toLowerCase()} is missing role ${collectorRoyaltyStorageAuthorizedRole.toLowerCase()}`,
    );
  });

  it("Should prevent unauthorized users from deleting collector royalties", async () => {
    const {
      collectorRoyaltyStorage,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
      collectorRoyaltyStorageAuthorizedRole,
      collector,
    } = await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    await collectorRoyaltyStorage.addCollectorRoyaltyRecipient(
      nftAddress,
      TOKEN_ID,
      collector.address,
    );

    await expect(
      collectorRoyaltyStorage
        .connect(artist)
        .deleteCollectorRoyaltyRecipients(nftAddress, TOKEN_ID),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(
        artist.address,
        collectorRoyaltyStorageAuthorizedRole,
      ),
    );
  });
});
