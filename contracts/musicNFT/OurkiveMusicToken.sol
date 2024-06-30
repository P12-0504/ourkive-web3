// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "../OurkiveNftMarketplaceAllowlist.sol";
import "./IOurkiveMusicToken.sol";

contract OurkiveMusicToken is
    ERC721,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable,
    ERC2981,
    IOurkiveMusicToken
{
    bool private isMinted;
    address private allowlistAddress;
    address private artistAddress;

    constructor(
        string memory name,
        string memory symbol,
        address receiver,
        uint96 feeNumerator,
        address _allowlistAddress
    ) ERC721(name, symbol) {
        _setDefaultRoyalty(receiver, feeNumerator);
        allowlistAddress = _allowlistAddress;
    }

    modifier checkAllowlist(address marketplaceAddress) {
        bool isAllowlisted = OurkiveNftMarketplaceAllowlist(allowlistAddress)
            .isAllowlisted(marketplaceAddress);
        require(isAllowlisted, "Invalid marketplace, not allowed");
        _;
    }

    modifier checkArtistAddress(address _artistAddress) {
        require(artistAddress != address(0), "Artist address is not set");
        require(_artistAddress == artistAddress, "Only artist can mint");
        _;
    }

    function getArtistAddress() public view returns (address) {
        return artistAddress;
    }

    function setArtistAddress(address _artistAddress) external onlyOwner {
        require(_artistAddress != address(0), "Artist address cannot be zero");
        artistAddress = _artistAddress;
    }

    function safeMintAndApprovalForAll(
        address to,
        uint256 tokenId,
        string memory uri,
        address marketplaceAddress
    ) public checkArtistAddress(to) {
        require(!isMinted, "Already Minted NFT");
        require(tokenId == 0, "Token ID must be zero");

        setApprovalForAll(marketplaceAddress, true);
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        isMinted = true;
    }

    function safeMintByOurkive(
        address to,
        uint256 tokenId,
        string memory uri
    ) public onlyOwner {
        require(tokenId == 0, "Token ID must be zero");

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function burn(uint256 tokenId) public override(ERC721Burnable) {
        require(
            ownerOf(tokenId) == _msgSender(),
            "Only the token owner can burn"
        );
        super.burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function approve(
        address to,
        uint256 tokenId
    ) public virtual override(ERC721, IERC721) checkAllowlist(to) {
        super.approve(to, tokenId);
    }

    function setApprovalForAll(
        address operator,
        bool approved
    ) public virtual override(ERC721, IERC721) checkAllowlist(operator) {
        super.setApprovalForAll(operator, approved);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
