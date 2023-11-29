// SPDX-License-Identifier: MIT

// EMC Foundation
// EMC (EdgeMatrix Computing) is a decentralized computing network in the AI era. 
// The initial total supply of EMC tokens is 1 billion, and the total supply will be reduced through a double deflation model, which involves token burning.

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract EMCToken is ERC20Burnable {
    constructor(uint256 _initialSupply) ERC20("EdgeMatrix Computing network", "EMC") {
        _mint(msg.sender, _initialSupply * 10 ** decimals());
    }
}
