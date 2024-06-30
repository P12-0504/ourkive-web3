import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployMockUSDCWithPermit,
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveKillswitchUpgradeable,
  deployOurkivePaymentControllerUpgradeable,
  deployOurkivePaymentStorageUpgradeable,
  deployPaymentControllerReentrancyAttack,
} from "../../test_utils/deployFixtures";
import { Currency } from "../../test_utils/constants";
import getUnauthorizedErrorMessage from "../../test_utils/access/getUnauthorizedErrorMessage";

describe("OurkivePaymentControllerUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner, artist, marketplace, collector, collectorTwo, attacker] =
      await ethers.getSigners();

    const { accessControl } = await deployOurkiveAccessControlUpgradeable();

    await accessControl.insertToPaymentControllerAuthorizedRole(owner.address);

    const paymentControllerAuthorizedRole =
      await accessControl.PAYMENT_CONTROLLER_AUTHORIZED_ROLE();

    const { killswitch } =
      await deployOurkiveKillswitchUpgradeable(accessControl);

    const adminRole = await accessControl.ADMIN_ROLE();

    const { mockUsdc } = await deployMockUSDCWithPermit();

    const initialSupplyStr = "1000000000";
    const initialSupply = ethers.parseUnits(initialSupplyStr, 6);
    await mockUsdc.connect(owner).getFunction("mint")(initialSupply);
    await mockUsdc.connect(collector).getFunction("mint")(initialSupply);
    await mockUsdc.connect(collectorTwo).getFunction("mint")(initialSupply);

    const { paymentStorage } = await deployOurkivePaymentStorageUpgradeable(
      accessControl,
      killswitch,
      mockUsdc,
    );

    const { paymentController } =
      await deployOurkivePaymentControllerUpgradeable(
        accessControl,
        killswitch,
        paymentStorage,
      );

    const { reentrancyAttack } = await deployPaymentControllerReentrancyAttack(
      attacker,
      await paymentController.getAddress(),
    );

    return {
      paymentStorage,
      paymentController,
      owner,
      attacker,
      artist,
      marketplace,
      accessControl,
      killswitch,
      mockUsdc,
      collector,
      collectorTwo,
      adminRole,
      reentrancyAttack,
      paymentControllerAuthorizedRole,
    };
  };

  it("Should initialize correctly with access control and killswitch", async () => {
    const { paymentController } = await loadFixture(beforeEachFixture);
    expect(await paymentController.getKillswitch()).to.not.be.undefined;
    expect(await paymentController.getAccessControl()).to.not.be.undefined;
  });

  it("Should be able to set composite contracts", async () => {
    const { paymentController, owner } = await loadFixture(beforeEachFixture);

    await paymentController.setPaymentStorage(owner.address);

    const newPaymentStorageAddr = await paymentController.paymentStorage();

    expect(newPaymentStorageAddr).to.equal(owner.address);
  });

  it("Should prevent setting composite contracts if the caller is unauthorized", async () => {
    const { paymentController, owner, collector, adminRole } =
      await loadFixture(beforeEachFixture);

    const paymentControllerUnauthorized =
      await paymentController.connect(collector);
    const revertedMessage = `AccessControl: account ${collector.address.toLowerCase()} is missing role ${adminRole.toLowerCase()}`;
    await expect(
      paymentControllerUnauthorized.setPaymentStorage(owner.address),
    ).to.be.revertedWith(revertedMessage);
  });

  it("Should distribute payments via native currency among multiple payees", async () => {
    const {
      paymentController,
      owner,
      collector,
      adminRole,
      collectorTwo,
      artist,
    } = await loadFixture(beforeEachFixture);

    const provider = ethers.provider;
    const initOwnerBalance = await provider.getBalance(owner.address);
    const initCollectorBalance = await provider.getBalance(collector.address);
    const initCollectorTwoBalance = await provider.getBalance(
      collectorTwo.address,
    );

    const ownerPayee = {
      walletAddress: owner.address,
      percent: 3000,
      amount: ethers.parseEther("3"),
    };
    const collectorPayee = {
      walletAddress: collector.address,
      percent: 2000,
      amount: ethers.parseEther("2"),
    };
    const collectorTwoPayee = {
      walletAddress: collectorTwo.address,
      percent: 5000,
      amount: ethers.parseEther("5"),
    };
    const initContractAmount = ethers.parseEther("10");

    const tx = await artist.sendTransaction({
      to: await paymentController.getAddress(),
      value: initContractAmount,
    });
    await tx.wait();

    const payees = [ownerPayee, collectorPayee, collectorTwoPayee];

    const payTx = await paymentController.distributePayments(
      payees,
      Currency.NATIVE,
    );
    const receipt = await payTx.wait();
    const fee = receipt?.fee ?? 0n;

    expect(fee).to.be.not.undefined;
    expect(fee).to.not.equal(0n);

    const ownerBalance = await provider.getBalance(owner.address);
    const collectorBalance = await provider.getBalance(collector.address);
    const collectorTwoBalance = await provider.getBalance(collectorTwo.address);

    expect(ownerBalance).to.equal(initOwnerBalance - fee + ownerPayee.amount);
    expect(collectorBalance).to.equal(
      initCollectorBalance + collectorPayee.amount,
    );
    expect(collectorTwoBalance).to.equal(
      initCollectorTwoBalance + collectorTwoPayee.amount,
    );
  });

  it("Should throw an error if there is an insufficient native currency balance", async () => {
    const {
      paymentController,
      owner,
      collector,
      adminRole,
      collectorTwo,
      artist,
    } = await loadFixture(beforeEachFixture);

    const ownerPayee = {
      walletAddress: owner.address,
      percent: 3000,
      amount: ethers.parseEther("3"),
    };
    const collectorPayee = {
      walletAddress: collector.address,
      percent: 2000,
      amount: ethers.parseEther("2"),
    };
    const collectorTwoPayee = {
      walletAddress: collectorTwo.address,
      percent: 5000,
      amount: ethers.parseEther("5"),
    };
    const initContractAmount = ethers.parseEther("9");

    const tx = await artist.sendTransaction({
      to: await paymentController.getAddress(),
      value: initContractAmount,
    });
    await tx.wait();

    const payees = [ownerPayee, collectorPayee, collectorTwoPayee];

    await expect(
      paymentController.distributePayments(payees, Currency.NATIVE),
    ).to.be.revertedWith("Insufficient native token balance");
  });
  it("Should distribute payments via USDC currency among multiple payees", async () => {
    const {
      paymentController,
      owner,
      collector,
      adminRole,
      collectorTwo,
      artist,
      mockUsdc,
    } = await loadFixture(beforeEachFixture);

    const initOwnerBalance = await mockUsdc.balanceOf(owner.address);
    const initCollectorBalance = await mockUsdc.balanceOf(collector.address);
    const initCollectorTwoBalance = await mockUsdc.balanceOf(
      collectorTwo.address,
    );
    const initContractAmount = ethers.parseUnits("10", 6);

    await mockUsdc.connect(owner).getFunction("transfer")(
      paymentController,
      initContractAmount,
    );

    const ownerPayee = {
      walletAddress: owner.address,
      percent: 3000,
      amount: ethers.parseUnits("3", 6),
    };
    const collectorPayee = {
      walletAddress: collector.address,
      percent: 2000,
      amount: ethers.parseUnits("2", 6),
    };
    const collectorTwoPayee = {
      walletAddress: collectorTwo.address,
      percent: 5000,
      amount: ethers.parseUnits("5", 6),
    };

    const payees = [ownerPayee, collectorPayee, collectorTwoPayee];

    await paymentController.distributePayments(payees, Currency.USDC);

    const ownerBalance = await mockUsdc.balanceOf(owner.address);
    const collectorBalance = await mockUsdc.balanceOf(collector.address);
    const collectorTwoBalance = await mockUsdc.balanceOf(collectorTwo.address);

    expect(ownerBalance).to.equal(
      initOwnerBalance - initContractAmount + ownerPayee.amount,
    );
    expect(collectorBalance).to.equal(
      initCollectorBalance + collectorPayee.amount,
    );
    expect(collectorTwoBalance).to.equal(
      initCollectorTwoBalance + collectorTwoPayee.amount,
    );
  });
  it("Should throw an error if there is an insufficient USDC balance", async () => {
    const {
      paymentController,
      owner,
      collector,
      adminRole,
      collectorTwo,
      artist,
      mockUsdc,
    } = await loadFixture(beforeEachFixture);

    const initOwnerBalance = await mockUsdc.balanceOf(owner.address);
    const initCollectorBalance = await mockUsdc.balanceOf(collector.address);
    const initCollectorTwoBalance = await mockUsdc.balanceOf(
      collectorTwo.address,
    );
    const initContractAmount = ethers.parseUnits("9", 6);

    await mockUsdc.connect(owner).getFunction("transfer")(
      paymentController,
      initContractAmount,
    );

    const ownerPayee = {
      walletAddress: owner.address,
      percent: 3000,
      amount: ethers.parseUnits("3", 6),
    };
    const collectorPayee = {
      walletAddress: collector.address,
      percent: 2000,
      amount: ethers.parseUnits("2", 6),
    };
    const collectorTwoPayee = {
      walletAddress: collectorTwo.address,
      percent: 5000,
      amount: ethers.parseUnits("5", 6),
    };

    const payees = [ownerPayee, collectorPayee, collectorTwoPayee];

    await expect(
      paymentController.distributePayments(payees, Currency.USDC),
    ).to.be.revertedWith("Insufficient ERC20 token balance");
  });
  it("Should prevent reentrancy attack", async () => {
    const {
      paymentController,
      owner,
      collector,
      adminRole,
      collectorTwo,
      artist,
      mockUsdc,
      attacker,
      reentrancyAttack,
      accessControl,
      paymentControllerAuthorizedRole,
    } = await loadFixture(beforeEachFixture);

    const initContractAmount = ethers.parseEther("5");

    const tx = await artist.sendTransaction({
      to: await paymentController.getAddress(),
      value: initContractAmount,
    });
    await tx.wait();

    await expect(
      reentrancyAttack
        .connect(attacker)
        .attack({ value: ethers.parseEther("1") }),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(
        await reentrancyAttack.getAddress(),
        paymentControllerAuthorizedRole,
      ),
    );

    const { provider } = ethers;
    const balance = await provider.getBalance(
      await paymentController.getAddress(),
    );

    expect(balance).to.equal(initContractAmount);
  });

  it("Should skip payment if an empty list of payees are provided", async () => {
    const { paymentController } = await loadFixture(beforeEachFixture);

    await expect(
      paymentController.distributePayments([], Currency.NATIVE),
    ).to.be.revertedWith("At least one payee is required");
  });

  it("Should prevent unauthorized entity from invoking distributePayments", async () => {
    const { paymentController, artist, paymentControllerAuthorizedRole } =
      await loadFixture(beforeEachFixture);

    await expect(
      paymentController.connect(artist).distributePayments([], Currency.NATIVE),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(
        artist.address,
        paymentControllerAuthorizedRole,
      ),
    );
    await expect(
      paymentController.connect(artist).distributePayments([], Currency.USDC),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(
        artist.address,
        paymentControllerAuthorizedRole,
      ),
    );
  });
  it("Should prevent unauthorized entity from invoking distributePayments", async () => {
    const { paymentController, artist, paymentControllerAuthorizedRole } =
      await loadFixture(beforeEachFixture);

    await expect(
      paymentController
        .connect(artist)
        .pay(artist.address, ethers.parseEther("1"), Currency.NATIVE),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(
        artist.address,
        paymentControllerAuthorizedRole,
      ),
    );
    await expect(
      paymentController
        .connect(artist)
        .pay(artist.address, ethers.parseUnits("1", 6), Currency.USDC),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(
        artist.address,
        paymentControllerAuthorizedRole,
      ),
    );
  });
});
