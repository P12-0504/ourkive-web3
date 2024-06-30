import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveCollectorRoyaltyControllerUpgradeable,
  deployOurkiveCollectorRoyaltyStorageUpgradeable,
  deployOurkiveKillswitchUpgradeable,
  deployOurkiveMusicTokenV2,
  deployOurkiveMusicTokenV3,
} from "../../test_utils/deployFixtures";
import {
  DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
  TOKEN_ID,
} from "../../test_utils/constants";
import getUnauthorizedErrorMessage from "../../test_utils/access/getUnauthorizedErrorMessage";

const COLLECTOR_ONE_ROYALTY_BPS = 150;
const COLLECTOR_TWO_ROYALTY_BPS = 90;
const COLLECTOR_THREE_ROYALTY_BPS = 60;
const COLLECTOR_ROYALTY_BPS_ARRAY = [
  COLLECTOR_ONE_ROYALTY_BPS,
  COLLECTOR_TWO_ROYALTY_BPS,
  COLLECTOR_THREE_ROYALTY_BPS,
];

describe("OurkiveCollectorRoyaltyControllerUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner, artist, marketplace, collector, collector2, collector3] =
      await ethers.getSigners();

    const { accessControl } = await deployOurkiveAccessControlUpgradeable();

    const adminRole = await accessControl.ADMIN_ROLE();
    const collectorRoyaltyControllerAuthorizedRole =
      await accessControl.COLLECTOR_ROYALTY_CONTROLLER_AUTHORIZED_ROLE();

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

    const { collectorRoyaltyController } =
      await deployOurkiveCollectorRoyaltyControllerUpgradeable(
        accessControl,
        killswitch,
        collectorRoyaltyStorage,
      );

    await accessControl.insertToCollectorRoyaltyStorageAuthorizedRole(
      owner.address,
    );
    await accessControl.insertToCollectorRoyaltyStorageAuthorizedRole(
      await collectorRoyaltyController.getAddress(),
    );

    await accessControl.insertToCollectorRoyaltyControllerAuthorizedRole(
      owner.address,
    );

    return {
      collectorRoyaltyStorage,
      collectorRoyaltyController,
      owner,
      artist,
      marketplace,
      ourkiveMusicTokenV2,
      ourkiveMusicTokenV3,
      accessControl,
      killswitch,
      adminRole,
      collectorRoyaltyControllerAuthorizedRole,
      collector,
      collector2,
      collector3,
    };
  };

  it("Should initialize correctly with given parameters", async () => {
    const { collectorRoyaltyController } = await loadFixture(beforeEachFixture);
    // Check if the contract address is set (indicating deployment and initialization were successful)
    expect(await collectorRoyaltyController.getAddress()).to.not.be.undefined;
  });

  it("Should prevent reinitialization", async () => {
    const {
      accessControl,
      killswitch,
      collectorRoyaltyStorage,
      collectorRoyaltyController,
    } = await loadFixture(beforeEachFixture);
    // Attempt to reinitialize and expect a revert
    await expect(
      collectorRoyaltyController.initialize(
        await accessControl.getAddress(),
        await killswitch.getAddress(),
        await collectorRoyaltyStorage.getAddress(),
      ),
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Should revert if there is no collector royalty", async () => {
    const { collectorRoyaltyController, ourkiveMusicTokenV2 } =
      await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    const collectorIndex = 0;
    const nftPrice = ethers.parseUnits("1000", 6);

    await expect(
      collectorRoyaltyController.getCollectorRoyaltyPayee(
        nftAddress,
        TOKEN_ID,
        collectorIndex,
        0,
        nftPrice,
      ),
    ).to.be.revertedWithPanic(0x32);
  });

  it("Should correctly set and return collector royalty recipients and amounts", async () => {
    const {
      collectorRoyaltyController,
      collector,
      collector2,
      collector3,
      ourkiveMusicTokenV2,
    } = await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    const nftPrice = ethers.parseUnits("1000", 6);

    const collectorOneRoyaltyBps = 150;
    const collectorTwoRoyaltyBps = 90;
    const collectorThreeRoyaltyBps = 60;

    await collectorRoyaltyController.setCollectorRoyaltyRecipients(
      nftAddress,
      TOKEN_ID,
      [collector.address, collector2.address, collector3.address],
    );

    const collectorOneIndex = 0;
    const collectorTwoIndex = 1;
    const collectorThreeIndex = 2;

    const collectorRoyalties =
      await collectorRoyaltyController.getCollectorRoyaltyPayees(
        nftAddress,
        TOKEN_ID,
        COLLECTOR_ROYALTY_BPS_ARRAY,
        nftPrice,
      );

    const collectorOneRoyalty =
      await collectorRoyaltyController.getCollectorRoyaltyPayee(
        nftAddress,
        TOKEN_ID,
        collectorOneIndex,
        COLLECTOR_ONE_ROYALTY_BPS,
        nftPrice,
      );
    const collectorTwoRoyalty =
      await collectorRoyaltyController.getCollectorRoyaltyPayee(
        nftAddress,
        TOKEN_ID,
        collectorTwoIndex,
        COLLECTOR_TWO_ROYALTY_BPS,
        nftPrice,
      );
    const collectorThreeRoyalty =
      await collectorRoyaltyController.getCollectorRoyaltyPayee(
        nftAddress,
        TOKEN_ID,
        collectorThreeIndex,
        COLLECTOR_THREE_ROYALTY_BPS,
        nftPrice,
      );

    const expectedCollectorOneAmount =
      (nftPrice * BigInt(collectorOneRoyaltyBps)) / BigInt(10000);
    const expectedCollectorTwoAmount =
      (nftPrice * BigInt(collectorTwoRoyaltyBps)) / BigInt(10000);
    const expectedCollectorThreeAmount =
      (nftPrice * BigInt(collectorThreeRoyaltyBps)) / BigInt(10000);

    expect(collectorRoyalties).to.have.length(3);
    expect(collectorRoyalties[collectorOneIndex][0]).to.equal(
      collector.address,
    );
    expect(collectorRoyalties[collectorOneIndex][1]).to.equal(
      collectorOneRoyaltyBps,
    );
    expect(collectorRoyalties[collectorOneIndex][2]).to.equal(
      expectedCollectorOneAmount,
    );
    expect(collectorRoyalties[collectorTwoIndex][0]).to.equal(
      collector2.address,
    );
    expect(collectorRoyalties[collectorTwoIndex][1]).to.equal(
      collectorTwoRoyaltyBps,
    );
    expect(collectorRoyalties[collectorTwoIndex][2]).to.equal(
      expectedCollectorTwoAmount,
    );
    expect(collectorRoyalties[collectorThreeIndex][0]).to.equal(
      collector3.address,
    );
    expect(collectorRoyalties[collectorThreeIndex][1]).to.equal(
      collectorThreeRoyaltyBps,
    );
    expect(collectorRoyalties[collectorThreeIndex][2]).to.equal(
      expectedCollectorThreeAmount,
    );

    expect(collectorOneRoyalty[0]).to.equal(collector.address);
    expect(collectorOneRoyalty[1]).to.equal(collectorOneRoyaltyBps);
    expect(collectorOneRoyalty[2]).to.equal(expectedCollectorOneAmount);
    expect(collectorTwoRoyalty[0]).to.equal(collector2.address);
    expect(collectorTwoRoyalty[1]).to.equal(collectorTwoRoyaltyBps);
    expect(collectorTwoRoyalty[2]).to.equal(expectedCollectorTwoAmount);
    expect(collectorThreeRoyalty[0]).to.equal(collector3.address);
    expect(collectorThreeRoyalty[1]).to.equal(collectorThreeRoyaltyBps);
    expect(collectorThreeRoyalty[2]).to.equal(expectedCollectorThreeAmount);
  });

  it("Should return correct collector royalty recipients and amounts when they‘re modified", async () => {
    const {
      collectorRoyaltyController,
      collectorRoyaltyStorage,
      collector,
      collector2,
      collector3,
      ourkiveMusicTokenV2,
    } = await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    const nftPrice = ethers.parseUnits("1000", 6);

    await collectorRoyaltyController.setCollectorRoyaltyRecipients(
      nftAddress,
      TOKEN_ID,
      [collector.address, collector2.address, collector3.address],
    );

    const collectorOneIndex = 0;
    const collectorTwoIndex = 1;
    const collectorThreeIndex = 2;

    await collectorRoyaltyStorage.removeCollectorRoyaltyRecipient(
      nftAddress,
      TOKEN_ID,
      collectorTwoIndex,
    );

    let collectorRoyalties =
      await collectorRoyaltyController.getCollectorRoyaltyPayees(
        nftAddress,
        TOKEN_ID,
        COLLECTOR_ROYALTY_BPS_ARRAY,
        nftPrice,
      );

    let collectorOneRoyalty =
      await collectorRoyaltyController.getCollectorRoyaltyPayee(
        nftAddress,
        TOKEN_ID,
        collectorOneIndex,
        COLLECTOR_ONE_ROYALTY_BPS,
        nftPrice,
      );
    const collectorTwoRoyalty =
      await collectorRoyaltyController.getCollectorRoyaltyPayee(
        nftAddress,
        TOKEN_ID,
        collectorTwoIndex,
        COLLECTOR_TWO_ROYALTY_BPS,
        nftPrice,
      );

    await expect(
      collectorRoyaltyController.getCollectorRoyaltyPayee(
        nftAddress,
        TOKEN_ID,
        collectorThreeIndex,
        COLLECTOR_THREE_ROYALTY_BPS,
        nftPrice,
      ),
    ).to.be.revertedWithPanic(0x32);

    let expectedCollectorOneAmount =
      (nftPrice * BigInt(COLLECTOR_ONE_ROYALTY_BPS)) / BigInt(10000);
    const expectedCollectorTwoAmount =
      (nftPrice * BigInt(COLLECTOR_TWO_ROYALTY_BPS)) / BigInt(10000);

    expect(collectorRoyalties).to.have.length(2);
    expect(collectorRoyalties[collectorOneIndex][0]).to.equal(
      collector.address,
    );
    expect(collectorRoyalties[collectorOneIndex][1]).to.equal(
      COLLECTOR_ONE_ROYALTY_BPS,
    );
    expect(collectorRoyalties[collectorOneIndex][2]).to.equal(
      expectedCollectorOneAmount,
    );
    expect(collectorRoyalties[collectorTwoIndex][0]).to.equal(
      collector3.address,
    );
    expect(collectorRoyalties[collectorTwoIndex][1]).to.equal(
      COLLECTOR_TWO_ROYALTY_BPS,
    );
    expect(collectorRoyalties[collectorTwoIndex][2]).to.equal(
      expectedCollectorTwoAmount,
    );

    expect(collectorOneRoyalty[0]).to.equal(collector.address);
    expect(collectorOneRoyalty[1]).to.equal(COLLECTOR_ONE_ROYALTY_BPS);
    expect(collectorOneRoyalty[2]).to.equal(expectedCollectorOneAmount);
    expect(collectorTwoRoyalty[0]).to.equal(collector3.address);
    expect(collectorTwoRoyalty[1]).to.equal(COLLECTOR_TWO_ROYALTY_BPS);
    expect(collectorTwoRoyalty[2]).to.equal(expectedCollectorTwoAmount);

    await collectorRoyaltyStorage.deleteCollectorRoyaltyRecipients(
      nftAddress,
      TOKEN_ID,
    );

    collectorRoyalties =
      await collectorRoyaltyController.getCollectorRoyaltyPayees(
        nftAddress,
        TOKEN_ID,
        COLLECTOR_ROYALTY_BPS_ARRAY,
        nftPrice,
      );

    await expect(
      collectorRoyaltyController.getCollectorRoyaltyPayee(
        nftAddress,
        TOKEN_ID,
        collectorOneIndex,
        COLLECTOR_ONE_ROYALTY_BPS,
        nftPrice,
      ),
    ).to.be.revertedWithPanic(0x32);
    await expect(
      collectorRoyaltyController.getCollectorRoyaltyPayee(
        nftAddress,
        TOKEN_ID,
        collectorTwoIndex,
        COLLECTOR_TWO_ROYALTY_BPS,
        nftPrice,
      ),
    ).to.be.revertedWithPanic(0x32);

    expect(collectorRoyalties).to.have.length(0);

    await collectorRoyaltyController.addCollectorRoyaltyRecipient(
      nftAddress,
      TOKEN_ID,
      collector.address,
    );

    collectorRoyalties =
      await collectorRoyaltyController.getCollectorRoyaltyPayees(
        nftAddress,
        TOKEN_ID,
        COLLECTOR_ROYALTY_BPS_ARRAY,
        nftPrice,
      );

    collectorOneRoyalty =
      await collectorRoyaltyController.getCollectorRoyaltyPayee(
        nftAddress,
        TOKEN_ID,
        collectorOneIndex,
        COLLECTOR_ONE_ROYALTY_BPS,
        nftPrice,
      );

    expectedCollectorOneAmount =
      (nftPrice * BigInt(COLLECTOR_ONE_ROYALTY_BPS)) / BigInt(10000);

    expect(collectorRoyalties).to.have.length(1);
    expect(collectorRoyalties[collectorOneIndex][0]).to.equal(
      collector.address,
    );
    expect(collectorRoyalties[collectorOneIndex][1]).to.equal(
      COLLECTOR_ONE_ROYALTY_BPS,
    );
    expect(collectorRoyalties[collectorOneIndex][2]).to.equal(
      expectedCollectorOneAmount,
    );

    expect(collectorOneRoyalty[0]).to.equal(collector.address);
    expect(collectorOneRoyalty[1]).to.equal(COLLECTOR_ONE_ROYALTY_BPS);
    expect(collectorOneRoyalty[2]).to.equal(expectedCollectorOneAmount);
  });

  it("Should prevent unauthorized entity from setting collector royalty storage", async () => {
    const {
      collectorRoyaltyController,
      collector,
      ourkiveMusicTokenV2,
      adminRole,
    } = await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    await expect(
      collectorRoyaltyController
        .connect(collector)
        .setCollectorRoyaltyStorage(collector.address),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should prevent unauthorized entity from setting collector royalties", async () => {
    const {
      collectorRoyaltyController,
      collector,
      ourkiveMusicTokenV2,
      collectorRoyaltyControllerAuthorizedRole,
    } = await loadFixture(beforeEachFixture);

    const nftAddress = await ourkiveMusicTokenV2.getAddress();

    await expect(
      collectorRoyaltyController
        .connect(collector)
        .setCollectorRoyaltyRecipients(nftAddress, TOKEN_ID, []),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(
        collector.address,
        collectorRoyaltyControllerAuthorizedRole,
      ),
    );
  });
});
