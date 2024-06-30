import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveKillswitchUpgradeable,
} from "../../test_utils/deployFixtures";
import { insertToKillswitchRole } from "../../test_utils/access/OurkiveAccessControlUpgradeable";

describe("OurkiveKillswitchUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner, artist, collector, collectorTwo] = await ethers.getSigners();

    const { accessControl } = await deployOurkiveAccessControlUpgradeable();
    const { killswitch } = await deployOurkiveKillswitchUpgradeable(
      accessControl
    );

    await insertToKillswitchRole(accessControl, {
      address: await killswitch.getAddress(),
    });

    return {
      owner,
      artist,
      collector,
      collectorTwo,
      accessControl,
      killswitch,
    };
  };

  it("Check if the killswitch works as expected", async () => {
    const { killswitch } = await loadFixture(beforeEachFixture);

    // Make sure the killswitch is on by default
    let isPaused = await killswitch.paused();
    expect(isPaused).to.equal(false);

    // Turn off the killswitch
    await killswitch.pause();

    // Check if it's paused
    isPaused = await killswitch.paused();
    expect(isPaused).to.equal(true);

    // Turn the killswitch back on
    await killswitch.unpause();

    // Check if it's unpaused
    isPaused = await killswitch.paused();
    expect(isPaused).to.equal(false);
  });
});
