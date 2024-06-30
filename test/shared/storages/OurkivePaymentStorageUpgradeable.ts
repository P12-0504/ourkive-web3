import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployMockUSDCWithPermit,
  deployOurkiveAccessControlUpgradeable,
  deployOurkiveKillswitchUpgradeable,
  deployOurkivePaymentStorageUpgradeable,
} from "../../../test_utils/deployFixtures";
import { Currency, PAUSED_ERROR_MESSAGE } from "../../../test_utils/constants";
import getUnauthorizedErrorMessage from "../../../test_utils/access/getUnauthorizedErrorMessage";

describe("OurkivePaymentStorageUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [owner, artist, marketplace, collector, collectorTwo] =
      await ethers.getSigners();

    const { accessControl } = await deployOurkiveAccessControlUpgradeable();

    await accessControl.insertToPaymentStorageAuthorizedRole(owner.address);

    const paymentStorageAuthorizedRole =
      await accessControl.PAYMENT_STORAGE_AUTHORIZED_ROLE();

    const { killswitch } =
      await deployOurkiveKillswitchUpgradeable(accessControl);

    const adminRole = await accessControl.ADMIN_ROLE();

    const { mockUsdc } = await deployMockUSDCWithPermit();

    const initialSupplyStr = "1000000000";
    const initialSupply = ethers.parseUnits(initialSupplyStr, 6);
    await mockUsdc.connect(collector).getFunction("mint")(initialSupply);
    await mockUsdc.connect(collectorTwo).getFunction("mint")(initialSupply);

    const { paymentStorage } = await deployOurkivePaymentStorageUpgradeable(
      accessControl,
      killswitch,
      mockUsdc,
    );

    return {
      paymentStorage,
      owner,
      artist,
      marketplace,
      accessControl,
      killswitch,
      mockUsdc,
      collector,
      collectorTwo,
      adminRole,
      paymentStorageAuthorizedRole,
    };
  };

  it("Should initialize correctly with given parameters", async () => {
    const { paymentStorage } = await loadFixture(beforeEachFixture);
    // Check if the contract address is set (indicating deployment and initialization were successful)
    expect(await paymentStorage.getAddress()).to.not.be.undefined;
  });

  it("Should prevent reinitialization", async () => {
    const { accessControl, killswitch, mockUsdc, paymentStorage } =
      await loadFixture(beforeEachFixture);
    // Attempt to reinitialize and expect a revert
    await expect(
      paymentStorage.initialize(
        await accessControl.getAddress(),
        await killswitch.getAddress(),
        await mockUsdc.getAddress(),
      ),
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Should correctly set USDC address", async () => {
    const { accessControl, killswitch, mockUsdc, paymentStorage, owner } =
      await loadFixture(beforeEachFixture);

    await paymentStorage.setCurrencyAddress(owner.address, Currency.USDC);

    const nativeCurrencyAddr = await paymentStorage.getCurrencyAddress(
      Currency.NATIVE,
    );
    const usdcAddress = await paymentStorage.getCurrencyAddress(Currency.USDC);

    expect(nativeCurrencyAddr).to.equal(ethers.ZeroAddress);
    expect(usdcAddress).to.equal(owner.address);
  });

  it("Should skip on setting native currency address", async () => {
    const { accessControl, killswitch, mockUsdc, paymentStorage, owner } =
      await loadFixture(beforeEachFixture);

    await paymentStorage.setCurrencyAddress(owner.address, Currency.NATIVE);

    const nativeCurrencyAddr = await paymentStorage.getCurrencyAddress(
      Currency.NATIVE,
    );
    const usdcAddress = await paymentStorage.getCurrencyAddress(Currency.USDC);

    expect(nativeCurrencyAddr).to.equal(ethers.ZeroAddress);
    expect(usdcAddress).to.equal(await mockUsdc.getAddress());
  });

  it("Should revert if an invalid currency is provided as an argument", async () => {
    const { paymentStorage, owner } = await loadFixture(beforeEachFixture);

    await expect(
      paymentStorage.setCurrencyAddress(owner.address, 2),
    ).to.be.revertedWithoutReason();
  });

  it("Should revert if zero address is provided as an USDC contract address", async () => {
    const { paymentStorage, owner } = await loadFixture(beforeEachFixture);

    await expect(
      paymentStorage.setCurrencyAddress(ethers.ZeroAddress, 1),
    ).to.be.revertedWith("USDC contract address cannot be zero");
  });

  it("Should prevent unauthorized entity from setting currency address", async () => {
    const { paymentStorage, owner, paymentStorageAuthorizedRole, artist } =
      await loadFixture(beforeEachFixture);

    await expect(
      paymentStorage
        .connect(artist)
        .setCurrencyAddress(artist.address, Currency.NATIVE),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(artist.address, paymentStorageAuthorizedRole),
    );
    await expect(
      paymentStorage
        .connect(artist)
        .setCurrencyAddress(artist.address, Currency.USDC),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(artist.address, paymentStorageAuthorizedRole),
    );
  });
});
