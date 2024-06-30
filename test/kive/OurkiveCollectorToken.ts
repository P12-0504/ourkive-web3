import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("OurkiveCollectorToken", () => {
	// Deploy a new OurkiveCollectorToken contract before each test
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

		const OurkiveCollectorToken = await ethers.getContractFactory(
			"OurkiveCollectorToken"
		);
		const ourkiveCollectorToken = await OurkiveCollectorToken.deploy();

		await ourkiveCollectorToken.waitForDeployment();

		return {
			ourkiveCollectorToken,
			owner,
			collector,
			artist,
			collectorTwo,
			collectorThree,
			safeAccount,
			safeAccountTwo,
			safeAccountThree,
		};
	};

	// Test that the contract is deployed with the correct parameters
	it("Should deploy with the correct parameters", async () => {
		// Deploy the contract
		const { ourkiveCollectorToken, owner } = await loadFixture(
			beforeEachFixture
		);

		// Check the contract's parameters
		expect(await ourkiveCollectorToken.name()).to.equal(
			"The First Club by Ourkive"
		);
		expect(await ourkiveCollectorToken.symbol()).to.equal("KIVE");
		expect(await ourkiveCollectorToken.totalSupply()).to.equal(0);
		expect(await ourkiveCollectorToken.owner()).to.equal(owner.address);
	});

	// Test that the contract can mint a token and set the URI correctly
	it("Should mint and set URI correctly", async () => {
		// Deploy the contract
		const { ourkiveCollectorToken, owner } = await loadFixture(
			beforeEachFixture
		);

		// Mint a token
		await ourkiveCollectorToken.safeMint(
			owner.address,
			"https://example.com/token/0"
		);

		// Check that the token URI is correct
		expect(await ourkiveCollectorToken.tokenURI(0)).to.equal(
			"https://example.com/token/0"
		);
	});

	// Test that the contract cannot mint more than 101 tokens
	// it("Should not allow more than 101 tokens to be minted", async () => {
	//   // Deploy the contract
	//   const {ourkiveCollectorToken, owner} = await loadFixture(beforeEachFixture);

	//   // Mint 101 tokens
	//   for (let i = 0; i < 100; i++) {
	//     // await ourkiveCollectorToken.safeMint(ethers.Wallet.createRandom().connect(ethers.provider), `https://example.com/token/${i}`);
	//     await ourkiveCollectorToken.safeMint(ethers.Wallet.createRandom().address, `https://example.com/token/${i}`);
	//   }

	//   // Try to mint another token
	//   await expect(ourkiveCollectorToken.safeMint(owner.address, "https://example.com/token/100"))
	//     .to.be.revertedWith("Cannot mint more than 100 tokens");
	// });

	// Test that the contract cannot mint more than 1 token per address
	it("Should not allow more than 1 token per address", async () => {
		// Deploy the contract
		const { ourkiveCollectorToken, owner } = await loadFixture(
			beforeEachFixture
		);

		// Mint a token
		await ourkiveCollectorToken.safeMint(
			owner.address,
			"https://example.com/token/0"
		);

		// Try to mint another token
		await expect(
			ourkiveCollectorToken.safeMint(
				owner.address,
				"https://example.com/token/1"
			)
		).to.be.revertedWith("Cannot mint more than 1 token per address");

		// Check that the token URI is correct
		expect(await ourkiveCollectorToken.tokenURI(0)).to.equal(
			"https://example.com/token/0"
		);

		// Check that the token balance is correct
		expect(await ourkiveCollectorToken.balanceOf(owner.address)).to.equal(1);
	});

	// Test that the contract throws an error when trying to transfer a token to the zero address
	it("Should not allow transfer to the zero address", async () => {
		// Deploy the contract
		const { ourkiveCollectorToken, owner } = await loadFixture(
			beforeEachFixture
		);

		// Mint a token
		await ourkiveCollectorToken.safeMint(
			owner.address,
			"https://example.com/token/0"
		);

		// Try transferring the token to the zero address
		await expect(
			ourkiveCollectorToken.safeTransferFrom(
				owner.address,
				ethers.ZeroAddress,
				0
			)
		).to.be.revertedWith("ERC721: transfer to the zero address");

		// Check that the token balance is correct
		expect(await ourkiveCollectorToken.balanceOf(owner.address)).to.equal(1);
	});

	// Token Transfer
	it("Should allow transferring a token", async () => {
		// Deploy the contract
		const { ourkiveCollectorToken, collector, artist } = await loadFixture(
			beforeEachFixture
		);

		// Mint a token to artist
		await ourkiveCollectorToken.safeMint(artist, "https://example.com/token/0");

		// Transfer the token from artist to collector
		await ourkiveCollectorToken.connect(artist).getFunction("safeTransferFrom")(
			artist.address,
			collector.address,
			0
		);
		const newNFTOwner = await ourkiveCollectorToken.ownerOf(0);

		expect(newNFTOwner).to.equal(collector.address);
	});

	it("Should allow transferring a token twice", async () => {
		// Deploy the contract
		const { ourkiveCollectorToken, owner, collector, artist } =
			await loadFixture(beforeEachFixture);

		// Mint a token to artist
		await ourkiveCollectorToken.safeMint(artist, "https://example.com/token/0");

		// Transfer the token from artist to collector
		await ourkiveCollectorToken.connect(artist).getFunction("safeTransferFrom")(
			artist.address,
			collector.address,
			0
		);
		await expect(
			ourkiveCollectorToken.connect(collector).getFunction("safeTransferFrom")(
				collector.address,
				owner.address,
				0
			)
		).to.be.revertedWith("Cannot transfer this token");
	});

	// Approval
	it("Should revert when trying to approve", async () => {
		// Deploy the contract
		const { ourkiveCollectorToken, owner, artist } = await loadFixture(
			beforeEachFixture
		);

		// Mint a token to artist
		await ourkiveCollectorToken.safeMint(artist, "https://example.com/token/0");

		// Approve the token from artist to the original owner
		await expect(
			ourkiveCollectorToken.connect(artist).getFunction("approve")(
				owner.address,
				0
			)
		).to.be.revertedWith("Cannot approve");
	});

	it("Should revert when trying to set approval for all", async () => {
		// Deploy the contract
		const { ourkiveCollectorToken, owner, artist } = await loadFixture(
			beforeEachFixture
		);

		// Mint a token to artist
		await ourkiveCollectorToken.safeMint(artist, "https://example.com/token/0");

		// Approve the token from artist to the original owner
		await expect(
			ourkiveCollectorToken.connect(artist).getFunction("setApprovalForAll")(
				owner.address,
				true
			)
		).to.be.revertedWith("Cannot approve");
	});

	it("Should simulate Ourkive purchasing for multiple collectors - mixed order from safe accounts to collectors", async () => {
		// Deploy the contract
		const {
			ourkiveCollectorToken,
			owner,
			collector,
			collectorTwo,
			collectorThree,
		} = await loadFixture(beforeEachFixture);

		// Mint tokens to Ourkive and transfer them to safe accounts
		let tx = await ourkiveCollectorToken.safeMint(
			owner,
			"https://example.com/token/0"
		);
		await tx.wait();
		let totalSupply = await ourkiveCollectorToken.totalSupply();
		tx = await ourkiveCollectorToken.safeTransferFrom(
			owner.address,
			collector.address,
			Number(totalSupply) - 1
		);
		await tx.wait();

		tx = await ourkiveCollectorToken.safeMint(
			owner,
			"https://example.com/token/1"
		);
		await tx.wait();
		totalSupply = await ourkiveCollectorToken.totalSupply();
		tx = await ourkiveCollectorToken.safeTransferFrom(
			owner.address,
			collectorTwo.address,
			Number(totalSupply) - 1
		);
		await tx.wait();

		tx = await ourkiveCollectorToken.safeMint(
			owner,
			"https://example.com/token/2"
		);
		await tx.wait();
		totalSupply = await ourkiveCollectorToken.totalSupply();
		tx = await ourkiveCollectorToken.safeTransferFrom(
			owner.address,
			collectorThree.address,
			Number(totalSupply) - 1
		);
		await tx.wait();

		// Get token ids for each collector
		const firstOwnerTokenId = await ourkiveCollectorToken
			.connect(collector)
			.getFunction("tokenOfOwnerByIndex")(collector.address, 0);
		const secondOwnerTokenId = await ourkiveCollectorToken
			.connect(collectorTwo)
			.getFunction("tokenOfOwnerByIndex")(collectorTwo.address, 0);
		const thirdOwnerTokenId = await ourkiveCollectorToken
			.connect(collectorThree)
			.getFunction("tokenOfOwnerByIndex")(collectorThree.address, 0);

		// Check that the token ids are correct
		expect(firstOwnerTokenId).to.equal(0);
		expect(secondOwnerTokenId).to.equal(1);
		expect(thirdOwnerTokenId).to.equal(2);

		// Get token owners
		const firstTokenOwner = await ourkiveCollectorToken.ownerOf(0);
		const secondTokenOwner = await ourkiveCollectorToken.ownerOf(1);
		const thirdTokenOwner = await ourkiveCollectorToken.ownerOf(2);

		// Check that the token owners are correct
		expect(firstTokenOwner).to.equal(collector.address);
		expect(secondTokenOwner).to.equal(collectorTwo.address);
		expect(thirdTokenOwner).to.equal(collectorThree.address);
	});
});
