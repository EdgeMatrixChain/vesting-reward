// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/// @title ConsumptionV1
contract ConsumptionV1 {
    /**
     * @notice Token contract address
     */
    ERC20Burnable public token;

    event ConsumptionBurned(address account, uint256 amount, string memo);

    constructor(ERC20Burnable _token) {
        token = _token;
    }

    function consume(uint256 amount, string memory memo) external {
        require(amount > 0, "amount Error");

        require(
            token.allowance(msg.sender, address(this)) >= amount,
            "checkTokenAllowance Error"
        );

        // burn tokens
        token.burnFrom(msg.sender, amount);

        emit ConsumptionBurned(msg.sender, amount, memo);
    }
}
