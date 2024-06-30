// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./IOurkiveMusicToken.sol";

contract OurkiveMusicTokenV2 is
    ERC721,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable,
    IOurkiveMusicToken
{
    address private _artist;

    event ArtistSet(address indexed artist);

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}

    modifier checkArtistAddress(address artist) {
        require(artist != address(0), "Artist address is not set");
        require(_artist == artist, "Only artist can mint");
        _;
    }

    function getArtistAddress() public view returns (address) {
        return _artist;
    }

    function setArtistAddress(address artist) external onlyOwner {
        require(artist != address(0), "Artist address cannot be zero");
        _artist = artist;

        emit ArtistSet(artist);
    }

    function safeMintAndApprovalForAll(
        address to,
        uint256 tokenId,
        string memory uri,
        address marketplaceAddress
    ) public checkArtistAddress(to) {
        require(tokenId == 0, "Token ID must be zero");

        setApprovalForAll(marketplaceAddress, true);
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
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
            ownerOf(tokenId) == msg.sender,
            "Only the token owner can burn"
        );
        super.burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return super._exists(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
