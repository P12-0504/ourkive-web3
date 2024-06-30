// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@limitbreak/creator-token-contracts/contracts/erc721c/ERC721C.sol";
import "@limitbreak/creator-token-contracts/contracts/token/erc721/MetadataURI.sol";
import "@limitbreak/creator-token-contracts/contracts/access/OwnableBasic.sol";
import "@limitbreak/creator-token-contracts/contracts/programmable-royalties/BasicRoyalties.sol";
import "./IOurkiveNftMarketplaceAllowlist.sol";

contract EnforcedToken is ERC721C, MetadataURI, BasicRoyalties, OwnableBasic {
    uint private price;
    bool private isMinted;
    uint private fee;
    address private feeReceiver;
    address private allowlistAddress;

    constructor(
        string memory name,
        string memory symbol,
        string memory metadataUri,
        address receiver,
        uint96 feeNumerator,
        address _allowlistAddress
    ) ERC721OpenZeppelin(name, symbol) BasicRoyalties(receiver, feeNumerator) {
        setBaseURI(metadataUri);
        allowlistAddress = _allowlistAddress;
    }

    modifier checkAllowlist(address marketplaceAddress) {
      bool isAllowlisted = IOurkiveNftMarketplaceAllowlist(allowlistAddress).isAllowlisted(marketplaceAddress);
      require(isAllowlisted, "Invalid marketplace, not allowed");
      _;
    }

    function mint(address to) external payable onlyOwner {
      require(!isMinted, "Already Minted NFT.");

      // Mint NFT
      _safeMint(to, 0);
      isMinted = true;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721C, ERC2981) returns (bool) {
      return super.supportsInterface(interfaceId);
    }

    function approve(address to, uint256 tokenId) public virtual override checkAllowlist(to) {
        super.approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public virtual override checkAllowlist(operator) {
        super.setApprovalForAll(operator, approved);
    }
}