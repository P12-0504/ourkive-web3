// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./OurkiveNftMarketplaceAllowlist.sol";

contract MaliciousContract {
    address private marketplaceAllowlistAddress;

    constructor(address _marketplaceAllowlistAddress) {
        marketplaceAllowlistAddress = _marketplaceAllowlistAddress;
    }

    // Function to attempt reentrancy attack
    function triggerReentrancyAttack() public {
        OurkiveNftMarketplaceAllowlist allowlistContract = OurkiveNftMarketplaceAllowlist(marketplaceAllowlistAddress);
        allowlistContract.removeFromAllowlist(msg.sender);
    }

    // Function to attempt self-destruct attack
    function triggerSelfDestruct() public {
        address payable addr = payable(address(marketplaceAllowlistAddress));
        selfdestruct(addr);
    }
}
