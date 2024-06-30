import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployOurkiveMusicTokenV3 } from "../../test_utils/deployFixtures";
import { DEFAULT_ARTIST_ROYALTY_BASIS_POINTS } from "../../test_utils/constants";

describe("OurkiveMusicTokenV3", () => {
  const beforeEachFixture = async () => {
    const [owner, marketplace, artist, collector, collectorTwo] =
      await ethers.getSigners();

    const { ourkiveMusicTokenV3 } = await deployOurkiveMusicTokenV3(
      owner,
      artist.address,
      DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
    );

    return {
      ourkiveMusicTokenV3,
      owner,
      marketplace,
      artist,
      collector,
      collectorTwo,
    };
  };

  /*********** 1 ***********/
  it("Should mint and set URI correctly", async () => {
    const { ourkiveMusicTokenV3, owner, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(owner.address);
    await ourkiveMusicTokenV3.safeMintAndApprovalForAll(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );

    const tokenURI = await ourkiveMusicTokenV3.tokenURI(0);
    const tokenOwner = await ourkiveMusicTokenV3.ownerOf(0);
    expect(tokenOwner).to.equal(owner.address);
    expect(tokenURI).to.equal("https://example.com/token/0");
  });

  /*********** 2 ***********/
  it("Should not allow multiple minting", async () => {
    const { ourkiveMusicTokenV3, owner, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(owner.address);
    await ourkiveMusicTokenV3.safeMintAndApprovalForAll(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );

    await expect(
      ourkiveMusicTokenV3.safeMintAndApprovalForAll(
        owner.address,
        1,
        "https://example.com/token/1",
        marketplace.address,
      ),
    ).to.be.revertedWith("Token ID must be zero");
  });

  /*********** 3 ***********/
  it("Should approve marketplace", async () => {
    const { ourkiveMusicTokenV3, owner, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(owner.address);
    await ourkiveMusicTokenV3.safeMintAndApprovalForAll(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );
    await ourkiveMusicTokenV3.approve(marketplace.address, 0);

    const approvedAddress = await ourkiveMusicTokenV3.getApproved(0);
    expect(approvedAddress).to.equal(marketplace.address);
  });

  /*********** 4 ***********/
  it("Should setApprovalForAll for marketplace", async () => {
    const { ourkiveMusicTokenV3, owner, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setApprovalForAll(marketplace.address, true);

    const isApprovedForAll = await ourkiveMusicTokenV3.isApprovedForAll(
      owner.address,
      marketplace.address,
    );
    expect(isApprovedForAll).to.be.true;
  });

  /*********** 8 ***********/
  it("Should not allow non-owner to set the artist address", async () => {
    const { ourkiveMusicTokenV3, artist } =
      await loadFixture(beforeEachFixture);
    await expect(
      ourkiveMusicTokenV3.connect(artist).getFunction("setArtistAddress")(
        ethers.ZeroAddress,
      ),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  /*********** 9 ***********/
  it("Should not set a zero address as artist address", async () => {
    const { ourkiveMusicTokenV3 } = await loadFixture(beforeEachFixture);
    await expect(
      ourkiveMusicTokenV3.setArtistAddress(ethers.ZeroAddress),
    ).to.be.revertedWith("Artist address cannot be zero");
  });

  /*********** 10 ***********/
  it("Should not allow minting if artist address is different from the set artist address", async () => {
    const { ourkiveMusicTokenV3, owner, artist, collector } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(collector.address);
    await expect(
      ourkiveMusicTokenV3
        .connect(artist)
        .getFunction("safeMintAndApprovalForAll")(
        artist.address,
        0,
        "https://example.com/token/0",
        owner.address,
      ),
    ).to.be.revertedWith("Only artist can mint");
  });

  /*********** 11 ***********/
  it("Should not allow burning if caller is not the owner as Ourkive", async () => {
    const { ourkiveMusicTokenV3, owner, artist } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Try to burn the token as Ourkive
    await expect(ourkiveMusicTokenV3.burn(0)).to.be.revertedWith(
      "Only the token owner can burn",
    );
  });

  /*********** 12 ***********/
  it("Should not allow burning if caller is not the owner as the artist", async () => {
    const { ourkiveMusicTokenV3, owner, artist } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to the original owner
    await ourkiveMusicTokenV3.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      owner.address,
      0,
    );

    // Try to burn the token as the artist
    await expect(
      ourkiveMusicTokenV3.connect(artist).getFunction("burn")(0),
    ).to.be.revertedWith("Only the token owner can burn");
  });

  /*********** 13 ***********/
  it("Should not allow burning an already burned token", async () => {
    const { ourkiveMusicTokenV3, owner, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(owner.address);
    await ourkiveMusicTokenV3.safeMintAndApprovalForAll(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );

    // Burn the token as the owner
    await ourkiveMusicTokenV3.burn(0);
    await expect(ourkiveMusicTokenV3.burn(0)).to.be.revertedWith(
      "ERC721: invalid token ID",
    );
  });

  /*********** 14 ***********/
  it("Should not allow minting, returning, burning and minting the same token via safeMintAndApprovalForAll", async () => {
    const { ourkiveMusicTokenV3, owner, artist, collector } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV3.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Return the token to the owner
    await ourkiveMusicTokenV3
      .connect(collector)
      .getFunction("safeTransferFrom")(collector.address, owner.address, 0);

    // Burn the token as the owner
    await ourkiveMusicTokenV3.burn(0);

    // Mint the token again
    await ourkiveMusicTokenV3
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );
    await expect(
      ourkiveMusicTokenV3
        .connect(owner)
        .getFunction("safeMintAndApprovalForAll")(
        artist.address,
        0,
        "https://example.com/token/0",
        owner.address,
      ),
    ).to.be.revertedWith("ERC721: token already minted");
  });

  /*********** 15 ***********/
  it("Should not allow to mint, return, burn and mint the same token as artist", async () => {
    const { ourkiveMusicTokenV3, owner, artist, collector } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV3.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Return the token to the owner
    await ourkiveMusicTokenV3
      .connect(collector)
      .getFunction("safeTransferFrom")(collector.address, owner.address, 0);

    // Burn the token as the owner
    await ourkiveMusicTokenV3.burn(0);

    // Mint the token again
    await ourkiveMusicTokenV3
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );
    await expect(
      ourkiveMusicTokenV3
        .connect(artist)
        .getFunction("safeMintAndApprovalForAll")(
        artist.address,
        0,
        "https://example.com/token/0",
        owner.address,
      ),
    ).to.be.revertedWith("ERC721: token already minted");
  });

  /*********** 16 ***********/
  it("Should be able to mint, return, burn and mint the same token", async () => {
    const { ourkiveMusicTokenV3, owner, artist, collector, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV3.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Return the token to the owner
    await ourkiveMusicTokenV3
      .connect(collector)
      .getFunction("safeTransferFrom")(collector.address, owner.address, 0);

    // Burn the token as the owner
    await ourkiveMusicTokenV3.burn(0);

    // Mint the token again
    await ourkiveMusicTokenV3.safeMintAndApprovalForAll(
      artist.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );
    expect(await ourkiveMusicTokenV3.ownerOf(0)).to.equal(artist.address);
  });

  /* Resale */
  /*********** 17 ***********/
  it("Should be able to transfer from one collector to another", async () => {
    const { ourkiveMusicTokenV3, owner, artist, collector, collectorTwo } =
      await loadFixture(beforeEachFixture);

    // Minting
    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV3.getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Transfer the token to another collector
    await ourkiveMusicTokenV3
      .connect(collector)
      .getFunction("safeTransferFrom")(
      collector.address,
      collectorTwo.address,
      0,
    );

    expect(await ourkiveMusicTokenV3.ownerOf(0)).to.equal(collectorTwo.address);

    // Transfer the token back to the first collector
    await ourkiveMusicTokenV3
      .connect(collectorTwo)
      .getFunction("safeTransferFrom")(
      collectorTwo.address,
      collector.address,
      0,
    );

    expect(await ourkiveMusicTokenV3.ownerOf(0)).to.equal(collector.address);
  });

  /*********** 18 ***********/
  it("Should be able to sell the token to another marketplace and burn the token", async () => {
    const {
      ourkiveMusicTokenV3,
      owner,
      artist,
      marketplace,
      collector,
      collectorTwo,
    } = await loadFixture(beforeEachFixture);

    // Minting
    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV3.getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Approve the marketplace
    await ourkiveMusicTokenV3
      .connect(collector)
      .getFunction("setApprovalForAll")(marketplace.address, true);

    // Transfer the token to another collector
    await ourkiveMusicTokenV3
      .connect(marketplace)
      .getFunction("safeTransferFrom")(
      collector.address,
      collectorTwo.address,
      0,
    );

    expect(await ourkiveMusicTokenV3.ownerOf(0)).to.equal(collectorTwo.address);

    // Burn the token
    await ourkiveMusicTokenV3.connect(collectorTwo).getFunction("burn")(0);

    expect(await ourkiveMusicTokenV3.balanceOf(collectorTwo.address)).to.equal(
      0,
    );
  });

  /*********** 19 ***********/
  it("Should be able to mint, return, burn and mint the same token and sell it to another marketplace and burn", async () => {
    const {
      ourkiveMusicTokenV3,
      owner,
      artist,
      collector,
      marketplace,
      collectorTwo,
    } = await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV3.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Return the token to the owner
    await ourkiveMusicTokenV3
      .connect(collector)
      .getFunction("safeTransferFrom")(collector.address, owner.address, 0);

    // Burn the token as the owner
    await ourkiveMusicTokenV3.burn(0);

    // Mint the token again
    await ourkiveMusicTokenV3.safeMintAndApprovalForAll(
      artist.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );
    expect(await ourkiveMusicTokenV3.ownerOf(0)).to.equal(artist.address);

    // Transfer the token to a collector
    await ourkiveMusicTokenV3.getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Approve the marketplace
    await ourkiveMusicTokenV3
      .connect(collector)
      .getFunction("setApprovalForAll")(marketplace.address, true);

    // Transfer the token to another collector
    await ourkiveMusicTokenV3
      .connect(marketplace)
      .getFunction("safeTransferFrom")(
      collector.address,
      collectorTwo.address,
      0,
    );

    expect(await ourkiveMusicTokenV3.ownerOf(0)).to.equal(collectorTwo.address);

    // Burn the token
    await ourkiveMusicTokenV3.connect(collectorTwo).getFunction("burn")(0);

    expect(await ourkiveMusicTokenV3.balanceOf(collectorTwo.address)).to.equal(
      0,
    );
  });

  it("Should persist royalty changes across multiple transfers", async () => {
    const { ourkiveMusicTokenV3, owner, artist, collector, marketplace } =
      await loadFixture(beforeEachFixture);

    // Check initial royalty info
    const initialRoyaltyInfo = await ourkiveMusicTokenV3.royaltyInfo(
      0,
      ethers.parseEther("1000"),
    );
    expect(initialRoyaltyInfo[0]).to.equal(artist.address);
    expect(initialRoyaltyInfo[1].toString()).to.equal(
      ethers.parseEther("100").toString(),
    );

    // Initial mint
    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3.safeMintAndApprovalForAll(
      artist.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );

    // Transfer token and verify updated royalty info
    await ourkiveMusicTokenV3.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      owner.address,
      0,
    );
    const updatedRoyaltyInfo = await ourkiveMusicTokenV3.royaltyInfo(
      0,
      ethers.parseEther("1000"),
    );
    expect(updatedRoyaltyInfo[0]).to.equal(artist.address);
    expect(updatedRoyaltyInfo[1].toString()).to.equal(
      ethers.parseEther("100").toString(),
    );
  });

  it("Should prevent updating artist royalty once it‘s minted", async () => {
    const { ourkiveMusicTokenV3, owner, artist, collector, marketplace } =
      await loadFixture(beforeEachFixture);

    await ourkiveMusicTokenV3.setArtistAddress(artist.address);
    await ourkiveMusicTokenV3.safeMintAndApprovalForAll(
      artist.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );

    // Should revert on updating artist royalty
    const newRoyaltyRecipient = owner.address;
    const newRoyaltyBps = 200; // 2%
    await expect(
      ourkiveMusicTokenV3.setRoyalty(0, newRoyaltyRecipient, newRoyaltyBps),
    ).to.be.revertedWith("Cannot update artist royalty once the NFT is minted");
  });
});
