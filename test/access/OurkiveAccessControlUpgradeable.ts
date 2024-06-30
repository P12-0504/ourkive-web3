import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployOurkiveAccessControlUpgradeable } from "../../test_utils/deployFixtures";
import { OurkiveAccessControlUpgradeable } from "../../typechain";
import getUnauthorizedErrorMessage from "../../test_utils/access/getUnauthorizedErrorMessage";

describe("OurkiveAccessControlUpgradeable", () => {
  const beforeEachFixture = async () => {
    const [account, accountTwo, accountThree] = await ethers.getSigners();
    const { accessControl: ac } = await deployOurkiveAccessControlUpgradeable();

    const accessControl = ac as unknown as OurkiveAccessControlUpgradeable;

    // Role constants
    const adminRole: string = await accessControl.ADMIN_ROLE();
    const killswitchRole: string = await accessControl.KILLSWITCH_ROLE();
    const membershipControllerAuthorizedRole: string =
      await accessControl.MEMBERSHIP_CONTROLLER_AUTHORIZED_ROLE();
    const nftMarketplaceAuthorizedRole: string =
      await accessControl.NFT_MARKETPLACE_AUTHORIZED_ROLE();
    const artistRoyaltyStorageAuthorizedRole =
      await accessControl.ARTIST_ROYALTY_STORAGE_AUTHORIZED_ROLE();
    const artistRoyaltyControllerAuthorizedRole =
      await accessControl.ARTIST_ROYALTY_CONTROLLER_AUTHORIZED_ROLE();
    const nftDataStorageAuthorizedRole =
      await accessControl.NFT_DATA_STORAGE_AUTHORIZED_ROLE();
    const paymentStorageAuthorizedRole =
      await accessControl.PAYMENT_STORAGE_AUTHORIZED_ROLE();
    const paymentControllerAuthorizedRole =
      await accessControl.PAYMENT_CONTROLLER_AUTHORIZED_ROLE();
    const nftMarketplaceReentrancyAuthorizedRole =
      await accessControl.NFT_MARKETPLACE_REENTRANCY_GUARD_AUTHORIZED_ROLE();
    const collectorRoyaltyStorageAuthorizedRole =
      await accessControl.COLLECTOR_ROYALTY_STORAGE_AUTHORIZED_ROLE();
    const collectorRoyaltyControllerAuthorizedRole =
      await accessControl.COLLECTOR_ROYALTY_CONTROLLER_AUTHORIZED_ROLE();
    const nftAllowlistAuthorizedRole =
      await accessControl.NFT_ALLOWLIST_AUTHORIZED_ROLE();

    return {
      accessControl,
      adminRole,
      killswitchRole,
      membershipControllerAuthorizedRole,
      nftMarketplaceAuthorizedRole,
      account,
      accountTwo,
      accountThree,
      artistRoyaltyStorageAuthorizedRole,
      artistRoyaltyControllerAuthorizedRole,
      nftDataStorageAuthorizedRole,
      paymentStorageAuthorizedRole,
      paymentControllerAuthorizedRole,
      nftMarketplaceReentrancyAuthorizedRole,
      collectorRoyaltyStorageAuthorizedRole,
      collectorRoyaltyControllerAuthorizedRole,
      nftAllowlistAuthorizedRole,
    };
  };

  it("Should have roles setup properly from contract deployment", async () => {
    const {
      accessControl,
      adminRole,
      membershipControllerAuthorizedRole,
      nftMarketplaceAuthorizedRole,
      killswitchRole,
      account,
    } = await loadFixture(beforeEachFixture);

    const adminRoleCount = await accessControl.getRoleMemberCount(adminRole);

    const killswitchRoleCount =
      await accessControl.getRoleMemberCount(killswitchRole);

    const membershipControllerAuthorizedRoleCount =
      await accessControl.getRoleMemberCount(
        membershipControllerAuthorizedRole,
      );

    const nftMarketplaceAuthorizedRoleCount =
      await accessControl.getRoleMemberCount(nftMarketplaceAuthorizedRole);

    expect(adminRoleCount).to.equal(1);
    expect(membershipControllerAuthorizedRoleCount).to.equal(0);
    expect(nftMarketplaceAuthorizedRoleCount).to.equal(0);
    expect(killswitchRoleCount).to.equal(0);

    const adminRoleMember = await accessControl.getRoleMember(adminRole, 0);
    const killswitchRoleAdmin =
      await accessControl.getRoleAdmin(killswitchRole);
    const membershipControllerAuthorizedRoleAdmin =
      await accessControl.getRoleAdmin(membershipControllerAuthorizedRole);
    const nftMarketplaceAuthorizedRoleAdmin = await accessControl.getRoleAdmin(
      nftMarketplaceAuthorizedRole,
    );

    expect(adminRoleMember).to.equal(account.address);
    expect(killswitchRoleAdmin).to.equal(adminRole);
    expect(membershipControllerAuthorizedRoleAdmin).to.equal(adminRole);
    expect(nftMarketplaceAuthorizedRoleAdmin).to.equal(adminRole);
  });

  it("Should properly add an admin to the admin role", async () => {
    const { accessControl, adminRole, account, accountTwo, accountThree } =
      await loadFixture(beforeEachFixture);

    // Should have only one member (i.e. account)
    let adminRoleCount = await accessControl.getRoleMemberCount(adminRole);
    expect(adminRoleCount).to.equal(1);

    let adminRoleMember = await accessControl.getRoleMember(adminRole, 0);
    expect(adminRoleMember).to.equal(account.address);

    await accessControl.insertToAdminRole(accountTwo.address);

    // Check if account and accountTwo are both admins
    adminRoleCount = await accessControl.getRoleMemberCount(adminRole);
    expect(adminRoleCount).to.equal(2);

    adminRoleMember = await accessControl.getRoleMember(adminRole, 1);
    expect(adminRoleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized = await accessControl.isCallerOurkiveEOA(
      account.address,
    );
    expect(isCallerAuthorized).to.equal(true);
    isCallerAuthorized = await accessControl.isCallerOurkiveEOA(
      accountTwo.address,
    );
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerOurkiveEOA(accountThree.address),
    ).to.be.revertedWith(
      getUnauthorizedErrorMessage(accountThree.address, adminRole),
    );
  });

  it("Should properly add an address to membership controller authorized role", async () => {
    const {
      accessControl,
      membershipControllerAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    // Should have no member
    let membershipControllerAuthorizedRoleCount =
      await accessControl.getRoleMemberCount(
        membershipControllerAuthorizedRole,
      );
    expect(membershipControllerAuthorizedRoleCount).to.equal(0);
    await accessControl.insertToMembershipControllerAuthorizedRole(
      accountTwo.address,
    );

    // Check if accountTwo has a membership controller authorized role
    membershipControllerAuthorizedRoleCount =
      await accessControl.getRoleMemberCount(
        membershipControllerAuthorizedRole,
      );
    expect(membershipControllerAuthorizedRoleCount).to.equal(1);

    const membershipControllerAuthorizedRoleMember =
      await accessControl.getRoleMember(membershipControllerAuthorizedRole, 0);
    expect(membershipControllerAuthorizedRoleMember).to.equal(
      accountTwo.address,
    );

    // Check the appropriate getter
    let isCallerAuthorized =
      await accessControl.isCallerMembershipControllerAuthorized(
        accountTwo.address,
      );
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerMembershipControllerAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        membershipControllerAuthorizedRole,
      ),
    );
  });

  it("Should properly add an address to NFT marketplace authorized role", async () => {
    const { accessControl, nftMarketplaceAuthorizedRole, account, accountTwo } =
      await loadFixture(beforeEachFixture);

    let nftMarketplaceAuthorizedRoleCount =
      await accessControl.getRoleMemberCount(nftMarketplaceAuthorizedRole);
    expect(nftMarketplaceAuthorizedRoleCount).to.equal(0);

    await accessControl.insertToNFTMarketplaceAuthorizedRole(
      accountTwo.address,
    );

    // Check if accountTwo has an NFT marketplace authorized role
    nftMarketplaceAuthorizedRoleCount = await accessControl.getRoleMemberCount(
      nftMarketplaceAuthorizedRole,
    );
    expect(nftMarketplaceAuthorizedRoleCount).to.equal(1);

    const nftMarketplaceAuthorizedRoleMember =
      await accessControl.getRoleMember(nftMarketplaceAuthorizedRole, 0);
    expect(nftMarketplaceAuthorizedRoleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized =
      await accessControl.isCallerNFTMarketplaceAuthorized(accountTwo.address);
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerNFTMarketplaceAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        nftMarketplaceAuthorizedRole,
      ),
    );
  });

  it("Should properly add an address to killswitch role", async () => {
    const { accessControl, killswitchRole, account, accountTwo } =
      await loadFixture(beforeEachFixture);

    // Should have no member
    let killswitchRoleCount =
      await accessControl.getRoleMemberCount(killswitchRole);
    expect(killswitchRoleCount).to.equal(0);

    await accessControl.insertToKillswitchRole(accountTwo.address);

    // Check if accountTwo has a killswitch role
    killswitchRoleCount =
      await accessControl.getRoleMemberCount(killswitchRole);
    expect(killswitchRoleCount).to.equal(1);

    const killswitchRoleMember = await accessControl.getRoleMember(
      killswitchRole,
      0,
    );
    expect(killswitchRoleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized = await accessControl.isCallerKillswitch(
      accountTwo.address,
    );
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerKillswitch(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(account.address, killswitchRole),
    );
  });

  it("Should properly add an address to artist royalty storage role", async () => {
    const {
      accessControl,
      artistRoyaltyStorageAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    // Should have no member
    let artistRoyaltyStorageRoleCount = await accessControl.getRoleMemberCount(
      artistRoyaltyStorageAuthorizedRole,
    );
    expect(artistRoyaltyStorageRoleCount).to.equal(0);

    await accessControl.insertToArtistRoyaltyStorageAuthorizedRole(
      accountTwo.address,
    );

    // Check if accountTwo has a killswitch role
    artistRoyaltyStorageRoleCount = await accessControl.getRoleMemberCount(
      artistRoyaltyStorageAuthorizedRole,
    );
    expect(artistRoyaltyStorageRoleCount).to.equal(1);

    const artistRoyaltyStorageRoleMember = await accessControl.getRoleMember(
      artistRoyaltyStorageAuthorizedRole,
      0,
    );
    expect(artistRoyaltyStorageRoleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized =
      await accessControl.isCallerArtistRoyaltyStorageAuthorized(
        accountTwo.address,
      );
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerArtistRoyaltyStorageAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        artistRoyaltyStorageAuthorizedRole,
      ),
    );
  });

  it("Should properly add an address to artist royalty controller role", async () => {
    const {
      accessControl,
      artistRoyaltyControllerAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    // Should have no member
    let roleCount = await accessControl.getRoleMemberCount(
      artistRoyaltyControllerAuthorizedRole,
    );
    expect(roleCount).to.equal(0);

    await accessControl.insertToArtistRoyaltyControllerAuthorizedRole(
      accountTwo.address,
    );

    // Check if accountTwo has a killswitch role
    roleCount = await accessControl.getRoleMemberCount(
      artistRoyaltyControllerAuthorizedRole,
    );
    expect(roleCount).to.equal(1);

    const roleMember = await accessControl.getRoleMember(
      artistRoyaltyControllerAuthorizedRole,
      0,
    );
    expect(roleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized =
      await accessControl.isCallerArtistRoyaltyControllerAuthorized(
        accountTwo.address,
      );
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerArtistRoyaltyControllerAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        artistRoyaltyControllerAuthorizedRole,
      ),
    );
  });

  it("Should properly add an address to nft data storage role", async () => {
    const { accessControl, nftDataStorageAuthorizedRole, account, accountTwo } =
      await loadFixture(beforeEachFixture);

    // Should have no member
    let roleCount = await accessControl.getRoleMemberCount(
      nftDataStorageAuthorizedRole,
    );
    expect(roleCount).to.equal(0);

    await accessControl.insertToNFTDataStorageAuthorizedRole(
      accountTwo.address,
    );

    // Check if accountTwo has a killswitch role
    roleCount = await accessControl.getRoleMemberCount(
      nftDataStorageAuthorizedRole,
    );
    expect(roleCount).to.equal(1);

    const roleMember = await accessControl.getRoleMember(
      nftDataStorageAuthorizedRole,
      0,
    );
    expect(roleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized =
      await accessControl.isCallerNFTDataStorageAuthorized(accountTwo.address);
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerNFTDataStorageAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        nftDataStorageAuthorizedRole,
      ),
    );
  });

  it("Should properly add an address to payment storage role", async () => {
    const { accessControl, paymentStorageAuthorizedRole, account, accountTwo } =
      await loadFixture(beforeEachFixture);

    // Should have no member
    let roleCount = await accessControl.getRoleMemberCount(
      paymentStorageAuthorizedRole,
    );
    expect(roleCount).to.equal(0);

    await accessControl.insertToPaymentStorageAuthorizedRole(
      accountTwo.address,
    );

    // Check if accountTwo has a killswitch role
    roleCount = await accessControl.getRoleMemberCount(
      paymentStorageAuthorizedRole,
    );
    expect(roleCount).to.equal(1);

    const roleMember = await accessControl.getRoleMember(
      paymentStorageAuthorizedRole,
      0,
    );
    expect(roleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized =
      await accessControl.isCallerPaymentStorageAuthorized(accountTwo.address);
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerPaymentStorageAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        paymentStorageAuthorizedRole,
      ),
    );
  });

  it("Should properly add an address to payment controller role", async () => {
    const {
      accessControl,
      paymentControllerAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    // Should have no member
    let roleCount = await accessControl.getRoleMemberCount(
      paymentControllerAuthorizedRole,
    );
    expect(roleCount).to.equal(0);

    await accessControl.insertToPaymentControllerAuthorizedRole(
      accountTwo.address,
    );

    // Check if accountTwo has a killswitch role
    roleCount = await accessControl.getRoleMemberCount(
      paymentControllerAuthorizedRole,
    );
    expect(roleCount).to.equal(1);

    const roleMember = await accessControl.getRoleMember(
      paymentControllerAuthorizedRole,
      0,
    );
    expect(roleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized =
      await accessControl.isCallerPaymentControllerAuthorized(
        accountTwo.address,
      );
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerPaymentControllerAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        paymentControllerAuthorizedRole,
      ),
    );
  });

  it("Should properly add an address to nft marketplace reentrancy guard role", async () => {
    const {
      accessControl,
      nftMarketplaceReentrancyAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    // Should have no member
    let roleCount = await accessControl.getRoleMemberCount(
      nftMarketplaceReentrancyAuthorizedRole,
    );
    expect(roleCount).to.equal(0);

    await accessControl.insertToNFTMarketplaceReentrancyGuardAuthorizedRole(
      accountTwo.address,
    );

    // Check if accountTwo has a killswitch role
    roleCount = await accessControl.getRoleMemberCount(
      nftMarketplaceReentrancyAuthorizedRole,
    );
    expect(roleCount).to.equal(1);

    const roleMember = await accessControl.getRoleMember(
      nftMarketplaceReentrancyAuthorizedRole,
      0,
    );
    expect(roleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized =
      await accessControl.isCallerNFTMarketplaceReentrancyGuardAuthorized(
        accountTwo.address,
      );
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerNFTMarketplaceReentrancyGuardAuthorized(
        account.address,
      ),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        nftMarketplaceReentrancyAuthorizedRole,
      ),
    );
  });

  it("Should properly add an address to collector royalty storage role", async () => {
    const {
      accessControl,
      collectorRoyaltyStorageAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    // Should have no member
    let roleCount = await accessControl.getRoleMemberCount(
      collectorRoyaltyStorageAuthorizedRole,
    );
    expect(roleCount).to.equal(0);

    await accessControl.insertToCollectorRoyaltyStorageAuthorizedRole(
      accountTwo.address,
    );

    // Check if accountTwo has a killswitch role
    roleCount = await accessControl.getRoleMemberCount(
      collectorRoyaltyStorageAuthorizedRole,
    );
    expect(roleCount).to.equal(1);

    const roleMember = await accessControl.getRoleMember(
      collectorRoyaltyStorageAuthorizedRole,
      0,
    );
    expect(roleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized =
      await accessControl.isCallerCollectorRoyaltyStorageAuthorized(
        accountTwo.address,
      );
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerCollectorRoyaltyStorageAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        collectorRoyaltyStorageAuthorizedRole,
      ),
    );
  });

  it("Should properly add an address to collector royalty controller role", async () => {
    const {
      accessControl,
      collectorRoyaltyControllerAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    // Should have no member
    let roleCount = await accessControl.getRoleMemberCount(
      collectorRoyaltyControllerAuthorizedRole,
    );
    expect(roleCount).to.equal(0);

    await accessControl.insertToCollectorRoyaltyControllerAuthorizedRole(
      accountTwo.address,
    );

    // Check if accountTwo has a killswitch role
    roleCount = await accessControl.getRoleMemberCount(
      collectorRoyaltyControllerAuthorizedRole,
    );
    expect(roleCount).to.equal(1);

    const roleMember = await accessControl.getRoleMember(
      collectorRoyaltyControllerAuthorizedRole,
      0,
    );
    expect(roleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized =
      await accessControl.isCallerCollectorRoyaltyControllerAuthorized(
        accountTwo.address,
      );
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerCollectorRoyaltyControllerAuthorized(
        account.address,
      ),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        collectorRoyaltyControllerAuthorizedRole,
      ),
    );
  });

  it("Should properly add an address to artist allowlist role", async () => {
    const { accessControl, nftAllowlistAuthorizedRole, account, accountTwo } =
      await loadFixture(beforeEachFixture);

    // Should have no member
    let roleCount = await accessControl.getRoleMemberCount(
      nftAllowlistAuthorizedRole,
    );
    expect(roleCount).to.equal(0);

    await accessControl.insertToNFTAllowlistAuthorizedRole(accountTwo.address);

    // Check if accountTwo has a killswitch role
    roleCount = await accessControl.getRoleMemberCount(
      nftAllowlistAuthorizedRole,
    );
    expect(roleCount).to.equal(1);

    const roleMember = await accessControl.getRoleMember(
      nftAllowlistAuthorizedRole,
      0,
    );
    expect(roleMember).to.equal(accountTwo.address);

    // Check the appropriate getter
    let isCallerAuthorized = await accessControl.isCallerNFTAllowlistAuthorized(
      accountTwo.address,
    );
    expect(isCallerAuthorized).to.equal(true);
    await expect(
      accessControl.isCallerNFTAllowlistAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(account.address, nftAllowlistAuthorizedRole),
    );
  });

  it("Should add an admin and renounce previous admin to the admin role", async () => {
    const { accessControl, adminRole, account, accountTwo } =
      await loadFixture(beforeEachFixture);

    await accessControl.insertToAdminRole(accountTwo.address);

    // Check if account is an admin
    let isCallerAuthorized = await accessControl.isCallerOurkiveEOA(
      accountTwo.address,
    );
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(adminRole, account.address);

    await expect(
      accessControl.isCallerOurkiveEOA(account.address),
    ).to.revertedWith(getUnauthorizedErrorMessage(account.address, adminRole));
  });

  it("Should add an address and revoke previous address from the membership controller authorized role", async () => {
    const {
      accessControl,
      membershipControllerAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    await accessControl.insertToMembershipControllerAuthorizedRole(
      account.address,
    );

    // Check if account is an admin
    let isCallerAuthorized =
      await accessControl.isCallerMembershipControllerAuthorized(
        account.address,
      );
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      membershipControllerAuthorizedRole,
      account.address,
    );
    await expect(
      accessControl.isCallerMembershipControllerAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        membershipControllerAuthorizedRole,
      ),
    );
  });

  it("Should add an address and revoke previous address from the NFT marketplace authorized role", async () => {
    const { accessControl, nftMarketplaceAuthorizedRole, account, accountTwo } =
      await loadFixture(beforeEachFixture);

    await accessControl.insertToNFTMarketplaceAuthorizedRole(account.address);

    // Check if account is an admin
    let isCallerAuthorized =
      await accessControl.isCallerNFTMarketplaceAuthorized(account.address);
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      nftMarketplaceAuthorizedRole,
      account.address,
    );

    await expect(
      accessControl.isCallerNFTMarketplaceAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        nftMarketplaceAuthorizedRole,
      ),
    );
  });

  it("Should add an address and revoke previous address from the killswitch role", async () => {
    const { accessControl, killswitchRole, account } =
      await loadFixture(beforeEachFixture);

    await accessControl.insertToKillswitchRole(account.address);

    // Check if account is an admin
    let isCallerAuthorized = await accessControl.isCallerKillswitch(
      account.address,
    );
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(killswitchRole, account.address);

    await expect(
      accessControl.isCallerKillswitch(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(account.address, killswitchRole),
    );
  });

  it("Should add an address and revoke previous address from the artist royalty storage authorized role", async () => {
    const {
      accessControl,
      artistRoyaltyStorageAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    await accessControl.insertToArtistRoyaltyStorageAuthorizedRole(
      account.address,
    );

    // Check if account is an admin
    let isCallerAuthorized =
      await accessControl.isCallerArtistRoyaltyStorageAuthorized(
        account.address,
      );
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      artistRoyaltyStorageAuthorizedRole,
      account.address,
    );

    await expect(
      accessControl.isCallerArtistRoyaltyStorageAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        artistRoyaltyStorageAuthorizedRole,
      ),
    );
  });

  it("Should add an address and revoke previous address from the artist royalty controller authorized role", async () => {
    const {
      accessControl,
      artistRoyaltyControllerAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    await accessControl.insertToArtistRoyaltyControllerAuthorizedRole(
      account.address,
    );

    // Check if account is an admin
    let isCallerAuthorized =
      await accessControl.isCallerArtistRoyaltyControllerAuthorized(
        account.address,
      );
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      artistRoyaltyControllerAuthorizedRole,
      account.address,
    );

    await expect(
      accessControl.isCallerArtistRoyaltyControllerAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        artistRoyaltyControllerAuthorizedRole,
      ),
    );
  });

  it("Should add an address and revoke previous address from the nft data storage authorized role", async () => {
    const { accessControl, nftDataStorageAuthorizedRole, account, accountTwo } =
      await loadFixture(beforeEachFixture);

    await accessControl.insertToNFTDataStorageAuthorizedRole(account.address);

    // Check if account is an admin
    let isCallerAuthorized =
      await accessControl.isCallerNFTDataStorageAuthorized(account.address);
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      nftDataStorageAuthorizedRole,
      account.address,
    );

    await expect(
      accessControl.isCallerNFTDataStorageAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        nftDataStorageAuthorizedRole,
      ),
    );
  });

  it("Should add an address and revoke previous address from the payment storage authorized role", async () => {
    const { accessControl, paymentStorageAuthorizedRole, account, accountTwo } =
      await loadFixture(beforeEachFixture);

    await accessControl.insertToPaymentStorageAuthorizedRole(account.address);

    // Check if account is an admin
    let isCallerAuthorized =
      await accessControl.isCallerPaymentStorageAuthorized(account.address);
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      paymentStorageAuthorizedRole,
      account.address,
    );

    await expect(
      accessControl.isCallerPaymentStorageAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        paymentStorageAuthorizedRole,
      ),
    );
  });

  it("Should add an address and revoke previous address from the payment controller authorized role", async () => {
    const {
      accessControl,
      paymentControllerAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    await accessControl.insertToPaymentControllerAuthorizedRole(
      account.address,
    );

    // Check if account is an admin
    let isCallerAuthorized =
      await accessControl.isCallerPaymentControllerAuthorized(account.address);
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      paymentControllerAuthorizedRole,
      account.address,
    );

    await expect(
      accessControl.isCallerPaymentControllerAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        paymentControllerAuthorizedRole,
      ),
    );
  });

  it("Should add an address and revoke previous address from the nft marketplace reentrancy guard authorized role", async () => {
    const {
      accessControl,
      nftMarketplaceReentrancyAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    await accessControl.insertToNFTMarketplaceReentrancyGuardAuthorizedRole(
      account.address,
    );

    // Check if account is an admin
    let isCallerAuthorized =
      await accessControl.isCallerNFTMarketplaceReentrancyGuardAuthorized(
        account.address,
      );
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      nftMarketplaceReentrancyAuthorizedRole,
      account.address,
    );

    await expect(
      accessControl.isCallerNFTMarketplaceReentrancyGuardAuthorized(
        account.address,
      ),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        nftMarketplaceReentrancyAuthorizedRole,
      ),
    );
  });

  it("Should add an address and revoke previous address from the collector royalty storage authorized role", async () => {
    const {
      accessControl,
      collectorRoyaltyStorageAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    await accessControl.insertToCollectorRoyaltyStorageAuthorizedRole(
      account.address,
    );

    // Check if account is an admin
    let isCallerAuthorized =
      await accessControl.isCallerCollectorRoyaltyStorageAuthorized(
        account.address,
      );
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      collectorRoyaltyStorageAuthorizedRole,
      account.address,
    );

    await expect(
      accessControl.isCallerCollectorRoyaltyStorageAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        collectorRoyaltyStorageAuthorizedRole,
      ),
    );
  });

  it("Should add an address and revoke previous address from the collector royalty controller authorized role", async () => {
    const {
      accessControl,
      collectorRoyaltyControllerAuthorizedRole,
      account,
      accountTwo,
    } = await loadFixture(beforeEachFixture);

    await accessControl.insertToCollectorRoyaltyControllerAuthorizedRole(
      account.address,
    );

    // Check if account is an admin
    let isCallerAuthorized =
      await accessControl.isCallerCollectorRoyaltyControllerAuthorized(
        account.address,
      );
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      collectorRoyaltyControllerAuthorizedRole,
      account.address,
    );

    await expect(
      accessControl.isCallerCollectorRoyaltyControllerAuthorized(
        account.address,
      ),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(
        account.address,
        collectorRoyaltyControllerAuthorizedRole,
      ),
    );
  });

  it("Should add an address and revoke previous address from the artist allowlist authorized role", async () => {
    const { accessControl, nftAllowlistAuthorizedRole, account } =
      await loadFixture(beforeEachFixture);

    await accessControl.insertToNFTAllowlistAuthorizedRole(account.address);

    // Check if account is an admin
    let isCallerAuthorized = await accessControl.isCallerNFTAllowlistAuthorized(
      account.address,
    );
    expect(isCallerAuthorized).to.equal(true);

    await accessControl.renounceRole(
      nftAllowlistAuthorizedRole,
      account.address,
    );

    await expect(
      accessControl.isCallerNFTAllowlistAuthorized(account.address),
    ).to.revertedWith(
      getUnauthorizedErrorMessage(account.address, nftAllowlistAuthorizedRole),
    );
  });
});
