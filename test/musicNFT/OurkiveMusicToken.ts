import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("OurkiveMusicToken", () => {
  const deployTokenFixture = async (
    owner: HardhatEthersSigner,
    marketplace: Contract
  ) => {
    const ourkiveMusicToken = await ethers.deployContract("OurkiveMusicToken", [
      "OurkiveMusicToken",
      "KIVE",
      owner.address,
      1000, // Fee numerator
      await marketplace.getAddress(),
    ]);
    await ourkiveMusicToken.waitForDeployment();

    return { ourkiveMusicToken };
  };

  const deployAllowlistFixture = async (
    marketplaces: HardhatEthersSigner[]
  ) => {
    const allowlist = await ethers.deployContract(
      "OurkiveNftMarketplaceAllowlist"
    );
    await allowlist.waitForDeployment();

    for (let i = 0; i < marketplaces.length; i++) {
      await allowlist.addToAllowlist(marketplaces[i]);
    }

    return { allowlist };
  };

  const beforeEachFixture = async () => {
    const [owner, marketplace, artist, collector, collectorTwo] =
      await ethers.getSigners();

    const { allowlist } = await deployAllowlistFixture([marketplace, owner]);
    const { ourkiveMusicToken } = await deployTokenFixture(owner, allowlist);

    return {
      ourkiveMusicToken,
      owner,
      marketplace,
      allowlist,
      artist,
      collector,
      collectorTwo,
    };
  };

  /*********** 1 ***********/
  it("Should mint and set URI correctly", async () => {
    const { ourkiveMusicToken, owner, marketplace } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setArtistAddress(owner.address);
    await ourkiveMusicToken.safeMintAndApprovalForAll(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address
    );

    const tokenURI = await ourkiveMusicToken.tokenURI(0);
    const tokenOwner = await ourkiveMusicToken.ownerOf(0);
    expect(tokenOwner).to.equal(owner.address);
    expect(tokenURI).to.equal("https://example.com/token/0");
  });

  /*********** 2 ***********/
  it("Should not allow multiple minting", async () => {
    const { ourkiveMusicToken, owner, marketplace } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setArtistAddress(owner.address);
    await ourkiveMusicToken.safeMintAndApprovalForAll(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address
    );

    await expect(
      ourkiveMusicToken.safeMintAndApprovalForAll(
        owner.address,
        1,
        "https://example.com/token/1",
        marketplace.address
      )
    ).to.be.revertedWith("Already Minted NFT");
  });

  /*********** 3 ***********/
  it("Should approve marketplace", async () => {
    const { ourkiveMusicToken, owner, marketplace } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setArtistAddress(owner.address);
    await ourkiveMusicToken.safeMintAndApprovalForAll(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address
    );
    await ourkiveMusicToken.approve(marketplace.address, 0);

    const approvedAddress = await ourkiveMusicToken.getApproved(0);
    expect(approvedAddress).to.equal(marketplace.address);
  });

  /*********** 4 ***********/
  it("Should setApprovalForAll for marketplace", async () => {
    const { ourkiveMusicToken, owner, marketplace } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setApprovalForAll(marketplace.address, true);

    const isApprovedForAll = await ourkiveMusicToken.isApprovedForAll(
      owner.address,
      marketplace.address
    );
    expect(isApprovedForAll).to.be.true;
  });

  /*********** 5 ***********/
  it("Should not approve invalid marketplace", async () => {
    const { ourkiveMusicToken } = await loadFixture(beforeEachFixture);
    const invalidMarketplace = ethers.Wallet.createRandom().connect(
      ethers.provider
    );

    await expect(
      ourkiveMusicToken.connect(invalidMarketplace).getFunction("approve")(
        invalidMarketplace.address,
        0
      )
    ).to.be.revertedWith("Invalid marketplace, not allowed");
  });

  /*********** 6 ***********/
  it("Should not setApprovalForAll for invalid marketplace", async () => {
    const { ourkiveMusicToken } = await loadFixture(beforeEachFixture);
    const invalidMarketplace = ethers.Wallet.createRandom().connect(
      ethers.provider
    );

    await expect(
      ourkiveMusicToken
        .connect(invalidMarketplace)
        .getFunction("setApprovalForAll")(invalidMarketplace.address, true)
    ).to.be.revertedWith("Invalid marketplace, not allowed");
  });

  /*********** 7 ***********/
  it("Should not allow minting if artist address is not set", async () => {
    const { ourkiveMusicToken, artist, owner } = await loadFixture(
      beforeEachFixture
    );
    await expect(
      ourkiveMusicToken
        .connect(artist)
        .getFunction("safeMintAndApprovalForAll")(
        artist.address,
        0,
        "https://example.com/token/0",
        owner.address
      )
    ).to.be.revertedWith("Artist address is not set");
  });

  /*********** 8 ***********/
  it("Should not allow non-owner to set the artist address", async () => {
    const { ourkiveMusicToken, artist } = await loadFixture(beforeEachFixture);
    await expect(
      ourkiveMusicToken.connect(artist).getFunction("setArtistAddress")(
        ethers.ZeroAddress
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  /*********** 9 ***********/
  it("Should not set a zero address as artist address", async () => {
    const { ourkiveMusicToken } = await loadFixture(beforeEachFixture);
    await expect(
      ourkiveMusicToken.setArtistAddress(ethers.ZeroAddress)
    ).to.be.revertedWith("Artist address cannot be zero");
  });

  /*********** 10 ***********/
  it("Should not allow minting if artist address is different from the set artist address", async () => {
    const { ourkiveMusicToken, owner, artist, collector } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setArtistAddress(collector.address);
    await expect(
      ourkiveMusicToken
        .connect(artist)
        .getFunction("safeMintAndApprovalForAll")(
        artist.address,
        0,
        "https://example.com/token/0",
        owner.address
      )
    ).to.be.revertedWith("Only artist can mint");
  });

  /*********** 11 ***********/
  it("Should not allow burning if caller is not the owner as Ourkive", async () => {
    const { ourkiveMusicToken, owner, artist } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setArtistAddress(artist.address);
    await ourkiveMusicToken
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address
    );

    // Try to burn the token as Ourkive
    await expect(ourkiveMusicToken.burn(0)).to.be.revertedWith(
      "Only the token owner can burn"
    );
  });

  /*********** 12 ***********/
  it("Should not allow burning if caller is not the owner as the artist", async () => {
    const { ourkiveMusicToken, owner, artist } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setArtistAddress(artist.address);
    await ourkiveMusicToken
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address
    );

    // Transfer the token to the original owner
    await ourkiveMusicToken.connect(artist).getFunction("transferFrom")(
      artist.address,
      owner.address,
      0
    );

    // Try to burn the token as the artist
    await expect(
      ourkiveMusicToken.connect(artist).getFunction("burn")(0)
    ).to.be.revertedWith("Only the token owner can burn");
  });

  /*********** 13 ***********/
  it("Should not allow burning an already burned token", async () => {
    const { ourkiveMusicToken, owner, marketplace } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setArtistAddress(owner.address);
    await ourkiveMusicToken.safeMintAndApprovalForAll(
      owner.address,
      0,
      "https://example.com/token/0",
      marketplace.address
    );

    // Burn the token as the owner
    await ourkiveMusicToken.burn(0);
    await expect(ourkiveMusicToken.burn(0)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );
  });

  /*********** 14 ***********/
  it("Should not allow minting, returning, burning and minting the same token via safeMintAndApprovalForAll", async () => {
    const { ourkiveMusicToken, owner, artist, collector } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setArtistAddress(artist.address);
    await ourkiveMusicToken
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address
    );

    // Transfer the token to a collector
    await ourkiveMusicToken.connect(artist).getFunction("transferFrom")(
      artist.address,
      collector.address,
      0
    );

    // Return the token to the owner
    await ourkiveMusicToken.connect(collector).getFunction("transferFrom")(
      collector.address,
      owner.address,
      0
    );

    // Burn the token as the owner
    await ourkiveMusicToken.burn(0);

    // Mint the token again
    await expect(
      ourkiveMusicToken
        .connect(artist)
        .getFunction("safeMintAndApprovalForAll")(
        artist.address,
        0,
        "https://example.com/token/0",
        owner.address
      )
    ).to.be.revertedWith("Already Minted NFT");
    await expect(
      ourkiveMusicToken.connect(owner).getFunction("safeMintAndApprovalForAll")(
        artist.address,
        0,
        "https://example.com/token/0",
        owner.address
      )
    ).to.be.revertedWith("Already Minted NFT");
  });

  /*********** 15 ***********/
  it("Should not allow to mint, return, burn and mint the same token as artist", async () => {
    const { ourkiveMusicToken, owner, artist, collector } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setArtistAddress(artist.address);
    await ourkiveMusicToken
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address
    );

    // Transfer the token to a collector
    await ourkiveMusicToken.connect(artist).getFunction("transferFrom")(
      artist.address,
      collector.address,
      0
    );

    // Return the token to the owner
    await ourkiveMusicToken.connect(collector).getFunction("transferFrom")(
      collector.address,
      owner.address,
      0
    );

    // Burn the token as the owner
    await ourkiveMusicToken.burn(0);

    // Mint the token again
    await expect(
      ourkiveMusicToken.connect(artist).getFunction("safeMintByOurkive")(
        artist.address,
        0,
        "https://example.com/token/0"
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  /*********** 16 ***********/
  it("Should be able to mint, return, burn and mint the same token", async () => {
    const { ourkiveMusicToken, owner, artist, collector } = await loadFixture(
      beforeEachFixture
    );
    await ourkiveMusicToken.setArtistAddress(artist.address);
    await ourkiveMusicToken
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address
    );

    // Transfer the token to a collector
    await ourkiveMusicToken.connect(artist).getFunction("transferFrom")(
      artist.address,
      collector.address,
      0
    );

    // Return the token to the owner
    await ourkiveMusicToken.connect(collector).getFunction("transferFrom")(
      collector.address,
      owner.address,
      0
    );

    // Burn the token as the owner
    await ourkiveMusicToken.burn(0);

    // Mint the token again
    await ourkiveMusicToken.safeMintByOurkive(
      artist.address,
      0,
      "https://example.com/token/0"
    );
    expect(await ourkiveMusicToken.ownerOf(0)).to.equal(artist.address);
  });

  /* Resale */
  /*********** 17 ***********/
  it("Should be able to transfer from one collector to another", async () => {
    const { ourkiveMusicToken, owner, artist, collector, collectorTwo } =
      await loadFixture(beforeEachFixture);

    // Minting
    await ourkiveMusicToken.setArtistAddress(artist.address);
    await ourkiveMusicToken
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address
    );

    // Transfer the token to a collector
    await ourkiveMusicToken.safeTransferFrom(
      artist.address,
      collector.address,
      0
    );

    // Transfer the token to another collector
    await ourkiveMusicToken.connect(collector).getFunction("transferFrom")(
      collector.address,
      collectorTwo.address,
      0
    );

    expect(await ourkiveMusicToken.ownerOf(0)).to.equal(collectorTwo.address);

    // Transfer the token back to the first collector
    await ourkiveMusicToken.connect(collectorTwo).getFunction("transferFrom")(
      collectorTwo.address,
      collector.address,
      0
    );

    expect(await ourkiveMusicToken.ownerOf(0)).to.equal(collector.address);
  });

  /*********** 18 ***********/
  it("Should be able to sell the token to another marketplace and burn the token", async () => {
    const {
      ourkiveMusicToken,
      owner,
      artist,
      marketplace,
      collector,
      collectorTwo,
    } = await loadFixture(beforeEachFixture);

    // Minting
    await ourkiveMusicToken.setArtistAddress(artist.address);
    await ourkiveMusicToken
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address
    );

    // Transfer the token to a collector
    await ourkiveMusicToken.safeTransferFrom(
      artist.address,
      collector.address,
      0
    );

    // Approve the marketplace
    await ourkiveMusicToken.connect(collector).getFunction("setApprovalForAll")(
      marketplace.address,
      true
    );

    // Transfer the token to another collector
    await ourkiveMusicToken.connect(marketplace).getFunction("transferFrom")(
      collector.address,
      collectorTwo.address,
      0
    );

    expect(await ourkiveMusicToken.ownerOf(0)).to.equal(collectorTwo.address);

    // Burn the token
    await ourkiveMusicToken.connect(collectorTwo).getFunction("burn")(0);

    expect(await ourkiveMusicToken.balanceOf(collectorTwo.address)).to.equal(0);
  });

  /*********** 19 ***********/
  it("Should be able to mint, return, burn and mint the same token and sell it to another marketplace and burn", async () => {
    const {
      ourkiveMusicToken,
      owner,
      artist,
      collector,
      marketplace,
      collectorTwo,
    } = await loadFixture(beforeEachFixture);
    await ourkiveMusicToken.setArtistAddress(artist.address);
    await ourkiveMusicToken
      .connect(artist)
      .getFunction("safeMintAndApprovalForAll")(
      artist.address,
      0,
      "https://example.com/token/0",
      owner.address
    );

    // Transfer the token to a collector
    await ourkiveMusicToken.connect(artist).getFunction("transferFrom")(
      artist.address,
      collector.address,
      0
    );

    // Return the token to the owner
    await ourkiveMusicToken.connect(collector).getFunction("transferFrom")(
      collector.address,
      owner.address,
      0
    );

    // Burn the token as the owner
    await ourkiveMusicToken.burn(0);

    // Mint the token again
    await ourkiveMusicToken.safeMintByOurkive(
      artist.address,
      0,
      "https://example.com/token/0"
    );
    expect(await ourkiveMusicToken.ownerOf(0)).to.equal(artist.address);

    // Transfer the token to a collector
    await ourkiveMusicToken.safeTransferFrom(
      artist.address,
      collector.address,
      0
    );

    // Approve the marketplace
    await ourkiveMusicToken.connect(collector).getFunction("setApprovalForAll")(
      marketplace.address,
      true
    );

    // Transfer the token to another collector
    await ourkiveMusicToken.connect(marketplace).getFunction("transferFrom")(
      collector.address,
      collectorTwo.address,
      0
    );

    expect(await ourkiveMusicToken.ownerOf(0)).to.equal(collectorTwo.address);

    // Burn the token
    await ourkiveMusicToken.connect(collectorTwo).getFunction("burn")(0);

    expect(await ourkiveMusicToken.balanceOf(collectorTwo.address)).to.equal(0);
  });
});

/* TODO: Integration Tests */
// describe('OurkiveMusicToken (Integration Tests)', () => {
//   const deployRoyaltyReceiverFixture = async (marketplaces: HardhatEthersSigner[]) => {
//     const allowlist = await ethers.deployContract('NftMarketplaceAllowlist');
//     await allowlist.waitForDeployment();

//     for (let i = 0; i < marketplaces.length; i++) {
//       await allowlist.approveMarketplace(marketplaces[i]);
//     }

//     return {allowlist};
//   }

//   const deployAllowlistFixture = async (marketplaces: HardhatEthersSigner[]) => {
//     const allowlist = await ethers.deployContract('NftMarketplaceAllowlist');
//     await allowlist.waitForDeployment();

//     for (let i = 0; i < marketplaces.length; i++) {
//       await allowlist.approveMarketplace(marketplaces[i]);
//     }

//     return {allowlist};
//   }

//   const deployTokenFixture = async (owner: HardhatEthersSigner, allowlist: Contract) => {
//     const ourkiveMusicToken = await ethers.deployContract("OurkiveMusicToken", [
//       "Ourkive",
//       "KIVE",
//       owner.address,
//       1000, // Fee numerator
//       allowlist.address
//     ]);
//     await ourkiveMusicToken.waitForDeployment();

//     return {ourkiveMusicToken};
//   };

//   const beforeEachFixture = async () => {
//     const [owner, marketplace] = await ethers.getSigners();

//     const {allowlist} = await deployAllowlistFixture([marketplace]);
//     const {ourkiveMusicToken} = await deployTokenFixture(owner, allowlist);

//     return {ourkiveMusicToken, owner, marketplace, allowlist};
//   }

//   /**
//    * 1. Deploy all SCs
//    * 2. Mint the NFT to Artist
//    * 3. Check that the owner of the nft is indeed Artist
//    * 4. Grant permission to sell nft to VL
//    * 5. Check that VL indeed has a permission to sell
//    * 6. Collector sends money to VL
//    * 7. Check the balance of both Collector and VL
//    * 8. VL transfers the nft to Collector
//    * 9. Check the owner of the nft is indeed Collector
//    * 10. Collector grants permission to sell nft to Marketplace
//    * 11. Check that Marketplace indeed has a permission to sell
//    * 12. Resale Collector sends money to Marketplace
//    * 13. Check the balance of both Resale Collector and Marketplace
//    * 14. Marketplace transfers the nft to Resale Collector
//    * 15. Check the owner of the nft is indeed Resale Collector
//    */
//   it('Should not have any issues while processing both primary and secondary sales', async () => {
//      const {ourkiveMusicToken, owner, marketplace} = await loadFixture(beforeEachFixture);
//   });
// })
