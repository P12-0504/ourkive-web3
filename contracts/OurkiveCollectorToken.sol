// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract OurkiveCollectorToken is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => uint8) private _transferCount;

    constructor() ERC721("The First Club by Ourkive", "KIVE") {}

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();

        // Limit to 100 tokens
        require(tokenId <= 99, "Cannot mint more than 100 tokens");

        // Limit to one token per address
        require(balanceOf(to) == 0, "Cannot mint more than 1 token per address");

        // Mint token
        _safeMint(to, tokenId);
        
        // Set token URI
        _setTokenURI(tokenId, uri);

        // Increment token id
        _tokenIdCounter.increment();
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        require(_transferCount[tokenId] < 2, "Cannot transfer this token");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _afterTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721)
    {
        super._afterTokenTransfer(from, to, tokenId, batchSize);
        _transferCount[tokenId] += 1;
    }

    function approve(address to, uint256 tokenId) public virtual override(ERC721, IERC721) {
        revert("Cannot approve");
    }

    function setApprovalForAll(address operator, bool approved) public virtual override(ERC721, IERC721) {
        revert("Cannot approve");
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}