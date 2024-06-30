// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract OurkiveMusicTokenV3 is
  ERC721,
  ERC721URIStorage,
  ERC721Burnable,
  Ownable,
  ERC2981
{
  address public artist;

  constructor(
    string memory name,
    string memory symbol,
    address artistAddress,
    uint16 royaltyBps
  ) ERC721(name, symbol) {
    artist = artistAddress;
    _setDefaultRoyalty(artistAddress, royaltyBps);
  }

  modifier isValidArtist(address artistAddress) {
    require(artist == artistAddress, "Only artist can mint");
    _;
  }

  modifier isTokenIdZero(uint256 tokenId) {
    require(tokenId == 0, "Token ID must be zero");
    _;
  }

  function setArtistAddress(address artistAddress) external onlyOwner {
    require(artistAddress != address(0), "Artist address cannot be zero");
    artist = artistAddress;
  }

  function setRoyalty(
    uint256 tokenId,
    address royaltyRecipient,
    uint16 royaltyBps
  ) external onlyOwner {
    require(
      !_exists(tokenId),
      "Cannot update artist royalty once the NFT is minted"
    );
    _setTokenRoyalty(tokenId, royaltyRecipient, royaltyBps);
  }

  function safeMintAndApprovalForAll(
    address to,
    uint256 tokenId,
    string memory uri,
    address marketplaceAddress
  ) external isValidArtist(to) isTokenIdZero(tokenId) {
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, uri);
    setApprovalForAll(marketplaceAddress, true);
  }

  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

  function burn(uint256 tokenId) public override(ERC721Burnable) {
    require(ownerOf(tokenId) == msg.sender, "Only the token owner can burn");
    super.burn(tokenId);
  }

  function exists(uint256 tokenId) external view returns (bool) {
    return super._exists(tokenId);
  }

  function tokenURI(
    uint256 tokenId
  ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
    return super.tokenURI(tokenId);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721, ERC721URIStorage, ERC2981) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
