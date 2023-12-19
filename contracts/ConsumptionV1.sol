// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ConsumptionV1
contract ConsumptionV1 {
    /**
     * @notice Token contract address
     */
    ERC20Burnable public immutable consumptionToken;


    using SafeERC20 for IERC20;

    event ConsumptionBurned(address account, uint256 amount, string memo);

    constructor(address _consumptionToken) {
        consumptionToken = ERC20Burnable(_consumptionToken);
    }

    function burn(uint256 amount, string memory memo) external {
        require(amount > 0, "ConsumptionV1: amount Error");

        require(
            consumptionToken.allowance(msg.sender, address(this)) >= amount,
            "ConsumptionV1: checkTokenAllowance Error"
        );

        // burn tokens
        consumptionToken.burnFrom(msg.sender, amount);

        emit ConsumptionBurned(msg.sender, amount, memo);
    }
}
