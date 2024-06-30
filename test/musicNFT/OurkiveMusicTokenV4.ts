import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployOurkiveMusicTokenV4 } from "../../test_utils/deployFixtures";
import { DEFAULT_ARTIST_ROYALTY_BASIS_POINTS } from "../../test_utils/constants";

describe("OurkiveMusicTokenV4", () => {
  const beforeEachFixture = async () => {
    const [owner, marketplace, artist, collector, collectorTwo] =
      await ethers.getSigners();

    const { ourkiveMusicTokenV4 } = await deployOurkiveMusicTokenV4(
      owner,
      artist.address,
      DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
    );

    return {
      ourkiveMusicTokenV4,
      owner,
      marketplace,
      artist,
      collector,
      collectorTwo,
    };
  };

  /*********** 1 ***********/
  it("Should mint and set URI correctly", async () => {
    const { ourkiveMusicTokenV4, owner, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setArtistAddress(owner.address);
    await ourkiveMusicTokenV4.safeMintAndApprove(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );

    const tokenURI = await ourkiveMusicTokenV4.tokenURI(0);
    const tokenOwner = await ourkiveMusicTokenV4.ownerOf(0);
    expect(tokenOwner).to.equal(owner.address);
    expect(tokenURI).to.equal("https://example.com/token/0");
  });

  /*********** 2 ***********/
  it("Should allow multiple minting", async () => {
    const { ourkiveMusicTokenV4, owner, marketplace } =
      await loadFixture(beforeEachFixture);

    const tokenOneUri = "https://example.com/token/0";
    const tokenTwoUri = "https://example.com/token/1";

    await ourkiveMusicTokenV4.setArtistAddress(owner.address);
    await ourkiveMusicTokenV4.safeMintAndApprove(
      owner.address,
      0,
      tokenOneUri,
      marketplace.address,
    );

    await ourkiveMusicTokenV4.safeMintAndApprove(
      owner.address,
      1,
      tokenTwoUri,
      marketplace.address,
    );

    let tokenOwner = await ourkiveMusicTokenV4.ownerOf(0);
    expect(tokenOwner).to.equal(owner.address);
    tokenOwner = await ourkiveMusicTokenV4.ownerOf(1);
    expect(tokenOwner).to.equal(owner.address);

    let tokenUri = await ourkiveMusicTokenV4.tokenURI(0);
    expect(tokenUri).to.equal(tokenOneUri);
    tokenUri = await ourkiveMusicTokenV4.tokenURI(1);
    expect(tokenUri).to.equal(tokenTwoUri);
  });

  it("Should not allow minting the same token twice", async () => {
    const { ourkiveMusicTokenV4, owner, marketplace } =
      await loadFixture(beforeEachFixture);

    const tokenOneUri = "https://example.com/token/0";

    await ourkiveMusicTokenV4.setArtistAddress(owner.address);
    await ourkiveMusicTokenV4.safeMintAndApprove(
      owner.address,
      0,
      tokenOneUri,
      marketplace.address,
    );

    await expect(
      ourkiveMusicTokenV4.safeMintAndApprove(
        owner.address,
        0,
        tokenOneUri,
        marketplace.address,
      ),
    ).to.be.revertedWith("ERC721: token already minted");
  });

  /*********** 3 ***********/
  it("Should approve marketplace", async () => {
    const { ourkiveMusicTokenV4, owner, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setArtistAddress(owner.address);
    await ourkiveMusicTokenV4.safeMintAndApprove(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );
    await ourkiveMusicTokenV4.approve(marketplace.address, 0);

    const approvedAddress = await ourkiveMusicTokenV4.getApproved(0);
    expect(approvedAddress).to.equal(marketplace.address);
  });

  /*********** 4 ***********/
  it("Should setApprovalForAll for marketplace", async () => {
    const { ourkiveMusicTokenV4, owner, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setApprovalForAll(marketplace.address, true);

    const isApprovedForAll = await ourkiveMusicTokenV4.isApprovedForAll(
      owner.address,
      marketplace.address,
    );
    expect(isApprovedForAll).to.be.true;
  });

  it("Should approve for marketplace", async () => {
    const { ourkiveMusicTokenV4, owner, artist, marketplace } =
      await loadFixture(beforeEachFixture);

    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    await ourkiveMusicTokenV4.connect(artist).approve(marketplace.address, 0);

    const approvedMarketplace = await ourkiveMusicTokenV4.getApproved(0);
    expect(approvedMarketplace).to.equal(marketplace.address);
  });

  /*********** 8 ***********/
  it("Should not allow non-owner to set the artist address", async () => {
    const { ourkiveMusicTokenV4, artist } =
      await loadFixture(beforeEachFixture);
    await expect(
      ourkiveMusicTokenV4.connect(artist).getFunction("setArtistAddress")(
        ethers.ZeroAddress,
      ),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  /*********** 9 ***********/
  it("Should not set a zero address as artist address", async () => {
    const { ourkiveMusicTokenV4 } = await loadFixture(beforeEachFixture);
    await expect(
      ourkiveMusicTokenV4.setArtistAddress(ethers.ZeroAddress),
    ).to.be.revertedWith("Artist address cannot be zero");
  });

  /*********** 10 ***********/
  it("Should not allow minting if artist address is different from the set artist address", async () => {
    const { ourkiveMusicTokenV4, owner, artist, collector } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setArtistAddress(collector.address);
    await expect(
      ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
        artist.address,
        0,
        "https://example.com/token/0",
        owner.address,
      ),
    ).to.be.revertedWith("Only artist can mint");
  });

  /*********** 11 ***********/
  it("Should not allow burning if caller is not the owner as Ourkive", async () => {
    const { ourkiveMusicTokenV4, owner, artist } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Try to burn the token as Ourkive
    await expect(ourkiveMusicTokenV4.burn(0)).to.be.revertedWith(
      "Only the token owner can burn",
    );
  });

  /*********** 12 ***********/
  it("Should not allow burning if caller is not the owner as the artist", async () => {
    const { ourkiveMusicTokenV4, owner, artist } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to the original owner
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      owner.address,
      0,
    );

    // Try to burn the token as the artist
    await expect(
      ourkiveMusicTokenV4.connect(artist).getFunction("burn")(0),
    ).to.be.revertedWith("Only the token owner can burn");
  });

  /*********** 13 ***********/
  it("Should not allow burning an already burned token", async () => {
    const { ourkiveMusicTokenV4, owner, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setArtistAddress(owner.address);
    await ourkiveMusicTokenV4.safeMintAndApprove(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address,
    );

    // Burn the token as the owner
    await ourkiveMusicTokenV4.burn(0);
    await expect(ourkiveMusicTokenV4.burn(0)).to.be.revertedWith(
      "ERC721: invalid token ID",
    );
  });

  /*********** 14 ***********/
  it("Should not allow minting, returning, burning and minting the same token via safeMintAndApprove", async () => {
    const { ourkiveMusicTokenV4, owner, artist, collector } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Return the token to the owner
    await ourkiveMusicTokenV4
      .connect(collector)
      .getFunction("safeTransferFrom")(collector.address, owner.address, 0);

    // Burn the token as the owner
    await ourkiveMusicTokenV4.burn(0);

    // Mint the token again
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );
    await expect(
      ourkiveMusicTokenV4.connect(owner).getFunction("safeMintAndApprove")(
        artist.address,
        0,
        "https://example.com/token/0",
        owner.address,
      ),
    ).to.be.revertedWith("ERC721: token already minted");
  });

  /*********** 15 ***********/
  it("Should not allow to mint, return, burn and mint the same token as artist", async () => {
    const { ourkiveMusicTokenV4, owner, artist, collector } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Return the token to the owner
    await ourkiveMusicTokenV4
      .connect(collector)
      .getFunction("safeTransferFrom")(collector.address, owner.address, 0);

    // Burn the token as the owner
    await ourkiveMusicTokenV4.burn(0);

    // Mint the token again
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );
    await expect(
      ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
        artist.address,
        0,
        "https://example.com/token/0",
        owner.address,
      ),
    ).to.be.revertedWith("ERC721: token already minted");
  });

  /*********** 16 ***********/
  it("Should be able to mint, return, burn and mint the same token", async () => {
    const { ourkiveMusicTokenV4, owner, artist, collector, marketplace } =
      await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Return the token to the owner
    await ourkiveMusicTokenV4
      .connect(collector)
      .getFunction("safeTransferFrom")(collector.address, owner.address, 0);

    // Burn the token as the owner
    await ourkiveMusicTokenV4.burn(0);

    // Mint the token again
    await ourkiveMusicTokenV4
      .connect(artist)
      .safeMintAndApprove(
        artist.address,
        0,
        "https://example.com/token/0",
        marketplace.address,
      );
    expect(await ourkiveMusicTokenV4.ownerOf(0)).to.equal(artist.address);
  });

  /* Resale */
  /*********** 17 ***********/
  it("Should be able to transfer from one collector to another", async () => {
    const { ourkiveMusicTokenV4, owner, artist, collector, collectorTwo } =
      await loadFixture(beforeEachFixture);

    // Minting
    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV4.getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Transfer the token to another collector
    await ourkiveMusicTokenV4
      .connect(collector)
      .getFunction("safeTransferFrom")(
      collector.address,
      collectorTwo.address,
      0,
    );

    expect(await ourkiveMusicTokenV4.ownerOf(0)).to.equal(collectorTwo.address);

    // Transfer the token back to the first collector
    await ourkiveMusicTokenV4
      .connect(collectorTwo)
      .getFunction("safeTransferFrom")(
      collectorTwo.address,
      collector.address,
      0,
    );

    expect(await ourkiveMusicTokenV4.ownerOf(0)).to.equal(collector.address);
  });

  /*********** 18 ***********/
  it("Should be able to sell the token to another marketplace and burn the token", async () => {
    const {
      ourkiveMusicTokenV4,
      owner,
      artist,
      marketplace,
      collector,
      collectorTwo,
    } = await loadFixture(beforeEachFixture);

    // Minting
    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV4.getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Approve the marketplace
    await ourkiveMusicTokenV4
      .connect(collector)
      .getFunction("setApprovalForAll")(marketplace.address, true);

    // Transfer the token to another collector
    await ourkiveMusicTokenV4
      .connect(marketplace)
      .getFunction("safeTransferFrom")(
      collector.address,
      collectorTwo.address,
      0,
    );

    expect(await ourkiveMusicTokenV4.ownerOf(0)).to.equal(collectorTwo.address);

    // Burn the token
    await ourkiveMusicTokenV4.connect(collectorTwo).getFunction("burn")(0);

    expect(await ourkiveMusicTokenV4.balanceOf(collectorTwo.address)).to.equal(
      0,
    );
  });

  /*********** 19 ***********/
  it("Should be able to mint, return, burn and mint the same token and sell it to another marketplace and burn", async () => {
    const {
      ourkiveMusicTokenV4,
      owner,
      artist,
      collector,
      marketplace,
      collectorTwo,
    } = await loadFixture(beforeEachFixture);
    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeMintAndApprove")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address,
    );

    // Transfer the token to a collector
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Return the token to the owner
    await ourkiveMusicTokenV4
      .connect(collector)
      .getFunction("safeTransferFrom")(collector.address, owner.address, 0);

    // Burn the token as the owner
    await ourkiveMusicTokenV4.burn(0);

    // Mint the token again
    await ourkiveMusicTokenV4
      .connect(artist)
      .safeMintAndApprove(
        artist.address,
        0,
        "https://example.com/token/0",
        marketplace.address,
      );
    expect(await ourkiveMusicTokenV4.ownerOf(0)).to.equal(artist.address);

    // Transfer the token to a collector
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      collector.address,
      0,
    );

    // Approve the marketplace
    await ourkiveMusicTokenV4.connect(collector).getFunction("approve")(
      marketplace.address,
      0,
    );

    // Transfer the token to another collector
    await ourkiveMusicTokenV4
      .connect(marketplace)
      .getFunction("safeTransferFrom")(
      collector.address,
      collectorTwo.address,
      0,
    );

    expect(await ourkiveMusicTokenV4.ownerOf(0)).to.equal(collectorTwo.address);

    // Burn the token
    await ourkiveMusicTokenV4.connect(collectorTwo).getFunction("burn")(0);

    expect(await ourkiveMusicTokenV4.balanceOf(collectorTwo.address)).to.equal(
      0,
    );
  });

  it("Should persist royalty changes across multiple transfers", async () => {
    const { ourkiveMusicTokenV4, owner, artist, collector, marketplace } =
      await loadFixture(beforeEachFixture);

    // Check initial royalty info
    const initialRoyaltyInfo = await ourkiveMusicTokenV4.royaltyInfo(
      0,
      ethers.parseEther("1000"),
    );
    expect(initialRoyaltyInfo[0]).to.equal(artist.address);
    expect(initialRoyaltyInfo[1].toString()).to.equal(
      ethers.parseEther("100").toString(),
    );

    // Initial mint
    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4
      .connect(artist)
      .safeMintAndApprove(
        artist.address,
        0,
        "https://example.com/token/0",
        marketplace.address,
      );

    // Transfer token and verify updated royalty info
    await ourkiveMusicTokenV4.connect(artist).getFunction("safeTransferFrom")(
      artist.address,
      owner.address,
      0,
    );
    const updatedRoyaltyInfo = await ourkiveMusicTokenV4.royaltyInfo(
      0,
      ethers.parseEther("1000"),
    );
    expect(updatedRoyaltyInfo[0]).to.equal(artist.address);
    expect(updatedRoyaltyInfo[1].toString()).to.equal(
      ethers.parseEther("100").toString(),
    );
  });

  it("Should prevent updating artist royalty once it‘s minted", async () => {
    const { ourkiveMusicTokenV4, owner, artist, collector, marketplace } =
      await loadFixture(beforeEachFixture);

    await ourkiveMusicTokenV4.setArtistAddress(artist.address);
    await ourkiveMusicTokenV4
      .connect(artist)
      .safeMintAndApprove(
        artist.address,
        0,
        "https://example.com/token/0",
        marketplace.address,
      );

    // Should revert on updating artist royalty
    const newRoyaltyRecipient = owner.address;
    const newRoyaltyBps = 200; // 2%
    await expect(
      ourkiveMusicTokenV4.setRoyalty(0, newRoyaltyRecipient, newRoyaltyBps),
    ).to.be.revertedWith("Cannot update artist royalty once the NFT is minted");
  });
});
