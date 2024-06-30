import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveKillswitchUpgradeable,
  deployOurkiveNFTAllowlistUpgradeable,
} from "../../test_utils/deployFixtures";
import {
  OurkiveAccessControlUpgradeable,
  OurkiveKillswitchUpgradeable,
} from "../../typechain";
import getUnauthorizedErrorMessage from "../../test_utils/access/getUnauthorizedErrorMessage";

describe("OurkiveNFTAllowlistUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner, nft, artist] = await ethers.getSigners();

    const { accessControl: ac } = await deployOurkiveAccessControlUpgradeable();

    const accessControl = ac as unknown as OurkiveAccessControlUpgradeable;

    await accessControl.insertToNFTAllowlistAuthorizedRole(owner.address);

    const nftAllowlistAuthorizedRole =
      await accessControl.NFT_ALLOWLIST_AUTHORIZED_ROLE();

    const { killswitch: ks } =
      await deployOurkiveKillswitchUpgradeable(accessControl);

    const killswitch = ks as unknown as OurkiveKillswitchUpgradeable;

    const { nftAllowlist } = await deployOurkiveNFTAllowlistUpgradeable(
      accessControl,
      killswitch,
    );

    return {
      nftAllowlist,
      owner,
      nft,
      artist,
      accessControl,
      killswitch,
      nftAllowlistAuthorizedRole,
    };
  };

  it("Should initialize correctly with given parameters", async () => {
    const { nftAllowlist } = await loadFixture(beforeEachFixture);
    // Check if the contract address is set (indicating deployment and initialization were successful)
    expect(await nftAllowlist.getAddress()).to.not.be.undefined;
  });

  it("Should prevent reinitialization", async () => {
    const { nftAllowlist, accessControl, killswitch } =
      await loadFixture(beforeEachFixture);
    // Attempt to reinitialize and expect a revert
    await expect(
      nftAllowlist.initialize(
        await accessControl.getAddress(),
        await killswitch.getAddress(),
      ),
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Should allowlist valid nft", async () => {
    const { nftAllowlist, nft } = await loadFixture(beforeEachFixture);

    await nftAllowlist.allowlistNFT(nft.address, 0);

    const isNFTAllowlisted = await nftAllowlist.allowlistedNFTs(nft.address, 0);
    expect(isNFTAllowlisted).to.equal(true);
  });

  it("Should remove an nft from the allowlist", async () => {
    const { nftAllowlist, nft } = await loadFixture(beforeEachFixture);

    await nftAllowlist.allowlistNFT(nft.address, 0);

    let isNFTAllowlisted = await nftAllowlist.allowlistedNFTs(nft.address, 0);
    expect(isNFTAllowlisted).to.equal(true);

    await nftAllowlist.removeNFT(nft.address, 0);

    isNFTAllowlisted = await nftAllowlist.allowlistedNFTs(nft.address, 0);
    expect(isNFTAllowlisted).to.equal(false);
  });

  it("Should revert if the nft address is the zero address", async () => {
    const { nftAllowlist } = await loadFixture(beforeEachFixture);
    await expect(
      nftAllowlist.allowlistNFT(ethers.ZeroAddress, 0),
    ).to.be.revertedWith("NFT address should not be zero");
  });

  it("Should revert if the caller is not authorized", async () => {
    const { nftAllowlist, artist, nft, nftAllowlistAuthorizedRole } =
      await loadFixture(beforeEachFixture);

    await expect(
      nftAllowlist.connect(artist).allowlistNFT(nft.address, 0),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(artist.address, nftAllowlistAuthorizedRole),
    );

    await expect(
      nftAllowlist.connect(artist).removeNFT(nft.address, 0),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(artist.address, nftAllowlistAuthorizedRole),
    );
  });
});
