import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  listAndPurchaseNFT,
  listNFTAndCheck,
  mintAndApprove,
  setupOurkiveNFTMarketplace,
} from "../../test_utils/marketplace/OurkiveNFTMarketplaceUpgradeable";
import {
  DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
  TOKEN_ID,
} from "../../test_utils/constants";
import getUnauthorizedErrorMessage from "../../test_utils/access/getUnauthorizedErrorMessage";
import {
  checkBalanceOf,
  checkIsApprovedForAll,
  checkOwnerOf,
} from "../../test_utils/musicNFT/helperMethods";

const COLLECTOR_ONE_ROYALTY_BPS = 150;
const COLLECTOR_TWO_ROYALTY_BPS = 90;
const COLLECTOR_THREE_ROYALTY_BPS = 60;

describe("OurkiveNFTMarketplaceUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [
      owner,
      artist,
      collector,
      collectorTwo,
      collectorThree,
      collectorFour,
      collectorFive,
      collectorSix,
    ] = await ethers.getSigners();

    const tokenLimit = 10;

    const {
      ourkiveMusicToken,
      ourkiveMusicTokenTwo,
      ourkiveMusicTokenV3,
      ourkiveMusicTokenV3Two,
      marketplace,
      initialSupply,
      nftPrice,
      mockUsdc,
      membershipController,
      adminRole,
      membershipControllerAuthorizedRole,
      nftMarketplaceAuthorizedRole,
      paymentController,
      artistRoyaltyStorage,
      artistRoyaltyController,
      collectorRoyaltyController,
      kive,
      kiveV2,
      commissionBps,
    } = await setupOurkiveNFTMarketplace(
      owner,
      artist,
      [
        collector,
        collectorTwo,
        collectorThree,
        collectorFour,
        collectorFive,
        collectorSix,
      ],
      tokenLimit,
    );

    return {
      ourkiveMusicToken,
      ourkiveMusicTokenTwo,
      ourkiveMusicTokenV3,
      ourkiveMusicTokenV3Two,
      owner,
      marketplace,
      artist,
      collector,
      collectorTwo,
      initialSupply,
      nftPrice,
      mockUsdc,
      membershipController,
      adminRole,
      membershipControllerAuthorizedRole,
      nftMarketplaceAuthorizedRole,
      paymentController,
      artistRoyaltyStorage,
      artistRoyaltyController,
      collectorRoyaltyController,
      collectorThree,
      collectorFour,
      collectorFive,
      collectorSix,
      commissionBps,
    };
  };

  /*********** 1 ***********/
  it("List and purchase music NFT for primary public sale", async () => {
    const {
      owner,
      ourkiveMusicToken,
      marketplace,
      artist,
      collector,
      initialSupply,
      nftPrice,
      mockUsdc,
      membershipController,
      paymentController,
      commissionBps,
    } = await loadFixture(beforeEachFixture);

    const marketplaceAddress = await marketplace.getAddress();
    const nftAddress = await ourkiveMusicToken.getAddress();

    // Mint token to artist
    await mintAndApprove(ourkiveMusicToken, artist, marketplaceAddress);

    const { nftPrice: newNftPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: artist,
      payees: [{ walletAddress: artist.address, percent: 8000, amount: 0 }],
      isPrivate: false,
      membershipController,
      buyer: collector,
      mockUsdc,
      artistRoyaltyAddress: ethers.ZeroAddress,
      artistRoyaltyAmount: 0,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("30", 6),
    });

    // Check the owner of the NFT
    await checkOwnerOf(ourkiveMusicToken, collector);

    // Check the balance of the collector
    await checkBalanceOf(
      mockUsdc,
      collector.address,
      initialSupply - newNftPrice,
    );

    // Check the balance of the artist
    await checkBalanceOf(
      mockUsdc,
      artist.address,
      (nftPrice * (10000n - commissionBps)) / 10000n,
    );

    // Check if the payment controller has any USDC
    await checkBalanceOf(mockUsdc, await paymentController.getAddress(), 0);
  });

  /*********** 2 ***********/
  it("List and purchase music NFT for primary private sale", async () => {
    const {
      owner,
      ourkiveMusicToken,
      marketplace,
      artist,
      collector,
      initialSupply,
      mockUsdc,
      membershipController,
      paymentController,
      commissionBps,
    } = await loadFixture(beforeEachFixture);

    const nftPrice = ethers.parseUnits("1", 6);

    const marketplaceAddress = await marketplace.getAddress();
    const nftAddress = await ourkiveMusicToken.getAddress();

    // Mint token to artist
    await mintAndApprove(ourkiveMusicToken, artist, marketplaceAddress);

    const { nftPrice: newNftPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: artist,
      payees: [{ walletAddress: artist.address, percent: 8000, amount: 0 }],
      isPrivate: true,
      membershipController,
      buyer: collector,
      mockUsdc,
      artistRoyaltyAddress: ethers.ZeroAddress,
      artistRoyaltyAmount: 0,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits(".03", 6),
    });

    // Check the owner of the NFT
    await checkOwnerOf(ourkiveMusicToken, collector);

    // Check the balance of the collector
    await checkBalanceOf(
      mockUsdc,
      collector.address,
      initialSupply - newNftPrice,
    );

    // Check the balance of the artist
    await checkBalanceOf(
      mockUsdc,
      artist.address,
      (nftPrice * (10000n - commissionBps)) / 10000n,
    );

    // Check if the payment controller has any USDC
    await checkBalanceOf(mockUsdc, await paymentController.getAddress(), 0);
  });

  /*********** 3 ***********/
  it("List and purchase music NFT for secondary public sale", async () => {
    const {
      owner,
      ourkiveMusicToken,
      marketplace,
      artist,
      collector,
      collectorTwo,
      initialSupply,
      nftPrice,
      mockUsdc,
      membershipController,
      artistRoyaltyStorage,
      artistRoyaltyController,
      paymentController,
      commissionBps,
    } = await loadFixture(beforeEachFixture);

    const marketplaceAddress = await marketplace.getAddress();
    const nftAddress = await ourkiveMusicToken.getAddress();

    await artistRoyaltyStorage.setCustomArtistRoyalty(
      nftAddress,
      TOKEN_ID,
      artist.address,
      DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
    );

    // Mint token to artist
    await mintAndApprove(ourkiveMusicToken, artist, marketplaceAddress);

    // Primary sale
    let { nftPrice: newNftPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: artist,
      payees: [{ walletAddress: artist.address, percent: 8000, amount: 0 }],
      isPrivate: false,
      membershipController,
      buyer: collector,
      mockUsdc,
      artistRoyaltyAddress: ethers.ZeroAddress,
      artistRoyaltyAmount: 0,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("30", 6),
    });

    // Check the NFT owner
    await checkOwnerOf(ourkiveMusicToken, collector);

    // Check the balance of the collector
    await checkBalanceOf(
      mockUsdc,
      collector.address,
      initialSupply - newNftPrice,
    );

    // Check the balance of the artist
    await checkBalanceOf(
      mockUsdc,
      artist.address,
      (nftPrice * (10000n - commissionBps)) / 10000n,
    );

    // Approve marketplace
    await ourkiveMusicToken
      .connect(collector)
      .setApprovalForAll(marketplaceAddress, true);

    // Check if marketplace is approved
    await checkIsApprovedForAll(
      ourkiveMusicToken,
      collector.address,
      marketplaceAddress,
      true,
    );

    // Secondary sale
    ({ nftPrice: newNftPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: collector,
      payees: [{ walletAddress: collector.address, percent: 10000, amount: 0 }],
      isPrivate: false,
      membershipController,
      buyer: collectorTwo,
      mockUsdc,
      artistRoyaltyAddress: artist.address,
      artistRoyaltyAmount:
        (nftPrice * BigInt(DEFAULT_ARTIST_ROYALTY_BASIS_POINTS)) / 10000n,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("30", 6),
    }));

    // Check the NFT owner
    await checkOwnerOf(ourkiveMusicToken, collectorTwo);

    // Check the balance of the collector
    await checkBalanceOf(
      mockUsdc,
      collectorTwo.address,
      initialSupply - newNftPrice,
    );

    // Check the balance of the artist
    const [, artistRoyaltyAmount] =
      await artistRoyaltyController.getArtistRoyaltyRecipientAndAmount(
        await ourkiveMusicToken.getAddress(),
        0,
        nftPrice,
      );
    await checkBalanceOf(
      mockUsdc,
      collector.address,
      initialSupply - newNftPrice + nftPrice - artistRoyaltyAmount,
    );

    // Check if the payment controller has any USDC
    await checkBalanceOf(mockUsdc, await paymentController.getAddress(), 0);
  });

  /*********** 4 ***********/
  it("List and purchase music NFT for secondary private sale", async () => {
    const {
      owner,
      ourkiveMusicToken,
      marketplace,
      artist,
      collector,
      collectorTwo,
      initialSupply,
      nftPrice,
      mockUsdc,
      membershipController,
      artistRoyaltyController,
      artistRoyaltyStorage,
      paymentController,
      commissionBps,
    } = await loadFixture(beforeEachFixture);

    const marketplaceAddress = await marketplace.getAddress();
    const nftAddress = await ourkiveMusicToken.getAddress();

    // Mint token to artist
    await mintAndApprove(ourkiveMusicToken, artist, marketplaceAddress);

    // Primary sale
    let { nftPrice: newNftPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: artist,
      payees: [{ walletAddress: artist.address, percent: 8000, amount: 0 }],
      isPrivate: true,
      membershipController,
      buyer: collector,
      mockUsdc,
      artistRoyaltyAddress: ethers.ZeroAddress,
      artistRoyaltyAmount: 0,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("30", 6),
    });

    await artistRoyaltyStorage.setCustomArtistRoyalty(
      await ourkiveMusicToken.getAddress(),
      0,
      artist.address,
      DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
    );

    // Check the NFT owner
    await checkOwnerOf(ourkiveMusicToken, collector);

    // Check the balance of the collector
    await checkBalanceOf(
      mockUsdc,
      collector.address,
      initialSupply - newNftPrice,
    );

    // Check the balance of the artist
    await checkBalanceOf(
      mockUsdc,
      artist.address,
      (nftPrice * (10000n - commissionBps)) / 10000n,
    );

    // Approve marketplace
    await ourkiveMusicToken
      .connect(collector)
      .setApprovalForAll(marketplaceAddress, true);

    // Check if marketplace is approved
    await checkIsApprovedForAll(
      ourkiveMusicToken,
      collector.address,
      marketplaceAddress,
      true,
    );

    // Secondary sale
    ({ nftPrice: newNftPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: collector,
      payees: [{ walletAddress: collector.address, percent: 10000, amount: 0 }],
      isPrivate: false,
      membershipController,
      buyer: collectorTwo,
      mockUsdc,
      artistRoyaltyAddress: artist.address,
      artistRoyaltyAmount:
        (nftPrice * BigInt(DEFAULT_ARTIST_ROYALTY_BASIS_POINTS)) / 10000n,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("30", 6),
    }));

    // Check the NFT owner
    await checkOwnerOf(ourkiveMusicToken, collectorTwo);

    // Check the balance of the collector
    await checkBalanceOf(
      mockUsdc,
      collectorTwo.address,
      initialSupply - newNftPrice,
    );

    // Check the balance of the artist
    const [, artistRoyaltyAmount] =
      await artistRoyaltyController.getArtistRoyaltyRecipientAndAmount(
        await ourkiveMusicToken.getAddress(),
        0,
        nftPrice,
      );
    await checkBalanceOf(
      mockUsdc,
      collector.address,
      initialSupply - newNftPrice + nftPrice - artistRoyaltyAmount,
    );

    // Check if the payment controller has any USDC
    await checkBalanceOf(mockUsdc, await paymentController.getAddress(), 0);
  });

  /*********** 5 ***********/
  it("Delist works properly", async () => {
    const {
      owner,
      ourkiveMusicToken,
      marketplace,
      artist,
      collector,
      collectorTwo,
      initialSupply,
      nftPrice,
      mockUsdc,
      membershipController,
      artistRoyaltyStorage,
      artistRoyaltyController,
      commissionBps,
    } = await loadFixture(beforeEachFixture);

    const marketplaceAddress = await marketplace.getAddress();
    const nftAddress = await ourkiveMusicToken.getAddress();

    await artistRoyaltyStorage.setCustomArtistRoyalty(
      nftAddress,
      TOKEN_ID,
      artist.address,
      DEFAULT_ARTIST_ROYALTY_BASIS_POINTS,
    );

    // Mint token to artist
    await mintAndApprove(ourkiveMusicToken, artist, marketplaceAddress);

    // List NFT
    await listNFTAndCheck(
      marketplace,
      {
        nftAddress,
        tokenId: 0,
        nftPrice,
        seller: artist.address,
        buyer: ethers.ZeroAddress,
        payees: [{ walletAddress: artist.address, percent: 8000, amount: 0 }],
        isPrivate: false,
      },
      nftPrice,
    );

    // Delist NFT
    await marketplace.delistNFT(nftAddress, 0);

    // Check if the listing is removed
    const nftListing = await marketplace.getNFTListing(nftAddress, 0);
    expect(nftListing.seller).to.equal(ethers.ZeroAddress);

    // Primary sale
    let { nftPrice: newNftPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: artist,
      payees: [{ walletAddress: artist.address, percent: 8000, amount: 0 }],
      isPrivate: true,
      membershipController,
      buyer: collector,
      mockUsdc,
      artistRoyaltyAddress: ethers.ZeroAddress,
      artistRoyaltyAmount: 0,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("30", 6),
    });

    // Check the NFT owner
    await checkOwnerOf(ourkiveMusicToken, collector);

    // Check the balance of the collector
    await checkBalanceOf(
      mockUsdc,
      collector.address,
      initialSupply - newNftPrice,
    );

    // Check the balance of the artist
    await checkBalanceOf(
      mockUsdc,
      artist.address,
      (nftPrice * (10000n - commissionBps)) / 10000n,
    );

    // Approve marketplace
    await ourkiveMusicToken
      .connect(collector)
      .setApprovalForAll(marketplaceAddress, true);

    // Check if marketplace is approved
    await checkIsApprovedForAll(
      ourkiveMusicToken,
      collector.address,
      marketplaceAddress,
      true,
    );

    // Secondary sale
    ({ nftPrice: newNftPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: collector,
      payees: [{ walletAddress: collector.address, percent: 10000, amount: 0 }],
      isPrivate: false,
      membershipController,
      buyer: collectorTwo,
      mockUsdc,
      artistRoyaltyAddress: artist.address,
      artistRoyaltyAmount:
        (nftPrice * BigInt(DEFAULT_ARTIST_ROYALTY_BASIS_POINTS)) / 10000n,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("30", 6),
    }));

    // Check the NFT owner
    await checkOwnerOf(ourkiveMusicToken, collectorTwo);

    // Check the balance of the collector
    await checkBalanceOf(
      mockUsdc,
      collectorTwo.address,
      initialSupply - newNftPrice,
    );

    // Check the balance of the artist
    const [, artistRoyaltyAmount] =
      await artistRoyaltyController.getArtistRoyaltyRecipientAndAmount(
        await ourkiveMusicToken.getAddress(),
        0,
        nftPrice,
      );
    await checkBalanceOf(
      mockUsdc,
      collector.address,
      initialSupply - newNftPrice + nftPrice - artistRoyaltyAmount,
    );
  });

  // /*********** 6 ***********/
  it("List and purchase two music NFTs for primary sale", async () => {
    const {
      owner,
      ourkiveMusicToken,
      ourkiveMusicTokenTwo,
      marketplace,
      artist,
      collector,
      initialSupply,
      nftPrice,
      mockUsdc,
      membershipController,
      paymentController,
      commissionBps,
    } = await loadFixture(beforeEachFixture);

    const marketplaceAddress = await marketplace.getAddress();
    const nftAddress = await ourkiveMusicToken.getAddress();
    const nftTwoAddress = await ourkiveMusicTokenTwo.getAddress();

    // Mint token to artist
    await mintAndApprove(ourkiveMusicToken, artist, marketplaceAddress);
    await mintAndApprove(ourkiveMusicTokenTwo, artist, marketplaceAddress);

    const nftOnePrice = ethers.parseUnits("10", 6);

    // Primary Sale 1
    let { nftPrice: newNftPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice: nftOnePrice,
      seller: artist,
      payees: [{ walletAddress: artist.address, percent: 8000, amount: 0 }],
      isPrivate: false,
      membershipController,
      buyer: collector,
      mockUsdc,
      artistRoyaltyAddress: ethers.ZeroAddress,
      artistRoyaltyAmount: 0,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits(".3", 6),
    });

    // Primary sale 2
    let { nftPrice: nftTwoPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress: nftTwoAddress,
      tokenId: 0,
      nftPrice,
      seller: artist,
      payees: [{ walletAddress: artist.address, percent: 8000, amount: 0 }],
      isPrivate: false,
      membershipController,
      buyer: collector,
      mockUsdc,
      artistRoyaltyAddress: ethers.ZeroAddress,
      artistRoyaltyAmount: 0,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("30", 6),
    });

    // Check the owner of the NFT
    await checkOwnerOf(ourkiveMusicToken, collector);
    await checkOwnerOf(ourkiveMusicTokenTwo, collector);

    // Check the balance of the collector
    await checkBalanceOf(
      mockUsdc,
      collector.address,
      initialSupply - newNftPrice - nftTwoPrice,
    );

    // Check the balance of the artist
    await checkBalanceOf(
      mockUsdc,
      artist.address,
      ((nftOnePrice + nftPrice) * (10000n - commissionBps)) / 10000n,
    );

    // Check if the payment controller has any USDC
    await checkBalanceOf(mockUsdc, await paymentController.getAddress(), 0);
  });

  it("Should set the Ourkive EOA address correctly", async () => {
    const {
      owner,
      marketplace,
      collector: anotherOwner,
    } = await loadFixture(beforeEachFixture);
    const newOurkiveAddress = anotherOwner.address;

    await marketplace.setOurkiveEOA(newOurkiveAddress);
    expect(await marketplace.ourkiveEOA()).to.equal(newOurkiveAddress);
  });

  it("Should revert if a non-authorized user tries to set the Ourkive EOA address", async () => {
    const { collector, marketplace, adminRole } =
      await loadFixture(beforeEachFixture);
    const newOurkiveAddress = collector.address;

    await expect(
      marketplace.connect(collector).setOurkiveEOA(newOurkiveAddress),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should set the USDC token address correctly", async () => {
    const {
      owner,
      marketplace,
      collector: newMockUSDC,
    } = await loadFixture(beforeEachFixture);

    const newMockUSDCAddr = newMockUSDC.address;

    await marketplace.setUSDCToken(newMockUSDCAddr, newMockUSDCAddr);
    expect(await marketplace.usdcToken()).to.equal(newMockUSDCAddr);
    expect(await marketplace.usdcTokenPermit()).to.equal(newMockUSDCAddr);
  });

  it("Should revert if a non-authorized user tries to set the USDC token address", async () => {
    const {
      collector,
      marketplace,
      collector: newMockUSDC,
      adminRole,
    } = await loadFixture(beforeEachFixture);
    const newMockUSDCAddr = newMockUSDC.address;

    await expect(
      marketplace
        .connect(collector)
        .setUSDCToken(newMockUSDCAddr, newMockUSDCAddr),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should set the membership controller address correctly", async () => {
    const {
      owner,
      marketplace,
      collector: newMembershipController,
    } = await loadFixture(beforeEachFixture);

    const newMembershipControllerAddr = newMembershipController.address;

    await marketplace.setMembershipController(newMembershipControllerAddr);
    expect(await marketplace.membershipController()).to.equal(
      newMembershipControllerAddr,
    );
  });

  it("Should revert if a non-authorized user tries to set the membership controller address", async () => {
    const {
      collector,
      marketplace,
      collector: newMembershipController,
      adminRole,
    } = await loadFixture(beforeEachFixture);
    const newMembershipControllerAddr = newMembershipController.address;

    await expect(
      marketplace
        .connect(collector)
        .setMembershipController(newMembershipControllerAddr),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should set the kive token address correctly", async () => {
    const {
      owner,
      marketplace,
      collector: newKiveToken,
    } = await loadFixture(beforeEachFixture);

    const newKiveTokenAddr = newKiveToken.address;

    await marketplace.setKiveToken(newKiveTokenAddr);
    expect(await marketplace.kiveToken()).to.equal(newKiveTokenAddr);
  });

  it("Should revert if a non-authorized user tries to set the kive token address", async () => {
    const {
      collector,
      marketplace,
      collector: newKiveToken,
      adminRole,
    } = await loadFixture(beforeEachFixture);
    const newKiveTokenAddr = newKiveToken.address;

    await expect(
      marketplace.connect(collector).setKiveToken(newKiveTokenAddr),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should revert if a non-authorized user tries to set the reentrancy guard", async () => {
    const {
      collector,
      marketplace,
      collector: newKiveToken,
      adminRole,
    } = await loadFixture(beforeEachFixture);
    const newKiveTokenAddr = newKiveToken.address;

    await expect(
      marketplace.connect(newKiveToken).getFunction("setReentrancyGuard")(
        newKiveTokenAddr,
      ),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should revert if a non-authorized user tries to set the payment controller", async () => {
    const { collector, marketplace, adminRole } =
      await loadFixture(beforeEachFixture);

    await expect(
      marketplace.connect(collector).getFunction("setPaymentController")(
        collector.address,
      ),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should revert if a non-authorized user tries to set the artist royalty controller", async () => {
    const { collector, marketplace, adminRole } =
      await loadFixture(beforeEachFixture);

    await expect(
      marketplace.connect(collector).getFunction("setArtistRoyaltyController")(
        collector.address,
      ),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should revert if a non-authorized user tries to set the NFT data storage", async () => {
    const { collector, marketplace, adminRole } =
      await loadFixture(beforeEachFixture);

    await expect(
      marketplace.connect(collector).getFunction("setNFTDataStorage")(
        collector.address,
      ),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should revert if a non-authorized user tries to set the collector royalty controller", async () => {
    const { collector, marketplace, adminRole } =
      await loadFixture(beforeEachFixture);

    await expect(
      marketplace
        .connect(collector)
        .getFunction("setCollectorRoyaltyController")(collector.address),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should revert if a non-authorized user tries to set the nft allowlist", async () => {
    const { collector, marketplace, adminRole } =
      await loadFixture(beforeEachFixture);

    await expect(
      marketplace.connect(collector).getFunction("setNFTAllowlist")(
        collector.address,
      ),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should set the min USDC amount correctly", async () => {
    const { owner, marketplace } = await loadFixture(beforeEachFixture);

    const newMinUsdcForPromotion = ethers.parseUnits("1", 6);

    await marketplace.setMinUsdcForPromotion(newMinUsdcForPromotion);
    expect(await marketplace.minUsdcForPromotion()).to.equal(
      newMinUsdcForPromotion,
    );
  });

  it("Should revert if a non-authorized user tries to set the min USDC for promotion", async () => {
    const { collector, marketplace, adminRole } =
      await loadFixture(beforeEachFixture);

    const newMinUsdcForPromotion = ethers.parseUnits("1", 6);

    await expect(
      marketplace
        .connect(collector)
        .setMinUsdcForPromotion(newMinUsdcForPromotion),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(collector.address, adminRole),
    );
  });

  it("Should distribute payments correctly on resales", async () => {
    const {
      owner,
      ourkiveMusicTokenV3,
      marketplace,
      artist,
      collector,
      initialSupply,
      nftPrice,
      mockUsdc,
      membershipController,
      collectorTwo,
      collectorThree,
      collectorFour,
      collectorFive,
      collectorSix,
      collectorRoyaltyController,
    } = await loadFixture(beforeEachFixture);

    const marketplaceAddress = await marketplace.getAddress();
    const nftAddress = await ourkiveMusicTokenV3.getAddress();

    // Mint token to artist
    await mintAndApprove(ourkiveMusicTokenV3, artist, marketplaceAddress);

    // Primary sale
    const { nftPrice: newNftPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: artist,
      payees: [{ walletAddress: artist.address, percent: 8000, amount: 0 }],
      isPrivate: false,
      membershipController,
      buyer: collector,
      mockUsdc,
      artistRoyaltyAddress: ethers.ZeroAddress,
      artistRoyaltyAmount: 0,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("30", 6),
    });

    const expectedCollectorFeeAmount = ethers.parseUnits("30", 6);
    let expectedArtistAmount = ethers.parseUnits("800", 6);
    let expectedOwnerAmount =
      ethers.parseUnits("200", 6) + expectedCollectorFeeAmount;
    let expectedCollectorAmount = initialSupply - newNftPrice;

    // Check USDC balances
    await checkBalanceOf(mockUsdc, owner.address, expectedOwnerAmount);
    await checkBalanceOf(mockUsdc, artist.address, expectedArtistAmount);
    await checkBalanceOf(mockUsdc, collector.address, expectedCollectorAmount);

    // Check NFT owner
    await checkOwnerOf(ourkiveMusicTokenV3, collector);

    // Approve marketplace to transfer NFT
    await ourkiveMusicTokenV3
      .connect(collector)
      .setApprovalForAll(marketplaceAddress, true);

    // Secondary sale (1st -> 2nd)
    const { nftPrice: newSecondarySaleNFTPrice } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: collector,
      payees: [{ walletAddress: collector.address, percent: 10000, amount: 0 }],
      isPrivate: false,
      membershipController,
      buyer: collectorTwo,
      mockUsdc,
      artistRoyaltyAddress: artist.address,
      artistRoyaltyAmount:
        (nftPrice * BigInt(DEFAULT_ARTIST_ROYALTY_BASIS_POINTS)) / 10000n,
      collectorRoyaltyPayees: [],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("30", 6),
    });

    // Calculate expected amounts
    const expectedArtistRoyaltyInfo = await ourkiveMusicTokenV3.royaltyInfo(
      0,
      nftPrice,
    );
    const expectedArtistRoyaltyAmount = expectedArtistRoyaltyInfo[1];
    expectedOwnerAmount = expectedOwnerAmount + expectedCollectorFeeAmount;
    expectedArtistAmount = expectedArtistAmount + expectedArtistRoyaltyAmount;
    expectedCollectorAmount += nftPrice - expectedArtistRoyaltyAmount;
    let expectedCollectorTwoAmount = initialSupply - newSecondarySaleNFTPrice;

    // Check USDC balances
    await checkBalanceOf(mockUsdc, owner.address, expectedOwnerAmount);
    await checkBalanceOf(mockUsdc, artist.address, expectedArtistAmount);
    await checkBalanceOf(mockUsdc, collector.address, expectedCollectorAmount);
    await checkBalanceOf(
      mockUsdc,
      collectorTwo.address,
      expectedCollectorTwoAmount,
    );

    // Approve marketplace to transfer NFT
    await ourkiveMusicTokenV3
      .connect(collectorTwo)
      .setApprovalForAll(marketplaceAddress, true);

    // Secondary sale (2nd -> 3rd)
    const { nftPrice: newSecondarySaleNFTPriceTwo } = await listAndPurchaseNFT({
      marketplace,
      nftAddress,
      tokenId: 0,
      nftPrice,
      seller: collectorTwo,
      payees: [
        { walletAddress: collectorTwo.address, percent: 10000, amount: 0 },
      ],
      isPrivate: false,
      membershipController,
      buyer: collectorThree,
      mockUsdc,
      artistRoyaltyAddress: artist.address,
      artistRoyaltyAmount:
        (nftPrice * BigInt(DEFAULT_ARTIST_ROYALTY_BASIS_POINTS)) / 10000n,
      collectorRoyaltyPayees: [
        {
          walletAddress: collector.address,
          percent: COLLECTOR_ONE_ROYALTY_BPS,
          amount: (nftPrice * BigInt(COLLECTOR_ONE_ROYALTY_BPS)) / 10000n,
        },
      ],
      platformAddress: owner.address,
      platformFee: ethers.parseUnits("15", 6),
    });

    // Calculate expected amounts
    const collectorOneRoyaltyAmount =
      (nftPrice * BigInt(COLLECTOR_ONE_ROYALTY_BPS)) / BigInt(10000);
    let marketplaceFeeAmount =
      expectedCollectorFeeAmount - collectorOneRoyaltyAmount;
    expectedOwnerAmount += marketplaceFeeAmount;
    expectedArtistAmount += expectedArtistRoyaltyAmount;
    expectedCollectorAmount += collectorOneRoyaltyAmount;
    expectedCollectorTwoAmount += nftPrice - expectedArtistRoyaltyAmount;
    let expectedCollectorThreeAmount =
      initialSupply - newSecondarySaleNFTPriceTwo;

    // Check USDC balances
    await checkBalanceOf(mockUsdc, owner.address, expectedOwnerAmount);
    await checkBalanceOf(mockUsdc, artist.address, expectedArtistAmount);
    await checkBalanceOf(mockUsdc, collector.address, expectedCollectorAmount);
    await checkBalanceOf(
      mockUsdc,
      collectorTwo.address,
      expectedCollectorTwoAmount,
    );
    await checkBalanceOf(
      mockUsdc,
      collectorThree.address,
      expectedCollectorThreeAmount,
    );

    // Approve marketplace to transfer NFT
    await ourkiveMusicTokenV3
      .connect(collectorThree)
      .setApprovalForAll(marketplaceAddress, true);

    // Secondary sale (3rd -> 4th)
    const { nftPrice: newSecondarySaleNFTPriceThree } =
      await listAndPurchaseNFT({
        marketplace,
        nftAddress,
        tokenId: 0,
        nftPrice,
        seller: collectorThree,
        payees: [
          { walletAddress: collectorThree.address, percent: 10000, amount: 0 },
        ],
        isPrivate: false,
        membershipController,
        buyer: collectorFour,
        mockUsdc,
        artistRoyaltyAddress: artist.address,
        artistRoyaltyAmount:
          (nftPrice * BigInt(DEFAULT_ARTIST_ROYALTY_BASIS_POINTS)) / 10000n,
        collectorRoyaltyPayees: [
          {
            walletAddress: collector.address,
            percent: COLLECTOR_ONE_ROYALTY_BPS,
            amount: (nftPrice * BigInt(COLLECTOR_ONE_ROYALTY_BPS)) / 10000n,
          },
          {
            walletAddress: collectorTwo.address,
            percent: COLLECTOR_TWO_ROYALTY_BPS,
            amount: (nftPrice * BigInt(COLLECTOR_TWO_ROYALTY_BPS)) / 10000n,
          },
        ],
        platformAddress: owner.address,
        platformFee: ethers.parseUnits("6", 6),
      });

    // Calculate expected amounts
    const collectorTwoRoyaltyAmount =
      (nftPrice * BigInt(COLLECTOR_TWO_ROYALTY_BPS)) / BigInt(10000);
    marketplaceFeeAmount =
      expectedCollectorFeeAmount -
      collectorOneRoyaltyAmount -
      collectorTwoRoyaltyAmount;
    expectedOwnerAmount += marketplaceFeeAmount;
    expectedArtistAmount += expectedArtistRoyaltyAmount;
    expectedCollectorAmount += collectorOneRoyaltyAmount;
    expectedCollectorTwoAmount += collectorTwoRoyaltyAmount;
    expectedCollectorThreeAmount += nftPrice - expectedArtistRoyaltyAmount;
    let expectedCollectorFourAmount =
      initialSupply - newSecondarySaleNFTPriceThree;

    // Check USDC balances
    await checkBalanceOf(mockUsdc, owner.address, expectedOwnerAmount);
    await checkBalanceOf(mockUsdc, artist.address, expectedArtistAmount);
    await checkBalanceOf(mockUsdc, collector.address, expectedCollectorAmount);
    await checkBalanceOf(
      mockUsdc,
      collectorTwo.address,
      expectedCollectorTwoAmount,
    );
    await checkBalanceOf(
      mockUsdc,
      collectorThree.address,
      expectedCollectorThreeAmount,
    );
    await checkBalanceOf(
      mockUsdc,
      collectorFour.address,
      expectedCollectorFourAmount,
    );

    // Approve marketplace to transfer NFT
    await ourkiveMusicTokenV3
      .connect(collectorFour)
      .setApprovalForAll(marketplaceAddress, true);

    // Secondary sale (4th -> 5th)
    const { nftPrice: newSecondarySaleNFTPriceFour } = await listAndPurchaseNFT(
      {
        marketplace,
        nftAddress,
        tokenId: 0,
        nftPrice,
        seller: collectorFour,
        payees: [
          { walletAddress: collectorFour.address, percent: 10000, amount: 0 },
        ],
        isPrivate: false,
        membershipController,
        buyer: collectorFive,
        mockUsdc,
        artistRoyaltyAddress: artist.address,
        artistRoyaltyAmount:
          (nftPrice * BigInt(DEFAULT_ARTIST_ROYALTY_BASIS_POINTS)) / 10000n,
        collectorRoyaltyPayees: [
          {
            walletAddress: collector.address,
            percent: COLLECTOR_ONE_ROYALTY_BPS,
            amount: (nftPrice * BigInt(COLLECTOR_ONE_ROYALTY_BPS)) / 10000n,
          },
          {
            walletAddress: collectorTwo.address,
            percent: COLLECTOR_TWO_ROYALTY_BPS,
            amount: (nftPrice * BigInt(COLLECTOR_TWO_ROYALTY_BPS)) / 10000n,
          },
          {
            walletAddress: collectorThree.address,
            percent: COLLECTOR_THREE_ROYALTY_BPS,
            amount: (nftPrice * BigInt(COLLECTOR_THREE_ROYALTY_BPS)) / 10000n,
          },
        ],
        platformAddress: owner.address,
        platformFee: 0,
      },
    );

    // Calculate expected amounts
    const collectorThreeRoyaltyAmount =
      (nftPrice * BigInt(COLLECTOR_THREE_ROYALTY_BPS)) / BigInt(10000);
    marketplaceFeeAmount =
      expectedCollectorFeeAmount -
      collectorOneRoyaltyAmount -
      collectorTwoRoyaltyAmount -
      collectorThreeRoyaltyAmount;
    expectedOwnerAmount += marketplaceFeeAmount;
    expectedArtistAmount += expectedArtistRoyaltyAmount;
    expectedCollectorAmount += collectorOneRoyaltyAmount;
    expectedCollectorTwoAmount += collectorTwoRoyaltyAmount;
    expectedCollectorThreeAmount += collectorThreeRoyaltyAmount;
    expectedCollectorFourAmount += nftPrice - expectedArtistRoyaltyAmount;
    let expectedCollectorFiveAmount =
      initialSupply - newSecondarySaleNFTPriceFour;

    // Check USDC balances
    expect(marketplaceFeeAmount).to.equal(0);
    await checkBalanceOf(mockUsdc, owner.address, expectedOwnerAmount);
    await checkBalanceOf(mockUsdc, artist.address, expectedArtistAmount);
    await checkBalanceOf(mockUsdc, collector.address, expectedCollectorAmount);
    await checkBalanceOf(
      mockUsdc,
      collectorTwo.address,
      expectedCollectorTwoAmount,
    );
    await checkBalanceOf(
      mockUsdc,
      collectorThree.address,
      expectedCollectorThreeAmount,
    );
    await checkBalanceOf(
      mockUsdc,
      collectorFour.address,
      expectedCollectorFourAmount,
    );
    await checkBalanceOf(
      mockUsdc,
      collectorFive.address,
      expectedCollectorFiveAmount,
    );

    // Approve marketplace to transfer NFT
    await ourkiveMusicTokenV3
      .connect(collectorFive)
      .setApprovalForAll(marketplaceAddress, true);

    // Secondary sale (5th -> 6th)
    const { nftPrice: newSecondarySaleNFTPriceFive } = await listAndPurchaseNFT(
      {
        marketplace,
        nftAddress,
        tokenId: 0,
        nftPrice,
        seller: collectorFive,
        payees: [
          { walletAddress: collectorFive.address, percent: 10000, amount: 0 },
        ],
        isPrivate: false,
        membershipController,
        buyer: collectorSix,
        mockUsdc,
        artistRoyaltyAddress: artist.address,
        artistRoyaltyAmount:
          (nftPrice * BigInt(DEFAULT_ARTIST_ROYALTY_BASIS_POINTS)) / 10000n,
        collectorRoyaltyPayees: [
          {
            walletAddress: collector.address,
            percent: COLLECTOR_ONE_ROYALTY_BPS,
            amount: (nftPrice * BigInt(COLLECTOR_ONE_ROYALTY_BPS)) / 10000n,
          },
          {
            walletAddress: collectorTwo.address,
            percent: COLLECTOR_TWO_ROYALTY_BPS,
            amount: (nftPrice * BigInt(COLLECTOR_TWO_ROYALTY_BPS)) / 10000n,
          },
          {
            walletAddress: collectorThree.address,
            percent: COLLECTOR_THREE_ROYALTY_BPS,
            amount: (nftPrice * BigInt(COLLECTOR_THREE_ROYALTY_BPS)) / 10000n,
          },
        ],
        platformAddress: owner.address,
        platformFee: 0,
      },
    );

    // Calculate expected amounts
    marketplaceFeeAmount =
      expectedCollectorFeeAmount -
      collectorOneRoyaltyAmount -
      collectorTwoRoyaltyAmount -
      collectorThreeRoyaltyAmount;
    expectedOwnerAmount += marketplaceFeeAmount;
    expectedArtistAmount += expectedArtistRoyaltyAmount;
    expectedCollectorAmount += collectorOneRoyaltyAmount;
    expectedCollectorTwoAmount += collectorTwoRoyaltyAmount;
    expectedCollectorThreeAmount += collectorThreeRoyaltyAmount;
    expectedCollectorFiveAmount += nftPrice - expectedArtistRoyaltyAmount;
    let expectedCollectorSixAmount =
      initialSupply - newSecondarySaleNFTPriceFive;

    // Check USDC balances
    expect(marketplaceFeeAmount).to.equal(0);
    await checkBalanceOf(mockUsdc, owner.address, expectedOwnerAmount);
    await checkBalanceOf(mockUsdc, artist.address, expectedArtistAmount);
    await checkBalanceOf(mockUsdc, collector.address, expectedCollectorAmount);
    await checkBalanceOf(
      mockUsdc,
      collectorTwo.address,
      expectedCollectorTwoAmount,
    );
    await checkBalanceOf(
      mockUsdc,
      collectorThree.address,
      expectedCollectorThreeAmount,
    );
    await checkBalanceOf(
      mockUsdc,
      collectorFour.address,
      expectedCollectorFourAmount,
    );
    await checkBalanceOf(
      mockUsdc,
      collectorFive.address,
      expectedCollectorFiveAmount,
    );
    await checkBalanceOf(
      mockUsdc,
      collectorSix.address,
      expectedCollectorSixAmount,
    );
  });
});
