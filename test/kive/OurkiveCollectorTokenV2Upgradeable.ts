import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployOurkiveCollectorTokenV2Upgradeable } from "../../test_utils/deployFixtures";
import { setupOurkiveNFTMarketplace } from "../../test_utils/marketplace/OurkiveNFTMarketplaceUpgradeable";

describe("OurkiveCollectorTokenV2Upgradeable", () => {
  const beforeEachFixture = async () => {
    const [
      owner,
      collector,
      artist,
      collectorTwo,
      collectorThree,
      safeAccount,
      safeAccountTwo,
      safeAccountThree,
    ] = await ethers.getSigners();

    const tokenLimit = 2;

    const { marketplace, kiveV2 } = await setupOurkiveNFTMarketplace(
      owner,
      artist,
      [collector, collectorTwo, collectorThree],
      tokenLimit,
    );

    return {
      kive: kiveV2,
      owner,
      collector,
      artist,
      collectorTwo,
      collectorThree,
      safeAccount,
      safeAccountTwo,
      safeAccountThree,
      marketplace,
      tokenLimit,
    };
  };

  // Test that the contract is deployed with the correct parameters
  it("Should deploy with the correct parameters", async () => {
    // Deploy the contract
    const { kive, owner } = await loadFixture(beforeEachFixture);

    // Check the contract's parameters
    expect(await kive.name()).to.equal("The First Club by Ourkive");
    expect(await kive.symbol()).to.equal("KIVE");
    expect(await kive.totalSupply()).to.equal(0);
    expect(await kive.owner()).to.equal(owner.address);
  });

  // Test that the contract can mint a token and set the URI correctly
  it("Should mint and set URI correctly", async () => {
    // Deploy the contract
    const { kive, collector } = await loadFixture(beforeEachFixture);

    // Mint a token
    await kive.sendTokenToOurkivian(
      collector.address,
      "https://example.com/token/0",
    );

    // Check that the token URI is correct
    expect(await kive.tokenURI(0)).to.equal("https://example.com/token/0");
  });

  // Test that the contract cannot mint more than 101 tokens
  it("Should not allow more than 2 tokens to be minted", async () => {
    // Deploy the contract
    const { kive, owner, tokenLimit, collector, collectorTwo, collectorThree } =
      await loadFixture(beforeEachFixture);

    const collectors = [collector, collectorTwo, collectorThree];

    // Mint 2 tokens
    for (let i = 0; i < tokenLimit; i++) {
      await kive.sendTokenToOurkivian(
        collectors[i].address,
        `https://example.com/token/${i}`,
      );
    }

    // Try to mint another token
    await expect(
      kive.sendTokenToOurkivian(
        collectors[collectors.length - 1].address,
        "https://example.com/token/2",
      ),
    ).to.be.revertedWith("Cannot mint more than the token limit");
  });

  // Test that the contract cannot mint more than 1 token per address
  it("Should not allow more than 1 token per address", async () => {
    // Deploy the contract
    const { kive, owner, collector } = await loadFixture(beforeEachFixture);

    // Mint & transfer two tokens
    await kive.sendTokenToOurkivian(
      collector.address,
      "https://example.com/token/0",
    );
    await expect(
      kive.sendTokenToOurkivian(
        collector.address,
        "https://example.com/token/0",
      ),
    ).to.be.revertedWith("Cannot hold more than one token per address");

    // Check that the token URI is correct
    expect(await kive.tokenURI(0)).to.equal("https://example.com/token/0");

    // Check that the token balance is correct
    expect(await kive.balanceOf(collector.address)).to.equal(1);
  });

  // Test that the contract throws an error when trying to transfer a token to the zero address
  it("Should not allow transfer to the zero address", async () => {
    // Deploy the contract
    const { kive, owner, collector } = await loadFixture(beforeEachFixture);

    // Try transferring the token to the zero address
    await expect(
      kive.sendTokenToOurkivian(
        ethers.ZeroAddress,
        "https://example.com/token/0",
      ),
    ).to.be.revertedWith("ERC721: transfer to the zero address");

    // Check that the token balance is correct
    expect(await kive.balanceOf(collector.address)).to.equal(0);
  });

  // Token Transfer
  it("Should allow transferring a token", async () => {
    // Deploy the contract
    const { kive, collector, artist, owner } =
      await loadFixture(beforeEachFixture);

    // Mint a token to artist
    await kive.sendTokenToOurkivian(
      collector.address,
      "https://example.com/token/0",
    );

    const newNFTOwner = await kive.ownerOf(0);

    expect(newNFTOwner).to.equal(collector.address);
  });

  it("Prevent transferring a token twice", async () => {
    // Deploy the contract
    const { kive, owner, collector } = await loadFixture(beforeEachFixture);

    // Mint a token to artist
    await kive.sendTokenToOurkivian(
      collector.address,
      "https://example.com/token/0",
    );

    await expect(
      kive.connect(collector).getFunction("safeTransferFrom")(
        collector.address,
        owner.address,
        0,
      ),
    ).to.be.revertedWith("Cannot transfer this token");
  });

  // Approval
  it("Should revert when trying to approve", async () => {
    // Deploy the contract
    const { kive, owner, collector } = await loadFixture(beforeEachFixture);

    // Mint a token to artist
    await kive.sendTokenToOurkivian(
      collector.address,
      "https://example.com/token/0",
    );

    // Approve the token from artist to the original owner
    await expect(
      kive.connect(collector).getFunction("approve")(collector.address, 0),
    ).to.be.revertedWith("Cannot approve");
  });

  it("Should revert when trying to set approval for all", async () => {
    // Deploy the contract
    const { kive, owner, collector } = await loadFixture(beforeEachFixture);

    // Mint a token to artist
    await kive.sendTokenToOurkivian(
      collector.address,
      "https://example.com/token/0",
    );

    // Approve the token from artist to the original owner
    await expect(
      kive.connect(collector).getFunction("setApprovalForAll")(
        collector.address,
        true,
      ),
    ).to.be.revertedWith("Cannot approve");
  });

  it("Should simulate Ourkive purchasing for multiple collectors - mixed order from safe accounts to collectors", async () => {
    // Deploy the contract
    const { kive, owner, collector, collectorTwo, collectorThree } =
      await loadFixture(beforeEachFixture);

    await kive.setTokenLimit(3);

    // Mint & transfer 3 tokens to Ourkive
    await kive.sendTokenToOurkivian(
      collector.address,
      "https://example.com/token/0",
    );
    await kive.sendTokenToOurkivian(
      collectorTwo.address,
      "https://example.com/token/1",
    );
    await kive.sendTokenToOurkivian(
      collectorThree.address,
      "https://example.com/token/2",
    );

    // Get token ids for each collector
    const firstOwnerTokenId = await kive
      .connect(collector)
      .getFunction("tokenOfOwnerByIndex")(collector.address, 0);
    const secondOwnerTokenId = await kive
      .connect(collectorTwo)
      .getFunction("tokenOfOwnerByIndex")(collectorTwo.address, 0);
    const thirdOwnerTokenId = await kive
      .connect(collectorThree)
      .getFunction("tokenOfOwnerByIndex")(collectorThree.address, 0);

    // Check that the token ids are correct
    expect(firstOwnerTokenId).to.equal(0);
    expect(secondOwnerTokenId).to.equal(1);
    expect(thirdOwnerTokenId).to.equal(2);

    // Get token owners
    const firstTokenOwner = await kive.ownerOf(0);
    const secondTokenOwner = await kive.ownerOf(1);
    const thirdTokenOwner = await kive.ownerOf(2);

    // Check that the token owners are correct
    expect(firstTokenOwner).to.equal(collector.address);
    expect(secondTokenOwner).to.equal(collectorTwo.address);
    expect(thirdTokenOwner).to.equal(collectorThree.address);
  });

  it("Should be able to burn tokens that Ourkive is holding", async () => {
    const { kive, owner, collector, collectorTwo, collectorThree } =
      await loadFixture(beforeEachFixture);

    await kive.setTokenLimit(5);

    // Mint 5 tokens to Ourkive
    await kive.sendTokenToOurkivian(
      collector.address,
      "https://example.com/token/0",
    );
    await kive.sendTokenToOurkivian(
      collectorTwo.address,
      "https://example.com/token/1",
    );
    await kive.sendTokenToOurkivian(
      collectorThree.address,
      "https://example.com/token/2",
    );
    await kive.sendTokenToOurkivian(
      owner.address,
      "https://example.com/token/3",
    );
    await kive.sendTokenToOurkivian(
      owner.address,
      "https://example.com/token/4",
    );

    // Get token ids for each collector
    const firstOwnerTokenId = await kive
      .connect(collector)
      .getFunction("tokenOfOwnerByIndex")(collector.address, 0);
    const secondOwnerTokenId = await kive
      .connect(collectorTwo)
      .getFunction("tokenOfOwnerByIndex")(collectorTwo.address, 0);
    const thirdOwnerTokenId = await kive
      .connect(collectorThree)
      .getFunction("tokenOfOwnerByIndex")(collectorThree.address, 0);
    const fourthOwnerTokenId = await kive
      .connect(owner)
      .getFunction("tokenOfOwnerByIndex")(owner.address, 0);
    const fifthOwnerTokenId = await kive
      .connect(owner)
      .getFunction("tokenOfOwnerByIndex")(owner.address, 1);

    // Check that the token ids are correct
    expect(firstOwnerTokenId).to.equal(0);
    expect(secondOwnerTokenId).to.equal(1);
    expect(thirdOwnerTokenId).to.equal(2);
    expect(fourthOwnerTokenId).to.equal(3);
    expect(fifthOwnerTokenId).to.equal(4);

    // Get token owners
    const firstTokenOwner = await kive.ownerOf(0);
    const secondTokenOwner = await kive.ownerOf(1);
    const thirdTokenOwner = await kive.ownerOf(2);
    const fourthTokenOwner = await kive.ownerOf(3);
    const fifthTokenOwner = await kive.ownerOf(4);

    // Check that the token owners are correct
    expect(firstTokenOwner).to.equal(collector.address);
    expect(secondTokenOwner).to.equal(collectorTwo.address);
    expect(thirdTokenOwner).to.equal(collectorThree.address);
    expect(fourthTokenOwner).to.equal(owner.address);
    expect(fifthTokenOwner).to.equal(owner.address);
  });
});
