// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// OpenZeppelin
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract OurkiveCollectorTokenV2Upgradeable is
  ERC721URIStorageUpgradeable,
  ERC721EnumerableUpgradeable,
  OwnableUpgradeable
{
  mapping(uint256 => uint8) private _transferCount;
  uint256 public tokenLimit;
  address public ourkive;

  function initialize() public initializer {
    __ERC721_init("The First Club by Ourkive", "KIVE");
    __ERC721URIStorage_init();
    __ERC721Enumerable_init();
    __Ownable_init();
    ourkive = msg.sender;
  }

  modifier isCallerOurkive() {
    require(msg.sender == ourkive, "Only Ourkive can call this method");
    _;
  }

  function setOurkive(address _ourkive) external isCallerOurkive {
    ourkive = _ourkive;
  }

  function setTokenLimit(uint256 newTokenLimit) external isCallerOurkive {
    tokenLimit = newTokenLimit;
  }

  function _mint(address to, string memory uri, uint256 tokenId) private {
    require(tokenId < tokenLimit, "Cannot mint more than the token limit");

    _safeMint(to, tokenId);

    _setTokenURI(tokenId, uri);
  }

  function sendTokenToOurkivian(
    address to,
    string memory uri
  ) external isCallerOurkive {
    uint256 tokenId = totalSupply();
    _mint(ourkive, uri, tokenId);
    safeTransferFrom(ourkive, to, tokenId);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId,
    uint256 batchSize
  ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
    require(_transferCount[tokenId] < 2, "Cannot transfer this token");
    if (to != ourkive && to != address(0)) {
      require(
        balanceOf(to) == 0,
        "Cannot hold more than one token per address"
      );
    }
    super._beforeTokenTransfer(from, to, tokenId, batchSize);
  }

  function _afterTokenTransfer(
    address from,
    address to,
    uint256 tokenId,
    uint256 batchSize
  ) internal override(ERC721Upgradeable) {
    super._afterTokenTransfer(from, to, tokenId, batchSize);
    _transferCount[tokenId] += 1;
  }

  function approve(
    address to,
    uint256 tokenId
  ) public override(ERC721Upgradeable, IERC721Upgradeable) {
    revert("Cannot approve");
  }

  function setApprovalForAll(
    address operator,
    bool approved
  ) public override(ERC721Upgradeable, IERC721Upgradeable) {
    revert("Cannot approve");
  }

  function _burn(
    uint256 tokenId
  ) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
    super._burn(tokenId);
    delete _transferCount[tokenId];
  }

  function tokenURI(
    uint256 tokenId
  )
    public
    view
    override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    override(ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
